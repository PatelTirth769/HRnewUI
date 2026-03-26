import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1, placeholder = "" }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, options, required = false, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
        >
            <option value=""></option>
            {options.map((opt, i) => (
                <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

const CheckboxField = ({ label, subLabel, checked, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 font-medium">
            <input
                type="checkbox"
                className="rounded border-gray-300 text-gray-800 focus:ring-gray-800 w-4 h-4 bg-[#fcfcfc]"
                checked={checked || false}
                onChange={(e) => onChange && onChange(e.target.checked)}
                disabled={disabled}
            />
            {label}
        </label>
        {subLabel && <p className="text-[12px] text-gray-400 ml-6 mt-1">{subLabel}</p>}
    </div>
);

const AssetCategory = () => {
    const [view, setView] = useState('list');
    const [categories, setCategories] = useState([]);
    
    // Master data
    const [companies, setCompanies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [financeBooksOpt, setFinanceBooksOpt] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        asset_category_name: '',
        enable_cwip_accounting: 0,
        finance_books: [],
        accounts: []
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
        } else {
            fetchMasters();
        }
    }, [view]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Category?fields=["name","asset_category_name"]&limit_page_length=None');
            setCategories(res.data.data || []);
        } catch (err) {
            console.error('Error fetching categories', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [cRes, aRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Account?fields=["name","company"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setCompanies((cRes.data.data || []).map(d => d.name));
            setAccounts(aRes.data.data || []);
            // Finance Books doesn't have a rigid doctype frequently accessible without finance module, we'll allow textual input or we'd fetch Finance Book if available
            try {
                const fbRes = await API.get('/api/resource/Finance Book?fields=["name"]&limit_page_length=None');
                setFinanceBooksOpt((fbRes.data.data || []).map(d => d.name));
            } catch (e) {
                setFinanceBooksOpt([]);
            }
        } catch (err) {
            console.error('Error fetching master data', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            asset_category_name: '',
            enable_cwip_accounting: 0,
            finance_books: [],
            accounts: []
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Category/${encodeURIComponent(id)}`);
            setFormData({
                ...res.data.data,
                finance_books: res.data.data.finance_books || [],
                accounts: res.data.data.accounts || [],
            });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            console.error('Error fetching Asset Category', err);
            notification.error({ message: 'Failed to fetch Asset Category data' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
        try {
            setLoading(true);
            await API.delete(`/api/resource/Asset Category/${encodeURIComponent(id)}`);
            notification.success({ message: 'Category deleted successfully!' });
            fetchCategories();
        } catch (err) {
            console.error('Error deleting Asset Category', err);
            notification.error({ message: 'Failed to delete Asset Category' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.asset_category_name) {
            notification.warning({ message: 'Asset Category Name is required' });
            return;
        }
        
        try {
            setSaving(true);
            const payload = { ...formData };
            if (isEditing) {
                await API.put(`/api/resource/Asset Category/${encodeURIComponent(editId)}`, payload);
                notification.success({ message: 'Asset Category updated successfully!' });
            } else {
                await API.post('/api/resource/Asset Category', payload);
                notification.success({ message: 'Asset Category created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Error saving category', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* */ }
            }
            notification.error({ message: 'Failed to save', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally {
            setSaving(false);
        }
    };

    // Subtable Handlers
    const addFinanceBookRow = () => {
        setFormData({
            ...formData,
            finance_books: [
                ...formData.finance_books,
                {
                    finance_book: '',
                    depreciation_method: '',
                    total_number_of_depreciations: 0,
                    frequency_of_depreciation_months: 0,
                    depreciation_posting_date: ''
                }
            ]
        });
    };

    const handleFinanceBookChange = (index, field, value) => {
        const updatedBooks = [...formData.finance_books];
        updatedBooks[index][field] = value;
        setFormData({ ...formData, finance_books: updatedBooks });
    };

    const removeFinanceBookRow = (index) => {
        const updatedBooks = formData.finance_books.filter((_, i) => i !== index);
        setFormData({ ...formData, finance_books: updatedBooks });
    };

    const addAccountRow = () => {
        setFormData({
            ...formData,
            accounts: [
                ...formData.accounts,
                {
                    company: companies.length === 1 ? companies[0] : '',
                    fixed_asset_account: '',
                    accumulated_depreciation_account: '',
                    depreciation_expense_account: '',
                    capital_work_in_progress_account: ''
                }
            ]
        });
    };

    const handleAccountChange = (index, field, value) => {
        const updatedAccounts = [...formData.accounts];
        updatedAccounts[index][field] = value;
        // clear associated accounts if company changes
        if (field === 'company') {
            updatedAccounts[index].fixed_asset_account = '';
            updatedAccounts[index].accumulated_depreciation_account = '';
            updatedAccounts[index].depreciation_expense_account = '';
            updatedAccounts[index].capital_work_in_progress_account = '';
        }
        setFormData({ ...formData, accounts: updatedAccounts });
    };

    const removeAccountRow = (index) => {
        const updatedAccounts = formData.accounts.filter((_, i) => i !== index);
        setFormData({ ...formData, accounts: updatedAccounts });
    };


    if (view === 'form') {
        const isSubmitted = false; // Add readOnly later if needed
        return (
            <div className="p-6 max-w-6xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={saving}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit Category: ${editId}` : 'New Asset Category'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold align-middle ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <div>
                        <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        {/* Section 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <InputField label="Asset Category Name" required value={formData.asset_category_name} onChange={(v) => setFormData({ ...formData, asset_category_name: v })} disabled={saving || isEditing} />
                        </div>

                        {/* Depreciation Options */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Depreciation Options</h3>
                        <div className="mb-8">
                            <CheckboxField label="Enable Capital Work in Progress Accounting" checked={formData.enable_cwip_accounting === 1} onChange={(v) => setFormData({ ...formData, enable_cwip_accounting: v ? 1 : 0 })} disabled={saving} />
                        </div>

                        {/* Finance Book Details */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Finance Book Detail</h3>
                        <div className="mb-10 text-sm">
                            <div className="text-gray-500 font-medium mb-2 text-xs">Finance Books</div>
                            <div className="border border-gray-200 rounded-md overflow-x-auto">
                                <table className="w-full text-left bg-white whitespace-nowrap">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[12px] uppercase">
                                        <tr>
                                            <th className="px-3 py-2 font-medium w-6"><input type="checkbox" className="rounded border-gray-300 disabled:opacity-50" disabled /></th>
                                            <th className="px-3 py-2 font-medium w-12 text-center">No.</th>
                                            <th className="px-3 py-2 font-medium">Finance Book</th>
                                            <th className="px-3 py-2 font-medium">Depreciation Method *</th>
                                            <th className="px-3 py-2 font-medium">Total Number of Depreciations</th>
                                            <th className="px-3 py-2 font-medium">Frequency of Depreciation (Months)</th>
                                            <th className="px-3 py-2 font-medium">Depreciation Posting Date</th>
                                            <th className="px-3 py-2 font-medium w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[13px]">
                                        {formData.finance_books.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-8 text-gray-400">
                                                    <svg className="w-8 h-8 mx-auto stroke-current mb-2 opacity-30" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    No Data
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.finance_books.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="p-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="p-2 text-center text-gray-500 font-medium">{index + 1}</td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200" value={row.finance_book} onChange={(e) => handleFinanceBookChange(index, 'finance_book', e.target.value)} disabled={saving}>
                                                            <option value="">Select</option>
                                                            {financeBooksOpt.map(fb => <option key={fb} value={fb}>{fb}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200 bg-white" required value={row.depreciation_method} onChange={(e) => handleFinanceBookChange(index, 'depreciation_method', e.target.value)} disabled={saving}>
                                                            <option value="">Select</option>
                                                            <option value="Straight Line">Straight Line</option>
                                                            <option value="Double Declining Balance">Double Declining Balance</option>
                                                            <option value="Written Down Value">Written Down Value</option>
                                                            <option value="Manual">Manual</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2"><input type="number" className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200" value={row.total_number_of_depreciations || ''} onChange={(e) => handleFinanceBookChange(index, 'total_number_of_depreciations', Number(e.target.value))} disabled={saving} /></td>
                                                    <td className="p-2"><input type="number" className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200" value={row.frequency_of_depreciation_months || ''} onChange={(e) => handleFinanceBookChange(index, 'frequency_of_depreciation_months', Number(e.target.value))} disabled={saving} /></td>
                                                    <td className="p-2"><input type="date" className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200" value={row.depreciation_posting_date || ''} onChange={(e) => handleFinanceBookChange(index, 'depreciation_posting_date', e.target.value)} disabled={saving} /></td>
                                                    <td className="p-2 text-center">
                                                        <button type="button" onClick={() => removeFinanceBookRow(index)} className="text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-white p-2 border-t border-gray-100 rounded-b-md">
                                    <button type="button" onClick={addFinanceBookRow} className="px-3 py-1 text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Accounts Details */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Accounts</h3>
                        <div className="mb-2 text-sm">
                            <div className="text-gray-500 font-medium mb-2 text-xs">Accounts</div>
                            <div className="border border-gray-200 rounded-md overflow-x-auto">
                                <table className="w-full text-left bg-white whitespace-nowrap">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[12px] uppercase">
                                        <tr>
                                            <th className="px-3 py-2 font-medium w-6"><input type="checkbox" className="rounded border-gray-300 disabled:opacity-50" disabled /></th>
                                            <th className="px-3 py-2 font-medium w-12 text-center">No.</th>
                                            <th className="px-3 py-2 font-medium">Company *</th>
                                            <th className="px-3 py-2 font-medium">Fixed Asset Account *</th>
                                            <th className="px-3 py-2 font-medium">Accumulated Depreciation Account</th>
                                            <th className="px-3 py-2 font-medium">Depreciation Expense Account</th>
                                            <th className="px-3 py-2 font-medium">Capital Work In Progress Account</th>
                                            <th className="px-3 py-2 font-medium w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[13px]">
                                        {formData.accounts.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-8 text-gray-400">
                                                    <svg className="w-8 h-8 mx-auto stroke-current mb-2 opacity-30" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    No Data
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.accounts.map((row, index) => {
                                                const companyAccounts = accounts.filter(a => a.company === row.company);
                                                return (
                                                <tr key={index}>
                                                    <td className="p-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="p-2 text-center text-gray-500 font-medium">{index + 1}</td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200" required value={row.company} onChange={(e) => handleAccountChange(index, 'company', e.target.value)} disabled={saving}>
                                                            <option value="">Select Company</option>
                                                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200 max-w-[200px]" required value={row.fixed_asset_account} onChange={(e) => handleAccountChange(index, 'fixed_asset_account', e.target.value)} disabled={saving || !row.company}>
                                                            <option value=""></option>
                                                            {companyAccounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200 max-w-[200px]" value={row.accumulated_depreciation_account} onChange={(e) => handleAccountChange(index, 'accumulated_depreciation_account', e.target.value)} disabled={saving || !row.company}>
                                                            <option value=""></option>
                                                            {companyAccounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200 max-w-[200px]" value={row.depreciation_expense_account} onChange={(e) => handleAccountChange(index, 'depreciation_expense_account', e.target.value)} disabled={saving || !row.company}>
                                                            <option value=""></option>
                                                            {companyAccounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 focus:border-blue-400 outline-none hover:border-gray-200 max-w-[200px]" value={row.capital_work_in_progress_account} onChange={(e) => handleAccountChange(index, 'capital_work_in_progress_account', e.target.value)} disabled={saving || !row.company}>
                                                            <option value=""></option>
                                                            {companyAccounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button type="button" onClick={() => removeAccountRow(index)} className="text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            )})
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-white p-2 border-t border-gray-100 rounded-b-md">
                                    <button type="button" onClick={addAccountRow} className="px-3 py-1 text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Asset Categories</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchCategories}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Category
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Asset Category Name</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="2" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Asset Categories Found</p>
                                    </td>
                                </tr>
                            ) : (
                                categories.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.asset_category_name || row.name}</td>
                                        <td className="px-4 py-2.5 text-center flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => handleEdit(row.name)}><FiEdit2 /></button>
                                            <button className="text-red-500 hover:text-red-700 transition-colors" onClick={() => handleDelete(row.name)}><FiTrash2 /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssetCategory;
