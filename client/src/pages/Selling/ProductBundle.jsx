import React, { useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const ProductBundle = () => {
    const [view, setView] = useState('list');
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const [itemsList, setItemsList] = useState([]);

    const initialFormState = {
        new_item_code: '',
        disabled: 0,
        description: '',
        items: []
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchBundles();
        } else {
            fetchItemsList();
            if (editingRecord) {
                fetchBundleDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchBundles = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Product Bundle?fields=["name","new_item_code","description","disabled"]&limit_page_length=None&order_by=modified desc');
            setBundles(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch product bundles' });
        } finally {
            setLoading(false);
        }
    };

    const fetchItemsList = async () => {
        try {
            const res = await API.get('/api/resource/Item?fields=["name","item_code","item_name","stock_uom","description"]&limit_page_length=None');
            setItemsList(res.data.data || []);
        } catch (err) {
            console.error('Error fetching items:', err);
        }
    };

    const fetchBundleDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Product Bundle/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.items) data.items = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch bundle details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.new_item_code) {
            notification.warning({ message: 'Validation Error', description: 'Parent Item is required.' });
            return;
        }
        if (formData.items.length === 0) {
            notification.warning({ message: 'Validation Error', description: 'At least one item is required in the bundle.' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Product Bundle/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Product Bundle updated successfully.' });
            } else {
                await API.post('/api/resource/Product Bundle', payload);
                notification.success({ message: 'Product Bundle created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this product bundle?')) return;
        try {
            await API.delete(`/api/resource/Product Bundle/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Product Bundle deleted.' });
            setView('list');
        } catch (err) {
            const errorMessage = err.response?.data?._server_messages 
                                 ? JSON.parse(err.response.data._server_messages)[0]
                                 : err.message;
            notification.error({ message: 'Delete Failed', description: errorMessage });
        }
    };

    const handleAddRow = () => {
        setFormData(prev => ({ 
            ...prev, 
            items: [...prev.items, { item_code: '', qty: 0, description: '', uom: '' }] 
        }));
    };

    const handleRemoveRow = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleRowChange = (index, field, value) => {
        const newItems = [...formData.items];
        if (field === 'item_code') {
            const selectedItem = itemsList.find(i => i.item_code === value);
            newItems[index] = { 
                ...newItems[index], 
                [field]: value,
                uom: selectedItem ? selectedItem.stock_uom : '',
                description: selectedItem ? selectedItem.description : ''
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setFormData({ ...formData, items: newItems });
    };

    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const rowInputStyle = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";
    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";

    if (view === 'list') {
        const filtered = bundles.filter(b => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (b.name || '').toLowerCase().includes(s) || (b.new_item_code || '').toLowerCase().includes(s);
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Product Bundles</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchBundles} disabled={loading}>
                            {loading ? '⟳' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Product Bundle
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input 
                        type="text" 
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" 
                        placeholder="Search Parent Item..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {bundles.length} records</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider">Parent Item</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic">Fetching Bundles...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-20 text-gray-500 italic">No Product Bundles found.</td></tr>
                            ) : (
                                filtered.map((b) => (
                                    <tr key={b.name} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <button 
                                                className="text-blue-600 hover:text-blue-800 font-bold text-sm" 
                                                onClick={() => { setEditingRecord(b.name); setView('form'); }}
                                            >
                                                {b.new_item_code}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-md truncate">{b.description}</td>
                                        <td className="px-6 py-4 text-center">
                                            {b.disabled ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100">Disabled</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600 border border-green-100">Active</span>
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
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setView('list')} 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                                {editingRecord ? 'Edit Product Bundle' : 'New Product Bundle'}
                            </h1>
                            {!editingRecord && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-orange-50 text-orange-600 border border-orange-100">Not Saved</span>
                            )}
                        </div>
                        {editingRecord && <p className="text-xs text-gray-400 font-medium mt-0.5">Editing: {editingRecord}</p>}
                    </div>
                </div>
                <div className="flex gap-3">
                    {editingRecord && (
                        <button 
                            onClick={handleDelete}
                            className="px-5 py-2 text-red-600 bg-red-50 hover:bg-red-100 text-sm rounded-lg transition-all font-bold border border-red-100"
                        >
                            Delete
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="px-8 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-black transition-all font-bold shadow-lg shadow-gray-200 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Main Section */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Parent Item *</label>
                                <select 
                                    className={inputStyle}
                                    value={formData.new_item_code}
                                    onChange={(e) => setFormData({ ...formData, new_item_code: e.target.value })}
                                    disabled={editingRecord}
                                >
                                    <option value="">Select Parent Item</option>
                                    {itemsList.map(item => (
                                        <option key={item.name} value={item.item_code}>{item.item_code}: {item.item_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <input 
                                    type="checkbox" 
                                    id="disabled" 
                                    checked={!!formData.disabled} 
                                    onChange={(e) => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="disabled" className="text-sm font-bold text-gray-700">Disabled</label>
                            </div>
                        </div>
                        <div>
                            <label className={labelStyle}>Description</label>
                            <textarea 
                                className={`${inputStyle} h-32 resize-none`}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Bundle description..."
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Items</h2>
                        <button 
                            onClick={handleAddRow}
                            className="px-4 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all font-bold border border-blue-100"
                        >
                            + Add Row
                        </button>
                    </div>
                    
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className={`${thStyle} w-12 text-center`}>No.</th>
                                    <th className={thStyle}>Item *</th>
                                    <th className={`${thStyle} w-32`}>Qty *</th>
                                    <th className={thStyle}>Description</th>
                                    <th className={`${thStyle} w-32`}>UOM</th>
                                    <th className={`${thStyle} w-12`}></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {formData.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <span className="text-xs font-bold uppercase tracking-widest">No Items Added</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    formData.items.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className={`${tdStyle} text-center font-bold text-gray-400 text-xs`}>{i + 1}</td>
                                            <td className={tdStyle}>
                                                <select 
                                                    className={rowInputStyle}
                                                    value={row.item_code}
                                                    onChange={(e) => handleRowChange(i, 'item_code', e.target.value)}
                                                >
                                                    <option value="">Select Item</option>
                                                    {itemsList.map(item => (
                                                        <option key={item.name} value={item.item_code}>{item.item_code}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className={tdStyle}>
                                                <input 
                                                    type="number" 
                                                    className={`${rowInputStyle} font-bold text-blue-600`}
                                                    value={row.qty}
                                                    onChange={(e) => handleRowChange(i, 'qty', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className={tdStyle}>
                                                <input 
                                                    type="text" 
                                                    className={rowInputStyle}
                                                    value={row.description}
                                                    onChange={(e) => handleRowChange(i, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td className={tdStyle}>
                                                <input 
                                                    type="text" 
                                                    className={`${rowInputStyle} bg-gray-50/50`}
                                                    value={row.uom}
                                                    readOnly
                                                />
                                            </td>
                                            <td className={tdStyle}>
                                                <button 
                                                    onClick={() => handleRemoveRow(i)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">About Product Bundle</h2>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Aggregate group of <span className="font-bold text-gray-800">Items</span> into another <span className="font-bold text-gray-800">Item</span>. This is useful if you are bundling a certain <span className="font-bold text-gray-800">Items</span> into a package and you maintain stock of the packed <span className="font-bold text-gray-800">Items</span> and not the aggregate <span className="font-bold text-gray-800">Item</span>.
                        </p>
                        <p className="text-sm text-gray-600">
                            The package <span className="font-bold text-gray-800">Item</span> will have <span className="font-bold text-[#8E44AD]">Is Stock Item</span> as <span className="font-bold text-[#8E44AD]">No</span> and <span className="font-bold text-[#8E44AD]">Is Sales Item</span> as <span className="font-bold text-[#8E44AD]">Yes</span>.
                        </p>
                        
                        <div className="mt-6 pt-4 border-t border-gray-50">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 tracking-tight">Example:</h3>
                            <p className="text-sm text-gray-500 italic leading-relaxed">
                                "If you are selling Laptops and Backpacks separately and have a special price if the customer buys both, then the Laptop + Backpack will be a new Product Bundle Item."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductBundle;
