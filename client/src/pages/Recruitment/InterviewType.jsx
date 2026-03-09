import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function InterviewType() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    // Form data
    const defaultForm = {
        name: '',
        description: '',
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Interview Type?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Interview Types' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Interview Type/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                name: d.name || '',
                description: d.description || '',
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
        if (!formData.name) {
            notification.warning({ message: 'Please fill the required field (Name)' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                description: formData.description || null,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Interview Type/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Interview Type updated successfully' });
            } else {
                payload.name = formData.name;
                const res = await API.post('/api/resource/Interview Type', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Interview Type ${newName || ''} created successfully` });
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
            await API.delete(`/api/resource/Interview Type/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.description || '').toLowerCase().includes(searchId.toLowerCase())
    );

    const hasActiveFilters = searchId !== '';
    const clearFilters = () => { setSearchId(''); };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {editingRecord ? editingRecord.name : 'New Interview Type'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Interview Type</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                {/* ── Card ── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 gap-y-5 max-w-lg">
                        {/* Name */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                            <input type="text"
                                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${editingRecord ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-orange-300 bg-orange-50'}`}
                                value={formData.name}
                                onChange={e => updateForm('name', e.target.value)}
                                disabled={!!editingRecord}
                                placeholder="" />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[180px]"
                                rows={8}
                                value={formData.description}
                                onChange={e => updateForm('description', e.target.value)}
                                placeholder=""
                            />
                        </div>
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
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Interview Type</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Interview Type
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
                    placeholder="Search by name..."
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* ── Data Table ── */}
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
                        <p className="text-lg mb-2">No Interview Types found</p>
                        <p className="text-sm">Click "+ Add Interview Type" to create one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.description ? (row.description.length > 80 ? row.description.substring(0, 80) + '...' : row.description) : '-'}</td>
                                        <td className="px-4 py-3 flex text-center">
                                            <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row)}>Delete</button>
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
                    <span>Total: {data.length} records</span>
                    <span>Source: ERPNext → /api/resource/Interview Type</span>
                </div>
            )}
        </div>
    );
}
