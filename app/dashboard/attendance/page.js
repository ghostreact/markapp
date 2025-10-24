'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  STUDENT_LEVELS,
  getYearsForLevel,
  getRooms,
  formatClassLabel,
} from '@/lib/constants/student-levels';

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const LEVEL_LABEL_MAP = Object.fromEntries(STUDENT_LEVELS.map((opt) => [opt.value, opt.label]));

export default function AttendancePage() {
  const [me, setMe] = useState(null);
  const [teacherId, setTeacherId] = useState('');
  const [teacherLevel, setTeacherLevel] = useState('');
  const [level, setLevel] = useState('');
  const [year, setYear] = useState(1);
  const [room, setRoom] = useState(1);

  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = await safeJson(meRes);
      const user = meData?.user || null;
      setMe(user);

      const teacherRef =
        user?.teacher?._id ||
        user?.teacherId?._id ||
        user?.teacherId ||
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

  async function loadStudents() {
    if (!teacherId) {
      alert('ไม่พบข้อมูลครูผู้สอน');
      return;
    }

    const targetLevel = teacherLevel || level;
    if (!targetLevel) {
      alert('กรุณาเลือกระดับชั้น');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ level: targetLevel, year: String(year), room: String(room) });
      const res = await fetch(`/api/teachers/${teacherId}/students?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await safeJson(res);
      setStudents(data?.students || data?.data || []);
      setRecords({});
    } finally {
      setLoading(false);
    }
  }

  function toggleStatus(studentId, status) {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  }

  async function saveAttendance() {
    if (!teacherId) {
      alert('ไม่พบข้อมูลครูผู้สอน');
      return;
    }

    const payload = Object.entries(records).map(([studentId, status]) => ({
      studentId,
      date,
      status,
    }));

    const res = await fetch(`/api/teachers/${teacherId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: payload }),
    });

    if (!res.ok) {
      const err = await safeJson(res);
      alert(err.message || 'บันทึกการเช็กชื่อไม่สำเร็จ');
      return;
    }

    alert('บันทึกการเช็กชื่อเรียบร้อยแล้ว');
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="card-title">Check Attendance</h2>
          <div className="flex flex-col gap-1 text-sm opacity-70 md:items-end">
            {departmentName ? <span>Department: {departmentName}</span> : null}
            {(teacherLevel || level) ? (
              <span>
                Level: {formatClassLabel(teacherLevel || level, year, room)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="date"
            className="input input-bordered w-full md:w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="select select-bordered w-full md:w-auto"
            value={teacherLevel || level}
            onChange={(e) => { setLevel(e.target.value); setYear(1); setRoom(1); }}
            disabled={Boolean(teacherLevel)}
          >
            <option value="">Select Level</option>
            {STUDENT_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered w-full md:w-auto"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!(teacherLevel || level)}
          >
            <option value="" disabled>
              Select Year
            </option>
            {getYearsForLevel(teacherLevel || level).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered w-full md:w-auto"
            value={room}
            onChange={(e) => setRoom(Number(e.target.value))}
            disabled={!(teacherLevel || level)}
          >
            <option value="" disabled>
              Select Room
            </option>
            {getRooms().map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button onClick={loadStudents} className="btn btn-primary">
            Load Students
          </button>
        </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Students</h3>
          {loading ? (
            <span className="loading loading-spinner" />
          ) : students.length === 0 ? (
            <p className="opacity-70">No students found for this selection</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Code</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td>{s.studentCode}</td>
                      <td>{s.name}</td>
                      <td>{LEVEL_LABEL_MAP[s.level] || '-'}</td>
                      <td>
                        <div className="join">
                          {['Present', 'Late', 'Leave', 'Absent'].map((st) => (
                            <button
                              key={st}
                              className={`join-item btn btn-sm ${
                                records[s._id] === st ? 'btn-primary' : ''
                              }`}
                              onClick={() => toggleStatus(s._id, st)}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-right">
            <button onClick={saveAttendance} className="btn btn-success">
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
