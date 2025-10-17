import mongoConnect from '@/lib/mongodb';
import { Branch, Department } from '@/Models';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';

// ✅ GET - ดึง branch เดียว
export async function GET(request, { params }) {
    await mongoConnect();
    const { branchId } = await params;

    if (!isValidObjectId(branchId)) {
        return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
    }

    try {
        const branch = await Branch.findById(branchId)
            .populate('departmentId', 'name')
            .lean();

        if (!branch) {
            return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ branch }, { status: 200 });
    } catch (err) {
        console.error('GET /api/branch/:id error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ PUT - แก้ไข branch
export async function PUT(request, { params }) {
    await mongoConnect();
    const { branchId } = await params;

    if (!isValidObjectId(branchId)) {
        return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
    }

    try {
        const { name, departmentId } = await request.json();
        const update = {};

        if (name?.trim()) update.name = name;

        if (departmentId) {
            if (!isValidObjectId(departmentId)) {
                return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
            }
            const dep = await Department.findById(departmentId).lean();
            if (!dep) {
                return NextResponse.json({ message: 'Department not found' }, { status: 404 });
            }
            update.departmentId = dep._id;
        }

        const updated = await Branch.findByIdAndUpdate(branchId, update, { new: true }).lean();

        if (!updated) {
            return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ branch: updated }, { status: 200 });
    } catch (err) {
        console.error('PUT /api/branch/:id error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// ✅ DELETE - ลบ branch
export async function DELETE(request, { params }) {
    await mongoConnect();
    const { branchId } = await params;

    if (!isValidObjectId(branchId)) {
        return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
    }

    try {
        const deleted = await Branch.findByIdAndDelete(branchId);
        if (!deleted) {
            return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Branch deleted successfully' }, { status: 200 });
    } catch (err) {
        console.error('DELETE /api/branch/:id error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
