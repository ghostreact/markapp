import mongoConnect from "@/lib/mongodb";
import User from "@/Models/User";
import { NextResponse } from 'next/server';

export async function GET(request) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    try {
        const { searchParams } = new URL(request.url);

        // 1) อ่านพารามิเตอร์จาก query string
        const q = searchParams.get('q') || ''; // ค่าที่ต้องการค้นหา
        const role = searchParams.get('role') || ''; // กรองตามบทบาท (ถ้ามี)
        const createFrom = searchParams.get('createFrom'); // กรองจากวันที่สร้าง (ถ้ามี)
        const createTo = searchParams.get('createTo'); // กรองถึงวันที่สร้าง (ถ้ามี)

        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1); // หน้า (เริ่มต้นที่ 1)
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100); // จำนวนรายการต่อหน้า (1-100)
        const sort = searchParams.get('sort') || '-createdAt'; // // เช่น 'username' หรือ '-createdAt'


        // 2) สร้างเงื่อนไขการค้นหา
        const filter = {};
        if (q) {
            filter.username = { $regex: q, $options: 'i' };

        }
        if (role) {
            filter.role = role; // 'Student' หรือ 'Teacher'
        }
        if (createFrom || createTo) {
            filter.createdAt = {};
            if (createFrom) {
                filter.createdAt.$gte = new Date(createFrom);
            }
            if (createTo) {
                filter.createdAt.$lte = new Date(createTo);
            }
        }

        // 3) นับก่อน (เพื่อหน้า)
        const totalItems = await User.countDocuments(filter);

        // 4) ดึงข้อมูลตามเงื่อนไข พร้อมจัดหน้าและเรียงลำดับ
        const users = await User.find(filter)
            .select('-passwordHash')      // ซ่อน hash
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

         // 5) meta สำหรับ pagination
        const meta = {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit) || 1,
            hasNext : page * limit < totalItems,
            hasPrev : page > 1,
            sort,
            query: { q, role, createFrom, createTo }
        }

        return NextResponse.json({data : users, meta}, {status: 200});

    } catch (error) {
 console.error('GET /api/users error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    await mongoConnect();
    console.log("Connected to MongoDB");
}