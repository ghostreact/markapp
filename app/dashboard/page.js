'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';



import Sidebar from '../components/dashboard/Sidebar';
import Navbar from '../components/dashboard/Navbar';
import Footer from '../components/dashboard/Footer';


export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);   // { id, role }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' });
                if (!res.ok) throw new Error('unauthorized');
                const data = await res.json();
                if (!ignore) setUser(data.user);
            } catch {
                router.replace('/login');
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, [router]);

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } finally {
            router.replace('/login');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            <div className="flex flex-1">
                <Sidebar user={user} />
                <main className="flex-1 p-4 md:p-6">
                    <RoleContent role={user?.role} />
                </main>
            </div>
            <Footer />
        </>
    );
}

/** คอนเทนต์ตัวอย่างแยกตาม role */
function RoleContent({ role }) {
    const roleKey = String(role || '').toLowerCase();
    if (roleKey === 'admin') {
        return (
            <section className="space-y-4">
                <h1 className="text-2xl font-bold">Admin Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">Users</h2><p>Total users, teachers, students…</p></div></div>
                    <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">Departments</h2><p>Manage departments/branches</p></div></div>
                </div>
            </section>
        );
    }

    if (roleKey === 'teacher') {
        return (
            <section className="space-y-4">
                <h1 className="text-2xl font-bold">Teacher Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">Today’s Attendance</h2><p>Quick check-in for classes</p><a href="/dashboard/attendance" className="btn btn-primary">Open</a></div></div>
                    <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">Students</h2><p>View and manage students in your department</p><a href="/dashboard/students" className="btn btn-outline">Manage</a></div></div>
                </div>
            </section>
        );
    }

    // student (default)
    return (
        <section className="space-y-4">
            <h1 className="text-2xl font-bold">Student Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">My Attendance</h2><p>See your history</p><a href="/dashboard/my-attendance" className="btn btn-primary">View</a></div></div>
                <div className="card bg-base-100 shadow"><div className="card-body"><h2 className="card-title">My Courses</h2><p>Courses and schedule</p><a href="/dashboard/my-courses" className="btn btn-outline">Open</a></div></div>
            </div>
        </section>
    );
}
