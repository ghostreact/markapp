import mongoConnect from "@/lib/mongodb";
import User from "@/Models/User";
import { hashPassword } from "@/tools/hashpassword";
import { NextResponse } from "next/server";


export async function GET() {
    await mongoConnect();
    console.log("Connected to MongoDB");

    const getall = await User.find();
    return NextResponse.json({ users: getall });
}

export async function POST(request) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: 'username/password is required' },
                { status: 400 }
            );
        }

        // เช็คว่ามี username นี้อยู่แล้วหรือไม่
        const existingUser = await User.findOne({ username }).lean();
        if (existingUser) {
            return NextResponse.json(
                { message: 'Username already exists' },
                { status: 400 }
            );
        }

        // สร้างผู้ใช้ใหม่
        const hashPass = await hashPassword(password);

        const newUsers = await User.create({
            username,
            passwordHash: hashPass
        });

        return NextResponse.json({ user: newUsers }, { status: 201 });


    } catch (err) {
        // จัดการ duplicate key จาก unique index (เช่น username ซ้ำ)
        if (err?.code === 11000) {
            return NextResponse.json({ message: 'Username already exists' }, { status: 400 });
        }
        console.error('POST /api/users error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
