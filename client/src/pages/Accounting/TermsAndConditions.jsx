import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    title: '',
    terms: '',
});

const TermsAndConditions = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [templates, setTemplates] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchTemplates();
        } else if (editingRecord) {
            fetchTemplate(editingRecord);
        } else {
            setForm(emptyForm());
        }
    }, [view, editingRecord]);

    const fetchTemplates = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Terms and Conditions?fields=["name","title"]&limit_page_length=None');
            setTemplates(response.data.data || []);
        } catch (err) {
            console.error('Error fetching terms:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchTemplate = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Terms and Conditions/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching terms details:', err);
            notification.error({ message: 'Error', description: 'Failed to load terms and conditions.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.title) {
            notification.warning({ message: 'Missing Title', description: 'Title is required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Terms and Conditions/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Terms updated.' });
            } else {
                await API.post('/api/resource/Terms and Conditions', form);
                notification.success({ message: 'Terms created.' });
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
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await API.delete(`/api/resource/Terms and Conditions/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Terms deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = templates.filter(t => (t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Terms and Conditions</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchTemplates} disabled={loadingList}>
                             Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Template
                        </button>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-500 bg-blue-50/50 p-3 rounded border border-blue-100 italic">
                    Configure terms and conditions templates to be used in invoices, quotes, and other accounting documents.
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600 uppercase tracking-tight text-[11px]">Template Name</th>
                                <th className="px-6 py-3 font-medium text-gray-600 uppercase tracking-tight text-[11px]">ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching entries...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="2" className="text-center py-16 text-gray-500 font-medium italic">No Terms Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.title || row.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-gray-400 font-mono text-xs">{row.name}</td>
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
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20 text-gray-400 italic font-medium flex-col items-center gap-4">
                <Spin size="large" />
                Loading template details...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Terms and Conditions'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8 text-gray-800">
                <div>
                    <label className={labelStyle}>Template Title *</label>
                    <input className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Standard Payment Terms" />
                </div>
                
                <div>
                    <label className={labelStyle}>Terms and Conditions</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded px-4 py-3 text-sm bg-gray-50/20 focus:outline-none focus:border-blue-400 min-h-[400px] leading-relaxed font-serif" 
                        value={form.terms} 
                        onChange={e => updateField('terms', e.target.value)} 
                        placeholder="Write your terms here..."
                    />
                    <p className="mt-2 text-xs text-gray-400 italic">
                        The terms content will be displayed on printed documents and PDFs.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
