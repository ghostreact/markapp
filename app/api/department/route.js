import mongoConnect from '@/lib/mongodb';
import { Department } from '@/Models';
import { NextResponse } from 'next/server';

// ✅ GET — ดึง department ทั้งหมด
export async function GET(request) {
    await mongoConnect();

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || ''; // ค้นหาชื่อ

        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };

        const departments = await Department.find(filter).lean();

        return NextResponse.json(
            { count: departments.length, data: departments },
            { status: 200 }
        );
    } catch (error) {
        console.error('GET /api/department error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ POST — เพิ่ม department ใหม่
export async function POST(request) {
    await mongoConnect();

    try {
        const { name } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ message: 'name is required' }, { status: 400 });
        }

        const exists = await Department.findOne({ name }).lean();
        if (exists) {
            return NextResponse.json({ message: 'Department name already exists' }, { status: 409 });
        }

        const department = await Department.create({ name });

        return NextResponse.json({ department }, { status: 201 });
    } catch (error) {
        console.error('POST /api/department error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
