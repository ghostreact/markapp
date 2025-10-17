// app/api/teachers/[teacherId]/students/route.js
import mongoConnect from '@/lib/mongodb';
import { Student, Teacher, User, Branch, Department } from '@/Models'; // ถ้าตรวจ branch/department
import { hashPassword } from '@/tools/hashpassword';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// ✅ GET — นักเรียนทั้งหมดของครู
export async function GET(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params; // ถ้า Next.js <14.2 ใช้ const { teacherId } = params;

    try {
        // 1️⃣ ตรวจสอบ teacher
        if (!isValidObjectId(teacherId)) {
            return NextResponse.json({ message: 'Invalid teacherId' }, { status: 400 });
        }

        const teacher = await Teacher.findById(teacherId).lean();
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // 2️⃣ ถ้าครูไม่มี department → ไม่มีนักเรียน
        if (!teacher.departmentId) {
            return NextResponse.json({ count: 0, data: [] }, { status: 200 });
        }

        // 3️⃣ ดึงนักเรียนทั้งหมดใน department ของครู
        const students = await Student.find({ departmentId: teacher.departmentId })
            .populate({ path: 'userId', select: 'username role' })
            .populate('branchId', 'name')
            .populate('departmentId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(
            { count: students.length, data: students },
            { status: 200 }
        );
    } catch (err) {
        console.error('GET /teachers/:teacherId/students error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    await mongoConnect();
    const { teacherId } = await params;   // ถ้า Next 14.1 ลงไป ใช้: const { teacherId } = params;

    try {
        // 1) เช็คว่าครูมีจริง
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
        }

        // 2) รับ body — ใช้ name ไม่ใช่ Studentname
        const body = await request.json();
        const { studentCode, name, username, password, branchId, departmentId } = body;

        // (ใส่ log ชั่วคราว)
        // console.log('Body:', body);

        // 3) validate เฉพาะ field ที่จำเป็น
        if (!studentCode?.trim() || !name?.trim() || !username?.trim() || !password?.trim()) {
            return NextResponse.json(
                { message: 'studentCode, name, username, and password are required' },
                { status: 400 }
            );
        }

        // 4) กัน username/studentCode ซ้ำ
        const [userDup, studentDup] = await Promise.all([
            User.findOne({ username }).lean(),
            Student.findOne({ studentCode }).lean(),
        ]);
        if (userDup) return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
        if (studentDup) return NextResponse.json({ message: 'Student code already exists' }, { status: 409 });

        // 5) ตรวจ branchId/departmentId ถ้ามีการส่งมา (กัน ID ไม่จริง/ข้ามแผนก)
        let finalBranchId = null;
        if (branchId) {
            if (!isValidObjectId(branchId)) {
                return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
            }
            const branch = await Branch.findById(branchId).lean();
            if (!branch) return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
            // ถ้าครูมี department และ branch ก็มี department ให้กันข้ามแผนก
            if (teacher.departmentId && branch.departmentId &&
                String(branch.departmentId) !== String(teacher.departmentId)) {
                return NextResponse.json({ message: 'Branch does not belong to teacher’s department' }, { status: 400 });
            }
            finalBranchId = branch._id;
        }

        let finalDepartmentId = departmentId || teacher.departmentId || null;
        if (finalDepartmentId) {
            if (!isValidObjectId(finalDepartmentId)) {
                return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
            }
            const dep = await Department.findById(finalDepartmentId).lean();
            if (!dep) return NextResponse.json({ message: 'Department not found' }, { status: 404 });
        }

        // 6) สร้าง User (role=Student)
        const passwordHash = await hashPassword(password);
        const newUser = await User.create({ username, passwordHash, role: 'Student' });

        // 7) สร้าง Student
        const student = await Student.create({
            studentCode,
            name,                          // ✅ ใช้ name ที่ถูกต้อง
            userId: newUser._id,
            branchId: finalBranchId,
            departmentId: finalDepartmentId,
            // createdByTeacherId: teacher._id, // ถ้าเพิ่ม field นี้ใน schema จะรู้ชัดว่าใครเป็นคนสร้าง
        });

        // 8) populate แล้วส่งกลับ
        const created = await Student.findById(student._id)
            .populate({ path: 'userId', select: 'username role' })
            .populate('branchId', 'name')
            .populate('departmentId', 'name')
            .lean();

        return NextResponse.json({ student: created }, { status: 201 });
    } catch (error) {
        if (error?.code === 11000) {
            return NextResponse.json({ message: 'Duplicate key', details: error.keyValue }, { status: 400 });
        }
        console.error('POST /teachers/:teacherId/students error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
