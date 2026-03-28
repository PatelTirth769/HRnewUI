import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    assessment_group_name: '',
    parent_assessment_group: '',
    is_group: 0,
});

const AssessmentGroup = () => {
    const [view, setView] = useState('list');
    const [editingRecord, setEditingRecord] = useState(null);
    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [parentGroups, setParentGroups] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchList();
        } else {
            fetchParentGroups();
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
            const res = await API.get('/api/resource/Assessment Group?fields=["name","parent_assessment_group","is_group"]&limit_page_length=None');
            setList(res.data.data || []);
        } catch (err) {
            console.error('Error fetching list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchParentGroups = async () => {
        try {
            const res = await API.get('/api/resource/Assessment Group?filters=[["is_group","=",1]]&limit_page_length=None');
            setParentGroups(res.data.data?.map(d => d.name) || []);
        } catch (err) {
            console.error('Error fetching parent groups:', err);
        }
    };

    const fetchRecord = async (id) => {
        try {
            const res = await API.get(`/api/resource/Assessment Group/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to load assessment group.' });
        }
    };

    const handleSave = async () => {
        if (!form.assessment_group_name || !form.parent_assessment_group) {
            notification.warning({ message: 'Missing Fields', description: 'Please fill all required (*) fields.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Assessment Group/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Assessment Group updated.' });
            } else {
                await API.post('/api/resource/Assessment Group', form);
                notification.success({ message: 'Assessment Group created.' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this assessment group?')) return;
        try {
            await API.delete(`/api/resource/Assessment Group/${encodeURIComponent(editingRecord)}`);
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
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.parent_assessment_group || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessment Group</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 font-medium" onClick={fetchList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-bold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Assessment Group
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Search Group Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Parent Group</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Is Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">Syncing groups...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">No assessment groups found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">{row.parent_assessment_group || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.is_group ? <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-tighter border border-green-100">Yes</span> : <span className="text-gray-300">No</span>}
                                        </td>
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
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `EDIT ${editingRecord}` : 'NEW ASSESSMENT GROUP'}</h2>
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
                        <label className={labelStyle}>Assessment Group Name *</label>
                        <input type="text" className={inputStyle} value={form.assessment_group_name} onChange={e => setForm({ ...form, assessment_group_name: e.target.value })} placeholder="e.g. End Semester Exams" />
                    </div>

                    <div>
                        <label className={labelStyle}>Parent Assessment Group *</label>
                        <select className={inputStyle} value={form.parent_assessment_group} onChange={e => setForm({ ...form, parent_assessment_group: e.target.value })}>
                            <option value="">Select Parent</option>
                            {parentGroups.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <p className="mt-1.5 text-[11px] text-gray-400 font-medium">Select a group that has 'Is Group' enabled.</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="is_group" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={form.is_group} onChange={e => setForm({ ...form, is_group: e.target.checked ? 1 : 0 })} />
                        <label htmlFor="is_group" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Is Group</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentGroup;
