import mongoConnect from "@/lib/mongodb";
import { Teacher, User } from "@/Models";

import { hashPassword } from "@/tools/hashpassword";
import { NextResponse } from "next/server";


export async function GET() {
    await mongoConnect();
    console.log("Connected to MongoDB");

    try {
        const teachers = await Teacher.find()
            .populate({ path: 'userId', select: 'username role' })
            .populate('departmentId', 'name')
            .lean();

        return NextResponse.json({ count: teachers.length, data: teachers }, { status: 200 });
    } catch (err) {
        console.error('GET /api/teachers error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    try {
        const { username, password, employeeCode, name, departmentId } = await request.json();

        if (!username || !password || !employeeCode || !name) {
            return NextResponse.json(
                { message: 'username, password, employeeCode, name are required' },
                { status: 400 }
            );
        }

        // ป้องกันการเขียนซ้ำ
        const exists = await User.findOne({ username }).lean();
        if (exists) {
            return NextResponse.json({ message: "Username already exists" }, { status: 400 });
        }

        // สร้าง User role=Teacher
        const hashPass = await hashPassword(password);
        const newUser = await User.create({
            username,
            passwordHash: hashPass,
            role: 'Teacher',
        })

        // กัน employeeCode ซ้ำ
        const dupTeacher = await Teacher.findOne({ employeeCode }).lean();
        if (dupTeacher) {
            return NextResponse.json({ message: 'employeeCode already exists' }, { status: 400 });
        }

        // สร้าง Teacher ผูกกับ User
        const teacher = await Teacher.create({
            employeeCode,
            name,
            userId: newUser._id,
            departmentId: departmentId || null,
        })

        const safe = await Teacher.findById(teacher._id)
            .populate({ path: 'userId', select: 'username role createAt' })
            .populate({ path: 'departmentId', select: 'name' })
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