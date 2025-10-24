'use client';

import { useEffect, useMemo, useState } from 'react';

const STATUS_OPTIONS = ['', 'Present', 'Late', 'Leave', 'Absent'];
const STATUS_BADGE = {
    Present: 'badge-success',
    Late: 'badge-warning',
    Leave: 'badge-info',
    Absent: 'badge-error',
};

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}

function defaultDateRange(days = 30) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
    };
}

function formatDate(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.valueOf())) return iso;
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return iso;
    }
}

export default function MyAttendancePage() {
    const initialRange = useMemo(() => defaultDateRange(30), []);

    const [form, setForm] = useState(() => ({ ...initialRange, status: '' }));
    const [filters, setFilters] = useState(() => ({ ...initialRange, status: '' }));

    const [student, setStudent] = useState(null);
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ total: 0, Present: 0, Late: 0, Leave: 0, Absent: 0 });
    const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function load(page = 1, nextFilters = filters) {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(meta.limit || 20));
        params.set('sort', '-date');

        if (nextFilters.from) params.set('from', nextFilters.from);
        if (nextFilters.to) params.set('to', nextFilters.to);
        if (nextFilters.status) params.set('status', nextFilters.status);

        const res = await fetch(`/api/student/my-attendance?${params.toString()}`, { cache: 'no-store' });
        const data = await safeJson(res);

        if (!res.ok) {
            setError(data?.message || 'Failed to load attendance history');
            setRecords([]);
            setStats({ total: 0, Present: 0, Late: 0, Leave: 0, Absent: 0 });
            setMeta((prev) => ({ ...prev, page }));
        } else {
            setStudent(data?.student || null);
            setRecords(data?.data || []);
            setStats(data?.stats || { total: 0, Present: 0, Late: 0, Leave: 0, Absent: 0 });
            setMeta({
                page: data?.meta?.page ?? page,
                limit: data?.meta?.limit ?? meta.limit ?? 20,
                total: data?.meta?.total ?? 0,
                totalPages: data?.meta?.totalPages ?? 1,
                hasNext: data?.meta?.hasNext ?? false,
                hasPrev: data?.meta?.hasPrev ?? false,
            });
        }

        setLoading(false);
    }

    useEffect(() => {
        load(1, filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleApply() {
        setFilters(form);
        load(1, form);
    }

    function handleReset() {
        const next = { ...defaultDateRange(30), status: '' };
        setForm(next);
        setFilters(next);
        load(1, next);
    }

    function goToPage(nextPage) {
        if (nextPage < 1 || nextPage > meta.totalPages || nextPage === meta.page) return;
        load(nextPage, filters);
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div className="breadcrumbs">
                <ul>
                    <li><a href="/dashboard">Dashboard</a></li>
                    <li>My Attendance</li>
                </ul>
            </div>

            {student && (
                <div className="card bg-base-200">
                    <div className="card-body">
                        <h2 className="card-title">Student Profile</h2>
                        <div className="grid gap-3 md:grid-cols-5">
                            <div>
                                <p className="text-sm opacity-70">Name</p>
                                <p className="font-medium">{student.name}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Student Code</p>
                                <p className="font-medium">{student.studentCode}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Level</p>
                                <p className="font-medium">{student.levelLabel || student.level || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Branch</p>
                                <p className="font-medium">{student.branch?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm opacity-70">Department</p>
                                <p className="font-medium">{student.department?.name || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">Filters</h3>
                    <div className="grid gap-3 md:grid-cols-5">
                        <input
                            type="date"
                            className="input input-bordered"
                            value={form.from}
                            onChange={(e) => setForm((prev) => ({ ...prev, from: e.target.value }))}
                        />
                        <input
                            type="date"
                            className="input input-bordered"
                            value={form.to}
                            onChange={(e) => setForm((prev) => ({ ...prev, to: e.target.value }))}
                        />
                        <select
                            className="select select-bordered"
                            value={form.status}
                            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {STATUS_OPTIONS.filter(Boolean).map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <button className="btn btn-primary" onClick={handleApply} disabled={loading}>
                            Apply
                        </button>
                        <button className="btn btn-ghost" onClick={handleReset} disabled={loading}>
                            Reset
                        </button>
                    </div>
                    {error && (
                        <div className="alert alert-error mt-3">
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {['Present', 'Late', 'Leave', 'Absent'].map((status) => (
                    <div key={status} className="stat bg-base-100 shadow rounded-box">
                        <div className="stat-title">{status}</div>
                        <div className="stat-value text-2xl">{stats?.[status] ?? 0}</div>
                    </div>
                ))}
                <div className="stat bg-base-100 shadow rounded-box">
                    <div className="stat-title">Total Records</div>
                    <div className="stat-value text-2xl">{stats?.total ?? 0}</div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">Attendance History</h3>
                    {loading ? (
                        <div className="py-12 grid place-items-center">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    ) : records.length === 0 ? (
                        <p className="opacity-70">No attendance records found for the selected range.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Recorded</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((rec) => (
                                        <tr key={rec.id}>
                                            <td>{formatDate(rec.date)}</td>
                                            <td>
                                                <span className={`badge ${STATUS_BADGE[rec.status] || 'badge-ghost'}`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                            <td className="text-sm opacity-70">
                                                {formatDate(rec.updatedAt || rec.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                        <div>
                            <p className="text-sm opacity-70">
                                Showing {records.length} of {meta.total} records
                            </p>
                        </div>
                        <div className="join">
                            <button
                                className="join-item btn btn-sm"
                                onClick={() => goToPage(meta.page - 1)}
                                disabled={loading || !meta.hasPrev}
                            >
                                Previous
                            </button>
                            <button className="join-item btn btn-sm btn-ghost" disabled>
                                Page {meta.page} / {meta.totalPages}
                            </button>
                            <button
                                className="join-item btn btn-sm"
                                onClick={() => goToPage(meta.page + 1)}
                                disabled={loading || !meta.hasNext}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
