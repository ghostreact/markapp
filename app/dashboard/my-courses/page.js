'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '../../components/dashboard/DashboardContext';

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

function CourseCard({ course }) {
    return (
        <div className="rounded-2xl border border-base-200 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between border-b border-base-200 px-5 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        {course.code}
                    </p>
                    <h3 className="text-lg font-semibold text-base-content">{course.title}</h3>
                </div>
                <span className="badge badge-outline badge-primary">{course.credits} credits</span>
            </div>
            <div className="grid gap-3 px-5 py-4 text-sm text-base-content/80">
                <p>{course.summary}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium text-base-content/80">
                        {course.days.join(' • ')}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium text-base-content/80">
                        {course.time}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium text-base-content/80">
                        {course.location}
                    </span>
                </div>
                <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs font-medium uppercase tracking-widest text-base-content/50">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                    </div>
                    <progress
                        className="progress progress-primary h-2 w-full"
                        value={course.progress}
                        max="100"
                        aria-valuenow={course.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
                <div className="flex items-center justify-between pt-2 text-xs text-base-content/60">
                    <span>Instructor · {course.instructor}</span>
                    {course.nextSession ? (
                        <span>Next · {new Date(course.nextSession).toLocaleString()}</span>
                    ) : (
                        <span>Next session posted weekly</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MyCoursesPage() {
    const { user, loading: loadingUser } = useDashboard();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [courses, setCourses] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [student, setStudent] = useState(null);

    const isStudent = useMemo(
        () => String(user?.role || '').toLowerCase() === 'student',
        [user?.role],
    );

    useEffect(() => {
        if (loadingUser) return;
        if (!isStudent) {
            setLoading(false);
            return;
        }

        let ignore = false;

        (async () => {
            setLoading(true);
            setError('');

            const res = await fetch('/api/student/my-courses', { cache: 'no-store' });
            const data = await safeJson(res);

            if (ignore) return;

            if (!res.ok) {
                setError(data?.message || 'ไม่สามารถโหลดวิชาเรียนได้');
                setCourses([]);
                setRecommended([]);
                setStudent(null);
            } else {
                setCourses(data?.courses || []);
                setRecommended(data?.recommended || []);
                setStudent(data?.student || null);
            }

            setLoading(false);
        })();

        return () => {
            ignore = true;
        };
    }, [loadingUser, isStudent]);

    if (loadingUser || loading) {
        return (
            <div className="grid min-h-[40vh] place-items-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (!isStudent) {
        return (
            <div className="mx-auto max-w-3xl rounded-2xl border border-base-200 bg-base-100 p-10 text-center shadow-sm">
                <h1 className="text-2xl font-semibold text-base-content">Courses overview</h1>
                <p className="mt-3 text-base text-base-content/70">
                    หน้านี้ใช้สำหรับนักเรียนเท่านั้น หากคุณเป็นครู สามารถดูรายวิชาได้จากหน้าจัดการนักเรียนหรือหน้าเช็คชื่อ
                </p>
                <Link href="/dashboard" className="btn btn-primary mt-6">
                    กลับไปหน้า Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-10">
            <header className="grid gap-6 rounded-3xl bg-gradient-to-r from-primary/15 via-base-100 to-base-100 p-8 shadow-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-content shadow-md">
                    {student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                        My Courses
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-base-content">
                        สรุปรายวิชาของ {student?.name || user?.username}
                    </h1>
                    <p className="mt-3 text-sm text-base-content/70">
                        ตรวจสอบตารางเรียน ความคืบหน้า และคำแนะนำวิชาที่เหมาะสมกับแผนการเรียนของคุณ
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-base-content/60">
                        {student?.department && (
                            <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium">
                                แผนก · {student.department}
                            </span>
                        )}
                        {student?.branch && (
                            <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium">
                                สาขา · {student.branch}
                            </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-base-200 px-3 py-1 font-medium">
                            รหัสนักเรียน · {student?.studentCode}
                        </span>
                    </div>
                </div>
            </header>

            {error && (
                <div className="alert alert-error shadow-sm">
                    <span>{error}</span>
                </div>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-base-content">วิชาปัจจุบัน</h2>
                    <span className="text-sm text-base-content/60">
                        ทั้งหมด {courses.length} วิชา
                    </span>
                </div>

                {courses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-base-200 bg-base-100 p-10 text-center text-sm text-base-content/70">
                        ยังไม่พบวิชาที่ลงทะเบียน
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-base-content">คำแนะนำเพิ่มเติม</h2>
                    <span className="text-sm text-base-content/60">
                        เพื่อเสริมทักษะและความพร้อมของคุณ
                    </span>
                </div>

                {recommended.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-base-200 bg-base-100 p-10 text-center text-sm text-base-content/70">
                        ยังไม่มีคำแนะนำในขณะนี้
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recommended.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
