import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    title: '',
    author: '',
    content: '',
    publish_date: '',
});

const Article = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [articles, setArticles] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchArticles();
        } else {
            if (editingRecord) {
                fetchArticle(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchArticles = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Article?fields=["name","title","author","publish_date"]&limit_page_length=None&order_by=publish_date desc';
            const response = await API.get(url);
            setArticles(response.data.data || []);
        } catch (err) {
            console.error('Error fetching articles:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchArticle = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Article/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                title: d.title || '',
                author: d.author || '',
                content: d.content || '',
                publish_date: d.publish_date || '',
            });
        } catch (err) {
            console.error('Error fetching article:', err);
            notification.error({ message: 'Error', description: 'Failed to load article data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.title) {
            notification.warning({ message: 'Title is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                author: form.author || null,
                content: form.content || null,
                publish_date: form.publish_date || null,
            };

            if (editingRecord) {
                await API.put(`/api/resource/Article/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Article updated successfully.' });
            } else {
                await API.post('/api/resource/Article', payload);
                notification.success({ message: 'Article created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this article?')) return;
        try {
            await API.delete(`/api/resource/Article/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Article deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = articles.filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.title || '').toLowerCase().includes(q) ||
                (a.author || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Article</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchArticles} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Article
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Title, Author or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {articles.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Title</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Author</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Publish Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1 text-gray-400 italic">No Articles Found</p>
                                        <p className="text-sm text-gray-300">Try adjusting your search or add a new article.</p>
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
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.author || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading article data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Article'}</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[600px]">
                <div className="max-w-4xl space-y-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Title *</label>
                                <input type="text" className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Enter article title..." />
                            </div>
                            <div>
                                <label className={labelStyle}>Author</label>
                                <input type="text" className={inputStyle} value={form.author} onChange={e => updateField('author', e.target.value)} placeholder="Enter author name..." />
                            </div>
                            <div>
                                <label className={labelStyle}>Publish Date</label>
                                <input type="date" className={inputStyle} value={form.publish_date} onChange={e => updateField('publish_date', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50">
                        <label className={labelStyle}>Content</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-4 text-gray-400 select-none">
                                <span className="hover:text-gray-600 cursor-help font-serif italic text-xs">Toolbar options will appear here</span>
                            </div>
                            <textarea 
                                className="flex-1 w-full p-6 text-sm leading-relaxed text-gray-700 focus:outline-none resize-y min-h-[300px]" 
                                value={form.content} 
                                onChange={e => updateField('content', e.target.value)} 
                                placeholder="Write your article content here..." 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Article;
