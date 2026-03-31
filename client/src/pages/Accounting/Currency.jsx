import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    currency_name: '',
    enabled: 1,
    fraction: '',
    fraction_units: 100,
    smallest_currency_fraction_value: 0.01,
    symbol: '',
    symbol_on_right: 0,
    number_format: '#,###.##',
});

const Currency = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());
    const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchCurrencies();
        } else if (editingRecord) {
            fetchDetails(editingRecord);
        } else {
            setFormData(emptyForm());
        }
    }, [view, editingRecord]);

    const fetchCurrencies = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Currency?fields=["name","currency_name","enabled","symbol","fraction","fraction_units"]&limit_page_length=None&order_by=name asc');
            setCurrencies(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch currencies' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Currency/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.currency_name) {
            notification.warning({ message: 'Validation', description: 'Currency Name is required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Currency/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Currency updated successfully' });
            } else {
                await API.post('/api/resource/Currency', formData);
                notification.success({ message: 'Currency created successfully' });
            }
            setView('list');
            fetchCurrencies();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Currency/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchCurrencies();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const toggleRowSelection = (name) => {
        setSelectedRows(prev => 
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50/30 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm";
    const labelStyle = "block text-[13px] text-gray-700 mb-1 font-medium";
    const helpStyle = "text-[11px] text-gray-400 mt-1 mb-4 leading-tight";

    if (view === 'list') {
        const filtered = currencies.filter(c => {
            if (!search) return true;
            return (c.currency_name || '').toLowerCase().includes(search.toLowerCase()) || (c.name || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Currencies</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchCurrencies} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Currency
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search Currency Code or Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b flex justify-between items-center text-[13px] text-gray-500 font-medium">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" onChange={(e) => setSelectedRows(e.target.checked ? filtered.map(c => c.name) : [])} checked={selectedRows.length === filtered.length && filtered.length > 0} />
                            <span>ID</span>
                        </div>
                        <div className="flex items-center gap-12">
                            <span>Status</span>
                            <span>Enabled</span>
                            <span>Fraction</span>
                            <span>Fraction Units</span>
                            <div className="flex items-center gap-4 ml-8">
                                <span className="text-gray-400 font-normal">{filtered.length} of {currencies.length}</span>
                                <svg className="w-4 h-4 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="py-20 text-center text-gray-400 italic">Fetching from ERPNext...</div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 text-center text-gray-500 font-medium tracking-tight">No currencies found</div>
                        ) : (
                            filtered.map((c) => (
                                <div key={c.name} className="flex justify-between items-center px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300" checked={selectedRows.includes(c.name)} onChange={() => toggleRowSelection(c.name)} />
                                        <button onClick={() => { setEditingRecord(c.name); setView('form'); }} className="text-gray-900 font-bold hover:text-blue-600 transition-colors uppercase">
                                            {c.name}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-12 text-[12px] text-gray-500 font-medium">
                                        <div className="w-20">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                                                c.enabled ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                                            }`}>
                                                {c.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        
                                        <div className="w-16 flex justify-center">
                                            <input type="checkbox" checked={!!c.enabled} readOnly className="w-4 h-4 rounded border-gray-200 text-gray-400 pointer-events-none" />
                                        </div>

                                        <div className="w-24 text-gray-700">{c.fraction || '-'}</div>

                                        <div className="w-20 text-center font-mono">{c.fraction_units}</div>

                                        <div className="flex items-center gap-4 text-gray-300 font-normal ml-8 group-hover:text-gray-400">
                                            <span>1 y</span>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                <span>0</span>
                                            </div>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Currency'}
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

            {/* Conditional Banner */}
            {!formData.enabled && (
                <div className="bg-[#EBF5FF] border border-[#B2D7FF] text-[#1D4ED8] px-4 py-3 rounded-md mb-6 text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    This Currency is disabled. Enable to use in transactions
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6">
                <div>
                    <label className={labelStyle}>Currency Name *</label>
                    <input 
                        className={inputStyle} 
                        value={formData.currency_name} 
                        onChange={e => setFormData({ ...formData, currency_name: e.target.value })}
                        placeholder="e.g. US Dollar"
                    />
                </div>

                <div className="flex items-center gap-2 py-2">
                    <input 
                        type="checkbox" 
                        id="enabled" 
                        checked={!!formData.enabled} 
                        onChange={e => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Enabled</label>
                </div>

                <div>
                    <label className={labelStyle}>Fraction</label>
                    <input 
                        className={inputStyle} 
                        value={formData.fraction} 
                        onChange={e => setFormData({ ...formData, fraction: e.target.value })}
                        placeholder="e.g. Cent"
                    />
                    <p className={helpStyle}>Sub-currency. For e.g. "Cent"</p>
                </div>

                <div>
                    <label className={labelStyle}>Fraction Units</label>
                    <input 
                        type="number"
                        className={inputStyle} 
                        value={formData.fraction_units} 
                        onChange={e => setFormData({ ...formData, fraction_units: parseFloat(e.target.value) || 0 })}
                    />
                    <p className={helpStyle}>1 Currency = [?] Fraction For e.g. 1 USD = 100 Cent</p>
                </div>

                <div>
                    <label className={labelStyle}>Smallest Currency Fraction Value</label>
                    <input 
                        type="number"
                        className={inputStyle} 
                        value={formData.smallest_currency_fraction_value} 
                        onChange={e => setFormData({ ...formData, smallest_currency_fraction_value: parseFloat(e.target.value) || 0 })}
                        step="0.001"
                    />
                    <p className={helpStyle}>Smallest circulating fraction unit (coin). For e.g. 1 cent for USD and it should be entered as 0.01</p>
                </div>

                <div>
                    <label className={labelStyle}>Symbol</label>
                    <input 
                        className={inputStyle} 
                        value={formData.symbol} 
                        onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="e.g. $"
                    />
                    <p className={helpStyle}>A symbol for this currency. For e.g. $</p>
                </div>

                <div className="flex items-center gap-2 py-2">
                    <input 
                        type="checkbox" 
                        id="symbol_right" 
                        checked={!!formData.symbol_on_right} 
                        onChange={e => setFormData({ ...formData, symbol_on_right: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="symbol_right" className="text-sm font-medium text-gray-700">Show Currency Symbol on Right Side</label>
                </div>

                <div>
                    <label className={labelStyle}>Number Format</label>
                    <select 
                        className={inputStyle} 
                        value={formData.number_format} 
                        onChange={e => setFormData({ ...formData, number_format: e.target.value })}
                    >
                        <option value="#,###.##">#,###.##</option>
                        <option value="#.###,##">#.###,##</option>
                        <option value="#'###.##">#'###.##</option>
                        <option value="#, ###.##">#, ###.##</option>
                        <option value="#,###">#,###</option>
                        <option value="#.###">#.###</option>
                        <option value="#,##,###.##">#,##,###.##</option>
                    </select>
                    <p className={helpStyle}>How should this currency be formatted? If not set, will use system defaults</p>
                </div>
            </div>
        </div>
    );
};

export default Currency;
