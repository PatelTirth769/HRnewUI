import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const CONTENT_TYPES = ['Video', 'Article', 'Quiz', 'Document', 'Other'];

const emptyForm = () => ({
    topic_name: '',
    topic_content: [], // Child table: Topic Content
    description: '',
});

const Topic = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [topics, setTopics] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchTopics();
        } else {
            if (editingRecord) {
                fetchTopic(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchTopics = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Topic?fields=["name","topic_name"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setTopics(response.data.data || []);
        } catch (err) {
            console.error('Error fetching topics:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchTopic = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Topic/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                topic_name: d.topic_name || d.name || '',
                topic_content: (d.topic_content || []).map(tc => ({
                    content_type: tc.content_type || '',
                    content: tc.content || '',
                    name: tc.name
                })),
                description: d.description || '',
            });
        } catch (err) {
            console.error('Error fetching topic:', err);
            notification.error({ message: 'Error', description: 'Failed to load topic data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Topic Content Child Table ---
    const addContentRow = () => {
        setForm(prev => ({
            ...prev,
            topic_content: [...prev.topic_content, { content_type: '', content: '' }]
        }));
    };

    const removeContentRow = (index) => {
        const newContent = [...form.topic_content];
        newContent.splice(index, 1);
        setForm(prev => ({ ...prev, topic_content: newContent }));
    };

    const updateContentRow = (index, field, value) => {
        const newContent = [...form.topic_content];
        newContent[index][field] = value;
        setForm(prev => ({ ...prev, topic_content: newContent }));
    };

    const handleSave = async () => {
        if (!form.topic_name) {
            notification.warning({ message: 'Topic Name is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                topic_name: form.topic_name,
                topic_content: form.topic_content.map(tc => ({
                    content_type: tc.content_type,
                    content: tc.content
                })),
                description: form.description || null,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Topic/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Topic updated successfully.' });
            } else {
                await API.post('/api/resource/Topic', payload);
                notification.success({ message: 'Topic created successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this topic?')) return;
        try {
            await API.delete(`/api/resource/Topic/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Topic deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = topics.filter(t => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (t.name || '').toLowerCase().includes(q) ||
                (t.topic_name || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Topic</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchTopics} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Topic
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search ID or Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {topics.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Topic Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Topics Found</p>
                                        <p className="text-sm text-gray-400">Try adjusting your search or add a new topic.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.topic_name || row.name}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading topic data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Topic'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[500px]">
                <div className="max-w-4xl space-y-8">
                    <div>
                        <label className={labelStyle}>Topic Name *</label>
                        <input type="text" className={inputStyle} value={form.topic_name} onChange={e => updateField('topic_name', e.target.value)} placeholder="e.g. Newton's Laws of Motion" />
                    </div>

                    <div className="pt-4">
                        <h3 className="font-semibold text-gray-800 text-sm mb-4">Topic Content</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left w-12 text-gray-400 font-normal">No.</th>
                                        <th className="px-3 py-2.5 text-left">Content Type *</th>
                                        <th className="px-3 py-2.5 text-left">Content *</th>
                                        <th className="px-3 py-2 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {form.topic_content.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic text-sm">No content added yet</td></tr>
                                    ) : (
                                        form.topic_content.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                <td className="px-3 py-2.5">
                                                    <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.content_type} onChange={e => updateContentRow(idx, 'content_type', e.target.value)}>
                                                        <option value="">Select Type...</option>
                                                        {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.content} onChange={e => updateContentRow(idx, 'content', e.target.value)} placeholder="URL or identifier..." />
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button onClick={() => removeContentRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addContentRow}>
                            Add Row
                        </button>
                    </div>

                    <div className="pt-4">
                        <label className={labelStyle}>Description</label>
                        <textarea className={`${inputStyle} h-[200px] resize-y pt-2 leading-relaxed text-gray-700`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Provide detailed description of the topic..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topic;
