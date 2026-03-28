import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    student: '',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    attendance_based_on: 'Student Group',
    student_group: '',
    mark_as_present: 0,
    reason: '',
});

const StudentLeaveApplication = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [leaveList, setLeaveList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        students: [],
        studentGroups: [],
        attendanceBasedOn: ['Student Group', 'Course'],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchLeaveList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchLeave(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [sRes, sgRes] = await Promise.all([
                safeGet('/api/resource/Student?limit_page_length=None'),
                safeGet('/api/resource/Student Group?limit_page_length=None'),
            ]);
            setDropdowns(prev => ({
                ...prev,
                students: sRes.data.data?.map(d => d.name) || [],
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
            }));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchLeaveList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Leave Application?fields=["name","student","from_date","to_date","mark_as_present"]&limit_page_length=None&order_by=from_date desc';
            const response = await API.get(url);
            setLeaveList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching leave applications:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchLeave = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Leave Application/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching leave record:', err);
            notification.error({ message: 'Error', description: 'Failed to load leave application.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student || !form.from_date || !form.to_date) {
            notification.warning({ message: 'Missing Fields', description: 'Student, From Date and To Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Student Leave Application/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Leave application updated.' });
            } else {
                await API.post('/api/resource/Student Leave Application', form);
                notification.success({ message: 'Leave application submitted.' });
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
        if (!window.confirm('Delete this leave application?')) return;
        try {
            await API.delete(`/api/resource/Student Leave Application/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white shadow-sm";
    const labelStyle = "block text-sm font-semibold text-gray-500 mb-1 tracking-tight";

    if (view === 'list') {
        const filtered = leaveList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.student || '').toLowerCase().includes(q) ||
                (s.name || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Leave Application</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm rounded-md hover:bg-gray-50 flex items-center gap-2" onClick={fetchLeaveList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-semibold hover:bg-blue-700 transition shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Leave Request
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Student..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f8fafc] border-b border-gray-200">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">ID</th>
                                <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Student</th>
                                <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">From Date</th>
                                <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">To Date</th>
                                <th className="px-5 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Mark as Present</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Data is loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No leave applications found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 font-medium">
                                            <button className="text-blue-600 hover:text-blue-800" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-800">{row.student}</td>
                                        <td className="px-5 py-4">{row.from_date}</td>
                                        <td className="px-5 py-4">{row.to_date}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.mark_as_present ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {row.mark_as_present ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24">Fetching record details...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `Edit ${editingRecord}` : 'New Student Leave Application'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold uppercase tracking-widest shadow-sm">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center bg-white shadow-sm" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 flex items-center shadow-sm" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-sm transition-all" onClick={handleSave} disabled={saving}>
                        {saving ? 'Processing...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-10">
                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                    <div className="col-span-1">
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
                            <option value="">Select Student</option>
                            {dropdowns.students.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1 space-y-4">
                        <div>
                            <label className={labelStyle}>From Date *</label>
                            <input type="date" className={inputStyle} value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>To Date *</label>
                            <input type="date" className={inputStyle} value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} />
                        </div>
                    </div>

                    <div className="col-span-1 pt-4 border-t border-gray-50">
                        <div className="mb-6">
                            <label className={labelStyle}>Attendance Based On</label>
                            <select className={inputStyle} value={form.attendance_based_on} onChange={e => setForm({ ...form, attendance_based_on: e.target.value })}>
                                {dropdowns.attendanceBasedOn.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className={labelStyle}>Student Group *</label>
                            <select className={inputStyle} value={form.student_group} onChange={e => setForm({ ...form, student_group: e.target.value })}>
                                <option value="">Select Group</option>
                                {dropdowns.studentGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                            </select>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                             <input 
                                type="checkbox" 
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                                checked={form.mark_as_present} 
                                onChange={e => setForm({ ...form, mark_as_present: e.target.checked ? 1 : 0 })} 
                             />
                             <div>
                                <label className="text-sm font-semibold text-gray-800 block">Mark as Present</label>
                                <p className="text-[11px] text-gray-500 leading-relaxed mt-1">Check this to mark the student as present in case the student is not attending the institute to participate or represent the institute in any event.</p>
                             </div>
                        </div>
                    </div>

                    <div className="col-span-1 pt-4 border-t border-gray-50 text-right">
                        <label className={`${labelStyle} text-left`}>Reason</label>
                        <textarea 
                            className={`${inputStyle} h-40 resize-none pt-3`} 
                            placeholder="Please provide the reason for leave..."
                            value={form.reason} 
                            onChange={e => setForm({ ...form, reason: e.target.value })} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentLeaveApplication;
