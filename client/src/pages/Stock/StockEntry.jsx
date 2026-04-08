import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm, Tabs, Select, Divider, Input, Checkbox } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiSearch, FiSettings, FiEdit2 } from 'react-icons/fi';
import API from '../../services/api';

const { TextArea } = Input;

const StockEntry = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    // Masters Dropdowns
    const [itemsList, setItemsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [boms, setBoms] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);

    const initialFormState = {
        naming_series: 'MAT-STE-.YYYY.-',
        company: '',
        stock_entry_type: 'Material Receipt',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toLocaleTimeString('en-GB'),
        set_posting_time: 0,
        inspection_required: 0,
        from_bom: 0,
        use_multi_level_bom: 0,
        bom_no: '',
        fg_completed_qty: 0,
        from_warehouse: '',
        to_warehouse: '',
        project: '',
        letter_head: '',
        print_heading: '',
        is_opening: 'No',
        remarks: '',
        items: []
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
            const res = await API.get('/api/resource/Stock Entry?fields=["name","posting_date","stock_entry_type","company"]&limit_page_length=500&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch stock entries' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [itemRes, whRes, projRes, cmpRes, bomRes, lhRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["name","item_code","item_name","stock_uom"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name","company"]&limit_page_length=500'),
                API.get('/api/resource/Project?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/BOM?fields=["name"]&filters=[["is_active","=",1]]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Letter Head?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}}))
            ]);
            
            const items = itemRes.data?.data || [];
            if (items.length > 0) setItemsList(items.map(i => ({ ...i, item_code: i.item_code || i.name })));
            setWarehousesList(whRes.data?.data || []);
            setProjects(projRes.data?.data || []);
            setBoms(bomRes.data?.data || []);
            setLetterHeads(lhRes.data?.data || []);
            setCompanies(cmpRes.data?.data || []);

            if (cmpRes.data?.data?.length > 0 && !formData.company) {
                setFormData(prev => ({ ...prev, company: cmpRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Stock Entry/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.items) data.items = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...formData, docstatus: 0 };
            if (editingRecord) {
                await API.put(`/api/resource/Stock Entry/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Success', description: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Stock Entry', payload);
                notification.success({ message: 'Success', description: 'Created successfully' });
            }
            setView('list');
            setEditingRecord(null);
            fetchRecords();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?.exception || 'Action failed' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Stock Entry/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Success', description: 'Deleted successfully' });
            setView('list');
            setEditingRecord(null);
            fetchRecords();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to delete record' });
        }
    };

    const handleAddRow = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { s_warehouse: formData.from_warehouse, t_warehouse: formData.to_warehouse, item_code: '', qty: 0, uom: '', basic_rate: 0 }]
        });
    };

    const handleRowChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'item_code' && value) {
            const iData = itemsList.find(i => i.item_code === value);
            if (iData) {
                newItems[index].uom = iData.stock_uom;
            }
        }
        setFormData({ ...formData, items: newItems });
    };

    const handleRemoveRow = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 bg-gray-50 p-2 border-b rounded-t text-[13px]";

    const warehouseOptions = warehousesList
        .filter(wh => !formData.company || !wh.company || wh.company === formData.company)
        .map(wh => ({ value: wh.name, label: wh.warehouse_name || wh.name }));

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.stock_entry_type || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Stock Entries</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Stock Entry
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none" placeholder="Search Stock Entry..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Company</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No Stock Entries found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">{r.stock_entry_type}</span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{r.posting_date}</td>
                                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{r.company}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-8 animate-fade-in pt-4">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Series *</label>
                                <select className={inputStyle} value={formData.naming_series} onChange={val => setFormData({ ...formData, naming_series: val })} disabled={editingRecord}>
                                    <option value="MAT-STE-.YYYY.-">MAT-STE-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Company *</label>
                                <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Stock Entry Type *</label>
                                <select className={inputStyle} value={formData.stock_entry_type} onChange={e => setFormData({ ...formData, stock_entry_type: e.target.value })}>
                                    <option value="Material Receipt">Material Receipt</option>
                                    <option value="Material Issue">Material Issue</option>
                                    <option value="Material Transfer">Material Transfer</option>
                                    <option value="Material Transfer for Manufacture">Material Transfer for Manufacture</option>
                                    <option value="Manufacture">Manufacture</option>
                                    <option value="Repack">Repack</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className={labelStyle}>Posting Date</label>
                                    <input type="date" disabled={!formData.set_posting_time} className={inputStyle} value={formData.posting_date} onChange={e => setFormData({ ...formData, posting_date: e.target.value })} />
                                </div>
                                <div className="pt-7">
                                    <Checkbox checked={!!formData.set_posting_time} onChange={e => setFormData({ ...formData, set_posting_time: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-500">Edit Date</Checkbox>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className={labelStyle}>Posting Time</label>
                                    <input type="time" disabled={!formData.set_posting_time} step="1" className={inputStyle} value={formData.posting_time} onChange={e => setFormData({ ...formData, posting_time: e.target.value })} />
                                </div>
                                <div className="pt-7">
                                    <Checkbox checked={!!formData.inspection_required} onChange={e => setFormData({ ...formData, inspection_required: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-500">Inspection</Checkbox>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-gray-50/50 rounded border border-gray-100 space-y-4">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">BOM & Warehousing Defaults</h4>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition shadow-sm w-fit">
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.from_bom} onChange={e => setFormData({ ...formData, from_bom: e.target.checked ? 1 : 0 })} />
                                    <div>
                                        <span className="text-[13px] font-semibold text-gray-700">From BOM</span>
                                    </div>
                                </label>
                                {formData.from_bom === 1 && (
                                    <select className={inputStyle} value={formData.bom_no} onChange={e => setFormData({ ...formData, bom_no: e.target.value })}>
                                        <option value="">Select BOM...</option>
                                        {boms.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Default Source</label>
                                    <select className={inputStyle} value={formData.from_warehouse} onChange={e => setFormData({ ...formData, from_warehouse: e.target.value })}>
                                        <option value="">Select...</option>
                                        {warehouseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Default Target</label>
                                    <select className={inputStyle} value={formData.to_warehouse} onChange={e => setFormData({ ...formData, to_warehouse: e.target.value })}>
                                        <option value="">Select...</option>
                                        {warehouseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-700">Items</h3>
                        </div>
                        <div className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F9FAFB] border-b">
                                    <tr>
                                        <th className="px-4 py-2 w-10 text-center"><input type="checkbox" className="rounded" /></th>
                                        <th className="px-4 py-2 w-12 text-center text-[10px] font-bold text-gray-400">No.</th>
                                        <th className="px-4 py-2 font-bold text-gray-500 text-[10px] uppercase">Source Warehouse</th>
                                        <th className="px-4 py-2 font-bold text-gray-500 text-[10px] uppercase">Target Warehouse</th>
                                        <th className="px-4 py-2 font-bold text-gray-500 text-[10px] uppercase">Item Code *</th>
                                        <th className="px-4 py-2 font-bold text-gray-500 text-[10px] uppercase w-24 text-right">Qty *</th>
                                        <th className="px-4 py-2 font-bold text-gray-500 text-[10px] uppercase w-48 text-right">Basic Rate (₹)</th>
                                        <th className="px-4 py-2 w-10 text-center"><FiSettings size={14} className="text-gray-300 mx-auto" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {formData.items.map((row, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50">
                                            <td className="p-2 text-center"><input type="checkbox" className="rounded" /></td>
                                            <td className="p-2 text-center text-gray-300 text-[11px] font-bold">{i + 1}</td>
                                            <td className="p-1">
                                                <select className="w-full text-xs font-medium border-0 bg-transparent focus:ring-0" value={row.s_warehouse} onChange={e => handleRowChange(i, 's_warehouse', e.target.value)}>
                                                    <option value="">Select...</option>
                                                    {warehouseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <select className="w-full text-xs font-medium border-0 bg-transparent focus:ring-0" value={row.t_warehouse} onChange={e => handleRowChange(i, 't_warehouse', e.target.value)}>
                                                    <option value="">Select...</option>
                                                    {warehouseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <select className="w-full text-sm font-bold text-gray-700 border-0 bg-transparent focus:ring-0" value={row.item_code} onChange={e => handleRowChange(i, 'item_code', e.target.value)}>
                                                    <option value="">Select Item...</option>
                                                    {itemsList.map(it => <option key={it.item_code} value={it.item_code}>{it.item_code}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <input type="number" className="w-full text-right font-bold text-gray-800 border-0 bg-transparent focus:ring-0" value={row.qty} onChange={e => handleRowChange(i, 'qty', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="p-1">
                                                <input type="number" className="w-full text-right font-medium text-gray-500 border-0 bg-transparent focus:ring-0" value={row.basic_rate} onChange={e => handleRowChange(i, 'basic_rate', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => handleRemoveRow(i)} className="text-gray-300 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100">
                                                    <FiEdit2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.items.length === 0 && (
                                <div className="py-12 text-center text-gray-400 italic">No items added.</div>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded hover:bg-gray-200 transition shadow-sm border border-gray-200" onClick={handleAddRow}>Add Row</button>
                                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded hover:bg-gray-200 transition shadow-sm border border-gray-200">Add Multiple</button>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded hover:bg-gray-200 transition shadow-sm border border-gray-200">Download</button>
                                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded hover:bg-gray-200 transition shadow-sm border border-gray-200">Upload</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'accounting',
            label: 'Accounting Dimensions',
            children: (
                <div className="animate-fade-in space-y-6 pt-4 max-w-lg">
                    <div>
                        <label className={labelStyle}>Project</label>
                        <select className={inputStyle} value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })}>
                            <option value="">Select Project...</option>
                            {projects.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
            )
        },
        {
            key: 'other',
            label: 'Other Info',
            children: (
                <div className="animate-fade-in space-y-10 pt-4">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Printing Settings</h4>
                            <div>
                                <label className={labelStyle}>Print Heading</label>
                                <input className={inputStyle} value={formData.print_heading} onChange={e => setFormData({ ...formData, print_heading: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Letter Head</label>
                                <select className={inputStyle} value={formData.letter_head} onChange={e => setFormData({ ...formData, letter_head: e.target.value })}>
                                    <option value="">Select Letter Head...</option>
                                    {letterHeads.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Entry Context</h4>
                            <div>
                                <label className={labelStyle}>Is Opening</label>
                                <select className={inputStyle} value={formData.is_opening} onChange={e => setFormData({ ...formData, is_opening: e.target.value })}>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Remarks</label>
                                <TextArea rows={4} className="rounded border-gray-200 text-sm" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 bg-gray-50/20 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-2 rounded-t-lg">
                <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400 mr-1" onClick={() => setView('list')}>
                        <FiChevronLeft size={18} />
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        {editingRecord || 'New Stock Entry'}
                    </span>
                    <div className="flex gap-2 ml-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200">{formData.stock_entry_type || 'Draft'}</span>
                        {!editingRecord && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#FCE8E8] text-[#E02424] font-bold border border-[#F8B4B4]">Not Saved</span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: [{ key: 'view', label: 'View Profile' }] }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300">
                            View <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Button className="h-8 text-[13px] border-gray-300">Duplicate</Button>

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    <button className="px-6 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this entry?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems} className="custom-stock-tabs" />
                )}
            </div>

            <style jsx global>{`
                .custom-stock-tabs .ant-tabs-nav {
                    margin-bottom: 24px !important;
                }
                .custom-stock-tabs .ant-tabs-tab {
                    padding: 8px 0 12px 0 !important;
                    margin: 0 40px 0 0 !important;
                }
                .custom-stock-tabs .ant-tabs-tab-btn {
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #6b7280 !important;
                }
                .custom-stock-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600 !important;
                }
                .custom-stock-tabs .ant-tabs-ink-bar {
                    background: #111827 !important;
                    height: 2px !important;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default StockEntry;
