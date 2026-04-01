import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const ItemGroup = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    const init = {
        item_group_name: '',
        parent_item_group: '',
        is_group: 0,
        defaults: [],
        taxes: []
    };

    const [formData, setFormData] = useState(init);

    // Masters
    const [itemGroups, setItemGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [taxTemplates, setTaxTemplates] = useState([]);
    const [taxCategories, setTaxCategories] = useState([]);

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
            const res = await API.get('/api/resource/Item Group?fields=["name","item_group_name","parent_item_group","is_group"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch item groups' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [ig, cmp, wh, pl, tt, tc] = await Promise.all([
                API.get('/api/resource/Item Group?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name"]&limit_page_length=None'),
                API.get('/api/resource/Price List?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Item Tax Template?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Tax Category?fields=["name"]&limit_page_length=None')
            ]);
            setItemGroups(ig.data.data || []);
            setCompanies(cmp.data.data || []);
            setWarehouses(wh.data.data || []);
            setPriceLists(pl.data.data || []);
            setTaxTemplates(tt.data.data || []);
            setTaxCategories(tc.data.data || []);
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Item Group/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.defaults) data.defaults = [];
            if (!data.taxes) data.taxes = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.item_group_name) {
            notification.warning({ message: 'Item Group Name is required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item Group/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Item Group updated' });
            } else {
                await API.post('/api/resource/Item Group', formData);
                notification.success({ message: 'Item Group created' });
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
            await API.delete(`/api/resource/Item Group/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Item Group deleted' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const addRow = (type) => {
        if (type === 'defaults') {
            setFormData({ ...formData, defaults: [...formData.defaults, { company: '', default_warehouse: '', default_price_list: '' }] });
        } else {
            setFormData({ ...formData, taxes: [...formData.taxes, { item_tax_template: '', tax_category: '', valid_from: '', minimum_net_rate: 0, maximum_net_rate: 0 }] });
        }
    };

    const removeRow = (type, index) => {
        const updated = [...formData[type]];
        updated.splice(index, 1);
        setFormData({ ...formData, [type]: updated });
    };

    const updateRow = (type, index, field, value) => {
        const updated = [...formData[type]];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, [type]: updated });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 transition shadow-sm";
    const labelStyle = "block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-tight";
    const thStyle = "px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100";
    const rowInpStyle = "w-full border border-gray-100 rounded py-1 px-2 text-xs focus:outline-none focus:bg-white focus:border-blue-300 bg-transparent transition";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.item_group_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.parent_item_group || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6 max-w-[1400px] mx-auto pb-24">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Item Groups</h1>
                        <p className="text-xs text-gray-500 font-medium">Categorize items for better management and reporting</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition font-bold shadow-sm" onClick={fetchRecords}>
                            ⟳ Refresh
                        </button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition font-bold shadow-lg shadow-gray-200" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Item Group
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <input type="text" className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:border-blue-400 transition-all" placeholder="Search Item Group Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f9fafb] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Item Group Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider">Parent Item Group</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-[11px] uppercase tracking-wider text-center">Is Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-20"><Spin size="large" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-28 text-gray-400 italic">No Item Groups Found</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/80 transition-colors cursor-pointer group" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                        <td className="px-6 py-4 font-bold text-blue-600 underline-offset-4 group-hover:underline">{r.item_group_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{r.parent_item_group || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {r.is_group ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">Group</span> : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">Leaf</span>}
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">{editingRecord || 'New Item Group'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editingRecord && (
                        <Popconfirm title="Delete this item group?" onConfirm={handleDelete} okText="Yes" cancelText="No">
                            <button className="px-5 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg text-sm font-bold hover:bg-red-100 transition shadow-sm">Delete</button>
                        </Popconfirm>
                    )}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-black hover:bg-gray-800 transition shadow-xl disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving && <Spin size="small" className="brightness-200" />} Save
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64"><Spin size="large" /></div>
            ) : (
                <div className="space-y-10">
                    {/* General Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 pb-2 border-b">General Settings</h2>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Item Group Name *</label>
                                    <input className={inputStyle} value={formData.item_group_name} onChange={e => setFormData({ ...formData, item_group_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Parent Item Group</label>
                                    <select className={inputStyle} value={formData.parent_item_group} onChange={e => setFormData({ ...formData, parent_item_group: e.target.value })}>
                                        <option value="">Select Parent...</option>
                                        {itemGroups.map(ig => <option key={ig.name} value={ig.name}>{ig.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-6">
                                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition shadow-sm w-fit group">
                                    <input type="checkbox" className="w-5 h-5 rounded text-blue-600 transition group-hover:scale-110" checked={!!formData.is_group} onChange={e => setFormData({ ...formData, is_group: e.target.checked ? 1 : 0 })} />
                                    <div>
                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Is Group</span>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Only leaf nodes are allowed in transactions</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Defaults Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Defaults</h2>
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition border border-blue-100 px-3 py-1.5 rounded-lg bg-blue-50/50 shadow-sm" onClick={() => addRow('defaults')}>+ Add Default</button>
                        </div>
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr>
                                        <th className="w-8 px-2 py-3 border-b border-gray-100 bg-gray-50/50"></th>
                                        <th className={thStyle}>Company *</th>
                                        <th className={thStyle}>Default Warehouse</th>
                                        <th className={thStyle}>Default Price List</th>
                                        <th className="w-8 px-2 py-3 border-b border-gray-100 bg-gray-50/50"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {formData.defaults.length === 0 ? (
                                        <tr><td colSpan="5" className="py-16 text-center text-gray-400 italic">No entry. Click "+ Add Default" to define company-specific settings.</td></tr>
                                    ) : (
                                        formData.defaults.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="px-2 py-3 text-center text-gray-300 font-black">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <select className={rowInpStyle} value={row.company} onChange={e => updateRow('defaults', idx, 'company', e.target.value)}>
                                                        <option value="">Select Company...</option>
                                                        {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select className={rowInpStyle} value={row.default_warehouse} onChange={e => updateRow('defaults', idx, 'default_warehouse', e.target.value)}>
                                                        <option value="">Select Warehouse...</option>
                                                        {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select className={rowInpStyle} value={row.default_price_list} onChange={e => updateRow('defaults', idx, 'default_price_list', e.target.value)}>
                                                        <option value="">Select Price List...</option>
                                                        {priceLists.map(pl => <option key={pl.name} value={pl.name}>{pl.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-3 text-center"><button className="text-gray-300 hover:text-red-500 transition-colors font-bold text-sm" onClick={() => removeRow('defaults', idx)}>✕</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tax Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Item Tax</h2>
                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition border border-blue-100 px-3 py-1.5 rounded-lg bg-blue-50/50 shadow-sm" onClick={() => addRow('taxes')}>+ Add Tax Template</button>
                        </div>
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr>
                                        <th className="w-8 px-2 py-3 border-b border-gray-100 bg-gray-50/50"></th>
                                        <th className={thStyle}>Tax Template *</th>
                                        <th className={thStyle}>Category</th>
                                        <th className={thStyle}>Valid From</th>
                                        <th className={thStyle}>Min Net Rate</th>
                                        <th className={thStyle}>Max Net Rate</th>
                                        <th className="w-8 px-2 py-3 border-b border-gray-100 bg-gray-50/50"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {formData.taxes.length === 0 ? (
                                        <tr><td colSpan="7" className="py-16 text-center text-gray-400 italic">No entry. Click "+ Add Tax Template" to define tax rules.</td></tr>
                                    ) : (
                                        formData.taxes.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="px-2 py-3 text-center text-gray-300 font-black">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <select className={rowInpStyle} value={row.item_tax_template} onChange={e => updateRow('taxes', idx, 'item_tax_template', e.target.value)}>
                                                        <option value="">Select Template...</option>
                                                        {taxTemplates.map(tt => <option key={tt.name} value={tt.name}>{tt.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select className={rowInpStyle} value={row.tax_category} onChange={e => updateRow('taxes', idx, 'tax_category', e.target.value)}>
                                                        <option value="">Select Category...</option>
                                                        {taxCategories.map(tc => <option key={tc.name} value={tc.name}>{tc.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3"><input type="date" className={rowInpStyle} value={row.valid_from} onChange={e => updateRow('taxes', idx, 'valid_from', e.target.value)} /></td>
                                                <td className="px-4 py-3"><input type="number" className={rowInpStyle + " font-bold"} value={row.minimum_net_rate} onChange={e => updateRow('taxes', idx, 'minimum_net_rate', e.target.value)} /></td>
                                                <td className="px-4 py-3"><input type="number" className={rowInpStyle + " font-bold"} value={row.maximum_net_rate} onChange={e => updateRow('taxes', idx, 'maximum_net_rate', e.target.value)} /></td>
                                                <td className="px-2 py-3 text-center"><button className="text-gray-300 hover:text-red-500 transition-colors font-bold text-sm" onClick={() => removeRow('taxes', idx)}>✕</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemGroup;
