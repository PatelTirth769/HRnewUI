import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function AppointmentLetterTemplate() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const defaultForm = {
        template_name: '',
        introduction: '',
        closing_notes: '',
        terms: [] // Child table [title, description]
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Appointment Letter Template?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Appointment Letter Templates' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        }
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Appointment Letter Template/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                template_name: d.template_name || name || '',
                introduction: d.introduction || '',
                closing_notes: d.closing_notes || '',
                terms: Array.isArray(d.terms)
                    ? d.terms.map(row => ({ title: row.title || '', description: row.description || '' }))
                    : []
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Template details' });
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
        if (!formData.template_name || !formData.introduction) {
            notification.warning({ message: 'Please provide a Template Name and Introduction' });
            return;
        }

        const hasEmptyTerm = formData.terms.some(row => !row.title || row.title.trim() === '');
        if (hasEmptyTerm) {
            notification.warning({ message: 'Please complete all Titles in the terms table' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                template_name: formData.template_name,
                introduction: formData.introduction,
                closing_notes: formData.closing_notes,
                terms: formData.terms.map(row => ({ title: row.title, description: row.description }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Appointment Letter Template/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Template updated successfully' });
            } else {
                const res = await API.post('/api/resource/Appointment Letter Template', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Template ${newName || ''} created successfully` });
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
            await API.delete(`/api/resource/Appointment Letter Template/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleAddTerm = () => {
        setFormData(prev => ({
            ...prev,
            terms: [...prev.terms, { title: '', description: '' }]
        }));
    };

    const updateTermRow = (index, key, value) => {
        const newTable = [...formData.terms];
        newTable[index][key] = value;
        updateForm('terms', newTable);
    };

    const removeTermRow = (index) => {
        const newTable = formData.terms.filter((_, i) => i !== index);
        updateForm('terms', newTable);
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.template_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.introduction || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasActiveFilters = searchQuery !== '';
    const clearFilters = () => { setSearchQuery(''); };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1200px] mx-auto font-sans">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 focus:outline-none" onClick={() => setView('list')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Appointment Letter Template'}
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
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Template Name <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className="w-full bg-gray-50 border-transparent rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700"
                                    value={formData.template_name}
                                    placeholder="Enter template name..."
                                    onChange={e => updateForm('template_name', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 my-6" />

                    <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Introduction <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full bg-gray-50 border-transparent rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700 min-h-[160px] resize-y"
                            value={formData.introduction}
                            onChange={e => updateForm('introduction', e.target.value)}
                        ></textarea>
                    </div>

                    {/* TERMS */}
                    <div>
                        <h3 className="text-[14px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Terms</h3>
                        <div className="border border-gray-100 rounded-md overflow-hidden bg-white mb-3">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100 text-[11px] text-gray-500 font-medium tracking-wide">
                                    <tr>
                                        <th className="px-3 py-2 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 shadow-sm" disabled /></th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100">No.</th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100 w-1/3">Title <span className="text-red-400 font-normal">*</span></th>
                                        <th className="px-3 py-2 text-left border-l border-gray-100">Description <span className="text-red-400 font-normal">*</span></th>
                                        <th className="px-3 py-2 w-12 text-center border-l border-gray-100 font-normal">⚙</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.terms.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-8 text-center text-gray-400 text-xs">No Data</td>
                                        </tr>
                                    ) : (
                                        formData.terms.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                                <td className="px-3 py-2 text-center align-top pt-3">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-500 text-xs border-l border-gray-100 align-top pt-3.5">{i + 1}</td>
                                                <td className="px-0 py-0 border-l border-gray-100 align-top">
                                                    <textarea
                                                        className="w-full h-full bg-transparent border-none px-3 py-3 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none resize-y min-h-[44px]"
                                                        value={row.title}
                                                        onChange={(e) => updateTermRow(i, 'title', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-0 py-0 border-l border-gray-100 align-top">
                                                    <textarea
                                                        className="w-full h-full bg-transparent border-none px-3 py-3 text-sm focus:ring-1 focus:ring-inset focus:ring-blue-200 outline-none resize-y min-h-[44px]"
                                                        value={row.description}
                                                        onChange={(e) => updateTermRow(i, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center border-l border-gray-100 align-top pt-3.5">
                                                    <button
                                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                                        onClick={() => removeTermRow(i)}
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
                        <button
                            className="text-[11px] bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 font-semibold py-1.5 px-3 rounded inline-flex items-center transition-colors"
                            onClick={handleAddTerm}
                        >
                            Add Row
                        </button>
                    </div>

                    <hr className="border-gray-100 my-6" />

                    <div>
                        <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Closing Notes</label>
                        <textarea
                            className="w-full bg-gray-50 border-transparent rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 focus:bg-white transition-colors text-gray-700 min-h-[160px] resize-y"
                            value={formData.closing_notes}
                            onChange={e => updateForm('closing_notes', e.target.value)}
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
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Appointment Letter Template</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-black shadow-sm transition-colors" onClick={handleNew}>
                        + Add Appointment Letter Template
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 bg-[#f4f5f6] rounded px-3 py-1.5 text-[13px] w-64 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-shadow"
                    placeholder="Search by ID, Template Name..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button className="text-gray-500 hover:text-gray-700 text-[13px] border border-gray-300 px-3 py-1.5 rounded bg-white flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filter
                    <span className="ml-1 text-gray-400">×</span>
                </button>

                {hasActiveFilters && (<button className="text-gray-500 hover:text-gray-700 text-[13px] bg-gray-100 px-3 py-1.5 rounded transition-colors" onClick={clearFilters}>Clear filters</button>)}
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
                        <p className="text-[13px] text-gray-500 mb-4">No Templates found. Clear filters or create a new one.</p>
                        <button className="px-4 py-1.5 bg-[#f4f5f6] hover:bg-[#e2e6ea] text-gray-700 text-[13px] font-medium rounded transition-colors" onClick={handleNew}>
                            Create a new Appointment Letter Template
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="text-left px-4 py-2 font-medium">Template Name</th>
                                    <th className="text-left px-4 py-2 font-medium">Introduction</th>
                                    <th className="text-left px-4 py-2 font-medium">ID</th>
                                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                        <td className="px-4 py-2 font-medium text-gray-900">
                                            <button className="hover:text-blue-600 text-left" onClick={() => handleEdit(row)}>
                                                {row.template_name || row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 max-w-[300px] truncate">{row.introduction || '-'}</td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">{row.name}</td>
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
