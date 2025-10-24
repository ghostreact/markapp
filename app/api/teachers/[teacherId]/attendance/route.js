import mongoConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { Attendance, Student, Teacher } from '@/Models';
import { STUDENT_LEVEL_VALUES, getStudentLevelLabel } from '@/lib/constants/student-levels';

function normalizeObjectId(value) {
    if (!value) return null;
    try {
        return isValidObjectId(value) ? value : null;
    } catch {
        return null;
    }
}

async function resolveTeacher(teacherId, fields = 'departmentId level userId') {
    if (!normalizeObjectId(teacherId)) return null;

    let teacher = await Teacher.findById(teacherId).select(fields).lean();
    if (teacher) return teacher;

    return Teacher.findOne({ userId: teacherId }).select(fields).lean();
}

function parseDateOnly(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function normalizeAttendanceDate(date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

function normalizeRefDocument(ref) {
    if (!ref) return null;
    if (typeof ref === 'string') {
        return { _id: ref };
    }

    const id = ref._id ?? ref.id ?? null;
    const result = {};

    if (id) {
        result._id = String(id);
    }

    if (ref.name) {
        result.name = ref.name;
    }

    return Object.keys(result).length ? result : null;
}

function normalizeStudentDocument(doc) {
    if (!doc) return null;

    if (typeof doc === 'string') {
        return { _id: doc };
    }

    const normalized = {};
    const id = doc._id ?? doc.id ?? null;
    if (id) normalized._id = String(id);

    if (doc.studentCode) normalized.studentCode = doc.studentCode;
    if (doc.name) normalized.name = doc.name;
    if (doc.level) {
        normalized.level = doc.level;
        normalized.levelLabel = getStudentLevelLabel(doc.level);
    }

    const branch = normalizeRefDocument(doc.branchId);
    if (branch) normalized.branchId = branch;

    const department = normalizeRefDocument(doc.departmentId);
    if (department) normalized.departmentId = department;

    return Object.keys(normalized).length ? normalized : null;
}

function normalizeAttendanceRecord(record) {
    const student = normalizeStudentDocument(record.studentId);

    const dateValue =
        record.date instanceof Date ? record.date.toISOString() : record.date;

    const createdAt =
        record.createdAt instanceof Date
            ? record.createdAt.toISOString()
            : record.createdAt;

    const updatedAt =
        record.updatedAt instanceof Date
            ? record.updatedAt.toISOString()
            : record.updatedAt;

    return {
        id: record._id ? String(record._id) : undefined,
        date: dateValue,
        status: record.status,
        student,
        studentId:
            student?._id ??
            (typeof record.studentId === 'string'
                ? record.studentId
                : record.studentId?._id
                ? String(record.studentId._id)
                : undefined),
        createdAt,
        updatedAt,
    };
}

export async function GET(request, { params }) {
    await mongoConnect();

    const { teacherId } = await params;

    try {
        const teacher = await resolveTeacher(teacherId, 'departmentId level');
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');
        const studentId = searchParams.get('studentId');
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');
        const levelParam = searchParams.get('level');
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
        const sort = searchParams.get('sort') || '-date';

        const studentFilter = { departmentId: teacher.departmentId };

        const teacherLevel = teacher.level || null;

        if (levelParam && !STUDENT_LEVEL_VALUES.includes(levelParam)) {
            return NextResponse.json({ message: 'Invalid level' }, { status: 400 });
        }

        if (teacherLevel && levelParam && levelParam !== teacherLevel) {
            return NextResponse.json({ message: 'Teacher is not assigned to this level' }, { status: 403 });
        }

        if (teacherLevel) {
            studentFilter.level = teacherLevel;
        } else if (levelParam) {
            studentFilter.level = levelParam;
        }
        if (branchId) {
            const normalizedBranchId = normalizeObjectId(branchId);
            if (!normalizedBranchId) {
                return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
            }
            studentFilter.branchId = normalizedBranchId;
        }

        const studentDocs = await Student.find(studentFilter).select('_id').lean();
        if (studentDocs.length === 0) {
            const payload = { count: 0, data: [], meta: { page, limit, total: 0, totalPages: 1 } };
            return NextResponse.json(payload, { status: 200 });
        }

        const allowedIds = new Set(studentDocs.map((doc) => String(doc._id)));
        const filter = { studentId: { $in: Array.from(allowedIds) } };

        if (studentId) {
            const normalizedStudentId = normalizeObjectId(studentId);
            if (!normalizedStudentId) {
                return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
            }

            if (!allowedIds.has(String(normalizedStudentId))) {
                const payload = { count: 0, data: [], meta: { page, limit, total: 0, totalPages: 1 } };
                return NextResponse.json(payload, { status: 200 });
            }

            filter.studentId = normalizedStudentId;
        }

        if (status) {
            filter.status = status;
        }

        const dateFilter = {};
        if (dateStr) {
            const date = parseDateOnly(dateStr);
            if (!date) {
                return NextResponse.json({ message: 'Invalid date' }, { status: 400 });
            }

            const start = normalizeAttendanceDate(date);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            dateFilter.$gte = start;
            dateFilter.$lte = end;
        } else {
            const fromDate = parseDateOnly(fromStr);
            const toDate = parseDateOnly(toStr);

            if (fromStr && !fromDate) {
                return NextResponse.json({ message: 'Invalid from date' }, { status: 400 });
            }

            if (toStr && !toDate) {
                return NextResponse.json({ message: 'Invalid to date' }, { status: 400 });
            }

            if (fromDate) {
                dateFilter.$gte = normalizeAttendanceDate(fromDate);
            }

            if (toDate) {
                const end = normalizeAttendanceDate(toDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
        }

        if (Object.keys(dateFilter).length) {
            filter.date = dateFilter;
        }

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'studentId',
                    select: 'studentCode name level branchId departmentId',
                    populate: [
                        { path: 'branchId', select: 'name' },
                        { path: 'departmentId', select: 'name' },
                    ],
                })
                .lean(),
            Attendance.countDocuments(filter),
        ]);

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasNext: skip + records.length < total,
            hasPrev: page > 1,
            sort,
        };

        const data = records.map(normalizeAttendanceRecord);
        return NextResponse.json({ count: data.length, data, meta }, { status: 200 });
    } catch (error) {
        console.error('GET /teachers/:teacherId/attendance error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    await mongoConnect();

    const { teacherId } = await params;

    try {
        const teacher = await resolveTeacher(teacherId, 'departmentId level');
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        const body = await request.json();
        let { date, items } = body ?? {};

        if (!Array.isArray(items) || items.length === 0) {
            if (Array.isArray(body?.records) && body.records.length > 0) {
                items = body.records;
            }
        }

        if (!date) {
            const firstDate = items?.find((it) => it?.date)?.date;
            if (firstDate) {
                date = firstDate;
            }
        }

        if (!date || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ message: 'date and items[] are required' }, { status: 400 });
        }

        const parsedDate = parseDateOnly(date);
        if (!parsedDate) {
            return NextResponse.json({ message: 'Invalid date' }, { status: 400 });
        }

        const normalizedDate = normalizeAttendanceDate(parsedDate);

        const studentQuery = { departmentId: teacher.departmentId };
        if (teacher.level) {
            studentQuery.level = teacher.level;
        }

        const allowedStudents = await Student.find(studentQuery)
            .select('_id')
            .lean();
        const allowed = new Set(allowedStudents.map((doc) => String(doc._id)));

        const invalid = [];
        const operations = [];

        for (const entry of items) {
            const normalizedStudentId = normalizeObjectId(entry?.studentId);
            const status = entry?.status;

            if (!normalizedStudentId || !allowed.has(String(normalizedStudentId))) {
                invalid.push(entry?.studentId);
                continue;
            }

            if (!status) {
                invalid.push(entry?.studentId);
                continue;
            }

            operations.push({
                updateOne: {
                    filter: { studentId: normalizedStudentId, date: normalizedDate },
                    update: { $set: { studentId: normalizedStudentId, date: normalizedDate, status } },
                    upsert: true,
                },
            });
        }

        if (invalid.length) {
            return NextResponse.json(
                {
                    message:
                        'Some studentIds are invalid or not part of this teacher’s department',
                    invalid,
                },
                { status: 400 },
            );
        }

        if (operations.length === 0) {
            return NextResponse.json(
                { message: 'No valid attendance records to upsert', invalid },
                { status: 400 },
            );
        }

        const result = await Attendance.bulkWrite(operations, { ordered: false });

        return NextResponse.json(
            {
                ok: true,
                upserted: result?.upsertedCount ?? 0,
                modified: result?.modifiedCount ?? 0,
                matched: result?.matchedCount ?? 0,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('POST /teachers/:teacherId/attendance error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    await mongoConnect();

    const { teacherId } = await params;

    try {
        const teacher = await resolveTeacher(teacherId, 'departmentId level');
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        const { studentId, date, status } = await request.json();
        if (!studentId || !date || !status) {
            return NextResponse.json(
                { message: 'studentId, date, status are required' },
                { status: 400 },
            );
        }

        const normalizedStudentId = normalizeObjectId(studentId);
        if (!normalizedStudentId) {
            return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
        }

        const parsedDate = parseDateOnly(date);
        if (!parsedDate) {
            return NextResponse.json({ message: 'Invalid date' }, { status: 400 });
        }

        const normalizedDate = normalizeAttendanceDate(parsedDate);

        const belongs = await Student.exists({
            _id: normalizedStudentId,
            departmentId: teacher.departmentId,
        });
        if (!belongs) {
            return NextResponse.json(
                { message: 'Student not in this teacher department' },
                { status: 400 },
            );
        }

        const updated = await Attendance.findOneAndUpdate(
            { studentId: normalizedStudentId, date: normalizedDate },
            { $set: { status } },
            { new: true },
        )
            .populate({ path: 'studentId', select: 'studentCode name' })
            .lean();

        if (!updated) {
            return NextResponse.json({ message: 'Attendance not found' }, { status: 404 });
        }

        return NextResponse.json({ attendance: updated }, { status: 200 });
    } catch (error) {
        console.error('PUT /teachers/:teacherId/attendance error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    await mongoConnect();

    const { teacherId } = await params;

    try {
        const teacher = await resolveTeacher(teacherId, 'departmentId level');
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        const { studentId, date } = await request.json();

        if (!studentId || !date) {
            return NextResponse.json(
                { message: 'studentId and date are required' },
                { status: 400 },
            );
        }

        const normalizedStudentId = normalizeObjectId(studentId);
        if (!normalizedStudentId) {
            return NextResponse.json({ message: 'Invalid studentId' }, { status: 400 });
        }

        const parsedDate = parseDateOnly(date);
        if (!parsedDate) {
            return NextResponse.json({ message: 'Invalid date' }, { status: 400 });
        }

        const normalizedDate = normalizeAttendanceDate(parsedDate);

        const belongs = await Student.exists({
            _id: normalizedStudentId,
            departmentId: teacher.departmentId,
        });
        if (!belongs) {
            return NextResponse.json(
                { message: 'Student not in this teacher department' },
                { status: 400 },
            );
        }

        const deleted = await Attendance.findOneAndDelete({
            studentId: normalizedStudentId,
            date: normalizedDate,
        });

        if (!deleted) {
            return NextResponse.json({ message: 'Attendance not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Attendance deleted' }, { status: 200 });
    } catch (error) {
        console.error('DELETE /teachers/:teacherId/attendance error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}






