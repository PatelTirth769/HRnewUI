import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    naming_series: 'EDU-ATT-.YYYY.-',
    date: new Date().toISOString().split('T')[0],
    student: '',
    status: 'Present',
    course_schedule: '',
    program: '',
    student_group: '',
});

const StudentAttendance = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [attendanceList, setAttendanceList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        students: [],
        courseSchedules: [],
        programs: [],
        studentGroups: [],
        statusOptions: ['Present', 'Absent', 'On Leave', 'Half Day'],
        namingSeries: ['EDU-ATT-.YYYY.-'],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchAttendanceList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchAttendance(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [sRes, csRes, pRes, sgRes] = await Promise.all([
                safeGet('/api/resource/Student?limit_page_length=None'),
                safeGet('/api/resource/Course Schedule?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Student Group?limit_page_length=None'),
            ]);
            setDropdowns(prev => ({
                ...prev,
                students: sRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
                courseSchedules: csRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
                programs: pRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
                studentGroups: sgRes.data.data?.map(d => ({ value: d.name, label: d.name })) || [],
            }));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchAttendanceList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Attendance?fields=["name","student","date","status","student_group"]&limit_page_length=None&order_by=date desc';
            const response = await API.get(url);
            setAttendanceList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching attendance list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchAttendance = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Attendance/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            notification.error({ message: 'Error', description: 'Failed to load attendance record.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student || !form.date || !form.status) {
            notification.warning({ message: 'Missing Fields', description: 'Student, Date and Status are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Attendance updated successfully.' });
            } else {
                await API.post('/api/resource/Student Attendance', form);
                notification.success({ message: 'Attendance recorded successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
        try {
            await API.delete(`/api/resource/Student Attendance/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Attendance record deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    if (view === 'list') {
        const filtered = attendanceList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.student || '').toLowerCase().includes(q) ||
                (s.name || '').toLowerCase().includes(q) ||
                (s.status || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Student Attendance</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchAttendanceList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Mark Attendance
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Student or Status..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Group</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No attendance records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-medium" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3">{row.student}</td>
                                        <td className="px-4 py-3">{row.date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                row.status === 'Present' ? 'bg-green-100 text-green-700' : 
                                                row.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{row.student_group || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20">Loading record...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">{editingRecord ? `Edit ${editingRecord}` : 'New Student Attendance'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-wider">Not Saved</span>}
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100" onClick={handleDelete}>Delete</button>}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 shadow-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Series</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => setForm({ ...form, naming_series: e.target.value })}>
                            {dropdowns.namingSeries.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Date *</label>
                        <input type="date" className={inputStyle} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
                            <option value="">Select Student</option>
                            {dropdowns.students.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Status *</label>
                        <select className={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            {dropdowns.statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Course Schedule</label>
                        <select className={inputStyle} value={form.course_schedule} onChange={e => setForm({ ...form, course_schedule: e.target.value })}>
                            <option value="">Select Schedule</option>
                            {dropdowns.courseSchedules.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Program</label>
                        <select className={inputStyle} value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                            <option value="">Select Program</option>
                            {dropdowns.programs.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Student Group</label>
                        <select className={inputStyle} value={form.student_group} onChange={e => setForm({ ...form, student_group: e.target.value })}>
                            <option value="">Select Group</option>
                            {dropdowns.studentGroups.map(sg => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
