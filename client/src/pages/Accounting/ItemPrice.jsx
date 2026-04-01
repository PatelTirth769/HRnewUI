import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const ItemPrice = () => {
    const [view, setView] = useState('list');
    const [itemPrices, setItemPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    const [formData, setFormData] = useState({
        item_code: '',
        uom: '',
        packing_unit: 1,
        price_list: '',
        buying: 0,
        selling: 0,
        batch_no: '',
        currency: 'INR',
        price_list_rate: 0,
        valid_from: '',
        valid_upto: '',
        lead_time_days: 0,
        note: '',
        reference: ''
    });

    // Dropdown options
    const [items, setItems] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchItemPrices();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchItemPriceDetails(editingRecord);
            } else {
                setFormData({
                    item_code: '',
                    uom: '',
                    packing_unit: 1,
                    price_list: '',
                    buying: 0,
                    selling: 0,
                    batch_no: '',
                    currency: 'INR',
                    price_list_rate: 0,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_upto: '',
                    lead_time_days: 0,
                    note: '',
                    reference: ''
                });
            }
        }
    }, [view, editingRecord]);

    const fetchItemPrices = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Item Price?fields=["name","item_code","price_list","price_list_rate","currency","valid_from","valid_upto"]&limit_page_length=None&order_by=modified desc');
            setItemPrices(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch item prices' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [itemRes, uomRes, plRes, currRes, batchRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["name","item_name"]&limit_page_length=None'),
                API.get('/api/resource/UOM?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Price List?fields=["name","buying","selling","currency"]&limit_page_length=None'),
                API.get('/api/resource/Currency?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Batch?fields=["name"]&limit_page_length=None')
            ]);
            setItems(itemRes.data.data || []);
            setUoms(uomRes.data.data || []);
            setPriceLists(plRes.data.data || []);
            setCurrencies(currRes.data.data || []);
            setBatches(batchRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchItemPriceDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Item Price/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch item price details' });
        } finally {
            setLoading(false);
        }
    };

    const handlePriceListChange = (val) => {
        const pl = priceLists.find(x => x.name === val);
        if (pl) {
            setFormData({
                ...formData,
                price_list: val,
                buying: pl.buying || 0,
                selling: pl.selling || 0,
                currency: pl.currency || formData.currency
            });
        } else {
            setFormData({ ...formData, price_list: val });
        }
    };

    const handleSave = async () => {
        if (!formData.item_code || !formData.price_list || !formData.price_list_rate) {
            notification.warning({ message: 'Validation', description: 'Item Code, Price List and Rate are required' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Item Price/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Item Price updated successfully.' });
            } else {
                await API.post('/api/resource/Item Price', payload);
                notification.success({ message: 'Item Price created successfully.' });
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
            await API.delete(`/api/resource/Item Price/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Item Price deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 transition shadow-sm";
    const labelStyle = "block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tight";
    const sec = "text-[14px] font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2";

    if (view === 'list') {
        const filtered = itemPrices.filter(ip => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (ip.item_code || '').toLowerCase().includes(q) ||
                (ip.price_list || '').toLowerCase().includes(q) ||
                (ip.currency || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6 max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Item Prices</h1>
                        <p className="text-xs text-gray-500 font-medium">Manage item rates across different price lists</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2 transition font-bold shadow-sm" onClick={fetchItemPrices} disabled={loading}>
                            {loading ? <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : '⟳ Refresh'}
                        </button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition font-bold shadow-lg shadow-gray-200" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Item Price
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <input type="text" className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Item, Price List or Currency..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="ml-auto text-[11px] font-black text-gray-400 uppercase tracking-widest">{filtered.length} Results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f9fafb] border-b">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Item Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Price List</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-right">Rate</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Validity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20"><Spin size="large" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-28 text-gray-400 italic font-medium flex flex-col items-center gap-2"><svg className="w-12 h-12 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> No Item Prices Found</td></tr>
                            ) : (
                                filtered.map((ip) => (
                                    <tr key={ip.name} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-medium">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(ip.name); setView('form'); }}>
                                                {ip.item_code}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{ip.price_list}</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">{parseFloat(ip.price_list_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">{ip.currency}</span></td>
                                        <td className="px-6 py-4 text-[11px] text-gray-400 font-medium">
                                            {ip.valid_from && <div>From: {ip.valid_from}</div>}
                                            {ip.valid_upto && <div>Upto: {ip.valid_upto}</div>}
                                            {!ip.valid_from && !ip.valid_upto && '-'}
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
                    <button className="p-2 border border-gray-300 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition shadow-sm hover:shadow-md" onClick={() => setView('list')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            {editingRecord || 'New Item Price'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${editingRecord ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {editingRecord ? 'Saved' : 'Not Saved'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editingRecord && (
                        <Popconfirm title="Delete this item price?" onConfirm={handleDelete} okText="Yes" cancelText="No">
                            <button className="px-5 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-bold hover:bg-red-100 transition shadow-sm">Delete</button>
                        </Popconfirm>
                    )}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-black hover:bg-gray-800 transition shadow-xl shadow-gray-200 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
            ) : (
                <div className="space-y-6">
                    {/* Main Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Item Code *</label>
                                    <select className={inputStyle} value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })}>
                                        <option value="">Select Item...</option>
                                        {items.map(x => <option key={x.name} value={x.name}>{x.item_name} ({x.name})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>UOM *</label>
                                    <select className={inputStyle} value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })}>
                                        <option value="">Select UOM...</option>
                                        {uoms.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Packing Unit</label>
                                    <input type="number" className={inputStyle} value={formData.packing_unit} onChange={e => setFormData({ ...formData, packing_unit: e.target.value })} />
                                    <p className="text-[10px] text-gray-400 mt-1">Quantity that must be bought or sold per UOM</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className={sec}>Price List</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className={labelStyle}>Price List *</label>
                                            <select className={inputStyle} value={formData.price_list} onChange={e => handlePriceListChange(e.target.value)}>
                                                <option value="">Select Price List...</option>
                                                {priceLists.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <input type="checkbox" checked={!!formData.buying} onChange={e => setFormData({ ...formData, buying: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-xs font-bold text-gray-700">Buying</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <input type="checkbox" checked={!!formData.selling} onChange={e => setFormData({ ...formData, selling: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-xs font-bold text-gray-700">Selling</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Batch No</label>
                                    <select className={inputStyle} value={formData.batch_no} onChange={e => setFormData({ ...formData, batch_no: e.target.value })}>
                                        <option value="">Select Batch...</option>
                                        {batches.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rate and Currency */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                            <div>
                                <label className={labelStyle}>Currency *</label>
                                <select className={inputStyle} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    {currencies.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Rate *</label>
                                <input type="number" className={inputStyle + " font-black text-gray-900"} value={formData.price_list_rate} onChange={e => setFormData({ ...formData, price_list_rate: e.target.value })} step="0.01" />
                            </div>
                        </div>
                    </div>

                    {/* Validity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                            <div>
                                <label className={labelStyle}>Valid From</label>
                                <input type="date" className={inputStyle} value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Valid Upto</label>
                                <input type="date" className={inputStyle} value={formData.valid_upto} onChange={e => setFormData({ ...formData, valid_upto: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Lead Time in days</label>
                                <input type="number" className={inputStyle} value={formData.lead_time_days} onChange={e => setFormData({ ...formData, lead_time_days: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Additional */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Note</label>
                                <textarea rows="3" className={inputStyle} value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Add any special instructions or remarks..." />
                            </div>
                            <div>
                                <label className={labelStyle}>Reference</label>
                                <input className={inputStyle} value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} placeholder="Link to a specific document or contract..." />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ItemPrice;
