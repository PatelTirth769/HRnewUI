import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { Link } from 'react-router-dom';
import API from '../../services/api';

export default function AppraisalTemplate() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    const [kras, setKras] = useState([]);
    const [appraisalCriteria, setAppraisalCriteria] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // ─── FETCH MASTERS ────────────────────────────────────────────
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [kraRes, criteriaRes] = await Promise.all([
                API.get('/api/resource/KRA?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Employee Feedback Criteria?fields=["name"]&limit_page_length=None')
            ]);
            setKras((kraRes.data?.data || []).map(k => k.name));
            setAppraisalCriteria((criteriaRes.data?.data || []).map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const defaultForm = {
        template_title: '',
        description: '',
        goals: [],
        rating_criteria: [],
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Appraisal Template?fields=["name","template_title","modified"]&limit_page_length=None&order_by=modified desc');
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Appraisal Templates' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
        }
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Appraisal Template/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                template_title: d.template_title || '',
                description: d.description || '',
                goals: d.goals || [],
                rating_criteria: d.rating_criteria || [],
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase()) && !(d.template_title || '').toLowerCase().includes(searchId.toLowerCase())) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setView('form'); await fetchSingle(record.name); };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.template_title?.trim()) { notification.warning({ message: 'Appraisal Template Title is required' }); return; }

        // Validate weightages
        const kraTotal = formData.goals.reduce((acc, curr) => acc + (parseFloat(curr.per_weightage) || 0), 0);
        if (formData.goals.length > 0 && kraTotal !== 100) {
            notification.warning({ message: `Total KRA Weightage must be 100%. Current is ${kraTotal}%` });
            return;
        }

        const ratingTotal = formData.rating_criteria.reduce((acc, curr) => acc + (parseFloat(curr.per_weightage) || 0), 0);
        if (formData.rating_criteria.length > 0 && ratingTotal !== 100) {
            notification.warning({ message: `Total Rating Criteria Weightage must be 100%. Current is ${ratingTotal}%` });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                template_title: formData.template_title,
                description: formData.description,
                goals: formData.goals.map(k => ({ key_result_area: k.key_result_area, per_weightage: k.per_weightage })),
                rating_criteria: formData.rating_criteria.map(r => ({ criteria: r.criteria, per_weightage: r.per_weightage }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Appraisal Template/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post('/api/resource/Appraisal Template', payload);
                notification.success({ message: `"${formData.template_title}" created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: editingRecord ? 'Update Failed' : 'Create Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ───────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!editingRecord) return;
        if (!window.confirm(`Are you sure you want to delete "${editingRecord.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Appraisal Template/${encodeURIComponent(editingRecord.name)}`);
            notification.success({ message: `"${editingRecord.name}" deleted successfully!` });
            setView('list');
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // helpers
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 d';
        return `${diffDays} d`;
    };

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Form Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                {editingRecord ? editingRecord.name : 'New Appraisal Template'}
                            </span>
                            {!editingRecord ? (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">
                                    Not Saved
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#EBF5FF] text-[#2B6CB0] font-medium">
                                    Saved
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                            onClick={() => setView('list')}
                            title="Go Back"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        {editingRecord && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors shadow-sm" onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                        <button
                            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                            onClick={handleSave} disabled={saving}
                        >
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Title & Description Section */}
                        <div className="space-y-6 max-w-3xl">
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Appraisal Template Title <span className="text-red-400">*</span></label>
                                <input type="text"
                                    className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                                    value={formData.template_title}
                                    onChange={(e) => updateForm('template_title', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[100px] bg-white shadow-sm"
                                    value={formData.description}
                                    onChange={(e) => updateForm('description', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* KRAs Section */}
                        <hr className="border-gray-100" />
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4 text-sm">KRAs</h3>
                            <div className="border border-gray-100 rounded-lg overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                        <tr>
                                            <th className="w-10 px-3 py-2.5 text-center"><input type="checkbox" disabled className="rounded border-gray-300" /></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-12">No.</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600">KRA <span className="text-red-400">*</span></th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-32">Weightage (%) <span className="text-red-400">*</span></th>
                                            <th className="w-12 px-3 py-2.5 text-center">⚙</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.goals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-400">
                                                    <div className="text-gray-300 mb-2 flex justify-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                                                    <span className="text-sm">No Data</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.goals.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-3 py-2 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <select className="w-full bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-2 py-1 outline-none text-gray-800 transition-colors appearance-none"
                                                            value={row.key_result_area || ''}
                                                            onChange={(e) => { const u = [...formData.goals]; u[idx].key_result_area = e.target.value; updateForm('goals', u); }}
                                                        >
                                                            <option value="" disabled>Select KRA...</option>
                                                            {kras.map(k => <option key={k} value={k}>{k}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex justify-end pr-2 items-center">
                                                            <input type="number" className="w-16 text-right bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-1 py-1 outline-none transition-colors"
                                                                value={row.per_weightage || ''}
                                                                onChange={(e) => { const u = [...formData.goals]; u[idx].per_weightage = e.target.value; updateForm('goals', u); }}
                                                            />%
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => updateForm('goals', formData.goals.filter((_, i) => i !== idx))}>
                                                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition-colors"
                                onClick={() => updateForm('goals', [...formData.goals, { key_result_area: '', per_weightage: '' }])}>
                                Add Row
                            </button>
                        </div>

                        {/* Rating Criteria Section */}
                        <hr className="border-gray-100" />
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-1 text-sm">Rating Criteria</h3>
                            <p className="text-[13px] text-gray-500 mb-4">Criteria based on which employee should be rated in Performance Feedback and Self Appraisal</p>
                            <div className="border border-gray-100 rounded-lg overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                        <tr>
                                            <th className="w-10 px-3 py-2.5 text-center"><input type="checkbox" disabled className="rounded border-gray-300" /></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-12">No.</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600">Criteria <span className="text-red-400">*</span></th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-600 w-32">Weightage (%) <span className="text-red-400">*</span></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-32 text-gray-400">Rating</th>
                                            <th className="w-12 px-3 py-2.5 text-center">⚙</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.rating_criteria.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-400">
                                                    <div className="text-gray-300 mb-2 flex justify-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                                                    <span className="text-sm">No Data</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.rating_criteria.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-3 py-2 text-center"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <select className="w-full bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-2 py-1 outline-none text-gray-800 transition-colors appearance-none"
                                                            value={row.criteria || ''}
                                                            onChange={(e) => { const u = [...formData.rating_criteria]; u[idx].criteria = e.target.value; updateForm('rating_criteria', u); }}
                                                        >
                                                            <option value="" disabled>Select Criteria...</option>
                                                            {appraisalCriteria.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex justify-end pr-2 items-center">
                                                            <input type="number" className="w-16 text-right bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-1 py-1 outline-none transition-colors"
                                                                value={row.per_weightage || ''}
                                                                onChange={(e) => { const u = [...formData.rating_criteria]; u[idx].per_weightage = e.target.value; updateForm('rating_criteria', u); }}
                                                            />%
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-300 tracking-widest text-lg">
                                                        ★★★★★
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => updateForm('rating_criteria', formData.rating_criteria.filter((_, i) => i !== idx))}>
                                                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition-colors"
                                onClick={() => updateForm('rating_criteria', [...formData.rating_criteria, { criteria: '', per_weightage: '' }])}>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Appraisal Template</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Appraisal Template
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search by ID / Title..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {searchId && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={() => setSearchId('')}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading from ERPNext...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No appraisal templates found</p>
                        <p className="text-sm">Click "+ Add Appraisal Template" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Appraisal Template Title</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Last Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                            {row.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">{row.template_title || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)} ago</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                        <button className="text-red-600 hover:underline text-xs" onClick={() => {
                                            setEditingRecord(row);
                                            setTimeout(() => {
                                                if (window.confirm(`Are you sure you want to delete "${row.template_title || row.name}"?`)) {
                                                    API.delete(`/api/resource/Appraisal Template/${encodeURIComponent(row.name)}`)
                                                        .then(() => {
                                                            notification.success({ message: `"${row.name}" deleted successfully!` });
                                                            fetchData();
                                                        })
                                                        .catch(err => {
                                                            notification.error({ message: 'Delete Failed' });
                                                        });
                                                } else {
                                                    setEditingRecord(null);
                                                }
                                            }, 10);
                                        }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} templates (Showing {filtered.length})</span>
                    <span>Source: ERPNext → /api/resource/Appraisal Template</span>
                </div>
            )}
        </div>
    );
}
