import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const ItemAlternative = () => {
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
        item_code: '',
        alternative_item_code: '',
        two_way: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchItemsMasters();
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
            const res = await API.get('/api/resource/Item Alternative?fields=["name","item_code","alternative_item_code","two_way"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch item alternatives' });
        } finally {
            setLoading(false);
        }
    };

    const fetchItemsMasters = async () => {
        try {
            const res = await API.get('/api/resource/Item?fields=["item_code","item_name"]&limit_page_length=None');
            setItemsList(res.data.data || []);
        } catch (err) {
            console.error('Error fetching items:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Item Alternative/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.item_code || !formData.alternative_item_code) {
            notification.warning({ message: 'Validation Error', description: 'Both Item Code and Alternative Item Code are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item Alternative/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Item Alternative updated successfully.' });
            } else {
                await API.post('/api/resource/Item Alternative', formData);
                notification.success({ message: 'Item Alternative created successfully.' });
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
            await API.delete(`/api/resource/Item Alternative/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Item Alternative deleted.' });
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
            (r.alternative_item_code || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Item Alternatives</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-100" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Alternative
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Item Code..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Name</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Item Code</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Alternative Item Code</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider text-center">Two-way</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No alternatives found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 font-medium text-sm">{r.item_code}</td>
                                        <td className="px-5 py-4 text-gray-700 font-medium text-sm">{r.alternative_item_code}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.two_way ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-100">YES</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-100">NO</span>
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
                        {editingRecord || 'New Item Alternative'}
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
                        <Popconfirm title="Delete this alternative?" onConfirm={handleDelete}>
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
                    <div className="p-12 space-y-10 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-10">
                                <div>
                                    <label className={labelStyle}>Item Code *</label>
                                    <select className={inputStyle} value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })}>
                                        <option value="">Select Item</option>
                                        {itemsList.map(i => <option key={i.item_code} value={i.item_code}>{i.item_code}: {i.item_name}</option>)}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Original item for which you are defining an alternative</p>
                                </div>

                                <div>
                                    <label className={labelStyle}>Alternative Item Code *</label>
                                    <select className={inputStyle} value={formData.alternative_item_code} onChange={e => setFormData({ ...formData, alternative_item_code: e.target.value })}>
                                        <option value="">Select Alternative Item</option>
                                        {itemsList.map(i => <option key={i.item_code} value={i.item_code}>{i.item_code}: {i.item_name}</option>)}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-2 italic font-medium">Item that can be used instead of the original item</p>
                                </div>

                                <div className="pt-4">
                                    <label className="flex items-center gap-3 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition font-bold group w-fit">
                                        <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 transition-transform group-active:scale-90" checked={!!formData.two_way} onChange={e => setFormData({ ...formData, two_way: e.target.checked ? 1 : 0 })} />
                                        <div>
                                            <span className="text-[14px] text-gray-800">Two-way</span>
                                            <p className="text-[11px] text-gray-400 font-medium">If enabled, the original item can also be an alternative for this one</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h3 className="text-[15px] font-bold text-blue-900">About Item Alternatives</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[13px] text-blue-700/80 leading-relaxed font-medium">
                                            Item Alternatives allow you to substitute items during production or sales if the primary item is out of stock.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex gap-2 text-[12px] text-blue-600/80 font-medium">
                                                <span className="text-blue-400">●</span>
                                                <span>Used automatically in Stock Reconciliation and Production Plans.</span>
                                            </li>
                                            <li className="flex gap-2 text-[12px] text-blue-600/80 font-medium">
                                                <span className="text-blue-400">●</span>
                                                <span>Supports two-way mapping to simplify data entry.</span>
                                            </li>
                                        </ul>
                                    </div>
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

export default ItemAlternative;
