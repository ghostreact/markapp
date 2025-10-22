'use client';

import { useEffect, useMemo, useState } from 'react';

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

export default function StudentsPage() {
  const [me, setMe] = useState(null);           // { id, role, teacher:{ _id, ... } }
  const [teacherId, setTeacherId] = useState('');

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ depId: '', branchId: '' });

  const [form, setForm] = useState({
    studentCode: '', name: '',
    username: '', password: '',
    departmentId: '', branchId: '',
  });

  // โหลดข้อมูลผู้ใช้ + ตั้ง teacherId
  async function loadMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await safeJson(res);
    setMe(data?.user || null);
    // พยายามดึง teacherId จากหลายรูปแบบ (ขึ้นกับ API ของคุณ)
    const tId =
      data?.user?.teacher?._id ||
      data?.user?.teacherId?._id ||
      data?.user?.teacherId ||
      (data?.user?.role === 'Teacher' ? data?.user?.id : '');

    if (tId) setTeacherId(String(tId));
  }

  // โหลด lists (students/departments/branches)
  async function loadLists() {
    setLoading(true);
    const [sRes, dRes, bRes] = await Promise.all([
      fetch('/api/student',    { cache: 'no-store' }),
      fetch('/api/department', { cache: 'no-store' }),
      fetch('/api/branch',     { cache: 'no-store' }),
    ]);

    const s = await safeJson(sRes);
    const d = await safeJson(dRes);
    const b = await safeJson(bRes);

    setStudents(s?.data || s?.students || []);
    const deps = d?.departments || d?.data || [];
    const brs  = b?.branches   || b?.data || [];
    setDepartments(deps);
    setBranches(brs);

    setForm(f => ({ ...f, departmentId: f.departmentId || deps[0]?._id || '' }));
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadLists();
    })();
  }, []);

  const branchesByDep = useMemo(
    () => branches.filter(b => String(b?.departmentId?._id || b.departmentId) === String(form.departmentId)),
    [branches, form.departmentId]
  );

  const filtered = useMemo(() => {
    let arr = students;
    if (filter.depId) {
      arr = arr.filter(s => String(s?.departmentId?._id || s.departmentId) === String(filter.depId));
    }
    if (filter.branchId) {
      arr = arr.filter(s => String(s?.branchId?._id || s.branchId) === String(filter.branchId));
    }
    return arr;
  }, [students, filter]);

  async function createStudent(e) {
    e.preventDefault();

    if (!teacherId) {
      alert('ไม่พบข้อมูลครูที่ล็อกอินอยู่ หรือคุณไม่ได้เป็นครู');
      return;
    }

    const body = {
      studentCode: form.studentCode,
      name: form.name,
      username: form.username,
      password: form.password,
      departmentId: form.departmentId,
      branchId: form.branchId || undefined,
    };

    const res = await fetch(`/api/teachers/${teacherId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setForm(f => ({ ...f, studentCode: '', name: '', username: '', password: '', branchId: '' }));
      await loadLists();
    } else {
      const err = await safeJson(res);
      alert(err.message || 'Create failed');
    }
  }

  async function removeStudent(id) {
    if (!confirm('Delete this student?')) return;

    const res = await fetch(`/api/student/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadLists();
    } else {
      const err = await safeJson(res);
      alert(err.message || `Delete failed (${res.status})`);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Create Student</h2>

          {/* แสดงสถานะผู้ใช้ */}
          {me && (
            <div className="mb-2 text-sm opacity-70">
              Logged in as: <b>{me.username}</b> ({me.role}) {teacherId ? `• teacherId: ${teacherId}` : ''}
            </div>
          )}

          <form onSubmit={createStudent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input input-bordered" placeholder="Student Code"
              value={form.studentCode} onChange={e => setForm({ ...form, studentCode: e.target.value })} required />
            <input className="input input-bordered" placeholder="Full name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input input-bordered" placeholder="Username"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            <input type="password" className="input input-bordered" placeholder="Password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <select className="select select-bordered" value={form.departmentId}
              onChange={e => setForm({ ...form, departmentId: e.target.value, branchId: '' })} required>
              <option value="" disabled>Select department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select className="select select-bordered" value={form.branchId}
              onChange={e => setForm({ ...form, branchId: e.target.value })}>
              <option value="">(optional) Branch</option>
              {branchesByDep.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <div className="md:col-span-3">
              <button className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Students</h2>
            <div className="flex gap-2">
              <select className="select select-bordered" value={filter.depId}
                onChange={e => setFilter(f => ({ ...f, depId: e.target.value, branchId: '' }))}>
                <option value="">All departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select className="select select-bordered" value={filter.branchId}
                onChange={e => setFilter(f => ({ ...f, branchId: e.target.value }))}>
                <option value="">All branches</option>
                {branches
                  .filter(b => !filter.depId || String(b?.departmentId?._id || b.departmentId) === String(filter.depId))
                  .map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              <button className="btn" onClick={loadLists}>Refresh</button>
            </div>
          </div>

          {loading ? <span className="loading loading-spinner" /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s._id}>
                      <td>{s.studentCode}</td>
                      <td>{s.name}</td>
                      <td>{s?.userId?.username}</td>
                      <td>{s?.departmentId?.name || '-'}</td>
                      <td>{s?.branchId?.name || '-'}</td>
                      <td className="text-right">
                        <button className="btn btn-error btn-sm" onClick={() => removeStudent(s._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
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
