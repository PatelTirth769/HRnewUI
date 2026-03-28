import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const defaultClosedDocuments = [
    { document_type: 'Sales Invoice', closed: 1 },
    { document_type: 'Purchase Invoice', closed: 1 },
    { document_type: 'Journal Entry', closed: 1 },
    { document_type: 'Bank Clearance', closed: 1 },
    { document_type: 'Stock Entry', closed: 1 },
    { document_type: 'Dunning', closed: 1 },
    { document_type: 'Invoice Discounting', closed: 1 },
    { document_type: 'Payment Entry', closed: 1 },
    { document_type: 'Period Closing Voucher', closed: 1 },
    { document_type: 'Process Deferred Accounting', closed: 1 },
    { document_type: 'Asset', closed: 1 },
    { document_type: 'Asset Capitalization', closed: 1 },
    { document_type: 'Asset Repair', closed: 1 },
    { document_type: 'Delivery Note', closed: 1 },
    { document_type: 'Landed Cost Voucher', closed: 1 },
    { document_type: 'Purchase Receipt', closed: 1 },
    { document_type: 'Stock Reconciliation', closed: 1 },
    { document_type: 'Subcontracting Receipt', closed: 1 },
    { document_type: 'Payroll Entry', closed: 1 }
];

const emptyForm = () => ({
    period_name: '',
    company: 'Preeshe Consultancy Services',
    start_date: '',
    end_date: '',
    closed_documents: [...defaultClosedDocuments],
});

const AccountingPeriod = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [periods, setPeriods] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Metadata
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchPeriods();
        } else {
            fetchCompanies();
            if (editingRecord) {
                fetchPeriod(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchPeriods = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Accounting Period?fields=["name","period_name","company","start_date","end_date"]&limit_page_length=None');
            setPeriods(response.data.data || []);
        } catch (err) {
            console.error('Error fetching periods:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await API.get('/api/resource/Company?fields=["name"]');
            setCompanies((res.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchPeriod = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Accounting Period/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                period_name: d.period_name || '',
                company: d.company || '',
                start_date: d.start_date || '',
                end_date: d.end_date || '',
                closed_documents: (d.closed_documents || []).map(row => ({
                    document_type: row.document_type,
                    closed: row.closed ?? 0,
                    name: row.name
                })),
            });
        } catch (err) {
            console.error('Error fetching period:', err);
            notification.error({ message: 'Error', description: 'Failed to load accounting period.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const updateRow = (index, closed) => {
        setForm(prev => {
            const newDocs = [...prev.closed_documents];
            newDocs[index] = { ...newDocs[index], closed: closed ? 1 : 0 };
            return { ...prev, closed_documents: newDocs };
        });
    };

    const addRow = () => {
        setForm(prev => ({
            ...prev,
            closed_documents: [...prev.closed_documents, { document_type: '', closed: 1 }]
        }));
    };

    const removeRow = (index) => {
        setForm(prev => ({
            ...prev,
            closed_documents: prev.closed_documents.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        if (!form.period_name || !form.company) {
            notification.warning({ message: 'Period Name and Company are required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Accounting Period/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Accounting Period updated.' });
            } else {
                await API.post('/api/resource/Accounting Period', form);
                notification.success({ message: 'Accounting Period created.' });
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
        if (!window.confirm('Are you sure you want to delete this accounting period?')) return;
        try {
            await API.delete(`/api/resource/Accounting Period/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Accounting Period deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = periods.filter(p => 
            (p.period_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.company || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center"
                            title="Go Back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Accounting Periods</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchPeriods} disabled={loadingList}>
                             Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Accounting Period
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Period..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600">Period Name</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Company</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Start Date</th>
                                <th className="px-6 py-3 font-medium text-gray-600">End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic font-medium">Fetching periods...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-16 text-gray-500 font-medium italic">No Periods Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.period_name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">{row.company}</td>
                                        <td className="px-6 py-3 text-gray-600 font-mono">{row.start_date}</td>
                                        <td className="px-6 py-3 text-gray-600 font-mono">{row.end_date}</td>
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
                Loading accounting period data...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Accounting Period'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-10">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Period Name *</label>
                        <input className={inputStyle} value={form.period_name} onChange={e => updateField('period_name', e.target.value)} placeholder="e.g. FY 2026 Q1" />
                    </div>
                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                            <option value="">Select Company...</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Start Date *</label>
                        <input type="date" className={inputStyle} value={form.start_date} onChange={e => updateField('start_date', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelStyle}>End Date *</label>
                        <input type="date" className={inputStyle} value={form.end_date} onChange={e => updateField('end_date', e.target.value)} />
                    </div>
                </div>

                {/* Closed Documents Table */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[13px] mb-4 uppercase tracking-wider">Closed Documents</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden whitespace-nowrap overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-2 w-12 text-gray-400 font-medium text-center">No.</th>
                                    <th className="px-4 py-2 text-gray-600 font-medium text-left">Document Type *</th>
                                    <th className="px-4 py-2 text-gray-600 font-medium text-center">Closed</th>
                                    <th className="px-4 py-2 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 text-gray-800">
                                {form.closed_documents.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 text-center text-gray-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="px-4 py-2.5">
                                            <input 
                                                className="w-full border-none focus:ring-0 bg-transparent text-sm" 
                                                value={row.document_type} 
                                                onChange={(e) => {
                                                    const newDocs = [...form.closed_documents];
                                                    newDocs[idx].document_type = e.target.value;
                                                    setForm(prev => ({ ...prev, closed_documents: newDocs }));
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                checked={!!row.closed} 
                                                onChange={(e) => updateRow(idx, e.target.checked)}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <button className="text-gray-300 hover:text-red-500 transition" onClick={() => removeRow(idx)}>
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm" onClick={addRow}>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingPeriod;
