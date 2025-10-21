'use client';

const menuByRole = {
    admin: [
        { href: '/dashboard', label: 'Overview', icon: '🏠' },
        { href: '/dashboard/users', label: 'Manage Users', icon: '👥' },
        { href: '/dashboard/department', label: 'Departments', icon: '🏛️' },
        { href: '/dashboard/branch', label: 'Branches', icon: '🌿' },
        // { href: '/dashboard/reports', label: 'Reports', icon: '📊' },
    ],
    teacher: [
        { href: '/dashboard', label: 'Overview', icon: '🏠' },
        { href: '/dashboard/students', label: 'Students', icon: '🎓' },
        { href: '/dashboard/attendance', label: 'Attendance', icon: '🗓️' },
        { href: '/dashboard/classes', label: 'Classes', icon: '📘' },
    ],
    student: [
        { href: '/dashboard', label: 'Overview', icon: '🏠' },
        { href: '/dashboard/my-attendance', label: 'My Attendance', icon: '🗓️' },
        { href: '/dashboard/my-courses', label: 'My Courses', icon: '📚' },
    ],
};

export default function Sidebar({ user }) {
    const roleKey = String(user?.role || '').toLowerCase();
    const items = menuByRole[roleKey] ?? menuByRole.student;

    return (
        <aside className="w-64 bg-base-200 h-full hidden md:block">
            <div className="p-4 pb-2 text-sm opacity-70">Signed in as <span className="badge badge-neutral ml-1">{user?.role}</span></div>
            <ul className="menu p-2">
                {items.map((m) => (
                    <li key={m.href}>
                        <a href={m.href}>
                            <span className="mr-2">{m.icon}</span>
                            {m.label}
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
