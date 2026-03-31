import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    posting_date: new Date().toISOString().split('T')[0],
    company: '',
    rounding_loss_allowance: 0.05,
    accounts: [],
    docstatus: 0,
});

const ExchangeRateRevaluation = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [revaluations, setRevaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchRevaluations();
        } else {
            fetchCompanies();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchRevaluations = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Exchange Rate Revaluation?fields=["name","posting_date","company","docstatus"]&limit_page_length=None&order_by=creation desc');
            setRevaluations(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch revaluations' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
            setCompanies(res.data.data || []);
            if (res.data.data?.length > 0 && !formData.company) {
                setFormData(prev => ({ ...prev, company: res.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Exchange Rate Revaluation/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Exchange Rate Revaluation/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Revaluation updated successfully' });
            } else {
                const res = await API.post('/api/resource/Exchange Rate Revaluation', formData);
                setEditingRecord(res.data.data.name);
                notification.success({ message: 'Revaluation created successfully' });
            }
            fetchRevaluations();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!editingRecord) return;
        setSaving(true);
        try {
            await API.post('/api/method/frappe.client.submit', {
                doctype: 'Exchange Rate Revaluation',
                name: editingRecord
            });
            notification.success({ message: 'Revaluation submitted successfully' });
            fetchDetails(editingRecord);
        } catch (err) {
            notification.error({ message: 'Submit Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!editingRecord || !window.confirm('Cancel this revaluation?')) return;
        setSaving(true);
        try {
            await API.post('/api/method/frappe.client.cancel', {
                doctype: 'Exchange Rate Revaluation',
                name: editingRecord
            });
            notification.success({ message: 'Revaluation cancelled' });
            fetchDetails(editingRecord);
        } catch (err) {
            notification.error({ message: 'Cancel Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this draft?')) return;
        try {
            await API.delete(`/api/resource/Exchange Rate Revaluation/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchRevaluations();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const addRow = () => {
        setFormData({
            ...formData,
            accounts: [...formData.accounts, { account: '', new_exchange_rate: 1.0, balance_in_base_currency: 0, new_balance_in_base_currency: 0, gain_loss: 0 }]
        });
    };

    const updateRow = (idx, field, val) => {
        const updated = [...formData.accounts];
        updated[idx][field] = val;
        
        // Basic calculation for Gain/Loss if relevant
        if (field === 'new_exchange_rate' || field === 'balance_in_base_currency') {
            // This is a placeholder for logic that would normally happen in ERPNext
            updated[idx].new_balance_in_base_currency = updated[idx].balance_in_base_currency * (val || 0);
            updated[idx].gain_loss = updated[idx].new_balance_in_base_currency - updated[idx].balance_in_base_currency;
        }
        
        setFormData({ ...formData, accounts: updated });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm read-only:bg-gray-50/50";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = revaluations.filter(r => {
            if (!search) return true;
            return (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.company || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Exchange Rate Revaluations</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchRevaluations} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Revaluation
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search ID or Company..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Posting Date</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Company</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic">
                            {loading ? (
                                <tr><td colSpan="4" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="py-20 text-center text-gray-500 italic font-medium tracking-tight">No revaluations found</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                            {r.name}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-700">{r.posting_date}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                r.docstatus === 1 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                r.docstatus === 2 ? 'bg-red-50 text-red-600 border-red-100' : 
                                                'bg-[#FCE8E8] text-[#E02424] border-[#F8B4B4]'
                                            }`}>
                                                {r.docstatus === 1 ? 'Submitted' : r.docstatus === 2 ? 'Cancelled' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-xs text-gray-400 uppercase">{r.company}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const isSubmitted = formData.docstatus === 1;
    const isCancelled = formData.docstatus === 2;
    const isDraft = formData.docstatus === 0;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Exchange Rate Revaluation'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border ${
                        isSubmitted ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        isCancelled ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-[#FCE8E8] text-[#E02424] border-[#F8B4B4]'
                    }`}>
                        {isSubmitted ? 'Submitted' : isCancelled ? 'Cancelled' : 'Not Saved'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {isDraft && (
                        <>
                            {editingRecord && (
                                <>
                                    <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSubmit} disabled={saving}>
                                        Submit
                                    </button>
                                </>
                            )}
                            <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                            </button>
                        </>
                    )}
                    {isSubmitted && (
                        <button className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100 disabled:opacity-70 flex items-center gap-2" onClick={handleCancel} disabled={saving}>
                            Cancel Revaluation
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-12">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Posting Date *</label>
                            <input 
                                type="date"
                                className={inputStyle} 
                                value={formData.posting_date} 
                                onChange={e => setFormData({ ...formData, posting_date: e.target.value })}
                                readOnly={!isDraft}
                            />
                        </div>
                        <div>
                            <label className={labelStyle}>Rounding Loss Allowance</label>
                            <input 
                                type="number"
                                className={inputStyle} 
                                value={formData.rounding_loss_allowance} 
                                onChange={e => setFormData({ ...formData, rounding_loss_allowance: parseFloat(e.target.value) || 0 })}
                                step="0.001"
                                readOnly={!isDraft}
                            />
                            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed italic">
                                Only values between [0,1] are allowed. Like &#123;0.00, 0.04, 0.09, ...&#125; Ex: If allowance is set at 0.07, accounts that have balance of 0.07 in either of the currencies will be considered as zero balance account
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select 
                            className={inputStyle} 
                            value={formData.company} 
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            disabled={!isDraft}
                        >
                            {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <button className="px-4 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" disabled={!isDraft}>
                            Get Entries
                        </button>
                    </div>

                    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center text-[10px] uppercase font-bold tracking-widest text-gray-400">No.</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-tighter text-blue-600 italic">Account *</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-tighter">New Exchange Rate *</th>
                                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-tighter">Balance In Base Currency</th>
                                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-tighter">New Balance In Base Curren...</th>
                                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-tighter">Gain/Loss</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 uppercase font-medium text-[12px]">
                                {formData.accounts.length === 0 ? (
                                    <tr><td colSpan="7" className="py-12 text-center text-gray-400 italic">No accounts revalued</td></tr>
                                ) : (
                                    formData.accounts.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-400 font-black text-[11px]">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    className="w-full border-none bg-transparent focus:outline-none font-bold placeholder:font-normal" 
                                                    value={row.account} 
                                                    onChange={e => updateRow(idx, 'account', e.target.value)}
                                                    placeholder="Account Name..."
                                                    readOnly={!isDraft}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent focus:outline-none font-mono font-bold text-gray-700 text-sm"
                                                    value={row.new_exchange_rate}
                                                    onChange={e => updateRow(idx, 'new_exchange_rate', parseFloat(e.target.value) || 0)}
                                                    step="0.000000001"
                                                    readOnly={!isDraft}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-400">₹{parseFloat(row.balance_in_base_currency || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-400">₹{parseFloat(row.new_balance_in_base_currency || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 border-l border-gray-50">₹{parseFloat(row.gain_loss || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">
                                                {isDraft && (
                                                    <button className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2" onClick={() => {
                                                        const updated = formData.accounts.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, accounts: updated });
                                                    }}>✕</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {isDraft && (
                        <button className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addRow}>
                            + Add Row
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateRevaluation;
