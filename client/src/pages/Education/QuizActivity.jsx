import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    enrollment: '',
    quiz: '',
    activity_date: new Date().toISOString().split('T')[0],
    time_taken: 0,
    score: 0,
    results: [],
});

const QuizActivity = () => {
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
        quizzes: [],
        questions: [],
        options: {}, // Record-based options cache
    });

    useEffect(() => {
        if (view === 'list') {
            fetchActivityList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchActivity(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [eRes, qRes, qnRes] = await Promise.all([
                safeGet('/api/resource/Course Enrollment?limit_page_length=None'),
                safeGet('/api/resource/Quiz?limit_page_length=None'),
                safeGet('/api/resource/Quiz Question?limit_page_length=None'),
            ]);
            setDropdowns(prev => ({
                ...prev,
                enrollments: eRes.data.data?.map(d => d.name) || [],
                quizzes: qRes.data.data?.map(d => d.name) || [],
                questions: qnRes.data.data?.map(d => d.name) || [],
            }));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchActivityList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Quiz Activity?fields=["name","enrollment","quiz","score","activity_date"]&limit_page_length=None&order_by=activity_date desc';
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
            const res = await API.get(`/api/resource/Quiz Activity/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching activity:', err);
            notification.error({ message: 'Error', description: 'Failed to load quiz activity.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.enrollment || !form.quiz || !form.activity_date) {
            notification.warning({ message: 'Missing Fields', description: 'Enrollment, Quiz and Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Quiz Activity/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Quiz Activity updated.' });
            } else {
                await API.post('/api/resource/Quiz Activity', form);
                notification.success({ message: 'Quiz Activity recorded.' });
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
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Quiz Activity/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Record deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Handlers
    const addResultRow = () => {
        const newResults = [...(form.results || []), { question: '', selected_option: '', result: 'Correct' }];
        setForm({ ...form, results: newResults });
    };

    const removeResultRow = (index) => {
        const newResults = form.results.filter((_, i) => i !== index);
        setForm({ ...form, results: newResults });
    };

    const updateResultRow = (index, field, value) => {
        const newResults = [...form.results];
        newResults[index][field] = value;
        setForm({ ...form, results: newResults });
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white hover:border-gray-400";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";

    if (view === 'list') {
        const filtered = activityList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.enrollment || '').toLowerCase().includes(q) ||
                (s.quiz || '').toLowerCase().includes(q) ||
                (s.name || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Quiz Activity</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchActivityList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-semibold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Quiz Activity
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Enrollment or Quiz..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Enrollment</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Quiz</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Score (%)</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Syncing quiz logs...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No activity records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 font-medium">{row.enrollment}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.quiz}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{row.score}%</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">{row.activity_date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24 font-bold tracking-widest">LOADING...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-40">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight italic">{editingRecord ? `DETAILS: ${editingRecord}` : 'NEW QUIZ ACTIVITY'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-wider">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 bg-white" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-sm" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-10">
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Enrollment *</label>
                        <select className={inputStyle} value={form.enrollment} onChange={e => setForm({ ...form, enrollment: e.target.value })}>
                            <option value="">Select Enrollment</option>
                            {dropdowns.enrollments.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Quiz *</label>
                        <select className={inputStyle} value={form.quiz} onChange={e => setForm({ ...form, quiz: e.target.value })}>
                            <option value="">Select Quiz</option>
                            {dropdowns.quizzes.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Activity Date *</label>
                        <input type="date" className={inputStyle} value={form.activity_date} onChange={e => setForm({ ...form, activity_date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>Time Taken (Min)</label>
                            <input type="number" className={inputStyle} value={form.time_taken} onChange={e => setForm({ ...form, time_taken: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Score (%)</label>
                            <input type="number" className={inputStyle} value={form.score} onChange={e => setForm({ ...form, score: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Question Wise Results</h3>
                        <button onClick={addResultRow} className="text-blue-600 text-xs font-bold hover:underline">+ Add Result Row</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight w-8">#</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight">Question *</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight">Selected Option</th>
                                    <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight">Result *</th>
                                    <th className="px-3 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(form.results || []).length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic bg-gray-50/20">No detailed logs added.</td></tr>
                                ) : (
                                    form.results.map((row, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="px-3 py-2 text-gray-400 font-bold">{idx + 1}</td>
                                            <td className="px-3 py-2">
                                                <select className={inputStyle} value={row.question} onChange={e => updateResultRow(idx, 'question', e.target.value)}>
                                                    <option value="">Select Question</option>
                                                    {dropdowns.questions.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="text" className={inputStyle} placeholder="Option text/ID" value={row.selected_option} onChange={e => updateResultRow(idx, 'selected_option', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <select className={inputStyle} value={row.result} onChange={e => updateResultRow(idx, 'result', e.target.value)}>
                                                    <option value="Correct">Correct</option>
                                                    <option value="Incorrect">Incorrect</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button onClick={() => removeResultRow(idx)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizActivity;
