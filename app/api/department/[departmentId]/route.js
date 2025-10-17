import mongoConnect from '@/lib/mongodb';
import { Department } from '@/Models';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// ✅ GET — ดึง department รายตัว
export async function GET(request, { params }) {
    await mongoConnect();
    const { departmentId } = await params;

    if (!isValidObjectId(departmentId)) {
        return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
    }

    try {
        const department = await Department.findById(departmentId).lean();

        if (!department) {
            return NextResponse.json({ message: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ department }, { status: 200 });
    } catch (error) {
        console.error('GET /api/department/:id error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ PUT — แก้ไข department
export async function PUT(request, { params }) {
    await mongoConnect();
    const { departmentId } = await params;

    if (!isValidObjectId(departmentId)) {
        return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
    }

    try {
        const { name } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json({ message: 'name is required' }, { status: 400 });
        }

        const updated = await Department.findByIdAndUpdate(
            departmentId,
            { name },
            { new: true }
        ).lean();

        if (!updated) {
            return NextResponse.json({ message: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ department: updated }, { status: 200 });
    } catch (error) {
        console.error('PUT /api/department/:id error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ DELETE — ลบ department
export async function DELETE(request, { params }) {
    await mongoConnect();
    const { departmentId } = await params;

    if (!isValidObjectId(departmentId)) {
        return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
    }

    try {
        const deleted = await Department.findByIdAndDelete(departmentId);

        if (!deleted) {
            return NextResponse.json({ message: 'Department not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('DELETE /api/department/:id error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
