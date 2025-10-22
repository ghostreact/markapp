// app/api/student/route.js
import mongoConnect from '@/lib/mongodb';
import { Student } from '@/Models';
import { NextResponse } from 'next/server';

export async function GET() {
  await mongoConnect();
  try {
    const students = await Student.find()
      .populate('userId', 'username role')
      .populate('departmentId', 'name')
      .populate('branchId', 'name')
      .lean();

    return NextResponse.json({ count: students.length, data: students }, { status: 200 });
  } catch (err) {
    console.error('GET /api/student error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
