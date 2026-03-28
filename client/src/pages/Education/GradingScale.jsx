import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function GradingScale() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');

    const defaultForm = {
        grading_scale_name: '',
        description: '',
        intervals: [{ grade_code: '', threshold: 0, grade_description: '' }]
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Grading Scale?fields=["name","description"]&limit_page_length=None&order_by=name asc');
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Grading Scales' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Grading Scale/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                grading_scale_name: d.name || '',
                description: d.description || '',
                intervals: d.intervals || []
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load grading scale details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase()) && !(d.description || '').toLowerCase().includes(searchId.toLowerCase())) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm, intervals: [{ grade_code: '', threshold: 0, grade_description: '' }] }); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setView('form'); await fetchSingle(record.name); };

    // ─── CHILD TABLE HELPERS ─────────────────────────────────────
    const addRow = () => setFormData(prev => ({ ...prev, intervals: [...prev.intervals, { grade_code: '', threshold: 0, grade_description: '' }] }));
    const updateRow = (idx, key, val) => setFormData(prev => {
        const newIntervals = [...prev.intervals];
        newIntervals[idx] = { ...newIntervals[idx], [key]: val };
        return { ...prev, intervals: newIntervals };
    });
    const removeRow = (idx) => setFormData(prev => ({ ...prev, intervals: prev.intervals.filter((_, i) => i !== idx) }));

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.grading_scale_name?.trim()) {
            notification.warning({ message: 'Grading Scale Name is required' });
            return;
        }
        if (formData.intervals.length === 0) {
            notification.warning({ message: 'At least one grading interval is required.' });
            return;
        }
        for (let row of formData.intervals) {
            if (!row.grade_code) {
                notification.warning({ message: 'Grade Code is required in all rows.' });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                grading_scale_name: formData.grading_scale_name,
                description: formData.description,
                intervals: formData.intervals
            };
            if (editingRecord) {
                await API.put(`/api/resource/Grading Scale/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post('/api/resource/Grading Scale', payload);
                notification.success({ message: `"${formData.grading_scale_name}" created successfully!` });
            }
            setView('list');
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
            await API.delete(`/api/resource/Grading Scale/${encodeURIComponent(editingRecord.name)}`);
            notification.success({ message: `"${editingRecord.name}" deleted successfully!` });
            setView('list');
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                {editingRecord ? editingRecord.name : 'New Grading Scale'}
                            </span>
                            {!editingRecord ? (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#EBF5FF] text-[#2B6CB0] font-medium">Saved</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors" onClick={() => setView('list')} title="Go Back">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        {editingRecord && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors shadow-sm" onClick={handleDelete}>Delete</button>
                        )}
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* Top Fields */}
                        <div className="max-w-3xl">
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Grading Scale Name <span className="text-red-400">*</span></label>
                                <input type="text"
                                    className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm"
                                    value={formData.grading_scale_name}
                                    onChange={(e) => updateForm('grading_scale_name', e.target.value)}
                                    placeholder="e.g. Standard Letter Grades"
                                />
                            </div>
                        </div>

                        {/* Intervals Child Table */}
                        <hr className="border-gray-100" />
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Grading Scale Intervals</h3>
                            <div className="border border-gray-100 rounded-lg overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                        <tr>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-12">No.</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600">Grade Code <span className="text-red-400">*</span></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600">Threshold</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-600">Description</th>
                                            <th className="w-12 px-3 py-2.5 text-center">⚙</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.intervals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-400">
                                                    <span className="text-sm">No intervals. Click "Add Row" below.</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.intervals.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" className="w-full bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-2 py-1 outline-none text-gray-800 transition-colors"
                                                            value={row.grade_code} onChange={(e) => updateRow(idx, 'grade_code', e.target.value)} placeholder="A+" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" className="w-full bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-2 py-1 outline-none text-gray-800 transition-colors"
                                                            value={row.threshold} onChange={(e) => updateRow(idx, 'threshold', parseFloat(e.target.value) || 0)} placeholder="90" min="0" max="100" step="0.01" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" className="w-full bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded px-2 py-1 outline-none text-gray-800 transition-colors"
                                                            value={row.grade_description} onChange={(e) => updateRow(idx, 'grade_description', e.target.value)} placeholder="Excellent" />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => removeRow(idx)}>
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
                                onClick={addRow}>
                                Add Row
                            </button>
                        </div>

                        {/* Description */}
                        <hr className="border-gray-100" />
                        <div className="max-w-3xl">
                            <label className="block text-[13px] text-gray-500 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[100px] bg-white shadow-sm"
                                value={formData.description}
                                onChange={(e) => updateForm('description', e.target.value)}
                                placeholder="Describe this grading scale..."
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
                <h1 className="text-2xl font-semibold text-gray-800">Grading Scale</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Grading Scale
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search by name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {searchId && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={() => setSearchId('')}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

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
                        <p className="text-lg mb-2">No Grading Scales found</p>
                        <p className="text-sm">Click "+ Add Grading Scale" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Scale Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                            {row.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{row.description || '-'}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
