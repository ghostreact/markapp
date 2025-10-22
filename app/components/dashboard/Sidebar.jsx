'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const menuByRole = {
    admin: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/users', label: 'Manage Users' },
        { href: '/dashboard/department', label: 'Departments' },
        { href: '/dashboard/branch', label: 'Branches' },
        { href: '/profile', label: 'Profile' },
    ],
    teacher: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/students', label: 'Students' },
        { href: '/dashboard/attendance', label: 'Attendance' },
        { href: '/dashboard/attendance/history', label: 'History' },
        { href: '/profile', label: 'Profile' },
    ],
    student: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/my-attendance', label: 'My Attendance' },
        { href: '/dashboard/my-courses', label: 'My Courses' },
        { href: '/profile', label: 'Profile' },
    ],
};

export function getMenuItems(role) {
    const roleKey = String(role || '').toLowerCase();
    return menuByRole[roleKey] ?? menuByRole.student;
}

export default function Sidebar({ user, items, onNavigate }) {
    const pathname = usePathname();
    const menuItems = items ?? getMenuItems(user?.role);

    const isActive = (href) => {
        if (href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="flex h-full flex-col bg-base-100">
            <div className="border-b border-base-200 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-base-content/70">
                    Signed in as
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold">
                    <span className="badge badge-neutral">{user?.role || 'User'}</span>
                    <span className="text-base-content/70">{user?.username ?? ''}</span>
                </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1 text-sm">
                    {menuItems.map((item) => {
                        const active = isActive(item.href);
                        const className = [
                            'flex items-center rounded-lg px-3 py-2 transition-colors',
                            active
                                ? 'bg-primary/10 text-primary'
                                : 'text-base-content/80 hover:bg-base-200 hover:text-base-content',
                        ].join(' ');

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={className}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => onNavigate?.()}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
