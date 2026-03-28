import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const GRADING_BASIS = ['Latest Highest Score', 'Latest Attempt'];

const emptyForm = () => ({
    title: '',
    questions: [], // Child table: Quiz Question
    passing_score: 75.0,
    is_time_bound: false,
    duration: 0,
    max_attempts: 1,
    grading_basis: 'Latest Highest Score',
});

const Quiz = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [quizzes, setQuizzes] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchQuizzes();
        } else {
            if (editingRecord) {
                fetchQuiz(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchQuizzes = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Quiz?fields=["name","title","passing_score","max_attempts"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setQuizzes(response.data.data || []);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchQuiz = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Quiz/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                title: d.title || '',
                questions: (d.questions || []).map(q => ({
                    question_link: q.question_link || '',
                    question: q.question || '',
                    name: q.name
                })),
                passing_score: d.passing_score || 75.0,
                is_time_bound: !!d.is_time_bound,
                duration: d.duration || 0,
                max_attempts: d.max_attempts || 1,
                grading_basis: d.grading_basis || 'Latest Highest Score',
            });
        } catch (err) {
            console.error('Error fetching quiz:', err);
            notification.error({ message: 'Error', description: 'Failed to load quiz data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Questions Child Table ---
    const addQuestionRow = () => {
        setForm(prev => ({
            ...prev,
            questions: [...prev.questions, { question_link: '', question: '' }]
        }));
    };

    const removeQuestionRow = (index) => {
        const newQuestions = [...form.questions];
        newQuestions.splice(index, 1);
        setForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateQuestionRow = (index, field, value) => {
        const newQuestions = [...form.questions];
        newQuestions[index][field] = value;
        setForm(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSave = async () => {
        if (!form.title) {
            notification.warning({ message: 'Title is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                questions: form.questions.map(q => ({
                    question_link: q.question_link,
                    question: q.question
                })),
                passing_score: parseFloat(form.passing_score) || 0,
                is_time_bound: form.is_time_bound ? 1 : 0,
                duration: parseInt(form.duration) || 0,
                max_attempts: parseInt(form.max_attempts) || 1,
                grading_basis: form.grading_basis,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Quiz/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Quiz updated successfully.' });
            } else {
                await API.post('/api/resource/Quiz', payload);
                notification.success({ message: 'Quiz created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await API.delete(`/api/resource/Quiz/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Quiz deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = quizzes.filter(q => {
            if (!search) return true;
            const searchStr = search.toLowerCase();
            return (
                (q.name || '').toLowerCase().includes(searchStr) ||
                (q.title || '').toLowerCase().includes(searchStr)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Quiz</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchQuizzes} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Quiz
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Title or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {quizzes.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Title</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-center">Passing Score</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-center">Max Attempts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1 text-gray-400 italic">No Quizzes Found</p>
                                        <p className="text-sm text-gray-300">Try adjusting your search or add a new quiz.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.title || row.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-900 font-semibold">{row.passing_score || '0.000'}%</td>
                                        <td className="px-4 py-3 text-center text-gray-600 font-mono">{row.max_attempts || 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading quiz data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Quiz'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[600px]">
                <div className="max-w-4xl space-y-8">
                    <div>
                        <label className={labelStyle}>Title *</label>
                        <input type="text" className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Enter quiz title..." />
                    </div>

                    {/* Questions Table */}
                    <div className="pt-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-4">Questions</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left w-12 text-gray-400 font-normal">No.</th>
                                        <th className="px-3 py-2.5 text-left">Question Link *</th>
                                        <th className="px-3 py-2.5 text-left">Question</th>
                                        <th className="px-3 py-2 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {form.questions.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic text-sm">No questions added yet</td></tr>
                                    ) : (
                                        form.questions.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                <td className="px-3 py-2.5">
                                                    <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.question_link} onChange={e => updateQuestionRow(idx, 'question_link', e.target.value)} placeholder="Link ID..." />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 font-medium"
                                                        value={row.question} onChange={e => updateQuestionRow(idx, 'question', e.target.value)} placeholder="Text preview..." />
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button onClick={() => removeQuestionRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addQuestionRow}>
                            Add Row
                        </button>
                    </div>

                    {/* Configuration Section */}
                    <div className="pt-8 border-t border-gray-50">
                        <h3 className="font-bold text-gray-900 text-base mb-6 capitalize tracking-tight">Quiz Configuration</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Passing Score *</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" className={`${inputStyle} w-40 font-bold text-blue-600`} value={form.passing_score} onChange={e => updateField('passing_score', e.target.value)} />
                                        <span className="text-gray-400 text-xs font-medium">Score out of 100</span>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Max Attempts *</label>
                                    <input type="number" className={`${inputStyle} w-40 font-mono`} value={form.max_attempts} onChange={e => updateField('max_attempts', e.target.value)} />
                                    <div className="text-[11px] text-gray-400 mt-1 italic">Enter 0 to waive limit</div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Grading Basis</label>
                                    <select className={inputStyle} value={form.grading_basis} onChange={e => updateField('grading_basis', e.target.value)}>
                                        {GRADING_BASIS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="is_time_bound" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={form.is_time_bound} onChange={e => updateField('is_time_bound', e.target.checked)} />
                                    <label htmlFor="is_time_bound" className="text-sm font-semibold text-gray-800">Is Time-Bound</label>
                                </div>
                                {form.is_time_bound && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                        <label className={labelStyle}>Duration (In Seconds)</label>
                                        <input type="number" className={inputStyle} value={form.duration} onChange={e => updateField('duration', e.target.value)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
