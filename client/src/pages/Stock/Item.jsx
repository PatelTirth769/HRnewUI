import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm, Tabs, Dropdown, Button, Space, Modal } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const Item = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    // Website Item state
    const [isPublished, setIsPublished] = useState(false);
    const [websiteItemName, setWebsiteItemName] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);

    // Master data
    const [itemGroups, setItemGroups] = useState([]);
    const [uomsList, setUomsList] = useState([]);
    const [brands, setBrands] = useState([]);
    const [assetCategories, setAssetCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [itemTaxTemplates, setItemTaxTemplates] = useState([]);
    const [taxCategories, setTaxCategories] = useState([]);
    const [qualityTemplates, setQualityTemplates] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [customerGroups, setCustomerGroups] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [itemAttributes, setItemAttributes] = useState([]);

    const init = {
        item_code: '', item_name: '', item_group: '', stock_uom: 'Nos',
        disabled: 0, allow_alternative_item: 0, is_stock_item: 1, has_variants: 0,
        opening_stock: 0, valuation_rate: 0, standard_rate: 0, is_fixed_asset: 0,
        auto_create_assets_on_purchase: 0, asset_category: '', description: '', brand: '',
        uoms: [],
        // Purchasing
        purchase_uom: '', min_order_qty: 0, lead_time_days: 0, safety_stock: 0,
        is_customer_provided_item: 0, customer: '', allow_purchase: 1,
        country_of_origin: 'India', customs_tariff_number: '',
        delivered_by_supplier: 0, supplier_items: [],
        // Sales
        sales_uom: '', max_discount: 0, grant_commission: 1, allow_sales: 1,
        customer_items: [],
        // Tax
        taxes: [],
        // Quality
        inspection_required_before_purchase: 0, quality_inspection_template: '',
        inspection_required_before_delivery: 0,
        // Manufacturing
        include_item_in_manufacturing: 1, is_sub_contracted_item: 0,
        // Inventory
        shelf_life_in_days: 0, end_of_life: '2099-12-31', default_material_request_type: 'Purchase',
        valuation_method: '', warranty_period: 0, weight_per_unit: 0, weight_uom: '',
        allow_negative_stock: 0,
        barcodes: [], reorder_levels: [],
        has_batch_no: 0, create_new_batch: 0, batch_number_series: '',
        has_expiry_date: 0, retain_sample: 0, max_sample_qty: 0,
        has_serial_no: 0, serial_no_series: '',
        // Accounting
        enable_deferred_expense: 0, no_of_months_exp: 0,
        enable_deferred_revenue: 0, no_of_months: 0,
        item_defaults: [],
        // Variants
        variant_based_on: 'Item Attribute', attributes: []
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Item?fields=["name","item_name","item_group","stock_uom","disabled"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [ig, u, b, ac, co, cu, itt, tc, qi, sup, cg, wh, cmp, pl, attr] = await Promise.all([
                API.get('/api/resource/Item Group?fields=["name"]'),
                API.get('/api/resource/UOM?fields=["name"]'),
                API.get('/api/resource/Brand?fields=["name"]'),
                API.get('/api/resource/Asset Category?fields=["name"]'),
                API.get('/api/resource/Country?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Customer?fields=["name","customer_name"]&limit_page_length=500'),
                API.get('/api/resource/Item Tax Template?fields=["name"]'),
                API.get('/api/resource/Tax Category?fields=["name"]'),
                API.get('/api/resource/Quality Inspection Template?fields=["name"]'),
                API.get('/api/resource/Supplier?fields=["name","supplier_name"]&limit_page_length=500'),
                API.get('/api/resource/Customer Group?fields=["name"]'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name"]&limit_page_length=500'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Price List?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Item Attribute?fields=["name"]&limit_page_length=500')
            ]);
            setItemGroups(ig.data.data || []);
            setUomsList(u.data.data || []);
            setBrands(b.data.data || []);
            setAssetCategories(ac.data.data || []);
            setCountries(co.data.data || []);
            setCustomers(cu.data.data || []);
            setItemTaxTemplates(itt.data.data || []);
            setTaxCategories(tc.data.data || []);
            setQualityTemplates(qi.data.data || []);
            setSuppliers(sup.data.data || []);
            setCustomerGroups(cg.data.data || []);
            setWarehouses(wh.data.data || []);
            setCompanies(cmp.data.data || []);
            setPriceLists(pl.data.data || []);
            setItemAttributes(attr.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Item/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.uoms) d.uoms = [];
            if (!d.tax) d.tax = [];
            if (!d.taxes) d.taxes = [];
            if (!d.supplier_items) d.supplier_items = [];
            if (!d.customer_items) d.customer_items = [];
            if (!d.barcodes) d.barcodes = [];
            if (!d.reorder_levels) d.reorder_levels = [];
            if (!d.item_defaults) d.item_defaults = [];
            if (!d.attributes) d.attributes = [];
            setFormData(d);
            // Check if a Website Item already exists for this item
            try {
                const wi = await API.get(`/api/resource/Website Item?filters=[["item_code","=","${encodeURIComponent(n)}"]]&fields=["name"]&limit_page_length=1`);
                if (wi.data.data && wi.data.data.length > 0) {
                    setIsPublished(true);
                    setWebsiteItemName(wi.data.data[0].name);
                } else {
                    setIsPublished(false);
                    setWebsiteItemName(null);
                }
            } catch { setIsPublished(false); setWebsiteItemName(null); }
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handlePublish = async () => {
        if (!editingRecord) {
            notification.warning({ message: 'Please save the item first before publishing.' });
            return;
        }
        setPublishing(true);
        try {
            const payload = {
                item_code: formData.item_code || editingRecord,
                web_item_name: formData.item_name || formData.item_code || editingRecord,
                item_name: formData.item_name || formData.item_code || editingRecord,
                item_group: formData.item_group || '',
                stock_uom: formData.stock_uom || 'Nos',
                published: 1
            };
            const res = await API.post('/api/resource/Website Item', payload);
            const createdName = res.data.data?.name;
            setIsPublished(true);
            setWebsiteItemName(createdName || editingRecord);
            setPublishModalOpen(true);
        } catch (e) {
            const msg = e.response?.data?._server_messages
                ? JSON.parse(e.response.data._server_messages)[0]
                : (e.response?.data?.message || e.message);
            notification.error({ message: 'Publish Failed', description: msg });
        } finally { setPublishing(false); }
    };

    const handleSave = async () => {
        if (!formData.item_code || !formData.item_group || !formData.stock_uom) {
            notification.warning({ message: 'Item Code, Item Group, and Default UOM are required.' });
            return;
        }
        if (formData.is_fixed_asset && !formData.asset_category) {
            notification.warning({ message: 'Asset Category is required for Fixed Assets.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Item/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Item', formData);
                notification.success({ message: 'Created.' });
            }
            setView('list');
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Save Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Item/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    const showStock = !!formData.is_stock_item && !formData.has_variants;

    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Items</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    + New Item
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>{['Item Code', 'Item Name', 'Item Group', 'UOM', 'Status'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => (r.item_name || '').toLowerCase().includes(search.toLowerCase()) || (r.name || '').toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                    <td className="px-4 py-3">{r.item_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.item_group}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.stock_uom}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${!r.disabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {!r.disabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Spin>
            </div>
        </div>
    );

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Item Code *</label><input className={inp} value={formData.item_code} onChange={e => setFormData({ ...formData, item_code: e.target.value })} disabled={!!editingRecord} /></div>
                            <div><label className={lbl}>Item Name</label><input className={inp} value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} /></div>
                            <div><label className={lbl}>Item Group *</label>
                                <select className={inp} value={formData.item_group} onChange={e => setFormData({ ...formData, item_group: e.target.value })}>
                                    <option value="">Select Group</option>
                                    {itemGroups.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Default Unit of Measure *</label>
                                <select className={inp} value={formData.stock_uom} onChange={e => setFormData({ ...formData, stock_uom: e.target.value })}>
                                    <option value="">Select UOM</option>
                                    {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Disabled</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.allow_alternative_item} onChange={e => setFormData({ ...formData, allow_alternative_item: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Allow Alternative Item</span>
                                </label>
                                {!formData.is_fixed_asset && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!formData.is_stock_item} onChange={e => setFormData({ ...formData, is_stock_item: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                        <span className="text-sm font-semibold text-gray-700">Maintain Stock</span>
                                    </label>
                                )}
                                <div className="flex flex-col">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!formData.has_variants} onChange={e => setFormData({ ...formData, has_variants: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                        <span className="text-sm font-semibold text-gray-700">Has Variants</span>
                                    </label>
                                    <p className="text-[10px] text-gray-400 mt-1 pl-6">If this item has variants, then it cannot be selected in sales orders etc.</p>
                                </div>
                            </div>

                            {showStock && (
                                <>
                                    <div><label className={lbl}>Opening Stock</label><input type="number" className={inp} value={formData.opening_stock} onChange={e => setFormData({ ...formData, opening_stock: e.target.value })} /></div>
                                    <div><label className={lbl}>Valuation Rate</label><input type="number" className={inp} value={formData.valuation_rate} onChange={e => setFormData({ ...formData, valuation_rate: e.target.value })} /></div>
                                </>
                            )}

                            <div><label className={lbl}>Standard Selling Rate</label><input type="number" className={inp} value={formData.standard_rate} onChange={e => setFormData({ ...formData, standard_rate: e.target.value })} /></div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.is_fixed_asset} onChange={e => setFormData({ ...formData, is_fixed_asset: e.target.checked ? 1 : 0, is_stock_item: e.target.checked ? 0 : formData.is_stock_item })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Is Fixed Asset</span>
                                </label>
                                {!!formData.is_fixed_asset && (
                                    <>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!formData.auto_create_assets_on_purchase} onChange={e => setFormData({ ...formData, auto_create_assets_on_purchase: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-sm font-semibold text-gray-700">Auto Create Assets on Purchase</span>
                                        </label>
                                        <div>
                                            <label className={lbl}>Asset Category *</label>
                                            <select className={inp} value={formData.asset_category} onChange={e => setFormData({ ...formData, asset_category: e.target.value })}>
                                                <option value="">Select Category</option>
                                                {assetCategories.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Description</div>
                    <div>
                        <label className={lbl}>Description</label>
                        <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[120px]" placeholder="Enter item description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="mt-6">
                        <label className={lbl}>Brand</label>
                        <select className={inp + " max-w-md"} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                            <option value="">Select Brand</option>
                            {brands.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                        </select>
                    </div>

                    <div className={sec}>Units of Measure</div>
                    <p className="text-xs text-gray-500 mb-4">UOMs. Will also apply for variants</p>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>UOM</th>
                                    <th className={th}>Conversion Factor</th>
                                    <th className="w-10 px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white text-xs">
                                {formData.uoms.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.uom} onChange={e => chRow('uoms', i, 'uom', e.target.value)}>
                                                <option value="">Select UOM</option>
                                                {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.conversion_factor} onChange={e => chRow('uoms', i, 'conversion_factor', e.target.value)} /></td>
                                        <td className="px-4 py-3 text-center"><button onClick={() => rmRow('uoms', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <button onClick={() => addRow('uoms', { uom: '', conversion_factor: 1 })} className="text-[11px] font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">Add Row</button>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'variants',
            label: 'Variants',
            children: (
                <div className="space-y-6 animate-fade-in pb-8 mt-2">
                    <div className="max-w-md">
                        <label className={lbl}>Variant Based On</label>
                        <select className={inp} value={formData.variant_based_on} onChange={e => setFormData({ ...formData, variant_based_on: e.target.value })}>
                            <option value="Item Attribute">Item Attribute</option>
                            <option value="Manufacturer">Manufacturer</option>
                        </select>
                    </div>
                    
                    {formData.variant_based_on === 'Item Attribute' && (
                        <div className="mt-8">
                            <p className="text-xs text-gray-500 mb-2">Variant Attributes</p>
                            <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                        <tr>
                                            <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                            <th className="w-12 !px-4 !py-2 !font-semibold !text-gray-500">No.</th>
                                            <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Attribute *</th>
                                            <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Attribute Value</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(formData.attributes || []).length === 0 && (
                                            <tr><td colSpan="5" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                        )}
                                        {(formData.attributes || []).map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                                <td className="px-4 py-2 font-medium text-gray-500">{i + 1}</td>
                                                <td className="px-4 py-2">
                                                    <select className={ri} value={r.attribute} onChange={e => chRow('attributes', i, 'attribute', e.target.value)}>
                                                        <option value="">Select Attribute</option>
                                                        {itemAttributes.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2"><input className={ri} value={r.attribute_value} onChange={e => chRow('attributes', i, 'attribute_value', e.target.value)} /></td>
                                                <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('attributes', i)}>✕</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-3 bg-white border-t flex flex-col items-start gap-4">
                                    <button onClick={() => addRow('attributes', { attribute: '', attribute_value: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'inventory',
            label: 'Inventory',
            children: (
                <div className="space-y-8 animate-fade-in pb-8 mt-2">
                    {/* Inventory Settings */}
                    <div>
                        <div className={sec + " mb-4"}>Inventory Settings</div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <div><label className={lbl}>Shelf Life In Days *</label><input type="number" className={inp} value={formData.shelf_life_in_days} onChange={e => setFormData({ ...formData, shelf_life_in_days: e.target.value })} /></div>
                                <div><label className={lbl}>End of Life</label><input type="date" className={inp} value={formData.end_of_life} onChange={e => setFormData({ ...formData, end_of_life: e.target.value })} /></div>
                                <div>
                                    <label className={lbl}>Default Material Request Type</label>
                                    <select className={inp} value={formData.default_material_request_type} onChange={e => setFormData({ ...formData, default_material_request_type: e.target.value })}>
                                        <option value="">Select Type</option>
                                        <option value="Purchase">Purchase</option>
                                        <option value="Material Transfer">Material Transfer</option>
                                        <option value="Material Issue">Material Issue</option>
                                        <option value="Manufacture">Manufacture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={lbl}>Valuation Method</label>
                                    <select className={inp} value={formData.valuation_method} onChange={e => setFormData({ ...formData, valuation_method: e.target.value })}>
                                        <option value="">Select Method</option>
                                        <option value="FIFO">FIFO</option>
                                        <option value="Moving Average">Moving Average</option>
                                        <option value="LIFO">LIFO</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div><label className={lbl}>Warranty Period (in days)</label><input type="number" className={inp} value={formData.warranty_period} onChange={e => setFormData({ ...formData, warranty_period: e.target.value })} /></div>
                                <div><label className={lbl}>Weight Per Unit</label><input type="number" className={inp} value={formData.weight_per_unit} onChange={e => setFormData({ ...formData, weight_per_unit: e.target.value })} /></div>
                                <div>
                                    <label className={lbl}>Weight UOM</label>
                                    <select className={inp} value={formData.weight_uom} onChange={e => setFormData({ ...formData, weight_uom: e.target.value })}>
                                        <option value="">Select UOM</option>
                                        {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer pt-2">
                                    <input type="checkbox" checked={!!formData.allow_negative_stock} onChange={e => setFormData({ ...formData, allow_negative_stock: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Allow Negative Stock</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Barcodes */}
                    <div>
                        <div className={sec + " mb-2"}>Barcodes</div>
                        <p className="text-xs text-gray-500 mb-2">Barcodes</p>
                        <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                    <tr>
                                        <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                        <th className="w-12 !px-4 !py-2 !font-semibold !text-gray-500">No.</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Barcode *</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Barcode Type</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>UOM</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(formData.barcodes || []).length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                    )}
                                    {(formData.barcodes || []).map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                            <td className="px-4 py-2 font-medium text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-2"><input className={ri} value={r.barcode} onChange={e => chRow('barcodes', i, 'barcode', e.target.value)} /></td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.barcode_type} onChange={e => chRow('barcodes', i, 'barcode_type', e.target.value)}>
                                                    <option value="">Select Type</option>
                                                    <option value="UPC-A">UPC-A</option>
                                                    <option value="EAN-13">EAN-13</option>
                                                    <option value="EAN-8">EAN-8</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.uom} onChange={e => chRow('barcodes', i, 'uom', e.target.value)}>
                                                    <option value="">Select UOM</option>
                                                    {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('barcodes', i)}>✕</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-white border-t flex">
                                <button onClick={() => addRow('barcodes', { barcode: '', barcode_type: '', uom: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                            </div>
                        </div>
                    </div>

                    {/* Auto re-order */}
                    <div>
                        <div className={sec + " mb-2"}>Auto re-order</div>
                        <p className="text-sm text-gray-700">Reorder level based on Warehouse</p>
                        <p className="text-xs text-gray-500 mb-2">Will also apply for variants unless overridden</p>
                        <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                    <tr>
                                        <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                        <th className="w-12 !px-4 !py-2 !font-semibold !text-gray-500">No.</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Check in (group)</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Request for *</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Re-order Level</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Re-order Qty</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Material Request Type *</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(formData.reorder_levels || []).length === 0 && (
                                        <tr><td colSpan="8" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                    )}
                                    {(formData.reorder_levels || []).map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                            <td className="px-4 py-2 font-medium text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.material_request_type === 'Purchase' ? 'All Warehouses' : r.warehouse_group} onChange={e => chRow('reorder_levels', i, 'warehouse_group', e.target.value)}>
                                                    <option value="">Select Warehouse Group</option>
                                                    {warehouses.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.warehouse} onChange={e => chRow('reorder_levels', i, 'warehouse', e.target.value)}>
                                                    <option value="">Select Warehouse</option>
                                                    {warehouses.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 w-24"><input type="number" className={ri} value={r.warehouse_reorder_level} onChange={e => chRow('reorder_levels', i, 'warehouse_reorder_level', e.target.value)} /></td>
                                            <td className="px-4 py-2 w-24"><input type="number" className={ri} value={r.warehouse_reorder_qty} onChange={e => chRow('reorder_levels', i, 'warehouse_reorder_qty', e.target.value)} /></td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.material_request_type} onChange={e => chRow('reorder_levels', i, 'material_request_type', e.target.value)}>
                                                    <option value="">Select Type</option>
                                                    <option value="Purchase">Purchase</option>
                                                    <option value="Material Transfer">Material Transfer</option>
                                                    <option value="Material Issue">Material Issue</option>
                                                    <option value="Manufacture">Manufacture</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('reorder_levels', i)}>✕</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-white border-t flex">
                                <button onClick={() => addRow('reorder_levels', { warehouse_group: '', warehouse: '', warehouse_reorder_level: 0, warehouse_reorder_qty: 0, material_request_type: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                            </div>
                        </div>
                    </div>

                    {/* Serial Nos and Batches */}
                    <div>
                        <div className={sec + " mb-4"}>Serial Nos and Batches</div>
                        <div className="grid grid-cols-2 gap-x-12">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.has_batch_no} onChange={e => setFormData({ ...formData, has_batch_no: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Has Batch No</span>
                                </label>
                                {!!formData.has_batch_no && (
                                    <div className="space-y-4 bg-gray-50/50 p-4 rounded border border-gray-100 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!formData.create_new_batch} onChange={e => setFormData({ ...formData, create_new_batch: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-sm font-semibold text-gray-700">Automatically Create New Batch</span>
                                        </label>
                                        {!!formData.create_new_batch && (
                                            <div>
                                                <label className={lbl}>Batch Number Series</label>
                                                <input className={inp} value={formData.batch_number_series || ''} onChange={e => setFormData({ ...formData, batch_number_series: e.target.value })} />
                                                <p className="text-[10px] text-gray-400 mt-1 leading-snug">Example: ABCD.#####. If series is set and Batch No is not mentioned in transactions, then automatic batch number will be created based on this series. If you always want to explicitly mention Batch No for this item, leave this blank. Note: this setting will take priority over the Naming Series Prefix in Stock Settings.</p>
                                            </div>
                                        )}
                                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                                            <input type="checkbox" checked={!!formData.has_expiry_date} onChange={e => setFormData({ ...formData, has_expiry_date: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-sm font-semibold text-gray-700">Has Expiry Date</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!formData.retain_sample} onChange={e => setFormData({ ...formData, retain_sample: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span className="text-sm font-semibold text-gray-700">Retain Sample</span>
                                        </label>
                                        {!!formData.retain_sample && (
                                            <div>
                                                <label className={lbl}>Max Sample Quantity</label>
                                                <input type="number" className={inp} value={formData.max_sample_qty || ''} onChange={e => setFormData({ ...formData, max_sample_qty: e.target.value })} />
                                                <p className="text-[10px] text-gray-400 mt-1">Maximum sample quantity that can be retained</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.has_serial_no} onChange={e => setFormData({ ...formData, has_serial_no: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Has Serial No</span>
                                </label>
                                {!!formData.has_serial_no && (
                                    <div className="space-y-4 bg-gray-50/50 p-4 rounded border border-gray-100 mt-2">
                                        <div>
                                            <label className={lbl}>Serial Number Series</label>
                                            <input className={inp} value={formData.serial_no_series || ''} onChange={e => setFormData({ ...formData, serial_no_series: e.target.value })} />
                                            <p className="text-[10px] text-gray-400 mt-1 leading-snug">Example: ABCD.#####. If series is set and Serial No is not mentioned in transactions, then automatic serial number will be created based on this series. If you always want to explicitly mention Serial Nos for this item, leave this blank.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'accounting',
            label: 'Accounting',
            children: (
                <div className="space-y-6 animate-fade-in pb-8 mt-2">
                    <div className={sec + " mb-2"}>Deferred Accounting</div>
                    <div className="grid grid-cols-2 gap-x-12">
                        <div className="space-y-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!formData.enable_deferred_expense} onChange={e => setFormData({ ...formData, enable_deferred_expense: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Enable Deferred Expense</span>
                            </label>
                            {!!formData.enable_deferred_expense && (
                                <div><label className={lbl}>No of Months (Expense)</label><input type="number" className={inp} value={formData.no_of_months_exp} onChange={e => setFormData({ ...formData, no_of_months_exp: e.target.value })} /></div>
                            )}
                        </div>
                        <div className="space-y-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!formData.enable_deferred_revenue} onChange={e => setFormData({ ...formData, enable_deferred_revenue: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Enable Deferred Revenue</span>
                            </label>
                            {!!formData.enable_deferred_revenue && (
                                <div><label className={lbl}>No of Months (Revenue)</label><input type="number" className={inp} value={formData.no_of_months} onChange={e => setFormData({ ...formData, no_of_months: e.target.value })} /></div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="text-xs text-gray-500 mb-2">Item Defaults</p>
                        <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                    <tr>
                                        <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                        <th className="w-12 !px-4 !py-2 !font-semibold !text-gray-500">No.</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Company *</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Default Warehouse</th>
                                        <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Default Price List</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(formData.item_defaults || []).length === 0 && (
                                        <tr><td colSpan="6" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                    )}
                                    {(formData.item_defaults || []).map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                            <td className="px-4 py-2 font-medium text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.company} onChange={e => chRow('item_defaults', i, 'company', e.target.value)}>
                                                    <option value="">Select Company</option>
                                                    {companies.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.default_warehouse} onChange={e => chRow('item_defaults', i, 'default_warehouse', e.target.value)}>
                                                    <option value="">Select Warehouse</option>
                                                    {warehouses.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <select className={ri} value={r.default_price_list} onChange={e => chRow('item_defaults', i, 'default_price_list', e.target.value)}>
                                                    <option value="">Select Price List</option>
                                                    {priceLists.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('item_defaults', i)}>✕</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-white border-t flex">
                                <button onClick={() => addRow('item_defaults', { company: '', default_warehouse: '', default_price_list: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'purchasing',
            label: 'Purchasing',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Default Purchase Unit of Measure</label>
                                <select className={inp} value={formData.purchase_uom} onChange={e => setFormData({ ...formData, purchase_uom: e.target.value })}>
                                    <option value="">Select UOM</option>
                                    {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            {!!formData.is_stock_item && (
                                <div>
                                    <label className={lbl}>Minimum Order Qty</label>
                                    <input type="number" className={inp} value={formData.min_order_qty} onChange={e => setFormData({ ...formData, min_order_qty: e.target.value })} />
                                    <p className="text-[10px] text-gray-400 mt-1">Minimum quantity should be as per Stock UOM</p>
                                </div>
                            )}
                            <div><label className={lbl}>Safety Stock</label><input type="number" className={inp} value={formData.safety_stock} onChange={e => setFormData({ ...formData, safety_stock: e.target.value })} /></div>
                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                                <input type="checkbox" checked={!!formData.allow_purchase} onChange={e => setFormData({ ...formData, allow_purchase: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Allow Purchase</span>
                            </label>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Lead Time in days</label>
                                <input type="number" className={inp} value={formData.lead_time_days} onChange={e => setFormData({ ...formData, lead_time_days: e.target.value })} />
                                <p className="text-[10px] text-gray-400 mt-1">Average time taken by the supplier to deliver</p>
                            </div>
                            <div className="space-y-3 mt-8 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.is_customer_provided_item} onChange={e => setFormData({ ...formData, is_customer_provided_item: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Is Customer Provided Item</span>
                                </label>
                                {!!formData.is_customer_provided_item && (
                                    <div className="mt-2">
                                        <label className={lbl}>Customer *</label>
                                        <select className={inp} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                                            <option value="">Select Customer</option>
                                            {customers.map(x => <option key={x.name} value={x.name}>{x.customer_name} ({x.name})</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!formData.is_fixed_asset && (
                        <>
                            <div className={sec + " mt-8"}>Supplier Details</div>
                    <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!formData.delivered_by_supplier} onChange={e => setFormData({ ...formData, delivered_by_supplier: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Delivered by Supplier (Drop Ship)</span>
                            </label>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Supplier Items</p>
                            <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                        <tr>
                                            <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                            <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Supplier *</th>
                                            <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Supplier Part Number</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {(formData.supplier_items || []).length === 0 && (
                                            <tr><td colSpan="4" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                        )}
                                        {(formData.supplier_items || []).map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                                <td className="px-4 py-2">
                                                    <select className={ri} value={r.supplier} onChange={e => chRow('supplier_items', i, 'supplier', e.target.value)}>
                                                        <option value="">Select Supplier</option>
                                                        {suppliers.map(x => <option key={x.name} value={x.name}>{x.supplier_name} ({x.name})</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2"><input className={ri} value={r.supplier_part_no} onChange={e => chRow('supplier_items', i, 'supplier_part_no', e.target.value)} /></td>
                                                <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('supplier_items', i)}>✕</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="p-3 bg-white border-t flex">
                                    <button onClick={() => addRow('supplier_items', { supplier: '', supplier_part_no: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                                </div>
                                </div>
                            </div>
                        </div>
                        </>
                    )}

                    <div className={sec + " mt-8"}>Foreign Trade Details</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={lbl}>Country of Origin</label>
                            <select className={inp} value={formData.country_of_origin} onChange={e => setFormData({ ...formData, country_of_origin: e.target.value })}>
                                <option value="">Select Country</option>
                                {countries.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                            </select>
                        </div>
                        <div><label className={lbl}>Customs Tariff Number</label><input className={inp} value={formData.customs_tariff_number} onChange={e => setFormData({ ...formData, customs_tariff_number: e.target.value })} /></div>
                    </div>
                </div>
            ),
        },
        {
            key: 'sales',
            label: 'Sales',
            children: (
                <div className="space-y-6 animate-fade-in pb-8 mt-2">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Default Sales Unit of Measure</label>
                                <select className={inp} value={formData.sales_uom} onChange={e => setFormData({ ...formData, sales_uom: e.target.value })}>
                                    <option value="">Select UOM</option>
                                    {uomsList.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                                <input type="checkbox" checked={!!formData.grant_commission} onChange={e => setFormData({ ...formData, grant_commission: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Grant Commission</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={!!formData.allow_sales} onChange={e => setFormData({ ...formData, allow_sales: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Allow Sales</span>
                            </label>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Max Discount (%)</label><input type="number" className={inp} value={formData.max_discount} onChange={e => setFormData({ ...formData, max_discount: e.target.value })} /></div>
                        </div>
                    </div>

                    {!formData.is_fixed_asset && (
                        <>
                            <div className={sec + " mt-8"}>Customer Details</div>
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Customer Items</p>
                                <div className="border border-gray-200 rounded overflow-hidden text-xs bg-gray-50">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#f8f9fa] border-b border-gray-100">
                                            <tr>
                                                <th className="w-8 !px-2 !py-2 text-center text-gray-400"><input type="checkbox" disabled /></th>
                                                <th className="w-12 !px-4 !py-2 !font-semibold !text-gray-500">No.</th>
                                                <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Customer Name</th>
                                                <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Customer Group</th>
                                                <th className={"!px-4 !py-2 !font-semibold !text-gray-500"}>Ref Code *</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {(formData.customer_items || []).length === 0 && (
                                                <tr><td colSpan="6" className="text-center py-8 text-gray-400 flex flex-col items-center justify-center gap-2"><svg className="w-8 h-8 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h2"/></svg><span>No Data</span></td></tr>
                                            )}
                                            {(formData.customer_items || []).map((r, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50">
                                                    <td className="w-8 px-2 py-2 text-center"><input type="checkbox" /></td>
                                                    <td className="px-4 py-2 font-medium text-gray-500">{i + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <select className={ri} value={r.customer_name} onChange={e => chRow('customer_items', i, 'customer_name', e.target.value)}>
                                                            <option value="">Select Customer</option>
                                                            {customers.map(x => <option key={x.name} value={x.name}>{x.customer_name} ({x.name})</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <select className={ri} value={r.customer_group} onChange={e => chRow('customer_items', i, 'customer_group', e.target.value)}>
                                                            <option value="">Select Group</option>
                                                            {customerGroups.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2"><input className={ri} value={r.ref_code} onChange={e => chRow('customer_items', i, 'ref_code', e.target.value)} /></td>
                                                    <td className="px-4 py-2 text-center text-red-400 hover:text-red-600 cursor-pointer" onClick={() => rmRow('customer_items', i)}>✕</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-3 bg-white border-t flex">
                                        <button onClick={() => addRow('customer_items', { customer_name: '', customer_group: '', ref_code: '' })} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition border">Add Row</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: 'tax',
            label: 'Tax',
            children: (
                <div className="space-y-4 animate-fade-in pb-8">
                    <p className="text-sm text-gray-600 font-medium">Taxes</p>
                    <p className="text-xs text-gray-400">Will also apply for variants</p>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>Item Tax Template *</th>
                                    <th className={th}>Tax Category</th>
                                    <th className={th}>Valid From</th>
                                    <th className={th}>Minimum Net Rate</th>
                                    <th className={th}>Maximum Net Rate</th>
                                    <th className="w-10 px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white text-xs">
                                {(formData.taxes || []).map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.item_tax_template} onChange={e => chRow('taxes', i, 'item_tax_template', e.target.value)}>
                                                <option value="">Select Template</option>
                                                {itemTaxTemplates.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.tax_category} onChange={e => chRow('taxes', i, 'tax_category', e.target.value)}>
                                                <option value="">Select Category</option>
                                                {taxCategories.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3"><input type="date" className={ri} value={r.valid_from} onChange={e => chRow('taxes', i, 'valid_from', e.target.value)} /></td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.minimum_net_rate} onChange={e => chRow('taxes', i, 'minimum_net_rate', e.target.value)} /></td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.maximum_net_rate} onChange={e => chRow('taxes', i, 'maximum_net_rate', e.target.value)} /></td>
                                        <td className="px-4 py-3 text-center"><button onClick={() => rmRow('taxes', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <button onClick={() => addRow('taxes', { item_tax_template: '', tax_category: '', valid_from: '', minimum_net_rate: 0, maximum_net_rate: 0 })} className="text-[11px] font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">Add Row</button>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'quality',
            label: 'Quality',
            children: (
                <div className="space-y-6 animate-fade-in pb-8 max-w-md">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!formData.inspection_required_before_purchase} onChange={e => setFormData({ ...formData, inspection_required_before_purchase: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">Inspection Required before Purchase</span>
                    </label>
                    <div><label className={lbl}>Quality Inspection Template</label>
                        <select className={inp} value={formData.quality_inspection_template} onChange={e => setFormData({ ...formData, quality_inspection_template: e.target.value })}>
                            <option value="">Select Template</option>
                            {qualityTemplates.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!formData.inspection_required_before_delivery} onChange={e => setFormData({ ...formData, inspection_required_before_delivery: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">Inspection Required before Delivery</span>
                    </label>
                </div>
            ),
        },
        {
            key: 'manufacturing',
            label: 'Manufacturing',
            children: (
                <div className="space-y-4 animate-fade-in pb-8 mt-2 max-w-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={!!formData.include_item_in_manufacturing} onChange={e => setFormData({ ...formData, include_item_in_manufacturing: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">Include Item In Manufacturing</span>
                    </label>

                    <div className="mt-4 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={!!formData.is_sub_contracted_item} onChange={e => setFormData({ ...formData, is_sub_contracted_item: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm font-semibold text-gray-700">Supply Raw Materials for Purchase</span>
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1 pl-6">If subcontracted to a vendor</p>
                    </div>
                </div>
            )
        }
    ];

    const actionMenuItems = [
        { key: 'prices', label: 'Add / Edit Prices' },
        ...(!isPublished ? [{ key: 'publish', label: 'Publish in Website', onClick: handlePublish }] : []),
    ];

    const viewMenuItems = [
        { key: 'view', label: 'View' },
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord || 'New Item'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${!formData.disabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {!formData.disabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300">
                            View <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                            Actions <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Button className="h-8 text-[13px] border-gray-300">Duplicate</Button>

                    {isPublished && websiteItemName && (
                        <Button
                            className="flex items-center gap-1 h-8 text-[13px] border-gray-300 font-medium"
                            onClick={() => navigate(`/selling/website-item?open=${encodeURIComponent(websiteItemName)}`)}
                        >
                            View Website Item <FiExternalLink size={13} />
                        </Button>
                    )}

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    <button className="px-5 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this item?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems.filter(t => (!['inventory', 'manufacturing'].includes(t.key) || !!formData.is_stock_item) && (t.key !== 'variants' || !!formData.has_variants) && (t.key !== 'accounting' || !formData.is_fixed_asset))} className="custom-item-tabs" />
                )}
            </div>

            {/* Published Success Modal */}
            <Modal
                open={publishModalOpen}
                onCancel={() => setPublishModalOpen(false)}
                footer={null}
                centered
                width={480}
                closable={true}
                className="publish-modal"
            >
                <div className="py-2">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                        <span className="text-lg font-bold text-gray-900">Published</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600">
                            Website Item <strong className="text-gray-900 underline">{formData.item_name || editingRecord}</strong> has been created.
                        </p>
                    </div>
                </div>
            </Modal>

            <style>{`
                .custom-item-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f3f4f6; }
                .custom-item-tabs .ant-tabs-tab { padding: 12px 0; margin: 0 32px 0 0; color: #6b7280; font-size: 14px; }
                .custom-item-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #111827 !important; font-weight: 700; }
                .custom-item-tabs .ant-tabs-ink-bar { background: #111827; height: 3px !important; border-radius: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default Item;
