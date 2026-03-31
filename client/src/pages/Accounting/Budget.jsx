import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const ACTION_OPTIONS = ['Stop', 'Warn', 'Ignore'];

const emptyForm = () => ({
    budget_against: 'Cost Center',
    fiscal_year: '',
    company: '',
    cost_center: '',
    monthly_distribution: '',
    applicable_on_material_request: 0,
    action_if_annual_budget_exceeded_on_mr: 'Stop',
    action_if_accumulated_monthly_budget_exceeded_on_mr: 'Warn',
    applicable_on_purchase_order: 0,
    action_if_annual_budget_exceeded_on_po: 'Stop',
    action_if_accumulated_monthly_budget_exceeded_on_po: 'Warn',
    applicable_on_booking_actual_expenses: 0,
    action_if_annual_budget_exceeded_on_actual: 'Stop',
    action_if_accumulated_monthly_budget_exceeded_on_actual: 'Warn',
    accounts: []
});

const Budget = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);
    const [accountsList, setAccountsList] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchBudgets();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchBudgetDetails(editingRecord);
            } else {
                setFormData(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Budget?fields=["name","fiscal_year","company","cost_center","modified"]&limit_page_length=None&order_by=modified desc');
            setBudgets(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch budgets' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, ccRes, fyRes, accRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Fiscal Year?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Account?fields=["name"]&filters=[["is_group","=",0]]&limit_page_length=None')
            ]);
            setCompanies(compRes.data.data || []);
            setCostCenters(ccRes.data.data || []);
            setFiscalYears(fyRes.data.data || []);
            setAccountsList(accRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchBudgetDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Budget/${encodeURIComponent(name)}`);
            setFormData({
                ...emptyForm(), // ensures default values for new fields
                ...res.data.data
            });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch budget details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.fiscal_year || !formData.company) {
            notification.warning({ message: 'Validation', description: 'Fiscal Year and Company are required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Budget/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Success', description: 'Budget updated' });
            } else {
                await API.post('/api/resource/Budget', formData);
                notification.success({ message: 'Success', description: 'Budget created' });
            }
            setView('list');
            fetchBudgets();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save budget' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this budget?')) return;
        try {
            await API.delete(`/api/resource/Budget/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Success', description: 'Budget deleted' });
            setView('list');
            fetchBudgets();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to delete budget' });
        }
    };

    const addAccountRow = () => {
        setFormData({
            ...formData,
            accounts: [...formData.accounts, { account: '', budget_amount: 0 }]
        });
    };

    const updateAccountRow = (index, field, value) => {
        const updated = [...formData.accounts];
        updated[index][field] = value;
        setFormData({ ...formData, accounts: updated });
    };

    const removeAccountRow = (index) => {
        const updated = formData.accounts.filter((_, i) => i !== index);
        setFormData({ ...formData, accounts: updated });
    };

    // --- Standard UI Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 shadow-sm transition-all";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-bold text-gray-800 text-sm mb-6 uppercase tracking-wider";
    const checkboxStyle = "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors";

    if (view === 'list') {
        const filtered = budgets.filter(b => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (b.name || '').toLowerCase().includes(q) ||
                (b.fiscal_year || '').toLowerCase().includes(q) ||
                (b.company || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Budgets</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchBudgets} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Budget
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none" placeholder="Search ID, Fiscal Year or Company..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Fiscal Year</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Company</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Cost Center</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Modified</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="py-12 text-center text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="py-20 text-center text-gray-500 italic">No budgets found</td></tr>
                            ) : (
                                filtered.map((b) => (
                                    <tr key={b.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold tracking-tighter">
                                            <button onClick={() => { setEditingRecord(b.name); setView('form'); }} className="text-blue-600 hover:text-blue-800 transition-colors text-sm">
                                                {b.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-900 font-bold text-xs">{b.fiscal_year}</td>
                                        <td className="px-5 py-4 text-gray-600 font-medium text-xs">{b.company}</td>
                                        <td className="px-5 py-4 text-gray-600 font-medium text-xs">{b.cost_center || '-'}</td>
                                        <td className="px-5 py-4 text-gray-400 text-[10px] uppercase font-black">{new Date(b.modified).toLocaleDateString()}</td>
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
        <div className="p-6 max-w-5xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Budget'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-12">
                {/* --- Section 1: Main Fields --- */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Budget Against *</label>
                        <select className={inputStyle} value={formData.budget_against} onChange={(e) => setFormData({ ...formData, budget_against: e.target.value })}>
                            <option value="Cost Center">Cost Center</option>
                            <option value="Project">Project</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelStyle}>Monthly Distribution</label>
                        <input className={inputStyle} value={formData.monthly_distribution} onChange={(e) => setFormData({ ...formData, monthly_distribution: e.target.value })} placeholder="Optional" />
                    </div>

                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select className={inputStyle} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}>
                            <option value="">Select Company...</option>
                            {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    <div />

                    <div>
                        <label className={labelStyle}>Cost Center *</label>
                        <select className={inputStyle} value={formData.cost_center} onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}>
                            <option value="">Select Cost Center...</option>
                            {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.name}</option>)}
                        </select>
                    </div>

                    <div />

                    <div>
                        <label className={labelStyle}>Fiscal Year *</label>
                        <select className={inputStyle} value={formData.fiscal_year} onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })}>
                            <option value="">Select Fiscal Year...</option>
                            {fiscalYears.map(fy => <option key={fy.name} value={fy.name}>{fy.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Section 2: Control Action --- */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className={sectionTitleStyle}>Control Action</h3>
                    <div className="space-y-8">
                        {/* Material Request Segment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="chk_material"
                                    checked={!!formData.applicable_on_material_request}
                                    onChange={(e) => setFormData({ ...formData, applicable_on_material_request: e.target.checked ? 1 : 0 })}
                                    className={checkboxStyle}
                                />
                                <label htmlFor="chk_material" className="text-sm font-semibold text-gray-700 cursor-pointer">Applicable on Material Request</label>
                            </div>
                            {!!formData.applicable_on_material_request && (
                                <div className="grid grid-cols-2 gap-8 pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div>
                                        <label className={labelStyle}>Action if Annual Budget Exceeded on MR</label>
                                        <select className={inputStyle} value={formData.action_if_annual_budget_exceeded_on_mr} onChange={e => setFormData({ ...formData, action_if_annual_budget_exceeded_on_mr: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Action if Accumulated Monthly Budget Exceeded on MR</label>
                                        <select className={inputStyle} value={formData.action_if_accumulated_monthly_budget_exceeded_on_mr} onChange={e => setFormData({ ...formData, action_if_accumulated_monthly_budget_exceeded_on_mr: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Purchase Order Segment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="chk_po"
                                    checked={!!formData.applicable_on_purchase_order}
                                    onChange={(e) => setFormData({ ...formData, applicable_on_purchase_order: e.target.checked ? 1 : 0 })}
                                    className={checkboxStyle}
                                />
                                <label htmlFor="chk_po" className="text-sm font-semibold text-gray-700 cursor-pointer">Applicable on Purchase Order</label>
                            </div>
                            {!!formData.applicable_on_purchase_order && (
                                <div className="grid grid-cols-2 gap-8 pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div>
                                        <label className={labelStyle}>Action if Annual Budget Exceeded on PO</label>
                                        <select className={inputStyle} value={formData.action_if_annual_budget_exceeded_on_po} onChange={e => setFormData({ ...formData, action_if_annual_budget_exceeded_on_po: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Action if Accumulated Monthly Budget Exceeded on PO</label>
                                        <select className={inputStyle} value={formData.action_if_accumulated_monthly_budget_exceeded_on_po} onChange={e => setFormData({ ...formData, action_if_accumulated_monthly_budget_exceeded_on_po: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actual Expenses Segment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="chk_actual"
                                    checked={!!formData.applicable_on_booking_actual_expenses}
                                    onChange={(e) => setFormData({ ...formData, applicable_on_booking_actual_expenses: e.target.checked ? 1 : 0 })}
                                    className={checkboxStyle}
                                />
                                <label htmlFor="chk_actual" className="text-sm font-semibold text-gray-700 cursor-pointer">Applicable on booking actual expenses</label>
                            </div>
                            {!!formData.applicable_on_booking_actual_expenses && (
                                <div className="grid grid-cols-2 gap-8 pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div>
                                        <label className={labelStyle}>Action if Annual Budget Exceeded on Actual</label>
                                        <select className={inputStyle} value={formData.action_if_annual_budget_exceeded_on_actual} onChange={e => setFormData({ ...formData, action_if_annual_budget_exceeded_on_actual: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Action if Accumulated Monthly Budget Exceeded on Actual</label>
                                        <select className={inputStyle} value={formData.action_if_accumulated_monthly_budget_exceeded_on_actual} onChange={e => setFormData({ ...formData, action_if_accumulated_monthly_budget_exceeded_on_actual: e.target.value })}>
                                            {ACTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Section 3: Budget Accounts --- */}
                <div className="pt-8 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className={sectionTitleStyle}>Budget Accounts</h3>
                    </div>
                    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#F9FAFB] border-b text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-[12px] w-16 text-center">No.</th>
                                    <th className="px-4 py-3 font-semibold text-[12px] text-blue-600 italic uppercase tracking-tighter">Account *</th>
                                    <th className="px-4 py-3 font-semibold text-[12px] text-right uppercase tracking-tighter">Budget Amount *</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {formData.accounts.length === 0 ? (
                                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">No accounts linked. Click 'Add Row' below.</td></tr>
                                ) : (
                                    formData.accounts.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-400 font-black text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="w-full border border-blue-100 rounded px-3 py-1.5 text-sm bg-blue-50/20 focus:outline-none focus:border-blue-400 font-bold text-gray-700"
                                                    value={row.account}
                                                    onChange={(e) => updateAccountRow(idx, 'account', e.target.value)}
                                                >
                                                    <option value="">Select Account...</option>
                                                    {accountsList.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 border border-gray-200 rounded px-2 bg-[#FDFDFD] focus-within:border-blue-300 transition-colors">
                                                    <span className="text-gray-300 font-black text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        className="w-full py-1.5 text-sm bg-transparent focus:outline-none text-right font-mono font-bold"
                                                        value={row.budget_amount}
                                                        onChange={(e) => updateAccountRow(idx, 'budget_amount', parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button onClick={() => removeAccountRow(idx)} className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addAccountRow}>
                        + Add Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Budget;
