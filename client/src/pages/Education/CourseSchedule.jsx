import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    student_group: '',
    course: '',
    instructor: '',
    room: '',
    schedule_date: new Date().toISOString().split('T')[0],
    from_time: '',
    to_time: '',
    color: 'blue',
    naming_series: 'EDU-CSH-.YYYY.-',
});

const CourseSchedule = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [scheduleList, setScheduleList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        studentGroups: [],
        courses: [],
        instructors: [],
        rooms: [],
        namingSeries: ['EDU-CSH-.YYYY.-'],
        colors: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchScheduleList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchSchedule(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(err => ({ data: { data: [] } }));
            const [sgRes, cRes, iRes, rRes] = await Promise.all([
                safeGet('/api/resource/Student Group?limit_page_length=None'),
                safeGet('/api/resource/Course?limit_page_length=None'),
                safeGet('/api/resource/Instructor?limit_page_length=None'),
                safeGet('/api/resource/Room?limit_page_length=None'),
            ]);
            setDropdowns(prev => ({
                ...prev,
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                courses: cRes.data.data?.map(d => d.name) || [],
                instructors: iRes.data.data?.map(d => d.name) || [],
                rooms: rRes.data.data?.map(d => d.name) || [],
            }));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchScheduleList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Course Schedule?fields=["name","student_group","course","instructor","schedule_date","from_time","to_time"]&limit_page_length=None&order_by=schedule_date desc';
            const response = await API.get(url);
            setScheduleList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching schedule list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchSchedule = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Course Schedule/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching schedule:', err);
            notification.error({ message: 'Error', description: 'Failed to load schedule data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student_group || !form.course || !form.schedule_date) {
            notification.warning({ message: 'Missing Fields', description: 'Student Group, Course and Schedule Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Course Schedule/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Schedule updated successfully.' });
            } else {
                await API.post('/api/resource/Course Schedule', form);
                notification.success({ message: 'Schedule created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await API.delete(`/api/resource/Course Schedule/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Schedule deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    if (view === 'list') {
        const filtered = scheduleList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.student_group || '').toLowerCase().includes(q) ||
                (s.course || '').toLowerCase().includes(q) ||
                (s.instructor || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Course Schedule</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchScheduleList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Schedule
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Group, Course, Instructor..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student Group</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Course</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Timing</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No schedule records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-medium" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3">{row.student_group}</td>
                                        <td className="px-4 py-3">{row.course}</td>
                                        <td className="px-4 py-3">{row.schedule_date}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.from_time} - {row.to_time}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20">Loading schedule data...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">{editingRecord ? `Edit ${editingRecord}` : 'New Course Schedule'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold uppercase">Not Saved</span>}
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-4 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100" onClick={handleDelete}>Delete</button>}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 shadow-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Student Group *</label>
                        <select className={inputStyle} value={form.student_group} onChange={e => setForm({ ...form, student_group: e.target.value })}>
                            <option value="">Select Group</option>
                            {dropdowns.studentGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Naming Series</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => setForm({ ...form, naming_series: e.target.value })}>
                            {dropdowns.namingSeries.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Course *</label>
                        <select className={inputStyle} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                            <option value="">Select Course</option>
                            {dropdowns.courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Class Schedule Color</label>
                        <select className={inputStyle} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}>
                            {dropdowns.colors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Instructor</label>
                        <select className={inputStyle} value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}>
                            <option value="">Select Instructor</option>
                            {dropdowns.instructors.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Room *</label>
                        <select className={inputStyle} value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                            <option value="">Select Room</option>
                            {dropdowns.rooms.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Schedule Date *</label>
                        <input type="date" className={inputStyle} value={form.schedule_date} onChange={e => setForm({ ...form, schedule_date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>From Time *</label>
                            <input type="time" className={inputStyle} value={form.from_time} onChange={e => setForm({ ...form, from_time: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>To Time *</label>
                            <input type="time" className={inputStyle} value={form.to_time} onChange={e => setForm({ ...form, to_time: e.target.value })} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseSchedule;
