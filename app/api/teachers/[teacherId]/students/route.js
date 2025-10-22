// app/api/teachers/[teacherId]/students/route.js
import { isValidObjectId } from 'mongoose';
import mongoConnect from '@/lib/mongodb';
import { Teacher, Student, User, Branch } from '@/Models';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/tools/hashpassword';

export async function GET(request, { params }) {
  await mongoConnect();

  try {
    const { teacherId } = await params;
    const url = new URL(request.url);
    const branchIdParam = url.searchParams.get('branchId');

    let teacher = null;

    if (isValidObjectId(teacherId)) {
      teacher = await Teacher.findById(teacherId).lean();
    }

    if (!teacher && isValidObjectId(teacherId)) {
      teacher = await Teacher.findOne({ userId: teacherId }).lean();
    }

    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    if (!teacher.departmentId) {
      return NextResponse.json({ count: 0, data: [] }, { status: 200 });
    }

    const query = { departmentId: teacher.departmentId };

    if (branchIdParam) {
      if (!isValidObjectId(branchIdParam)) {
        return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
      }

      const branch = await Branch.findById(branchIdParam).lean();
      if (!branch) {
        return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
      }

      if (branch.departmentId && String(branch.departmentId) !== String(teacher.departmentId)) {
        return NextResponse.json({ message: 'Branch does not belong to department' }, { status: 400 });
      }

      query.branchId = branch._id;
    }

    const students = await Student.find(query)
      .populate('userId', 'username role')
      .populate('departmentId', 'name')
      .populate('branchId', 'name')
      .lean();

    return NextResponse.json({ count: students.length, data: students }, { status: 200 });
  } catch (error) {
    console.error('GET /teachers/:teacherId/students error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  await mongoConnect();

  let { teacherId } = await params;

  // 1) resolve teacher (รองรับทั้ง teacher._id และ user._id)
  let teacher = null;

  if (isValidObjectId(teacherId)) {
    teacher = await Teacher.findById(teacherId).lean();
  }

  // ถ้ายังไม่เจอ ให้ลองหาโดย userId (กรณี client ส่ง user._id มา)
  if (!teacher && isValidObjectId(teacherId)) {
    teacher = await Teacher.findOne({ userId: teacherId }).lean();
  }

  if (!teacher) {
    return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
  }

  const { studentCode, name, username, password, branchId, departmentId } = await request.json();

  if (!studentCode || !name || !username || !password) {
    return NextResponse.json(
      { message: 'studentCode, name, username, password are required' },
      { status: 400 }
    );
  }

  const depId = departmentId || teacher.departmentId;
  if (!isValidObjectId(depId)) {
    return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
  }

  let brId = null;
  if (branchId) {
    if (!isValidObjectId(branchId)) {
      return NextResponse.json({ message: 'Invalid branchId' }, { status: 400 });
    }
    const br = await Branch.findById(branchId).lean();
    if (!br) return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
    if (br.departmentId && String(br.departmentId) !== String(depId)) {
      return NextResponse.json({ message: 'Branch does not belong to department' }, { status: 400 });
    }
    brId = br._id;
  }

  // กันซ้ำ
  if (await User.findOne({ username }).lean()) {
    return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
  }
  if (await Student.findOne({ studentCode }).lean()) {
    return NextResponse.json({ message: 'Student code already exists' }, { status: 409 });
  }

  // สร้าง user + student
  const passwordHash = await hashPassword(password);
  const user = await User.create({ username, passwordHash, role: 'Student' });

  const student = await Student.create({
    studentCode,
    name,
    userId: user._id,
    departmentId: depId,
    branchId: brId,
    // ถ้าคุณมีฟิลด์ teacherId ใน Student schema ใส่ตรงนี้ได้ด้วย
    // teacherId: teacher._id,
  });

  const created = await Student.findById(student._id)
    .populate('userId', 'username role')
    .populate('departmentId', 'name')
    .populate('branchId', 'name')
    .lean();

  return NextResponse.json({ student: created }, { status: 201 });
}
