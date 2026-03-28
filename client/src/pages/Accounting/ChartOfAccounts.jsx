import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const TABS = ['Details'];
const ACCOUNT_TYPES = [
    '', 'Accumulated Depreciation', 'Asset Received But Not Billed', 'Bank', 'Cash', 
    'Chargeable', 'Capital Work in Progress', 'Cost of Goods Sold', 'Depreciation', 
    'Equity', 'Expense Account', 'Expenses Included In Valuation', 'Fixed Asset', 
    'Income Account', 'Liability', 'Payable', 'Receivable', 'Round Off', 
    'Stock', 'Stock Adjustment', 'Stock Received But Not Billed', 'Tax', 'Temporary'
];

const ROOT_TYPES = ['', 'Asset', 'Liability', 'Equity', 'Income', 'Expense'];

const emptyForm = () => ({
    account_name: '',
    is_group: 0,
    company: 'Preeshe Consultancy Services', 
    account_currency: 'INR', 
    disabled: 0,
    parent_account: '',
    account_type: '',
    root_type: '',
    report_type: '',
});

const ChartOfAccounts = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [accounts, setAccounts] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [activeTab, setActiveTab] = useState('Details');
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [parentAccounts, setParentAccounts] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchAccounts();
        } else {
            setActiveTab('Details');
            fetchDropdownData();
            if (editingRecord) {
                fetchAccount(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchAccounts = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Account?fields=["name","account_name","parent_account","account_type","is_group","disabled","company","account_currency"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            setAccounts(response.data.data || []);
        } catch (err) {
            console.error('Error fetching accounts:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, currRes, parentRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Currency?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&filters=[["is_group","=",1]]&limit_page_length=None'),
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setCurrencies((currRes.data.data || []).map(c => c.name));
            setParentAccounts((parentRes.data.data || []).map(a => a.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchAccount = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Account/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                account_name: d.account_name || '',
                is_group: d.is_group ?? 0,
                company: d.company || '',
                account_currency: d.account_currency || '',
                disabled: d.disabled ?? 0,
                parent_account: d.parent_account || '',
                account_type: d.account_type || '',
                root_type: d.root_type || '',
                report_type: d.report_type || '',
            });
        } catch (err) {
            console.error('Error fetching account:', err);
            notification.error({ message: 'Error', description: 'Failed to load account data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.account_name) {
            notification.warning({ message: 'Account Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Account/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Account updated successfully.' });
            } else {
                await API.post('/api/resource/Account', payload);
                notification.success({ message: 'Account created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this account?')) return;
        try {
            await API.delete(`/api/resource/Account/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Account deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles (Matching Student.jsx) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider";

    if (view === 'list') {
        const filtered = accounts.filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.account_name || '').toLowerCase().includes(q)
            );
        });

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
                        <h1 className="text-2xl font-semibold text-gray-800">Chart of Accounts</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchAccounts} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Account
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Account Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {accounts.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID / Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Currency</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Company</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Fetching accounts...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-16 text-gray-500">No Accounts Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.account_name}
                                            </button>
                                            <div className="text-[11px] text-gray-400">{row.name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                !row.disabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {!row.disabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.account_type || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">{row.account_currency || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500 italic text-xs">{row.company || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Form View
    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading account data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Account'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                    {editingRecord && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            !form.disabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {!form.disabled ? 'Enabled' : 'Disabled'}
                        </span>
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

            <div className="flex gap-8 mb-8 border-b border-gray-100">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-all relative ${
                            activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                {activeTab === 'Details' && (
                    <div className="space-y-10">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg w-fit">
                                <input
                                    type="checkbox"
                                    id="disabled_chk"
                                    checked={!!form.disabled}
                                    onChange={e => updateField('disabled', e.target.checked ? 1 : 0)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <label htmlFor="disabled_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Disable</label>
                            </div>
                            <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg w-fit">
                                <input
                                    type="checkbox"
                                    id="is_group_chk"
                                    checked={!!form.is_group}
                                    onChange={e => updateField('is_group', e.target.checked ? 1 : 0)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <label htmlFor="is_group_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Group</label>
                            </div>
                        </div>

                        <div className="pt-4">
                            <h3 className={sectionTitleStyle}>Account Hierarchy</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <label className={labelStyle}>Account Name *</label>
                                    <input className={inputStyle} value={form.account_name} onChange={e => updateField('account_name', e.target.value)} placeholder="e.g. Sales" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Parent Account</label>
                                    <select className={inputStyle} value={form.parent_account} onChange={e => updateField('parent_account', e.target.value)}>
                                        <option value="">No Parent (Root)</option>
                                        {parentAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <h3 className={sectionTitleStyle}>Accounting Settings</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <label className={labelStyle}>Company *</label>
                                    <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                                        <option value="">Select Company...</option>
                                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Currency</label>
                                    <select className={inputStyle} value={form.account_currency} onChange={e => updateField('account_currency', e.target.value)}>
                                        <option value="">Select Currency...</option>
                                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Account Type</label>
                                    <select className={inputStyle} value={form.account_type} onChange={e => updateField('account_type', e.target.value)}>
                                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t || 'Select Type...'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Root Type</label>
                                    <select className={inputStyle} value={form.root_type} onChange={e => updateField('root_type', e.target.value)}>
                                        {ROOT_TYPES.map(r => <option key={r} value={r}>{r || 'Select Root Type...'}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartOfAccounts;
