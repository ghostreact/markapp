'use client';

import Link from 'next/link';
import { useDashboard } from '../components/dashboard/DashboardContext';
import { getStudentLevelLabel } from '@/lib/constants/student-levels';

function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-1 rounded-lg bg-base-100 p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                {label}
            </span>
            <span className="text-sm font-medium text-base-content">
                {value ?? '-'}
            </span>
        </div>
    );
}

function SectionCard({ title, subtitle, children, action }) {
    return (
        <section className="rounded-2xl border border-base-200 bg-base-100 shadow-sm transition hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 px-5 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-base-content">{title}</h2>
                    {subtitle && (
                        <p className="text-xs text-base-content/60">{subtitle}</p>
                    )}
                </div>
                {action}
            </div>
            <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
                {children}
            </div>
        </section>
    );
}

export default function ProfilePage() {
    const { user, loading } = useDashboard();

    if (loading && !user) {
        return (
            <div className="grid min-h-[40vh] place-items-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    const teacher = user?.teacher || null;
    const student = user?.student || null;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <header className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-primary/10 via-base-100 to-base-100 p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-widest text-primary">
                    Profile
                </p>
                <h1 className="text-3xl font-semibold text-base-content">
                    {teacher?.name || student?.name || user?.username}
                </h1>
                <p className="max-w-2xl text-sm text-base-content/70">
                    Manage your personal information. Details update automatically from
                    the system – contact an administrator if something looks incorrect.
                </p>
            </header>

            <SectionCard
                title="Account"
                subtitle="Basic information used to sign in and determine your permissions."
                action={
                    <Link href="/dashboard" className="btn btn-sm btn-outline">
                        Back to Dashboard
                    </Link>
                }
            >
                <InfoRow label="Username" value={user?.username} />
                <InfoRow label="Role" value={user?.role} />
                {teacher?.departmentId?.name && (
                    <InfoRow label="Department" value={teacher.departmentId.name} />
                )}
                {student?.departmentId?.name && (
                    <InfoRow label="Department" value={student.departmentId.name} />
                )}
            </SectionCard>

            {teacher && (
                <SectionCard
                    title="Teacher Details"
                    subtitle="Information about your teaching profile."
                    action={
                        <span className="badge badge-primary badge-outline">
                            Teacher
                        </span>
                    }
                >
                    <InfoRow label="Full Name" value={teacher.name} />
                    <InfoRow label="Employee Code" value={teacher.employeeCode} />
                    <InfoRow
                        label="Level"
                        value={teacher.levelLabel || teacher.level || '-'}
                    />
                    <InfoRow
                        label="Department"
                        value={teacher.departmentId?.name || '-'}
                    />
                </SectionCard>
            )}

            {student && (
                <SectionCard
                    title="Student Details"
                    subtitle="Information about your student record."
                    action={
                        <span className="badge badge-secondary badge-outline">
                            Student
                        </span>
                    }
                >
                    <InfoRow label="Full Name" value={student.name} />
                    <InfoRow label="Student Code" value={student.studentCode} />
                    <InfoRow
                        label="Level"
                        value={getStudentLevelLabel(student.level)}
                    />
                    <InfoRow label="Year" value={student.year} />
                    <InfoRow label="Room" value={student.room} />
                    <InfoRow
                        label="Department"
                        value={student.departmentId?.name || '-'}
                    />
                </SectionCard>
            )}
        </div>
    );
}
