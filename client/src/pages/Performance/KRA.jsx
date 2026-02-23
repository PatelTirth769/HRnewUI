import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function KRA() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    const defaultForm = {
        title: '',
        description: '',
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/KRA?fields=["name","modified"]&limit_page_length=None&order_by=modified desc');
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load KRAs' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/KRA/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                title: d.title || d.name || '',
                description: d.description || '',
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load KRA details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setView('form'); await fetchSingle(record.name); };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.title?.trim()) {
            notification.warning({ message: 'KRA Title is required' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/KRA/${encodeURIComponent(editingRecord.name)}`, {
                    description: formData.description,
                });
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post('/api/resource/KRA', {
                    title: formData.title,
                    description: formData.description,
                });
                notification.success({ message: `"${formData.title}" created successfully!` });
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
            await API.delete(`/api/resource/KRA/${encodeURIComponent(editingRecord.name)}`);
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
                                {editingRecord ? editingRecord.name : 'New KRA'}
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
                    <div className="p-6 space-y-6 max-w-3xl">
                        {/* Title */}
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Title <span className="text-red-400">*</span></label>
                            {editingRecord ? (
                                <div className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-600 shadow-sm">
                                    {formData.title}
                                </div>
                            ) : (
                                <input type="text"
                                    className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                                    value={formData.title}
                                    onChange={(e) => updateForm('title', e.target.value)}
                                    placeholder="e.g. Sales Performance"
                                />
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[120px] bg-white shadow-sm"
                                value={formData.description}
                                onChange={(e) => updateForm('description', e.target.value)}
                                placeholder="Enter a description for this KRA..."
                            />
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
                <h1 className="text-2xl font-semibold text-gray-800">KRA</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add KRA
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search by ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
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
                        <p className="text-lg mb-2">No KRAs found</p>
                        <p className="text-sm">Click "+ Add KRA" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
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
                                    <td className="px-4 py-3">{row.name}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)} ago</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                        <button className="text-red-600 hover:underline text-xs" onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
                                                API.delete(`/api/resource/KRA/${encodeURIComponent(row.name)}`)
                                                    .then(() => {
                                                        notification.success({ message: `"${row.name}" deleted successfully!` });
                                                        fetchData();
                                                    })
                                                    .catch(err => {
                                                        let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
                                                        if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                                                            try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
                                                        }
                                                        notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
                                                    });
                                            }
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
                    <span>Total: {data.length} KRAs (Showing {filtered.length})</span>
                    <span>Source: ERPNext → /api/resource/KRA</span>
                </div>
            )}
        </div>
    );
}
