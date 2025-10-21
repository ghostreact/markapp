import mongoConnect from '@/lib/mongodb';
import { User, Student, Teacher } from '@/Models';   // ต้องแก้ index.js ตามด้านบน
import { hashPassword } from '@/tools/hashpassword';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// ✅ GET: ดึงนักเรียนทั้งหมดของครู (อิง department ของครู ตาม schema ปัจจุบัน)
export async function GET(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;  // ถ้า Next 14.1 ลงไป: const { teacherId } = params;

    try {
        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // ตาม schema ปัจจุบัน Student ไม่มี teacherId จึงกรองตาม department ของครู
        if (!teacher.departmentId) {
            return NextResponse.json({ count: 0, data: [] }, { status: 200 });
        }

        const students = await Student.find({ departmentId: teacher.departmentId })
            .populate({ path: 'userId', select: 'username role' })
            .populate('branchId', 'name')
            .populate('departmentId', 'name')
            .lean();

        return NextResponse.json({ count: students.length, data: students }, { status: 200 });
    } catch (err) {
        console.error('GET /teachers/:teacherId/students error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ POST: ครูสร้างนักเรียนใหม่ (สร้าง user role=Student ให้ด้วย)
export async function POST(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;   // ถ้า Next 14.1 ลงไป: const { teacherId } = params;

    try {
        // 1) เช็คครู
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // 2) รับ body
        const body = await request.json();
        const { studentCode, name, username, password, branchId, departmentId } = body;


        console.log('POST /students body =', body);

        if (!studentCode || !name || !username || !password) {
            return NextResponse.json(
                { message: 'studentCode, name, username, and password are required' },
                { status: 400 }
            );
        }

        // 3) กัน username ซ้ำ
        const existingUser = await User.findOne({ username }).lean();
        if (existingUser) {
            return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
        }

        // 4) สร้าง User role=Student
        const passwordHash = await hashPassword(password);
        const newUser = await User.create({
            username,
            passwordHash,
            role: 'Student',
        });

        // 5) กัน studentCode ซ้ำ
        const existingStudent = await Student.findOne({ studentCode }).lean();
        if (existingStudent) {
            return NextResponse.json({ message: 'Student code already exists' }, { status: 409 });
        }

        // 6) สร้าง Student (อิง department ของครูเป็น default ถ้าไม่ส่งมา)
        const student = await Student.create({
            studentCode,
            name,                                    // ✅ ใช้ name ไม่ใช่ Studentname
            userId: newUser._id,
            branchId: branchId || null,
            departmentId: departmentId || teacher.departmentId || null,
        });

        // 7) populate แล้วตอบกลับ
        const createdStudent = await Student.findById(student._id)
            .populate({ path: 'userId', select: 'username role' })
            .populate({ path: 'departmentId', select: 'name' })
            .populate({ path: 'branchId', select: 'name' })
            .lean();

        return NextResponse.json({ student: createdStudent }, { status: 201 });
    } catch (err) {
        if (err?.code === 11000) {
            return NextResponse.json({ message: 'Duplicate key', details: err.keyValue }, { status: 400 });
        }
        console.error('POST /teachers/:teacherId/students error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    await mongoConnect();

    const { teacherId } = await params;            // <-- ใช้ชื่อให้ตรงกับ [teacherId]
    if (!isValidObjectId(teacherId)) {
        return NextResponse.json({ message: 'Invalid teacherId' }, { status: 400 });
    }

    try {
        // (ตัวเลือก) ถ้าต้องการลบ User ไปด้วย ให้หา teacher ก่อน
        const teacher = await Teacher.findByIdAndDelete(teacherId);
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // (ตัวเลือก) ลบ user ของครูด้วย ถ้าต้องการ
        // await User.findByIdAndDelete(teacher.userId);

        return NextResponse.json({ ok: true, message: 'Teacher deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/teachers/:teacherId error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}