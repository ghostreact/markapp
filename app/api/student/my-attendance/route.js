export const runtime = 'nodejs';

import mongoConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { Attendance } from '@/Models';
import { COOKIE } from '@/lib/cookie';
import { verifyAccessToken } from '@/lib/jwt';
import { User } from '@/Models';
import { getStudentLevelLabel } from '@/lib/constants/student-levels';

const STATUS_OPTIONS = ['Present', 'Late', 'Leave', 'Absent'];

function normalizeEntity(entity) {
    if (!entity) return null;
    if (typeof entity === 'string') {
        return { id: entity, name: null };
    }
    if (entity._id) {
        return {
            id: entity._id.toString(),
            name: entity.name ?? null,
        };
    }
    return null;
}

function normalizeStudent(student) {
    if (!student) return null;
    return {
        id: student._id.toString(),
        studentCode: student.studentCode,
        name: student.name,
        level: student.level || null,
        levelLabel: getStudentLevelLabel(student.level),
        branch: normalizeEntity(student.branchId),
        department: normalizeEntity(student.departmentId),
    };
}

function parseDateOnly(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return null;
    return date;
}

export async function GET(request) {
    try {
        const token = request.cookies.get(COOKIE.ACCESS)?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyAccessToken(token); // { sub, role, ... }
        await mongoConnect();

        const userDoc = await User.findById(payload.sub)
            .populate({
                path: 'studentProfile',
                populate: [
                    { path: 'branchId', select: 'name' },
                    { path: 'departmentId', select: 'name' },
                ],
            })
            .lean();

        const studentProfile = userDoc?.studentProfile;
        if (!studentProfile) {
            return NextResponse.json({ message: 'Student profile not found' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
        const statusFilter = searchParams.get('status') || '';
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');
        const sortParam = searchParams.get('sort') || '-date';

        if (statusFilter && !STATUS_OPTIONS.includes(statusFilter)) {
            return NextResponse.json({ message: 'Invalid status filter' }, { status: 400 });
        }

        const filter = { studentId: studentProfile._id };

        const fromDate = parseDateOnly(fromStr);
        const toDate = parseDateOnly(toStr);

        if (fromStr && !fromDate) {
            return NextResponse.json({ message: 'Invalid from date' }, { status: 400 });
        }
        if (toStr && !toDate) {
            return NextResponse.json({ message: 'Invalid to date' }, { status: 400 });
        }

        if (fromDate || toDate) {
            const dateFilter = {};
            if (fromDate) {
                const start = new Date(fromDate);
                start.setHours(0, 0, 0, 0);
                dateFilter.$gte = start;
            }
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.$lte = end;
            }
            filter.date = dateFilter;
        }

        if (statusFilter) {
            filter.status = statusFilter;
        }

        const skip = (page - 1) * limit;

        const [records, total, statsDocs] = await Promise.all([
            Attendance.find(filter)
                .sort(sortParam)
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(filter),
            Attendance.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const normalizedRecords = records.map((rec) => ({
            id: rec._id.toString(),
            date: rec.date instanceof Date ? rec.date.toISOString() : rec.date,
            status: rec.status,
            createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : rec.createdAt ?? null,
            updatedAt: rec.updatedAt instanceof Date ? rec.updatedAt.toISOString() : rec.updatedAt ?? null,
        }));

        const stats = {
            total: 0,
            Present: 0,
            Late: 0,
            Leave: 0,
            Absent: 0,
        };
        for (const doc of statsDocs) {
            if (stats[doc._id] !== undefined) {
                stats[doc._id] = doc.count;
                stats.total += doc.count;
            }
        }

        const meta = {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            hasNext: skip + normalizedRecords.length < total,
            hasPrev: page > 1,
            sort: sortParam,
        };

        return NextResponse.json({
            student: normalizeStudent(studentProfile),
            data: normalizedRecords,
            count: normalizedRecords.length,
            meta,
            stats,
        });
    } catch (error) {
        console.error('GET /api/student/my-attendance error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
