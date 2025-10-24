export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { COOKIE } from '@/lib/cookie';
import { verifyAccessToken } from '@/lib/jwt';
import mongoConnect from '@/lib/mongodb';
import { User } from '@/Models';
import { getStudentLevelLabel } from '@/lib/constants/student-levels';

function normalizeRef(ref) {
    if (!ref) return null;

    if (typeof ref === 'string') return ref;

    if (ref._id) {
        return {
            _id: ref._id.toString(),
            ...(ref.name ? { name: ref.name } : {}),
        };
    }

    return String(ref);
}

function normalizeProfile(doc) {
    if (!doc) return null;

    const next = { ...doc };
    if (doc._id) next._id = doc._id.toString();

    if ('departmentId' in next) {
        next.departmentId = normalizeRef(next.departmentId);
    }

    if ('branchId' in next) {
        next.branchId = normalizeRef(next.branchId);
    }

    if ('level' in next) {
        next.level = next.level || null;
        next.levelLabel = getStudentLevelLabel(next.level);
    }

    return next;
}

export async function GET(req) {
    try {
        const token = req.cookies.get(COOKIE.ACCESS)?.value;
        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const payload = verifyAccessToken(token); // { sub, role, iat, exp }

        await mongoConnect();

        const userDoc = await User.findById(payload.sub)
            .populate({
                path: 'teacherProfile',
                populate: { path: 'departmentId', select: 'name' },
            })
            .populate({
                path: 'studentProfile',
                populate: [
                    { path: 'departmentId', select: 'name' },
                    { path: 'branchId', select: 'name' },
                ],
            })
            .lean();

        if (!userDoc) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const teacher = normalizeProfile(userDoc.teacherProfile);
        const student = normalizeProfile(userDoc.studentProfile);

        const user = {
            id: userDoc._id.toString(),
            username: userDoc.username,
            role: userDoc.role,
            teacher,
            teacherId: teacher?._id ?? null,
            student,
            studentId: student?._id ?? null,
        };

        return NextResponse.json({ authenticated: true, user });
    } catch (error) {
        console.error('GET /api/auth/me error:', error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
