import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    assessment_criteria: '',
    assessment_criteria_group: '',
});

const AssessmentCriteria = () => {
    const [view, setView] = useState('list');
    const [editingRecord, setEditingRecord] = useState(null);
    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchList();
        } else {
            if (editingRecord) {
                fetchRecord(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchList = async () => {
        try {
            setLoadingList(true);
            const res = await API.get('/api/resource/Assessment Criteria?fields=["name","assessment_criteria","assessment_criteria_group"]&limit_page_length=None');
            setList(res.data.data || []);
        } catch (err) {
            console.error('Fetch list error:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchRecord = async (id) => {
        try {
            const res = await API.get(`/api/resource/Assessment Criteria/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to load assessment criteria.' });
        }
    };

    const handleSave = async () => {
        if (!form.assessment_criteria) {
            notification.warning({ message: 'Missing Fields', description: 'Assessment Criteria is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: form.assessment_criteria,
                ...form
            };
            if (editingRecord) {
                await API.put(`/api/resource/Assessment Criteria/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Criteria updated.' });
            } else {
                await API.post('/api/resource/Assessment Criteria', payload);
                notification.success({ message: 'Criteria created.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error details:', err.response?.data);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => {
                        try { return JSON.parse(m).message; } catch { return m; }
                    }).join('\n');
                } catch { /* stay as is */ }
            }
            notification.error({ 
                message: 'Save Failed', 
                description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
                duration: 6 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this criteria?')) return;
        try {
            await API.delete(`/api/resource/Assessment Criteria/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white hover:border-gray-400";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";

    if (view === 'list') {
        const filtered = list.filter(item => 
            item.assessment_criteria.toLowerCase().includes(search.toLowerCase()) ||
            (item.assessment_criteria_group || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessment Criteria</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-bold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Criteria
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Criteria Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">Criteria Name</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Criteria Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic">Syncing criteria...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic">No criteria found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.assessment_criteria}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{row.assessment_criteria_group || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `EDIT ${editingRecord}` : 'NEW ASSESSMENT CRITERIA'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-widest leading-none">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 bg-white transition-all shadow-sm" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all shadow-sm" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className={labelStyle}>Assessment Criteria *</label>
                        <input type="text" className={inputStyle} value={form.assessment_criteria} onChange={e => setForm({ ...form, assessment_criteria: e.target.value })} placeholder="e.g. Oral Expression" />
                    </div>

                    <div>
                        <label className={labelStyle}>Assessment Criteria Group</label>
                        <input type="text" className={inputStyle} value={form.assessment_criteria_group} onChange={e => setForm({ ...form, assessment_criteria_group: e.target.value })} placeholder="e.g. Language Proficiency" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentCriteria;
