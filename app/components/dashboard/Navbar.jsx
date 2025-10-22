'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function MenuButton({ onClick }) {
    return (
        <button
            type="button"
            className="btn btn-ghost btn-square"
            onClick={onClick}
            aria-label="Open navigation"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-5 w-5"
                strokeWidth="1.5"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
}

export default function Navbar({ user, onLogout, onToggleSidebar, menuItems = [], loading }) {
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const userInitial = (user?.role || 'U').slice(0, 1).toUpperCase();

    return (
        <header className="sticky top-0 z-50 border-b border-base-200 bg-base-100/80 backdrop-blur supports-[backdrop-filter]:bg-base-100/70">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <div className="md:hidden">
                        <MenuButton onClick={onToggleSidebar} />
                    </div>
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 rounded-full bg-base-100/70 px-3 py-1 text-base font-semibold tracking-tight shadow-sm transition hover:shadow"
                    >
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                            MS
                        </span>
                        <span className="hidden sm:inline-block text-base-content">My School</span>
                    </Link>
                    <nav className="hidden md:flex md:items-center md:gap-1.5 lg:gap-2.5">
                        {menuItems.map((item) => {
                            const active = isActive(item.href);
                            const className = [
                                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-primary text-primary-content shadow-sm'
                                    : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
                            ].join(' ');

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={className}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {loading && (
                        <span
                            className="loading loading-spinner loading-sm text-primary"
                            aria-label="Loading user"
                        />
                    )}
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost gap-2 rounded-full px-2">
                            <div className="avatar placeholder">
                                <div className="w-9 rounded-full bg-primary/90 text-primary-content shadow-sm">
                                    <span className="text-xs font-semibold">{userInitial}</span>
                                </div>
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                                    {user?.role || 'User'}
                                </p>
                                <p className="text-sm font-medium text-base-content">
                                    {user?.username}
                                </p>
                            </div>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu dropdown-content rounded-2xl border border-base-200 bg-base-100 p-3 shadow-lg"
                        >
                            <li>
                                <Link href="/profile" className="rounded-lg px-3 py-2 text-sm font-medium">
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={onLogout}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-error hover:bg-error/10"
                                >
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
}
