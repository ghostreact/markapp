'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  STUDENT_LEVELS,
  getYearsForLevel,
  getRooms,
  formatClassLabel,
} from '@/lib/constants/student-levels';

const LEVEL_LABEL_MAP = Object.fromEntries(STUDENT_LEVELS.map((opt) => [opt.value, opt.label]));

export default function AttendanceHistoryPage() {
  const [me, setMe] = useState(null);
  const [teacherId, setTeacherId] = useState('');
  const [teacherLevel, setTeacherLevel] = useState('');
  const [level, setLevel] = useState('');
  const [year, setYear] = useState(1);
  const [room, setRoom] = useState(1);
  const [range, setRange] = useState(() => {
    const d = new Date();
    const to = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 7);
    const from = d.toISOString().split('T')[0];
    return { from, to };
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = await meRes.json().catch(() => ({}));
      const user = meData?.user || null;
      setMe(user);

      const teacherRef =
        user?.teacherId ||
        user?.teacher?._id ||
        user?.teacher ||
        (user?.role === 'Teacher' ? user?.id : '');

      if (teacherRef) setTeacherId(String(teacherRef));

      const assignedLevel = user?.teacher?.level || '';
      if (assignedLevel) {
        setTeacherLevel(String(assignedLevel));
        setLevel(String(assignedLevel));
        setYear(1);
        setRoom(1);
      }
    })();
  }, []);

  const departmentName = useMemo(() => {
    const dep =
      me?.teacher?.departmentId ||
      me?.departmentId ||
      null;

    if (!dep) return '';
    if (typeof dep === 'string') return dep;
    return dep?.name || '';
  }, [me]);

  async function search() {
    if (!teacherId) return;
    const targetLevel = teacherLevel || level;

    setLoading(true);
    const qs = new URLSearchParams({ from: range.from, to: range.to });
    if (targetLevel) qs.set('level', targetLevel);
    const res = await fetch(`/api/teachers/${teacherId}/attendance?${qs.toString()}`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    setRows(data?.data || []);
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-start justify-between gap-3">
            <h2 className="card-title">Attendance History</h2>
            <div className="flex flex-col gap-1 text-sm opacity-70 md:items-end">
              {departmentName ? <span>Department: {departmentName}</span> : null}
              {(teacherLevel || level) ? (
                <span>
                  Level: {formatClassLabel(teacherLevel || level, year, room)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="date"
              className="input input-bordered"
              value={range.from}
              onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            />
            <input
              type="date"
              className="input input-bordered"
              value={range.to}
              onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            />
            <select
              className="select select-bordered"
              value={teacherLevel || level}
              onChange={(e) => { setLevel(e.target.value); setYear(1); }}
              disabled={Boolean(teacherLevel)}
            >
              <option value="">All levels</option>
              {STUDENT_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="select select-bordered"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={!(teacherLevel || level)}
            >
              <option value="" disabled>Year</option>
              {getYearsForLevel(teacherLevel || level).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="select select-bordered"
              value={room}
              onChange={(e) => setRoom(Number(e.target.value))}
              disabled={!(teacherLevel || level)}
            >
              <option value="" disabled>Room</option>
              {getRooms().map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={search}>Search</button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Results</h3>
          {loading ? <span className="loading loading-spinner" /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Code</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date?.slice(0, 10)}</td>
                      <td>{r?.student?.studentCode}</td>
                      <td>{r?.student?.name}</td>
                      <td>{r?.student?.levelLabel || '-'}</td>
                      <td>{r?.student?.departmentId?.name || '-'}</td>
                      <td><span className="badge">{r.status}</span></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="text-center opacity-60">No records</td></tr>
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
