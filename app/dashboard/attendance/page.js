'use client';

import { useEffect, useMemo, useState } from 'react';

async function safeJson(res) {
    try { return await res.json(); } catch { return {}; }
}

export default function AttendancePage() {
    const [me, setMe] = useState(null);
    const [teacherId, setTeacherId] = useState('');
    const [teacherDepartmentId, setTeacherDepartmentId] = useState('');

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState('');

    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState({});
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // 1) โหลด me + สาขา
    useEffect(() => {
        (async () => {
            const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
            const meData = await safeJson(meRes);

            const user = meData?.user || null;
            setMe(user);

            // ดึง teacherId และ departmentId ให้ได้จริง
            // (รองรับหลายรูปแบบตามที่คุณส่งจาก /api/auth/me)
            const tId =
                user?.teacher?._id ||
                user?.teacherId?._id ||
                user?.teacherId ||
                ''; // ถ้า /api/auth/me ยังไม่มี teacher ให้เพิ่มตามคำแนะนำด้านล่าง

            const depId =
                user?.teacher?.departmentId?._id ||
                user?.teacher?.departmentId ||
                user?.departmentId ||
                '';

            if (tId) setTeacherId(String(tId));
            if (depId) setTeacherDepartmentId(String(depId));

            // โหลดสาขา (รองรับทั้ง {branches} และ {data})
            const branchRes = await fetch('/api/branch', { cache: 'no-store' });
            const branchData = await safeJson(branchRes);
            setBranches(branchData?.branches || branchData?.data || []);
        })();
    }, []);

    // กรองสาขาเฉพาะแผนกของครู
    const myBranches = useMemo(() => {
        if (!teacherDepartmentId) return branches;
        return branches.filter(
            b => String(b?.departmentId?._id || b?.departmentId) === String(teacherDepartmentId)
        );
    }, [branches, teacherDepartmentId]);

    // 2) โหลดนักเรียนในสาขา
    async function loadStudents() {
        if (!teacherId) {
            alert('ไม่พบ teacherId — ตรวจ /api/auth/me');
            return;
        }
        if (!branchId) {
            alert('กรุณาเลือกสาขา');
            return;
        }

        setLoading(true);
        const res = await fetch(`/api/teachers/${teacherId}/students?branchId=${branchId}`, {
            cache: 'no-store',
        });
        const data = await safeJson(res);
        setStudents(data?.students || data?.data || []);
        setLoading(false);
    }

    // 3) เปลี่ยนสถานะเช็คชื่อ
    function toggleStatus(studentId, status) {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    }

    // 4) บันทึกผลเช็คชื่อ
    async function saveAttendance() {
        if (!teacherId) return alert('No teacher found');

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

        if (res.ok) alert('Attendance saved ✅');
        else {
            const err = await safeJson(res);
            alert(err.message || 'Failed to save attendance ❌');
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Check Attendance</h2>

                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="date"
                            className="input input-bordered w-full md:w-auto"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />

                        <select
                            className="select select-bordered w-full md:w-auto"
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                        >
                            <option value="">Select Branch</option>
                            {myBranches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>

                        <button onClick={loadStudents} className="btn btn-primary">Load Students</button>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">Students</h3>
                    {loading ? (
                        <span className="loading loading-spinner" />
                    ) : students.length === 0 ? (
                        <p className="opacity-70">No students found for this branch</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student Code</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s._id}>
                                            <td>{s.studentCode}</td>
                                            <td>{s.name}</td>
                                            <td>
                                                <div className="join">
                                                    {['Present', 'Late', 'Leave', 'Absent'].map(st => (
                                                        <button
                                                            key={st}
                                                            className={`join-item btn btn-sm ${records[s._id] === st ? 'btn-primary' : ''}`}
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
