'use client';

import Link from 'next/link';
import { useDashboard } from '../components/dashboard/DashboardContext';

const contentByRole = {
    admin: {
        heading: 'Admin Overview',
        gridClass: 'lg:grid-cols-3 md:grid-cols-2',
        cards: [
            {
                title: 'Manage Users',
                description: 'Invite, update, or deactivate users across the system.',
                href: '/dashboard/users',
                actionText: 'Manage',
            },
            {
                title: 'Departments',
                description: 'Review or edit the departments that belong to your organisation.',
                href: '/dashboard/department',
                actionText: 'Open',
            },
            {
                title: 'Branches',
                description: 'Keep branch information up to date for scheduling and reporting.',
                href: '/dashboard/branch',
                actionText: 'Open',
            },
        ],
    },
    teacher: {
        heading: 'Teacher Overview',
        gridClass: 'md:grid-cols-2',
        cards: [
            {
                title: 'Take Attendance',
                description: 'Record attendance for today’s class in one place.',
                href: '/dashboard/attendance',
                actionText: 'Open',
            },
            {
                title: 'Student List',
                description: 'View and manage the students in your department.',
                href: '/dashboard/students',
                actionText: 'Manage',
            },
            {
                title: 'Attendance History',
                description: 'Review past attendance submissions for quick audits.',
                href: '/dashboard/attendance/history',
                actionText: 'Review',
                variant: 'outline',
            },
        ],
    },
    student: {
        heading: 'Student Overview',
        gridClass: 'md:grid-cols-2',
        cards: [
            {
                title: 'My Attendance',
                description: 'Check your attendance record and keep track of every day.',
                href: '/dashboard/my-attendance',
                actionText: 'View',
            },
            {
                title: 'My Courses',
                description: 'See course information and schedules in one place.',
                href: '/dashboard/my-courses',
                actionText: 'Open',
                variant: 'outline',
            },
            {
                title: 'Profile',
                description: 'Update your contact details and password.',
                href: '/profile',
                actionText: 'Edit',
            },
        ],
    },
};

function QuickLinkCard({ title, description, href, actionText, variant = 'primary' }) {
    const buttonClass =
        variant === 'outline'
            ? 'btn btn-outline btn-sm'
            : 'btn btn-primary btn-sm';

    return (
        <div className="card h-full bg-base-100 shadow-sm transition hover:shadow-md">
            <div className="card-body">
                <h2 className="card-title text-lg">{title}</h2>
                <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
                <div className="pt-4">
                    <Link href={href} className={buttonClass}>
                        {actionText}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function RoleContent({ role }) {
    const key = String(role || '').toLowerCase();
    const config = contentByRole[key] ?? contentByRole.student;
    const gridClass = ['grid', 'grid-cols-1', 'gap-6', config.gridClass]
        .filter(Boolean)
        .join(' ');

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-base-content">
                    {config.heading}
                </h1>
                <p className="mt-2 text-sm text-base-content/70">
                    Choose a section below to jump straight into your most common tasks.
                </p>
            </div>
            <div className={gridClass}>
                {config.cards.map((card) => (
                    <QuickLinkCard key={card.href} {...card} />
                ))}
            </div>
        </section>
    );
}

export default function DashboardPage() {
    const { user, loading } = useDashboard();

    if (loading && !user) {
        return (
            <div className="p-8">
                <div className="grid place-items-center">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <RoleContent role={user?.role} />
        </div>
    );
}
