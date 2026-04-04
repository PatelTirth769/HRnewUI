import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs } from 'antd';
import API from '../../services/api';

const PricingRule = () => {
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
    const [warehouses, setWarehouses] = useState([]);

    const initialFormState = {
        naming_series: 'PRLE-.####',
        title: '',
        disable: 0,
        apply_on: 'Item Code',
        price_or_product_discount: 'Price',
        warehouse: '',
        items: [],
        mixed_conditions: 0,
        is_cumulative: 0,
        coupon_code_based: 0,
        apply_rule_on_other: '',
        other_item_code: '',
        other_item_group: '',
        other_brand: '',
        selling: 1,
        buying: 0,
        applicable_for: '',
        min_qty: 0,
        max_qty: 0,
        min_amt: 0,
        max_amt: 0,
        valid_from: new Date().toISOString().split('T')[0],
        valid_upto: '',
        company: '',
        currency: 'INR',
        margin_type: 'Percentage',
        margin_rate_or_amount: 0,
        rate_or_discount: 'Discount Percentage',
        discount_percentage: 0,
        for_price_list: '',
        condition: '',
        apply_multiple_pricing_rules: 0,
        apply_discount_on_discounted_rate: 0,
        suggestion_threshold: 0,
        validate_applied_rule: 0,
        rule_description: '',
        has_priority: 0,
        priority: 0
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
            const res = await API.get('/api/resource/Pricing Rule?fields=["name","title","apply_on","disable","company"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch pricing rules' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [itemRes, groupRes, brandRes, compRes, whRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["item_code","item_name","stock_uom"]&limit_page_length=None'),
                API.get('/api/resource/Item Group?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Brand?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Warehouse?fields=["name"]')
            ]);
            setItemsList(itemRes.data.data || []);
            setItemGroups(groupRes.data.data || []);
            setBrands(brandRes.data.data || []);
            setCompanies(compRes.data.data || []);
            setWarehouses(whRes.data.data || []);
            if (!formData.company && compRes.data.data.length > 0) {
                setFormData(prev => ({ ...prev, company: compRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Pricing Rule/${encodeURIComponent(name)}`);
            const data = res.data.data;
            setFormData({
                ...data,
                items: data.items || []
            });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title && !editingRecord) {
            notification.warning({ message: 'Validation Error', description: 'Title is required.' });
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
                await API.put(`/api/resource/Pricing Rule/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Pricing Rule updated successfully.' });
            } else {
                await API.post('/api/resource/Pricing Rule', payload);
                notification.success({ message: 'Pricing Rule created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
        try {
            await API.delete(`/api/resource/Pricing Rule/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
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
        const filtered = records.filter(r => (r.title || '').toLowerCase().includes(search.toLowerCase()) || (r.name || '').toLowerCase().includes(search.toLowerCase()));
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Pricing Rules</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Pricing Rule
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search by name or title..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} records</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Title</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Apply On</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Company</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching records...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No records found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-700 font-medium">{r.title}</td>
                                        <td className="px-5 py-4 text-gray-700">{r.apply_on}</td>
                                        <td className="px-5 py-4 text-gray-500">{r.company}</td>
                                        <td className="px-5 py-4 text-center">
                                            {r.disable ? (
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
                                <label className={labelStyle}>Naming Series</label>
                                <select className={inputStyle} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={editingRecord}>
                                    <option value="PRLE-.####">PRLE-.####</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Title *</label>
                                <input className={inputStyle} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Bulk Discount Q4" />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="disable_chk" checked={!!formData.disable} onChange={e => setFormData({ ...formData, disable: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="disable_chk" className="text-sm font-semibold text-gray-700">Disable</label>
                            </div>
                            <div>
                                <label className={labelStyle}>Apply On *</label>
                                <select className={inputStyle} value={formData.apply_on} onChange={e => setFormData({ ...formData, apply_on: e.target.value })}>
                                    <option value="Item Code">Item Code</option>
                                    <option value="Item Group">Item Group</option>
                                    <option value="Brand">Brand</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Price or Product Discount *</label>
                                <select className={inputStyle} value={formData.price_or_product_discount} onChange={e => setFormData({ ...formData, price_or_product_discount: e.target.value })}>
                                    <option value="Price">Price</option>
                                    <option value="Product">Product</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Warehouse</label>
                                <select className={inputStyle} value={formData.warehouse} onChange={e => setFormData({ ...formData, warehouse: e.target.value })}>
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm text-gray-800 font-semibold mb-2">Apply Rule On Item Code</label>
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
                                                    <button onClick={() => handleRemoveRow('items', i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
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
                            <div className="space-y-3 pt-6">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="mixed_chk" checked={!!formData.mixed_conditions} onChange={e => setFormData({ ...formData, mixed_conditions: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="mixed_chk" className="text-xs font-semibold text-gray-700">Mixed Conditions</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="cumul_chk" checked={!!formData.is_cumulative} onChange={e => setFormData({ ...formData, is_cumulative: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="cumul_chk" className="text-xs font-semibold text-gray-700">Is Cumulative</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="coupon_chk" checked={!!formData.coupon_code_based} onChange={e => setFormData({ ...formData, coupon_code_based: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="coupon_chk" className="text-xs font-semibold text-gray-700">Coupon Code Based</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!formData.mixed_conditions && (
                        <>
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
                        </>
                    )}

                    <div className={sectionTitleStyle}>Party Information</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="selling_chk" checked={!!formData.selling} onChange={e => setFormData({ ...formData, selling: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="selling_chk" className="text-sm font-semibold text-gray-700">Selling</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="buying_chk" checked={!!formData.buying} onChange={e => setFormData({ ...formData, buying: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="buying_chk" className="text-sm font-semibold text-gray-700">Buying</label>
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

                    <div className={sectionTitleStyle}>Quantity and Amount</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Min Qty (As Per Stock UOM)</label>
                                <input type="number" className={inputStyle} value={formData.min_qty} onChange={e => setFormData({ ...formData, min_qty: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Max Qty (As Per Stock UOM)</label>
                                <input type="number" className={inputStyle} value={formData.max_qty} onChange={e => setFormData({ ...formData, max_qty: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Min Amt</label>
                                <input type="number" className={inputStyle} value={formData.min_amt} onChange={e => setFormData({ ...formData, min_amt: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Max Amt</label>
                                <input type="number" className={inputStyle} value={formData.max_amt} onChange={e => setFormData({ ...formData, max_amt: e.target.value })} />
                            </div>
                        </div>
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
                                <label className={labelStyle}>Currency *</label>
                                <input className={inputStyle} value={formData.currency} readOnly disabled />
                            </div>
                        </div>
                    </div>

                    <div className={sectionTitleStyle}>Margin</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div>
                            <label className={labelStyle}>Margin Type</label>
                            <select className={inputStyle} value={formData.margin_type} onChange={e => setFormData({ ...formData, margin_type: e.target.value })}>
                                <option value="Percentage">Percentage</option>
                                <option value="Amount">Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Margin Rate or Amount</label>
                            <input type="number" className={inputStyle} value={formData.margin_rate_or_amount} onChange={e => setFormData({ ...formData, margin_rate_or_amount: e.target.value })} />
                        </div>
                    </div>

                    <div className={sectionTitleStyle}>Price Discount Scheme</div>
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Rate or Discount</label>
                                <select className={inputStyle} value={formData.rate_or_discount} onChange={e => setFormData({ ...formData, rate_or_discount: e.target.value })}>
                                    <option value="Discount Percentage">Discount Percentage</option>
                                    <option value="Discount Amount">Discount Amount</option>
                                    <option value="Rate">Rate</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Discount Percentage</label>
                                <input type="number" className={inputStyle} value={formData.discount_percentage} onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>For Price List</label>
                                <input className={inputStyle} value={formData.for_price_list} onChange={e => setFormData({ ...formData, for_price_list: e.target.value })} placeholder="Enter Price List..." />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'condition',
            label: 'Dynamic Condition',
            children: (
                <div className="space-y-4 pb-8">
                    <div className="mt-4">
                        <label className={labelStyle}>Condition</label>
                        <textarea className={`${inputStyle} h-64 font-mono text-xs bg-gray-50/30 border-gray-100 focus:bg-white transition-all`} value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} placeholder="# Simple Python Expression, Example: territory != 'All Territories'" />
                        <p className="mt-2 text-[11px] text-gray-400">Simple Python Expression, Example: <code className="bg-gray-100 px-1 rounded text-gray-600 font-medium">territory != 'All Territories'</code></p>
                        <button className="mt-3 px-3 py-1 text-[11px] bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600 font-medium transition shadow-sm">Expand</button>
                    </div>
                </div>
            )
        },
        {
            key: 'advanced',
            label: 'Advanced Settings',
            children: (
                <div className="space-y-8 pb-8">
                    <div className="grid grid-cols-[1fr,1fr] gap-12 mt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="mult_rule_chk" checked={!!formData.apply_multiple_pricing_rules} onChange={e => setFormData({ ...formData, apply_multiple_pricing_rules: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                <label htmlFor="mult_rule_chk" className="text-sm font-semibold text-gray-700">Apply Multiple Pricing Rules</label>
                            </div>
                            {formData.apply_multiple_pricing_rules === 1 && (
                                <div className="flex items-center gap-2 ml-6 transition-all animate-in fade-in slide-in-from-left-2">
                                    <input type="checkbox" id="disc_on_disc_chk" checked={!!formData.apply_discount_on_discounted_rate} onChange={e => setFormData({ ...formData, apply_discount_on_discounted_rate: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="disc_on_disc_chk" className="text-sm font-semibold text-gray-700">Apply Discount on Discounted Rate</label>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className={labelStyle}>Threshold for Suggestion (In Percentage)</label>
                            <input type="number" className={inputStyle} value={formData.suggestion_threshold} onChange={e => setFormData({ ...formData, suggestion_threshold: e.target.value })} />
                            <p className="text-[11px] text-gray-400">System will notify to increase or decrease quantity or amount</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={sectionTitleStyle}>Validate Pricing Rule</div>
                        <div className="grid grid-cols-[1.5fr,1fr] gap-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="val_rule_chk" checked={!!formData.validate_applied_rule} onChange={e => setFormData({ ...formData, validate_applied_rule: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="val_rule_chk" className="text-sm font-semibold text-gray-700">Validate Applied Rule</label>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed pr-8">If enabled, then system will only validate the pricing rule and not apply automatically. User has to manually set the discount percentage / margin / free items to validate the pricing rule</p>
                            </div>
                            {formData.validate_applied_rule === 1 && (
                                <div className="space-y-2 transition-all animate-in fade-in slide-in-from-right-4">
                                    <label className={labelStyle}>Rule Description</label>
                                    <textarea className={`${inputStyle} h-40 resize-none`} value={formData.rule_description} onChange={e => setFormData({ ...formData, rule_description: e.target.value })} placeholder="Write description here..." />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={sectionTitleStyle}>Priority</div>
                        <div className="grid grid-cols-[1.5fr,1fr] gap-12">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="has_prio_chk" checked={!!formData.has_priority} onChange={e => setFormData({ ...formData, has_priority: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" />
                                    <label htmlFor="has_prio_chk" className="text-sm font-semibold text-gray-700">Has Priority</label>
                                </div>
                                <p className="text-[12px] text-gray-500 leading-relaxed pr-8">Enable this checkbox even if you want to set the zero priority</p>
                            </div>
                            {formData.has_priority === 1 && (
                                <div className="space-y-2 transition-all animate-in fade-in slide-in-from-right-4">
                                    <label className={labelStyle}>Priority</label>
                                    <select className={inputStyle} value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                        {[...Array(21)].map((_, i) => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                    <p className="text-[11px] text-gray-400">Higher the number, higher the priority</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'help',
            label: 'Help Article',
            children: (
                <div className="py-6 space-y-8 pr-8">
                    <div className="bg-gray-50/50 rounded-xl p-8 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Notes
                        </h2>
                        <ul className="space-y-4 text-[13px] text-gray-600 list-disc pl-5 leading-relaxed">
                            <li>Pricing Rule is made to overwrite Price List / define discount percentage, based on some criteria.</li>
                            <li>If selected Pricing Rule is made for 'Rate', it will overwrite Price List. Pricing Rule rate is the final rate, so no further discount should be applied. Hence, in transactions like Sales Order, Purchase Order etc, it will be fetched in 'Rate' field, rather than 'Price List Rate' field.</li>
                            <li>Discount Percentage can be applied either against a Price List or for all Price List.</li>
                            <li>To not apply Pricing Rule in a particular transaction, all applicable Pricing Rules should be disabled.</li>
                        </ul>
                    </div>

                    <div className="px-2">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            How Pricing Rule is applied?
                        </h2>
                        <ol className="space-y-5 text-[13px] text-gray-600 list-decimal pl-5 leading-relaxed">
                            <li className="pl-2">Pricing Rule is first selected based on <span className="font-semibold text-gray-800">'Apply On'</span> field, which can be Item, Item Group or Brand.</li>
                            <li className="pl-2">Then Pricing Rules are filtered out based on <span className="font-semibold text-gray-800">Customer, Customer Group, Territory, Supplier, Supplier Type, Campaign, Sales Partner etc.</span></li>
                            <li className="pl-2">Pricing Rules are further filtered based on <span className="font-semibold text-gray-800">quantity</span>.</li>
                            <li className="pl-2">If two or more Pricing Rules are found based on the above conditions, <span className="font-semibold text-gray-800">Priority</span> is applied. Priority is a number between 0 to 20 while default value is zero (blank). Higher number means it will take precedence if there are multiple Pricing Rules with same conditions.</li>
                            <li className="pl-2">
                                Even if there are multiple Pricing Rules with highest priority, then following internal priorities are applied:
                                <ul className="mt-3 space-y-2 list-none border-l-2 border-gray-100 pl-4 ml-1 italic text-gray-500">
                                    <li>• Item Code {`>`} Item Group {`>`} Brand</li>
                                    <li>• Customer {`>`} Customer Group {`>`} Territory</li>
                                    <li>• Supplier {`>`} Supplier Type</li>
                                </ul>
                            </li>
                            <li className="pl-2">If multiple Pricing Rules continue to prevail, users are asked to set Priority manually to resolve conflict.</li>
                        </ol>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-[#F5F6FA] py-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-gray-200 rounded-md transition-colors text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-1">
                            <h1 className="text-2xl font-semibold text-gray-800">
                                {editingRecord ? `Edit Pricing Rule: ${editingRecord}` : 'New Pricing Rule'}
                            </h1>
                            {!editingRecord ? (
                                <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4] ml-2">Not Saved</span>
                            ) : (
                                formData.disable ? (
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

export default PricingRule;
