import React, { useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const ShippingRule = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const [companies, setCompanies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [countriesList, setCountriesList] = useState([]);

    const initialFormState = {
        name: '', // Label
        shipping_rule_type: 'Selling',
        disabled: 0,
        company: '',
        shipping_amount_account: '',
        cost_center: '',
        calculate_based_on: 'Fixed',
        shipping_amount: 0,
        conditions: [],
        countries: []
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Shipping Rule?fields=["name","shipping_rule_type","disabled","company"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch shipping rules' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, accRes, ccRes, countryRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&filters=[["account_type","=","Expense Account"]]'),
                API.get('/api/resource/Cost Center?fields=["name"]'),
                API.get('/api/resource/Country?fields=["name"]')
            ]);
            setCompanies(compRes.data.data || []);
            setAccounts(accRes.data.data || []);
            setCostCenters(ccRes.data.data || []);
            setCountriesList(countryRes.data.data || []);

            if (!formData.company && compRes.data.data.length > 0) {
                setFormData(prev => ({ ...prev, company: compRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Shipping Rule/${encodeURIComponent(name)}`);
            const data = res.data.data;
            setFormData({
                ...data,
                countries: data.countries || []
            });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name && !editingRecord) {
            notification.warning({ message: 'Validation Error', description: 'Shipping Rule Label is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Shipping Rule/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Shipping Rule updated successfully.' });
            } else {
                // If creating, 'name' field in payload serves as the primary key if enabled in doctype, 
                // but usually 'shipping_rule_label' or similar. Following the image, we'll use name.
                await API.post('/api/resource/Shipping Rule', payload);
                notification.success({ message: 'Shipping Rule created successfully.' });
            }
            setView('list');
        } catch (err) {
            const errorMessage = err.response?.data?._server_messages 
                                 ? JSON.parse(err.response.data._server_messages)[0]
                                 : err.message;
            notification.error({ message: 'Save Failed', description: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this shipping rule?')) return;
        try {
            await API.delete(`/api/resource/Shipping Rule/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const handleAddRow = (tableKey) => {
        const emptyRow = tableKey === 'countries' ? { country: '' } : { from_value: 0, to_value: 0, shipping_amount: 0 };
        setFormData(prev => ({ ...prev, [tableKey]: [...(prev[tableKey] || []), emptyRow] }));
    };

    const handleRemoveRow = (tableKey, index) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, [tableKey]: newArr });
    };

    const handleRowChange = (tableKey, index, field, value) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr[index] = { ...newArr[index], [field]: value };
        setFormData({ ...formData, [tableKey]: newArr });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const rowInputStyle = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    if (view === 'list') {
        const filteredRecords = records.filter(r => 
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.company.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Shipping Rule</h1>
                        <p className="text-sm text-gray-500">Manage your shipping rules and restrictions</p>
                    </div>
                    <button 
                        onClick={() => { setEditingRecord(null); setView('form'); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        Add Shipping Rule
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                        <div className="relative max-w-sm">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Search shipping rules..." 
                                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <Spin spinning={loading}>
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className={thStyle}>Label</th>
                                        <th className={thStyle}>Type</th>
                                        <th className={thStyle}>Company</th>
                                        <th className={thStyle}>Status</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRecords.map(record => (
                                        <tr key={record.name} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => { setEditingRecord(record.name); setView('form'); }}>
                                            <td className={tdStyle}>
                                                <span className="font-semibold text-gray-700">{record.name}</span>
                                            </td>
                                            <td className={tdStyle}>
                                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold uppercase">{record.shipping_rule_type}</span>
                                            </td>
                                            <td className={tdStyle}>{record.company}</td>
                                            <td className={tdStyle}>
                                                <span className={`flex items-center gap-1.5 ${record.disabled ? 'text-red-500' : 'text-emerald-500'} font-medium`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${record.disabled ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                                    {record.disabled ? 'Disabled' : 'Enabled'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-12 text-center text-gray-400 italic">No records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Spin>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Sticky Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Shipping Rule</span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Not Saved</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">{editingRecord ? formData.name : 'New Shipping Rule'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editingRecord && (
                        <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all">Delete</button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Spin size="small" className="mr-2" /> : null}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8">
                <Spin spinning={loading}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="space-y-2">
                            <label className={labelStyle}>Shipping Rule Label <span className="text-red-500">*</span></label>
                            <input 
                                className={inputStyle} 
                                value={formData.name} 
                                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                placeholder="example: Next Day Shipping"
                                disabled={!!editingRecord}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelStyle}>Shipping Rule Type <span className="text-red-500">*</span></label>
                            <select className={inputStyle} value={formData.shipping_rule_type} onChange={e => setFormData({ ...formData, shipping_rule_type: e.target.value })}>
                                <option value="Selling">Selling</option>
                                <option value="Buying">Buying</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input 
                                type="checkbox" 
                                id="disabled_chk" 
                                checked={!!formData.disabled} 
                                onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} 
                                className="w-4 h-4 text-blue-600 rounded" 
                            />
                            <label htmlFor="disabled_chk" className="text-sm font-semibold text-gray-700">Disabled</label>
                        </div>
                    </div>

                    {/* Accounting Section - Dynamic Visibility */}
                    {formData.disabled === 0 && (
                        <div className="mt-8 transition-all animate-in fade-in slide-in-from-top-4">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"/></svg>
                                Accounting
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
                                <div className="space-y-2">
                                    <label className={labelStyle}>Company <span className="text-red-500">*</span></label>
                                    <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                        <option value="">Select Company</option>
                                        {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelStyle}>Shipping Account <span className="text-red-500">*</span></label>
                                    <select className={inputStyle} value={formData.shipping_amount_account} onChange={e => setFormData({ ...formData, shipping_amount_account: e.target.value })}>
                                        <option value="">Select Account</option>
                                        {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <h3 className={sectionTitleStyle}>
                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                            Accounting Dimensions
                        </h3>
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className={labelStyle}>Cost Center <span className="text-red-500">*</span></label>
                                    <select className={inputStyle} value={formData.cost_center} onChange={e => setFormData({ ...formData, cost_center: e.target.value })}>
                                        <option value="">Select Cost Center</option>
                                        {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
                            <div className="space-y-2">
                                <label className={labelStyle}>Calculate Based On</label>
                                <select className={inputStyle} value={formData.calculate_based_on} onChange={e => setFormData({ ...formData, calculate_based_on: e.target.value })}>
                                    <option value="Fixed">Fixed</option>
                                    <option value="Net Total">Net Total</option>
                                    <option value="Net Weight">Net Weight</option>
                                </select>
                            </div>
                            {formData.calculate_based_on === 'Fixed' && (
                                <div className="space-y-2 transition-all animate-in fade-in slide-in-from-right-4">
                                    <label className={labelStyle}>Shipping Amount <span className="text-red-500">*</span></label>
                                    <input 
                                        type="number"
                                        className={inputStyle} 
                                        value={formData.shipping_amount} 
                                        onChange={e => setFormData({ ...formData, shipping_amount: e.target.value })} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {formData.calculate_based_on !== 'Fixed' && (
                        <div className="mt-8 transition-all animate-in fade-in slide-in-from-top-4">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                Shipping Rule Conditions
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                                                <th className="w-16 px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">No.</th>
                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">From Value <span className="text-red-500">*</span></th>
                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">To Value <span className="text-red-500">*</span></th>
                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Shipping Amount <span className="text-red-500">*</span></th>
                                                <th className="w-10 px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {formData.conditions.map((row, index) => (
                                                <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-2"><input type="checkbox" className="rounded" /></td>
                                                    <td className="px-4 py-2 text-sm text-gray-400 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" className={rowInputStyle} value={row.from_value} onChange={e => handleRowChange('conditions', index, 'from_value', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" className={rowInputStyle} value={row.to_value} onChange={e => handleRowChange('conditions', index, 'to_value', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" className={rowInputStyle} value={row.shipping_amount} onChange={e => handleRowChange('conditions', index, 'shipping_amount', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button onClick={() => handleRemoveRow('conditions', index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.conditions.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-8 text-center bg-gray-50/30 font-medium text-gray-400">No Conditions Defined</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                                    <button onClick={() => handleAddRow('conditions')} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100/50 rounded-lg transition-all flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                        Add Condition
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <h3 className={sectionTitleStyle}>
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Restrict to Countries
                        </h3>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                                            <th className="w-16 px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase">No.</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Country <span className="text-red-500">*</span></th>
                                            <th className="w-10 px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                            {formData.countries.map((row, index) => (
                                                <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-2"><input type="checkbox" className="rounded" /></td>
                                                    <td className="px-4 py-2 text-sm text-gray-400 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <select className={rowInputStyle} value={row.country} onChange={e => handleRowChange('countries', index, 'country', e.target.value)}>
                                                            <option value="">Select Country</option>
                                                            {countriesList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button onClick={() => handleRemoveRow('countries', index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {formData.countries.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center bg-gray-50/30">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 shadow-sm">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-400">No Restricted Countries</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
                                <button onClick={() => handleAddRow('countries')} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100/50 rounded-lg transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                    Add Row
                                </button>
                                <span className="text-xs text-gray-400 font-medium">{formData.countries.length} Country{formData.countries.length !== 1 ? 'ies' : ''} added</span>
                            </div>
                        </div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default ShippingRule;
