import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    name: '',
    category_name: '',
    round_off_tax_amount: 0,
    consider_entire_party_ledger_amount: 0,
    only_deduct_tax_on_excess_amount: 0,
    rates: [],
    accounts: []
});

const emptyRate = () => ({
    from_date: '',
    to_date: '',
    tax_withholding_rate: 0,
    single_transaction_threshold: 0,
    cumulative_transaction_threshold: 0
});

const emptyAccount = () => ({
    company: 'Preeshee Consultancy Services',
    account: ''
});

const TaxWithholdingCategory = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form, setForm] = useState(emptyForm());

    const [companies, setCompanies] = useState([]);
    const [accounts, setAccountsList] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchCategory(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Tax Withholding Category?fields=["name","category_name"]');
            setCategories(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch categories' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCategory = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Tax Withholding Category/${encodeURIComponent(name)}`);
            const data = res.data.data;
            setForm({
                ...data,
                rates: data.rates || [],
                accounts: data.accounts || []
            });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, accRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&limit_page_length=None')
            ]);
            setCompanies((compRes.data.data || []).map(d => d.name));
            setAccountsList((accRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const handleSave = async () => {
        if (!form.name && !editingRecord) {
            notification.warning({ message: 'Validation', description: 'Name is required' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Tax Withholding Category/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Category updated' });
            } else {
                await API.post('/api/resource/Tax Withholding Category', form);
                notification.success({ message: 'Category created' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await API.delete(`/api/resource/Tax Withholding Category/${encodeURIComponent(name)}`);
            notification.success({ message: 'Category deleted' });
            fetchCategories();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Delete failed' });
        }
    };

    // Child Table Handlers
    const addRateRow = () => setForm({ ...form, rates: [...form.rates, emptyRate()] });
    const updateRateRow = (index, field, value) => {
        const newRates = [...form.rates];
        newRates[index][field] = value;
        setForm({ ...form, rates: newRates });
    };
    const removeRateRow = (index) => {
        const newRates = form.rates.filter((_, i) => i !== index);
        setForm({ ...form, rates: newRates });
    };

    const addAccountRow = () => setForm({ ...form, accounts: [...form.accounts, emptyAccount()] });
    const updateAccountRow = (index, field, value) => {
        const newAccounts = [...form.accounts];
        newAccounts[index][field] = value;
        setForm({ ...form, accounts: newAccounts });
    };
    const removeAccountRow = (index) => {
        const newAccounts = form.accounts.filter((_, i) => i !== index);
        setForm({ ...form, accounts: newAccounts });
    };

    const inputStyle = "w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all font-bold";
    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";
    const sectionTitle = "text-[16px] font-black text-gray-800 mb-6 uppercase tracking-[0.2em] border-b border-gray-100 pb-4";

    if (view === 'list') {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 border border-blue-100 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Tax Withholding Category</h1>
                    </div>
                    <button className="px-5 py-2.5 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase tracking-widest text-[11px]" onClick={() => { setEditingRecord(null); setView('form'); }}>
                        + Add Category
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-50 overflow-hidden shadow-2xl shadow-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-[#FAFBFC] border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Category Name</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-20 italic text-gray-300 font-medium"><Spin /></td></tr>
                            ) : categories.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-24 text-gray-400 font-bold italic uppercase text-[12px]">No categories found</td></tr>
                            ) : categories.map(cat => (
                                <tr key={cat.name} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button onClick={() => { setEditingRecord(cat.name); setView('form'); }} className="text-gray-800 font-black hover:text-blue-600 transition-colors">
                                            {cat.name}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {cat.category_name}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(cat.name)} className="text-gray-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50" title="Delete">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? `Edit ${editingRecord}` : 'New Tax Withholding Category'}
                    </h2>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-black border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition font-bold text-xs uppercase tracking-widest shadow-sm" onClick={() => setView('list')}>Cancel</button>
                    <button className="px-8 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Name */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <div className="max-w-md">
                        <label className={labelStyle}>Name *</label>
                        <input className={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!!editingRecord} />
                    </div>
                </div>

                {/* Category Details */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h3 className={sectionTitle}>Category Details</h3>
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <label className={labelStyle}>Category Name</label>
                                <input className={inputStyle} value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} />
                            </div>
                            
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer" checked={!!form.round_off_tax_amount} onChange={e => setForm({ ...form, round_off_tax_amount: e.target.checked ? 1 : 0 })} />
                                <div>
                                    <span className="font-bold text-gray-800 text-[13px] group-hover:text-blue-600 transition-colors block">Round Off Tax Amount</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Checking this will round off the tax amount to the nearest integer</span>
                                </div>
                            </label>
                        </div>
                        <div className="space-y-8 pt-6">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer" checked={!!form.consider_entire_party_ledger_amount} onChange={e => setForm({ ...form, consider_entire_party_ledger_amount: e.target.checked ? 1 : 0 })} />
                                <div>
                                    <span className="font-bold text-gray-800 text-[13px] group-hover:text-blue-600 transition-colors block">Consider Entire Party Ledger Amount</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Even invoices with apply tax withholding unchecked will be considered for checking cumulative threshold breach</span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer" checked={!!form.only_deduct_tax_on_excess_amount} onChange={e => setForm({ ...form, only_deduct_tax_on_excess_amount: e.target.checked ? 1 : 0 })} />
                                <div>
                                    <span className="font-bold text-gray-800 text-[13px] group-hover:text-blue-600 transition-colors block">Only Deduct Tax On Excess Amount</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Tax will be withheld only for amount exceeding the cumulative threshold</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tax Withholding Rates */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h3 className={sectionTitle}>Tax Withholding Rates</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-16 text-center">No.</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">From Date *</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">To Date *</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tax Withholding Rate</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Single Transaction Threshold</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cumulative Transaction Threshold</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {form.rates.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-2 text-center text-xs font-mono text-gray-400">{index + 1}</td>
                                        <td className="px-4 py-2"><input type="date" className={inputStyle} value={row.from_date || ''} onChange={(e) => updateRateRow(index, 'from_date', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="date" className={inputStyle} value={row.to_date || ''} onChange={(e) => updateRateRow(index, 'to_date', e.target.value)} /></td>
                                        <td className="px-4 py-2"><input type="number" step="0.001" className={inputStyle + " text-right"} value={row.tax_withholding_rate} onChange={(e) => updateRateRow(index, 'tax_withholding_rate', Number(e.target.value))} /></td>
                                        <td className="px-4 py-2"><input type="number" step="0.001" className={inputStyle + " text-right"} value={row.single_transaction_threshold} onChange={(e) => updateRateRow(index, 'single_transaction_threshold', Number(e.target.value))} /></td>
                                        <td className="px-4 py-2"><input type="number" step="0.001" className={inputStyle + " text-right"} value={row.cumulative_transaction_threshold} onChange={(e) => updateRateRow(index, 'cumulative_transaction_threshold', Number(e.target.value))} /></td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => removeRateRow(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-gray-100 bg-[#F8F9FA]/50">
                            <button onClick={addRateRow} className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                                <span>Add Row</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h3 className={sectionTitle}>Account Details</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8F9FA] border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-16 text-center">No.</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company *</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account *</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {form.accounts.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-2 text-center text-xs font-mono text-gray-400">{index + 1}</td>
                                        <td className="px-4 py-2">
                                            <select className={inputStyle} value={row.company} onChange={(e) => updateAccountRow(index, 'company', e.target.value)}>
                                                <option value="">Select Company...</option>
                                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <select className={inputStyle} value={row.account} onChange={(e) => updateAccountRow(index, 'account', e.target.value)}>
                                                <option value="">Select Account...</option>
                                                {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => removeAccountRow(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-gray-100 bg-[#F8F9FA]/50">
                            <button onClick={addAccountRow} className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                                <span>Add Row</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaxWithholdingCategory;
