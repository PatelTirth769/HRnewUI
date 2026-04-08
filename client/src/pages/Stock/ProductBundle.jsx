import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const ProductBundle = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Dropdowns
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
            fetchRecords();
        } else {
            fetchItemsList();
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
            const res = await API.get('/api/resource/Product Bundle?fields=["name","new_item_code","description","disabled"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
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

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Product Bundle/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.items) data.items = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
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
            if (editingRecord) {
                await API.put(`/api/resource/Product Bundle/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Product Bundle updated successfully.' });
            } else {
                await API.post('/api/resource/Product Bundle', formData);
                notification.success({ message: 'Product Bundle created successfully.' });
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
            await API.delete(`/api/resource/Product Bundle/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Product Bundle deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Management
    const handleAddRow = () => {
        setFormData({ ...formData, items: [...(formData.items || []), { item_code: '', qty: 0, description: '', uom: '' }] });
    };
    const handleRemoveRow = (index) => {
        const newArr = [...(formData.items || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, items: newArr });
    };
    const handleRowChange = (index, field, value) => {
        const newArr = [...(formData.items || [])];
        if (field === 'item_code') {
            const selectedItem = itemsList.find(i => i.item_code === value);
            newArr[index] = { 
                ...newArr[index], 
                [field]: value,
                uom: selectedItem ? selectedItem.stock_uom : '',
                description: selectedItem ? selectedItem.description : ''
            };
        } else {
            newArr[index] = { ...newArr[index], [field]: value };
        }
        setFormData({ ...formData, items: newArr });
    };

    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-t-0 rounded-b-xl border-gray-100">
            <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">No Items Added</span>
        </div>
    );

    const thStyle = "px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100";
    const tdStyle = "px-4 py-3 whitespace-nowrap text-sm border-t border-gray-50";
    const rowInputStyle = "w-full border-none bg-transparent py-1 text-sm focus:ring-0";

    const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:text-gray-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1.5 font-semibold";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.new_item_code || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.description || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Product Bundles</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-100" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Product Bundle
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Parent Item Code..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Parent Item Code</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Description</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-20 text-gray-500 italic">No Product Bundles found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.new_item_code}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-sm font-medium">{r.description || '-'}</td>
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
                        {editingRecord || 'New Product Bundle'}
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
                        <Popconfirm title="Delete this product bundle?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="p-8 space-y-8 animate-fade-in">
                        {/* Main Settings */}
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Parent Item Code *</label>
                                    <select className={inputStyle} value={formData.new_item_code} onChange={e => setFormData({ ...formData, new_item_code: e.target.value })} disabled={editingRecord}>
                                        <option value="">Select Parent Item...</option>
                                        {itemsList.map(i => <option key={i.name} value={i.item_code}>{i.item_code}: {i.item_name}</option>)}
                                    </select>
                                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium italic">Item for which you are creating this bundle</p>
                                </div>
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition font-bold group">
                                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} />
                                        <span className="text-[13px] text-gray-700">Disabled</span>
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Description</label>
                                    <textarea className={inputStyle + " h-28 resize-none"} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of this bundle package..." />
                                </div>
                            </div>
                        </div>

                        {/* Child Table */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Bundled Items</h2>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">{formData.items.length}</span>
                                </div>
                                <button className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition font-bold border border-blue-100" onClick={handleAddRow}>
                                    + Add Item
                                </button>
                            </div>
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-[#F9FAFB]">
                                        <tr>
                                            <th className={thStyle + " w-12 text-center"}>No.</th>
                                            <th className={thStyle}>Item Code *</th>
                                            <th className={thStyle + " w-32"}>Qty *</th>
                                            <th className={thStyle}>Description</th>
                                            <th className={thStyle + " w-32"}>UOM</th>
                                            <th className={thStyle + " w-12"}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.items.length === 0 ? null : formData.items.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-4 py-3 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                                <td className={tdStyle}>
                                                    <select className={rowInputStyle + " font-semibold text-gray-700"} value={row.item_code} onChange={e => handleRowChange(i, 'item_code', e.target.value)}>
                                                        <option value="">Select Item</option>
                                                        {itemsList.map(item => (
                                                            <option key={item.name} value={item.item_code}>{item.item_code}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className={tdStyle}>
                                                    <input type="number" className={rowInputStyle + " font-bold text-blue-600"} value={row.qty} onChange={e => handleRowChange(i, 'qty', parseFloat(e.target.value) || 0)} />
                                                </td>
                                                <td className={tdStyle}>
                                                    <input type="text" className={rowInputStyle} value={row.description} onChange={e => handleRowChange(i, 'description', e.target.value)} />
                                                </td>
                                                <td className={tdStyle}>
                                                    <input type="text" className={rowInputStyle + " text-gray-400 font-medium"} value={row.uom} readOnly />
                                                </td>
                                                <td className={tdStyle}><button onClick={() => handleRemoveRow(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1">✕</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {formData.items.length === 0 && renderEmptyTable()}
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                About Product Bundles
                            </h3>
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                A Product Bundle allows you to group multiple items into one aggregate parent item for sales.
                                When the parent bundle item is sold, stock is deducted for each individual item within the bundle. 
                                <br/><br/>
                                <span className="opacity-80 underline italic">Note: The parent item should have "Is Stock Item" as No and "Is Sales Item" as Yes in the Item Master.</span>
                            </p>
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

export default ProductBundle;
