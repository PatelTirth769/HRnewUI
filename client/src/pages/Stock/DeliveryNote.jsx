import React, { useState, useEffect } from 'react';
import { notification, Spin, Dropdown, Button, Space, Popconfirm, Tabs, Select, Divider, Input, Checkbox } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiSearch, FiSettings, FiEdit2, FiTrash2, FiPlus, FiMaximize2, FiDownload, FiUpload, FiTruck, FiUser, FiFileText, FiTag, FiFile } from 'react-icons/fi';
import API from '../../services/api';

const { TextArea } = Input;

const DeliveryNote = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    // Masters Dropdowns
    const [customers, setCustomers] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [warehousesList, setWarehousesList] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [priceLists, setPriceLists] = useState([]);
    const [taxTemplates, setTaxTemplates] = useState([]);
    const [shippingRules, setShippingRules] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [salesPartners, setSalesPartners] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);

    const initialFormState = {
        naming_series: 'MAT-DN-.YYYY.-',
        customer: '',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toLocaleTimeString('en-GB'),
        set_posting_time: 0,
        is_return: 0,
        company: '',
        project: '',
        cost_center: '',
        currency: 'INR',
        selling_price_list: 'Standard Selling',
        ignore_pricing_rule: 0,
        scan_barcode: '',
        set_warehouse: '',
        items: [],
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        taxes_and_charges: '',
        taxes: [],
        total_qty: 0,
        total: 0,
        base_total: 0,
        total_taxes_and_charges: 0,
        apply_discount_on: 'Grand Total',
        additional_discount_percentage: 0,
        discount_amount: 0,
        grand_total: 0,
        base_grand_total: 0,
        rounding_adjustment: 0,
        rounded_total: 0,
        // Address & Contact
        shipping_address_name: '',
        dispatch_address_name: '',
        company_address_name: '',
        company_contact_person: '',
        // Terms
        terms_template: '',
        terms: '',
        // More Info
        status: 'Draft',
        transporter: '',
        driver_name: '',
        driver: '',
        lr_date: new Date().toISOString().split('T')[0],
        lr_no: '',
        vehicle_no: '',
        po_no: '',
        po_date: '',
        sales_partner: '',
        commission_rate: 0,
        amount_eligible_for_commission: 0,
        total_commission: 0,
        sales_team: [],
        letter_head: '',
        print_heading: '',
        print_without_amount: 0,
        group_same_items: 0,
        is_internal_customer: 0,
        inter_company_reference: '',
        territory: '',
        source: '',
        campaign: '',
        instructions: ''
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

    useEffect(() => {
        calculateTotals();
    }, [formData.items, formData.taxes, formData.discount_amount, formData.additional_discount_percentage, formData.apply_discount_on, formData.commission_rate]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Delivery Note?fields=["name","customer","posting_date","grand_total","company"]&limit_page_length=500&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch delivery notes' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [custRes, itemRes, whRes, projRes, cmpRes, ccRes, plRes, ttRes, srRes, accRes, spRes, sprRes] = await Promise.all([
                API.get('/api/resource/Customer?fields=["name","customer_name"]&limit_page_length=500'),
                API.get('/api/resource/Item?fields=["name","item_code","item_name","stock_uom"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name","company"]&limit_page_length=500'),
                API.get('/api/resource/Project?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Price List?fields=["name"]&filters=[["enabled","=",1]]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Sales Taxes and Charges Template?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Shipping Rule?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Account?fields=["name"]&filters=[["root_type","=","Liability"]]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Sales Partner?fields=["name"]&limit_page_length=500').catch(() => ({data:{data:[]}})),
                API.get('/api/resource/Sales Person?fields=["name","sales_person_name"]&limit_page_length=500').catch(() => ({data:{data:[]}}))
            ]);
            
            setCustomers(custRes.data?.data || []);
            const items = itemRes.data?.data || [];
            if (items.length > 0) setItemsList(items.map(i => ({ ...i, item_code: i.item_code || i.name })));
            setWarehousesList(whRes.data?.data || []);
            setProjects(projRes.data?.data || []);
            setCompanies(cmpRes.data?.data || []);
            setCostCenters(ccRes.data?.data || []);
            setPriceLists(plRes.data?.data || []);
            setTaxTemplates(ttRes.data?.data || []);
            setShippingRules(srRes.data?.data || []);
            setAccounts(accRes.data?.data || []);
            setSalesPartners(spRes.data?.data || []);
            setSalesPersons(sprRes.data?.data || []);

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
            const res = await API.get(`/api/resource/Delivery Note/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.items) data.items = [];
            if (!data.taxes) data.taxes = [];
            if (!data.sales_team) data.sales_team = [];
            setFormData({ ...initialFormState, ...data });
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        let totalQty = 0;
        let totalAmount = 0;

        (formData.items || []).forEach(item => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            item.amount = qty * rate;
            totalQty += qty;
            totalAmount += item.amount;
        });

        let currentTotal = totalAmount;
        let totalTaxAmount = 0;
        (formData.taxes || []).forEach(tax => {
            const rate = parseFloat(tax.rate) || 0;
            let tax_amount = 0;
            if (tax.charge_type === 'On Net Total') {
                tax_amount = (totalAmount * rate) / 100;
            } else if (tax.charge_type === 'Actual') {
                tax_amount = parseFloat(tax.tax_amount) || 0;
            }
            totalTaxAmount += tax_amount;
            currentTotal += tax_amount;
            tax.tax_amount = tax_amount;
            tax.total = currentTotal;
        });

        let grandTotal = totalAmount + totalTaxAmount;
        
        let discountAmount = parseFloat(formData.discount_amount) || 0;
        if (parseFloat(formData.additional_discount_percentage) > 0) {
            const baseForDiscount = formData.apply_discount_on === 'Net Total' ? totalAmount : grandTotal;
            discountAmount = (baseForDiscount * parseFloat(formData.additional_discount_percentage)) / 100;
        }
        
        grandTotal -= discountAmount;
        const roundedTotal = formData.disable_rounded_total ? grandTotal : Math.round(grandTotal);
        const roundingAdjustment = roundedTotal - grandTotal;

        // Commission Logic
        const amountEligibleForCommission = totalAmount; // Generally net total
        const totalCommission = (amountEligibleForCommission * (parseFloat(formData.commission_rate) || 0)) / 100;

        if (formData.total_qty !== totalQty || formData.total !== totalAmount || formData.grand_total !== grandTotal || formData.total_commission !== totalCommission) {
            setFormData(prev => ({
                ...prev,
                total_qty: totalQty,
                total: totalAmount,
                base_total: totalAmount,
                total_taxes_and_charges: totalTaxAmount,
                discount_amount: discountAmount,
                grand_total: grandTotal,
                base_grand_total: grandTotal,
                rounding_adjustment: roundingAdjustment,
                rounded_total: roundedTotal,
                amount_eligible_for_commission: amountEligibleForCommission,
                total_commission: totalCommission,
                disable_rounded_total: prev.disable_rounded_total
            }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = { ...formData, docstatus: 0 };
            if (editingRecord) {
                await API.put(`/api/resource/Delivery Note/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Success', description: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Delivery Note', payload);
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
            await API.delete(`/api/resource/Delivery Note/${encodeURIComponent(editingRecord)}`);
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
            items: [...formData.items, { item_code: '', qty: 0, uom: '', rate: 0, amount: 0, warehouse: formData.set_warehouse }]
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

    const handleTaxRowChange = (index, field, value) => {
        const newTaxes = [...formData.taxes];
        newTaxes[index][field] = value;
        setFormData({ ...formData, taxes: newTaxes });
    };

    const handleAddTaxRow = () => {
        setFormData({
            ...formData,
            taxes: [...formData.taxes, { charge_type: 'On Net Total', account_head: '', description: '', rate: 0, tax_amount: 0, total: 0 }]
        });
    };

    const handleSalesTeamRowChange = (index, field, value) => {
        const newTeam = [...formData.sales_team];
        newTeam[index][field] = value;
        if (field === 'contact_percentage') {
            newTeam[index].allocated_amount = (formData.total * (parseFloat(value) || 0)) / 100;
        }
        setFormData({ ...formData, sales_team: newTeam });
    };

    const handleAddSalesTeamRow = () => {
        setFormData({
            ...formData,
            sales_team: [...formData.sales_team, { sales_person: '', contact_percentage: 100, allocated_amount: formData.total, incentives: 0 }]
        });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 transition-all";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sectionTitleStyle = "font-bold text-gray-800 text-sm mb-6 flex items-center justify-between group cursor-pointer";
    const readonlyInputStyle = "w-full border border-gray-100 rounded px-3 py-2 text-sm bg-[#F9FAFB] text-gray-600 focus:outline-none font-bold";

    if (view === 'list') {
        const filtered = records.filter(r => 
            (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.customer || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Delivery Notes</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRecords} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Delivery Note
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" className="border border-gray-300 rounded px-3 py-2 pl-9 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all" placeholder="Search ID or Customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Customer</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-right">Grand Total</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Company</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Delivery Notes found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                                {r.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-700">{r.customer}</td>
                                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{r.posting_date}</td>
                                        <td className="px-5 py-4 text-right font-bold text-gray-800">₹{parseFloat(r.grand_total).toLocaleString()}</td>
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
                                <select className={inputStyle} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={editingRecord}>
                                    <option value="MAT-DN-.YYYY.-">MAT-DN-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Customer *</label>
                                <select className={inputStyle} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                                    <option value="">Select Customer...</option>
                                    {customers.map(c => <option key={c.name} value={c.name}>{c.customer_name || c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className={labelStyle}>Date *</label>
                                    <input type="date" disabled={!formData.set_posting_time} className={inputStyle} value={formData.posting_date} onChange={e => setFormData({ ...formData, posting_date: e.target.value })} />
                                </div>
                                <div className="pt-7">
                                    <Checkbox checked={!!formData.set_posting_time} onChange={e => setFormData({ ...formData, set_posting_time: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-500">Edit Date</Checkbox>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 tracking-tight">Items</h3>
                        
                        <div className="grid grid-cols-2 gap-12 mb-4">
                            <div>
                                <label className={labelStyle}>Scan Barcode</label>
                                <div className="relative">
                                    <input className={inputStyle} placeholder="Scan Item Barcode..." value={formData.scan_barcode} onChange={e => setFormData({ ...formData, scan_barcode: e.target.value })} />
                                    <FiMaximize2 className="absolute right-3 top-2.5 text-gray-300" />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Set Source Warehouse</label>
                                <select className={inputStyle} value={formData.set_warehouse} onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, set_warehouse: val, items: formData.items.map(i => ({ ...i, warehouse: val })) });
                                }}>
                                    <option value="">Select Default Warehouse...</option>
                                    {warehousesList.map(o => <option key={o.name} value={o.name}>{o.warehouse_name || o.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded overflow-hidden bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F9FAFB] border-b text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 w-10 text-center"><input type="checkbox" className="rounded shadow-none border-gray-300" /></th>
                                        <th className="px-4 py-2 w-12 text-center">No.</th>
                                        <th className="px-4 py-2 min-w-[200px]">Item Code *</th>
                                        <th className="px-4 py-2 text-right w-24">Quantity *</th>
                                        <th className="px-4 py-2 w-24">UOM *</th>
                                        <th className="px-4 py-2 text-right w-32">Rate ({formData.currency})</th>
                                        <th className="px-4 py-2 text-right w-32">Amount ({formData.currency})</th>
                                        <th className="px-4 py-2 w-10 text-center"><FiSettings size={14} className="mx-auto text-gray-300" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {(formData.items || []).map((row, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="rounded shadow-none border-gray-300" /></td>
                                            <td className="px-4 py-2 text-center text-gray-400 text-[11px]">{i + 1}</td>
                                            <td className="p-1">
                                                <select className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:ring-0" value={row.item_code} onChange={e => handleRowChange(i, 'item_code', e.target.value)}>
                                                    <option value="">Select Item...</option>
                                                    {itemsList.map(it => <option key={it.item_code} value={it.item_code}>{it.item_code}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1 text-right font-medium">
                                                <input type="number" className="w-full text-right font-medium text-gray-900 bg-transparent border-none focus:ring-0" value={row.qty} onChange={e => handleRowChange(i, 'qty', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="px-4 py-2 text-gray-400 text-xs italic">{row.uom || 'Unit'}</td>
                                            <td className="p-1">
                                                <input type="number" className="w-full text-right font-medium text-gray-600 bg-transparent border-none focus:ring-0" value={row.rate} onChange={e => handleRowChange(i, 'rate', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="px-4 py-2 text-right text-gray-900 font-bold">₹{parseFloat(row.amount || 0).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => {
                                                    const ni = [...formData.items]; ni.splice(i,1); setFormData({...formData, items: ni});
                                                }} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><FiTrash2 size={13} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <div className="flex gap-2">
                                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition" onClick={handleAddRow}>Add Row</button>
                                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition">Add Multiple</button>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition">Download</button>
                                <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition">Upload</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 mt-6">
                            <div>
                                <label className={labelStyle}>Total Quantity</label>
                                <input className={readonlyInputStyle} value={formData.total_qty} readOnly />
                            </div>
                            <div>
                                <label className={labelStyle}>Total (INR)</label>
                                <input className={readonlyInputStyle} value={`₹ ${parseFloat(formData.total || 0).toLocaleString()}`} readOnly />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-8 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 tracking-tight">Sales Taxes and Charges</h3>
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className={labelStyle}>Tax Category</label>
                                <input className={inputStyle} value={formData.tax_category} onChange={e => setFormData({ ...formData, tax_category: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Shipping Rule</label>
                                <select className={inputStyle} value={formData.shipping_rule} onChange={e => setFormData({ ...formData, shipping_rule: e.target.value })}>
                                    <option value="">Select Shipping Rule...</option>
                                    {shippingRules.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Incoterm</label>
                                <input className={inputStyle} value={formData.incoterm} onChange={e => setFormData({ ...formData, incoterm: e.target.value })} />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className={labelStyle}>Sales Taxes and Charges Template</label>
                            <select className={inputStyle} value={formData.taxes_and_charges} onChange={e => setFormData({ ...formData, taxes_and_charges: e.target.value })}>
                                <option value="">Select Template...</option>
                                {taxTemplates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="bg-white rounded border border-gray-200 overflow-hidden mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F9FAFB] border-b text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 w-10 text-center"><input type="checkbox" className="rounded" /></th>
                                        <th className="px-4 py-2 w-12 text-center">No.</th>
                                        <th className="px-4 py-2">Type *</th>
                                        <th className="px-4 py-2">Account Head *</th>
                                        <th className="px-4 py-2 text-right">Tax Rate</th>
                                        <th className="px-4 py-2 text-right">Amount (INR)</th>
                                        <th className="px-4 py-2 text-right">Total (INR)</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 font-medium">
                                    {(formData.taxes || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="rounded" /></td>
                                            <td className="px-4 py-2 text-center text-gray-400 text-xs">{i + 1}</td>
                                            <td className="p-1">
                                                <select className="w-full text-xs font-bold bg-transparent border-none" value={row.charge_type} onChange={e => handleTaxRowChange(i, 'charge_type', e.target.value)}>
                                                    <option value="On Net Total">On Net Total</option>
                                                    <option value="Actual">Actual</option>
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <select className="w-full text-xs font-bold text-blue-600 bg-transparent border-none" value={row.account_head} onChange={e => handleTaxRowChange(i, 'account_head', e.target.value)}>
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1 text-right">
                                                <input type="number" className="w-full text-right font-bold bg-transparent border-none" value={row.rate} onChange={e => handleTaxRowChange(i, 'rate', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="p-1 text-right">
                                                <input type="number" className="w-full text-right font-bold bg-transparent border-none" value={row.tax_amount} onChange={e => handleTaxRowChange(i, 'tax_amount', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold">₹{parseFloat(row.total || 0).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-center"><button onClick={() => {
                                                const nt = [...formData.taxes]; nt.splice(i,1); setFormData({...formData, taxes: nt});
                                            }} className="text-gray-300 hover:text-red-400 group-hover:opacity-100 transition-all"><FiTrash2 size={13}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(formData.taxes.length === 0) && <div className="py-12 text-center text-gray-400 italic font-medium flex flex-col items-center gap-2">
                                <FiFileText size={40} className="text-gray-200" />
                                No Data
                            </div>}
                        </div>
                        <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition" onClick={handleAddTaxRow}>Add Row</button>
                        
                        <div className="flex flex-col gap-2 items-end mt-4">
                            <div className="w-80 flex justify-between items-center">
                                <span className="text-[12px] text-gray-500 font-medium">Total Taxes and Charges (INR)</span>
                                <span className="font-bold text-gray-900 text-sm">₹ {formData.total_taxes_and_charges.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Totals <FiChevronDown className="text-gray-300"/></h3>
                        <div className="flex flex-col gap-2 items-end">
                            <div className="w-80 flex items-center justify-between gap-4 mb-2">
                                <label className="text-[12px] text-gray-500 font-medium min-w-[140px]">Grand Total (INR)</label>
                                <input className={readonlyInputStyle} value={`₹ ${formData.grand_total.toLocaleString()}`} readOnly />
                            </div>
                            <div className="w-80 flex items-center justify-between gap-4 mb-2">
                                <label className="text-[12px] text-gray-500 font-medium min-w-[140px]">Rounding Adjustment (INR)</label>
                                <input className={readonlyInputStyle} value={`₹ ${formData.rounding_adjustment.toLocaleString()}`} readOnly />
                            </div>
                            <div className="w-80 flex items-center justify-between gap-4">
                                <label className="text-[12px] text-gray-900 font-black min-w-[140px]">Rounded Total (INR)</label>
                                <input className={readonlyInputStyle} value={`₹ ${formData.rounded_total.toLocaleString()}`} readOnly style={{fontSize: '14px', color: '#111827'}} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Additional Discount <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Apply Additional Discount On</label>
                                    <select className={inputStyle} value={formData.apply_discount_on} onChange={e => setFormData({ ...formData, apply_discount_on: e.target.value })}>
                                        <option value="Grand Total">Grand Total</option>
                                        <option value="Net Total">Net Total</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Additional Discount Percentage</label>
                                    <input type="number" className={inputStyle} value={formData.additional_discount_percentage} onChange={e => setFormData({ ...formData, additional_discount_percentage: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Additional Discount Amount (INR)</label>
                                    <input type="number" className={inputStyle} value={formData.discount_amount} onChange={e => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'address',
            label: 'Address & Contact',
            children: (
                <div className="animate-fade-in space-y-8 pt-4">
                    <div className="space-y-6">
                        <h3 className={sectionTitleStyle}>Shipping Address</h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Shipping Address</label>
                                <input className={inputStyle} value={formData.shipping_address_name} placeholder="Search or Type Address..." onChange={e => setFormData({ ...formData, shipping_address_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Dispatch Address Name</label>
                                <input className={inputStyle} value={formData.dispatch_address_name} placeholder="Search Dispatch Address..." onChange={e => setFormData({ ...formData, dispatch_address_name: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Company Address</h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Company Address Name</label>
                                <input className={inputStyle} value={formData.company_address_name} onChange={e => setFormData({ ...formData, company_address_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Company Contact Person</label>
                                <input className={inputStyle} value={formData.company_contact_person} onChange={e => setFormData({ ...formData, company_contact_person: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'terms',
            label: 'Terms',
            children: (
                <div className="animate-fade-in space-y-8 pt-4">
                    <div>
                        <label className={labelStyle}>Terms</label>
                        <select className={inputStyle} value={formData.terms_template} onChange={e => setFormData({ ...formData, terms_template: e.target.value })}>
                            <option value="">Select Terms Template...</option>
                            <option value="standard">Standard Payment Terms</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <h3 className={sectionTitleStyle}>Terms and Conditions Details</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col min-h-[400px]">
                            <div className="bg-[#F9FAFB] border-b p-2 flex gap-4 text-gray-500 text-sm">
                                <span className="font-bold border-r pr-4">Normal <FiChevronDown className="inline ml-1"/></span>
                                <div className="flex gap-3 px-2">
                                    <span className="font-black italic underline line-through">B I U S</span>
                                </div>
                                <div className="flex gap-3 px-2 border-l border-r">
                                    <FiTag size={16}/> <FiFileText size={16}/> <FiTruck size={16}/>
                                </div>
                                <div className="flex gap-3 px-2">
                                    <span>List <FiChevronDown className="inline ml-1"/></span>
                                    <span>Align <FiChevronDown className="inline ml-1"/></span>
                                </div>
                            </div>
                            <TextArea rows={15} className="border-none focus:ring-0 p-6 text-gray-600 text-[14px] leading-relaxed resize-none flex-1 font-medium" placeholder="Start typing the agreement terms..." value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'more',
            label: 'More Info',
            children: (
                <div className="animate-fade-in space-y-12 pt-4">
                    <div className="space-y-4">
                        <h3 className={sectionTitleStyle}>Status <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Status *</label>
                                <input className={readonlyInputStyle} value={formData.status} readOnly />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Transporter Info <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Transporter</label>
                                    <input className={inputStyle} value={formData.transporter} onChange={e => setFormData({ ...formData, transporter: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Driver</label>
                                    <input className={inputStyle} value={formData.driver} onChange={e => setFormData({ ...formData, driver: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Transport Receipt No</label>
                                    <input className={inputStyle} value={formData.lr_no} onChange={e => setFormData({ ...formData, lr_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Vehicle No</label>
                                    <input className={inputStyle} value={formData.vehicle_no} onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Driver Name</label>
                                    <input className={inputStyle} value={formData.driver_name} onChange={e => setFormData({ ...formData, driver_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Transport Receipt Date</label>
                                    <input type="date" className={inputStyle} value={formData.lr_date} onChange={e => setFormData({ ...formData, lr_date: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Customer PO Details <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Customer's Purchase Order No</label>
                                <TextArea rows={2} className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white" value={formData.po_no} onChange={e => setFormData({ ...formData, po_no: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Customer's Purchase Order Date</label>
                                <input type="date" className={inputStyle} value={formData.po_date} onChange={e => setFormData({ ...formData, po_date: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Commission <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Sales Partner</label>
                                    <select className={inputStyle} value={formData.sales_partner} onChange={e => setFormData({ ...formData, sales_partner: e.target.value })}>
                                        <option value="">Select Partner...</option>
                                        {salesPartners.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelStyle}>Amount Eligible for Commission</label>
                                    <span className="font-bold text-gray-800 text-sm">₹ {formData.amount_eligible_for_commission.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Commission Rate (%)</label>
                                    <input type="number" className={inputStyle} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Total Commission</label>
                                    <input className={readonlyInputStyle} value={`₹ ${formData.total_commission.toLocaleString()}`} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Sales Team <FiChevronDown className="text-gray-300"/></h3>
                        <div className="border border-gray-200 rounded overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F9FAFB] border-b text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-2 w-10 text-center"><input type="checkbox" className="rounded" /></th>
                                        <th className="px-4 py-2 w-12 text-center">No.</th>
                                        <th className="px-4 py-2 min-w-[150px]">Sales Person *</th>
                                        <th className="px-4 py-2 text-right">Contribution (%)</th>
                                        <th className="px-4 py-2 text-right">Contr. to Net Total</th>
                                        <th className="px-4 py-2 text-right">Commission Rate</th>
                                        <th className="px-4 py-2 text-right">Incentives</th>
                                        <th className="px-6 py-2 w-10 text-center"><FiSettings size={14} className="mx-auto" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(formData.sales_team || []).map((row, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50">
                                            <td className="px-4 py-2 text-center"><input type="checkbox" className="rounded" /></td>
                                            <td className="px-4 py-2 text-center text-gray-400 text-xs">{i+1}</td>
                                            <td className="p-1">
                                                <select className="w-full border-none bg-transparent focus:ring-0 font-bold text-gray-700 text-sm" value={row.sales_person} onChange={e => handleSalesTeamRowChange(i, 'sales_person', e.target.value)}>
                                                    <option value="">Select Person...</option>
                                                    {salesPersons.map(p => <option key={p.name} value={p.name}>{p.sales_person_name || p.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-1">
                                                <input type="number" className="w-full border-none bg-transparent focus:ring-0 text-right font-medium" value={row.contact_percentage} onChange={e => handleSalesTeamRowChange(i, 'contact_percentage', e.target.value)} />
                                            </td>
                                            <td className="px-4 py-2 text-right">₹ {(row.allocated_amount || 0).toLocaleString()}</td>
                                            <td className="p-1">
                                                <input type="number" className="w-full border-none bg-transparent focus:ring-0 text-right font-medium" value={row.commission_rate} onChange={e => handleSalesTeamRowChange(i, 'commission_rate', e.target.value)} />
                                            </td>
                                            <td className="p-1">
                                                <input type="number" className="w-full border-none bg-transparent focus:ring-0 text-right font-medium" value={row.incentives} onChange={e => handleSalesTeamRowChange(i, 'incentives', e.target.value)} />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => {
                                                    const nt = [...formData.sales_team]; nt.splice(i,1); setFormData({...formData, sales_team: nt});
                                                }} className="text-gray-300 hover:text-red-400"><FiTrash2 size={13}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded border hover:bg-gray-200 transition" onClick={handleAddSalesTeamRow}>Add Row</button>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100">
                        <h3 className={sectionTitleStyle}>Print Settings <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className={labelStyle}>Letter Head</label>
                                <input className={inputStyle} value={formData.letter_head} placeholder="Default Letter Head" onChange={e => setFormData({ ...formData, letter_head: e.target.value })} />
                                <Checkbox checked={!!formData.print_without_amount} onChange={e => setFormData({ ...formData, print_without_amount: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-600">Print Without Amount</Checkbox>
                                <Checkbox checked={!!formData.group_same_items} onChange={e => setFormData({ ...formData, group_same_items: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-600 block mt-2">Group same items</Checkbox>
                            </div>
                            <div className="space-y-4">
                                <label className={labelStyle}>Print Heading</label>
                                <input className={inputStyle} value={formData.print_heading} onChange={e => setFormData({ ...formData, print_heading: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-gray-100 pb-12">
                        <h3 className={sectionTitleStyle}>Additional Info <FiChevronDown className="text-gray-300"/></h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <Checkbox checked={!!formData.is_internal_customer} onChange={e => setFormData({ ...formData, is_internal_customer: e.target.checked ? 1 : 0 })} className="text-[12px] font-medium text-gray-600">Is Internal Customer</Checkbox>
                                <div>
                                    <label className={labelStyle}>Inter Company Reference</label>
                                    <input className={inputStyle} value={formData.inter_company_reference} onChange={e => setFormData({ ...formData, inter_company_reference: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Territory</label>
                                    <input className={inputStyle} value={formData.territory} onChange={e => setFormData({ ...formData, territory: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Source</label>
                                    <input className={inputStyle} value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Campaign</label>
                                    <input className={inputStyle} value={formData.campaign} onChange={e => setFormData({ ...formData, campaign: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className={labelStyle}>Instructions</label>
                                <TextArea rows={12} className="w-full border border-gray-200 rounded px-3 py-2 text-sm" value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 bg-gray-50/20 min-h-screen">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-2 rounded-t-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors" onClick={() => setView('list')}>
                        <FiChevronLeft size={20} />
                    </button>
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord || 'New Delivery Note'}
                    </span>
                    <div className="flex gap-2 ml-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-200">{editingRecord ? formData.status : 'Draft'}</span>
                        {!editingRecord && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[#FCE8E8] text-[#E02424] font-bold border border-[#F8B4B4]">Not Saved</span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: [{ key: 'so', label: 'Sales Order' }, { key: 'si', label: 'Sales Invoice' }] }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300 font-medium rounded shadow-none">
                            Get Items From <FiChevronDown className="text-gray-400"/>
                        </Button>
                    </Dropdown>

                    <Button className="h-8 text-[13px] border-gray-300 rounded shadow-none flex items-center gap-1">
                        <FiMoreHorizontal className="text-gray-400"/>
                    </Button>

                    <button className="px-8 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-50 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this record?" onConfirm={handleDelete}>
                            <button className="p-2 text-gray-300 hover:text-red-500 transition-colors ml-1">
                                <FiTrash2 size={18} />
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[600px] mt-2 shadow-2xl shadow-gray-100/30">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-3">
                        <Spin size="large" />
                        <p className="text-gray-400 text-sm italic font-medium animate-pulse">Fetching global data...</p>
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems} className="custom-stock-tabs" />
                )}
            </div>

            <style jsx global>{`
                .custom-stock-tabs .ant-tabs-nav {
                    margin-bottom: 32px !important;
                }
                .custom-stock-tabs .ant-tabs-nav::before {
                    border-bottom: 1px solid #f3f4f6 !important;
                }
                .custom-stock-tabs .ant-tabs-tab {
                    padding: 8px 0 16px 0 !important;
                    margin: 0 48px 0 0 !important;
                }
                .custom-stock-tabs .ant-tabs-tab-btn {
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #9ca3af !important;
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
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default DeliveryNote;
