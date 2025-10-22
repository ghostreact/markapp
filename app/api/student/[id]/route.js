import mongoConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { Student, User, Attendance } from '@/Models';

export async function DELETE(_req, { params }) {
  await mongoConnect();

  const { id } = await params;            
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: 'Invalid student id' }, { status: 400 });
  }

  try {
    // หา student ก่อน
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // ลบ attendance ทั้งหมดของนักเรียนคนนี้ (ถ้ามี model Attendance)
    await Attendance.deleteMany({ studentId: student._id }).catch(() => {});

    // ลบ user ที่ผูกไว้ (ถ้าอยากลบไปพร้อมกัน)
    if (student.userId) {
      await User.findByIdAndDelete(student.userId).catch(() => {});
    }

    // ลบตัว student
    await Student.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
  } catch (err) {
    console.error('DELETE /api/student/[id] error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


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

