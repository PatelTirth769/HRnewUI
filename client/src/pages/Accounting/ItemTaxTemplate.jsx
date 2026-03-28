import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    title: '',
    disabled: 0,
    company: 'Preeshee Consultancy Services',
    taxes: [],
});

const ItemTaxTemplate = () => {
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

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchTemplates();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchTemplate(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchTemplates = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Item Tax Template?fields=["name","title","company","disabled"]&limit_page_length=None');
            setTemplates(response.data.data || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, accRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&limit_page_length=None'),
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setAccounts((accRes.data.data || []).map(a => a.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchTemplate = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Item Tax Template/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                ...d,
                taxes: (d.taxes || []).map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) })),
            });
        } catch (err) {
            console.error('Error fetching template:', err);
            notification.error({ message: 'Error', description: 'Failed to load template.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.title) {
            notification.warning({ message: 'Missing Title', description: 'Template Title is required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item Tax Template/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Template updated.' });
            } else {
                await API.post('/api/resource/Item Tax Template', form);
                notification.success({ message: 'Template created.' });
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
            await API.delete(`/api/resource/Item Tax Template/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Template deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Table Handlers
    const addRow = () => {
        setForm(prev => ({
            ...prev,
            taxes: [...prev.taxes, { id: Math.random().toString(36).substr(2, 9), tax_type: '', tax_rate: 0 }]
        }));
    };

    const removeRow = (id) => {
        setForm(prev => ({
            ...prev,
            taxes: prev.taxes.filter(t => t.id !== id)
        }));
    };

    const updateRow = (id, key, value) => {
        setForm(prev => ({
            ...prev,
            taxes: prev.taxes.map(t => t.id === id ? { ...t, [key]: value } : t)
        }));
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
                        <h1 className="text-2xl font-semibold text-gray-800">Item Tax Templates</h1>
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
                    Configure per-item tax templates to override standard tax rates for specific product categories or items.
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600 uppercase tracking-tight text-[11px]">Title</th>
                                <th className="px-6 py-3 font-medium text-gray-600 uppercase tracking-tight text-[11px]">Company</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-center uppercase tracking-tight text-[11px]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching entries...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-16 text-gray-500 font-medium italic">No Templates Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.title || row.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 text-sm italic">{row.company}</td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border ${!row.disabled ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {!row.disabled ? 'Enabled' : 'Disabled'}
                                            </span>
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
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Item Tax Template'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shrink-0" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm shrink-0" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 shrink-0" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-10 text-gray-800 text-[14px]">
                {/* Main Fields */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Title *</label>
                        <input className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g. GST Exempt Template" />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-800 font-medium group pt-6">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 transition cursor-pointer" checked={!!form.disabled} onChange={e => updateField('disabled', e.target.checked ? 1 : 0)} />
                            <span className="group-hover:text-red-700 transition">Disabled</span>
                        </label>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label className={labelStyle}>Company *</label>
                        <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Tax Rates Grid */}
                <div className="pt-8 border-t border-gray-100 font-sans">
                    <h3 className="font-bold text-gray-800 text-[15px] mb-6 tracking-tight uppercase tracking-widest text-[11px] text-gray-400">Tax Rates</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F9FAFB] border-b border-gray-200">
                                <tr className="text-gray-500 font-semibold whitespace-nowrap uppercase tracking-tighter text-[11px]">
                                    <th className="px-4 py-3.5 w-12 text-center">No.</th>
                                    <th className="px-4 py-3.5 text-left flex items-center gap-1">Tax <span className="text-red-400">*</span></th>
                                    <th className="px-4 py-3.5 text-right">Tax Rate</th>
                                    <th className="px-4 py-3.5 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {form.taxes.length === 0 ? (
                                    <tr><td colSpan="4" className="px-4 py-20 text-center text-gray-400 italic flex flex-col items-center gap-4 bg-white">
                                        <svg className="w-12 h-12 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <span className="text-gray-300 font-medium tracking-tight">Click Add Row to define tax overrides</span>
                                    </td></tr>
                                ) : (
                                    form.taxes.map((row, idx) => (
                                        <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 text-center text-gray-300 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-4 py-1">
                                                <select className="w-full border-none focus:ring-0 text-sm py-2 bg-transparent font-medium text-gray-700" value={row.tax_type} onChange={e => updateRow(row.id, 'tax_type', e.target.value)}>
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-1">
                                                <input type="number" className="w-full border-none focus:ring-0 text-sm py-2 bg-transparent text-right font-bold text-gray-600" value={row.tax_rate} onChange={e => updateRow(row.id, 'tax_rate', Number(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-4 text-center relative">
                                                <button className="text-gray-200 hover:text-red-500 transition-all duration-200 p-1 rounded hover:bg-red-50" onClick={() => removeRow(row.id)}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-4 bg-[#F9FAFB] border-t border-gray-100 flex justify-start">
                            <button className="px-5 py-2 bg-white border border-gray-200 rounded-md text-[13px] font-bold text-gray-700 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 active:scale-95" onClick={addRow}>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemTaxTemplate;
