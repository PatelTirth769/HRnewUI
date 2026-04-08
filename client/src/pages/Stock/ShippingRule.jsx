import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const ShippingRule = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Dropdowns
    const [companies, setCompanies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [countriesList, setCountriesList] = useState([]);

    const initialFormState = {
        name: '', 
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
            fetchMasters();
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

    const fetchMasters = async () => {
        try {
            const [compRes, accRes, ccRes, countryRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Account?fields=["name"]&filters=[["account_type","=","Expense Account"]]'),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Country?fields=["name"]&limit_page_length=None')
            ]);
            setCompanies(compRes.data.data || []);
            setAccounts(accRes.data.data || []);
            setCostCenters(ccRes.data.data || []);
            setCountriesList(countryRes.data.data || []);

            if (!formData.company && compRes.data.data.length > 0) {
                setFormData(prev => ({ ...prev, company: compRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Shipping Rule/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.conditions) data.conditions = [];
            if (!data.countries) data.countries = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            notification.warning({ message: 'Validation Error', description: 'Shipping Rule Label is required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Shipping Rule/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Shipping Rule updated successfully.' });
            } else {
                await API.post('/api/resource/Shipping Rule', formData);
                notification.success({ message: 'Shipping Rule created successfully.' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Shipping Rule/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Shipping Rule deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Management
    const handleAddRow = (tableKey, emptyRow) => {
        setFormData({ ...formData, [tableKey]: [...(formData[tableKey] || []), emptyRow] });
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

    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b-xl border-gray-100">
            <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-400">No Data</span>
        </div>
    );

    const thStyle = "px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100";
    const tdStyle = "px-4 py-3 whitespace-nowrap text-sm border-t border-gray-50";
    const rowInputStyle = "w-full border-none bg-transparent py-1 text-sm focus:ring-0 transition-colors focus:bg-white px-1 rounded";

    const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:text-gray-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1.5 font-semibold";
    const sectionTitleStyle = "font-bold text-gray-900 text-[13px] uppercase tracking-widest mb-4 flex items-center gap-2 mt-8 pb-2 border-b border-gray-100";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.company || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Shipping Rules</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-100" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Shipping Rule
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Label or Company..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Label</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Type</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Company</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No Shipping Rules found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 font-medium">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider">{r.shipping_rule_type}</span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{r.company || '-'}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.disabled ? (
                                                <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">Disabled</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">Active</span>
                                            )}
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

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord || 'New Shipping Rule'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#FCE8E8] text-[#E02424] font-bold border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: [{ key: 'view', label: 'View Profile' }] }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300 rounded-md">
                            View <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Button className="h-8 text-[13px] border-gray-300 rounded-md">Duplicate</Button>

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    <button className="px-6 py-1.5 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this shipping rule?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="space-y-12 animate-fade-in">
                        {/* Basic Settings */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Shipping Rule Label *</label>
                                    <input className={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Next Day Delivery" disabled={!!editingRecord} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Shipping Rule Type *</label>
                                    <select className={inputStyle} value={formData.shipping_rule_type} onChange={e => setFormData({ ...formData, shipping_rule_type: e.target.value })}>
                                        <option value="Selling">Selling</option>
                                        <option value="Buying">Buying</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6">
                                <label className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition font-bold group w-fit">
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} />
                                    <div>
                                        <span className="text-[13px] text-gray-700">Disabled</span>
                                        <p className="text-[10px] text-gray-400 font-medium">Temporarily stop using this rule</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Accounting Section */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                Accounting
                            </h3>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Company *</label>
                                        <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                            <option value="">Select Company</option>
                                            {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Shipping Account *</label>
                                        <select className={inputStyle} value={formData.shipping_amount_account} onChange={e => setFormData({ ...formData, shipping_amount_account: e.target.value })}>
                                            <option value="">Select Account</option>
                                            {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Cost Center *</label>
                                        <select className={inputStyle} value={formData.cost_center} onChange={e => setFormData({ ...formData, cost_center: e.target.value })}>
                                            <option value="">Select Cost Center</option>
                                            {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conditions Section */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                Shipping Rule Conditions
                            </h3>
                            <div className="grid grid-cols-2 gap-12 mb-6">
                                <div>
                                    <label className={labelStyle}>Calculate Based On</label>
                                    <select className={inputStyle} value={formData.calculate_based_on} onChange={e => setFormData({ ...formData, calculate_based_on: e.target.value })}>
                                        <option value="Fixed">Fixed</option>
                                        <option value="Net Total">Net Total</option>
                                        <option value="Net Weight">Net Weight</option>
                                    </select>
                                </div>
                                {formData.calculate_based_on === 'Fixed' && (
                                    <div className="animate-fade-in">
                                        <label className={labelStyle}>Shipping Amount *</label>
                                        <input type="number" className={inputStyle} value={formData.shipping_amount} onChange={e => setFormData({ ...formData, shipping_amount: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            {formData.calculate_based_on !== 'Fixed' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Table Conditions</p>
                                        <Button size="small" className="text-[11px] font-bold" onClick={() => handleAddRow('conditions', { from_value: 0, to_value: 0, shipping_amount: 0 })}>+ Add Row</Button>
                                    </div>
                                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full">
                                            <thead className="bg-[#F9FAFB]">
                                                <tr>
                                                    <th className={thStyle + " w-12 text-center"}>No.</th>
                                                    <th className={thStyle}>From Value *</th>
                                                    <th className={thStyle}>To Value *</th>
                                                    <th className={thStyle}>Shipping Amount *</th>
                                                    <th className={thStyle + " w-12"}></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {formData.conditions.length === 0 ? null : formData.conditions.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                                        <td className="px-4 py-3 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                                        <td className={tdStyle}>
                                                            <input type="number" className={rowInputStyle} value={row.from_value} onChange={e => handleRowChange('conditions', i, 'from_value', e.target.value)} />
                                                        </td>
                                                        <td className={tdStyle}>
                                                            <input type="number" className={rowInputStyle} value={row.to_value} onChange={e => handleRowChange('conditions', i, 'to_value', e.target.value)} />
                                                        </td>
                                                        <td className={tdStyle}>
                                                            <input type="number" className={rowInputStyle + " font-bold text-blue-600"} value={row.shipping_amount} onChange={e => handleRowChange('conditions', i, 'shipping_amount', e.target.value)} />
                                                        </td>
                                                        <td className={tdStyle}><button onClick={() => handleRemoveRow('conditions', i)} className="text-gray-300 hover:text-red-500 transition-colors p-1">✕</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {formData.conditions.length === 0 && renderEmptyTable()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Country Section */}
                        <div className="space-y-6">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Restrict to Countries
                            </h3>
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Regional restrictions</p>
                                    <Button size="small" className="text-[11px] font-bold" onClick={() => handleAddRow('countries', { country: '' })}>+ Add Country</Button>
                                </div>
                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead className="bg-[#F9FAFB]">
                                            <tr>
                                                <th className={thStyle + " w-12 text-center"}>No.</th>
                                                <th className={thStyle}>Country *</th>
                                                <th className={thStyle + " w-12"}></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {formData.countries.length === 0 ? null : formData.countries.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-4 py-3 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                                    <td className={tdStyle}>
                                                        <select className={rowInputStyle + " font-semibold text-gray-700"} value={row.country} onChange={e => handleRowChange('countries', i, 'country', e.target.value)}>
                                                            <option value="">Select Country</option>
                                                            {countriesList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className={tdStyle}><button onClick={() => handleRemoveRow('countries', i)} className="text-gray-300 hover:text-red-500 transition-colors p-1">✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {formData.countries.length === 0 && renderEmptyTable()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ShippingRule;
