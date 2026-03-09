import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function Interview() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [activeTab, setActiveTab] = useState('Details');
    const [feedbacks, setFeedbacks] = useState([]); // Store fetched feedbacks

    // Master Dropdown Data
    const [rounds, setRounds] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [openings, setOpenings] = useState([]);

    const defaultForm = {
        interview_round: '',
        status: 'Pending',
        job_applicant: '',
        scheduled_on: '',
        job_opening: '',
        from_time: '',
        resume_link: '',
        to_time: '',
        interview_summary: '',
        interview_details: [], // Child table for Interviewers
        expected_average_rating: 0,
        average_rating: 0
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Interview?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Interviews' });
        } finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [roundRes, appRes, openRes] = await Promise.all([
                API.get('/api/resource/Interview Round?limit_page_length=None'),
                API.get('/api/resource/Job Applicant?limit_page_length=None'),
                API.get('/api/resource/Job Opening?limit_page_length=None')
            ]);
            setRounds(roundRes.data?.data || []);
            setApplicants(appRes.data?.data || []);
            setOpenings(openRes.data?.data || []);
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
            const res = await API.get(`/api/resource/Interview/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                interview_round: d.interview_round || '',
                status: d.status || 'Pending',
                job_applicant: d.job_applicant || '',
                scheduled_on: d.scheduled_on || '',
                job_opening: d.job_opening || '',
                from_time: d.from_time || '',
                resume_link: d.resume_link || '',
                to_time: d.to_time || '',
                interview_summary: d.interview_summary || '',
                interview_details: Array.isArray(d.interview_details)
                    ? d.interview_details.map(row => ({ interviewer: row.interviewer || '' }))
                    : []
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Interview details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setActiveTab('Details');
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setActiveTab('Details');
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.interview_round || !formData.job_applicant || !formData.status || !formData.scheduled_on || !formData.from_time || !formData.to_time) {
            notification.warning({ message: 'Please fill all required fields.' });
            return;
        }

        const hasEmptyInterviewer = formData.interview_details.some(row => !row.interviewer || row.interviewer.trim() === '');
        if (hasEmptyInterviewer) {
            notification.warning({ message: 'Please complete all interviewer names in the table.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                interview_round: formData.interview_round,
                status: formData.status,
                job_applicant: formData.job_applicant,
                scheduled_on: formData.scheduled_on,
                job_opening: formData.job_opening,
                from_time: formData.from_time,
                resume_link: formData.resume_link,
                to_time: formData.to_time,
                interview_summary: formData.interview_summary,
                interview_details: formData.interview_details.map(row => ({ interviewer: row.interviewer }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Interview/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Interview updated successfully' });
            } else {
                const res = await API.post('/api/resource/Interview', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Interview ${newName || ''} created successfully` });
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
            await API.delete(`/api/resource/Interview/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleAddInterviewer = () => {
        setFormData(prev => ({
            ...prev,
            interview_details: [...prev.interview_details, { interviewer: '' }]
        }));
    };

    const updateInterviewerRow = (index, value) => {
        const newTable = [...formData.interview_details];
        newTable[index].interviewer = value;
        updateForm('interview_details', newTable);
    };

    const removeInterviewerRow = (index) => {
        const newTable = formData.interview_details.filter((_, i) => i !== index);
        updateForm('interview_details', newTable);
    };

    // ─── UTILS FOR RATINGS ────────────────────────────────────────
    const renderStars = (ratingValue, emptyColor = 'text-[#e2e8f0]', fullColor = 'text-[#ffb100]') => {
        return (
            <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map(star => {
                    const isFull = ratingValue >= star;
                    const isHalf = !isFull && ratingValue >= (star - 0.5);
                    return (
                        <div key={star} className="relative w-[16px] h-[16px]">
                            {/* Background empty star */}
                            <svg className={`w-[16px] h-[16px] absolute top-0 left-0 ${isFull ? fullColor : emptyColor}`} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                            </svg>
                            {/* Foreground half star clip */}
                            {isHalf && (
                                <div className="absolute top-0 left-0 h-full w-[50%] overflow-hidden">
                                    <svg className={`w-[16px] h-[16px] ${fullColor}`} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Calculate rating Distribution
    const calculateDistribution = () => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const total = feedbacks.length;
        if (total === 0) return { counts, total };

        feedbacks.forEach(f => {
            const rounded = Math.round(f.average_rating || 0);
            if (rounded >= 1 && rounded <= 5) counts[rounded]++;
        });

        return { counts, total };
    };
    const { counts: ratingCounts, total: totalReviews } = calculateDistribution();

    // Calculate aggregated skill ratings across all feedbacks
    const calculateSkillAverages = () => {
        const skillSums = {};
        const skillCounts = {};
        feedbacks.forEach(f => {
            if (Array.isArray(f.skill_assessment)) {
                f.skill_assessment.forEach(skill => {
                    const name = skill.skill || 'Unknown';
                    const score = parseFloat(skill.score) || 0;
                    if (!skillSums[name]) { skillSums[name] = 0; skillCounts[name] = 0; }
                    skillSums[name] += score;
                    skillCounts[name]++;
                });
            }
        });
        return Object.keys(skillSums).map(skillName => ({
            name: skillName,
            average: parseFloat((skillSums[skillName] / skillCounts[skillName]).toFixed(1))
        }));
    };
    const skillAverages = calculateSkillAverages();

    // Circular Progress UI builder
    const CircularProgress = ({ value, label }) => {
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - ((value / 5) * circumference);
        return (
            <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex justify-center items-center">
                    <svg className="transform -rotate-90 w-20 h-20">
                        <circle cx="40" cy="40" r={radius} stroke="#e2e8f0" strokeWidth="6" fill="none" />
                        <circle cx="40" cy="40" r={radius} stroke="#64748b" strokeWidth="6" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[13px] font-semibold text-gray-800">{value}</span>
                </div>
                <span className="text-[12px] font-medium text-gray-700 mt-2 text-center max-w-[100px] leading-tight">{label}</span>
            </div>
        );
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.interview_round || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.job_applicant || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.status || '').toLowerCase().includes(searchId.toLowerCase())
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
                            {editingRecord ? editingRecord.name : 'New Interview'}
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

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-6 pt-2">
                        {['Details', 'Feedback'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-[13px] font-medium transition-colors border-b-2 ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'Details' && (
                            <div className="space-y-8">
                                <h3 className="text-[13px] font-bold text-gray-800">Details</h3>

                                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Interview Round <span className="text-red-500">*</span></label>
                                            <select
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.interview_round}
                                                onChange={e => updateForm('interview_round', e.target.value)}
                                            >
                                                <option value=""></option>
                                                {rounds.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Job Applicant <span className="text-red-500">*</span></label>
                                            <select
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.job_applicant}
                                                onChange={e => updateForm('job_applicant', e.target.value)}
                                            >
                                                <option value=""></option>
                                                {applicants.map(a => <option key={a.name} value={a.name}>{a.applicant_name || a.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Job Opening</label>
                                            <select
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.job_opening}
                                                onChange={e => updateForm('job_opening', e.target.value)}
                                            >
                                                <option value=""></option>
                                                {openings.map(o => <option key={o.name} value={o.name}>{o.job_title || o.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Resume link</label>
                                            <input type="text"
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.resume_link}
                                                onChange={e => updateForm('resume_link', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Status <span className="text-red-500">*</span></label>
                                            <select
                                                className="w-full bg-gray-100 border-transparent rounded-md px-3 py-1.5 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-800"
                                                value={formData.status}
                                                onChange={e => updateForm('status', e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Cleared">Cleared</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Scheduled On <span className="text-red-500">*</span></label>
                                            <input type="date"
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.scheduled_on}
                                                onChange={e => updateForm('scheduled_on', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">From Time <span className="text-red-500">*</span></label>
                                            <input type="time"
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.from_time}
                                                onChange={e => updateForm('from_time', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">To Time <span className="text-red-500">*</span></label>
                                            <input type="time"
                                                className="w-full bg-gray-50 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                                value={formData.to_time}
                                                onChange={e => updateForm('to_time', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100 my-6" />

                                {/* Interviewers Child Table */}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-2">Interviewers</label>
                                    <div className="border border-gray-100 rounded-md overflow-hidden bg-white">
                                        <table className="w-full text-sm">
                                            <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] text-gray-500 font-medium tracking-wide">
                                                <tr>
                                                    <th className="px-3 py-2 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 shadow-sm" disabled /></th>
                                                    <th className="px-3 py-2 w-12 text-center border-l border-gray-100">No.</th>
                                                    <th className="px-3 py-2 text-left border-l border-gray-100">Interviewer</th>
                                                    <th className="px-3 py-2 w-12 text-center border-l border-gray-100 font-normal">⚙</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.interview_details.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-3 py-12 text-center text-gray-400">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                <span className="text-xs font-medium">No Data</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    formData.interview_details.map((row, i) => (
                                                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                            <td className="px-3 py-2 text-center">
                                                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-gray-500 text-xs border-l border-gray-100">{i + 1}</td>
                                                            <td className="px-0 py-0 border-l border-gray-100">
                                                                <input type="text"
                                                                    className="w-full h-full bg-transparent border-none px-3 py-2 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none"
                                                                    value={row.interviewer}
                                                                    onChange={(e) => updateInterviewerRow(i, e.target.value)}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 text-center border-l border-gray-100">
                                                                <div className="flex justify-center items-center gap-2">
                                                                    <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                    <button
                                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                                        onClick={() => removeInterviewerRow(i)}
                                                                        title="Delete row"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        className="mt-3 text-[11px] bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 font-semibold py-1.5 px-3 rounded inline-flex items-center transition-colors"
                                        onClick={handleAddInterviewer}
                                    >
                                        Add Row
                                    </button>
                                </div>

                                <hr className="border-gray-100 my-6" />

                                {/* Ratings Details Tab Section */}
                                <div>
                                    <h3 className="text-[13px] font-bold text-gray-800 mb-4">Ratings</h3>
                                    <div className="grid grid-cols-2 gap-x-12">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Expected Average Rating</label>
                                            <div className="mt-2 bg-gray-50 border border-transparent rounded-md px-3 py-2 inline-flex items-center min-w-[200px]">
                                                {renderStars(formData.expected_average_rating)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Obtained Average Rating</label>
                                            <div className="mt-2 bg-gray-50 border border-transparent rounded-md px-3 py-2 inline-flex items-center min-w-[200px]">
                                                {renderStars(formData.average_rating)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100 my-6" />

                                {/* Ratings Details Tab Section */}
                                <div>
                                    <h3 className="text-[13px] font-bold text-gray-800 mb-4">Ratings</h3>
                                    <div className="grid grid-cols-2 gap-x-12">
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Expected Average Rating</label>
                                            <div className="mt-2 bg-gray-50 border border-transparent rounded-md px-3 py-2 inline-flex items-center min-w-[200px]">
                                                {renderStars(formData.expected_average_rating)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Obtained Average Rating</label>
                                            <div className="mt-2 bg-gray-50 border border-transparent rounded-md px-3 py-2 inline-flex items-center min-w-[200px]">
                                                {renderStars(formData.average_rating)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100 my-6" />

                                {/* Interview Summary */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="text-[13px] font-bold text-gray-800">Interview Summary</h3>
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    <textarea
                                        className="w-full bg-gray-50 border-transparent rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700 min-h-[160px] resize-y"
                                        value={formData.interview_summary}
                                        onChange={e => updateForm('interview_summary', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Feedback' && (
                            <div className="space-y-10 font-sans p-2">
                                {totalReviews === 0 ? (
                                    <div className="py-12 flex justify-center items-center text-sm text-gray-500">
                                        No feedback has been received yet
                                    </div>
                                ) : (
                                    <>
                                        {/* Overall Average Rating Section */}
                                        <div>
                                            <h3 className="text-[15px] font-medium text-gray-900 mb-6">Overall Average Rating</h3>
                                            <div className="flex bg-white mx-8 max-w-2xl">
                                                {/* Left Block */}
                                                <div className="flex flex-col items-center justify-center pr-12 border-r border-gray-100 min-w-[200px]">
                                                    <div className="text-[11px] text-gray-500 font-medium mb-1">Average Rating</div>
                                                    <div className="text-[32px] font-semibold text-gray-900 leading-tight mb-2">{formData.average_rating}</div>
                                                    {renderStars(formData.average_rating, 'text-[#f1f5f9]')}
                                                    <div className="text-[11px] text-gray-400 mt-2">based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</div>
                                                </div>

                                                {/* Right Block (Progress Bars) */}
                                                <div className="pl-12 flex-1 flex flex-col justify-center space-y-2">
                                                    {[5, 4, 3, 2, 1].map(star => {
                                                        const count = ratingCounts[star];
                                                        const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                                        return (
                                                            <div key={star} className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1 w-[24px] justify-end">
                                                                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 16 16"><path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" /></svg>
                                                                    <span className="text-[12px] text-gray-600 w-[10px] text-right font-medium">{star}</span>
                                                                </div>
                                                                <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                                </div>
                                                                <div className="w-[30px] text-right text-[11px] text-gray-500 font-medium">{pct}%</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-gray-100" />

                                        {/* Feedback Summary (Skill Circles) */}
                                        {skillAverages.length > 0 && (
                                            <div>
                                                <h3 className="text-[15px] font-medium text-gray-900 mb-1">Feedback Summary</h3>
                                                <p className="text-[12px] text-gray-500 mb-8">Average rating of demonstrated skills</p>

                                                <div className="flex flex-wrap gap-12 px-8">
                                                    {skillAverages.map((skill, idx) => (
                                                        <CircularProgress key={idx} value={skill.average} label={skill.name} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <hr className="border-gray-100" />

                                        {/* Individual Reviews */}
                                        <div className="space-y-4">
                                            {feedbacks.map((fb, idx) => {
                                                const initials = fb.interviewer ? fb.interviewer.charAt(0).toUpperCase() : 'A';

                                                // Quick relative time calculation purely for aesthetic matches
                                                const diffTime = Math.abs(new Date() - new Date(fb.creation || Date.now()));
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                const timeAgo = diffDays < 2 ? 'today' : diffDays < 7 ? `${diffDays} days ago` : `${Math.floor(diffDays / 7)} week(s) ago`;

                                                return (
                                                    <div key={idx} className="bg-white border border-gray-100 rounded-lg p-5">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center gap-3 w-[220px]">
                                                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[12px] font-medium shrink-0">
                                                                        {initials}
                                                                    </div>
                                                                    <span className="text-[13px] font-semibold text-gray-800 truncate">{fb.interviewer}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {renderStars(fb.average_rating)}
                                                                    <span className="text-[12px] text-gray-400 font-medium">({parseFloat(fb.average_rating || 0).toFixed(1)})</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <span className="text-[11px]">{timeAgo}</span>
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                            </div>
                                                        </div>

                                                        <div className="pl-[270px] text-[13px] text-gray-600">
                                                            {fb.feedback || fb.interviewer_feedback || <span className="text-gray-400 italic">No textual feedback provided.</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
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
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Interview</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-black shadow-sm transition-colors" onClick={handleNew}>
                        + Add Interview
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 bg-[#f4f5f6] rounded px-3 py-1.5 text-[13px] w-64 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-shadow"
                    placeholder="ID"
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <button className="text-gray-500 hover:text-gray-700 text-[13px] border border-gray-300 px-3 py-1.5 rounded bg-white flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filter
                    <span className="ml-1 text-gray-400">×</span>
                </button>

                {hasActiveFilters && (<button className="text-gray-500 hover:text-gray-700 text-[13px] bg-gray-100 px-3 py-1.5 rounded transition-colors" onClick={clearFilters}>Clear filters to see all Interview.</button>)}
                <div className="ml-auto flex items-center gap-2">
                    <button className="text-gray-500 text-[13px] border border-gray-300 px-3 py-1.5 rounded bg-white flex items-center gap-1 hover:bg-gray-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        Last Updated On
                    </button>
                </div>
            </div>

            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Interviews...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                        <div className="text-gray-300 mb-4 opacity-70">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="text-[13px] text-gray-500 mb-4">No Interview found with matching filters. Clear filters to see all Interview.</p>
                        <button className="px-4 py-1.5 bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 text-[13px] font-medium rounded transition-colors" onClick={handleNew}>
                            Create a new Interview
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="text-left px-4 py-2 font-medium">Name</th>
                                    <th className="text-left px-4 py-2 font-medium">Interview Round</th>
                                    <th className="text-left px-4 py-2 font-medium">Job Applicant</th>
                                    <th className="text-left px-4 py-2 font-medium">Status</th>
                                    <th className="text-left px-4 py-2 font-medium">Scheduled On</th>
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
                                        <td className="px-4 py-2 text-gray-600">{row.interview_round || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{row.job_applicant || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${row.status === 'Pending' ? 'bg-orange-100 text-orange-700' : row.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.status || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{row.scheduled_on || '-'}</td>
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

            <div className="flex items-center gap-1 mt-3">
                <button className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50">20</button>
                <button className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50">100</button>
                <button className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50">500</button>
                <button className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded hover:bg-gray-50">2500</button>
            </div>
        </div>
    );
}
