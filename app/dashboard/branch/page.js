'use client';

import { useEffect, useState } from 'react';

export default function BranchPage() {
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [name, setName] = useState('');
    const [depId, setDepId] = useState('');
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const [bRes, dRes] = await Promise.all([
            fetch('/api/branch', { cache: 'no-store' }),
            fetch('/api/department', { cache: 'no-store' }),
        ]);
        const bData = await bRes.json();
        const dData = await dRes.json();
        setBranches(Array.isArray(bData?.branches) ? bData.branches : bData?.data || []);
        const deps = Array.isArray(dData?.departments) ? dData.departments : dData?.data || [];
        setDepartments(deps);
        if (!depId && deps[0]?._id) setDepId(deps[0]._id);
        setLoading(false);
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    async function createBranch(e) {
        e.preventDefault();
        if (!name.trim() || !depId) return;
        const res = await fetch('/api/branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, departmentId: depId }),
        });
        if (res.ok) {
            setName('');
            await load();
        } else {
            alert((await res.json()).message || 'Create failed');
        }
    }

    async function remove(id) {
        if (!confirm('Delete this branch?')) return;
        const res = await fetch(`/api/branch/${id}`, { method: 'DELETE' });
        if (res.ok) await load();
        else alert((await res.json()).message || 'Delete failed');
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Create Branch</h2>
                    <form onSubmit={createBranch} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input className="input input-bordered" placeholder="Branch name"
                            value={name} onChange={(e) => setName(e.target.value)} />
                        <select className="select select-bordered" value={depId} onChange={(e) => setDepId(e.target.value)}>
                            <option value="" disabled>Select department</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <button className="btn btn-primary">Add</button>
                    </form>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Branches</h2>
                    {loading ? <span className="loading loading-spinner" /> : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead><tr><th>Branch</th><th>Department</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {branches.map((b) => (
                                        <tr key={b._id}>
                                            <td>{b.name}</td>
                                            <td>{b?.departmentId?.name || b.department?.name || b.departmentName}</td>
                                            <td><button className="btn btn-error btn-sm" onClick={() => remove(b._id)}>Delete</button></td>
                                        </tr>
                                    ))}
                                    {branches.length === 0 && !loading && (
                                        <tr><td colSpan={3} className="text-center opacity-60">No data</td></tr>
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
