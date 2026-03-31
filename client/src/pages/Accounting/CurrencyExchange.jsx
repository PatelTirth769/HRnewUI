import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    date: new Date().toISOString().split('T')[0],
    from_currency: 'INR',
    to_currency: 'INR',
    exchange_rate: 0.0,
    for_buying: 1,
    for_selling: 1,
});

const CurrencyExchange = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [exchanges, setExchanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchExchanges();
        } else {
            fetchCurrencies();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchExchanges = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Currency Exchange?fields=["name","date","from_currency","to_currency","exchange_rate"]&limit_page_length=None&order_by=date desc');
            setExchanges(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch exchanges' });
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrencies = async () => {
        try {
            const res = await API.get('/api/resource/Currency?fields=["name"]&limit_page_length=None');
            setCurrencies(res.data.data || []);
        } catch (err) {
            console.error('Error fetching currencies:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Currency Exchange/${encodeURIComponent(name)}`);
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
                await API.put(`/api/resource/Currency Exchange/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Exchange Rate updated successfully' });
            } else {
                await API.post('/api/resource/Currency Exchange', formData);
                notification.success({ message: 'Exchange Rate created successfully' });
            }
            setView('list');
            fetchExchanges();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Currency Exchange/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchExchanges();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = exchanges.filter(e => {
            if (!search) return true;
            return (e.from_currency || '').toLowerCase().includes(search.toLowerCase()) || (e.to_currency || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Currency Exchanges</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchExchanges} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Exchange Rate
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search Currency..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Exchange (From ➔ To)</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Rate</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-500 italic font-medium tracking-tight">No exchange rates found</td></tr>
                            ) : (
                                filtered.map((e) => (
                                    <tr key={e.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-blue-600 hover:text-blue-800 cursor-pointer uppercase" onClick={() => { setEditingRecord(e.name); setView('form'); }}>
                                            {e.from_currency} ➔ {e.to_currency}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs font-bold text-gray-700">{parseFloat(e.exchange_rate).toFixed(9)}</td>
                                        <td className="px-5 py-4 text-xs text-gray-400">{e.date}</td>
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
                        {editingRecord ? editingRecord : 'New Currency Exchange'}
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-2 gap-x-12">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Date *</label>
                            <input 
                                type="date"
                                className={inputStyle} 
                                value={formData.date} 
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelStyle}>From Currency *</label>
                            <select 
                                className={inputStyle} 
                                value={formData.from_currency} 
                                onChange={e => setFormData({ ...formData, from_currency: e.target.value })}
                            >
                                {currencies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>To Currency *</label>
                            <select 
                                className={inputStyle} 
                                value={formData.to_currency} 
                                onChange={e => setFormData({ ...formData, to_currency: e.target.value })}
                            >
                                {currencies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Exchange Rate (1 {formData.from_currency} = [?] {formData.to_currency}) *</label>
                            <input 
                                type="number"
                                className={inputStyle} 
                                value={formData.exchange_rate} 
                                onChange={e => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 0 })}
                                step="0.000000001"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="buying" 
                                checked={!!formData.for_buying} 
                                onChange={e => setFormData({ ...formData, for_buying: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 rounded border-gray-900 border-2 checked:bg-gray-900 text-gray-900 focus:ring-0"
                            />
                            <label htmlFor="buying" className="text-sm font-bold text-gray-800">For Buying</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="selling" 
                                checked={!!formData.for_selling} 
                                onChange={e => setFormData({ ...formData, for_selling: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 rounded border-gray-900 border-2 checked:bg-gray-900 text-gray-900 focus:ring-0"
                            />
                            <label htmlFor="selling" className="text-sm font-bold text-gray-800">For Selling</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurrencyExchange;
