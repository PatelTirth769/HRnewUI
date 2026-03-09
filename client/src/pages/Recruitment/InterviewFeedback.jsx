import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function InterviewFeedback() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    // Master Dropdown Data
    const [interviews, setInterviews] = useState([]);
    const [users, setUsers] = useState([]);

    const defaultForm = {
        interview: '',
        interview_round: '', // fetched read-only
        job_applicant: '',   // fetched read-only
        interviewer: '',
        result: '',
        feedback: '',
        skill_assessment: [] // Child table
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Interview Feedback?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Interview Feedbacks' });
        } finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [interviewsRes, usersRes] = await Promise.all([
                API.get('/api/resource/Interview?limit_page_length=None&fields=["*"]'),
                API.get('/api/resource/User?limit_page_length=None&fields=["name","full_name"]') // Or whatever doctype represents Interviewer pool
            ]);
            setInterviews(interviewsRes.data?.data || []);
            setUsers(usersRes.data?.data || []);
        } catch (err) {
            console.error('Failed fetching masters', err);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else if (view === 'form') {
            fetchMasters();
        }
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Interview Feedback/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                interview: d.interview || '',
                interview_round: d.interview_round || '',
                job_applicant: d.job_applicant || '',
                interviewer: d.interviewer || '',
                result: d.result || '',
                feedback: d.feedback || d.interviewer_feedback || '',
                skill_assessment: Array.isArray(d.skill_assessment)
                    ? d.skill_assessment.map(row => ({ skill: row.skill || '', score: row.score || 0 }))
                    : []
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Interview Feedback details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.interview || !formData.interviewer || !formData.result) {
            notification.warning({ message: 'Please fill all required Details fields.' });
            return;
        }

        const hasEmptySkill = formData.skill_assessment.some(row => !row.skill || row.skill.trim() === '');
        if (hasEmptySkill) {
            notification.warning({ message: 'Please complete all Skill names in the assessment table.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                interview: formData.interview,
                interviewer: formData.interviewer,
                result: formData.result,
                feedback: formData.feedback,
                skill_assessment: formData.skill_assessment.map(row => ({ skill: row.skill, score: row.score }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Interview Feedback/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Feedback updated successfully' });
            } else {
                const res = await API.post('/api/resource/Interview Feedback', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Feedback ${newName || ''} created successfully` });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: `Save failed: ${err.response?.data?.exc || err.message}` });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Interview Feedback/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleAddSkill = () => {
        setFormData(prev => ({
            ...prev,
            skill_assessment: [...prev.skill_assessment, { skill: '', score: 0 }]
        }));
    };

    const updateSkillRow = (index, key, value) => {
        const newTable = [...formData.skill_assessment];
        newTable[index][key] = value;
        updateForm('skill_assessment', newTable);
    };

    const removeSkillRow = (index) => {
        const newTable = formData.skill_assessment.filter((_, i) => i !== index);
        updateForm('skill_assessment', newTable);
    };

    const handleInterviewChange = (val) => {
        const selected = interviews.find(i => i.name === val);
        setFormData(prev => ({
            ...prev,
            interview: val,
            interview_round: selected?.interview_round || '',
            job_applicant: selected?.job_applicant || ''
        }));
    };

    // Calculate Average Rating dynamically
    const computedAverage = formData.skill_assessment.length > 0
        ? formData.skill_assessment.reduce((sum, row) => sum + Number(row.score || 0), 0) / formData.skill_assessment.length
        : 0;

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.interview || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.interviewer || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.result || '').toLowerCase().includes(searchId.toLowerCase())
    );

    const hasActiveFilters = searchId !== '';
    const clearFilters = () => { setSearchId(''); };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto font-sans">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 focus:outline-none" onClick={() => setView('list')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Interview Feedback'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 ml-1">Not Saved</span>
                        )}
                    </div>
                    <div>
                        <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black shadow-sm disabled:opacity-50 transition-colors" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-8">

                    {/* DETAILS */}
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Details</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Interview <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full bg-gray-50 border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                        value={formData.interview}
                                        onChange={e => handleInterviewChange(e.target.value)}
                                    >
                                        <option value=""></option>
                                        {interviews.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Interview Round</label>
                                    <input type="text"
                                        readOnly
                                        className="w-full bg-transparent border-none px-3 py-2 text-sm text-gray-900 font-medium cursor-default focus:outline-none"
                                        value={formData.interview_round}
                                        placeholder="Fetched automatically"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-400 mb-1.5">Job Applicant</label>
                                    <input type="text"
                                        readOnly
                                        className="w-full bg-transparent border-none px-3 py-2 text-sm text-gray-900 font-medium cursor-default focus:outline-none"
                                        value={formData.job_applicant}
                                        placeholder="Fetched automatically"
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Interviewer <span className="text-red-500">*</span></label>
                                    <input type="text"
                                        list="userList"
                                        className="w-full bg-gray-50 border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                        value={formData.interviewer}
                                        placeholder="e.g Administrator"
                                        onChange={e => updateForm('interviewer', e.target.value)}
                                    />
                                    <datalist id="userList">
                                        {users.map(u => <option key={u.name} value={u.name}>{u.full_name || u.name}</option>)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Result <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full bg-gray-50 border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                        value={formData.result}
                                        onChange={e => updateForm('result', e.target.value)}
                                    >
                                        <option value=""></option>
                                        <option value="Pending">Pending</option>
                                        <option value="Cleared">Cleared</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SKILL ASSESSMENT */}
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Skill Assessment</h3>
                        <div className="border border-gray-100 rounded-md overflow-hidden bg-white mb-3">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] text-gray-500 font-medium tracking-wide">
                                    <tr>
                                        <th className="px-3 py-2 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 shadow-sm" disabled /></th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100">No.</th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100 w-1/2">Skill <span className="text-red-400 font-normal">*</span></th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100">Rating <span className="text-red-400 font-normal">*</span></th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100 font-normal">⚙</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.skill_assessment.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-8 text-center text-gray-400 text-xs">No Data</td>
                                        </tr>
                                    ) : (
                                        formData.skill_assessment.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-center">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-500 text-xs border-l border-gray-100">{i + 1}</td>
                                                <td className="px-0 py-0 border-l border-gray-100">
                                                    <input type="text"
                                                        className="w-full h-full bg-transparent border-none px-3 py-3 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none"
                                                        value={row.skill}
                                                        onChange={(e) => updateSkillRow(i, 'skill', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-0 border-l border-gray-100">
                                                    {/* Interactive Interactive 5-star Rating Renderer */}
                                                    <div className="flex gap-[2px] items-center h-full group">
                                                        {[1, 2, 3, 4, 5].map((star) => {
                                                            const isFull = row.score >= star;
                                                            return (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => updateSkillRow(i, 'score', star)}
                                                                    className={`focus:outline-none transition-transform hover:scale-110 ${isFull ? 'text-[#ffb100]' : 'text-[#e2e8f0] hover:text-[#ffd666]' // Dim yellow on hover
                                                                        }`}
                                                                >
                                                                    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                                    </svg>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center border-l border-gray-100">
                                                    <button
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                        onClick={() => removeSkillRow(i)}
                                                        title="Delete row"
                                                    >
                                                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-start mt-4">
                            <button
                                className="text-[11px] bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 font-semibold py-1.5 px-3 rounded inline-flex items-center transition-colors"
                                onClick={handleAddSkill}
                            >
                                Add Row
                            </button>

                            {/* Calculated Average Rating (Read-only) */}
                            <div className="flex flex-col gap-1 items-start mr-10">
                                <label className="block text-[12px] font-medium text-gray-500">Average Rating</label>
                                <div className="flex gap-[2px] items-center pt-1 pb-2">
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const isFull = computedAverage >= star;
                                        const isHalf = !isFull && computedAverage >= (star - 0.5);
                                        return (
                                            <div key={star} className="relative w-[18px] h-[18px]">
                                                {/* Dim Background */}
                                                <svg className={`w-[18px] h-[18px] absolute top-0 left-0 ${isFull ? 'text-[#ffb100]' : 'text-[#f1f5f9]'}`} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                </svg>
                                                {/* Bright Foreground cut by 50% for halves */}
                                                {isHalf && (
                                                    <div className="absolute top-0 left-0 h-full w-[50%] overflow-hidden">
                                                        <svg className={`w-[18px] h-[18px] text-[#ffb100]`} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FEEDBACK SUMMARY */}
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Feedback</h3>
                        <textarea
                            className="w-full bg-gray-50 border-transparent rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700 min-h-[160px] resize-y"
                            value={formData.feedback}
                            placeholder="Provide your comprehensive feedback here..."
                            onChange={e => updateForm('feedback', e.target.value)}
                        ></textarea>
                    </div>

                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Interview Feedback</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-black shadow-sm transition-colors" onClick={handleNew}>
                        + Add Interview Feedback
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 bg-[#f4f5f6] rounded px-3 py-1.5 text-[13px] w-64 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-shadow"
                    placeholder="Search by ID, Interview..."
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <button className="text-gray-500 hover:text-gray-700 text-[13px] border border-gray-300 px-3 py-1.5 rounded bg-white flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filter
                    <span className="ml-1 text-gray-400">×</span>
                </button>

                {hasActiveFilters && (<button className="text-gray-500 hover:text-gray-700 text-[13px] bg-gray-100 px-3 py-1.5 rounded transition-colors" onClick={clearFilters}>Clear filters to see all feeds.</button>)}
            </div>

            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                        <div className="text-gray-300 mb-4 opacity-70">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="text-[13px] text-gray-500 mb-4">No Feedback found. Clear filters or create a new one.</p>
                        <button className="px-4 py-1.5 bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 text-[13px] font-medium rounded transition-colors" onClick={handleNew}>
                            Create a new Interview Feedback
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="text-left px-4 py-2 font-medium">Name</th>
                                    <th className="text-left px-4 py-2 font-medium">Interview</th>
                                    <th className="text-left px-4 py-2 font-medium">Interviewer</th>
                                    <th className="text-left px-4 py-2 font-medium">Result</th>
                                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                        <td className="px-4 py-2 font-medium text-gray-900">
                                            <button className="hover:text-blue-600 text-left" onClick={() => handleEdit(row)}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{row.interview || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{row.interviewer || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${row.result === 'Pending' ? 'bg-orange-100 text-orange-700' : row.result === 'Cleared' ? 'bg-green-100 text-green-700' : row.result === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {row.result || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs mr-3 transition-colors" onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-500 hover:text-red-700 font-medium text-xs transition-colors" onClick={() => handleDelete(row)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
