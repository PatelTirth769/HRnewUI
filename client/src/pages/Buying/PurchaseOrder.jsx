import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs, Dropdown, Button, Space, Popconfirm, Modal } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import API from '../../services/api';

const PurchaseOrder = () => {
    const location = useLocation();
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    const [suppliers, setSuppliers] = useState([]);

    const initialFormState = {
        naming_series: 'PUR-ORD-.YYYY.-',
        transaction_date: new Date().toISOString().split('T')[0],
        supplier: '',
        schedule_date: '', // Required By
        apply_tds: 0, // Apply Tax Withholding Amount toggle
        tax_withholding_category: '',
        is_subcontracted: 0,
        supplier_warehouse: '',
        cost_center: '',
        project: '',
        currency: 'INR',
        buying_price_list: 'Standard Buying',
        ignore_pricing_rule: 0,
        scan_barcode: '',
        set_warehouse: '', // Set Target Warehouse
        total_qty: 0,
        total: 0,
        tax_category: '',
        shipping_rule: '',
        incoterm: '',
        taxes_and_charges: '', // Purchase Taxes and Charges Template
        total_taxes_and_charges: 0,
        grand_total: 0,
        rounding_adjustment: 0,
        rounded_total: 0,
        disable_rounded_total: 0,
        advance_paid: 0,
        apply_discount_on: 'Grand Total',
        additional_discount_percentage: 0,
        discount_amount: 0,
        docstatus: 0,

        // Address & Contact
        supplier_address: '',
        supplier_contact: '',
        shipping_address: '',
        company_billing_address: '',
        // Terms
        payment_terms_template: '',
        payment_schedule: [],
        tc_name: '',
        terms: '',
        // More Info
        status: 'Draft',
        letter_head: '',
        select_print_heading: '',
        group_same_items: 0,
        print_language: '',
        from_date: '',
        to_date: '',
        is_internal_supplier: 0,
        // Drop Ship
        customer: '',
        customer_name: '',

        items: [],
        taxes: []
    };

    const [formData, setFormData] = useState(initialFormState);

    const soDataLoadedRef = React.useRef(false);

    // Check if navigated from Sales Order with pre-filled data (runs FIRST)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('from_so') === '1') {
            const poData = sessionStorage.getItem('po_from_so');
            if (poData) {
                try {
                    const parsed = JSON.parse(poData);
                    setFormData(prev => ({
                        ...prev,
                        supplier: parsed.supplier || '',
                        schedule_date: parsed.schedule_date || prev.schedule_date,
                        customer: parsed.customer || '',
                        customer_name: parsed.customer_name || '',
                        items: (parsed.items || []).map(item => ({
                            ...item,
                            amount: (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)
                        }))
                    }));
                    sessionStorage.removeItem('po_from_so');
                    soDataLoadedRef.current = true;
                } catch (e) { console.error('Failed to parse SO data:', e); }
            }
            setView('form');
            fetchDropdownData();
        } else if (params.get('edit')) {
            setEditingRecord(params.get('edit'));
            setView('form');
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else if (!soDataLoadedRef.current) {
                setFormData(initialFormState);
            }
            // Reset the flag after first render so future "new" forms get clean state
            soDataLoadedRef.current = false;
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
        if (formData.total_qty !== totalQty || formData.total !== totalVal || formData.grand_total !== grandTotal || formData.rounded_total !== roundedTotal) {
            setFormData(prev => ({ 
                ...prev, 
                items: mappedItems, 
                total_qty: totalQty, 
                total: totalVal, 
                total_taxes_and_charges: totalTaxes, 
                grand_total: grandTotal, 
                rounded_total: roundedTotal, 
                rounding_adjustment: roundingAdj 
            }));
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Purchase Order?fields=["name","supplier","transaction_date","grand_total","docstatus"]&limit_page_length=None&order_by=modified desc');
            setRecords(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch purchase orders' });
        } finally { setLoading(false); }
    };

    const fetchDropdownData = async () => {
        try {
            const [s] = await Promise.all([
                API.get('/api/resource/Supplier?fields=["name"]')
            ]);
            setSuppliers(s.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Purchase Order/${encodeURIComponent(name)}`);
            const d = res.data.data;
            if (!d.items) d.items = [];
            if (!d.taxes) d.taxes = [];
            setFormData(d);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally { setLoading(false); }
    };

    const parseFrappeError = (err) => {
        if (err.response?.data?._server_messages) {
            try {
                const messages = JSON.parse(err.response.data._server_messages);
                let text = '';
                messages.forEach(m => {
                    try {
                        const mObj = JSON.parse(m);
                        if (mObj.message) text += mObj.message.replace(/<[^>]+>/g, '') + '\n';
                    } catch { text += m + '\n'; }
                });
                return text.trim() || 'Server validation failed.';
            } catch (e) {
                return String(err.response.data._server_messages);
            }
        }
        if (err.response?.data?.exception) {
            return String(err.response.data.exception).split('\n').find(l => l.includes('Error:')) || 'Server exception.';
        }
        return err.message || 'Operation failed.';
    };

    const handleSave = async () => {
        if (!formData.supplier) { notification.warning({ message: 'Supplier is required.' }); return; }
        if (!formData.items || formData.items.length === 0) { notification.warning({ message: 'At least one item is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Purchase Order/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Purchase Order updated.' });
                fetchDetails(editingRecord);
            } else {
                const res = await API.post('/api/resource/Purchase Order', formData);
                notification.success({ message: 'Purchase Order created.' });
                setEditingRecord(res.data.data.name);
            }
        } catch (err) {
            notification.error({ message: 'Save Failed', description: parseFrappeError(err), duration: 6 });
        } finally { setSaving(false); }
    };

    const handleDocAction = (action) => {
        setConfirmAction(action);
    };

    const handleConfirmAction = async () => {
        const isSubmit = confirmAction === 'submit';
        setSaving(true);
        setConfirmAction(null);
        try {
            const endpoint = isSubmit ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(endpoint, { doc: { ...formData, doctype: 'Purchase Order' } });
            notification.success({ message: `Purchase Order has been ${isSubmit ? 'submitted' : 'cancelled'} successfully` });
            fetchDetails(editingRecord);
        } catch (err) {
            notification.error({ message: 'Action Failed', description: parseFrappeError(err), duration: 6 });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this Purchase Order?')) return;
        try {
            await API.delete(`/api/resource/Purchase Order/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Purchase Order deleted.' });
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
            return (r.name || '').toLowerCase().includes(s) || (r.supplier || '').toLowerCase().includes(s);
        });
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Purchase Orders</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={fetchRecords} disabled={loading}>{loading ? '⟳' : '⟳ Refresh'}</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>+ Add Purchase Order</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Purchase Order or Supplier..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {records.length} records</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Supplier</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-right">Grand Total</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No Purchase Orders found.</td></tr>
                            ) : filtered.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4"><button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>{r.name}</button></td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{r.supplier}</td>
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
        if (formData.docstatus === 2) return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide text-gray-500 ml-2">Cancelled</span>;
        // Submitted states - check formData.status for granular status
        const st = (formData.status || '').toLowerCase();
        if (st === 'delivered' || st === 'completed') return <span className="text-green-600 font-medium text-[13px] ml-3">Delivered</span>;
        if (st === 'to bill') return <span className="text-blue-600 font-medium text-[13px] ml-3">To Bill</span>;
        if (st === 'closed') return <span className="text-gray-500 font-medium text-[13px] ml-3">Closed</span>;
        if (st === 'on hold') return <span className="text-yellow-600 font-medium text-[13px] ml-3">On Hold</span>;
        if (isSubmitted) return <span className="text-orange-500 font-medium text-[13px] ml-3">To Receive and Bill</span>;
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wide text-gray-500 ml-2">{formData.status || 'Unknown'}</span>;
    };

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in pb-8">
                    {editingRecord && isDraft && (
                        <div className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] px-4 py-3 rounded-md text-[13px] font-medium flex justify-between items-center mt-2 mb-6">
                            <span>Submit this document to confirm</span>
                        </div>
                    )}
                    {/* Top Fields */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Series *</label>
                                <input className={inputStyle} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={!isDraft} />
                            </div>
                            <div>
                                <label className={labelStyle}>Supplier *</label>
                                <select className={inputStyle} value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} disabled={!isDraft}>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4 max-w-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Date *</label>
                                    <input type="date" className={inputStyle} value={formData.transaction_date} onChange={e => setFormData({ ...formData, transaction_date: e.target.value })} disabled={!isDraft} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Required By</label>
                                    <input type="date" className={inputStyle} value={formData.schedule_date} onChange={e => setFormData({ ...formData, schedule_date: e.target.value })} disabled={!isDraft} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="apply_tds" checked={!!formData.apply_tds} onChange={e => setFormData({ ...formData, apply_tds: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                    <label htmlFor="apply_tds" className="text-sm font-semibold text-gray-700">Apply Tax Withholding Amount</label>
                                </div>
                                {!!formData.apply_tds && (
                                    <div>
                                        <label className={labelStyle}>Tax Withholding Category</label>
                                        <input className={inputStyle} value={formData.tax_withholding_category} onChange={e => setFormData({ ...formData, tax_withholding_category: e.target.value })} disabled={!isDraft} />
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="is_subcontracted" checked={!!formData.is_subcontracted} onChange={e => setFormData({ ...formData, is_subcontracted: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft} />
                                    <label htmlFor="is_subcontracted" className="text-sm font-semibold text-gray-700">Is Subcontracted</label>
                                </div>
                                {!!formData.is_subcontracted && (
                                    <div>
                                        <label className={labelStyle}>Supplier Warehouse</label>
                                        <input className={inputStyle} value={formData.supplier_warehouse} onChange={e => setFormData({ ...formData, supplier_warehouse: e.target.value })} disabled={!isDraft} />
                                    </div>
                                )}
                            </div>
                        </div>
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
                            <div><label className={labelStyle}>Price List</label><input className={inputStyle} value={formData.buying_price_list} onChange={e => setFormData({ ...formData, buying_price_list: e.target.value })} disabled={!isDraft} /></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="po_ignore_pricing" checked={!!formData.ignore_pricing_rule} onChange={e => setFormData({ ...formData, ignore_pricing_rule: e.target.checked ? 1 : 0 })} className="w-3 h-3 text-blue-600 rounded" disabled={!isDraft} />
                                <label htmlFor="po_ignore_pricing" className="text-xs font-medium text-gray-500">Ignore Pricing Rule</label>
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className={sectionTitleStyle}><span>Items</span></div>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div><label className={labelStyle}>Scan Barcode</label><input className={inputStyle} value={formData.scan_barcode} onChange={e => setFormData({ ...formData, scan_barcode: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Set Target Warehouse</label><input className={inputStyle} value={formData.set_warehouse} onChange={e => setFormData({ ...formData, set_warehouse: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className={`${thStyle} w-10 text-center`}><input type="checkbox" className="rounded" /></th>
                                    <th className={`${thStyle} w-10 text-center`}>No.</th>
                                    <th className={`${thStyle}`}>Item Code *</th>
                                    <th className={thStyle}>Required By *</th>
                                    <th className={`${thStyle} text-right`}>Quantity *</th>
                                    <th className={`${thStyle}`}>UOM *</th>
                                    <th className={`${thStyle} text-right`}>Rate ({formData.currency})</th>
                                    <th className={`${thStyle} text-right`}>Amount ({formData.currency})</th>
                                    <th className={`${thStyle} w-16 text-center`}>⚙️</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.length === 0 ? null : formData.items.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0 items-center">
                                        <td className={`${tdStyle} text-center`}><input type="checkbox" className="rounded" /></td>
                                        <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                        <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.item_code || ''} onChange={e => handleRowChange('items', i, 'item_code', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.schedule_date || ''} onChange={e => handleRowChange('items', i, 'schedule_date', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right font-medium text-blue-600`} value={row.qty || ''} onChange={e => handleRowChange('items', i, 'qty', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><input type="text" className={`${rowInputStyle} w-16`} value={row.uom || ''} onChange={e => handleRowChange('items', i, 'uom', e.target.value)} disabled={!isDraft} /></td>
                                        <td className={tdStyle}><div className="flex items-center justify-end"><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.rate || ''} onChange={e => handleRowChange('items', i, 'rate', e.target.value)} disabled={!isDraft} /></div></td>
                                        <td className={`${tdStyle} text-right font-semibold text-gray-800`}>{Number(row.amount || 0).toFixed(2)}</td>
                                        <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('items', i)} className="text-gray-400 hover:text-red-600 text-xs p-1 rounded-full hover:bg-gray-200 transition">✎</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {formData.items.length === 0 && renderEmptyTable()}
                    </div>
                    {isDraft && (
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAddRow('items', { item_code: '', schedule_date: formData.schedule_date || '', qty: 0, uom: 'Nos', rate: 0, amount: 0 })} className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>
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
                    <div className={sectionTitleStyle}>Taxes and Charges</div>
                    <div className="grid grid-cols-3 gap-6">
                        <div><label className={labelStyle}>Tax Category</label><input className={inputStyle} value={formData.tax_category} onChange={e => setFormData({ ...formData, tax_category: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Shipping Rule</label><input className={inputStyle} value={formData.shipping_rule} onChange={e => setFormData({ ...formData, shipping_rule: e.target.value })} disabled={!isDraft} /></div>
                        <div><label className={labelStyle}>Incoterm</label><input className={inputStyle} value={formData.incoterm} onChange={e => setFormData({ ...formData, incoterm: e.target.value })} disabled={!isDraft} /></div>
                    </div>
                    <div className="max-w-sm mt-4"><label className={labelStyle}>Purchase Taxes and Charges Template</label><input className={inputStyle} value={formData.taxes_and_charges} onChange={e => setFormData({ ...formData, taxes_and_charges: e.target.value })} disabled={!isDraft} /></div>

                    <div className="mt-6">
                        <label className="block text-sm text-gray-800 font-semibold mb-2">Purchase Taxes and Charges</label>
                        <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                            <table className="w-full">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className={`${thStyle} w-10 text-center`}><input type="checkbox" className="rounded" /></th>
                                        <th className={`${thStyle} w-10 text-center`}>No.</th>
                                        <th className={thStyle}>Type *</th>
                                        <th className={thStyle}>Account Head *</th>
                                        <th className={`${thStyle} text-right`}>Tax Rate</th>
                                        <th className={`${thStyle} text-right`}>Amount</th>
                                        <th className={`${thStyle} text-right`}>Total</th>
                                        <th className={`${thStyle} w-10 text-center`}>⚙️</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.taxes.length === 0 ? null : formData.taxes.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                            <td className={`${tdStyle} text-center`}><input type="checkbox" className="rounded" /></td>
                                            <td className={`${tdStyle} text-center font-medium text-gray-500`}>{i + 1}</td>
                                            <td className={tdStyle}><select className={rowInputStyle} value={row.charge_type || ''} onChange={e => handleRowChange('taxes', i, 'charge_type', e.target.value)} disabled={!isDraft}><option value="Actual">Actual</option><option value="On Net Total">On Net Total</option><option value="On Previous Row Amount">On Previous Row Amount</option></select></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.account_head || ''} onChange={e => handleRowChange('taxes', i, 'account_head', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><input type="number" className={`${rowInputStyle} text-right w-20`} value={row.rate || ''} onChange={e => handleRowChange('taxes', i, 'rate', e.target.value)} disabled={!isDraft} /></div></td>
                                            <td className={tdStyle}><div className="flex items-center justify-end"><input type="number" className={`${rowInputStyle} text-right w-24`} value={row.tax_amount || ''} onChange={e => handleRowChange('taxes', i, 'tax_amount', e.target.value)} disabled={!isDraft} /></div></td>
                                            <td className={`${tdStyle} text-right font-semibold text-gray-800`}>{Number(row.total || 0).toFixed(2)}</td>
                                            <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('taxes', i)} className="text-gray-400 hover:text-red-600 text-xs p-1 rounded-full hover:bg-gray-200 transition">✕</button>}</td>
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
                            <div className="flex items-center gap-2 pt-2 pb-2">
                                <input type="checkbox" id="po_disable_rounded" checked={!!formData.disable_rounded_total} onChange={e => setFormData({ ...formData, disable_rounded_total: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-blue-600 rounded bg-gray-900" disabled={!isDraft} />
                                <label htmlFor="po_disable_rounded" className="text-sm font-semibold text-gray-700">Disable Rounded Total</label>
                            </div>
                            <div><label className={labelStyle}>Advance Paid</label><div className={`${inputStyle} text-right text-gray-500`}>₹ {Number(formData.advance_paid).toFixed(2)}</div></div>
                        </div>
                    </div>

                    {/* Additional Discount */}
                    <div className={sectionTitleStyle}><span>Additional Discount</span></div>
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Apply Additional Discount On</label><select className={inputStyle} value={formData.apply_discount_on} onChange={e => setFormData({ ...formData, apply_discount_on: e.target.value })} disabled={!isDraft}><option value="Grand Total">Grand Total</option><option value="Net Total">Net Total</option></select></div>
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
            key: 'address',
            label: 'Address & Contact',
            children: (
                <div className="space-y-6 animate-fade-in mt-2 pb-8">
                    <div className={sectionTitleStyle + ' mt-0'}><span>Supplier Address</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={labelStyle}>Supplier Address</label><textarea className={`${inputStyle} h-16 resize-none bg-gray-50 border-gray-100 text-gray-700`} value={formData.supplier_address} onChange={e => setFormData({ ...formData, supplier_address: e.target.value })} disabled={!isDraft}></textarea></div>
                        <div><label className={labelStyle}>Supplier Contact</label><textarea className={`${inputStyle} h-16 resize-none bg-gray-50 border-gray-100 text-gray-700`} value={formData.supplier_contact} onChange={e => setFormData({ ...formData, supplier_contact: e.target.value })} disabled={!isDraft}></textarea></div>
                    </div>
                    
                    <div className={sectionTitleStyle}><span>Shipping Address</span></div>
                    <div className="max-w-md"><label className={labelStyle}>Shipping Address</label><textarea className={`${inputStyle} h-16 resize-none bg-gray-50 border-gray-100 text-gray-700`} value={formData.shipping_address} onChange={e => setFormData({ ...formData, shipping_address: e.target.value })} disabled={!isDraft}></textarea></div>

                    <div className={sectionTitleStyle}><span>Company Billing Address</span></div>
                    <div className="max-w-md"><label className={labelStyle}>Company Billing Address</label><textarea className={`${inputStyle} h-16 resize-none bg-gray-50 border-gray-100 text-gray-700`} value={formData.company_billing_address} onChange={e => setFormData({ ...formData, company_billing_address: e.target.value })} disabled={!isDraft}></textarea></div>
                </div>
            )
        },
        {
            key: 'drop_ship',
            label: 'Drop Ship',
            children: (
                <div className="space-y-6 animate-fade-in mt-2 pb-8">
                    <div className="max-w-md">
                        <label className={labelStyle}>Customer</label>
                        <input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.customer || ''} onChange={e => setFormData({ ...formData, customer: e.target.value })} disabled={!isDraft} />
                    </div>
                    <div className="max-w-md">
                        <label className={labelStyle}>Customer Name</label>
                        <input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.customer_name || ''} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} disabled={!isDraft} />
                    </div>
                </div>
            )
        },
        {
            key: 'terms',
            label: 'Terms',
            children: (
                <div className="space-y-6 animate-fade-in mt-2 pb-8">
                    <div className={sectionTitleStyle + ' mt-0'}><span>Payment Terms</span></div>
                    <div className="max-w-md"><label className={labelStyle}>Payment Terms Template</label><input className={`${inputStyle} bg-gray-50 border-gray-100`} value={formData.payment_terms_template} onChange={e => setFormData({ ...formData, payment_terms_template: e.target.value })} disabled={!isDraft} /></div>
                    
                    <div className="mt-4">
                        <label className={labelStyle}>Payment Schedule</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={`${thStyle} w-10 text-center`}><input type="checkbox" className="rounded border-gray-300" /></th>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Payment Term</th>
                                        <th className={thStyle}>Description</th>
                                        <th className={thStyle}>Due Date *</th>
                                        <th className={`${thStyle} text-right`}>Invoice Portion</th>
                                        <th className={`${thStyle} text-right`}>Payment Amount *</th>
                                        <th className={`${thStyle} w-10 text-center`}>⚙️</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(formData.payment_schedule || []).length === 0 ? null : (formData.payment_schedule || []).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                            <td className={`${tdStyle} text-center`}><input type="checkbox" className="rounded border-gray-300 text-blue-600" /></td>
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.payment_term || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_term', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.description || ''} onChange={e => handleRowChange('payment_schedule', i, 'description', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="date" className={rowInputStyle} value={row.due_date || ''} onChange={e => handleRowChange('payment_schedule', i, 'due_date', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.invoice_portion || ''} onChange={e => handleRowChange('payment_schedule', i, 'invoice_portion', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={tdStyle}><input type="number" className={`${rowInputStyle} text-right`} value={row.payment_amount || ''} onChange={e => handleRowChange('payment_schedule', i, 'payment_amount', e.target.value)} disabled={!isDraft} /></td>
                                            <td className={`${tdStyle} text-center`}>{isDraft && <button onClick={() => handleRemoveRow('payment_schedule', i)} className="text-gray-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-gray-200 transition">✕</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(formData.payment_schedule || []).length === 0 && renderEmptyTable()}
                        </div>
                        {isDraft && <button onClick={() => handleAddRow('payment_schedule', { payment_term: '', description: '', due_date: '', invoice_portion: 0, payment_amount: 0 })} className="mt-3 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-200 rounded shadow-sm transition">Add Row</button>}
                    </div>

                    <div className={sectionTitleStyle}><span>Terms & Conditions</span></div>
                    <div className="max-w-md"><label className={labelStyle}>Terms</label><input className={`${inputStyle} bg-gray-50 border-gray-100`} value={formData.tc_name} onChange={e => setFormData({ ...formData, tc_name: e.target.value })} disabled={!isDraft} /></div>
                    
                    <div className="mt-4">
                        <label className={labelStyle}>Terms and Conditions</label>
                        <div className="border border-gray-200 rounded overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-2 text-gray-500 overflow-x-auto text-[13px]">
                                <select className="bg-transparent border-none outline-none font-medium"><option>Normal</option></select>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button className="hover:text-gray-900 px-1 font-bold">B</button>
                                <button className="hover:text-gray-900 px-1 italic">I</button>
                                <button className="hover:text-gray-900 px-1 underline">U</button>
                                <button className="hover:text-gray-900 px-1 line-through">S</button>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button className="hover:text-gray-900 px-1">A</button>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button className="hover:text-gray-900 px-1">"</button>
                                <button className="hover:text-gray-900 px-1">{'</>'}</button>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button className="hover:text-gray-900 px-1 flex items-center">¶ <FiChevronDown className="ml-1 opacity-50"/></button>
                                <button className="hover:text-gray-900 px-1">🔗</button>
                                <button className="hover:text-gray-900 px-1">🖼</button>
                                <button className="hover:text-gray-900 px-1 flex items-center gap-0.5">≡</button>
                                <button className="hover:text-gray-900 px-1">Table</button>
                            </div>
                            <textarea className={`${inputStyle} border-0 rounded-none h-40 resize-none w-full bg-white`} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} disabled={!isDraft}></textarea>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'more_info',
            label: 'More Info',
            children: (
                <div className="space-y-6 animate-fade-in mt-2 pb-8">
                    <div className={sectionTitleStyle + ' mt-0'}><span>Order Status</span></div>
                    <div className="max-w-md"><label className={labelStyle}>Status *</label><input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.status} disabled /></div>

                    <div className={sectionTitleStyle}><span>Printing Settings</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Letter Head</label><input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.letter_head} onChange={e => setFormData({ ...formData, letter_head: e.target.value })} disabled={!isDraft} /></div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="group_same_items" checked={!!formData.group_same_items} onChange={e => setFormData({ ...formData, group_same_items: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300" disabled={!isDraft} />
                                <label htmlFor="group_same_items" className="text-[13px] font-medium text-gray-700">Group same items</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div><label className={labelStyle}>Print Heading</label><input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.select_print_heading} onChange={e => setFormData({ ...formData, select_print_heading: e.target.value })} disabled={!isDraft} /></div>
                            <div><label className={labelStyle}>Print Language</label><input className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-700`} value={formData.print_language} onChange={e => setFormData({ ...formData, print_language: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                    </div>

                    <div className={sectionTitleStyle}><span>Auto Repeat</span></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div><label className={labelStyle}>From Date</label><input type="date" className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-500`} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} disabled={!isDraft} /></div>
                            <div><label className={labelStyle}>To Date</label><input type="date" className={`${inputStyle} bg-gray-50 border-gray-100 text-gray-500`} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} disabled={!isDraft} /></div>
                        </div>
                    </div>

                    <div className={sectionTitleStyle}><span>Additional Info</span></div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_internal_supplier" checked={!!formData.is_internal_supplier} onChange={e => setFormData({ ...formData, is_internal_supplier: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 bg-gray-50 border-gray-200" disabled={!isDraft} />
                        <label htmlFor="is_internal_supplier" className="text-[13px] font-medium text-gray-700">Is Internal Supplier</label>
                    </div>
                </div>
            )
        },
        {
            key: 'connections',
            label: 'Connections',
            children: (
                <div className="space-y-6 animate-fade-in mt-2 pb-8">
                    <div className="text-sm text-gray-500 italic py-8 text-center">No connections found for this document.</div>
                </div>
            )
        }
    ];

    const actionMenuItems = [
        { key: 'placeholder1', label: 'Action 1' },
    ];

    const viewMenuItems = [
        { key: 'view', label: 'View' },
    ];

    const poCreateMenuItems = [
        { key: 'purchase_receipt', label: 'Purchase Receipt' },
        { key: 'purchase_invoice', label: 'Purchase Invoice' },
        { key: 'payment', label: 'Payment' },
        { key: 'payment_request', label: 'Payment Request' },
    ];

    const handleStatusChange = async ({ key }) => {
        setSaving(true);
        try {
            if (key === 'delivered') {
                // Use update_status method for delivered
                await API.post('/api/method/erpnext.buying.doctype.purchase_order.purchase_order.update_status', {
                    status: 'Delivered',
                    name: editingRecord
                });
                notification.success({ message: 'Purchase Order marked as Delivered' });
            } else if (key === 'close') {
                await API.post('/api/method/erpnext.buying.doctype.purchase_order.purchase_order.close_or_unclose_purchase_orders', {
                    names: JSON.stringify([editingRecord]),
                    status: 'Closed'
                });
                notification.success({ message: 'Purchase Order Closed' });
            } else if (key === 'hold') {
                await API.post('/api/method/frappe.client.set_value', {
                    doctype: 'Purchase Order',
                    name: editingRecord,
                    fieldname: 'status',
                    value: 'On Hold'
                });
                notification.success({ message: 'Purchase Order put On Hold' });
            }
            fetchDetails(editingRecord);
        } catch (err) {
            notification.error({ message: 'Status Update Failed', description: parseFrappeError(err), duration: 6 });
        } finally { setSaving(false); }
    };

    const poStatusMenuItems = [
        { key: 'hold', label: 'Hold' },
        { key: 'close', label: 'Close' },
        { key: 'delivered', label: 'Delivered' },
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord ? editingRecord : 'New Purchase Order'}
                    </span>
                    <div className="flex items-center gap-2">
                        {getStatusLabel()}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isDraft && (
                        <>
                            <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300 bg-gray-50">
                                    Get Items From <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                                    Tools <FiChevronDown />
                                </Button>
                            </Dropdown>
                        </>
                    )}

                    {isSubmitted && (
                        <>
                            <Button className="h-8 text-[13px] border-gray-300 font-medium">Update Items</Button>

                            <Dropdown menu={{ items: poStatusMenuItems, onClick: handleStatusChange }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                                    Status <FiChevronDown />
                                </Button>
                            </Dropdown>

                            <Dropdown menu={{ items: poCreateMenuItems }} trigger={['click']}>
                                <Button className="flex items-center gap-1 h-8 text-[13px] bg-[#1a202c] text-white border-[#1a202c] hover:!text-white hover:!border-[#1a202c] hover:!bg-[#2d3748] font-medium transition-colors">
                                    Create <FiChevronDown />
                                </Button>
                            </Dropdown>
                        </>
                    )}

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300 bg-gray-50 text-gray-600" />

                    {isDraft && (
                        <button className="px-5 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    )}
                    
                    {editingRecord && isDraft && (
                        <Popconfirm title="Delete this order?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                    {editingRecord && isDraft && (
                        <button className="px-6 py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-70 ml-2" onClick={() => handleDocAction('submit')} disabled={saving}>Submit</button>
                    )}
                    {editingRecord && (isSubmitted || formData.docstatus === 2) && (
                        <Button className="h-8 text-[13px] border-gray-300 ml-2" onClick={() => handleDocAction('cancel')} disabled={saving}>Cancel</Button>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? <div className="flex justify-center items-center h-40"><Spin size="large" /></div> : <Tabs defaultActiveKey="details" items={tabItems} className="custom-po-tabs" />}
            </div>

            <Modal
                title="Confirm"
                open={!!confirmAction}
                onOk={handleConfirmAction}
                onCancel={() => setConfirmAction(null)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ style: { background: '#111827', borderColor: '#111827', color: 'white' } }}
                centered
            >
                <div className="py-4 text-base text-gray-800">
                    {confirmAction === 'submit' ? 'Permanently Submit' : 'Cancel'} {editingRecord}?
                </div>
            </Modal>

            <style>{`
                .custom-po-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f3f4f6; }
                .custom-po-tabs .ant-tabs-tab { padding: 12px 0; margin: 0 32px 0 0; color: #6b7280; font-size: 14px; }
                .custom-po-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #111827 !important; font-weight: 700; }
                .custom-po-tabs .ant-tabs-ink-bar { background: #111827; height: 3px !important; border-radius: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PurchaseOrder;
