'use client';

import { useEffect, useState } from 'react';

export default function AttendanceHistoryPage() {
  const [me, setMe] = useState(null);           // { id, role, ... }
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
      setMe(meData?.user || null);
      const bs = bData?.branches || bData?.data || [];
      setBranches(bs);
      if (!branchId && bs[0]?._id) setBranchId(bs[0]._id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    if (!me?.id) return;
    setLoading(true);
    const qs = new URLSearchParams({ from: range.from, to: range.to });
    if (branchId) qs.set('branchId', branchId);
    const res = await fetch(`/api/teachers/${me.id}/attendance?` + qs.toString(), { cache: 'no-store' });
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
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
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
