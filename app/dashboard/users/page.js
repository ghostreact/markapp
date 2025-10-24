'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    STUDENT_LEVELS,
    getYearsForLevel,
    getRooms,
    formatClassLabel,
} from '@/lib/constants/student-levels';

const DEFAULT_LEVEL = STUDENT_LEVELS[0]?.value || '';
const LEVEL_LABEL_MAP = Object.fromEntries(STUDENT_LEVELS.map((opt) => [opt.value, opt.label]));

export default function UsersPage() {
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    // branch ถูกถอดจาก UI
    const [branches, setBranches] = useState([]);
    const [form, setForm] = useState({
        username: '',
        password: '',
        employeeCode: '',
        name: '',
        departmentId: '',
        level: DEFAULT_LEVEL,
        homerooms: [],
    });
    const [loading, setLoading] = useState(true);
    const [filterDep, setFilterDep] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [hrLevel, setHrLevel] = useState(DEFAULT_LEVEL);
    const [hrYear, setHrYear] = useState(1);
    const [hrRoom, setHrRoom] = useState(1);

    async function load() {
        setLoading(true);
        const [tRes, dRes, bRes] = await Promise.all([
            fetch('/api/teachers', { cache: 'no-store' }),
            fetch('/api/department', { cache: 'no-store' }),
            fetch('/api/branch', { cache: 'no-store' }),
        ]);
        const tData = await tRes.json().catch(() => ({}));
        const dData = await dRes.json().catch(() => ({}));
        const bData = await bRes.json().catch(() => ({}));

        setTeachers(tData?.data || []);
        const deps = dData?.departments || dData?.data || [];
        const brs = bData?.branches || bData?.data || [];
        setDepartments(deps);
        setBranches(brs);

        setForm((prev) => ({
            ...prev,
            departmentId: prev.departmentId || deps[0]?._id || '',
            level: prev.level || DEFAULT_LEVEL,
            homerooms: prev.homerooms || [],
        }));
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    const branchesByDep = useMemo(
        () => [],
        [form.departmentId],
    );

    function addHomeroom() {
        const entry = { level: hrLevel, year: hrYear, room: hrRoom };
        const key = (h) => `${h.level}:${h.year}:${h.room}`;
        const exists = (form.homerooms || []).some((h) => key(h) === key(entry));
        if (exists) return;
        setForm((prev) => ({ ...prev, homerooms: [...(prev.homerooms || []), entry] }));
    }

    function removeHomeroom(idx) {
        setForm((prev) => ({
            ...prev,
            homerooms: (prev.homerooms || []).filter((_, i) => i !== idx),
        }));
    }

    async function createTeacher(e) {
        e.preventDefault();
        const body = {
            username: form.username,
            password: form.password,
            employeeCode: form.employeeCode,
            name: form.name,
            departmentId: form.departmentId,
            level: form.level,
            homerooms: form.homerooms || [],
        };
        const res = await fetch('/api/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            setForm({
                username: '',
                password: '',
                employeeCode: '',
                name: '',
                departmentId: form.departmentId,
                level: DEFAULT_LEVEL,
                homerooms: [],
            });
            await load();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Create failed');
        }
    }

    async function removeTeacher(id) {
        if (!confirm('Delete this teacher?')) return;
        const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
        if (res.ok) await load();
        else alert((await res.json().catch(() => ({}))).message || 'Delete failed');
    }

    const filteredTeachers = useMemo(() => {
        return teachers.filter((t) => {
            if (filterDep && String(t?.departmentId?._id || t.departmentId) !== String(filterDep)) {
                return false;
            }
            if (filterLevel && String(t.level) !== String(filterLevel)) {
                return false;
            }
            return true;
        });
    }, [teachers, filterDep, filterLevel]);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Create Teacher</h2>
                    <form onSubmit={createTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            className="input input-bordered"
                            placeholder="Username"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            className="input input-bordered"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        <input
                            className="input input-bordered"
                            placeholder="Employee Code"
                            value={form.employeeCode}
                            onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                            required
                        />
                        <input
                            className="input input-bordered"
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <select
                            className="select select-bordered"
                            value={form.departmentId}
                            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select department</option>
                            {departments.map((d) => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                        <select
                            className="select select-bordered"
                            value={form.level}
                            onChange={(e) => setForm({ ...form, level: e.target.value, homerooms: [] })}
                            required
                        >
                            <option value="" disabled>Select level</option>
                            {STUDENT_LEVELS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {/* Homeroom assignment controls */}
                        <div className="md:col-span-2 border rounded p-3">
                            <div className="font-semibold mb-2">Homeroom Assignments</div>
                            <div className="flex flex-col md:flex-row gap-2 items-start">
                                <select
                                    className="select select-bordered"
                                    value={hrLevel}
                                    onChange={(e) => { setHrLevel(e.target.value); setHrYear(1); }}
                                >
                                    {STUDENT_LEVELS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <select
                                    className="select select-bordered"
                                    value={hrYear}
                                    onChange={(e) => setHrYear(Number(e.target.value))}
                                >
                                    {getYearsForLevel(hrLevel).map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <select
                                    className="select select-bordered"
                                    value={hrRoom}
                                    onChange={(e) => setHrRoom(Number(e.target.value))}
                                >
                                    {getRooms().map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                                <button type="button" className="btn" onClick={addHomeroom}>Add</button>
                            </div>
                            {(form.homerooms || []).length > 0 && (
                                <ul className="mt-3 space-y-1">
                                    {form.homerooms.map((h, idx) => (
                                        <li key={`${h.level}-${h.year}-${h.room}`} className="flex items-center justify-between">
                                            <span>{formatClassLabel(h.level, h.year, h.room)}</span>
                                            <button type="button" className="btn btn-xs" onClick={() => removeHomeroom(idx)}>Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <button className="btn btn-primary">Create</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <h2 className="card-title">Teachers</h2>
                        <div className="flex gap-2">
                            <select
                                className="select select-bordered"
                                value={filterDep}
                                onChange={(e) => setFilterDep(e.target.value)}
                            >
                                <option value="">All departments</option>
                                {departments.map((d) => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                            <select
                                className="select select-bordered"
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                            >
                                <option value="">All levels</option>
                                {STUDENT_LEVELS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button className="btn" onClick={load}>Refresh</button>
                        </div>
                    </div>

                    {loading ? (
                        <span className="loading loading-spinner" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Employee Code</th>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Department</th>
                                        <th>Level</th>
                                        <th>Homerooms</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeachers.map((t) => (
                                        <tr key={t._id}>
                                            <td>{t.employeeCode}</td>
                                            <td>{t.name}</td>
                                            <td>{t?.userId?.username}</td>
                                            <td>{t?.departmentId?.name || '-'}</td>
                                            <td>{LEVEL_LABEL_MAP[t.level] || '-'}</td>
                                            <td>
                                                {(t.homerooms || []).length
                                                    ? (t.homerooms || []).map((h) => formatClassLabel(h.level, h.year, h.room)).join(', ')
                                                    : '-'}
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    className="btn btn-error btn-sm"
                                                    onClick={() => removeTeacher(t._id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTeachers.length === 0 && !loading && (
                                        <tr><td colSpan={7} className="text-center opacity-60">No data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
