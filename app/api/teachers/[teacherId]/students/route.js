// app/api/teachers/[teacherId]/students/route.js
import { isValidObjectId } from 'mongoose';
import mongoConnect from '@/lib/mongodb';
import { Teacher, Student, User } from '@/Models';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/tools/hashpassword';
import { STUDENT_LEVEL_VALUES, DEFAULT_STUDENT_LEVEL } from '@/lib/constants/student-levels';

export async function GET(request, { params }) {
  await mongoConnect();

  try {
    const { teacherId } = await params;
    const url = new URL(request.url);
    const levelParam = url.searchParams.get('level');
    const yearParam = url.searchParams.get('year');
    const roomParam = url.searchParams.get('room');

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

    const teacherLevel = teacher.level || null;

    if (levelParam && !STUDENT_LEVEL_VALUES.includes(levelParam)) {
      return NextResponse.json({ message: 'Invalid level' }, { status: 400 });
    }

    if (teacherLevel && levelParam && levelParam !== teacherLevel) {
      return NextResponse.json({ message: 'Teacher is not assigned to this level' }, { status: 403 });
    }

    const query = { departmentId: teacher.departmentId };

    if (teacherLevel) {
      query.level = teacherLevel;
    } else if (levelParam) {
      query.level = levelParam;
    }

    // Apply optional year/room filters if provided
    const yearNum = Number(yearParam);
    if (Number.isFinite(yearNum) && yearNum > 0) {
      query.year = Math.floor(yearNum);
    }
    const roomNum = Number(roomParam);
    if (Number.isFinite(roomNum) && roomNum > 0) {
      query.room = Math.floor(roomNum);
    }

    // branch ถูกถอดออก ไม่รองรับการ filter ด้วย branch อีกต่อไป

    const students = await Student.find(query)
      .populate('userId', 'username role')
      .populate('departmentId', 'name')
      // .populate('branchId', 'name') // branch ถูกถอดจาก UI
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

  const { studentCode, name, username, password, departmentId, level, year, room } = await request.json();

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
  if (teacher.departmentId && String(depId) !== String(teacher.departmentId)) {
    return NextResponse.json({ message: 'Teacher cannot assign students to another department' }, { status: 403 });
  }

  const teacherLevel = teacher.level || null;

  let studentLevel = teacherLevel || DEFAULT_STUDENT_LEVEL;
  if (level) {
    if (!STUDENT_LEVEL_VALUES.includes(level)) {
      return NextResponse.json({ message: 'Invalid level' }, { status: 400 });
    }
    if (teacherLevel && level !== teacherLevel) {
      return NextResponse.json({ message: 'Teacher is not assigned to this level' }, { status: 403 });
    }
    studentLevel = level;
  }

  let brId = null;
  // branch ถูกถอดจากระบบ

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
    level: studentLevel,
    year: Number.isFinite(Number(year)) ? Math.max(1, Math.min(3, Number(year))) : 1,
    room: Number.isFinite(Number(room)) ? Math.max(1, Math.min(20, Number(room))) : 1,
    // ถ้าคุณมีฟิลด์ teacherId ใน Student schema ใส่ตรงนี้ได้ด้วย
    // teacherId: teacher._id,
  });

  const created = await Student.findById(student._id)
    .populate('userId', 'username role')
    .populate('departmentId', 'name')
    // .populate('branchId', 'name')
    .lean();

  return NextResponse.json({ student: created }, { status: 201 });
}
