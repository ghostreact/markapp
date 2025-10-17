import mongoConnect from '@/lib/mongodb';
import { Attendance, Student, Teacher } from '@/Models';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

/**
 * GET /api/teachers/:teacherId/attendance
 * Query:
 *  - date=YYYY-MM-DD   (ระบุวันเดียว)
 *  - from=YYYY-MM-DD   (ช่วงเริ่ม)
 *  - to=YYYY-MM-DD     (ช่วงสิ้นสุด)
 *  - studentId=...     (กรองนักเรียนรายคน)
 *  - status=Present|Late|Leave|Absent
 *  - page=1&limit=20&sort=-date
 */
export async function GET(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;

    try {
        // 0) validate teacher
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');       // วันเดียว
        const fromStr = searchParams.get('from');       // ช่วงเริ่ม
        const toStr = searchParams.get('to');           // ช่วงจบ
        const studentId = searchParams.get('studentId');
        const status = searchParams.get('status');      // Present|Late|Leave|Absent
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
        const sort = searchParams.get('sort') || '-date';

        // 1) จำกัดเฉพาะนักเรียนใน department ของครู (ตาม schema ปัจจุบัน)
        if (!teacher.departmentId) {
            return NextResponse.json({ count: 0, data: [], meta: { page, limit, total: 0, totalPages: 1 } }, { status: 200 });
        }
        const studentIds = await Student.find({ departmentId: teacher.departmentId }).select('_id').lean();
        const allowedIds = new Set(studentIds.map(s => String(s._id)));
        if (allowedIds.size === 0) {
            return NextResponse.json({ count: 0, data: [], meta: { page, limit, total: 0, totalPages: 1 } }, { status: 200 });
        }

        // 2) สร้าง filter
        const filter = { studentId: { $in: Array.from(allowedIds) } };

        if (studentId) {
            if (!isValidObjectId(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
            if (!allowedIds.has(String(studentId))) {
                // ไม่ใช่นักเรียนในแผนกนี้
                return NextResponse.json({ count: 0, data: [], meta: { page, limit, total: 0, totalPages: 1 } }, { status: 200 });
            }
            filter.studentId = studentId;
        }

        if (status) {
            filter.status = status; // ตรวจค่าจริงๆ ได้ถ้าต้องการเข้มขึ้น
        }

        // 3) ช่วงเวลา
        if (dateStr) {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return NextResponse.json({ message: 'Invalid date' }, { status: 400 });
            // match เฉพาะวันนั้น (ตั้งเป็น 00:00-23:59)
            const start = new Date(d); start.setHours(0, 0, 0, 0);
            const end = new Date(d); end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        } else if (fromStr || toStr) {
            filter.date = {};
            if (fromStr) {
                const from = new Date(fromStr);
                if (isNaN(from.getTime())) return NextResponse.json({ message: 'Invalid from' }, { status: 400 });
                filter.date.$gte = from;
            }
            if (toStr) {
                const to = new Date(toStr);
                if (isNaN(to.getTime())) return NextResponse.json({ message: 'Invalid to' }, { status: 400 });
                filter.date.$lte = to;
            }
        }

        // 4) นับ + ดึงข้อมูล
        const total = await Attendance.countDocuments(filter);
        const data = await Attendance.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'studentId', select: 'studentCode name branchId departmentId', populate: [
                    { path: 'branchId', select: 'name' },
                    { path: 'departmentId', select: 'name' },
                ]
            })
            .lean();

        const meta = {
            page, limit, total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasNext: page * limit < total,
            hasPrev: page > 1,
            sort,
        };

        return NextResponse.json({ count: data.length, data, meta }, { status: 200 });
    } catch (err) {
        console.error('GET /teachers/:teacherId/attendance error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/teachers/:teacherId/attendance
 * Body:
 *  {
 *    "date": "2025-10-16",
 *    "items": [
 *      { "studentId": "...", "status": "Present" },
 *      { "studentId": "...", "status": "Late" }
 *    ]
 *  }
 *  → bulk upsert ตาม unique (studentId, date)
 */
export async function POST(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;

    try {
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });

        const { date, items } = await request.json();
        if (!date || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'date and items[] are required' }, { status: 400 });
        }

        const theDate = new Date(date);
        if (isNaN(theDate.getTime())) return NextResponse.json({ message: 'Invalid date' }, { status: 400 });

        // หา student ที่อยู่ใน department ของครูเท่านั้น
        const allowedStu = await Student.find({ departmentId: teacher.departmentId }).select('_id').lean();
        const allowed = new Set(allowedStu.map(s => String(s._id)));

        // ตรวจ studentId ที่ส่งมา
        const invalid = [];
        for (const it of items) {
            if (!isValidObjectId(it.studentId) || !allowed.has(String(it.studentId))) {
                invalid.push(it.studentId);
            }
        }
        if (invalid.length) {
            return NextResponse.json({ message: 'Some studentIds are invalid or not in this teacher department', invalid }, { status: 400 });
        }

        // bulk upsert
        const ops = items.map(({ studentId, status }) => ({
            updateOne: {
                filter: { studentId, date: theDate },
                update: { $set: { studentId, date: theDate, status } },
                upsert: true,
            }
        }));

        const result = await Attendance.bulkWrite(ops, { ordered: false });

        return NextResponse.json({
            ok: true,
            upserted: result?.upsertedCount ?? 0,
            modified: result?.modifiedCount ?? 0,
            matched: result?.matchedCount ?? 0
        }, { status: 200 });
    } catch (err) {
        console.error('POST /teachers/:teacherId/attendance error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PUT /api/teachers/:teacherId/attendance
 * Body:
 *  { "studentId": "...", "date": "2025-10-16", "status": "Absent" }
 *  → อัปเดต 1 รายการตาม unique key (studentId+date)
 */
export async function PUT(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;

    try {
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });

        const { studentId, date, status } = await request.json();
        if (!studentId || !date || !status) {
            return NextResponse.json({ message: 'studentId, date, status are required' }, { status: 400 });
        }
        if (!isValidObjectId(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });

        const theDate = new Date(date);
        if (isNaN(theDate.getTime())) return NextResponse.json({ message: 'Invalid date' }, { status: 400 });

        // ยืนยันว่า student อยู่ใน department ของครู
        const belongs = await Student.exists({ _id: studentId, departmentId: teacher.departmentId });
        if (!belongs) return NextResponse.json({ message: 'Student not in this teacher department' }, { status: 400 });

        const updated = await Attendance.findOneAndUpdate(
            { studentId, date: theDate },
            { $set: { status } },
            { new: true }
        )
            .populate({ path: 'studentId', select: 'studentCode name' })
            .lean();

        if (!updated) {
            return NextResponse.json({ message: 'Attendance not found' }, { status: 404 });
        }

        return NextResponse.json({ attendance: updated }, { status: 200 });
    } catch (err) {
        console.error('PUT /teachers/:teacherId/attendance error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/teachers/:teacherId/attendance
 * Body:
 *  { "studentId": "...", "date": "2025-10-16" }
 *  → ลบ 1 รายการตาม unique key (studentId+date)
 */
export async function DELETE(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;

    try {
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });

        const { studentId, date } = await request.json();
        if (!studentId || !date) {
            return NextResponse.json({ message: 'studentId and date are required' }, { status: 400 });
        }
        if (!isValidObjectId(studentId)) return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });

        const theDate = new Date(date);
        if (isNaN(theDate.getTime())) return NextResponse.json({ message: 'Invalid date' }, { status: 400 });

        // ยืนยันว่า student อยู่ใน department ของครู
        const belongs = await Student.exists({ _id: studentId, departmentId: teacher.departmentId });
        if (!belongs) return NextResponse.json({ message: 'Student not in this teacher department' }, { status: 400 });

        const deleted = await Attendance.findOneAndDelete({ studentId, date: theDate });
        if (!deleted) {
            return NextResponse.json({ message: 'Attendance not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Attendance deleted' }, { status: 200 });
    } catch (err) {
        console.error('DELETE /teachers/:teacherId/attendance error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
