'use client';

import { useEffect, useMemo, useState } from 'react';

export default function AttendanceHistoryPage() {
  const [me, setMe] = useState(null);           // { id, role, teacherId, ... }
  const [teacherId, setTeacherId] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [range, setRange] = useState(() => {
    const d = new Date();
    const to = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 7);
    const from = d.toISOString().split('T')[0];
    return { from, to };
  });
  const [rows, setRows] = useState([]);         // [{date, student:{...}, status}]
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [meRes, bRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/branch',   { cache: 'no-store' }),
      ]);
      const meData = await meRes.json().catch(()=>({}));
      const bData  = await bRes.json().catch(()=>({}));
      const user = meData?.user || null;
      setMe(user);

      const teacherRef =
        user?.teacherId ||
        user?.teacher?._id ||
        user?.teacher ||
        (user?.role === 'Teacher' ? user?.id : '');

      if (teacherRef) setTeacherId(String(teacherRef));

      const bs = bData?.branches || bData?.data || [];
      setBranches(bs);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBranches = useMemo(() => {
    const departmentId =
      me?.teacher?.departmentId?._id ||
      me?.teacher?.departmentId ||
      me?.departmentId ||
      '';

    if (!departmentId) return branches;
    return branches.filter(
      b => String(b?.departmentId?._id || b?.departmentId) === String(departmentId)
    );
  }, [branches, me]);

  useEffect(() => {
    if (!branchId && filteredBranches[0]?._id) {
      setBranchId(filteredBranches[0]._id);
    }
  }, [branchId, filteredBranches]);

  async function search() {
    if (!teacherId) return;
    setLoading(true);
    const qs = new URLSearchParams({ from: range.from, to: range.to });
    if (branchId) qs.set('branchId', branchId);
    const res = await fetch(`/api/teachers/${teacherId}/attendance?` + qs.toString(), { cache: 'no-store' });
    const data = await res.json().catch(()=>({}));
    setRows(data?.data || []);
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Attendance History</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <input type="date" className="input input-bordered" value={range.from}
                   onChange={e=>setRange(r=>({...r, from:e.target.value}))}/>
            <input type="date" className="input input-bordered" value={range.to}
                   onChange={e=>setRange(r=>({...r, to:e.target.value}))}/>
            <select className="select select-bordered" value={branchId} onChange={e=>setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {filteredBranches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={search}>Search</button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Results</h3>
          {loading ? <span className="loading loading-spinner"/> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Code</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i)=>(
                    <tr key={i}>
                      <td>{r.date?.slice(0,10)}</td>
                      <td>{r?.student?.studentCode}</td>
                      <td>{r?.student?.name}</td>
                      <td>{r?.student?.branchId?.name || '-'}</td>
                      <td><span className="badge">{r.status}</span></td>
                    </tr>
                  ))}
                  {rows.length===0 && (
                    <tr><td colSpan={5} className="text-center opacity-60">No records</td></tr>
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
