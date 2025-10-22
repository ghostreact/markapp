export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import mongoConnect from '@/lib/mongodb';
import { COOKIE } from '@/lib/cookie';
import { verifyAccessToken } from '@/lib/jwt';
import { User } from '@/Models';

function formatCourse(data, index = 0) {
    const fallbackTimes = [
        { start: '09:00', end: '10:30' },
        { start: '10:45', end: '12:15' },
        { start: '13:00', end: '14:30' },
        { start: '14:45', end: '16:15' },
    ];

    const { start, end } = fallbackTimes[index % fallbackTimes.length];

    return {
        id: data.id ?? `course-${index + 1}`,
        code: data.code,
        title: data.title,
        instructor: data.instructor,
        location: data.location,
        summary: data.summary,
        days: data.days,
        time: `${start} – ${end}`,
        nextSession: data.nextSession ?? null,
        progress: data.progress ?? 0,
        credits: data.credits ?? 3,
    };
}

export async function GET(req) {
    try {
        const token = req.cookies.get(COOKIE.ACCESS)?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token);

        await mongoConnect();

        const userDoc = await User.findById(payload.sub)
            .populate({
                path: 'studentProfile',
                populate: [
                    { path: 'branchId', select: 'name' },
                    { path: 'departmentId', select: 'name' },
                ],
            })
            .populate({
                path: 'teacherProfile',
                populate: [{ path: 'departmentId', select: 'name' }],
            })
            .lean();

        if (!userDoc) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const student = userDoc.studentProfile;

        if (!student) {
            return NextResponse.json(
                { message: 'Student profile not found' },
                { status: 403 },
            );
        }

        const departmentName = student?.departmentId?.name ?? 'General Studies';
        const branchName = student?.branchId?.name ?? 'Main Campus';

        const baseCourses = [
            {
                id: 'core-1',
                code: `${departmentName.slice(0, 3).toUpperCase()}101`,
                title: `${departmentName} Foundations`,
                instructor: 'Advisory Faculty',
                location: `${branchName} · Room A201`,
                days: ['Monday', 'Wednesday'],
                summary:
                    'Overview of core concepts and collaborative workshops aligned with your department focus.',
                nextSession: null,
                progress: 64,
            },
            {
                id: 'lab-1',
                code: 'LAB210',
                title: 'Applied Practice Lab',
                instructor: 'Lab Team',
                location: `${branchName} · Innovation Lab`,
                days: ['Tuesday'],
                summary:
                    'Hands-on lab exploring real scenarios with guidance from senior students and faculty.',
                progress: 48,
            },
            {
                id: 'project-1',
                code: 'CAP300',
                title: 'Capstone Project Sprint',
                instructor: 'Project Mentors',
                location: 'Collaboration Studio · Online',
                days: ['Friday'],
                summary:
                    'Weekly project sprint with peer feedback designed to build your final presentation portfolio.',
                progress: 32,
            },
        ].map(formatCourse);

        const recommended = [
            {
                id: 'skill-ux',
                code: 'SKL105',
                title: 'Career Skills Workshop',
                instructor: 'Student Success Center',
                summary:
                    'Sharpen presentation skills, interview readiness, and collaborative communication.',
                location: 'Student Center · Room 420',
                days: ['Thursday'],
                progress: 0,
            },
        ].map((course, index) => formatCourse(course, index + baseCourses.length));

        return NextResponse.json({
            student: {
                id: student._id.toString(),
                name: student.name,
                studentCode: student.studentCode,
                branch: student.branchId?.name ?? null,
                department: student.departmentId?.name ?? null,
            },
            courses: baseCourses,
            recommended,
        });
    } catch (error) {
        console.error('GET /api/student/my-courses error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
