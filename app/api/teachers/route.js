import mongoConnect from "@/lib/mongodb";
import { isValidObjectId } from "mongoose";

import { hashPassword } from "@/tools/hashpassword";
import { NextResponse } from "next/server";
import { Branch, Department, Teacher } from "@/Models";


export async function GET() {
    await mongoConnect();
    console.log("Connected to MongoDB");

    try {
        const teachers = await Teacher.find()
            .populate({ path: 'userId', select: 'username role' })
            .populate('departmentId', 'name')
            .populate('branchId', 'name')
            .lean();

        return NextResponse.json({ count: teachers.length, data: teachers }, { status: 200 });
    } catch (err) {
        console.error('GET /api/teachers error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    await mongoConnect();

    try {
        const { username, password, employeeCode, name, departmentId, branchId } = await request.json();

        if (!username?.trim() || !password?.trim() || !employeeCode?.trim() || !name?.trim() || !departmentId) {
            return NextResponse.json(
                { message: 'username, password, employeeCode, name, departmentId are required' },
                { status: 400 }
            );
        }
        if (!isValidObjectId(departmentId)) {
            return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
        }
        if (branchId && !isValidObjectId(branchId)) {
            return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
        }

        // ตรวจ dept
        const dep = await Department.findById(departmentId).lean();
        if (!dep) return NextResponse.json({ message: 'Department not found' }, { status: 404 });

        // ถ้ามี branch: ต้องเป็นของ department เดียวกัน
        let finalBranchId = null;
        if (branchId) {
            const br = await Branch.findById(branchId).lean();
            if (!br) return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
            if (br.departmentId && String(br.departmentId) !== String(departmentId)) {
                return NextResponse.json({ message: 'Branch does not belong to department' }, { status: 400 });
            }
            finalBranchId = br._id;
        }

        // กัน username ซ้ำ
        const exists = await User.findOne({ username }).lean();
        if (exists) {
            return NextResponse.json({ message: "Username already exists" }, { status: 400 });
        }

        // กัน employeeCode ซ้ำ
        const dupTeacher = await Teacher.findOne({ employeeCode }).lean();
        if (dupTeacher) {
            return NextResponse.json({ message: 'employeeCode already exists' }, { status: 400 });
        }

        // สร้าง User role=Teacher
        const passwordHash = await hashPassword(password);
        const newUser = await User.create({
            username,
            passwordHash,
            role: 'Teacher',
        });

        // สร้าง Teacher + ใส่ branchId ให้ด้วย
        const teacher = await Teacher.create({
            employeeCode,
            name,
            userId: newUser._id,
            departmentId,
            branchId: finalBranchId, // <— สำคัญ
        });

        // คืนข้อมูลแบบ populate ครบ
        const safe = await Teacher.findById(teacher._id)
            .populate({ path: 'userId', select: 'username role createdAt' }) // createdAt (ไม่ใช่ createAt)
            .populate('departmentId', 'name')
            .populate('branchId', 'name')
            .lean();

        return NextResponse.json({ teacher: safe }, { status: 201 });

    } catch (err) {
        if (err?.code === 11000) {
            return NextResponse.json({ message: 'Duplicate key', details: err.keyValue }, { status: 400 });
        }
        console.error('POST /api/teachers error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}