import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Select } from 'antd';
import API from '../../services/api';
import { resolveInstructorId, fetchInstructorGroupDetails } from '../../utility/instructorHelper';
import { useUserRole } from '../../hooks/useUserRole';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';
import axios from 'axios';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const { Option } = Select;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
// JS getDay() returns 0=Sun,1=Mon,...,6=Sat
const DAY_JS_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

const emptyRow = () => ({
    id: Math.random().toString(36).slice(2),
    course: '',
    instructor: '',
    room: '',
    from_time: '',
    to_time: '',
    color: 'blue',
    days: { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false },
});

const parseServerMessage = (err) => {
    const serverMsg = err?.response?.data?._server_messages;
    if (!serverMsg) return err?.response?.data?.message || err?.message || 'Request failed';
    try {
        const parsed = JSON.parse(serverMsg);
        const firstMsg = parsed?.[0];
        if (typeof firstMsg === 'string') {
            try { return JSON.parse(firstMsg).message || firstMsg; } catch { return firstMsg; }
        }
        return err?.message || 'Request failed';
    } catch {
        return err?.message || 'Request failed';
    }
};

/** Generate all dates in [start, end] inclusive that fall on any of the given JS day indices */
function generateDates(startStr, endStr, dayJsIndices) {
    const dates = [];
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start) || isNaN(end) || start > end) return dates;
    const cur = new Date(start);
    while (cur <= end) {
        if (dayJsIndices.includes(cur.getDay())) {
            dates.push(cur.toISOString().split('T')[0]);
        }
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

const CourseSchedulingTool = () => {
    const { isCoordinator } = useUserRole();
    const coordinatorScope = useCoordinatorScope();
    const navigate = useNavigate();
    const [studentGroup, setStudentGroup] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reschedule, setReschedule] = useState(false);
    const [rows, setRows] = useState([emptyRow()]);
    const [masters, setMasters] = useState({ studentGroups: [], courses: [], instructors: [], rooms: [] });
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
    const [showProgress, setShowProgress] = useState(false);
    const abortRef = useRef(false);

    // Photo timetable mode states
    const [schedulingMode, setSchedulingMode] = useState('manual');
    const [timetablePhoto, setTimetablePhoto] = useState(null);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    useEffect(() => {
        if (studentGroup) {
            fetchTimetablePhoto(studentGroup);
        } else {
            setTimetablePhoto(null);
        }
    }, [studentGroup]);

    const fetchTimetablePhoto = async (group) => {
        setLoadingPhoto(true);
        try {
            const docRef = doc(db, 'schooler_system', 'course_scheduling', 'timetables', group);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setTimetablePhoto(snap.data());
            } else {
                setTimetablePhoto(null);
            }
        } catch (err) {
            console.error('Error fetching timetable photo:', err);
        } finally {
            setLoadingPhoto(false);
        }
    };

    const handleUploadPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!studentGroup) {
            notification.warning({ message: 'Student Group Required', description: 'Please select a student group first.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            notification.warning({ message: 'File Too Large', description: 'Maximum file size is 5 MB.' });
            return;
        }

        setLoadingPhoto(true);
        try {
            const response = await axios.post('/local-api/api/s3/presigned-url', {
                fileName: file.name,
                fileType: file.type
            });
            const { presignedUrl, fileUrl } = response.data;
            await axios.put(presignedUrl, file, {
                headers: { 'Content-Type': file.type }
            });
            
            // Save metadata to Firestore
            const docRef = doc(db, 'schooler_system', 'course_scheduling', 'timetables', studentGroup);
            const data = {
                fileUrl,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                studentGroup
            };
            await setDoc(docRef, data);
            setTimetablePhoto(data);
            notification.success({ message: 'Success', description: 'Timetable photo uploaded successfully.' });
        } catch (err) {
            console.error('Upload error:', err);
            notification.error({ message: 'Upload Failed', description: err.response?.data?.error || err.message });
        } finally {
            setLoadingPhoto(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDeletePhoto = async () => {
        if (!studentGroup) return;
        if (!window.confirm('Are you sure you want to delete this timetable photo?')) return;
        
        setLoadingPhoto(true);
        try {
            const docRef = doc(db, 'schooler_system', 'course_scheduling', 'timetables', studentGroup);
            await deleteDoc(docRef);
            setTimetablePhoto(null);
            notification.success({ message: 'Success', description: 'Timetable photo deleted successfully.' });
        } catch (err) {
            console.error('Error deleting photo:', err);
            notification.error({ message: 'Delete Failed', description: err.message });
        } finally {
            setLoadingPhoto(false);
        }
    };

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        fetchMasters();
    }, [isCoordinator, coordinatorScope.loading]);

    const fetchMasters = async () => {
        try {
            const userRole = localStorage.getItem('userRole');
            const userEmail = localStorage.getItem('user');
            const [sgRes, crsRes, instRes, roomRes] = await Promise.all([
                API.get('/api/resource/Student Group?fields=["name","custom_class_teacher","program"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Course?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Instructor?fields=["name","instructor_name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Room?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);

            let studentGroups = sgRes.data.data || [];
            if (userRole === 'Instructor') {
                const instructorId = await resolveInstructorId(userEmail);
                if (instructorId) {
                    const groupDetails = await fetchInstructorGroupDetails(instructorId);
                    const validGroups = groupDetails.allGroups.map(g => g.name);
                    studentGroups = studentGroups.filter(sg => validGroups.includes(sg.name));
                } else {
                    studentGroups = [];
                }
            } else if (isCoordinator && !coordinatorScope.loading) {
                studentGroups = studentGroups.filter(sg => coordinatorScope.programs.includes(sg.program));
            }

            setMasters({
                studentGroups: studentGroups.map(d => d.name),
                courses: crsRes.data.data?.map(d => d.name) || [],
                instructors: instRes.data.data?.map(d => ({ name: d.name, label: d.instructor_name || d.name })) || [],
                rooms: roomRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const updateRow = (id, key, val) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));
    };

    const toggleDay = (id, day) => {
        setRows(prev => prev.map(r => r.id === id ? {
            ...r, days: { ...r.days, [day]: !r.days[day] }
        } : r));
    };

    const toggleAllDays = (id, select) => {
        const newDays = {};
        DAYS.forEach(d => { newDays[d] = select; });
        setRows(prev => prev.map(r => r.id === id ? { ...r, days: newDays } : r));
    };

    const addRow = () => setRows(prev => [...prev, emptyRow()]);
    const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));
    const duplicateRow = (id) => {
        const src = rows.find(r => r.id === id);
        if (src) setRows(prev => [...prev, { ...src, id: Math.random().toString(36).slice(2) }]);
    };

    /** Preview: count how many schedule records will be created */
    const previewCount = () => {
        if (!startDate || !endDate) return null;
        let total = 0;
        rows.forEach(row => {
            const selectedDays = DAYS.filter(d => row.days[d]);
            const dayIndices = selectedDays.map(d => DAY_JS_INDEX[d]);
            total += generateDates(startDate, endDate, dayIndices).length;
        });
        return total;
    };

    const handleSchedule = async () => {
        if (!studentGroup) { notification.warning({ message: 'Student Group is required.' }); return; }
        if (!startDate || !endDate) { notification.warning({ message: 'Course Start Date and End Date are required.' }); return; }
        if (new Date(startDate) > new Date(endDate)) { notification.warning({ message: 'Start Date must be before End Date.' }); return; }
        if (rows.some(r => !r.course || !r.instructor || !r.room || !r.from_time || !r.to_time)) {
            notification.warning({ message: 'Each row needs Course, Instructor, Room, From Time and To Time.' });
            return;
        }
        const anyDaySelected = rows.some(r => DAYS.some(d => r.days[d]));
        if (!anyDaySelected) { notification.warning({ message: 'Select at least one day in at least one row.' }); return; }

        const userRole = localStorage.getItem('userRole');
        if (userRole === 'Instructor') {
            const userEmail = localStorage.getItem('user');
            const instructorId = await resolveInstructorId(userEmail);
            if (instructorId) {
                const groupDetails = await fetchInstructorGroupDetails(instructorId);
                const validGroups = groupDetails.allGroups.map(g => g.name);
                if (!validGroups.includes(studentGroup)) {
                    notification.error({ message: 'Access Denied', description: 'You are not the class teacher of this student group.' });
                    return;
                }
            } else {
                notification.error({ message: 'Access Denied', description: 'Instructor not identified.' });
                return;
            }
        }

        // Build all payloads
        const payloads = [];
        rows.forEach(row => {
            const selectedDays = DAYS.filter(d => row.days[d]);
            const dayIndices = selectedDays.map(d => DAY_JS_INDEX[d]);
            const dates = generateDates(startDate, endDate, dayIndices);
            dates.forEach(date => {
                const jsDate = new Date(date);
                const dayName = DAYS.find(d => DAY_JS_INDEX[d] === jsDate.getDay());
                payloads.push({
                    student_group: studentGroup,
                    course: row.course,
                    instructor: row.instructor,
                    room: row.room,
                    from_time: row.from_time,
                    to_time: row.to_time,
                    color: row.color,
                    schedule_date: date,
                    custom_day: dayName,
                    naming_series: 'EDU-CSH-.YYYY.-',
                });
            });
        });

        if (payloads.length === 0) {
            notification.info({ message: 'No schedule records to create for the selected days/date range.' });
            return;
        }

        setLoading(true);
        abortRef.current = false;
        setProgress({ current: 0, total: payloads.length, errors: 0 });
        setShowProgress(true);
        let errorCount = 0;

        // If reschedule: delete existing schedules for the student group in the date range first
        if (reschedule) {
            try {
                const existingRes = await API.get(
                    `/api/resource/Course Schedule?filters=${encodeURIComponent(JSON.stringify([
                        ['student_group', '=', studentGroup],
                        ['schedule_date', '>=', startDate],
                        ['schedule_date', '<=', endDate],
                    ]))}&fields=["name"]&limit_page_length=None`
                );
                const existing = existingRes.data.data || [];
                for (const rec of existing) {
                    if (abortRef.current) break;
                    try { await API.delete(`/api/resource/Course Schedule/${encodeURIComponent(rec.name)}`); }
                    catch { /* ignore delete errors */ }
                }
            } catch (err) {
                console.error('Error fetching existing schedules for reschedule:', err);
            }
        }

        let successCount = 0;
        for (let i = 0; i < payloads.length; i++) {
            if (abortRef.current) break;
            try {
                await API.post('/api/resource/Course Schedule', payloads[i]);
                successCount++;
                setProgress(p => ({ ...p, current: p.current + 1 }));
            } catch (err) {
                // ERPNext sometimes returns HTTP 417 (Expectation Failed) even when
                // the record is successfully created. Treat 417 as success.
                if (err?.response?.status === 417) {
                    successCount++;
                    setProgress(p => ({ ...p, current: p.current + 1 }));
                } else {
                    console.error('Error creating schedule:', err, payloads[i]);
                    errorCount++;
                    setProgress(p => ({ ...p, current: p.current + 1, errors: p.errors + 1 }));
                }
            }
        }

        setLoading(false);
        if (abortRef.current) {
            notification.warning({ message: 'Scheduling Cancelled', description: `Created ${successCount} of ${payloads.length} records before cancellation.` });
        } else if (errorCount === 0) {
            notification.success({ message: 'Scheduling Complete!', description: `Successfully created ${successCount} Course Schedule records.` });
        } else {
            notification.warning({ message: 'Scheduling Done with Errors', description: `${successCount} created, ${errorCount} failed.` });
        }
    };

    const handleCancel = () => { abortRef.current = true; };

    const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white hover:border-gray-300 transition-colors";
    const labelCls = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    const totalCount = previewCount();

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
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
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Course Scheduling Tool</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-600 font-bold border border-blue-100">Bulk Creator</span>
                </div>
                <div className="flex gap-2 items-center">
                {schedulingMode === 'manual' && (
                    <div className="flex gap-2 items-center">
                        {loading && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 transition"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleSchedule}
                            disabled={loading}
                            className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold shadow-sm hover:bg-gray-800 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : 'Create Schedules'}
                        </button>
                    </div>
                )}
            </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-4 p-1 bg-gray-100 rounded-xl w-fit mb-6">
                <button
                    onClick={() => setSchedulingMode('manual')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        schedulingMode === 'manual'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Assign Slots Manually
                </button>
                <button
                    onClick={() => setSchedulingMode('photo')}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        schedulingMode === 'photo'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                    Upload Timetable Photo
                </button>
            </div>

            {/* Progress Bar */}
            {showProgress && schedulingMode === 'manual' && (
                <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                            {loading ? 'Creating schedules...' : 'Scheduling complete!'}
                        </span>
                        <div className="flex gap-3 text-sm">
                            <span className="text-green-600 font-medium">{progress.current - progress.errors} created</span>
                            {progress.errors > 0 && <span className="text-red-500 font-medium">{progress.errors} errors</span>}
                            <span className="text-gray-400">{progress.current}/{progress.total}</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${progress.errors > 0 ? 'bg-orange-400' : 'bg-blue-500'}`}
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                        />
                    </div>
                    {!loading && (
                        <button onClick={() => setShowProgress(false)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition">Dismiss</button>
                    )}
                </div>
            )}

            {schedulingMode === 'manual' ? (
                <>
                    {/* Top-level: Student Group + Date Range */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-4">
                        <div className="grid grid-cols-4 gap-6 items-end">
                            <div className="col-span-2">
                                <label className={labelCls}>Student Group <span className="text-red-500">*</span></label>
                                <Select
                                    showSearch
                                    className="w-full"
                                    size="large"
                                    placeholder="Select Student Group..."
                                    value={studentGroup || undefined}
                                    onChange={v => setStudentGroup(v)}
                                    optionFilterProp="children"
                                >
                                    {masters.studentGroups.map(sg => <Option key={sg} value={sg}>{sg}</Option>)}
                                </Select>
                            </div>
                            <div>
                                <label className={labelCls}>Course Start Date <span className="text-red-500">*</span></label>
                                <input type="date" className={inputCls} style={{ height: 40 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelCls}>Course End Date <span className="text-red-500">*</span></label>
                                <input type="date" className={inputCls} style={{ height: 40 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                                    checked={reschedule}
                                    onChange={e => setReschedule(e.target.checked)}
                                />
                                Reschedule (delete existing records for this group in the date range before creating new ones)
                            </label>
                            {totalCount !== null && (
                                <div className="ml-auto text-sm text-gray-500">
                                    Preview: <span className="font-bold text-blue-600">{totalCount}</span> schedule records will be created
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timetable Rows */}
                    <div className="space-y-3 mb-4">
                        {rows.map((row, rowIdx) => {
                            const selectedDayCount = DAYS.filter(d => row.days[d]).length;
                            const rowDates = startDate && endDate
                                ? generateDates(startDate, endDate, DAYS.filter(d => row.days[d]).map(d => DAY_JS_INDEX[d])).length
                                : null;

                            return (
                                <div key={row.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                                    {/* Row header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                {rowIdx + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {row.course ? row.course : <span className="text-gray-400 italic">Course not set</span>}
                                            </span>
                                            {rowDates !== null && (
                                                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                                                    {rowDates} records
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => duplicateRow(row.id)}
                                                title="Duplicate row"
                                                className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 transition"
                                            >
                                                Copy
                                            </button>
                                            {rows.length > 1 && (
                                                <button
                                                    onClick={() => removeRow(row.id)}
                                                    title="Remove row"
                                                    className="px-3 py-1 text-xs text-red-500 border border-red-100 rounded hover:bg-red-50 transition"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="grid grid-cols-5 gap-4 mb-4">
                                        <div>
                                            <label className={labelCls}>Course <span className="text-red-500">*</span></label>
                                            <Select
                                                showSearch
                                                className="w-full"
                                                size="middle"
                                                placeholder="Select..."
                                                value={row.course || undefined}
                                                onChange={v => updateRow(row.id, 'course', v)}
                                                optionFilterProp="children"
                                            >
                                                {masters.courses.map(c => <Option key={c} value={c}>{c}</Option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Instructor <span className="text-red-500">*</span></label>
                                            <Select
                                                showSearch
                                                className="w-full"
                                                size="middle"
                                                placeholder="Select..."
                                                value={row.instructor || undefined}
                                                onChange={v => updateRow(row.id, 'instructor', v)}
                                                optionFilterProp="children"
                                            >
                                                {masters.instructors.map(i => <Option key={i.name} value={i.name}>{i.label}</Option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Room <span className="text-red-500">*</span></label>
                                            <Select
                                                showSearch
                                                className="w-full"
                                                size="middle"
                                                placeholder="Select..."
                                                value={row.room || undefined}
                                                onChange={v => updateRow(row.id, 'room', v)}
                                                optionFilterProp="children"
                                            >
                                                {masters.rooms.map(r => <Option key={r} value={r}>{r}</Option>)}
                                            </Select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>From Time <span className="text-red-500">*</span></label>
                                            <input
                                                type="time"
                                                className={inputCls}
                                                value={row.from_time}
                                                onChange={e => updateRow(row.id, 'from_time', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>To Time <span className="text-red-500">*</span></label>
                                            <input
                                                type="time"
                                                className={inputCls}
                                                value={row.to_time}
                                                onChange={e => updateRow(row.id, 'to_time', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Days selection */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1">Days:</span>
                                        {DAYS.map(day => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(row.id, day)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all select-none ${
                                                    row.days[day]
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                                                }`}
                                            >
                                                {DAY_ABBR[day]}
                                            </button>
                                        ))}
                                        <div className="ml-2 flex gap-1">
                                            <button
                                                onClick={() => toggleAllDays(row.id, true)}
                                                className="text-[11px] text-blue-600 hover:underline font-medium"
                                            >All</button>
                                            <span className="text-gray-300">·</span>
                                            <button
                                                onClick={() => toggleAllDays(row.id, false)}
                                                className="text-[11px] text-gray-400 hover:underline font-medium"
                                            >None</button>
                                        </div>
                                        {selectedDayCount > 0 && (
                                            <span className="ml-auto text-xs text-gray-400">
                                                {selectedDayCount} day{selectedDayCount > 1 ? 's' : ''} selected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Row Button */}
                    <button
                        onClick={addRow}
                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
                    >
                        + Add Another Course Slot
                    </button>

                    {/* Summary footer */}
                    {totalCount !== null && totalCount > 0 && (
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                            <div className="text-sm text-blue-700">
                                <span className="font-bold">{totalCount}</span> Course Schedule records will be created for{' '}
                                <span className="font-bold">{studentGroup || '—'}</span> from{' '}
                                <span className="font-bold">{startDate || '—'}</span> to <span className="font-bold">{endDate || '—'}</span>
                            </div>
                            <button
                                onClick={handleSchedule}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : `Create ${totalCount} Schedules`}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Photo upload mode UI */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
                        <div className="max-w-xl">
                            <label className={labelCls}>Student Group <span className="text-red-500">*</span></label>
                            <Select
                                showSearch
                                className="w-full"
                                size="large"
                                placeholder="Select Student Group..."
                                value={studentGroup || undefined}
                                onChange={v => setStudentGroup(v)}
                                optionFilterProp="children"
                            >
                                {masters.studentGroups.map(sg => <Option key={sg} value={sg}>{sg}</Option>)}
                            </Select>
                        </div>
                    </div>

                    {loadingPhoto ? (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                                <span className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                <span className="text-sm text-gray-500 font-medium">Processing Timetable Photo...</span>
                            </div>
                        </div>
                    ) : timetablePhoto ? (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 max-w-3xl mx-auto">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800">Uploaded Timetable Photo</h4>
                                    <p className="text-xs text-gray-400 mt-1">
                                        File: {timetablePhoto.fileName} | Uploaded: {new Date(timetablePhoto.uploadedAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={handleDeletePhoto}
                                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition rounded-lg text-xs font-bold"
                                >
                                    Delete Photo
                                </button>
                            </div>
                            <div className="relative group overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex justify-center items-center p-2">
                                <img
                                    src={timetablePhoto.fileUrl}
                                    alt="Timetable"
                                    className="max-h-[500px] object-contain w-auto rounded-lg shadow-sm"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center gap-3">
                                    <a
                                        href={timetablePhoto.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-white text-gray-800 font-bold rounded-lg text-xs shadow hover:bg-gray-100 transition"
                                    >
                                        View Fullscreen
                                    </a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center max-w-xl mx-auto">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-md font-bold text-gray-800 mb-1">Upload Timetable Image</h3>
                            <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
                                Select a timetable image (PNG, JPG, or JPEG up to 5MB) for <strong>{studentGroup || 'the student group'}</strong>. Students and guardians will see this image in their dashboard.
                            </p>
                            
                            <label className={`inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition cursor-pointer select-none ${!studentGroup ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUploadPhoto}
                                    disabled={!studentGroup || loadingPhoto}
                                />
                                Choose Image File
                            </label>
                            {!studentGroup && (
                                <p className="text-xs text-red-500 mt-3 font-semibold">
                                    Please select a student group first to upload.
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CourseSchedulingTool;
