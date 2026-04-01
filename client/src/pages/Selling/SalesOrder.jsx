import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs } from 'antd';
import API from '../../services/api';

const SalesOrder = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);

    const initialFormState = {
        naming_series: 'SAL-ORD-.YYYY.-',
        transaction_date: new Date().toISOString().split('T')[0],
        po_no: '',
        customer: '',
        delivery_date: '',
        company: '',
        order_type: 'Sales',
        cost_center: '',
        project: '',
        currency: 'INR',
        selling_price_list: 'Standard Selling',
        ignore_pricing_rule: 0,
        scan_barcode: '',
        set_warehouse: '',
        total_qty: 0,
        total: 0,
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        taxes_and_charges: '',
        total_taxes_and_charges: 0,
        grand_total: 0,
        rounding_adjustment: 0,
        rounded_total: 0,
        disable_rounded_total: 0,
        advance_paid: 0,
        apply_discount_on: 'Grand Total',
        additional_discount_percentage: 0,
        coupon_code: '',
        discount_amount: 0,
        docstatus: 0,
        // Terms
        payment_terms_template: '',
        tc_name: '',
        terms: '',
        payment_schedule: [],
        // More Info
        status: 'Draft',
        campaign: '',
        source: '',
        territory: '',
        letter_head: '',
        select_print_heading: '',
        group_same_items: 0,
        // Commission
        sales_partner: '',
        amount_eligible_for_commission: 0,
        commission_rate: 0,
        total_commission: 0,
        sales_team: [],
        // Auto Repeat
        from_date: '',
        to_date: '',
        auto_repeat: '',
        // Additional Info
        is_internal_customer: 0,

        items: [],
        taxes: []
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

    useEffect(() => {
        if (view === 'form') calculateTotals();
    }, [formData.items, formData.taxes, formData.discount_amount, formData.disable_rounded_total]);

    const calculateTotals = () => {
        let totalQty = 0, totalVal = 0;
        const mappedItems = (formData.items || []).map(row => {
            const qty = parseFloat(row.qty) || 0;
            const rate = parseFloat(row.rate) || 0;
            const amt = qty * rate;
            totalQty += qty; totalVal += amt;
            return { ...row, amount: amt };
        });
        let totalTaxes = 0;
        (formData.taxes || []).forEach(r => { totalTaxes += parseFloat(r.tax_amount) || 0; });
        const discount = parseFloat(formData.discount_amount) || 0;
        let grandTotal = totalVal + totalTaxes - discount;
        let roundedTotal = grandTotal, roundingAdj = 0;
        if (!formData.disable_rounded_total) {
            roundedTotal = Math.round(grandTotal);
            roundingAdj = roundedTotal - grandTotal;
        }
        if (formData.total_qty !== totalQty || formData.total !== totalVal || formData.grand_total !== grandTotal) {
            setFormData(prev => ({ ...prev, items: mappedItems, total_qty: totalQty, total: totalVal, total_taxes_and_charges: totalTaxes, grand_total: grandTotal, rounded_total: roundedTotal, rounding_adjustment: roundingAdj }));
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Sales Order?fields=["name","customer","transaction_date","grand_total","docstatus"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch sales orders' });
        } finally { setLoading(false); }
    };

    const fetchDropdownData = async () => {
        try {
            const [c, co] = await Promise.all([
                API.get('/api/resource/Customer?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]')
            ]);
            setCustomers(c.data.data || []);
            setCompanies(co.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Sales Order/${encodeURIComponent(name)}`);
            const d = res.data.data;
            if (!d.items) d.items = [];
            if (!d.taxes) d.taxes = [];
            if (!d.payment_schedule) d.payment_schedule = [];
            if (!d.sales_team) d.sales_team = [];
            setFormData(d);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.customer) { notification.warning({ message: 'Customer is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Sales Order/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Sales Order updated.' });
            } else {
                await API.post('/api/resource/Sales Order', formData);
                notification.success({ message: 'Sales Order created.' });
            }
            setView('list');
        } catch (err) {
            const msg = err.response?.data?._server_messages ? JSON.parse(err.response.data._server_messages)[0] : err.message;
            notification.error({ message: 'Save Failed', description: msg });
        } finally { setSaving(false); }
    };

    const handleDocAction = async (action) => {
        if (!window.confirm(action === 'submit' ? 'Submit this Sales Order?' : 'Cancel this Sales Order?')) return;
        setSaving(true);
        try {
            const endpoint = action === 'submit' ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(endpoint, { doc: { ...formData, doctype: 'Sales Order' } });
            notification.success({ message: `Sales Order ${action === 'submit' ? 'submitted' : 'cancelled'}.` });
            setView('list');
        } catch (err) {
            const msg = err.response?.data?._server_messages ? JSON.parse(err.response.data._server_messages)[0] : err.message;
            notification.error({ message: 'Action Failed', description: msg });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this Sales Order?')) return;
        try {
            await API.delete(`/api/resource/Sales Order/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Sales Order deleted.' });
            setView('list');
        } catch (err) { notification.error({ message: 'Delete Failed', description: err.message }); }
    };

    const handleAddRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const handleRemoveRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const handleRowChange = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
        const filtered = records.filter(r => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (r.name || '').toLowerCase().includes(s) || (r.customer || '').toLowerCase().includes(s);
        });
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Sales Orders</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={fetchRecords} disabled={loading}>{loading ? '⟳' : '⟳ Refresh'}</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>+ Add Sales Order</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Sales Order or Customer..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} records</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Customer</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-right">Grand Total</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Sales Orders found.</td></tr>
                            ) : filtered.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4"><button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>{r.name}</button></td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{r.customer}</td>
                                    <td className="px-5 py-4 text-gray-500">{r.transaction_date}</td>
                                    <td className="px-5 py-4 text-gray-900 font-semibold text-right">₹ {Number(r.grand_total).toFixed(2)}</td>
                                    <td className="px-5 py-4 text-center">
                                        {r.docstatus === 0 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">Draft</span>}
                                        {r.docstatus === 1 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">Submitted</span>}
                                        {r.docstatus === 2 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-300">Cancelled</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const isDraft = formData.docstatus === 0;
    const isSubmitted = formData.docstatus === 1;

    const getStatusLabel = () => {
        if (!editingRecord) return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4] ml-2">Not Saved</span>;
        if (isDraft) return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-red-50 text-red-600 font-medium border border-red-200 ml-2">Draft</span>;
        if (isSubmitted) return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-green-50 text-green-600 font-medium border border-green-200 ml-2">Submitted</span>;
        return <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-gray-100 text-gray-600 font-medium border border-gray-300 ml-2">Cancelled</span>;
    };

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {/* Top Fields */}
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>Series *</label>
                            <input className={inputStyle} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Date *</label>
                            <input type="date" className={inputStyle} value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Customer's Purchase Order</label>
                            <input className={inputStyle} value={formData.po_no} onChange={e => setFormData({ ...formData, po_no: e.target.value })} disabled={!isDraft} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>Customer *</label>
                            <select className={inputStyle} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} disabled={!isDraft}>
                                <option value="">Select Customer</option>
                                {customers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Delivery Date</label>
                            <input type="date" className={inputStyle} value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={labelStyle}>Company *</label>
                            <select className={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} disabled={!isDraft}>
                                <option value="">Select Company</option>
                                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="max-w-xs">
                        <label className={labelStyle}>Order Type *</label>
                        <select className={inputStyle} value={formData.order_type} onChange={e => setFormData({ ...formData, order_type: e.target.value })} disabled={!isDraft}>
                            <option value="Sales">Sales</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Shopping Cart">Shopping Cart</option>
                        </select>
                    </div>

                    {/* Accounting Dimensions */}
                    <div className={sectionTitleStyle}><span>Accounting Dimensions</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelStyle}>Cost Center</label><input className={inputStyle} value={formData.cost_center} onChange={e => setFormData({ ...formData, cost_center: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Project</label><input className={inputStyle} value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })} disabled={!isDraft} /></div>
                    </div>

                    {/* Currency & Price List */}
                    <div className={sectionTitleStyle}><span>Currency and Price List</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelStyle}>Currency *</label><input className={inputStyle} value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} disabled={!isDraft} /></div>
                        <div className="space-y-2">
                            <div><label className={labelStyle}>Price List *</label><input className={inputStyle} value={formData.selling_price_list} onChange={e => setFormData({ ...formData, selling_price_list: e.target.value })} disabled={!isDraft} /></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="so_ignore_pricing" checked={!!formData.ignore_pricing_rule} onChange={e => setFormData({ ...formData, ignore_pricing_rule: e.target.checked ? 1 : 0 })} className="w-3 h-3 text-blue-600 rounded" disabled={!isDraft} />
                                <label htmlFor="so_ignore_pricing" className="text-xs font-medium text-gray-500">Ignore Pricing Rule</label>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className={sectionTitleStyle}><span>Items</span></div>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div><label className={labelStyle}>Scan Barcode</label><input className={inputStyle} value={formData.scan_barcode} onChange={e => setFormData({ ...formData, scan_barcode: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Set Source Warehouse</label><input className={inputStyle} value={formData.set_warehouse} onChange={e => setFormData({ ...formData, set_warehouse: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={`${thStyle} w-10 text-center`}>No.</th>
                                    <th className={`${thStyle}`}>Item Code *</th>
                                    <th className={thStyle}>Delivery Date *</th>
                                    <th className={`${thStyle} text-right`}>Quantity *</th>
                                    <th className={`${thStyle} text-right`}>Rate ({formData.currency})</th>
                                    <th className={`${thStyle} text-right`}>Amount ({formData.currency})</th>
                                    <th className={`${thStyle} w-10`}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.length === 0 ? null : formData.items.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                        <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                        <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.item_code || ''} onChange={e => handleRowChange('items', i, 'item_code', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.delivery_date || ''} onChange={e => handleRowChange('items', i, 'delivery_date', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right font-medium text-blue-600`} value={row.qty || ''} onChange={e => handleRowChange('items', i, 'qty', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><div className="flex items-center justify-end"><span className="text-gray-400 mr-1">₹</span><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.rate || ''} onChange={e => handleRowChange('items', i, 'rate', e.target.value)} disabled={!isDraft} /></div></td>
                                        <td className={`${tdStyle} text-right font-semibold text-gray-800`}>₹ {Number(row.amount || 0).toFixed(2)}</td>
                                        <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('items', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.items.length === 0 && renderEmptyTable()}
                    </div>
                    {isDraft && (
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAddRow('items', { item_code: '', delivery_date: formData.delivery_date || '', qty: 1, rate: 0, amount: 0 })} className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
                            <button className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Multiple</button>
                            <div className="ml-auto flex gap-2">
                                <button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Download</button>
                                <button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Upload</button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-8 mt-6">
                        <div><label className={labelStyle}>Total Quantity</label><div className={`${inputStyle} bg-gray-50 border-transparent font-semibold`}>{formData.total_qty}</div></div>
                        <div><label className={labelStyle}>Total ({formData.currency})</label><div className={`${inputStyle} bg-gray-50 border-transparent font-bold text-gray-900 text-right`}>₹ {Number(formData.total).toFixed(2)}</div></div>
                    </div>

                    {/* Taxes */}
                    <div className={sectionTitleStyle}>Taxes</div>
                    <div className="grid grid-cols-3 gap-6">
                        <div><label className={labelStyle}>Tax Category</label><input className={inputStyle} value={formData.tax_category} onChange={e => setFormData({ ...formData, tax_category: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Shipping Rule</label><input className={inputStyle} value={formData.shipping_rule} onChange={e => setFormData({ ...formData, shipping_rule: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Incoterm</label><input className={inputStyle} value={formData.incoterm} onChange={e => setFormData({ ...formData, incoterm: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="max-w-sm mt-4"><label className={labelStyle}>Sales Taxes and Charges Template</label><input className={inputStyle} value={formData.taxes_and_charges} onChange={e => setFormData({ ...formData, taxes_and_charges: e.target.value })} disabled={!isDraft} /></div>

                    <div className="mt-6">
                        <label className="block text-sm text-gray-800 font-semibold mb-2">Sales Taxes and Charges</label>
                        <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className={`${thStyle} w-10 text-center`}>No.</th>
                                        <th className={thStyle}>Type *</th>
                                        <th className={thStyle}>Account Head *</th>
                                        <th className={`${thStyle} text-right`}>Tax Rate</th>
                                        <th className={`${thStyle} text-right`}>Amount</th>
                                        <th className={`${thStyle} text-right`}>Total</th>
                                        <th className={`${thStyle} w-10`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.taxes.length === 0 ? null : formData.taxes.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                            <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                            <td className={tdStyle}><select className={rowInputStyle} value={row.charge_type || ''} onChange={e => handleRowChange('taxes', i, 'charge_type', e.target.value)} disabled={!isDraft}><option value="Actual">Actual</option><option value="On Net Total">On Net Total</option><option value="On Previous Row Amount">On Previous Row Amount</option></select></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.account_head || ''} onChange={e => handleRowChange('taxes', i, 'account_head', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><input type="number" className={`${rowInputStyle} text-right w-20`} value={row.rate || ''} onChange={e => handleRowChange('taxes', i, 'rate', e.target.value)} disabled={!isDraft} /><span className="text-gray-400 ml-1">%</span></div></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><span className="text-gray-400 mr-1">₹</span><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.tax_amount || ''} onChange={e => handleRowChange('taxes', i, 'tax_amount', e.target.value)} disabled={!isDraft} /></div></td>
                                            <td className={`${tdStyle} text-right font-semibold text-gray-800`}>₹ {Number(row.total || 0).toFixed(2)}</td>
                                            <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('taxes', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.taxes.length === 0 && renderEmptyTable()}
                        </div>
                        {isDraft && <button onClick={() => handleAddRow('taxes', { charge_type: 'Actual', account_head: '', rate: 0, tax_amount: 0, total: 0 })} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                        <div className="grid grid-cols-2 gap-8 mt-6"><div></div><div><label className={labelStyle}>Total Taxes and Charges ({formData.currency})</label><div className={`${inputStyle} bg-gray-50 border-transparent font-bold text-gray-900 text-right`}>₹ {Number(formData.total_taxes_and_charges).toFixed(2)}</div></div></div>
                    </div>

                    {/* Totals */}
                    <div className={sectionTitleStyle}>Totals</div>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div></div>
                        <div className="space-y-3 bg-gray-50 p-4 border rounded-md">
                            <div><label className={labelStyle}>Grand Total ({formData.currency})</label><div className={`${inputStyle} text-right font-bold text-[15px]`}>₹ {Number(formData.grand_total).toFixed(2)}</div></div>
                            {!formData.disable_rounded_total && (<div><label className={labelStyle}>Rounding Adjustment ({formData.currency})</label><div className={`${inputStyle} text-right text-gray-500`}>₹ {Number(formData.rounding_adjustment).toFixed(2)}</div></div>)}
                            <div><label className={labelStyle}>Rounded Total ({formData.currency})</label><div className={`${inputStyle} text-right font-black text-[16px] text-gray-900 tracking-tight`}>₹ {Number(formData.rounded_total).toFixed(2)}</div></div>
                            <div><label className={labelStyle}>Advance Paid</label><div className={`${inputStyle} text-right text-gray-500`}>₹ {Number(formData.advance_paid).toFixed(2)}</div></div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="so_disable_rounded" checked={!!formData.disable_rounded_total} onChange={e => setFormData({ ...formData, disable_rounded_total: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded" disabled={!isDraft} />
                                <label htmlFor="so_disable_rounded" className="text-sm font-semibold text-gray-700">Disable Rounded Total</label>
                            </div>
                        </div>
                    </div>

                    {/* Additional Discount */}
                    <div className={sectionTitleStyle}><span>Additional Discount</span></div>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Apply Additional Discount On</label><select className={inputStyle} value={formData.apply_discount_on} onChange={e => setFormData({ ...formData, apply_discount_on: e.target.value })} disabled={!isDraft}><option value="Grand Total">Grand Total</option><option value="Net Total">Net Total</option></select></div>
                            <div><label className={labelStyle}>Coupon Code</label><input className={inputStyle} value={formData.coupon_code} onChange={e => setFormData({ ...formData, coupon_code: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Additional Discount Percentage</label><input type="number" className={inputStyle} value={formData.additional_discount_percentage} onChange={e => setFormData({ ...formData, additional_discount_percentage: e.target.value })} disabled={!isDraft} /></div>
                            <div><label className={labelStyle}>Additional Discount Amount ({formData.currency})</label><input type="number" className={inputStyle} value={formData.discount_amount} onChange={e => setFormData({ ...formData, discount_amount: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'terms',
            label: 'Terms',
            children: (
                <div className="space-y-6 animate-fade-in mt-2">
                    <h2 className="text-sm font-bold text-gray-800">Payment Terms</h2>
                    <div className="max-w-md"><label className={labelStyle}>Payment Terms Template</label><input className={inputStyle} value={formData.payment_terms_template} onChange={e => setFormData({ ...formData, payment_terms_template: e.target.value })} disabled={!isDraft} /></div>
                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-2">Payment Schedule</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Payment Term</th>
                                        <th className={thStyle}>Description</th>
                                        <th className={thStyle}>Due Date *</th>
                                        <th className={`${thStyle} text-right`}>Invoice Portion</th>
                                        <th className={`${thStyle} text-right`}>Payment Amount *</th>
                                        <th className={`${thStyle} w-10`}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(formData.payment_schedule || []).length === 0 ? null : (formData.payment_schedule || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.payment_term || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_term', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.description || ''} onChange={e => handleRowChange('payment_schedule', i, 'description', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.due_date || ''} onChange={e => handleRowChange('payment_schedule', i, 'due_date', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.invoice_portion || ''} onChange={e => handleRowChange('payment_schedule', i, 'invoice_portion', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.payment_amount || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_amount', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}>{isDraft && <button onClick={() => handleRemoveRow('payment_schedule', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition">✕</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(formData.payment_schedule || []).length === 0 && renderEmptyTable()}
                        </div>
                        {isDraft && <button onClick={() => handleAddRow('payment_schedule', { payment_term: '', description: '', due_date: '', invoice_portion: 0, payment_amount: 0 })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                    </div>
                    <div className="h-px bg-gray-200 my-6"></div>
                    <h2 className="text-sm font-bold text-gray-800">Terms and Conditions</h2>
                    <div className="max-w-md"><label className={labelStyle}>Terms</label><input className={inputStyle} value={formData.tc_name} onChange={e => setFormData({ ...formData, tc_name: e.target.value })} disabled={!isDraft} /></div>
                    <div><label className={labelStyle}>Term Details</label><textarea className={`${inputStyle} h-48 resize-none`} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} disabled={!isDraft} placeholder="Enter terms and conditions..."></textarea></div>
                </div>
            )
        },
        {
            key: 'more_info',
            label: 'More Info',
            children: (
                <div className="space-y-8 animate-fade-in mt-2">
                    {/* Status */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Status</div>
                        <div className="p-4">
                            <div className="max-w-md">
                                <label className={labelStyle}>Status *</label>
                                <input className={`${inputStyle} bg-gray-50`} value={formData.status} disabled />
                            </div>
                        </div>
                    </div>

                    {/* Commission */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Commission</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div><label className={labelStyle}>Sales Partner</label><input className={inputStyle} value={formData.sales_partner} onChange={e => setFormData({ ...formData, sales_partner: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Amount Eligible for Commission</label><div className={`${inputStyle} bg-gray-50`}>₹ {Number(formData.amount_eligible_for_commission || 0).toFixed(2)}</div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div></div>
                                <div className="space-y-4">
                                    <div><label className={labelStyle}>Commission Rate</label><input type="number" className={inputStyle} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} disabled={!isDraft} /></div>
                                    <div><label className={labelStyle}>Total Commission</label><div className={`${inputStyle} bg-gray-50`}>₹ {Number(formData.total_commission || 0).toFixed(2)}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Team */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Sales Team</div>
                        <div className="p-4">
                            <label className="block text-xs text-gray-600 font-semibold mb-2">Sales Team</label>
                            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className={`${thStyle} w-10 text-center`}>No.</th>
                                            <th className={thStyle}>Sales Person *</th>
                                            <th className={`${thStyle} text-right`}>Contribution (%)</th>
                                            <th className={`${thStyle} text-right`}>Contribution to Net Total</th>
                                            <th className={`${thStyle} text-right`}>Commission Rate</th>
                                            <th className={`${thStyle} text-right`}>Incentives</th>
                                            <th className={`${thStyle} w-10`}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.sales_team || []).length === 0 ? null : (formData.sales_team || []).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                                <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                                <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.sales_person || ''} onChange={e => handleRowChange('sales_team', i, 'sales_person', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.allocated_percentage || ''} onChange={e => handleRowChange('sales_team', i, 'allocated_percentage', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={`${tdStyle} text-right text-gray-700`}>₹ {Number(row.allocated_amount || 0).toFixed(2)}</td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.commission_rate || ''} onChange={e => handleRowChange('sales_team', i, 'commission_rate', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.incentives || ''} onChange={e => handleRowChange('sales_team', i, 'incentives', e.target.value)} disabled={!isDraft} /></td>
                                                <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('sales_team', i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(formData.sales_team || []).length === 0 && renderEmptyTable()}
                            </div>
                            {isDraft && <button onClick={() => handleAddRow('sales_team', { sales_person: '', allocated_percentage: 0, allocated_amount: 0, commission_rate: 0, incentives: 0 })} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
                        </div>
                    </div>

                    {/* Auto Repeat */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Auto Repeat</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div><label className={labelStyle}>From Date</label><input type="date" className={inputStyle} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Auto Repeat</label><input className={inputStyle} value={formData.auto_repeat} onChange={e => setFormData({ ...formData, auto_repeat: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="max-w-md">
                                <label className={labelStyle}>To Date</label>
                                <input type="date" className={inputStyle} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} disabled={!isDraft} />
                            </div>
                        </div>
                    </div>

                    {/* Print Settings */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Print Settings</div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className={labelStyle}>Letter Head</label><input className={inputStyle} value={formData.letter_head} onChange={e => setFormData({ ...formData, letter_head: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={labelStyle}>Print Heading</label><input className={inputStyle} value={formData.select_print_heading} onChange={e => setFormData({ ...formData, select_print_heading: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="so_group_same" checked={!!formData.group_same_items} onChange={e => setFormData({ ...formData, group_same_items: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                <label htmlFor="so_group_same" className="text-sm font-semibold text-gray-700">Group same items</label>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="border rounded">
                        <div className={sectionTitleStyle + ' mt-0 mb-0 p-3 border-b-0'}>Additional Info</div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-8 mb-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="so_is_internal" checked={!!formData.is_internal_customer} onChange={e => setFormData({ ...formData, is_internal_customer: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                    <label htmlFor="so_is_internal" className="text-sm font-semibold text-gray-700">Is Internal Customer</label>
                                </div>
                                <div><label className={labelStyle}>Source</label><input className={inputStyle} value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div></div>
                                <div><label className={labelStyle}>Campaign</label><input className={inputStyle} value={formData.campaign} onChange={e => setFormData({ ...formData, campaign: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                        {editingRecord ? editingRecord : 'New Sales Order'}
                    </span>
                    {getStatusLabel()}
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 font-medium transition shadow-sm text-sm" onClick={() => setView('list')}>Discard</button>
                    {!editingRecord && (
                        <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-md disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    )}
                    {editingRecord && isDraft && (
                        <>
                            <button className="px-5 py-2 border border-gray-300 bg-white text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition shadow-sm" onClick={handleDelete}>Delete</button>
                            <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-md disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                            </button>
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-70 ml-2" onClick={() => handleDocAction('submit')} disabled={saving}>Submit</button>
                        </>
                    )}
                    {editingRecord && isSubmitted && (
                        <button className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition shadow-md disabled:opacity-70" onClick={() => handleDocAction('cancel')} disabled={saving}>Cancel</button>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? <div className="flex justify-center items-center h-40"><Spin size="large" /></div> : <Tabs defaultActiveKey="details" items={tabItems} className="custom-so-tabs" />}
            </div>
            <style>{`
                .custom-so-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f3f4f6; }
                .custom-so-tabs .ant-tabs-tab { padding: 12px 0; margin: 0 32px 0 0; color: #6b7280; font-size: 14px; }
                .custom-so-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #111827 !important; font-weight: 700; }
                .custom-so-tabs .ant-tabs-ink-bar { background: #111827; height: 3px !important; border-radius: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SalesOrder;
