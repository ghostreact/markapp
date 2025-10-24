import mongoConnect from '@/lib/mongodb';
import { Branch, Student, Teacher, User } from '@/Models';
import { hashPassword } from '@/tools/hashpassword';
import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { DEFAULT_STUDENT_LEVEL } from '@/lib/constants/student-levels';

async function loadTeacher(teacherId) {
  if (!isValidObjectId(teacherId)) {
    return null;
  }
  return Teacher.findById(teacherId).lean();
}

export async function GET(request, { params }) {
  await mongoConnect();
  const { teacherId } = await params;

  try {
    const teacher = await loadTeacher(teacherId);
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (!teacher.departmentId) {
      return NextResponse.json({ count: 0, data: [] }, { status: 200 });
    }

    const studentFilter = { departmentId: teacher.departmentId };
    if (teacher.level) {
      studentFilter.level = teacher.level;
    }

    const students = await Student.find(studentFilter)
      .populate({ path: 'userId', select: 'username role' })
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .lean();

    return NextResponse.json({ count: students.length, data: students }, { status: 200 });
  } catch (err) {
    console.error('GET /teachers/:teacherId error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  await mongoConnect();
  const { teacherId } = await params;

  try {
    const teacher = await loadTeacher(teacherId);
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    const body = await request.json();
    const { studentCode, name, username, password, branchId } = body ?? {};

    if (!studentCode || !name || !username || !password) {
      return NextResponse.json(
        { message: 'studentCode, name, username, password are required' },
        { status: 400 },
      );
    }

    if (!teacher.departmentId) {
      return NextResponse.json(
        { message: 'Teacher is not assigned to a department' },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const existingStudent = await Student.findOne({ studentCode }).lean();
    if (existingStudent) {
      return NextResponse.json({ message: 'Student code already exists' }, { status: 409 });
    }

    let branchRef = null;
    if (branchId) {
      if (!isValidObjectId(branchId)) {
        return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
      }
      const branch = await Branch.findById(branchId).lean();
      if (!branch) {
        return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
      }
      if (branch.departmentId && String(branch.departmentId) !== String(teacher.departmentId)) {
        return NextResponse.json({ message: 'Branch does not belong to department' }, { status: 400 });
      }
      branchRef = branch._id;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      username,
      passwordHash,
      role: 'Student',
    });

    const student = await Student.create({
      studentCode,
      name,
      userId: user._id,
      departmentId: teacher.departmentId,
      branchId: branchRef,
      level: teacher.level || DEFAULT_STUDENT_LEVEL,
    });

    const createdStudent = await Student.findById(student._id)
      .populate({ path: 'userId', select: 'username role' })
      .populate('departmentId', 'name')
      .populate('branchId', 'name')
      .lean();

    return NextResponse.json({ student: createdStudent }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ message: 'Duplicate key', details: err.keyValue }, { status: 400 });
    }
    console.error('POST /teachers/:teacherId error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await mongoConnect();

  const { teacherId } = await params;
  if (!isValidObjectId(teacherId)) {
    return NextResponse.json({ message: 'Invalid teacherId' }, { status: 400 });
  }

  try {
    const teacher = await Teacher.findByIdAndDelete(teacherId);
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/teachers/:teacherId error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
