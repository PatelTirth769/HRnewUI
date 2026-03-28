import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const PROVIDERS = ['YouTube', 'Vimeo', 'HTML5', 'Other'];

const emptyForm = () => ({
    title: '',
    provider: 'YouTube',
    url: '',
    duration: '',
    publish_date: '',
    description: '',
});

const Video = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [videos, setVideos] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchVideos();
        } else {
            if (editingRecord) {
                fetchVideo(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchVideos = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Video?fields=["name","title","provider","publish_date"]&limit_page_length=None&order_by=publish_date desc';
            const response = await API.get(url);
            setVideos(response.data.data || []);
        } catch (err) {
            console.error('Error fetching videos:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchVideo = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Video/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                title: d.title || '',
                provider: d.provider || 'YouTube',
                url: d.url || '',
                duration: d.duration || '',
                publish_date: d.publish_date || '',
                description: d.description || '',
            });
        } catch (err) {
            console.error('Error fetching video:', err);
            notification.error({ message: 'Error', description: 'Failed to load video data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.title || !form.provider || !form.url) {
            notification.warning({ message: 'Title, Provider, and URL are required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                provider: form.provider,
                url: form.url,
                duration: form.duration || null,
                publish_date: form.publish_date || null,
                description: form.description || null,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Video/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Video updated successfully.' });
            } else {
                await API.post('/api/resource/Video', payload);
                notification.success({ message: 'Video created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            await API.delete(`/api/resource/Video/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Video deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = videos.filter(v => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (v.name || '').toLowerCase().includes(q) ||
                (v.title || '').toLowerCase().includes(q) ||
                (v.provider || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Video</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchVideos} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Video
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Title, Provider or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {videos.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Title</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Provider</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Publish Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1 text-gray-400 italic">No Videos Found</p>
                                        <p className="text-sm text-gray-300">Try adjusting your search or add a new video.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.title || row.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[11px] font-bold uppercase">{row.provider || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.publish_date || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading video data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Video'}</span>
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
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Title *</label>
                                <input type="text" className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Enter video title..." />
                            </div>
                            <div>
                                <label className={labelStyle}>Provider *</label>
                                <select className={inputStyle} value={form.provider} onChange={e => updateField('provider', e.target.value)}>
                                    {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>URL *</label>
                                <input type="text" className={inputStyle} value={form.url} onChange={e => updateField('url', e.target.value)} placeholder="e.g. https://www.youtube.com/watch?v=..." />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Publish Date</label>
                                <input type="date" className={inputStyle} value={form.publish_date} onChange={e => updateField('publish_date', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Duration</label>
                                <input type="text" className={inputStyle} value={form.duration} onChange={e => updateField('duration', e.target.value)} placeholder="e.g. 10:30" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className={labelStyle}>Description *</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-[200px]">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-4 text-gray-400 select-none">
                                <span className="hover:text-gray-600 cursor-help font-serif italic text-xs">Toolbar mockup</span>
                            </div>
                            <textarea 
                                className="flex-1 w-full p-4 text-sm leading-relaxed text-gray-700 focus:outline-none resize-y min-h-[200px]" 
                                value={form.description} 
                                onChange={e => updateField('description', e.target.value)} 
                                placeholder="Provide video description..." 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Video;
