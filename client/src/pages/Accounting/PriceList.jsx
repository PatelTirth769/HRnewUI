import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const PriceList = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    const init = {
        enabled: 1,
        price_list_name: '',
        currency: 'INR',
        buying: 0,
        selling: 0,
        price_not_uom_dependent: 0,
        countries: []
    };

    const [formData, setFormData] = useState(init);

    // Dropdowns
    const [currencies, setCurrencies] = useState([]);
    const [allCountries, setAllCountries] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchMasters();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(init);
            }
        }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Price List?fields=["name","price_list_name","currency","buying","selling","enabled"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch price lists' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [currRes, countryRes] = await Promise.all([
                API.get('/api/resource/Currency?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Country?fields=["name"]&limit_page_length=None')
            ]);
            setCurrencies(currRes.data.data || []);
            setAllCountries(countryRes.data.data || []);
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Price List/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.countries) data.countries = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.price_list_name || !formData.currency) {
            notification.warning({ message: 'Price List Name and Currency are required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Price List/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Price List updated' });
            } else {
                await API.post('/api/resource/Price List', formData);
                notification.success({ message: 'Price List created' });
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
            await API.delete(`/api/resource/Price List/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Price List deleted' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const addCountryRow = () => {
        setFormData({ ...formData, countries: [...formData.countries, { country: '' }] });
    };

    const removeCountryRow = (index) => {
        const updated = [...formData.countries];
        updated.splice(index, 1);
        setFormData({ ...formData, countries: updated });
    };

    const updateCountryRow = (index, field, value) => {
        const updated = [...formData.countries];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, countries: updated });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 transition shadow-sm";
    const labelStyle = "block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tight";
    const thStyle = "px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.price_list_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.currency || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6 max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Price Lists</h1>
                        <p className="text-xs text-gray-500 font-medium">Define rules and currencies for item pricing</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2 transition font-bold shadow-sm" onClick={fetchRecords} disabled={loading}>
                            ⟳ Refresh
                        </button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition font-bold shadow-lg shadow-gray-200" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Price List
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <input type="text" className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:border-blue-400 transition-all" placeholder="Search Price List or Currency..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f9fafb] border-b">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Buying</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Selling</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20"><Spin size="large" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-28 text-gray-400 italic">No Price Lists Found</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/80 transition-colors cursor-pointer group" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                        <td className="px-6 py-4 font-bold text-blue-600 underline-offset-4 group-hover:underline">{r.price_list_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{r.currency}</td>
                                        <td className="px-6 py-4">{r.buying ? <span className="text-green-600 font-black">✓</span> : <span className="text-gray-300">✗</span>}</td>
                                        <td className="px-6 py-4">{r.selling ? <span className="text-green-600 font-black">✓</span> : <span className="text-gray-300">✗</span>}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {r.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
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
        <div className="p-6 max-w-[1200px] mx-auto pb-24">
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button className="p-2 border border-gray-300 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition shadow-sm" onClick={() => setView('list')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">{editingRecord || 'New Price List'}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${editingRecord ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {editingRecord ? 'Saved' : 'Not Saved'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editingRecord && (
                        <Popconfirm title="Delete this price list?" onConfirm={handleDelete} okText="Yes" cancelText="No">
                            <button className="px-5 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-bold hover:bg-red-100 transition shadow-sm">Delete</button>
                        </Popconfirm>
                    )}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-black hover:bg-gray-800 transition shadow-xl disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        Save
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-2 gap-16">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50/50 rounded-lg border border-gray-100 w-fit pr-4">
                                    <input type="checkbox" checked={!!formData.enabled} onChange={e => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Enabled</span>
                                </label>
                            </div>

                            <div>
                                <label className={labelStyle}>Price List Name *</label>
                                <input className={inputStyle} value={formData.price_list_name} onChange={e => setFormData({ ...formData, price_list_name: e.target.value })} placeholder="e.g. Standard Selling" />
                            </div>

                            <div>
                                <label className={labelStyle}>Currency *</label>
                                <select className={inputStyle} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    {currencies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.buying} onChange={e => setFormData({ ...formData, buying: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                                    <span className="text-xs font-bold text-gray-700">Buying</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.selling} onChange={e => setFormData({ ...formData, selling: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                                    <span className="text-xs font-bold text-gray-700">Selling</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.price_not_uom_dependent} onChange={e => setFormData({ ...formData, price_not_uom_dependent: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" />
                                    <span className="text-xs font-bold text-gray-700">Price Not UOM Dependent</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className={labelStyle}>Applicable for Countries</label>
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition border border-blue-100 px-2 py-1 rounded bg-blue-50/50" onClick={addCountryRow}>+ Add Row</button>
                            </div>
                            <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th className={"w-8 px-2 py-2"}></th>
                                            <th className={thStyle}>Country *</th>
                                            <th className={"w-8 px-2 py-2"}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.countries.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="py-12 text-center text-gray-400 font-medium italic bg-gray-50/20">
                                                    <div className="flex flex-col items-center gap-2 opacity-60">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        No Countries Specified
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.countries.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-2 py-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <select className="w-full border border-gray-100 rounded py-1 px-2 focus:outline-none focus:border-blue-400 bg-transparent transition shadow-sm" value={row.country} onChange={e => updateCountryRow(idx, 'country', e.target.value)}>
                                                            <option value="">Select Country...</option>
                                                            {allCountries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button className="text-gray-300 hover:text-red-500 transition-colors font-bold text-sm" onClick={() => removeCountryRow(idx)}>✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceList;
