import mongoConnect from "@/lib/mongodb";
import { Student } from "@/Models";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    const { studentID } = await params;
    const getStudentById = await Student.findById(studentID)
        .populate({ path: 'userId', select: 'username role' })
        .populate('branchId', 'name')
        .populate('departmentId', 'name')
        .lean();

    if (!getStudentById) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ getStudentById }, { status: 200 });

}

export async function PUT(request, { params }) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    const { studentID } = await params;
    const { name,branchId,departmentId } = await request.json();
    const updated  = await Student.findByIdAndUpdate(
        studentID, { name,branchId, departmentId },{new : true}).lean();

    if (!updated ) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ student: updated  }, { status: 200 });

}

export async function DELETE(request, { params }) {
    await mongoConnect();
    console.log("Connected to MongoDB");

    const { studentID } = await params;
    const deleted  = await Student.findByIdAndDelete(studentID).lean();

    if (!deleted ) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Student deleted successfully' })

}