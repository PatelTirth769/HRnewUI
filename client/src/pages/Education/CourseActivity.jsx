import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    course_enrollment: '',
    content_type: '',
    content: '',
    activity_date: new Date().toISOString().split('T')[0],
});

const CourseActivity = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [activityList, setActivityList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        enrollments: [],
        contentItems: [],
    });

    const contentTypes = ['Article', 'Video', 'Quiz'];

    useEffect(() => {
        if (view === 'list') {
            fetchActivityList();
        } else {
            fetchEnrollments();
            if (editingRecord) {
                fetchActivity(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    // Fetch content items whenever content_type changes
    useEffect(() => {
        if (form.content_type) {
            fetchContentItems(form.content_type);
        } else {
            setDropdowns(prev => ({ ...prev, contentItems: [] }));
        }
    }, [form.content_type]);

    const fetchEnrollments = async () => {
        try {
            const res = await API.get('/api/resource/Course Enrollment?limit_page_length=None');
            setDropdowns(prev => ({ ...prev, enrollments: res.data.data?.map(d => d.name) || [] }));
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        }
    };

    const fetchContentItems = async (type) => {
        try {
            const doctypeMap = {
                'Article': 'Article',
                'Video': 'Video',
                'Quiz': 'Quiz'
            };
            const doctype = doctypeMap[type] || type;
            const res = await API.get(`/api/resource/${doctype}?limit_page_length=None`);
            setDropdowns(prev => ({ ...prev, contentItems: res.data.data?.map(d => d.name) || [] }));
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setDropdowns(prev => ({ ...prev, contentItems: [] }));
        }
    };

    const fetchActivityList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Course Activity?fields=["name","course_enrollment","content_type","content","activity_date"]&limit_page_length=None&order_by=activity_date desc';
            const response = await API.get(url);
            setActivityList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching activity list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchActivity = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Course Activity/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching activity:', err);
            notification.error({ message: 'Error', description: 'Failed to load activity data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.course_enrollment || !form.content_type || !form.content || !form.activity_date) {
            notification.warning({ message: 'Missing Fields', description: 'All fields are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Course Activity/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Activity updated successfully.' });
            } else {
                await API.post('/api/resource/Course Activity', form);
                notification.success({ message: 'Course Activity recorded.' });
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
        if (!window.confirm('Delete this activity record?')) return;
        try {
            await API.delete(`/api/resource/Course Activity/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Activity deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white shadow-sm hover:border-gray-400 focus:ring-1 focus:ring-blue-100";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";

    if (view === 'list') {
        const filtered = activityList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.course_enrollment || '').toLowerCase().includes(q) ||
                (s.content || '').toLowerCase().includes(q) ||
                (s.content_type || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Course Activity</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition-colors" onClick={fetchActivityList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-semibold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Log Activity
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm focus:border-blue-500 outline-none transition-all" placeholder="Search Enrollment or Content..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-tight text-xs">Activity ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-tight text-xs">Enrollment</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-tight text-xs">Type</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-tight text-xs">Content</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 uppercase tracking-tight text-xs">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Syncing activity logs...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No activity records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors border-b last:border-0 grow">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 font-medium">{row.course_enrollment}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                row.content_type === 'Quiz' ? 'bg-purple-100 text-purple-700' :
                                                row.content_type === 'Video' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {row.content_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.content}</td>
                                        <td className="px-4 py-3 text-gray-500 font-medium">{row.activity_date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24 font-semibold tracking-wider">LOADING RECORD...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `Edit ${editingRecord}` : 'New Course Activity'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-wider shadow-sm">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center bg-white shadow-sm transition-all text-gray-600" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 flex items-center shadow-sm transition-all" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-sm transition-all" onClick={handleSave} disabled={saving}>
                        {saving ? 'Wait...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-10">
                <div className="grid grid-cols-2 gap-x-12 gap-y-10">
                    <div>
                        <label className={labelStyle}>Course Enrollment *</label>
                        <select className={inputStyle} value={form.course_enrollment} onChange={e => setForm({ ...form, course_enrollment: e.target.value })}>
                            <option value="">Select Enrollment</option>
                            {dropdowns.enrollments.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Activity Date *</label>
                        <input type="date" className={inputStyle} value={form.activity_date} onChange={e => setForm({ ...form, activity_date: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelStyle}>Content Type *</label>
                        <select className={inputStyle} value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value, content: '' })}>
                            <option value="">Select Type</option>
                            {contentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Associated Content *</label>
                        <select className={inputStyle} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} disabled={!form.content_type}>
                            <option value="">{form.content_type ? `Select ${form.content_type}` : 'Select Type First'}</option>
                            {dropdowns.contentItems.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Content updates based on selected type.</p>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-gray-50 flex justify-end">
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Timezone: Asia/Kolkata</span>
                </div>
            </div>
        </div>
    );
};

export default CourseActivity;
