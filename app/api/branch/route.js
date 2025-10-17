import mongoConnect from '@/lib/mongodb';
import { Branch, Department } from '@/Models';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// ✅ GET - ดึง branch ทั้งหมด (สามารถกรองได้)
export async function GET(request) {
    await mongoConnect();

    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q') || '';               // ค้นหาชื่อ
        const departmentId = searchParams.get('departmentId'); // กรองตาม department

        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (departmentId) filter.departmentId = departmentId;

        const branches = await Branch.find(filter)
            .populate('departmentId', 'name')
            .lean();

        return NextResponse.json({ count: branches.length, data: branches }, { status: 200 });
    } catch (err) {
        console.error('GET /api/branch error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ POST - เพิ่ม branch ใหม่
export async function POST(request) {
    await mongoConnect();

    try {
        const { name, departmentId } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ message: 'name is required' }, { status: 400 });
        }

        // ตรวจชื่อซ้ำ
        const existing = await Branch.findOne({ name }).lean();
        if (existing) {
            return NextResponse.json({ message: 'Branch name already exists' }, { status: 409 });
        }

        // ตรวจ departmentId ว่ามีจริงไหม (ถ้ามีส่งมา)
        let finalDepartmentId = null;
        if (departmentId) {
            if (!isValidObjectId(departmentId)) {
                return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
            }
            const dep = await Department.findById(departmentId).lean();
            if (!dep) {
                return NextResponse.json({ message: 'Department not found' }, { status: 404 });
            }
            finalDepartmentId = dep._id;
        }

        const created = await Branch.create({ name, departmentId: finalDepartmentId });

        const populated = await Branch.findById(created._id)
            .populate('departmentId', 'name')
            .lean();

        return NextResponse.json({ branch: populated }, { status: 201 });
    } catch (err) {
        console.error('POST /api/branch error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
