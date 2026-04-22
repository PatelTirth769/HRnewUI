import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notification, Spin, Tabs, Dropdown, Button } from 'antd';
import { FiChevronDown } from 'react-icons/fi';
import API from '../../services/api';

const PurchaseInvoice = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [projects, setProjects] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);
    const [printHeadings, setPrintHeadings] = useState([]);
    const [supplierGroups, setSupplierGroups] = useState([]);
    const [payableAccounts, setPayableAccounts] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [openSections, setOpenSections] = useState({ discount: true, raw: true });
    const navigate = useNavigate();

    const init = {
        naming_series: 'ACC-PINV-.YYYY.-',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0],
        supplier: '',
        company: 'Preeshee Consultancy Services',
        is_paid: 0,
        is_return: 0,
        apply_tds: 0,
        tax_withholding_category: '',
        set_posting_time: 0,
        due_date: '',
        bill_no: '',
        bill_date: '',
        update_billed_amount_in_purchase_order: 0,
        update_billed_amount_in_purchase_receipt: 0,
        cost_center: '',
        project: '',
        currency: 'INR',
        buying_price_list: 'Standard Buying',
        update_stock: 0,
        set_accepted_warehouse: '',
        is_subcontracted: 0,
        rejected_warehouse: '',
        use_transaction_date_exchange_rate: 0,
        ignore_pricing_rule: 0,
        return_against: '',
        scan_barcode: '',
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
        outstanding_amount: 0,
        disable_rounded_total: 0,
        use_company_roundoff_cost_center: 0,
        total_advance: 0,
        set_advances_and_allocate_fifo: 0,
        only_include_allocated_payments: 0,
        write_off_amount: 0,
        apply_additional_discount_on: 'Grand Total',
        additional_discount_percentage: 0,
        additional_discount_amount: 0,
        taxes_and_charges_added: 0,
        taxes_and_charges_deducted: 0,
        docstatus: 0,
        status: 'Draft',
        // Address
        supplier_address: '',
        contact_person: '',
        shipping_address: '',
        // Terms
        payment_terms_template: '',
        tc_name: '',
        terms: '',
        status: 'Draft',
        credit_to: '',
        is_opening_entry: 'No',
        subscription: '',
        from_date: '',
        to_date: '',
        select_supplier_address: '',
        select_shipping_address: '',
        select_billing_address: '',
        group_same_items: 0,
        print_language: 'en',
        hold_invoice: 0,
        release_date: '',
        reason_for_hold: '',
        is_internal_supplier: 0,
        supplier_group: '',
        remarks: '',
        payment_schedule: [],
        // More Info
        letter_head: '',
        select_print_heading: '',
        group_same_items: 0,
        items: [],
        taxes: [],
        payments: [],
        supplied_items: [],
        advances: []
    };

    const location = useLocation();
    const [formData, setFormData] = useState(init);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('from_po') === '1') {
            const piData = sessionStorage.getItem('pi_from_po');
            if (piData) {
                try {
                    const parsed = JSON.parse(piData);
                    setFormData({
                        ...init,
                        ...parsed,
                        docstatus: 0,
                        status: 'Draft',
                        items: (parsed.items || []).map(item => ({
                            ...item,
                            amount: (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)
                        }))
                    });
                    sessionStorage.removeItem('pi_from_po');
                } catch (e) {
                    console.error('Failed to parse PO data for PI:', e);
                }
            }
            setView('form');
            fetchDD();
        } else if (view === 'list') fetchRecords();
        else {
            fetchDD();
            if (editingRecord) fetchDetails(editingRecord);
            else setFormData(init);
        }
    }, [view, editingRecord, location]);

    useEffect(() => {
        if (view === 'form') calc();
    }, [formData.items, formData.taxes, formData.discount_amount, formData.disable_rounded_total]);

    const handleCreateAction = ({ key }) => {
        if (key === 'payment') {
            navigate(`/accounting/payment-entry?source_name=${editingRecord}&source_doctype=Purchase Invoice`);
        }
    };

    const createMenuItems = [
        { key: 'payment', label: 'Payment' }
    ];


    const calc = () => {
        let tq = 0, tv = 0;
        const mi = (formData.items || []).map(r => {
            const q = parseFloat(r.qty) || 0, rt = parseFloat(r.rate) || 0, a = q * rt;
            tq += q; tv += a; return { ...r, amount: a };
        });
        
        let tt = 0, ta = 0, td = 0;
        (formData.taxes || []).forEach(r => { 
            const amt = parseFloat(r.tax_amount) || 0;
            if (r.charge_type === 'Actual' || r.charge_type === 'On Net Total') {
               if (amt >= 0) ta += amt; else td += Math.abs(amt);
               tt += amt;
            }
        });

        const dp = parseFloat(formData.additional_discount_percentage) || 0;
        let da = parseFloat(formData.additional_discount_amount) || 0;
        if (dp > 0) da = (tv + tt) * (dp / 100);

        let gt = tv + tt - da, rt2 = gt, ra = 0;
        if (!formData.disable_rounded_total) { rt2 = Math.round(gt); ra = rt2 - gt; }
        
        let adv_total = 0;
        (formData.advances || []).forEach(r => { adv_total += parseFloat(r.allocated_amount) || 0; });
        
        const wo = parseFloat(formData.write_off_amount) || 0;
        const oa = rt2 - adv_total - wo;

        if (formData.total_qty !== tq || formData.total !== tv || formData.grand_total !== gt) {
            setFormData(p => ({ ...p, items: mi, total_qty: tq, total: tv, total_taxes_and_charges: tt,
                taxes_and_charges_added: ta, taxes_and_charges_deducted: td, additional_discount_amount: da,
                grand_total: gt, rounded_total: rt2, rounding_adjustment: ra, total_advance: adv_total, outstanding_amount: oa }));
        }
    };

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Purchase Invoice?fields=["name","supplier","posting_date","grand_total","docstatus","status"]&limit_page_length=None&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch Purchase Invoices' }); }
        finally { setLoading(false); }
    };

    const fetchDD = async () => {
        try {
            const [s, c, p, cc, wh, lh, ph, sg, acc, sub] = await Promise.all([
                API.get('/api/resource/Supplier?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Project?fields=["name"]'),
                API.get('/api/resource/Cost Center?fields=["name"]'),
                API.get('/api/resource/Warehouse?fields=["name"]'),
                API.get('/api/resource/Letter Head?fields=["name"]'),
                API.get('/api/resource/Print Heading?fields=["name"]'),
                API.get('/api/resource/Supplier Group?fields=["name"]'),
                API.get('/api/resource/Account?filters=[["root_type","=","Liability"],["is_group","=",0]]&fields=["name"]'),
                API.get('/api/resource/Subscription?fields=["name"]')
            ]);
            setSuppliers(s.data.data || []);
            setCompanies(c.data.data || []);
            setProjects(p.data.data || []);
            setCostCenters(cc.data.data || []);
            setWarehouses(wh.data.data || []);
            setLetterHeads(lh.data.data || []);
            setPrintHeadings(ph.data.data || []);
            setSupplierGroups(sg.data.data || []);
            setPayableAccounts(acc.data.data || []);
            setSubscriptions(sub.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Purchase Invoice/${encodeURIComponent(n)}`);
            const d = r.data.data;
            ['items','taxes','payment_schedule','payments'].forEach(k => { if (!d[k]) d[k] = []; });
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.supplier) { notification.warning({ message: 'Supplier is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Purchase Invoice/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
                fetchDetails(editingRecord);
            } else {
                const res = await API.post('/api/resource/Purchase Invoice', formData);
                const newName = res.data.data.name;
                notification.success({ message: 'Created.' });
                setEditingRecord(newName);
                fetchDetails(newName);
                // Stay on page to allow Submit
            }
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Save Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDocAction = async (action) => {
        if (!window.confirm(action === 'submit' ? 'Submit?' : 'Cancel?')) return;
        setSaving(true);
        try {
            const ep = action === 'submit' ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(ep, { doc: { ...formData, name: editingRecord, doctype: 'Purchase Invoice' } });
            notification.success({ message: `${action === 'submit' ? 'Submitted' : 'Cancelled'}.` });
            fetchDetails(editingRecord);
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete?')) return;
        try {
            await API.delete(`/api/resource/Purchase Invoice/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const td = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const F = (v) => `₹ ${Number(v || 0).toFixed(2)}`;

    const childTable = (key, cols, newRow) => (
        <div>
            <div className="border border-gray-200 rounded-md overflow-hidden bg-[#F9FAFB]">
                <table className="w-full">
                    <thead className="border-b border-gray-200"><tr><th className={`${th} w-10 text-center`}>No.</th>{cols.map((c,ci)=><th key={ci} className={`${th} ${c.right?'text-right':''}`}>{c.label}</th>)}<th className={`${th} w-10`}></th></tr></thead>
                    <tbody>
                        {(formData[key]||[]).length===0 ? null : (formData[key]||[]).map((row,i)=>(
                            <tr key={i} className="hover:bg-gray-50 bg-white border-b border-gray-100 last:border-0">
                                <td className={`${td} text-center font-medium text-gray-500`}>{i+1}</td>
                                {cols.map((c,ci)=><td key={ci} className={td}>
                                    {c.readOnly ? <span className={c.right?'block text-right text-gray-700':'text-gray-700'}>{c.fmt ? F(row[c.field]) : (row[c.field]||'')}</span>
                                    : <input type={c.type||'text'} className={`${ri} ${c.right?'text-right':''}`} value={row[c.field]||''} onChange={e=>chRow(key,i,c.field,e.target.value)} disabled={formData.docstatus !== 0} />}
                                </td>)}
                                <td className={`${td} text-center`}>{formData.docstatus === 0 && <button onClick={()=>rmRow(key,i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(formData[key]||[]).length===0 && (
                    <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200">
                        <span className="text-sm font-medium text-gray-400 italic">No Data</span>
                    </div>
                )}
            </div>
            {formData.docstatus === 0 && <button onClick={()=>addRow(key,newRow)} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
        </div>
    );

    const getStatusLabel = (r) => {
        const doc = r || formData;
        if (!doc.name && !editingRecord) return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-50 text-red-600 font-medium border border-red-200 ml-2">Not Saved</span>;
        if (doc.docstatus === 2) return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-gray-100 text-gray-600 font-medium border border-gray-200 ml-2">Cancelled</span>;
        if (doc.docstatus === 1) {
            const isPaid = doc.status === 'Paid';
            return <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium border ml-2 ${isPaid ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                {isPaid ? 'Paid' : 'Unpaid'}
            </span>;
        }
        return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-blue-50 text-blue-600 font-medium border border-blue-200 ml-2">Draft</span>;
    };

    const tabs = [
        { key: 'details', label: 'Details', children: (
            <div className="space-y-6 animate-fade-in pb-8">
                <div className="grid grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div><label className={lbl}>Series *</label><input className={inp} value={formData.naming_series} disabled /></div>
                        <div><label className={lbl}>Supplier *</label><select className={inp} value={formData.supplier} onChange={async e=>{
                            const val = e.target.value;
                            if (val) {
                                try {
                                    const res = await API.get(`/api/resource/Supplier/${val}`);
                                    const sd = res.data.data;
                                    setFormData(p=>({...p, supplier: val, credit_to: sd.default_payable_account || p.credit_to, supplier_group: sd.supplier_group || p.supplier_group}));
                                } catch (err) { setFormData(p=>({...p, supplier: val})); }
                            } else { setFormData(p=>({...p, supplier: ''})); }
                        }} disabled={formData.docstatus !== 0}><option value="">Select Supplier</option>{suppliers.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
                        <div><label className={lbl}>Company</label><select className={inp} value={formData.company} onChange={e=>setFormData({...formData,company:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Company</option>{companies.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                    </div>

                    {/* Middle Column */}
                    <div className="space-y-6">
                        <div><label className={lbl}>Date *</label><input type="date" className={inp} value={formData.posting_date} onChange={e=>setFormData({...formData,posting_date:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                        <div>
                            <label className={lbl}>Posting Time</label>
                            <input type="time" step="1" className={inp} value={formData.posting_time} onChange={e=>setFormData({...formData,posting_time:e.target.value})} disabled={formData.docstatus !== 0 || !formData.set_posting_time}/>
                            <label className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-medium cursor-pointer"><input type="checkbox" checked={!!formData.set_posting_time} onChange={e=>setFormData({...formData,set_posting_time:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-3.5 h-3.5 rounded border-gray-300"/> Edit Posting Date and Time</label>
                        </div>
                        <div><label className={lbl}>Due Date</label><input type="date" className={inp} value={formData.due_date} onChange={e=>setFormData({...formData,due_date:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                        {formData.is_return === 1 && <div><label className={lbl}>Return Against</label><input className={inp} value={formData.return_against} onChange={e=>setFormData({...formData,return_against:e.target.value})} disabled={formData.docstatus !== 0} placeholder="Search Purchase Invoice..."/></div>}
                    </div>

                    {/* Right Column (Checkboxes) */}
                    <div className="space-y-3 pt-6 font-medium text-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!formData.is_paid} onChange={e=>setFormData({...formData,is_paid:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600 border-gray-300" disabled={formData.docstatus !== 0}/> <span className="text-sm">Is Paid</span></label>
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!formData.is_return} onChange={e=>{
                            const val = e.target.checked ? 1 : 0;
                            setFormData({
                                ...formData,
                                is_return: val,
                                update_billed_amount_in_purchase_receipt: val,
                                update_billed_amount_in_purchase_order: 0
                            });
                        }} className="w-4 h-4 rounded text-blue-600 border-gray-300" disabled={formData.docstatus !== 0}/> <span className="text-sm">Is Return (Debit Note)</span></label>
                        {formData.is_return === 1 && (
                            <div className="ml-7 space-y-3 pb-2 pt-1 border-l-2 border-blue-50 pl-4">
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!formData.update_billed_amount_in_purchase_order} onChange={e=>setFormData({...formData,update_billed_amount_in_purchase_order:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/> <span className="text-[13px]">Update Billed Amount in Purchase Order</span></label>
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!formData.update_billed_amount_in_purchase_receipt} onChange={e=>setFormData({...formData,update_billed_amount_in_purchase_receipt:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/> <span className="text-[13px]">Update Billed Amount in Purchase Receipt</span></label>
                            </div>
                        )}
                        <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={!!formData.apply_tds} onChange={e=>setFormData({...formData,apply_tds:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600 border-gray-300" disabled={formData.docstatus !== 0}/> <span className="text-sm">Apply Tax Withholding Amount</span></label>
                        {!!formData.apply_tds && <div className="mt-2"><label className={lbl}>Tax Withholding Category</label><input className={inp} value={formData.tax_withholding_category} onChange={e=>setFormData({...formData,tax_withholding_category:e.target.value})} disabled={formData.docstatus !== 0}/></div>}
                    </div>
                </div>

                <div className={sec}>Supplier Invoice</div>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Supplier Invoice No</label><input className={inp} value={formData.bill_no} onChange={e=>setFormData({...formData,bill_no:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                    <div><label className={lbl}>Supplier Invoice Date</label><input type="date" className={inp} value={formData.bill_date} onChange={e=>setFormData({...formData,bill_date:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                </div>

                <div className={sec}>Accounting Dimensions</div>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Cost Center</label><select className={inp} value={formData.cost_center} onChange={e=>setFormData({...formData,cost_center:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Cost Center</option>{costCenters.map(cc=><option key={cc.name} value={cc.name}>{cc.name}</option>)}</select></div>
                    <div><label className={lbl}>Project</label><select className={inp} value={formData.project} onChange={e=>setFormData({...formData,project:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Project</option>{projects.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></div>
                </div>

                <div className={sec}>Currency and Price List</div>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Currency</label><input className={inp} value={formData.currency} disabled /></div>
                    <div><label className={lbl}>Price List</label><input className={inp} value={formData.buying_price_list} disabled /></div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.use_transaction_date_exchange_rate} onChange={e=>setFormData({...formData,use_transaction_date_exchange_rate:e.target.checked?1:0})} disabled={formData.docstatus !== 0}/><span className="text-sm font-medium text-gray-700">Use Transaction Date Exchange Rate</span></label>
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.ignore_pricing_rule} onChange={e=>setFormData({...formData,ignore_pricing_rule:e.target.checked?1:0})} disabled={formData.docstatus !== 0}/><span className="text-sm font-medium text-gray-700">Ignore Pricing Rule</span></label>
                    </div>
                </div>

                <div className={sec}>Items</div>
                <div className="grid grid-cols-2 gap-8 mb-4">
                    <div><label className={lbl}>Scan Barcode</label><input className={inp} value={formData.scan_barcode} onChange={e=>setFormData({...formData,scan_barcode:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.update_stock} onChange={e=>setFormData({...formData,update_stock:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={formData.docstatus !== 0}/><span className="text-sm font-semibold text-gray-700">Update Stock</span></label>
                        {!!formData.update_stock && (
                            <div className="space-y-4 pt-2">
                                <div><label className={lbl}>Set Accepted Warehouse</label><select className={inp} value={formData.set_accepted_warehouse} onChange={e=>setFormData({...formData,set_accepted_warehouse:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Warehouse</option>{warehouses.map(w=><option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.is_subcontracted} onChange={e=>setFormData({...formData,is_subcontracted:e.target.checked?1:0})} disabled={formData.docstatus !== 0}/><span className="text-sm font-medium text-gray-700">Is Subcontracted</span></label>
                                <div><label className={lbl}>Rejected Warehouse</label><select className={inp} value={formData.rejected_warehouse} onChange={e=>setFormData({...formData,rejected_warehouse:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Warehouse</option>{warehouses.map(w=><option key={w.name} value={w.name}>{w.name}</option>)}</select></div>
                            </div>
                        )}
                    </div>
                </div>
                {childTable('items',[{label:'Item Code',field:'item_code'},{label:'Accepted Qty',field:'qty',type:'number',right:true},{label:'Rate (INR)',field:'rate',type:'number',right:true},{label:'Amount (INR)',field:'amount',readOnly:true,fmt:true,right:true}],{item_code:'',qty:0,rate:0,amount:0})}
                
                <div className="grid grid-cols-2 gap-8 mt-6">
                    <div><label className={lbl}>Total Quantity</label><div className={`${inp} bg-gray-50 border-transparent font-semibold`}>{formData.total_qty}</div></div>
                    <div><label className={lbl}>Total (INR)</label><div className={`${inp} bg-gray-50 border-transparent font-bold text-right`}>{F(formData.total)}</div></div>
                </div>

                <div className={sec}>Taxes and Charges</div>
                <div className="grid grid-cols-3 gap-6">
                    <div><label className={lbl}>Tax Category</label><input className={inp} value={formData.tax_category} onChange={e=>setFormData({...formData,tax_category:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                    <div><label className={lbl}>Shipping Rule</label><input className={inp} value={formData.shipping_rule} onChange={e=>setFormData({...formData,shipping_rule:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                    <div><label className={lbl}>Incoterm</label><input className={inp} value={formData.incoterm} onChange={e=>setFormData({...formData,incoterm:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                </div>
                <div className="max-w-sm mt-4"><label className={lbl}>Purchase Taxes and Charges Template</label><input className={inp} value={formData.taxes_and_charges} onChange={e=>setFormData({...formData,taxes_and_charges:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                <div className="mt-4">
                    {childTable('taxes',[{label:'Type',field:'charge_type'},{label:'Account Head',field:'account_head'},{label:'Rate',field:'rate',type:'number',right:true},{label:'Tax Amount',field:'tax_amount',type:'number',right:true},{label:'Total',field:'total',readOnly:true,fmt:true,right:true}],{charge_type:'Actual',account_head:'',rate:0,tax_amount:0,total:0})}
                </div>
                
                <div className="flex justify-end mt-4">
                    <div className="w-1/3 space-y-3">
                        <div><label className={lbl}>Taxes and Charges Added (INR)</label><div className={`${inp} text-right bg-gray-50 border-transparent`}>{F(formData.taxes_and_charges_added)}</div></div>
                        <div><label className={lbl}>Taxes and Charges Deducted (INR)</label><div className={`${inp} text-right bg-gray-50 border-transparent`}>{F(formData.taxes_and_charges_deducted)}</div></div>
                        <div><label className={lbl}>Total Taxes and Charges (INR)</label><div className={`${inp} text-right bg-gray-50 border-transparent font-semibold`}>{F(formData.total_taxes_and_charges)}</div></div>
                    </div>
                </div>
                
                <div className={sec}>Totals</div>
                <div className="grid grid-cols-2 gap-8 mt-4"><div></div>
                    <div className="space-y-4 bg-gray-50 p-6 border rounded-lg shadow-sm">
                        <div><label className={lbl}>Grand Total (INR)</label><div className={`${inp} text-right font-bold text-lg bg-white`}>{F(formData.grand_total)}</div></div>
                        <div><label className={lbl}>Rounding Adjustment (INR)</label><div className={`${inp} text-right bg-white`}>{F(formData.rounding_adjustment)}</div></div>
                        <label className="flex items-center gap-2 text-xs text-gray-500 font-medium py-1"><input type="checkbox" checked={!!formData.use_company_roundoff_cost_center} onChange={e=>setFormData({...formData,use_company_roundoff_cost_center:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-3.5 h-3.5 rounded border-gray-300"/> Use Company Default Round Off Cost Center</label>
                        <div><label className={lbl}>Rounded Total (INR)</label><div className={`${inp} text-right font-black text-xl text-blue-700 bg-white`}>{F(formData.rounded_total)}</div></div>
                        <div><label className={lbl}>Total Advance (INR)</label><input type="number" className={`${inp} text-right`} value={formData.total_advance} onChange={e=>setFormData({...formData,total_advance:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                        <div><label className={lbl}>Outstanding Amount (INR)</label><div className={`${inp} text-right font-bold text-lg text-orange-600 bg-white border-orange-100`}>{F(formData.outstanding_amount)}</div></div>
                    </div>
                </div>

                <div className={sec + " cursor-pointer hover:bg-gray-50 transition-colors"} onClick={() => setOpenSections(p => ({ ...p, discount: !p.discount }))}>
                    Additional Discount {openSections.discount ? <FiChevronDown className="ml-auto transform rotate-180" /> : <FiChevronDown className="ml-auto" />}
                </div>
                {openSections.discount && (
                    <div className="grid grid-cols-2 gap-8 animate-fade-in-down">
                        <div>
                            <label className={lbl}>Apply Additional Discount On</label>
                            <select className={inp} value={formData.apply_additional_discount_on} onChange={e=>setFormData({...formData,apply_additional_discount_on:e.target.value})} disabled={formData.docstatus !== 0}>
                                <option value="Grand Total">Grand Total</option>
                                <option value="Net Total">Net Total</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <div><label className={lbl}>Additional Discount Percentage</label><input type="number" className={inp} value={formData.additional_discount_percentage} onChange={e=>setFormData({...formData,additional_discount_percentage:e.target.value})} disabled={formData.docstatus !== 0} step="0.001"/></div>
                            <div><label className={lbl}>Additional Discount Amount (INR)</label><input type="number" className={inp} value={formData.additional_discount_amount} onChange={e=>setFormData({...formData,additional_discount_amount:e.target.value})} disabled={formData.docstatus !== 0 || formData.additional_discount_percentage > 0}/></div>
                        </div>
                    </div>
                )}

                <div className={sec + " cursor-pointer hover:bg-gray-50 transition-colors"} onClick={() => setOpenSections(p => ({ ...p, raw: !p.raw }))}>
                    Raw Materials Supplied {openSections.raw ? <FiChevronDown className="ml-auto transform rotate-180" /> : <FiChevronDown className="ml-auto" />}
                </div>
                {openSections.raw && (
                    <div className="mt-4 animate-fade-in-down">
                        <label className={lbl}>Supplied Items</label>
                        {childTable('supplied_items', [
                            { label: 'Item Code', field: 'item_code' },
                            { label: 'Raw Material Item Code', field: 'rm_item_code' },
                            { label: 'Available Qty For Consumption', field: 'available_qty_for_consumption', right: true },
                            { label: 'Qty to Be Consumed', field: 'required_qty', right: true },
                            { label: 'Current Stock', field: 'current_stock', right: true }
                        ], { item_code: '', rm_item_code: '', available_qty_for_consumption: 0, required_qty: 0, current_stock: 0 })}
                    </div>
                )}
            </div>
        )},
        { key: 'payments', label: 'Payments', children: (
            <div className="space-y-6 animate-fade-in pb-8">
                <div className={sec + " cursor-pointer mt-0 flex items-center justify-between"} onClick={() => setOpenSections(p => ({ ...p, advance: !p.advance }))}>
                    Advance Payments {openSections.advance ? <FiChevronDown className="transform rotate-180" /> : <FiChevronDown />}
                </div>
                {openSections.advance && (
                    <div className="space-y-4 animate-fade-in-down">
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                <input type="checkbox" checked={!!formData.set_advances_and_allocate_fifo} onChange={e=>{
                                    const val = e.target.checked ? 1 : 0;
                                    setFormData({...formData, set_advances_and_allocate_fifo: val, only_include_allocated_payments: 0});
                                }} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/>
                                Set Advances and Allocate (FIFO)
                            </label>
                            {!!formData.set_advances_and_allocate_fifo && (
                                <div className="ml-6 space-y-1 animate-fade-in-down">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                        <input type="checkbox" checked={!!formData.only_include_allocated_payments} onChange={e=>setFormData({...formData,only_include_allocated_payments:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/>
                                        Only Include Allocated Payments
                                    </label>
                                    <p className="text-[11px] text-gray-400 font-medium">Advance payments allocated against orders will only be fetched</p>
                                </div>
                            )}
                        </div>
                        <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition mt-2">Get Advances Paid</button>
                        <div className="mt-2">
                            <label className={lbl}>Advances</label>
                            {childTable('advances', [
                                { label: 'Reference Name', field: 'reference_name' },
                                { label: 'Remarks', field: 'remarks' },
                                { label: 'Advance Amount', field: 'advance_amount', right: true },
                                { label: 'Allocated Amount', field: 'allocated_amount', type: 'number', right: true },
                                { label: 'Difference Posting Date', field: 'difference_posting_date' }
                            ], { reference_name: '', remarks: '', advance_amount: 0, allocated_amount: 0, difference_posting_date: '' })}
                        </div>
                    </div>
                )}

                <div className={sec + " cursor-pointer flex items-center justify-between"} onClick={() => setOpenSections(p => ({ ...p, writeoff: !p.writeoff }))}>
                    Write Off {openSections.writeoff ? <FiChevronDown className="transform rotate-180" /> : <FiChevronDown />}
                </div>
                {openSections.writeoff && (
                    <div className="animate-fade-in-down">
                        <div className="max-w-md">
                            <label className={lbl}>Write Off Amount (INR)</label>
                            <input type="number" className={inp} value={formData.write_off_amount} onChange={e=>setFormData({...formData,write_off_amount:e.target.value})} disabled={formData.docstatus !== 0}/>
                        </div>
                    </div>
                )}
            </div>
        )},
        { key: 'address', label: 'Address & Contact', children: (
            <div className="space-y-8 animate-fade-in mt-2 pb-8">
                <div className="space-y-4">
                    <div className="font-semibold text-gray-800 text-sm border-b pb-2">Supplier Address</div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Select Supplier Address</label><select className={inp} value={formData.select_supplier_address} onChange={e=>setFormData({...formData,select_supplier_address:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Address...</option></select></div>
                        <div><label className={lbl}>Contact Person</label><select className={inp} value={formData.contact_person} onChange={e=>setFormData({...formData,contact_person:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Contact...</option></select></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="font-semibold text-gray-800 text-sm border-b pb-2">Company Shipping Address</div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Select Shipping Address</label><select className={inp} value={formData.select_shipping_address} onChange={e=>setFormData({...formData,select_shipping_address:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Shipping Address...</option></select></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="font-semibold text-gray-800 text-sm border-b pb-2">Company Billing Address</div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Select Billing Address</label><select className={inp} value={formData.select_billing_address} onChange={e=>setFormData({...formData,select_billing_address:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Billing Address...</option></select></div>
                    </div>
                </div>
            </div>
        )},
        { key: 'terms', label: 'Terms', children: (
            <div className="space-y-8 animate-fade-in mt-2 pb-8">
                <div className="space-y-4">
                    <div className="font-semibold text-gray-800 text-sm border-b pb-2">Terms and Conditions</div>
                    <div className="max-w-md"><label className={lbl}>Terms</label><select className={inp} value={formData.tc_name} onChange={e=>setFormData({...formData,tc_name:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Terms...</option></select></div>
                    <div className="mt-4">
                        <label className={lbl}>Terms and Conditions</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
                                {['Normal','--','B','I','U','S','Tx','A','mock','"','</>','¶','L'].map((btn,bi)=>(
                                    <button key={bi} className="h-7 min-w-[28px] px-2 flex items-center justify-center text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded transition select-none" onClick={e=>e.preventDefault()}>{btn}</button>
                                ))}
                                <div className="h-4 w-px bg-gray-300 mx-1"></div>
                                {['≡','≣','⌹','⌺','⌻','⌼','Table'].map((btn,bi)=>(
                                    <button key={bi} className="h-7 min-w-[28px] px-2 flex items-center justify-center text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded transition select-none" onClick={e=>e.preventDefault()}>{btn}</button>
                                ))}
                            </div>
                            <textarea className="w-full h-80 p-4 text-sm focus:outline-none resize-none" value={formData.terms} onChange={e=>setFormData({...formData,terms:e.target.value})} disabled={formData.docstatus !== 0} placeholder="Start typing terms and conditions..."/>
                        </div>
                    </div>
                </div>
            </div>
        )},
        { key: 'more_info', label: 'More Info', children: (
            <div className="space-y-10 animate-fade-in mt-2 pb-8">
                <div className="space-y-4">
                    <div className={sec + " mt-0 flex items-center justify-between"}>Status <FiChevronDown className="transform rotate-180" /></div>
                    <div className="max-w-md"><label className={lbl}>Status</label><select className={inp} value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})} disabled><option value="Draft">Draft</option><option value="Submitted">Submitted</option><option value="Cancelled">Cancelled</option></select></div>
                </div>
                
                <div className="space-y-4">
                    <div className={sec + " mt-0 flex items-center justify-between"}>Accounting Details <FiChevronDown className="transform rotate-180" /></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Credit To *</label><select className={inp} value={formData.credit_to} onChange={e=>setFormData({...formData,credit_to:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Account...</option>{payableAccounts.map(a=><option key={a.name} value={a.name}>{a.name}</option>)}</select></div>
                        <div><label className={lbl}>Is Opening Entry</label><select className={inp} value={formData.is_opening_entry} onChange={e=>setFormData({...formData,is_opening_entry:e.target.value})} disabled={formData.docstatus !== 0}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={sec + " mt-0 flex items-center justify-between"}>Subscription <FiChevronDown className="transform rotate-180" /></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div><label className={lbl}>Subscription</label><select className={inp} value={formData.subscription} onChange={e=>setFormData({...formData,subscription:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Subscription...</option>{subscriptions.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={lbl}>From Date</label>
                                <input type="date" className={inp} value={formData.from_date} onChange={e=>setFormData({...formData,from_date:e.target.value})} disabled={formData.docstatus !== 0}/>
                                <p className="text-[11px] text-gray-400 mt-1 font-medium">Start date of current invoice's period</p>
                            </div>
                            <div>
                                <label className={lbl}>To Date</label>
                                <input type="date" className={inp} value={formData.to_date} onChange={e=>setFormData({...formData,to_date:e.target.value})} disabled={formData.docstatus !== 0}/>
                                <p className="text-[11px] text-gray-400 mt-1 font-medium">End date of current invoice's period</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={sec + " mt-0 flex items-center justify-between cursor-pointer"} onClick={() => setOpenSections(p => ({ ...p, print: !p.print }))}>Print Settings {openSections.print ? <FiChevronDown className="transform rotate-180" /> : <FiChevronDown />}</div>
                    {openSections.print && (
                        <div className="grid grid-cols-2 gap-8 animate-fade-in-down">
                            <div className="space-y-4">
                                <div><label className={lbl}>Letter Head</label><select className={inp} value={formData.letter_head} onChange={e=>setFormData({...formData,letter_head:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Default Letter Head</option>{letterHeads.map(l=><option key={l.name} value={l.name}>{l.name}</option>)}</select></div>
                                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer"><input type="checkbox" checked={!!formData.group_same_items} onChange={e=>setFormData({...formData,group_same_items:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/> Group same items</label>
                            </div>
                            <div className="space-y-4">
                                <div><label className={lbl}>Print Heading</label><select className={inp} value={formData.select_print_heading} onChange={e=>setFormData({...formData,select_print_heading:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Print Heading...</option>{printHeadings.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></div>
                                <div><label className={lbl}>Print Language</label><input className={inp} value={formData.print_language} onChange={e=>setFormData({...formData,print_language:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4">
                    <div className={sec + " mt-0 flex items-center justify-between cursor-pointer"} onClick={() => setOpenSections(p => ({ ...p, hold: !p.hold }))}>Hold Invoice {openSections.hold ? <FiChevronDown className="transform rotate-180" /> : <FiChevronDown />}</div>
                    {openSections.hold && (
                        <div className="grid grid-cols-2 gap-8 animate-fade-in-down">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer"><input type="checkbox" checked={!!formData.hold_invoice} onChange={e=>setFormData({...formData,hold_invoice:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/> Hold Invoice</label>
                                {!!formData.hold_invoice && (
                                    <div className="space-y-1">
                                        <label className={lbl}>Release Date</label>
                                        <input type="date" className={inp} value={formData.release_date} onChange={e=>setFormData({...formData,release_date:e.target.value})} disabled={formData.docstatus !== 0}/>
                                        <p className="text-[11px] text-gray-400 mt-1">Once set, this invoice will be on hold till the set date</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                {!!formData.hold_invoice && (
                                    <div><label className={lbl}>Reason For Putting On Hold</label><textarea className={`${inp} h-32 resize-none`} value={formData.reason_for_hold} onChange={e=>setFormData({...formData,reason_for_hold:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4">
                    <div className={sec + " mt-0 flex items-center justify-between cursor-pointer"} onClick={() => setOpenSections(p => ({ ...p, extra: !p.extra }))}>Additional Info {openSections.extra ? <FiChevronDown className="transform rotate-180" /> : <FiChevronDown />}</div>
                    {openSections.extra && (
                        <div className="grid grid-cols-2 gap-8 animate-fade-in-down">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer"><input type="checkbox" checked={!!formData.is_internal_supplier} onChange={e=>setFormData({...formData,is_internal_supplier:e.target.checked?1:0})} disabled={formData.docstatus !== 0} className="w-4 h-4 rounded border-gray-300"/> Is Internal Supplier</label>
                                <div><label className={lbl}>Supplier Group</label><select className={inp} value={formData.supplier_group} onChange={e=>setFormData({...formData,supplier_group:e.target.value})} disabled={formData.docstatus !== 0}><option value="">Select Supplier Group...</option>{supplierGroups.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></div>
                            </div>
                            <div><label className={lbl}>Remarks</label><textarea className={`${inp} h-32 resize-none`} value={formData.remarks} onChange={e=>setFormData({...formData,remarks:e.target.value})} disabled={formData.docstatus !== 0}/></div>
                        </div>
                    )}
                </div>
            </div>
        )}
    ];

    if (view === 'list') {
        const fil = records.filter(r => { if (!search) return true; const s = search.toLowerCase(); return (r.name||'').toLowerCase().includes(s) || (r.supplier||'').toLowerCase().includes(s); });
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Purchase Invoices</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={fetchRecords}>{loading ? '⟳' : '⟳ Refresh'}</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>+ Add Purchase Invoice</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{fil.length} of {records.length}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-5 py-3 font-semibold text-gray-600">Supplier</th>
                                <th className="px-5 py-3 font-semibold text-gray-600">Date</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-right">Grand Total</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="5" className="text-center py-10 italic text-gray-400">Loading...</td></tr> : fil.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4"><button className="text-blue-600 font-bold" onClick={() => { setEditingRecord(r.name); setView('form'); }}>{r.name}</button></td>
                                    <td className="px-5 py-4">{r.supplier}</td>
                                    <td className="px-5 py-4">{r.posting_date}</td>
                                    <td className="px-5 py-4 text-right">{F(r.grand_total)}</td>
                                    <td className="px-5 py-4 text-center">
                                        {getStatusLabel(r)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">{editingRecord || 'New Purchase Invoice'}</span>
                    {getStatusLabel()}
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition" onClick={()=>setView('list')}>Back</button>
                    {formData.docstatus === 1 && (
                        <Dropdown menu={{ items: createMenuItems, onClick: handleCreateAction }}>
                            <Button className="flex items-center gap-1 h-[38px] px-6 bg-gray-900 text-white rounded-md text-sm font-bold hover:!bg-gray-800 hover:!text-white border-none transition">
                                Create <FiChevronDown />
                            </Button>
                        </Dropdown>
                    )}
                    {formData.docstatus === 0 && <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition" onClick={handleSave} disabled={saving}>Save</button>}
                    {editingRecord && formData.docstatus === 0 && (
                        <>
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition" onClick={()=>handleDocAction('submit')} disabled={saving}>Submit</button>
                            <button className="px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition" onClick={handleDelete} disabled={saving}>Cancel</button>
                        </>
                    )}
                    {formData.docstatus === 1 && <button className="px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition" onClick={()=>handleDocAction('cancel')} disabled={saving}>Cancel</button>}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <Tabs defaultActiveKey="details" items={tabs} />
            </div>
        </div>
    );
};

export default PurchaseInvoice;
