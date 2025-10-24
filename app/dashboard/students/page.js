'use client';

import { useEffect, useMemo, useState } from 'react';
import { STUDENT_LEVELS } from '@/lib/constants/student-levels';

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const DEFAULT_LEVEL = STUDENT_LEVELS[0]?.value || '';
const LEVEL_LABEL_MAP = Object.fromEntries(STUDENT_LEVELS.map((opt) => [opt.value, opt.label]));

export default function StudentsPage() {
  const [me, setMe] = useState(null);
  const [teacherId, setTeacherId] = useState('');
  const [teacherLevel, setTeacherLevel] = useState('');

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ depId: '', level: '' });

  const [form, setForm] = useState({
    studentCode: '',
    name: '',
    username: '',
    password: '',
    departmentId: '',
    branchId: '',
    level: DEFAULT_LEVEL,
  });

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadLists();
    })();
  }, []);

  async function loadMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    const data = await safeJson(res);
    const user = data?.user || null;
    setMe(user);

    const tId =
      user?.teacher?._id ||
      user?.teacherId?._id ||
      user?.teacherId ||
      (user?.role === 'Teacher' ? user?.id : '');

    if (tId) setTeacherId(String(tId));

    const assignedLevel = user?.teacher?.level || '';
    if (assignedLevel) {
      setTeacherLevel(String(assignedLevel));
      setForm((prev) => ({ ...prev, level: String(assignedLevel) }));
      setFilter((prev) => ({ ...prev, level: String(assignedLevel) }));
    }
  }

  async function loadLists() {
    setLoading(true);
    const [sRes, dRes, bRes] = await Promise.all([
      fetch('/api/student', { cache: 'no-store' }),
      fetch('/api/department', { cache: 'no-store' }),
      fetch('/api/branch', { cache: 'no-store' }),
    ]);

    const s = await safeJson(sRes);
    const d = await safeJson(dRes);
    const b = await safeJson(bRes);

    setStudents(s?.data || s?.students || []);
    const deps = d?.departments || d?.data || [];
    const brs = b?.branches || b?.data || [];
    setDepartments(deps);
    setBranches(brs);

    setForm((prev) => ({
      ...prev,
      departmentId: prev.departmentId || deps[0]?._id || '',
      level: teacherLevel || prev.level || DEFAULT_LEVEL,
    }));
    setLoading(false);
  }

  const branchesByDep = useMemo(
    () => branches.filter((b) => String(b?.departmentId?._id || b.departmentId) === String(form.departmentId)),
    [branches, form.departmentId],
  );

  const filtered = useMemo(() => {
    let arr = students;
    if (filter.depId) {
      arr = arr.filter((s) => String(s?.departmentId?._id || s.departmentId) === String(filter.depId));
    }
    if (filter.level) {
      arr = arr.filter((s) => String(s.level) === String(filter.level));
    }
    return arr;
  }, [students, filter]);

  async function createStudent(e) {
    e.preventDefault();

    if (!teacherId) {
      alert('ไม่พบข้อมูลครูผู้สอน');
      return;
    }

    const targetLevel = teacherLevel || form.level || DEFAULT_LEVEL;

    const body = {
      studentCode: form.studentCode,
      name: form.name,
      username: form.username,
      password: form.password,
      departmentId: form.departmentId,
      branchId: form.branchId || undefined,
      level: targetLevel,
    };

    const res = await fetch(`/api/teachers/${teacherId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setForm((prev) => ({
        ...prev,
        studentCode: '',
        name: '',
        username: '',
        password: '',
        branchId: '',
        level: teacherLevel || DEFAULT_LEVEL,
      }));
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

          {me && (
            <div className="mb-2 text-sm opacity-70">
              Logged in as: <b>{me.username}</b> ({me.role})
            </div>
          )}

          <form onSubmit={createStudent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="input input-bordered"
              placeholder="Student Code"
              value={form.studentCode}
              onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
              required
            />
            <input
              className="input input-bordered"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
            <select
              className="select select-bordered"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value, branchId: '' })}
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
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              required
              disabled={Boolean(teacherLevel)}
            >
              <option value="" disabled>Select level</option>
              {STUDENT_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="select select-bordered"
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              <option value="">(optional) Branch</option>
              {branchesByDep.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
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
              <select
                className="select select-bordered"
                value={filter.depId}
                onChange={(e) => setFilter((f) => ({ ...f, depId: e.target.value }))}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              <select
                className="select select-bordered"
                value={filter.level}
                onChange={(e) => setFilter((f) => ({ ...f, level: e.target.value }))}
                disabled={Boolean(teacherLevel)}
              >
                <option value="">All levels</option>
                {STUDENT_LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button className="btn" onClick={loadLists}>Refresh</button>
            </div>
          </div>

          {loading ? (
            <span className="loading loading-spinner" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Level</th>
                    <th>Department</th>
                    <th>Branch</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s._id}>
                      <td>{s.studentCode}</td>
                      <td>{s.name}</td>
                      <td>{s?.userId?.username}</td>
                      <td>{LEVEL_LABEL_MAP[s.level] || '-'}</td>
                      <td>{s?.departmentId?.name || '-'}</td>
                      <td>{s?.branchId?.name || '-'}</td>
                      <td className="text-right">
                        <button className="btn btn-error btn-sm" onClick={() => removeStudent(s._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
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
