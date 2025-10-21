'use client';

import { useEffect, useState } from 'react';

export default function DepartmentPage() {
    const [list, setList] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await fetch('/api/department', { cache: 'no-store' });
        const data = await res.json();
        setList(Array.isArray(data?.departments) ? data.departments : data?.data || []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function createDep(e) {
        e.preventDefault();
        if (!name.trim()) return;
        const res = await fetch('/api/department', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (res.ok) {
            setName('');
            await load();
        } else {
            alert((await res.json()).message || 'Create failed');
        }
    }

    async function remove(id) {
        if (!confirm('Delete this department?')) return;

        const res = await fetch(`/api/department/${id}`, { method: 'DELETE' });

        if (res.ok) {
            await load();
            return;
        } else {
            const datas = await res.json().catch(() => ({}));
            alert(datas.message || `Delete failed (${res.status})`);
        }

        // ✅ พยายามอ่าน JSON ถ้าไม่ได้ก็ fallback เป็นข้อความ/สถานะ
        let msg = `Delete failed (${res.status})`;
        try {
            const data = await res.clone().json();
            if (data?.message) msg = data.message;
        } catch {
            try {
                const text = await res.text();
                if (text) msg = text;
            } catch { }
        }
        alert(msg);
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Create Department</h2>
                    <form onSubmit={createDep} className="flex gap-2">
                        <input className="input input-bordered w-full" placeholder="Department name"
                            value={name} onChange={(e) => setName(e.target.value)} />
                        <button className="btn btn-primary">Add</button>
                    </form>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Departments</h2>
                    {loading ? <span className="loading loading-spinner" /> : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead><tr><th>Name</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {list.map((d) => (
                                        <tr key={d._id}>
                                            <td>{d.name}</td>
                                            <td>
                                                <button className="btn btn-error btn-sm" onClick={() => remove(d._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {list.length === 0 && !loading && (
                                        <tr><td colSpan={2} className="text-center opacity-60">No data</td></tr>
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
