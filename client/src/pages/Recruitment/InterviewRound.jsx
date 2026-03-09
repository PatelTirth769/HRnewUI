import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function InterviewRound() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    const [interviewTypes, setInterviewTypes] = useState([]);
    const [designations, setDesignations] = useState([]);

    const defaultForm = {
        round_name: '',
        expected_average_rating: '',
        interview_type: '',
        interviewers: '',
        designation: '',
        expected_skillset: []
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Interview Round?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Interview Rounds' });
        } finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [typesRes, desigRes] = await Promise.all([
                API.get('/api/resource/Interview Type?limit_page_length=None'),
                API.get('/api/resource/Designation?limit_page_length=None')
            ]);
            setInterviewTypes(typesRes.data?.data || []);
            setDesignations(desigRes.data?.data || []);
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

    // ─── TAG/PILL HELPERS FOR INTERVIEWERS ───────────────────────
    const getInterviewersList = () => {
        if (!formData.interviewers) return [];
        if (typeof formData.interviewers === 'string') {
            return formData.interviewers.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(formData.interviewers)) {
            return formData.interviewers.map(i => typeof i === 'string' ? i : (i.interviewer || i.user || '')).filter(Boolean);
        }
        return [];
    };

    const handleAddInterviewer = (email) => {
        if (!email.trim()) return;
        const current = getInterviewersList();
        if (!current.includes(email.trim())) {
            updateForm('interviewers', [...current, email.trim()].join(', '));
        }
    };

    const handleRemoveInterviewer = (emailToRemove) => {
        const current = getInterviewersList();
        updateForm('interviewers', current.filter(email => email !== emailToRemove).join(', '));
    };

    const handleInterviewerKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddInterviewer(e.target.value);
            e.target.value = '';
        }
    };

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Interview Round/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                round_name: d.round_name || d.name || '',
                expected_average_rating: d.expected_average_rating || '',
                interview_type: d.interview_type || '',
                interviewers: d.interviewers || '',
                designation: d.designation || '',
                expected_skillset: Array.isArray(d.expected_skill_set)
                    ? d.expected_skill_set.map(row => ({
                        skill: row.skill || '',
                        description: row.description || ''
                    }))
                    : []
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
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
        if (!formData.round_name) {
            notification.warning({ message: 'Please fill the required field (Round Name)' });
            return;
        }

        const hasEmptySkills = formData.expected_skillset.some(row => !row.skill || row.skill.trim() === '');
        if (hasEmptySkills) {
            notification.warning({ message: 'Please complete all required fields (Skill) in the Expected Skillset table.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                expected_average_rating: parseFloat(formData.expected_average_rating) || 0,
                interview_type: formData.interview_type || null,
                interviewers: formData.interviewers || null,
                designation: formData.designation || null,
                expected_skill_set: formData.expected_skillset.map(row => ({
                    skill: row.skill,
                    description: row.description
                }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Interview Round/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Interview Round updated successfully' });
            } else {
                payload.round_name = formData.round_name;
                const res = await API.post('/api/resource/Interview Round', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Interview Round ${newName || ''} created successfully` });
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
            await API.delete(`/api/resource/Interview Round/${encodeURIComponent(record.name)}`);
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
            expected_skillset: [...prev.expected_skillset, { skill: '', description: '' }]
        }));
    };

    const updateSkillRow = (index, field, value) => {
        const newTable = [...formData.expected_skillset];
        newTable[index][field] = value;
        updateForm('expected_skillset', newTable);
    };

    const removeSkillRow = (index) => {
        const newTable = formData.expected_skillset.filter((_, i) => i !== index);
        updateForm('expected_skillset', newTable);
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.round_name || d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.interview_type || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.designation || '').toLowerCase().includes(searchId.toLowerCase())
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
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Interview Round'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 ml-1">Not Saved</span>
                        )}
                    </div>
                    <div>
                        <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black shadow-sm disabled:opacity-50 transition-colors" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Main Form Fields */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    {/* Section 1 */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Round Name <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className={`w-full bg-gray-100 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-300 transition-colors ${editingRecord ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={formData.round_name}
                                    onChange={e => updateForm('round_name', e.target.value)}
                                    disabled={!!editingRecord}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Interview Type</label>
                                <select
                                    className="w-full bg-gray-100 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-300 transition-colors text-gray-700"
                                    value={formData.interview_type}
                                    onChange={e => updateForm('interview_type', e.target.value)}
                                >
                                    <option value=""></option>
                                    {interviewTypes.map(it => <option key={it.name} value={it.name}>{it.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Interviewers</label>
                                <div className="w-full bg-gray-100 border-transparent rounded-md px-2 py-1.5 min-h-[36px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white focus-within:border-blue-300 transition-colors">
                                    {getInterviewersList().map(email => (
                                        <span key={email} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200 text-xs text-gray-700 shadow-sm">
                                            {email}
                                            <button type="button" onClick={() => handleRemoveInterviewer(email)} className="text-gray-400 hover:text-gray-700 focus:outline-none">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        className="flex-1 min-w-[120px] bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400 p-0"
                                        placeholder={(getInterviewersList().length === 0) ? "Type email and press Enter" : ""}
                                        onKeyDown={handleInterviewerKeyDown}
                                        onBlur={(e) => {
                                            handleAddInterviewer(e.target.value);
                                            e.target.value = '';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Expected Average Rating</label>
                                <div className="flex gap-1 items-center pt-1">
                                    {[1, 2, 3, 4, 5].map(star => {
                                        const rating = parseFloat(formData.expected_average_rating) || 0;
                                        const isFull = rating >= star;
                                        const isHalf = !isFull && rating >= (star - 0.5);

                                        return (
                                            <button
                                                key={star}
                                                onClick={() => updateForm('expected_average_rating', star)}
                                                className="focus:outline-none transition-transform hover:scale-110 relative w-[18px] h-[18px]"
                                                type="button"
                                                title={`Rate ${star} stars`}
                                            >
                                                {/* Background empty star */}
                                                <svg className={`w-[18px] h-[18px] absolute top-0 left-0 ${isFull ? 'text-[#ffb100]' : 'text-[#e2e8f0]'}`} fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                </svg>

                                                {/* Foreground half star clip */}
                                                {isHalf && (
                                                    <div className="absolute top-0 left-0 h-full w-[50%] overflow-hidden">
                                                        <svg className="w-[18px] h-[18px] text-[#ffb100]" fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 my-8" />

                    {/* Section 2 */}
                    <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Designation</label>
                            <select
                                className="w-full bg-gray-100 border-transparent rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-300 transition-colors text-gray-700"
                                value={formData.designation}
                                onChange={e => updateForm('designation', e.target.value)}
                            >
                                <option value=""></option>
                                {designations.map(des => <option key={des.name} value={des.name}>{des.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 mb-4">
                        <label className="block text-[11px] font-medium text-gray-500 mb-2">Expected Skillset</label>
                        <div className="border border-gray-100 rounded-md overflow-hidden bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] text-gray-500 font-medium tracking-wide">
                                    <tr>
                                        <th className="px-3 py-2 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 shadow-sm" disabled /></th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100">No.</th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100">Skill <span className="text-red-500">*</span></th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100">Description</th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100 font-normal">⚙</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.expected_skillset.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-6 text-center text-gray-400 text-xs">No skills added</td>
                                        </tr>
                                    ) : (
                                        formData.expected_skillset.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-center">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-500 text-xs border-l border-gray-100">{i + 1}</td>
                                                <td className="px-0 py-0 border-l border-gray-100">
                                                    <input type="text"
                                                        className="w-full h-full bg-transparent border-none px-3 py-2 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none"
                                                        value={row.skill}
                                                        onChange={(e) => updateSkillRow(i, 'skill', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-0 py-0 border-l border-gray-100">
                                                    <input type="text"
                                                        className="w-full h-full bg-transparent border-none px-3 py-2 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none text-gray-600"
                                                        value={row.description}
                                                        onChange={(e) => updateSkillRow(i, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center border-l border-gray-100">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        <button
                                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                                            onClick={() => removeSkillRow(i)}
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
                            className="mt-3 text-xs bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 font-medium py-1.5 px-3 rounded-md transition-colors"
                            onClick={handleAddSkill}
                        >
                            Add Row
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    const tableHeaders = ['Name', 'Interview Type', 'Designation', 'Expected Rating'];

    return (
        <div className="p-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Interview Round</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded border border-transparent hover:bg-blue-700 shadow-sm transition-colors" onClick={handleNew}>
                        + Add Interview Round
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-shadow"
                    placeholder="Search Round, Type, or Designation..."
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {hasActiveFilters && (<button className="text-gray-500 hover:text-gray-700 text-sm bg-gray-100 px-3 py-1.5 rounded transition-colors" onClick={clearFilters}>Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-500 font-medium">{filtered.length} of {data.length} records</div>
            </div>

            {/* ── Data Table ── */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Interview Rounds...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-2">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="text-lg text-gray-600 font-medium mb-1">No reports found</p>
                        <p className="text-sm text-gray-400">Click the button above to create a new one.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium w-12">#</th>
                                    {tableHeaders.map((h, i) => (
                                        <th key={i} className="text-left px-4 py-3 font-medium">{h}</th>
                                    ))}
                                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            <button className="hover:underline hover:text-blue-600 text-left" onClick={() => handleEdit(row)}>
                                                {row.round_name || row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 flex flex-col gap-0.5">
                                            <span className="text-gray-700">{row.interview_type || '-'}</span>
                                            {(() => {
                                                let interviewersText = '';
                                                if (typeof row.interviewers === 'string') interviewersText = row.interviewers;
                                                else if (Array.isArray(row.interviewers)) interviewersText = row.interviewers.map(i => typeof i === 'string' ? i : i.interviewer || '').join(', ');
                                                return interviewersText ? <span className="text-xs text-gray-400">By: {interviewersText.substring(0, 30)}{interviewersText.length > 30 ? '...' : ''}</span> : null;
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.designation || '-'}</td>
                                        <td className="px-4 py-3">
                                            {row.expected_average_rating > 0 ? (
                                                <div className="flex items-center text-amber-500">
                                                    <span className="font-semibold mr-1">{row.expected_average_rating}</span>
                                                    <span className="text-xs text-gray-400">/ 5</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
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
            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Showing {filtered.length} generated items</span>
                    <span>ERPNext Sync Active</span>
                </div>
            )}
        </div>
    );
}
