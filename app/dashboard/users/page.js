'use client';

import { useEffect, useMemo, useState } from 'react';

export default function UsersPage() {
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [form, setForm] = useState({
        username: '', password: '',
        employeeCode: '', name: '',
        departmentId: '', branchId: '',
    });
    const [loading, setLoading] = useState(true);
    const [filterDep, setFilterDep] = useState('');

    async function load() {
        setLoading(true);
        const [tRes, dRes, bRes] = await Promise.all([
            fetch('/api/teachers', { cache: 'no-store' }),
            fetch('/api/department', { cache: 'no-store' }),
            fetch('/api/branch', { cache: 'no-store' }),
        ]);
        const tData = await tRes.json();
        const dData = await dRes.json();
        const bData = await bRes.json();

        setTeachers(tData?.data || []);
        const deps = dData?.departments || dData?.data || [];
        const brs = bData?.branches || bData?.data || [];
        setDepartments(deps);
        setBranches(brs);

        setForm(f => ({
            ...f,
            departmentId: f.departmentId || deps[0]?._id || '',
            branchId: f.branchId || '',
        }));
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    const branchesByDep = useMemo(
        () => branches.filter(b => String(b?.departmentId?._id || b.departmentId) === String(form.departmentId)),
        [branches, form.departmentId]
    );

    async function createTeacher(e) {
        e.preventDefault();
        const body = {
            username: form.username,
            password: form.password,
            employeeCode: form.employeeCode,
            name: form.name,
            departmentId: form.departmentId,
            branchId: form.branchId || undefined,
        };
        const res = await fetch('/api/teachers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (res.ok) {
            setForm({ username: '', password: '', employeeCode: '', name: '', departmentId: form.departmentId, branchId: '' });
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
        else alert((await res.json()).message || 'Delete failed');
    }

    const filteredTeachers = useMemo(() => {
        if (!filterDep) return teachers;
        return teachers.filter(t => String(t?.departmentId?._id) === String(filterDep));
    }, [teachers, filterDep]);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Create Teacher</h2>
                    <form onSubmit={createTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="input input-bordered" placeholder="Username"
                            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                        <input type="password" className="input input-bordered" placeholder="Password"
                            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        <input className="input input-bordered" placeholder="Employee Code"
                            value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} required />
                        <input className="input input-bordered" placeholder="Full name"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        <select className="select select-bordered"
                            value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value, branchId: '' })} required>
                            <option value="" disabled>Select department</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <select className="select select-bordered"
                            value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                            <option value="">(optional) Branch</option>
                            {branchesByDep.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
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
                            <select className="select select-bordered" value={filterDep} onChange={e => setFilterDep(e.target.value)}>
                                <option value="">All departments</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                            <button className="btn" onClick={load}>Refresh</button>
                        </div>
                    </div>

                    {loading ? <span className="loading loading-spinner" /> : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>EmployeeCode</th>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Department</th>
                                        <th>Branch</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTeachers.map(t => (
                                        <tr key={t._id}>
                                            <td>{t.employeeCode}</td>
                                            <td>{t.name}</td>
                                            <td>{t?.userId?.username}</td>
                                            <td>{t?.departmentId?.name}</td>
                                            <td>
                                                {t?.branchId?.name
                                                    ?? branches.find(b => String(b._id) === String(t.branchId))?.name
                                                    ?? '-'}
                                            </td>
                                            <td className="text-right">
                                                <button className="btn btn-error btn-sm" onClick={() => removeTeacher(t._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTeachers.length === 0 && !loading && (
                                        <tr><td colSpan={6} className="text-center opacity-60">No data</td></tr>
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
