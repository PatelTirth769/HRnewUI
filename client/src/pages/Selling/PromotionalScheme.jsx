import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs } from 'antd';
import API from '../../services/api';

const PromotionalScheme = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const [itemsList, setItemsList] = useState([]);
    const [itemGroups, setItemGroups] = useState([]);
    const [brands, setBrands] = useState([]);
    const [companies, setCompanies] = useState([]);

    const initialFormState = {
        name: '',
        apply_on: 'Item Code',
        disabled: 0,
        items: [],
        mixed_conditions: 0,
        is_cumulative: 0,
        apply_rule_on_other: '',
        other_item_code: '',
        other_item_group: '',
        other_brand: '',
        selling: 1,
        buying: 0,
        applicable_for: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_upto: '',
        company: '',
        currency: 'INR',
        price_discount_slabs: [],
        product_discount_slabs: []
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchDropdownData();
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
            const res = await API.get('/api/resource/Promotion Scheme?fields=["name","apply_on","disabled","company"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch promotional schemes' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [itemRes, groupRes, brandRes, compRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["item_code","item_name","stock_uom"]&limit_page_length=None'),
                API.get('/api/resource/Item Group?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Brand?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]')
            ]);
            setItemsList(itemRes.data.data || []);
            setItemGroups(groupRes.data.data || []);
            setBrands(brandRes.data.data || []);
            setCompanies(compRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Promotion Scheme/${encodeURIComponent(name)}`);
            const data = res.data.data;
            setFormData({
                ...data,
                items: data.items || [],
                price_discount_slabs: data.price_discount_slabs || [],
                product_discount_slabs: data.product_discount_slabs || []
            });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name && !editingRecord) {
            notification.warning({ message: 'Validation Error', description: 'Name is required.' });
            return;
        }
        if (!formData.company) {
            notification.warning({ message: 'Validation Error', description: 'Company is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Promotion Scheme/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Updated successfully.' });
            } else {
                await API.post('/api/resource/Promotion Scheme', payload);
                notification.success({ message: 'Created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this promotional scheme?')) return;
        try {
            await API.delete(`/api/resource/Promotion Scheme/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const handleAddRow = (tableKey, emptyRow) => {
        setFormData(prev => ({ ...prev, [tableKey]: [...(prev[tableKey] || []), emptyRow] }));
    };
    const handleRemoveRow = (tableKey, index) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, [tableKey]: newArr });
    };
    const handleRowChange = (tableKey, index, field, value) => {
        const newArr = [...(formData[tableKey] || [])];
        if (field === 'item_code' && tableKey === 'items') {
            const selected = itemsList.find(i => i.item_code === value);
            newArr[index] = { ...newArr[index], [field]: value, uom: selected ? selected.stock_uom : '' };
        } else {
            newArr[index] = { ...newArr[index], [field]: value };
        }
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

    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const rowInputStyle = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";

    if (view === 'list') {
        const filtered = records.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()));
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Promotional Schemes</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Promotional Scheme
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} records</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Apply On</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Company</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching records...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No records found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 font-medium">{r.apply_on}</td>
                                        <td className="px-5 py-4 text-gray-500">{r.company}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.disabled ? (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">Disabled</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">Active</span>
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

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 pb-8">
                    <div className="grid grid-cols-[1fr,1fr] gap-8 mt-4">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Name *</label>
                                <input className={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={editingRecord} />
                            </div>
                            <div>
                                <label className={labelStyle}>Apply On *</label>
                                <select className={inputStyle} value={formData.apply_on} onChange={e => setFormData({ ...formData, apply_on: e.target.value })}>
                                    <option value="Item Code">Item Code</option>
                                    <option value="Item Group">Item Group</option>
                                    <option value="Brand">Brand</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="disabled_chk" checked={!!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="disabled_chk" className="text-sm font-semibold text-gray-700">Disable</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm text-gray-800 font-semibold mb-2">Pricing Rule Item Code</label>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={thStyle}>Item Code</th>
                                            <th className={`${thStyle} w-24`}>UOM</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((row, i) => (
                                            <tr key={i} className="bg-white border-b border-gray-100 last:border-0">
                                                <td className={tdStyle}>
                                                    <select className={rowInputStyle} value={row.item_code} onChange={e => handleRowChange('items', i, 'item_code', e.target.value)}>
                                                        <option value="">Select Item</option>
                                                        {itemsList.map(item => <option key={item.item_code} value={item.item_code}>{item.item_code}</option>)}
                                                    </select>
                                                </td>
                                                <td className={tdStyle}>
                                                    <input className={rowInputStyle} value={row.uom} readOnly disabled />
                                                </td>
                                                <td className={`${tdStyle} text-center`}>
                                                    <button onClick={() => handleRemoveRow('items', i)} className="text-red-400 hover:text-red-600 text-xs shadow-none">✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {formData.items.length === 0 && renderEmptyTable()}
                            </div>
                            <button onClick={() => handleAddRow('items', { item_code: '', uom: '' })} className="mt-2 text-[11px] bg-white hover:bg-gray-100 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                                Add Row
                            </button>
                            <div className="flex gap-4 pt-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="mixed_chk" checked={!!formData.mixed_conditions} onChange={e => setFormData({ ...formData, mixed_conditions: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="mixed_chk" className="text-xs font-semibold text-gray-700">Mixed Conditions</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="cumul_chk" checked={!!formData.is_cumulative} onChange={e => setFormData({ ...formData, is_cumulative: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="cumul_chk" className="text-xs font-semibold text-gray-700">Is Cumulative</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={sectionTitleStyle}>Discount on Other Item</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8 max-w-4xl">
                        <div>
                            <label className={labelStyle}>Apply Rule On Other</label>
                            <select className={inputStyle} value={formData.apply_rule_on_other} onChange={e => setFormData({ ...formData, apply_rule_on_other: e.target.value })}>
                                <option value="">None</option>
                                <option value="Item Code">Item Code</option>
                                <option value="Item Group">Item Group</option>
                                <option value="Brand">Brand</option>
                            </select>
                        </div>
                        {formData.apply_rule_on_other === 'Item Code' && (
                            <div>
                                <label className={labelStyle}>Item Code</label>
                                <select className={inputStyle} value={formData.other_item_code} onChange={e => setFormData({ ...formData, other_item_code: e.target.value })}>
                                    <option value="">Select Item</option>
                                    {itemsList.map(i => <option key={i.item_code} value={i.item_code}>{i.item_code}</option>)}
                                </select>
                            </div>
                        )}
                        {formData.apply_rule_on_other === 'Item Group' && (
                            <div>
                                <label className={labelStyle}>Item Group</label>
                                <select className={inputStyle} value={formData.other_item_group} onChange={e => setFormData({ ...formData, other_item_group: e.target.value })}>
                                    <option value="">Select Item Group</option>
                                    {itemGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                </select>
                            </div>
                        )}
                        {formData.apply_rule_on_other === 'Brand' && (
                            <div>
                                <label className={labelStyle}>Brand</label>
                                <select className={inputStyle} value={formData.other_brand} onChange={e => setFormData({ ...formData, other_brand: e.target.value })}>
                                    <option value="">Select Brand</option>
                                    {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className={sectionTitleStyle}>Party Information</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="flex gap-6 items-center">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="sell_chk" checked={!!formData.selling} onChange={e => setFormData({ ...formData, selling: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="sell_chk" className="text-sm font-semibold text-gray-700">Selling</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="buy_chk" checked={!!formData.buying} onChange={e => setFormData({ ...formData, buying: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="buy_chk" className="text-sm font-semibold text-gray-700">Buying</label>
                            </div>
                        </div>
                        {(formData.selling || formData.buying) && (
                            <div>
                                <label className={labelStyle}>Applicable For</label>
                                <select className={inputStyle} value={formData.applicable_for} onChange={e => setFormData({ ...formData, applicable_for: e.target.value })}>
                                    <option value="">Select</option>
                                    <option value="Customer">Customer</option>
                                    <option value="Customer Group">Customer Group</option>
                                    <option value="Territory">Territory</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className={sectionTitleStyle}>Period Settings</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Valid From *</label>
                                <input type="date" className={inputStyle} value={formData.valid_from} onChange={e => setFormData({ ...formData, valid_from: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Valid Upto</label>
                                <input type="date" className={inputStyle} value={formData.valid_upto} onChange={e => setFormData({ ...formData, valid_upto: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Company *</label>
                                <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Currency</label>
                                <input className={inputStyle} value={formData.currency} readOnly disabled />
                            </div>
                        </div>
                    </div>

                    <div className={sectionTitleStyle}>Price Discount Slabs</div>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={thStyle}>Min Qty</th>
                                    <th className={thStyle}>Max Qty</th>
                                    <th className={thStyle}>Min Amount</th>
                                    <th className={thStyle}>Max Amount</th>
                                    <th className={thStyle}>Discount Type</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.price_discount_slabs.map((row, i) => (
                                    <tr key={i} className="bg-white border-b border-gray-100 last:border-0">
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.min_qty} onChange={e => handleRowChange('price_discount_slabs', i, 'min_qty', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.max_qty} onChange={e => handleRowChange('price_discount_slabs', i, 'max_qty', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.min_amount} onChange={e => handleRowChange('price_discount_slabs', i, 'min_amount', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.max_amount} onChange={e => handleRowChange('price_discount_slabs', i, 'max_amount', e.target.value)} /></td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.discount_type} onChange={e => handleRowChange('price_discount_slabs', i, 'discount_type', e.target.value)}>
                                                <option value="Percentage">Percentage</option>
                                                <option value="Amount">Amount</option>
                                            </select>
                                        </td>
                                        <td className={`${tdStyle} text-center`}>
                                            <button onClick={() => handleRemoveRow('price_discount_slabs', i)} className="text-red-400 hover:text-red-600 text-xs shadow-none">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.price_discount_slabs.length === 0 && renderEmptyTable()}
                    </div>
                    <button onClick={() => handleAddRow('price_discount_slabs', { min_qty: 0, max_qty: 0, min_amount: 0, max_amount: 0, discount_type: 'Percentage' })} className="mt-2 text-[11px] bg-white hover:bg-gray-100 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                        Add Row
                    </button>

                    <div className={sectionTitleStyle}>Product Discount Slabs</div>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={thStyle}>Min Qty</th>
                                    <th className={thStyle}>Max Qty</th>
                                    <th className={thStyle}>Min Amount</th>
                                    <th className={thStyle}>Max Amount</th>
                                    <th className={thStyle}>Item Code</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.product_discount_slabs.map((row, i) => (
                                    <tr key={i} className="bg-white border-b border-gray-100 last:border-0">
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.min_qty} onChange={e => handleRowChange('product_discount_slabs', i, 'min_qty', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.max_qty} onChange={e => handleRowChange('product_discount_slabs', i, 'max_qty', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.min_amount} onChange={e => handleRowChange('product_discount_slabs', i, 'min_amount', e.target.value)} /></td>
                                        <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.max_amount} onChange={e => handleRowChange('product_discount_slabs', i, 'max_amount', e.target.value)} /></td>
                                        <td className={tdStyle}>
                                            <select className={rowInputStyle} value={row.item_code} onChange={e => handleRowChange('product_discount_slabs', i, 'item_code', e.target.value)}>
                                                <option value="">Select Item</option>
                                                {itemsList.map(item => <option key={item.item_code} value={item.item_code}>{item.item_code}</option>)}
                                            </select>
                                        </td>
                                        <td className={`${tdStyle} text-center`}>
                                            <button onClick={() => handleRemoveRow('product_discount_slabs', i)} className="text-red-400 hover:text-red-600 text-xs shadow-none">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.product_discount_slabs.length === 0 && renderEmptyTable()}
                    </div>
                    <button onClick={() => handleAddRow('product_discount_slabs', { min_qty: 0, max_qty: 0, min_amount: 0, max_amount: 0, item_code: '' })} className="mt-2 text-[11px] bg-white hover:bg-gray-100 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                        Add Row
                    </button>
                    
                    <div className="flex gap-2 justify-end mt-4">
                        <button className="text-[11px] bg-white text-gray-600 font-semibold py-1 px-3 border rounded shadow-sm">Download</button>
                        <button className="text-[11px] bg-white text-gray-600 font-semibold py-1 px-3 border rounded shadow-sm">Upload</button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6">
            {/* Sticky Form Header */}
            <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-[#F5F6FA] py-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-1">
                            <h1 className="text-2xl font-semibold text-gray-800">
                                {editingRecord ? 'Edit Promotional Scheme' : 'New Promotional Scheme'}
                            </h1>
                            {!editingRecord ? (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4] ml-2">Not Saved</span>
                            ) : (
                                formData.disabled ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-red-50 text-red-600 font-medium border border-red-200 ml-2">Disabled</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-green-50 text-green-600 font-medium border border-green-200 ml-2">Active</span>
                                )
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {editingRecord && (
                        <button onClick={handleDelete} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition font-medium">Delete</button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-gray-900 text-white rounded hover:bg-black transition font-semibold disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden">
                <Tabs defaultActiveKey="details" items={tabItems} className="custom-tabs" />
            </div>
        </div>
    );
};

export default PromotionalScheme;
