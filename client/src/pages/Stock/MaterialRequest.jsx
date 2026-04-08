import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm, Tabs, Select, Divider, Input } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiCalendar, FiPackage, FiInfo, FiFileText, FiPlus, FiSearch } from 'react-icons/fi';
import API from '../../services/api';

const MaterialRequest = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Masters Dropdowns
    const [itemsList, setItemsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [termsList, setTermsList] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);
    const [companies, setCompanies] = useState([]);

    const initialFormState = {
        naming_series: 'MAT-MR-.YYYY.-',
        company: '',
        transaction_date: new Date().toISOString().split('T')[0],
        purpose: 'Purchase',
        required_by: '',
        status: 'Draft',
        items: [],
        tc_name: '',
        terms: '',
        letter_head: '',
        print_heading: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchMasters();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(initialFormState);
                setActiveTab('1');
            }
        }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Material Request?fields=["name","transaction_date","purpose","status","required_by"]&limit_page_length=500&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch material requests' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [itemRes, whRes, tcRes, lhRes, cmpRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["name","item_code","item_name","stock_uom"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name","company"]&limit_page_length=500'),
                API.get('/api/resource/Terms and Conditions?fields=["name","terms"]&limit_page_length=500'),
                API.get('/api/resource/Letter Head?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500')
            ]);
            const items = itemRes.data?.data || [];
            if (items.length > 0) {
                setItemsList(items.map(i => ({ ...i, item_code: i.item_code || i.name })));
            }
            
            setWarehousesList(whRes.data?.data || []);
            setTermsList(tcRes.data?.data || []);
            setLetterHeads(lhRes.data?.data || []);
            setCompanies(cmpRes.data?.data || []);
            
            // Set default company if none selected
            if (cmpRes.data?.data?.length > 0 && !formData.company) {
                setFormData(prev => ({ ...prev, company: cmpRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching masters:', err);
            notification.error({ message: 'Sync Error', description: 'Failed to load master records (Items/Warehouses).' });
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Material Request/${encodeURIComponent(name)}`);
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
        if (formData.items.length === 0) {
            notification.warning({ message: 'Validation Error', description: 'At least one item is required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Material Request/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Material Request updated.' });
            } else {
                await API.post('/api/resource/Material Request', formData);
                notification.success({ message: 'Material Request created.' });
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
            await API.delete(`/api/resource/Material Request/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Management
    const handleAddRow = () => {
        setFormData({ ...formData, items: [...(formData.items || []), { item_code: '', qty: 1, uom: '', warehouse: '', schedule_date: formData.transaction_date }] });
    };
    const handleRemoveRow = (index) => {
        const newArr = [...(formData.items || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, items: newArr });
    };
    const handleRowChange = (index, field, value) => {
        const newArr = [...(formData.items || [])];
        if (field === 'item_code') {
            const item = itemsList.find(i => i.item_code === value);
            newArr[index] = { 
                ...newArr[index], 
                [field]: value, 
                uom: item ? item.stock_uom : '',
                warehouse: item ? item.default_warehouse : ''
            };
        } else {
            newArr[index] = { ...newArr[index], [field]: value };
        }
        setFormData({ ...formData, items: newArr });
    };

    const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-all disabled:bg-gray-50 disabled:text-gray-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1.5 font-semibold";
    
    // Ant Design Tabs custom styling
    const renderTabs = () => {
        const tabs = [
            { key: '1', label: 'Details', icon: <FiInfo className="text-blue-500" /> },
            { key: '2', label: 'Terms', icon: <FiFileText className="text-orange-500" /> },
            { key: '3', label: 'More Info', icon: <FiMoreHorizontal className="text-gray-400" /> }
        ];

        return (
            <div className="flex gap-8 border-b border-gray-100 mb-10">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 pb-4 text-[13px] font-bold uppercase tracking-wider transition-all relative ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                ))}
            </div>
        );
    };

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.purpose || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Material Requests</h1>
                        <p className="text-xs text-gray-400 font-medium">Create and track item procurement requests</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium shadow-sm shadow-blue-100" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Request
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-96 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-all" placeholder="Search Material Request..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-bold uppercase tracking-wider">{filtered.length} results</div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">ID</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Date</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Purpose</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider">Required By</th>
                                <th className="px-5 py-4 font-bold text-gray-600 text-[12px] uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic font-medium">Syncing with ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Material Requests found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 font-medium text-[13px]">{r.transaction_date}</td>
                                        <td className="px-5 py-4 font-bold text-gray-700 text-xs uppercase tracking-widest">{r.purpose}</td>
                                        <td className="px-5 py-4 text-gray-500 font-medium text-[13px]">{r.required_by || '-'}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                r.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                r.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                                r.status === 'Draft' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {r.status}
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
        <div className="p-6 max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Material Request</span>
                            {editingRecord && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                    formData.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                                }`}>
                                    {formData.status}
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {editingRecord || 'New Material Request'}
                        </h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Dropdown menu={{ items: [{ key: 'print', label: 'Export PDF' }] }} trigger={['click']}>
                        <Button className="h-10 text-sm font-bold border-gray-200 hover:border-blue-400 hover:text-blue-600 rounded-lg flex items-center gap-2">
                            Get Items From <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Button icon={<FiMoreHorizontal />} className="h-10 w-10 flex items-center justify-center border-gray-200 hover:bg-gray-50 rounded-lg" />

                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition shadow-lg active:scale-95 disabled:opacity-70 flex items-center gap-2 ml-4" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this request?" onConfirm={handleDelete}>
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-2 bg-gray-50 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden min-h-[600px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-80 gap-4">
                        <Spin size="large" />
                        <p className="text-sm text-gray-400 font-medium italic">Retreiving transaction data...</p>
                    </div>
                ) : (
                    <div className="p-10 animate-fade-in">
                        {renderTabs()}

                        <div className="min-h-[400px]">
                            {activeTab === '1' && (
                                <div className="space-y-12 animate-slide-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelStyle}>Series *</label>
                                                    <Select className="w-full h-10 select-premium" value={formData.naming_series} onChange={val => setFormData({ ...formData, naming_series: val })} disabled={editingRecord} options={[{ value: 'MAT-MR-.YYYY.-', label: 'MAT-MR-.YYYY.-' }]} />
                                                </div>
                                                <div>
                                                    <label className={labelStyle}>Company *</label>
                                                    <Select showSearch className="w-full h-10 select-premium" value={formData.company} onChange={val => setFormData({ ...formData, company: val })} options={companies.map(c => ({ value: c.name, label: c.name }))} placeholder="Select Company" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelStyle}>Purpose *</label>
                                                <Select className="w-full h-10 select-premium" value={formData.purpose} onChange={val => setFormData({ ...formData, purpose: val })} options={[
                                                    { value: 'Purchase', label: 'Purchase' },
                                                    { value: 'Material Transfer', label: 'Material Transfer' },
                                                    { value: 'Material Issue', label: 'Material Issue' },
                                                    { value: 'Manufacture', label: 'Manufacture' },
                                                    { value: 'Customer Provided', label: 'Customer Provided' }
                                                ]} />
                                            </div>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <label className={labelStyle}>Transaction Date *</label>
                                                <Input type="date" className="h-10 rounded-lg border-gray-200" value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className={labelStyle}>Required By</label>
                                                <Input type="date" className="h-10 rounded-lg border-gray-200" value={formData.required_by} onChange={e => setFormData({ ...formData, required_by: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table Section */}
                                    <div className="space-y-6 pt-10 border-t border-gray-50">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FiPackage /></div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Items</h3>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-black">{formData.items.length}</span>
                                            </div>
                                        </div>

                                        {/* Barcode and Target Warehouse Search Area */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                            <div>
                                                <label className={labelStyle}>Scan Barcode</label>
                                                <Input prefix={<FiSearch className="text-gray-400" />} className="h-10 rounded-lg border-gray-200" placeholder="Search by barcode..." />
                                            </div>
                                            <div>
                                                <label className={labelStyle}>Set Target Warehouse</label>
                                                <Select 
                                                    showSearch 
                                                    className="w-full h-10 select-premium" 
                                                    placeholder="Select for all rows..." 
                                                    onChange={val => {
                                                        const newItems = formData.items.map(item => ({ ...item, warehouse: val }));
                                                        setFormData({ ...formData, items: newItems });
                                                    }}
                                                    dropdownRender={(menu) => (
                                                        <>
                                                            {menu}
                                                            <Divider className="my-1" />
                                                            <div className="px-3 py-2">
                                                                <div className="text-[10px] text-gray-400 font-bold mb-2 italic">Filters applied for Company = {formData.company}</div>
                                                                <Button type="link" size="small" icon={<FiPlus />} className="p-0 h-auto text-[11px] font-bold text-blue-600">Create a new Warehouse</Button>
                                                            </div>
                                                        </>
                                                    )}
                                                    options={warehousesList
                                                        .filter(wh => !formData.company || !wh.company || wh.company === formData.company)
                                                        .map(wh => ({ value: wh.name, label: wh.warehouse_name || wh.name }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full">
                                                <thead className="bg-[#F9FAFB]">
                                                    <tr>
                                                        <th className="px-4 py-4 w-12 text-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /></th>
                                                        <th className="px-4 py-4 text-center w-12 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                                                        <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Code *</th>
                                                        <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Required By *</th>
                                                        <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">Quantity *</th>
                                                        <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Warehouse</th>
                                                        <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">UOM *</th>
                                                        <th className="px-4 py-4 w-12"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {formData.items.map((row, i) => (
                                                        <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-4 py-4 text-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" /></td>
                                                            <td className="px-4 py-4 text-center text-xs text-gray-300 font-bold">{i + 1}</td>
                                                            <td className="px-4 py-4">
                                                                <Select showSearch className="w-full border-none shadow-none text-sm font-bold text-gray-800" variant="borderless" value={row.item_code} onChange={val => handleRowChange(i, 'item_code', val)} placeholder="Select Item" options={itemsList.map(it => ({ value: it.item_code, label: it.item_code }))} />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Input type="date" className="w-full border-none shadow-none text-xs font-bold text-gray-500" variant="borderless" value={row.schedule_date} onChange={e => handleRowChange(i, 'schedule_date', e.target.value)} />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Input type="number" className="w-full border-none shadow-none text-sm font-black text-blue-600" variant="borderless" value={row.qty} onChange={e => handleRowChange(i, 'qty', parseFloat(e.target.value) || 0)} />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Select showSearch className="w-full border-none shadow-none text-sm font-bold text-gray-600" variant="borderless" value={row.warehouse} onChange={val => handleRowChange(i, 'warehouse', val)} placeholder="Select Warehouse" options={warehousesList.filter(wh => !formData.company || !wh.company || wh.company === formData.company).map(wh => ({ value: wh.name, label: wh.warehouse_name || wh.name }))} />
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <Input className="w-full border-none shadow-none text-xs font-black text-gray-400 bg-transparent" variant="borderless" value={row.uom} readOnly />
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <button onClick={() => handleRemoveRow(i)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {formData.items.length === 0 && (
                                                        <tr>
                                                            <td colSpan="7" className="px-4 py-20 text-center">
                                                                <div className="flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-200">
                                                                        <FiPackage className="w-8 h-8" />
                                                                    </div>
                                                                    <p className="text-sm font-bold text-gray-400 italic">No items requested. Start by adding a row.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-between items-center px-2">
                                            <div className="flex gap-2">
                                                <Button size="middle" className="text-[12px] font-bold rounded-lg border-gray-200" onClick={handleAddRow}>Add Row</Button>
                                                <Button size="middle" className="text-[12px] font-bold rounded-lg border-gray-200">Add Multiple</Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="middle" className="text-[12px] font-bold rounded-lg border-gray-200 bg-gray-50">Download</Button>
                                                <Button size="middle" className="text-[12px] font-bold rounded-lg border-gray-200 bg-gray-50">Upload</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === '2' && (
                                <div className="space-y-12 animate-slide-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                        <div className="space-y-8">
                                            <div>
                                                <label className={labelStyle}>Terms and Conditions</label>
                                                <select className={inputStyle} value={formData.tc_name} onChange={e => {
                                                    const sel = termsList.find(t => t.name === e.target.value);
                                                    setFormData({ ...formData, tc_name: e.target.value, terms: sel ? sel.terms : '' });
                                                }}>
                                                    <option value="">None</option>
                                                    {termsList.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Terms and Conditions Content</label>
                                        <div className="border border-gray-100 rounded-2xl p-8 bg-gray-50/30 min-h-[300px]">
                                            {formData.terms ? (
                                                <div className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: formData.terms }} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-30">
                                                    <FiFileText className="w-12 h-12" />
                                                    <p className="text-sm font-black italic">No terms defined for this request</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === '3' && (
                                <div className="space-y-12 animate-slide-up">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                        <div className="space-y-10">
                                            <div className="p-8 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Printing Details</h3>
                                                <div className="space-y-8">
                                                    <div>
                                                        <label className={labelStyle}>Letter Head</label>
                                                        <select className={inputStyle} value={formData.letter_head} onChange={e => setFormData({ ...formData, letter_head: e.target.value })}>
                                                            <option value="">Default</option>
                                                            {letterHeads.map(lh => <option key={lh.name} value={lh.name}>{lh.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelStyle}>Print Heading</label>
                                                        <input type="text" className={inputStyle} value={formData.print_heading} onChange={e => setFormData({ ...formData, print_heading: e.target.value })} placeholder="e.g., URGENT MATERIAL REQUEST" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Audit/Info Card */}
                                        <div className="space-y-6">
                                            <div className="p-8 bg-blue-50/40 rounded-2xl border border-blue-100/40">
                                                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <FiInfo /> System Information
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-blue-700/60 font-bold">Document Status</span>
                                                        <span className="font-black text-blue-900">{formData.status}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs border-t border-blue-100/40 pt-4">
                                                        <span className="text-blue-700/60 font-bold">Transaction Type</span>
                                                        <span className="font-black text-blue-900">{formData.purpose}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(12px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default MaterialRequest;
