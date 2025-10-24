import mongoConnect from '@/lib/mongodb';
import { isValidObjectId } from 'mongoose';

import { hashPassword } from '@/tools/hashpassword';
import { NextResponse } from 'next/server';
import { Department, Teacher, User } from '@/Models';
import {
  DEFAULT_STUDENT_LEVEL,
  STUDENT_LEVEL_VALUES,
  getStudentLevelLabel,
} from '@/lib/constants/student-levels';

function withLevelMeta(doc) {
  if (!doc) return doc;
  const next = { ...doc };
  next.level = doc.level ?? null;
  next.levelLabel = getStudentLevelLabel(doc.level);
  return next;
}

export async function GET() {
  await mongoConnect();

  try {
    const teachers = await Teacher.find()
      .populate({ path: 'userId', select: 'username role' })
      .populate('departmentId', 'name')
      .lean();

    return NextResponse.json(
      {
        count: teachers.length,
        data: teachers.map((t) => withLevelMeta(t)),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('GET /api/teachers error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  await mongoConnect();

  try {
    const {
      username,
      password,
      employeeCode,
      name,
      departmentId,
      level = DEFAULT_STUDENT_LEVEL,
      homerooms = [],
    } = await request.json();

    if (!username?.trim() || !password?.trim() || !employeeCode?.trim() || !name?.trim() || !departmentId) {
      return NextResponse.json(
        { message: 'username, password, employeeCode, name, departmentId are required' },
        { status: 400 },
      );
    }

    if (!STUDENT_LEVEL_VALUES.includes(level)) {
      return NextResponse.json({ message: 'Invalid level' }, { status: 400 });
    }

    if (!isValidObjectId(departmentId)) {
      return NextResponse.json({ message: 'Invalid departmentId' }, { status: 400 });
    }

    const dep = await Department.findById(departmentId).lean();
    if (!dep) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    // branch ถูกถอดจากระบบ ฝั่ง API จะไม่รับค่า branch อีกต่อไป

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 400 });
    }

    const dupTeacher = await Teacher.findOne({ employeeCode }).lean();
    if (dupTeacher) {
      return NextResponse.json({ message: 'employeeCode already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await User.create({
      username,
      passwordHash,
      role: 'Teacher',
    });

    // sanitize homerooms (optional)
    const rooms = Array.isArray(homerooms)
      ? homerooms
          .map((h) => ({
            level: h?.level,
            year: Number(h?.year),
            room: Number(h?.room),
          }))
          .filter(
            (h) =>
              h.level && STUDENT_LEVEL_VALUES.includes(h.level) &&
              Number.isFinite(h.year) && h.year >= 1 && h.year <= 3 &&
              Number.isFinite(h.room) && h.room >= 1 && h.room <= 20,
          )
      : [];

    const teacher = await Teacher.create({
      employeeCode,
      name,
      userId: newUser._id,
      departmentId,
      level,
      homerooms: rooms,
    });

    const safe = await Teacher.findById(teacher._id)
      .populate({ path: 'userId', select: 'username role createdAt' })
      .populate('departmentId', 'name')
      .lean();

    return NextResponse.json({ teacher: withLevelMeta(safe) }, { status: 201 });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ message: 'Duplicate key', details: err.keyValue }, { status: 400 });
    }
    console.error('POST /api/teachers error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
