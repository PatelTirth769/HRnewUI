import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const ItemGroup = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Dropdowns
    const [itemGroups, setItemGroups] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [taxTemplates, setTaxTemplates] = useState([]);
    const [taxCategories, setTaxCategories] = useState([]);
    const [itemAttributes, setItemAttributes] = useState([]);

    const initialFormState = {
        item_group_name: '',
        parent_item_group: '',
        is_group: 0,
        defaults: [],
        taxes: [],
        // Website Settings
        show_in_website: 0,
        include_descendants: 0,
        route: '',
        website_title: '',
        website_description: '',
        website_specifications: [],
        filter_fields: [],
        filter_attributes: [],
        weightage: 0,
        slideshow: ''
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
            const [igRes, cmpRes, whRes, plRes, ttRes, tcRes, attrRes] = await Promise.all([
                API.get('/api/resource/Item Group?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name"]&limit_page_length=None'),
                API.get('/api/resource/Price List?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Item Tax Template?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Tax Category?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Item Attribute?fields=["name"]&limit_page_length=None')
            ]);
            setItemGroups(igRes.data.data || []);
            setCompanies(cmpRes.data.data || []);
            setWarehouses(whRes.data.data || []);
            setPriceLists(plRes.data.data || []);
            setTaxTemplates(ttRes.data.data || []);
            setTaxCategories(tcRes.data.data || []);
            setItemAttributes(attrRes.data.data || []);
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
            if (!data.website_specifications) data.website_specifications = [];
            if (!data.filter_fields) data.filter_fields = [];
            if (!data.filter_attributes) data.filter_attributes = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.item_group_name) {
            notification.warning({ message: 'Validation Error', description: 'Item Group Name is required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item Group/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Item Group updated successfully.' });
            } else {
                await API.post('/api/resource/Item Group', formData);
                notification.success({ message: 'Item Group created successfully.' });
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
            notification.success({ message: 'Item Group deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Management
    const handleAddRow = (tableKey, emptyRow) => {
        setFormData({ ...formData, [tableKey]: [...(formData[tableKey] || []), emptyRow] });
    };
    const handleRemoveRow = (tableKey, index) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, [tableKey]: newArr });
    };
    const handleRowChange = (tableKey, index, field, value) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr[index] = { ...newArr[index], [field]: value };
        setFormData({ ...formData, [tableKey]: newArr });
    };

    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-400">No Data</span>
        </div>
    );

    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const rowInputStyle = "w-full border-none bg-transparent py-1 text-sm focus:ring-0";

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 bg-gray-50 p-2 border-b rounded-t text-[13px]";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.item_group_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.parent_item_group || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Item Groups</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Item Group
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none" placeholder="Search Item Group Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Item Group Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Parent Item Group</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Is Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-20 text-gray-500 italic">No Item Groups found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.item_group_name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{r.parent_item_group || '-'}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.is_group ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">Group</span> : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider">Leaf</span>}
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

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
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
                            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100 cursor-pointer hover:bg-gray-100 transition shadow-sm w-fit group">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.is_group} onChange={e => setFormData({ ...formData, is_group: e.target.checked ? 1 : 0 })} />
                                <div>
                                    <span className="text-[13px] font-semibold text-gray-700">Is Group</span>
                                    <p className="text-[10px] text-gray-400 font-medium">Only leaf nodes are allowed in transactions</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'defaults',
            label: 'Defaults',
            children: (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Defaults</h3>
                        <Button size="small" className="text-[11px] font-bold" onClick={() => handleAddRow('defaults', { company: '', default_warehouse: '', default_price_list: '' })}>+ Add Default</Button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className={thStyle}>No.</th>
                                    <th className={thStyle}>Company *</th>
                                    <th className={thStyle}>Default Warehouse</th>
                                    <th className={thStyle}>Default Price List</th>
                                    <th className={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.defaults.length === 0 ? null : formData.defaults.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-xs text-gray-400 font-bold">{i + 1}</td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.company} onChange={e => handleRowChange('defaults', i, 'company', e.target.value)}>
                                                <option value="">Select Company</option>
                                                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.default_warehouse} onChange={e => handleRowChange('defaults', i, 'default_warehouse', e.target.value)}>
                                                <option value="">Select Warehouse</option>
                                                {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>)}
                                            </select>
                                        </td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.default_price_list} onChange={e => handleRowChange('defaults', i, 'default_price_list', e.target.value)}>
                                                <option value="">Select Price List</option>
                                                {priceLists.map(pl => <option key={pl.name} value={pl.name}>{pl.name}</option>)}
                                            </select>
                                        </td>
                                        <td className={tdStyle}><button onClick={() => handleRemoveRow('defaults', i)} className="text-red-400 hover:text-red-600 transition font-bold block ml-auto">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.defaults.length === 0 && renderEmptyTable()}
                    </div>
                </div>
            )
        },
        {
            key: 'taxes',
            label: 'Item Tax',
            children: (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-700">Item Tax</h3>
                        <Button size="small" className="text-[11px] font-bold" onClick={() => handleAddRow('taxes', { item_tax_template: '', tax_category: '', valid_from: '', minimum_net_rate: 0, maximum_net_rate: 0 })}>+ Add Tax Template</Button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className={thStyle}>No.</th>
                                    <th className={thStyle}>Tax Template *</th>
                                    <th className={thStyle}>Category</th>
                                    <th className={thStyle}>Valid From</th>
                                    <th className={thStyle}>Min Net Rate</th>
                                    <th className={thStyle}>Max Net Rate</th>
                                    <th className={thStyle}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.taxes.length === 0 ? null : formData.taxes.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-xs text-gray-400 font-bold">{i + 1}</td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.item_tax_template} onChange={e => handleRowChange('taxes', i, 'item_tax_template', e.target.value)}>
                                                <option value="">Select Template</option>
                                                {taxTemplates.map(tt => <option key={tt.name} value={tt.name}>{tt.name}</option>)}
                                            </select>
                                        </td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.tax_category} onChange={e => handleRowChange('taxes', i, 'tax_category', e.target.value)}>
                                                <option value="">Select Category</option>
                                                {taxCategories.map(tc => <option key={tc.name} value={tc.name}>{tc.name}</option>)}
                                            </select>
                                        </td>
                                        <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.valid_from} onChange={e => handleRowChange('taxes', i, 'valid_from', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.minimum_net_rate} onChange={e => handleRowChange('taxes', i, 'minimum_net_rate', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.maximum_net_rate} onChange={e => handleRowChange('taxes', i, 'maximum_net_rate', e.target.value)} /></td>
                                        <td className={tdStyle}><button onClick={() => handleRemoveRow('taxes', i)} className="text-red-400 hover:text-red-600 transition font-bold block ml-auto">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.taxes.length === 0 && renderEmptyTable()}
                    </div>
                </div>
            )
        },
        {
            key: 'website',
            label: 'Website',
            children: (
                <div className="space-y-8 animate-fade-in">
                    {/* Website Settings */}
                    <div className="space-y-4">
                        <div className={sectionTitleStyle}>Website Settings</div>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded border border-gray-100 cursor-pointer hover:bg-gray-100 transition shadow-sm w-fit group">
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.show_in_website} onChange={e => setFormData({ ...formData, show_in_website: e.target.checked ? 1 : 0 })} />
                                    <div>
                                        <span className="text-[13px] font-semibold text-gray-700">Show in Website</span>
                                        <p className="text-[10px] text-gray-400 font-medium">Make Item Group visible in website</p>
                                    </div>
                                </label>
                                <div>
                                    <label className={labelStyle}>Route</label>
                                    <input className={inputStyle} value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} placeholder="e.g. products/electronics" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Title</label>
                                    <input className={inputStyle} value={formData.website_title} onChange={e => setFormData({ ...formData, website_title: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Description</label>
                                    <textarea className={inputStyle + " h-32 resize-none"} value={formData.website_description} onChange={e => setFormData({ ...formData, website_description: e.target.value })} placeholder="HTML / Banner that will show on the top of product list." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Website Specifications */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">Website Specifications</h3>
                            <Button size="small" className="text-[11px] font-bold" onClick={() => handleAddRow('website_specifications', { label: '', description: '' })}>+ Add Row</Button>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className={thStyle + " w-12 text-center"}>No.</th>
                                        <th className={thStyle}>Label</th>
                                        <th className={thStyle}>Description</th>
                                        <th className={thStyle + " w-12"}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.website_specifications.length === 0 ? null : formData.website_specifications.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                            <td className={tdStyle}>
                                                <input className={rowInputStyle} value={row.label} onChange={e => handleRowChange('website_specifications', i, 'label', e.target.value)} placeholder="e.g. Color" />
                                            </td>
                                            <td className={tdStyle}>
                                                <input className={rowInputStyle} value={row.description} onChange={e => handleRowChange('website_specifications', i, 'description', e.target.value)} placeholder="e.g. Red" />
                                            </td>
                                            <td className={tdStyle}><button onClick={() => handleRemoveRow('website_specifications', i)} className="text-red-400 hover:text-red-600 transition font-bold block ml-auto">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.website_specifications.length === 0 && renderEmptyTable()}
                        </div>
                    </div>

                    {/* Website Filters */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50/80 p-3 border-y border-gray-200 -mx-6">
                            <h3 className="text-sm font-bold text-gray-800 px-3">Website Filters</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className={labelStyle + " !mb-0"}>Item Fields</label>
                                    <Button size="small" type="link" className="text-[11px] font-bold" onClick={() => handleAddRow('filter_fields', { fieldname: '' })}>+ Add Row</Button>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className={thStyle + " w-12 text-center"}>No.</th>
                                                <th className={thStyle}>Fieldname</th>
                                                <th className={thStyle + " w-12"}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.filter_fields.length === 0 ? null : formData.filter_fields.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                                    <td className={tdStyle}>
                                                        <input className={rowInputStyle} value={row.fieldname} onChange={e => handleRowChange('filter_fields', i, 'fieldname', e.target.value)} placeholder="e.g. brand" />
                                                    </td>
                                                    <td className={tdStyle}><button onClick={() => handleRemoveRow('filter_fields', i)} className="text-red-400 hover:text-red-600 transition font-bold block ml-auto">✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {formData.filter_fields.length === 0 && renderEmptyTable()}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className={labelStyle + " !mb-0"}>Attributes</label>
                                    <Button size="small" type="link" className="text-[11px] font-bold" onClick={() => handleAddRow('filter_attributes', { attribute: '' })}>+ Add Row</Button>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className={thStyle + " w-12 text-center"}>No.</th>
                                                <th className={thStyle}>Attribute</th>
                                                <th className={thStyle + " w-12"}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.filter_attributes.length === 0 ? null : formData.filter_attributes.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2 text-xs text-gray-400 font-bold text-center">{i + 1}</td>
                                                    <td className={tdStyle}>
                                                        <select className={rowInputStyle} value={row.attribute} onChange={e => handleRowChange('filter_attributes', i, 'attribute', e.target.value)}>
                                                            <option value="">Select Attribute</option>
                                                            {itemAttributes.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className={tdStyle}><button onClick={() => handleRemoveRow('filter_attributes', i)} className="text-red-400 hover:text-red-600 transition font-bold block ml-auto">✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {formData.filter_attributes.length === 0 && renderEmptyTable()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className={labelStyle}>Weightage</label>
                                <input type="number" className={inputStyle} value={formData.weightage} onChange={e => setFormData({ ...formData, weightage: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Slideshow</label>
                                <input className={inputStyle} value={formData.slideshow} onChange={e => setFormData({ ...formData, slideshow: e.target.value })} placeholder="Link to Slideshow" />
                                <p className="text-[10px] text-gray-400 mt-1">Show this slideshow at the top of the page</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 p-4 bg-gray-50/50 rounded border border-gray-100 cursor-pointer hover:bg-gray-100 transition shadow-sm w-fit group">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!formData.include_descendants} onChange={e => setFormData({ ...formData, include_descendants: e.target.checked ? 1 : 0 })} />
                                <div>
                                    <span className="text-[13px] font-semibold text-gray-700">Include Descendants</span>
                                    <p className="text-[10px] text-gray-400 font-medium">Include Website Items belonging to child Item Groups</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord || 'New Item Group'}
                    </span>
                    {formData.show_in_website ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider border border-green-200">Website Visible</span>
                    ) : null}
                    {formData.is_group ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200">Group</span>
                    ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200">Leaf</span>
                    )}
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#FCE8E8] text-[#E02424] font-bold border border-[#F8B4B4]">Not Saved</span>
                    )}
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
                        <Popconfirm title="Delete this item group?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems} className="custom-item-group-tabs" />
                )}
            </div>

            <style>{`
                .custom-item-group-tabs .ant-tabs-nav::before {
                    border-bottom: 1px solid #e5e7eb;
                }
                .custom-item-group-tabs .ant-tabs-tab {
                    padding: 12px 0;
                    margin: 0 32px 0 0;
                    color: #6b7280;
                    font-size: 13px;
                    font-weight: 500;
                }
                .custom-item-group-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600;
                }
                .custom-item-group-tabs .ant-tabs-ink-bar {
                    background: #111827;
                    height: 2px !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.15s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ItemGroup;
