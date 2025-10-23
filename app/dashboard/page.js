'use client';

import Link from 'next/link';
import { useDashboard } from '../components/dashboard/DashboardContext';

function capitalize(text, fallback = '') {
    if (typeof text !== 'string' || text.trim() === '') {
        return fallback;
    }
    const value = text.trim();
    return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function DashboardHero({ heading, description, roleName, heroCta, user, totalCards }) {
    const displayName = user?.fullName ?? user?.username ?? 'Your account';
    const badgeLabel = roleName ?? 'Workspace';
    const initial = (displayName || badgeLabel).slice(0, 1).toUpperCase();
    const ctaLabel = heroCta?.label ?? 'Explore your shortcuts';
    const ctaHint = heroCta?.hint ?? 'Pick a card below to continue.';

    return (
        <div className="relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-base-100 shadow-xl">
            <div
                className="absolute -left-20 -top-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-secondary/20 blur-3xl"
                aria-hidden="true"
            />
            <div className="relative px-6 py-8 sm:px-10 sm:py-12">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="max-w-2xl space-y-4">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                            {badgeLabel} workspace
                        </span>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
                                {heading}
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-base-content/70">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-base-200/80 bg-base-100/90 p-4 shadow-sm">
                        <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content text-lg font-semibold shadow sm:flex">
                            {initial}
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                                Signed in as
                            </p>
                            <p className="text-base font-semibold text-base-content">
                                {displayName}
                            </p>
                            <p className="text-xs text-base-content/50">Role: {badgeLabel}</p>
                        </div>
                    </div>
                </div>
                <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl border border-base-200/60 bg-base-100/70 p-4 shadow-sm">
                        <dt className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                            Quick links
                        </dt>
                        <dd className="mt-1 text-2xl font-semibold text-base-content">{totalCards}</dd>
                        <p className="mt-1 text-xs text-base-content/60">Shortcuts ready to open</p>
                    </div>
                    <div className="rounded-2xl border border-base-200/60 bg-base-100/70 p-4 shadow-sm">
                        <dt className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                            Workspace role
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-base-content">{badgeLabel}</dd>
                        <p className="mt-1 text-xs text-base-content/60">Permissions tailored to you</p>
                    </div>
                    <div className="rounded-2xl border border-base-200/60 bg-base-100/70 p-4 shadow-sm">
                        <dt className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                            Suggested next step
                        </dt>
                        <dd className="mt-1 text-base font-semibold text-base-content">{ctaLabel}</dd>
                        <p className="mt-1 text-xs text-base-content/60">{ctaHint}</p>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function QuickLinkCard({ title, description, href, actionText, variant = 'primary', icon: Icon }) {
    const buttonClass =
        variant === 'outline'
            ? 'btn btn-outline btn-sm border-primary text-primary hover:bg-primary/10'
            : 'btn btn-primary btn-sm shadow';
    const abbreviation = title
        .split(' ')
        .filter(Boolean)
        .map((word) => word.slice(0, 1))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-base-200 bg-base-100/90 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
                aria-hidden="true"
            />
            <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                            {Icon ? <Icon className="h-5 w-5" /> : abbreviation}
                        </span>
                        <h2 className="text-lg font-semibold text-base-content">{title}</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
                </div>
                <div>
                    <Link href={href} className={buttonClass}>
                        {actionText}
                    </Link>
                </div>
            </div>
        </div>
    );
}

const contentByRole = {
    admin: {
        heading: 'Admin Overview',
        roleName: 'Admin',
        description:
            'Keep your organisation running smoothly with quick access to people, departments, and locations.',
        heroCta: {
            label: 'Review departments',
            hint: 'Make sure team information stays accurate.',
        },
        gridClass: 'md:grid-cols-2 lg:grid-cols-3',
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
        roleName: 'Teacher',
        description:
            'Stay organised for today’s classes with quick access to attendance, student details, and history.',
        heroCta: {
            label: 'Take attendance',
            hint: 'Jump straight into marking today’s class.',
        },
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
        roleName: 'Student',
        description:
            'Stay on top of attendance, courses, and account details with tools curated for your studies.',
        heroCta: {
            label: 'Check your attendance',
            hint: 'Keep track of your daily record in seconds.',
        },
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

function RoleContent({ role, user }) {
    const key = String(role || '').toLowerCase();
    const config = contentByRole[key] ?? contentByRole.student;
    const roleName = config.roleName ?? capitalize(key, 'Student');
    const gridClass = ['grid', 'grid-cols-1', 'gap-6', config.gridClass]
        .filter(Boolean)
        .join(' ');

    return (
        <section className="space-y-10">
            <DashboardHero
                heading={config.heading}
                description={config.description}
                roleName={roleName}
                heroCta={config.heroCta}
                user={user}
                totalCards={config.cards.length}
            />
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
            <RoleContent role={user?.role} user={user} />
        </div>
    );
}
