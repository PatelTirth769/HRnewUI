import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    template_title: '',
    company: 'Preeshee Consultancy Services',
    voucher_type: 'Journal Entry',
    is_opening: 'No',
    naming_series: 'ACC-JV-.YYYY.-',
    multi_currency: 0,
    accounts: [],
});

const JournalEntryTemplate = () => {
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
            const response = await API.get('/api/resource/Journal Entry Template?fields=["name","template_title","company","voucher_type"]&limit_page_length=None');
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
            const res = await API.get(`/api/resource/Journal Entry Template/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                ...d,
                accounts: (d.accounts || []).map(acc => ({ ...acc, id: Math.random().toString(36).substr(2, 9) })),
            });
        } catch (err) {
            console.error('Error fetching template:', err);
            notification.error({ message: 'Error', description: 'Failed to load journal entry template.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.template_title) {
            notification.warning({ message: 'Missing Title', description: 'Template Title is required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Journal Entry Template/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Template updated.' });
            } else {
                await API.post('/api/resource/Journal Entry Template', form);
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
            await API.delete(`/api/resource/Journal Entry Template/${encodeURIComponent(editingRecord)}`);
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
            accounts: [...prev.accounts, { id: Math.random().toString(36).substr(2, 9), account: '' }]
        }));
    };

    const removeRow = (id) => {
        setForm(prev => ({
            ...prev,
            accounts: prev.accounts.filter(a => a.id !== id)
        }));
    };

    const updateRow = (id, key, value) => {
        setForm(prev => ({
            ...prev,
            accounts: prev.accounts.map(a => a.id === id ? { ...a, [key]: value } : a)
        }));
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = templates.filter(t => (t.template_title || '').toLowerCase().includes(search.toLowerCase()) || (t.name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Journal Entry Templates</h1>
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

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600">Title</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Entry Type</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Company</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching templates...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-16 text-gray-500 font-medium italic">No Templates Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.template_title || row.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{row.voucher_type}</td>
                                        <td className="px-6 py-3 text-gray-500">{row.company}</td>
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
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Journal Entry Template'}
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-10 text-gray-800">
                {/* Main Fields */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Template Title *</label>
                        <input className={inputStyle} value={form.template_title} onChange={e => updateField('template_title', e.target.value)} placeholder="e.g. Salary Template" />
                    </div>
                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Journal Entry Type *</label>
                        <select className={inputStyle} value={form.voucher_type} onChange={e => updateField('voucher_type', e.target.value)}>
                            <option value="Journal Entry">Journal Entry</option>
                            <option value="Contra Entry">Contra Entry</option>
                            <option value="Credit Note">Credit Note</option>
                            <option value="Debit Note">Debit Note</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Is Opening</label>
                        <select className={inputStyle} value={form.is_opening} onChange={e => updateField('is_opening', e.target.value)}>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Series *</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)}>
                            <option value="ACC-JV-.YYYY.-">ACC-JV-.YYYY.-</option>
                        </select>
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-600 font-medium">
                            <input type="checkbox" checked={!!form.multi_currency} onChange={e => updateField('multi_currency', e.target.checked ? 1 : 0)} />
                            Multi Currency
                        </label>
                    </div>
                </div>

                {/* Accounting Entries Grid */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[15px] mb-6 tracking-tight">Accounting Entries</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr className="text-gray-600 font-medium whitespace-nowrap">
                                    <th className="px-4 py-2 w-12 text-center">No.</th>
                                    <th className="px-4 py-2 text-left">Account *</th>
                                    <th className="px-4 py-2 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {form.accounts.length === 0 ? (
                                    <tr><td colSpan="3" className="px-4 py-16 text-center text-gray-400 italic flex flex-col items-center gap-3">
                                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        No Data
                                    </td></tr>
                                ) : (
                                    form.accounts.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                <select className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.account} onChange={e => updateRow(row.id, 'account', e.target.value)}>
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button className="text-red-300 hover:text-red-600 transition" onClick={() => removeRow(row.id)}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <button className="px-4 py-1.5 bg-white border border-gray-200 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm" onClick={addRow}>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JournalEntryTemplate;
