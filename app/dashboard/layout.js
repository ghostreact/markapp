'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/dashboard/Navbar';
import Sidebar, { getMenuItems } from '../components/dashboard/Sidebar';
import Footer from '../components/dashboard/Footer';
import { DashboardProvider } from '../components/dashboard/DashboardContext';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/auth/me', {
                credentials: 'include',
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error('unauthorized');
            }

            const data = await res.json();
            setUser(data?.user ?? null);
        } catch (err) {
            console.error('Failed to load dashboard user', err);
            router.replace('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            await fetchUser();
            if (cancelled) {
                return;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fetchUser]);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } finally {
            router.replace('/login');
        }
    }, [router]);

    const menuItems = getMenuItems(user?.role);

    const contextValue = useMemo(
        () => ({
            user,
            loading,
            refresh: fetchUser,
        }),
        [user, loading, fetchUser],
    );

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <DashboardProvider value={contextValue}>
            <div className="min-h-screen bg-base-200">
                <Navbar
                    user={user}
                    onLogout={handleLogout}
                    onToggleSidebar={() => setSidebarOpen(true)}
                    menuItems={menuItems}
                    loading={loading}
                />

                <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 sm:px-6 lg:px-8">
                    <aside className="hidden shrink-0 md:block md:w-64 md:py-8">
                        <div className="sticky top-20 rounded-xl border border-base-200 bg-base-100 shadow-sm">
                            <Sidebar user={user} items={menuItems} />
                        </div>
                    </aside>

                    <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col py-6 md:py-8">
                        <main className="flex-1">
                            {loading && !user ? (
                                <div className="grid flex-1 place-items-center">
                                    <span className="loading loading-spinner loading-lg text-primary" />
                                </div>
                            ) : (
                                <div className="w-full space-y-10 pb-10">{children}</div>
                            )}
                        </main>
                        <Footer />
                    </div>
                </div>

                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden">
                        <div className="w-72 max-w-[80vw] border-r border-base-200 bg-base-100 shadow-2xl">
                            <Sidebar
                                user={user}
                                items={menuItems}
                                onNavigate={closeSidebar}
                            />
                        </div>
                        <button
                            type="button"
                            className="flex-1 bg-black/40"
                            aria-label="Close navigation"
                            onClick={closeSidebar}
                        />
                    </div>
                )}
            </div>
        </DashboardProvider>
    );
}
