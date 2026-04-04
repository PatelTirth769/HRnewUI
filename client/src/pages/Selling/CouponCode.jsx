import React, { useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const CouponCode = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const [pricingRules, setPricingRules] = useState([]);
    const [customersList, setCustomersList] = useState([]);

    const initialFormState = {
        coupon_name: '',
        coupon_code: '',
        coupon_type: 'Promotional',
        pricing_rule: '',
        customer: '',
        valid_from: '',
        valid_upto: '',
        maximum_use: 0,
        used: 0,
        description: ''
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
            const res = await API.get('/api/resource/Coupon Code?fields=["name","coupon_name","coupon_code","coupon_type","used"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch coupon codes' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [prRes, custRes] = await Promise.all([
                API.get('/api/resource/Pricing Rule?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Customer?fields=["name","customer_name"]&limit_page_length=None')
            ]);
            setPricingRules(prRes.data.data || []);
            setCustomersList(custRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Coupon Code/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.coupon_name) {
            notification.warning({ message: 'Validation Error', description: 'Coupon Name is required.' });
            return;
        }
        if (!formData.coupon_code) {
            notification.warning({ message: 'Validation Error', description: 'Coupon Code is required.' });
            return;
        }
        if (!formData.pricing_rule) {
            notification.warning({ message: 'Validation Error', description: 'Pricing Rule is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Coupon Code/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Coupon Code updated successfully.' });
            } else {
                await API.post('/api/resource/Coupon Code', payload);
                notification.success({ message: 'Coupon Code created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this coupon code?')) return;
        try {
            await API.delete(`/api/resource/Coupon Code/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";

    if (view === 'list') {
        const filteredRecords = records.filter(r => 
            r.coupon_name.toLowerCase().includes(search.toLowerCase()) ||
            r.coupon_code.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Coupon Codes</h1>
                        <p className="text-sm text-gray-500">Manage your promotional and gift coupon codes</p>
                    </div>
                    <button 
                        onClick={() => { setEditingRecord(null); setView('form'); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                        Add Coupon Code
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
                                placeholder="Search coupons..." 
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
                                        <th className={thStyle}>Name</th>
                                        <th className={thStyle}>Code</th>
                                        <th className={thStyle}>Type</th>
                                        <th className={thStyle}>Used</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRecords.map(record => (
                                        <tr key={record.name} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => { setEditingRecord(record.name); setView('form'); }}>
                                            <td className={tdStyle}>
                                                <span className="font-semibold text-gray-700">{record.coupon_name}</span>
                                            </td>
                                            <td className={tdStyle}>
                                                <span className="text-blue-600 font-bold">{record.coupon_code}</span>
                                            </td>
                                            <td className={tdStyle}>
                                                <span className={`px-2 py-1 ${record.coupon_type === 'Promotional' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'} rounded text-[11px] font-bold uppercase tracking-wider underline-offset-4`}>{record.coupon_type}</span>
                                            </td>
                                            <td className={tdStyle}>{record.used} times</td>
                                            <td className="px-4 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-12 text-center text-gray-400 italic font-medium">No records found</td>
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
                            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded">Coupon Code</span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded">Not Saved</span>
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-800 tracking-tight leading-tight mt-1">{editingRecord ? formData.coupon_name : 'New Coupon Code'}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editingRecord && (
                        <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all">Delete</button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Spin size="small" className="mr-2" /> : null}
                        {editingRecord ? 'Update Coupon' : 'Save Coupon'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-10">
                <Spin spinning={loading}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-500/5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className={labelStyle}>Coupon Name <span className="text-red-500">*</span></label>
                                <input 
                                    className={inputStyle} 
                                    value={formData.coupon_name} 
                                    onChange={e => setFormData({ ...formData, coupon_name: e.target.value })} 
                                    placeholder='e.g. "Summer Holiday 2019 Offer 20"'
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelStyle}>Coupon Type <span className="text-red-500">*</span></label>
                                <select className={inputStyle} value={formData.coupon_type} onChange={e => setFormData({ ...formData, coupon_type: e.target.value })}>
                                    <option value="Promotional">Promotional</option>
                                    <option value="Gift Card">Gift Card</option>
                                </select>
                            </div>
                            {formData.coupon_type === 'Gift Card' && (
                                <div className="space-y-2 transition-all animate-in fade-in slide-in-from-left-4">
                                    <label className={labelStyle}>Customer <span className="text-red-500">*</span></label>
                                    <select className={inputStyle} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                                        <option value="">Select Customer</option>
                                        {customersList.map(c => <option key={c.name} value={c.name}>{c.customer_name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className={labelStyle}>Coupon Code <span className="text-red-500">*</span></label>
                                <input 
                                    className={inputStyle} 
                                    value={formData.coupon_code} 
                                    onChange={e => setFormData({ ...formData, coupon_code: e.target.value })} 
                                    placeholder="unique e.g. SAVE20"
                                />
                                <p className="text-[11px] text-gray-400">Wait, checking the image... It says "To be used to get discount"</p>
                            </div>
                            <div className="space-y-2">
                                <label className={labelStyle}>Pricing Rule <span className="text-red-500">*</span></label>
                                <select className={inputStyle} value={formData.pricing_rule} onChange={e => setFormData({ ...formData, pricing_rule: e.target.value })}>
                                    <option value="">Select Pricing Rule</option>
                                    {pricingRules.map(pr => <option key={pr.name} value={pr.name}>{pr.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">
                        <div className="space-y-8">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                                <h3 className={sectionTitleStyle}>
                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    Validity and Usage
                                </h3>
                                <div className="space-y-4 mt-6">
                                    <div className="space-y-2">
                                        <label className={labelStyle}>Valid From</label>
                                        <input type="date" className={inputStyle} value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelStyle}>Valid Upto</label>
                                        <input type="date" className={inputStyle} value={formData.valid_upto} onChange={e => setFormData({ ...formData, valid_upto: e.target.value })} />
                                    </div>
                                    {formData.coupon_type === 'Promotional' && (
                                        <div className="space-y-2 transition-all animate-in fade-in slide-in-from-top-4">
                                            <label className={labelStyle}>Maximum Use</label>
                                            <input type="number" className={inputStyle} value={formData.maximum_use} onChange={e => setFormData({ ...formData, maximum_use: e.target.value })} />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className={labelStyle}>Used</label>
                                        <input type="number" className={inputStyle} value={formData.used} disabled />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                            <h3 className={sectionTitleStyle}>
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                Coupon Description
                            </h3>
                            <div className="mt-6">
                                <textarea 
                                    className={`${inputStyle} h-[320px] resize-none border-dashed border-2`} 
                                    placeholder="Write details about this coupon..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default CouponCode;
