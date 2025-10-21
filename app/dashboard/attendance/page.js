'use client';

import { useEffect, useState } from 'react';

export default function AttendancePage() {
    const [teacher, setTeacher] = useState(null);
    const [students, setStudents] = useState([]);
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [branchId, setBranchId] = useState('');
    const [branches, setBranches] = useState([]);
    const [records, setRecords] = useState({});
    const [loading, setLoading] = useState(false);

    // 1️⃣ โหลดข้อมูลครูและสาขาที่สอน
    useEffect(() => {
        async function load() {
            try {
                const teacherRes = await fetch('/api/me'); // endpoint โปรไฟล์ครูที่ล็อกอินอยู่
                const teacherData = await teacherRes.json();
                setTeacher(teacherData?.user || null);

                const branchRes = await fetch('/api/branch');
                const branchData = await branchRes.json();
                setBranches(branchData?.branches || []);
            } catch (err) {
                console.error('load error:', err);
            }
        }
        load();
    }, []);

    // 2️⃣ โหลดนักเรียนในสาขา
    async function loadStudents() {
        if (!branchId || !teacher?._id) return;
        setLoading(true);
        const res = await fetch(`/api/teachers/${teacher._id}/students?branchId=${branchId}`);
        const data = await res.json();
        setStudents(data?.students || []);
        setLoading(false);
    }

    // 3️⃣ เปลี่ยนสถานะการเช็คชื่อ
    function toggleStatus(studentId, status) {
        setRecords(prev => ({
            ...prev,
            [studentId]: status,
        }));
    }

    // 4️⃣ บันทึกผลเช็คชื่อ
    async function saveAttendance() {
        if (!teacher?._id) return alert('No teacher found');
        const payload = Object.entries(records).map(([studentId, status]) => ({
            studentId,
            date,
            status,
        }));

        const res = await fetch(`/api/teachers/${teacher._id}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: payload }),
        });

        if (res.ok) alert('Attendance saved ✅');
        else {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Failed to save attendance ❌');
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">Check Attendance</h2>

                    {/* ✅ เลือกวันที่และสาขา */}
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
                            {branches.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                            ))}
                        </select>

                        <button onClick={loadStudents} className="btn btn-primary">Load Students</button>
                    </div>
                </div>
            </div>

            {/* ✅ ตารางเช็คชื่อ */}
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

                    {/* ✅ ปุ่มบันทึก */}
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
