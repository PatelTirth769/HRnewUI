import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import * as XLSX from 'xlsx';

const QuickAttendance = () => {
    const navigate = useNavigate();

    // Filter states
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');

    // Dropdown data
    const [programs, setPrograms] = useState([]);
    const [boards, setBoards] = useState([]);
    const [allStudentGroups, setAllStudentGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);

    // Student table
    const [students, setStudents] = useState([]);
    const [existingMap, setExistingMap] = useState({}); // studentId → { docName, docstatus }

    // Loading states
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });

    // Track if data was fetched for current filters
    const [fetchedFor, setFetchedFor] = useState(null);

    // ─── Custom Toast ───
    const [toast, setToast] = useState(null); // { type: 'success'|'warning'|'error', title, desc }
    const toastTimerRef = useRef(null);
    const showToast = (type, title, desc) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ type, title, desc });
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    };

    // ─── Fetch Programs & Student Groups on mount ───
    useEffect(() => {
        const fetchMasters = async () => {
            setLoadingMasters(true);
            try {
                const [pRes, sgRes, bRes] = await Promise.all([
                    API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Student Group?fields=["name","program","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                ]);
                setPrograms(pRes.data.data?.map(d => ({ value: d.name, label: d.name, custom_board: d.custom_board })) || []);
                const groups = sgRes.data.data?.map(d => ({ value: d.name, label: d.name, program: d.program, custom_board: d.custom_board })) || [];
                setAllStudentGroups(groups);
                setFilteredGroups(groups);
                
                const fetchedBoards = bRes.data.data?.map(c => c.name) || [];
                const studentBoards = [...new Set(groups.map(g => g.custom_board).filter(Boolean))];
                setBoards([...new Set([...fetchedBoards, ...studentBoards])].sort());
            } catch (err) {
                console.error('Error fetching masters:', err);
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
    }, []);

    // ─── Filter student groups when program or board changes ───
    useEffect(() => {
        let filtered = allStudentGroups;
        if (selectedProgram) {
            filtered = filtered.filter(g => g.program === selectedProgram);
        }
        if (selectedBoard) {
            filtered = filtered.filter(g => g.custom_board === selectedBoard);
        }
        setFilteredGroups(filtered);
        
        // Reset group selection when filters change
        setSelectedGroup('');
        setStudents([]);
        setExistingMap({});
        setFetchedFor(null);
    }, [selectedProgram, selectedBoard, allStudentGroups]);

    // ─── Clear students when date changes ───
    useEffect(() => {
        if (fetchedFor && fetchedFor.date !== date) {
            setStudents([]);
            setExistingMap({});
            setFetchedFor(null);
        }
    }, [date, fetchedFor]);

    // ─── Fetch Students ───
    const handleGetStudents = useCallback(async () => {
        if (!selectedGroup) {
            notification.warning({ message: 'Selection Required', description: 'Please select a Student Group first.' });
            return;
        }
        if (!date) {
            notification.warning({ message: 'Selection Required', description: 'Please select a Date.' });
            return;
        }

        setFetchingStudents(true);
        try {
            // 1. Get students from the selected Student Group
            const sgRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(selectedGroup)}`);
            const groupStudents = sgRes.data.data.students || [];

            if (groupStudents.length === 0) {
                notification.info({ message: 'No Students', description: 'No students found in this Student Group.' });
                setStudents([]);
                setExistingMap({});
                setFetchedFor({ group: selectedGroup, date });
                return;
            }

            const rawStudentIds = groupStudents.map(s => s.student);

            // Filter out disabled students
            const stuRes = await API.get('/api/resource/Student', {
                params: {
                    filters: JSON.stringify([["name", "in", rawStudentIds]]),
                    fields: JSON.stringify(["name", "enabled"]),
                    limit_page_length: 'None'
                }
            });
            const enabledMap = {};
            (stuRes.data.data || []).forEach(s => enabledMap[s.name] = s.enabled);

            const activeGroupStudents = groupStudents.filter(s => enabledMap[s.student] !== 0);

            if (activeGroupStudents.length === 0) {
                notification.info({ message: 'No Active Students', description: 'All students in this group are currently disabled/left.' });
                setStudents([]);
                setExistingMap({});
                setFetchedFor({ group: selectedGroup, date });
                return;
            }

            const studentIds = activeGroupStudents.map(s => s.student);

            // 2. Check for existing attendance records on the selected date
            const statusMap = {};
            const existMap = {};
            try {
                const attRes = await API.get('/api/resource/Student Attendance', {
                    params: {
                        filters: JSON.stringify([
                            ["student", "in", studentIds],
                            ["date", "=", date]
                        ]),
                        fields: JSON.stringify(["name", "student", "status", "docstatus"]),
                        limit_page_length: 'None'
                    }
                });
                (attRes.data.data || []).forEach(rec => {
                    statusMap[rec.student] = rec.status;
                    existMap[rec.student] = { docName: rec.name, docstatus: rec.docstatus };
                });
            } catch (err) {
                console.error('Error checking existing attendance:', err);
            }

            // 3. Map final list
            const finalStudents = activeGroupStudents.map(s => ({
                student: s.student,
                student_name: s.student_name,
                status: statusMap[s.student] || 'Present', // Default Present
            }));

            setStudents(finalStudents);
            setExistingMap(existMap);
            setFetchedFor({ group: selectedGroup, date });

            const existingCount = Object.keys(existMap).length;
            if (existingCount > 0) {
                showToast('info', 'Existing Records Found', `${existingCount} student(s) already have attendance for ${date}. Their status has been pre-filled.`);
            }

        } catch (err) {
            console.error('Error fetching students:', err);
            showToast('error', 'Fetch Failed', 'Could not retrieve student list.');
        } finally {
            setFetchingStudents(false);
        }
    }, [selectedGroup, date]);

    // ─── Toggle student status ───
    const setStudentStatus = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student === studentId ? { ...s, status } : s
        ));
    };

    // ─── Bulk actions ───
    const markAll = (status) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    // ─── Download Attendance ───
    const handleDownloadAttendance = () => {
        if (students.length === 0) {
            showToast('warning', 'No Data', 'There are no students to download.');
            return;
        }

        const headers = ["Student ID", "Student Name", "Date", "Status", "Student Group"];
        const rows = [headers];

        students.forEach(s => {
            rows.push([
                s.student || '',
                s.student_name || '',
                date || '',
                s.status || '',
                selectedGroup || ''
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Quick Attendance");

        const filename = `Quick_Attendance_${selectedGroup || 'Group'}_${date}.xlsx`;
        XLSX.writeFile(wb, filename);
        showToast('success', 'Download Started', `Successfully exported ${students.length} student attendance records.`);
    };

    // ─── Save Attendance ───
    const handleSave = async () => {
        if (students.length === 0) return;

        if (!fetchedFor || fetchedFor.group !== selectedGroup || fetchedFor.date !== date) {
            showToast('warning', 'Validation Error', 'Please click "Get Students" to refresh the list for the selected Date and Group before saving.');
            return;
        }

        setSaving(true);
        setSaveProgress({ done: 0, total: students.length });

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (let i = 0; i < students.length; i++) {
            const s = students[i];
            const payload = {
                student: s.student,
                date: date,
                status: s.status,
                student_group: selectedGroup,
                docstatus: 1
            };

            try {
                const existing = existingMap[s.student];
                if (existing) {
                    // Update existing record
                    await API.put(`/api/resource/Student Attendance/${encodeURIComponent(existing.docName)}`, payload);
                } else {
                    // Create new record
                    const res = await API.post('/api/resource/Student Attendance', payload);
                    // Store the new doc name so re-save won't create duplicates
                    setExistingMap(prev => ({
                        ...prev,
                        [s.student]: { docName: res.data.data.name, docstatus: 1 }
                    }));
                }
                successCount++;
            } catch (err) {
                failCount++;
                const errMsg = err.response?.data?._server_messages
                    ? (() => { try { return JSON.parse(JSON.parse(err.response.data._server_messages)[0]).message; } catch { return err.message; } })()
                    : err.response?.data?.message || err.message;
                errors.push(`${s.student_name}: ${errMsg}`);
            }

            setSaveProgress({ done: i + 1, total: students.length });
        }

        const pCount = students.filter(s => s.status === 'Present').length;
        const aCount = students.filter(s => s.status === 'Absent').length;

        if (failCount === 0) {
            showToast('success', 'Attendance Saved Successfully', `✅ Present: ${pCount}  |  ❌ Absent: ${aCount}`);
        } else if (successCount > 0) {
            showToast('warning', 'Attendance Saved Partially', `Present: ${pCount}, Absent: ${aCount}. Failed: ${failCount} record(s). Issue: ${errors[0]}`);
        } else {
            showToast('error', 'Attendance Upload Failed', `Failed to upload ${failCount} record(s). Issue: ${errors[0]}`);
        }

        setSaving(false);
    };


    // ─── Counts ───
    const presentCount = students.filter(s => s.status === 'Present').length;
    const absentCount = students.filter(s => s.status === 'Absent').length;

    // ─── Styles ───
    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">

            {/* ── Custom Toast ── */}
            {toast && (
                <div
                    onClick={() => setToast(null)}
                    style={{
                        position: 'fixed',
                        top: '24px',
                        right: '24px',
                        zIndex: 99999,
                        minWidth: '320px',
                        maxWidth: '420px',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        animation: 'slideIn 0.3s ease',
                        background:
                            toast.type === 'success' ? '#f0fdf4' :
                            toast.type === 'warning' ? '#fffbeb' :
                            toast.type === 'error'   ? '#fef2f2' : '#eff6ff',
                        border:
                            toast.type === 'success' ? '1px solid #86efac' :
                            toast.type === 'warning' ? '1px solid #fde68a' :
                            toast.type === 'error'   ? '1px solid #fca5a5' : '1px solid #93c5fd',
                    }}
                >
                    <span style={{ fontSize: '20px', lineHeight: '1', marginTop: '1px' }}>
                        {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: '700',
                            fontSize: '14px',
                            color: toast.type === 'success' ? '#166534' : toast.type === 'warning' ? '#92400e' : toast.type === 'error' ? '#991b1b' : '#1e40af',
                            marginBottom: '3px',
                        }}>
                            {toast.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                            {toast.desc}
                        </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1' }}>×</span>
                </div>
            )}
            <style>{`@keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        title="Go Back"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Quick Attendance</h2>
                    {students.length > 0 && (
                        <div className="flex items-center gap-2 ml-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-green-50 text-green-700 font-bold border border-green-200">
                                P: {presentCount}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-200">
                                A: {absentCount}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {saving && (
                        <span className="text-xs text-gray-500 font-medium animate-pulse">
                            Saving {saveProgress.done}/{saveProgress.total}...
                        </span>
                    )}
                    {students.length > 0 && (
                        <button
                            className="h-9 px-4 rounded-md font-semibold text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                            onClick={handleDownloadAttendance}
                            disabled={saving}
                        >
                            📤 Download
                        </button>
                    )}
                    <button
                        className="h-9 px-6 rounded-md font-bold text-sm shadow-sm transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={handleSave}
                        disabled={students.length === 0 || saving}
                    >
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* Filter Fields */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 border-b border-gray-100">
                    {/* Date */}
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-orange-50/30 hover:border-gray-300 transition-colors"
                            style={{ height: '38px' }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    {/* Program */}
                    <div>
                        <label className={labelStyle}>Program (Class)</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 hover:border-gray-300 transition-colors bg-white"
                            style={{ height: '38px' }}
                            value={selectedProgram}
                            onChange={e => setSelectedProgram(e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">All Programs</option>
                            {programs.filter(p => !selectedBoard || p.custom_board === selectedBoard).map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Board */}
                    <div>
                        <label className={labelStyle}>Board</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 hover:border-gray-300 transition-colors bg-white"
                            style={{ height: '38px' }}
                            value={selectedBoard}
                            onChange={e => setSelectedBoard(e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">All Boards</option>
                            {boards.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Group */}
                    <div>
                        <label className={`${labelStyle} flex gap-1 items-center`}>
                            Student Group <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 bg-orange-50/30 hover:border-gray-300 transition-colors"
                            style={{ height: '38px' }}
                            value={selectedGroup}
                            onChange={e => {
                                setSelectedGroup(e.target.value);
                                setStudents([]);
                                setExistingMap({});
                                setFetchedFor(null);
                            }}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Student Group</option>
                            {filteredGroups.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Get Students Button */}
                <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
                    <button
                        className="h-9 px-5 text-[13px] font-semibold bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300 rounded transition-colors disabled:opacity-40"
                        onClick={handleGetStudents}
                        disabled={fetchingStudents || !selectedGroup}
                    >
                        {fetchingStudents ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Fetching...
                            </span>
                        ) : 'Get Students'}
                    </button>
                    {fetchedFor && (
                        <span className="text-xs text-gray-400">
                            Showing {students.length} students for <strong className="text-gray-600">{fetchedFor.group}</strong> on <strong className="text-gray-600">{fetchedFor.date}</strong>
                        </span>
                    )}
                </div>

                {/* Student Table */}
                {students.length > 0 && (
                    <div className="px-6 py-4">
                        {/* Bulk Actions */}
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Student List ({students.length})
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    className="text-[11px] font-semibold border border-green-200 text-green-600 hover:bg-green-50 px-3 py-1 rounded transition-colors"
                                    onClick={() => markAll('Present')}
                                >
                                    All Present
                                </button>
                                <button
                                    className="text-[11px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                                    onClick={() => markAll('Absent')}
                                >
                                    All Absent
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 w-[50px]">No.</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 w-[180px]">Student ID</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">Student Name</th>
                                        <th className="text-center text-[11px] font-semibold text-green-600 uppercase tracking-wider px-4 py-2.5 w-[70px]">P</th>
                                        <th className="text-center text-[11px] font-semibold text-red-500 uppercase tracking-wider px-4 py-2.5 w-[70px]">A</th>
                                        <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5 w-[80px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((s, idx) => (
                                        <tr
                                            key={s.student}
                                            className={`border-b border-gray-100 transition-colors ${
                                                s.status === 'Present'
                                                    ? 'bg-green-50/40 hover:bg-green-50/70'
                                                    : 'bg-red-50/40 hover:bg-red-50/70'
                                            }`}
                                        >
                                            <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{s.student}</td>
                                            <td className="px-4 py-2.5 font-semibold text-gray-800 text-sm">{s.student_name}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <button
                                                    onClick={() => setStudentStatus(s.student, 'Present')}
                                                    className={`w-8 h-8 rounded-md border-2 text-sm font-bold transition-all duration-150 ${
                                                        s.status === 'Present'
                                                            ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200 scale-110'
                                                            : 'bg-white border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-500'
                                                    }`}
                                                    title="Mark Present"
                                                >
                                                    P
                                                </button>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <button
                                                    onClick={() => setStudentStatus(s.student, 'Absent')}
                                                    className={`w-8 h-8 rounded-md border-2 text-sm font-bold transition-all duration-150 ${
                                                        s.status === 'Absent'
                                                            ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-200 scale-110'
                                                            : 'bg-white border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-500'
                                                    }`}
                                                    title="Mark Absent"
                                                >
                                                    A
                                                </button>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    s.status === 'Present'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {s.status === 'Present' ? 'PRESENT' : 'ABSENT'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Footer */}
                        <div className="mt-4 flex items-center justify-between px-1">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Total: <strong className="text-gray-700">{students.length}</strong></span>
                                <span>Present: <strong className="text-green-600">{presentCount}</strong></span>
                                <span>Absent: <strong className="text-red-500">{absentCount}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                {saving && (
                                    <div className="w-32 bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${(saveProgress.done / saveProgress.total) * 100}%` }}
                                        />
                                    </div>
                                )}
                                <button
                                    className="h-9 px-6 rounded-md font-bold text-sm shadow-sm transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={handleSave}
                                    disabled={students.length === 0 || saving}
                                >
                                    {saving ? `Saving ${saveProgress.done}/${saveProgress.total}...` : 'Save Attendance'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {students.length === 0 && fetchedFor && (
                    <div className="px-6 py-12 text-center text-gray-400">
                        <svg className="mx-auto w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm font-medium">No students found in this group</p>
                        <p className="text-xs mt-1">Try selecting a different Student Group</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickAttendance;
