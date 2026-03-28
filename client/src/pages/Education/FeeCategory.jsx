import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    name: '',
    description: '',
    accounts: [], // { company: '', income_account: '', cost_center: '' }
});

const FeeCategory = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [categories, setCategories] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        companies: [],
        accounts: [],
        costCenters: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchCategory(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const [coRes, aRes, ccRes] = await Promise.all([
                API.get('/api/resource/Company?limit_page_length=None'),
                API.get('/api/resource/Account?limit_page_length=None'),
                API.get('/api/resource/Cost Center?limit_page_length=None'),
            ]);
            setDropdowns({
                companies: coRes.data.data?.map(d => d.name) || [],
                accounts: aRes.data.data?.map(d => d.name) || [],
                costCenters: ccRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fee Category?fields=["name","description"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setCategories(response.data.data || []);
        } catch (err) {
            console.error('Error fetching fee categories:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchCategory = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Fee Category/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                name: d.name || '',
                description: d.description || '',
                accounts: (d.accounts || []).map(a => ({
                    company: a.company || '',
                    income_account: a.income_account || '',
                    cost_center: a.cost_center || '',
                    name: a.name, // ERPNext internal row name
                })),
            });
        } catch (err) {
            console.error('Error fetching category:', err);
            notification.error({ message: 'Error', description: 'Failed to load fee category data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Child Table Functions ---
    const addAccountRow = () => {
        setForm(prev => ({
            ...prev,
            accounts: [...prev.accounts, { company: '', income_account: '', cost_center: '' }]
        }));
    };

    const removeAccountRow = (index) => {
        const newAccounts = [...form.accounts];
        newAccounts.splice(index, 1);
        setForm(prev => ({ ...prev, accounts: newAccounts }));
    };

    const updateAccountRow = (index, field, value) => {
        const newAccounts = [...form.accounts];
        newAccounts[index][field] = value;
        setForm(prev => ({ ...prev, accounts: newAccounts }));
    };

    const handleSave = async () => {
        if (!form.name) {
            notification.warning({ message: 'Fee Category Name is required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                // If the name changed, ERPNext might handle it as a rename or error? 
                // Usually it's better to keep payload clean
                await API.put(`/api/resource/Fee Category/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Fee Category updated successfully.' });
            } else {
                await API.post('/api/resource/Fee Category', form);
                notification.success({ message: 'Fee Category created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this fee category?')) return;
        try {
            await API.delete(`/api/resource/Fee Category/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Fee Category deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = categories.filter(c => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Fee Category</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchCategories} disabled={loadingList}>
                            ⟳ Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Category
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Name or Description..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="2" className="text-center py-10 text-gray-400 italic font-medium">No Categories found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 line-clamp-1">{row.description || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20 font-medium">Loading category data...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Fee Category'}</span>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-100 text-red-600 font-medium">Not Saved</span>}
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50" onClick={() => setView('list')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100" onClick={handleDelete}>Delete</button>}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className={labelStyle}>Name *</label>
                        <input type="text" className={inputStyle} value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Tuition Fees" />
                    </div>
                    <div>
                        <label className={labelStyle}>Description</label>
                        <textarea className={`${inputStyle} h-32`} value={form.description} onChange={e => updateField('description', e.target.value)} />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider text-[12px]">Accounting Defaults</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-3 py-2 text-left w-12 font-normal text-gray-400">No.</th>
                                    <th className="px-3 py-2 text-left">Company *</th>
                                    <th className="px-3 py-2 text-left">Default Income Account</th>
                                    <th className="px-3 py-2 text-left">Default Cost Center</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-700">
                                {form.accounts.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-6 text-gray-400 italic font-medium">No Accounting Defaults</td></tr>
                                ) : (
                                    form.accounts.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-300" value={row.company} onChange={e => updateAccountRow(idx, 'company', e.target.value)}>
                                                    <option value="">Select Company</option>
                                                    {dropdowns.companies.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-300" value={row.income_account} onChange={e => updateAccountRow(idx, 'income_account', e.target.value)}>
                                                    <option value="">Select Income Account</option>
                                                    {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-300" value={row.cost_center} onChange={e => updateAccountRow(idx, 'cost_center', e.target.value)}>
                                                    <option value="">Select Cost Center</option>
                                                    {dropdowns.costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeAccountRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold p-1">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 shadow-sm transition" onClick={addAccountRow}>+ Add Row</button>
                </div>
            </div>
        </div>
    );
};

export default FeeCategory;
