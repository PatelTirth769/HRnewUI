import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const ItemManufacturer = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Dropdowns
    const [itemsList, setItemsList] = useState([]);
    const [manufacturersList, setManufacturersList] = useState([]);

    const initialFormState = {
        item_code: '',
        manufacturer: '',
        manufacturer_part_no: '',
        is_default: 0,
        item_name: '',
        description: ''
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
            const res = await API.get('/api/resource/Item Manufacturer?fields=["name","item_code","manufacturer","manufacturer_part_no","is_default"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch item manufacturers' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [itemRes, manRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["item_code","item_name","description"]&limit_page_length=None'),
                API.get('/api/resource/Manufacturer?fields=["name"]&limit_page_length=None')
            ]);
            setItemsList(itemRes.data.data || []);
            setManufacturersList(manRes.data.data || []);
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Item Manufacturer/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (val) => {
        const item = itemsList.find(i => i.item_code === val);
        setFormData({
            ...formData,
            item_code: val,
            item_name: item ? item.item_name : '',
            description: item ? item.description : ''
        });
    };

    const handleSave = async () => {
        if (!formData.item_code || !formData.manufacturer || !formData.manufacturer_part_no) {
            notification.warning({ message: 'Validation Error', description: 'Item Code, Manufacturer and Part Number are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item Manufacturer/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Item Manufacturer updated.' });
            } else {
                await API.post('/api/resource/Item Manufacturer', formData);
                notification.success({ message: 'Item Manufacturer created.' });
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
            await API.delete(`/api/resource/Item Manufacturer/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:text-gray-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1.5 font-semibold";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.item_code || r.name).toLowerCase().includes(search.toLowerCase()) ||
            (r.manufacturer || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Item Manufacturers</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-100" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Manufacturer
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-96 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Item Code or Manufacturer..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Item Code</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Manufacturer</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Part Number</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider text-center">Is Default</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No manufacturer records found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.item_code}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 font-medium text-sm">{r.manufacturer}</td>
                                        <td className="px-5 py-4 text-gray-500 font-medium text-[13px]">{r.manufacturer_part_no}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.is_default ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-100">DEFAULT</span>
                                            ) : null}
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
                        {editingRecord || 'New Item Manufacturer'}
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
                        <Popconfirm title="Delete this mapping?" onConfirm={handleDelete}>
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
                    <div className="p-12 space-y-12 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            {/* Left Column: Primary Inputs */}
                            <div className="space-y-8">
                                <div>
                                    <label className={labelStyle}>Item Code *</label>
                                    <select className={inputStyle} value={formData.item_code} onChange={e => handleItemChange(e.target.value)}>
                                        <option value="">Select Item</option>
                                        {itemsList.map(i => <option key={i.item_code} value={i.item_code}>{i.item_code}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelStyle}>Manufacturer *</label>
                                    <select className={inputStyle} value={formData.manufacturer} onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}>
                                        <option value="">Select Manufacturer</option>
                                        {manufacturersList.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelStyle}>Manufacturer Part Number *</label>
                                    <input className={inputStyle} value={formData.manufacturer_part_no} onChange={e => setFormData({ ...formData, manufacturer_part_no: e.target.value })} placeholder="Enter Part No." />
                                </div>

                                <div className="pt-2">
                                    <label className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition font-bold group w-fit">
                                        <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })} />
                                        <div>
                                            <span className="text-[14px] text-gray-800">Is Default</span>
                                            <p className="text-[11px] text-gray-400 font-medium">Use this as the primary manufacturer for this item</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            {/* Right Column: Reference Info */}
                            <div className="space-y-8">
                                <div>
                                    <label className={labelStyle}>Item Name</label>
                                    <input className={inputStyle} value={formData.item_name} readOnly placeholder="Item Name Reference" />
                                </div>

                                <div>
                                    <label className={labelStyle}>Description</label>
                                    <textarea className={inputStyle + " h-32 resize-none"} value={formData.description} readOnly placeholder="Item Description Reference" />
                                </div>

                                <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100/50">
                                    <h3 className="text-[13px] font-bold text-orange-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Quality Notice
                                    </h3>
                                    <p className="text-[12px] text-orange-700/80 leading-relaxed font-medium">
                                        Ensure that the Manufacturer Part Number matches the manufacturer's technical documentation to prevent procurement errors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default ItemManufacturer;
