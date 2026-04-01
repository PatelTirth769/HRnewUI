import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs } from 'antd';
import API from '../../services/api';

const SalesInvoice = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);

    const init = {
        naming_series: 'ACC-SINV-.YYYY.-', posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0], is_pos: 0, is_return: 0,
        is_debit_note: 0, customer: '', company: '', set_posting_time: 0, due_date: '',
        pos_profile: '', return_against: '',
        update_billed_amount_in_sales_order: 0, update_billed_amount_in_delivery_note: 1,
        cost_center: '', project: '', scan_barcode: '', set_warehouse: '', update_stock: 1,
        total_qty: 0, total: 0, currency: 'INR',
        tax_category: '', shipping_rule: '', incoterm: '', taxes_and_charges: '',
        total_taxes_and_charges: 0, grand_total: 0, rounding_adjustment: 0,
        use_company_roundoff_cost_center: 0, rounded_total: 0, total_advance: 0,
        outstanding_amount: 0, disable_rounded_total: 0,
        apply_discount_on: 'Grand Total', additional_discount_percentage: 0,
        is_cash_or_non_trade_discount: 1, discount_account: '', discount_amount: 0,
        docstatus: 0, status: 'Draft',
        // Payments
        mode_of_payment: '', paid_amount: 0, base_paid_amount: 0, write_off_amount: 0,
        change_amount: 0, account_for_change_amount: '', payments: [],
        // Advance Payments
        allocate_advances_automatically: 0, only_include_allocated_payments: 0, advances: [],
        // Loyalty
        redeem_loyalty_points: 0, loyalty_points: 0, loyalty_amount: 0,
        loyalty_redemption_account: '', loyalty_redemption_cost_center: '',
        // Address
        customer_address: '', contact_person: '', territory: '',
        shipping_address_name: '', dispatch_address_name: '',
        company_address: '', company_contact_person: '',
        // Terms
        payment_terms_template: '', tc_name: '', terms: '', payment_schedule: [],
        // More Info
        po_no: '', po_date: '',
        debit_to: '', is_opening: 'No',
        sales_partner: '', commission_rate: 0, total_commission: 0,
        amount_eligible_for_commission: 0, sales_team: [],
        letter_head: '', select_print_heading: '', group_same_items: 0,
        subscription: '', from_date: '', to_date: '',
        is_internal_customer: 0, source: '', campaign: '',
        items: [], taxes: [], timesheets: []
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchDD(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    useEffect(() => { if (view === 'form') calc(); },
        [formData.items, formData.taxes, formData.discount_amount, formData.disable_rounded_total]);

    const calc = () => {
        let tq = 0, tv = 0;
        const mi = (formData.items || []).map(r => {
            const q = parseFloat(r.qty) || 0, rt = parseFloat(r.rate) || 0, a = q * rt;
            tq += q; tv += a; return { ...r, amount: a };
        });
        let tt = 0;
        (formData.taxes || []).forEach(r => { tt += parseFloat(r.tax_amount) || 0; });
        const d = parseFloat(formData.discount_amount) || 0;
        let gt = tv + tt - d, rt2 = gt, ra = 0;
        if (!formData.disable_rounded_total) { rt2 = Math.round(gt); ra = rt2 - gt; }
        const oa = gt - (parseFloat(formData.total_advance) || 0);
        if (formData.total_qty !== tq || formData.total !== tv || formData.grand_total !== gt) {
            setFormData(p => ({ ...p, items: mi, total_qty: tq, total: tv, total_taxes_and_charges: tt,
                grand_total: gt, rounded_total: rt2, rounding_adjustment: ra, outstanding_amount: oa }));
        }
    };

    const fetchRecords = async () => {
        try { setLoading(true);
            const r = await API.get('/api/resource/Sales Invoice?fields=["name","customer","posting_date","grand_total","docstatus","status"]&limit_page_length=None&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch' }); }
        finally { setLoading(false); }
    };

    const fetchDD = async () => {
        try { const [a, b] = await Promise.all([API.get('/api/resource/Customer?fields=["name"]'), API.get('/api/resource/Company?fields=["name"]')]);
            setCustomers(a.data.data || []); setCompanies(b.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try { setLoading(true);
            const r = await API.get(`/api/resource/Sales Invoice/${encodeURIComponent(n)}`);
            const d = r.data.data;
            ['items','taxes','payment_schedule','sales_team','timesheets','payments','advances'].forEach(k => { if (!d[k]) d[k] = []; });
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.customer) { notification.warning({ message: 'Customer is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) { await API.put(`/api/resource/Sales Invoice/${encodeURIComponent(editingRecord)}`, formData); notification.success({ message: 'Updated.' }); }
            else { await API.post('/api/resource/Sales Invoice', formData); notification.success({ message: 'Created.' }); }
            setView('list');
        } catch (e) { const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message; notification.error({ message: 'Save Failed', description: m }); }
        finally { setSaving(false); }
    };

    const handleDocAction = async (action) => {
        if (!window.confirm(action === 'submit' ? 'Submit?' : 'Cancel?')) return;
        setSaving(true);
        try { const ep = action === 'submit' ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(ep, { doc: { ...formData, doctype: 'Sales Invoice' } });
            notification.success({ message: `${action === 'submit' ? 'Submitted' : 'Cancelled'}.` }); setView('list');
        } catch (e) { const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message; notification.error({ message: 'Failed', description: m }); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete?')) return;
        try { await API.delete(`/api/resource/Sales Invoice/${encodeURIComponent(editingRecord)}`); notification.success({ message: 'Deleted.' }); setView('list'); }
        catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const empty = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="text-sm font-medium text-gray-400">No Data</span>
        </div>
    );

    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const td = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const F = (v) => `₹ ${Number(v || 0).toFixed(2)}`;

    if (view === 'list') {
        const fil = records.filter(r => { if (!search) return true; const s = search.toLowerCase(); return (r.name||'').toLowerCase().includes(s) || (r.customer||'').toLowerCase().includes(s); });
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Sales Invoices</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium" onClick={fetchRecords}>{loading ? '⟳' : '⟳ Refresh'}</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>+ Add Sales Invoice</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{fil.length} of {records.length}</div>
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
                            {loading ? <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic">Fetching...</td></tr>
                            : fil.length === 0 ? <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic">No records.</td></tr>
                            : fil.map(r => (
                                <tr key={r.name} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4"><button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(r.name); setView('form'); }}>{r.name}</button></td>
                                    <td className="px-5 py-4 text-gray-700 font-medium">{r.customer}</td>
                                    <td className="px-5 py-4 text-gray-500">{r.posting_date}</td>
                                    <td className="px-5 py-4 text-gray-900 font-semibold text-right">{F(r.grand_total)}</td>
                                    <td className="px-5 py-4 text-center">
                                        {r.docstatus===0 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">Draft</span>}
                                        {r.docstatus===1 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-50 text-green-600 border border-green-200">{r.status||'Submitted'}</span>}
                                        {r.docstatus===2 && <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-300">Cancelled</span>}
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
    const isSub = formData.docstatus === 1;
    const badge = () => {
        if (!editingRecord) return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4] ml-2">Not Saved</span>;
        if (isDraft) return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-50 text-red-600 font-medium border border-red-200 ml-2">Draft</span>;
        if (isSub) return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-green-50 text-green-600 font-medium border border-green-200 ml-2">Submitted</span>;
        return <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-gray-100 text-gray-600 font-medium border border-gray-300 ml-2">Cancelled</span>;
    };

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
                                    : <input type={c.type||'text'} className={`${ri} ${c.right?'text-right':''}`} value={row[c.field]||''} onChange={e=>chRow(key,i,c.field,e.target.value)} disabled={!isDraft} />}
                                </td>)}
                                <td className={`${td} text-center`}>{isDraft && <button onClick={()=>rmRow(key,i)} className="text-red-400 hover:text-red-600 text-[10px] p-1 rounded-full hover:bg-red-50 transition">✕</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(formData[key]||[]).length===0 && empty()}
            </div>
            {isDraft && <button onClick={()=>addRow(key,newRow)} className="mt-3 text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Add Row</button>}
        </div>
    );

    const tabs = [
        { key:'details', label:'Details', children:(
            <div className="space-y-6 animate-fade-in pb-8">
                <div className="grid grid-cols-3 gap-6">
                    <div><label className={lbl}>Series *</label><input className={inp} value={formData.naming_series} onChange={e=>setFormData({...formData,naming_series:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Date *</label><input type="date" className={inp} value={formData.posting_date} onChange={e=>setFormData({...formData,posting_date:e.target.value})} disabled={!isDraft}/></div>
                    <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.is_pos} onChange={e=>setFormData({...formData,is_pos:e.target.checked?1:0,is_return:0,is_debit_note:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Include Payment (POS)</span></label>
                        {!!formData.is_pos && <div><label className={lbl}>POS Profile</label><input className={inp} value={formData.pos_profile} onChange={e=>setFormData({...formData,pos_profile:e.target.value})} disabled={!isDraft}/></div>}
                        {!formData.is_pos && <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.is_return} onChange={e=>setFormData({...formData,is_return:e.target.checked?1:0,is_debit_note:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Is Return (Credit Note)</span></label>}
                        {!!formData.is_return && <>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.update_billed_amount_in_sales_order} onChange={e=>setFormData({...formData,update_billed_amount_in_sales_order:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Update Billed Amount in Sales Order</span></label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.update_billed_amount_in_delivery_note} onChange={e=>setFormData({...formData,update_billed_amount_in_delivery_note:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Update Billed Amount in Delivery Note</span></label>
                        </>}
                        {!formData.is_pos && !formData.is_return && <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.is_debit_note} onChange={e=>setFormData({...formData,is_debit_note:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Is Rate Adjustment Entry (Debit Note)</span></label>}
                        {!!formData.is_debit_note && <p className="text-xs text-gray-500 ml-6">Issue a debit note with 0 qty against an existing Sales Invoice</p>}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div><label className={lbl}>Customer</label><select className={inp} value={formData.customer} onChange={e=>setFormData({...formData,customer:e.target.value})} disabled={!isDraft}><option value="">Select</option>{customers.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                    <div className="space-y-2">
                        <div><label className={lbl}>Posting Time</label><input type="time" step="1" className={inp} value={formData.posting_time} onChange={e=>setFormData({...formData,posting_time:e.target.value})} disabled={!isDraft||!formData.set_posting_time}/></div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.set_posting_time} onChange={e=>setFormData({...formData,set_posting_time:e.target.checked?1:0})} className="w-3.5 h-3.5 rounded text-blue-600" disabled={!isDraft}/><span className="text-xs font-medium text-gray-500">Edit Posting Date and Time</span></label>
                    </div>
                    {(!!formData.is_debit_note && !formData.is_return) && <div><label className={lbl}>Return Against</label><input className={inp} value={formData.return_against} onChange={e=>setFormData({...formData,return_against:e.target.value})} disabled={!isDraft}/></div>}
                    {!formData.is_debit_note && <div></div>}
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div><label className={lbl}>Company *</label><select className={inp} value={formData.company} onChange={e=>setFormData({...formData,company:e.target.value})} disabled={!isDraft}><option value="">Select</option>{companies.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                    <div><label className={lbl}>Payment Due Date *</label><input type="date" className={inp} value={formData.due_date} onChange={e=>setFormData({...formData,due_date:e.target.value})} disabled={!isDraft}/></div>
                    <div></div>
                </div>

                <div className={sec}>Accounting Dimensions</div>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Cost Center</label><input className={inp} value={formData.cost_center} onChange={e=>setFormData({...formData,cost_center:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Project</label><input className={inp} value={formData.project} onChange={e=>setFormData({...formData,project:e.target.value})} disabled={!isDraft}/></div>
                </div>

                <div className={sec}>Items</div>
                <div className="grid grid-cols-2 gap-8 mb-2">
                    <div><label className={lbl}>Scan Barcode</label><input className={inp} value={formData.scan_barcode} onChange={e=>setFormData({...formData,scan_barcode:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Source Warehouse</label><input className={inp} value={formData.set_warehouse} onChange={e=>setFormData({...formData,set_warehouse:e.target.value})} disabled={!isDraft}/></div>
                </div>
                <label className="flex items-center gap-2 mb-4"><input type="checkbox" checked={!!formData.update_stock} onChange={e=>setFormData({...formData,update_stock:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-semibold text-gray-700">Update Stock</span></label>

                {childTable('items',[{label:'Item',field:'item_code'},{label:'Quantity',field:'qty',type:'number',right:true},{label:`Rate (${formData.currency}) *`,field:'rate',type:'number',right:true},{label:`Amount (${formData.currency}) *`,field:'amount',readOnly:true,right:true,fmt:true}],{item_code:'',qty:1,rate:0,amount:0})}
                <div className="flex gap-2 mt-1">{isDraft&&<><button className="text-xs bg-white text-gray-700 font-medium py-1.5 px-3 border rounded shadow-sm">Add Multiple</button><div className="ml-auto flex gap-2"><button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Download</button><button className="text-xs bg-white text-gray-600 font-medium py-1.5 px-3 border rounded shadow-sm">Upload</button></div></>}</div>
                <div className="grid grid-cols-2 gap-8 mt-6">
                    <div><label className={lbl}>Total Quantity</label><div className={`${inp} bg-gray-50 border-transparent font-semibold`}>{formData.total_qty}</div></div>
                    <div><label className={lbl}>Total ({formData.currency})</label><div className={`${inp} bg-gray-50 border-transparent font-bold text-right`}>{F(formData.total)}</div></div>
                </div>

                <div className={sec}>Taxes and Charges</div>
                <div className="grid grid-cols-3 gap-6">
                    <div><label className={lbl}>Tax Category</label><input className={inp} value={formData.tax_category} onChange={e=>setFormData({...formData,tax_category:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Shipping Rule</label><input className={inp} value={formData.shipping_rule} onChange={e=>setFormData({...formData,shipping_rule:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Incoterm</label><input className={inp} value={formData.incoterm} onChange={e=>setFormData({...formData,incoterm:e.target.value})} disabled={!isDraft}/></div>
                </div>
                <div className="max-w-sm mt-4"><label className={lbl}>Sales Taxes and Charges Template</label><input className={inp} value={formData.taxes_and_charges} onChange={e=>setFormData({...formData,taxes_and_charges:e.target.value})} disabled={!isDraft}/></div>
                <div className="mt-4"><label className="block text-sm text-gray-800 font-semibold mb-2">Sales Taxes and Charges</label>
                    {childTable('taxes',[{label:'Type *',field:'charge_type'},{label:'Account Head *',field:'account_head'},{label:'Tax Rate',field:'rate',type:'number',right:true},{label:'Amount',field:'tax_amount',type:'number',right:true},{label:'Total',field:'total',readOnly:true,right:true,fmt:true}],{charge_type:'Actual',account_head:'',rate:0,tax_amount:0,total:0})}
                </div>
                <div className="grid grid-cols-2 gap-8 mt-6"><div></div><div><label className={lbl}>Total Taxes and Charges ({formData.currency})</label><div className={`${inp} bg-gray-50 border-transparent font-bold text-right`}>{F(formData.total_taxes_and_charges)}</div></div></div>

                <div className={sec}>Totals</div>
                <div className="grid grid-cols-2 gap-8 mt-4"><div></div>
                    <div className="space-y-3 bg-gray-50 p-4 border rounded-md">
                        <div><label className={lbl}>Grand Total ({formData.currency}) *</label><div className={`${inp} text-right font-bold text-[15px]`}>{F(formData.grand_total)}</div></div>
                        <div><label className={lbl}>Rounding Adjustment ({formData.currency})</label><div className={`${inp} text-right text-gray-500`}>{F(formData.rounding_adjustment)}</div></div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.use_company_roundoff_cost_center} onChange={e=>setFormData({...formData,use_company_roundoff_cost_center:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Use Company default Cost Center for Round off</span></label>
                        <div><label className={lbl}>Rounded Total ({formData.currency})</label><div className={`${inp} text-right font-black text-[16px]`}>{F(formData.rounded_total)}</div></div>
                        <div><label className={lbl}>Total Advance ({formData.currency})</label><div className={`${inp} text-right text-gray-500`}>{F(formData.total_advance)}</div></div>
                        <div><label className={lbl}>Outstanding Amount ({formData.currency})</label><div className={`${inp} text-right font-semibold text-gray-800`}>{F(formData.outstanding_amount)}</div></div>
                    </div>
                </div>

                <div className={sec}>Additional Discount</div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="space-y-4">
                        <div><label className={lbl}>Apply Additional Discount On</label><select className={inp} value={formData.apply_discount_on} onChange={e=>setFormData({...formData,apply_discount_on:e.target.value})} disabled={!isDraft}><option value="Grand Total">Grand Total</option><option value="Net Total">Net Total</option></select></div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.is_cash_or_non_trade_discount} onChange={e=>setFormData({...formData,is_cash_or_non_trade_discount:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-semibold text-gray-700">Is Cash or Non Trade Discount</span></label>
                        {!!formData.is_cash_or_non_trade_discount && <div><label className={lbl}>Discount Account *</label><input className={inp} value={formData.discount_account} onChange={e=>setFormData({...formData,discount_account:e.target.value})} disabled={!isDraft}/></div>}
                    </div>
                    <div className="space-y-4">
                        <div><label className={lbl}>Additional Discount Percentage</label><input type="number" className={inp} value={formData.additional_discount_percentage} onChange={e=>setFormData({...formData,additional_discount_percentage:e.target.value})} disabled={!isDraft}/></div>
                        <div><label className={lbl}>Additional Discount Amount ({formData.currency})</label><input type="number" className={inp} value={formData.discount_amount} onChange={e=>setFormData({...formData,discount_amount:e.target.value})} disabled={!isDraft}/></div>
                    </div>
                </div>

                <div className={sec}>Time Sheet List</div>
                <label className="block text-xs text-gray-600 font-semibold mb-2">Time Sheets</label>
                {childTable('timesheets',[{label:'Activity Type',field:'activity_type'},{label:'Description',field:'description'},{label:'Billing Hours',field:'billing_hours',type:'number',right:true},{label:'Billing Amount',field:'billing_amount',type:'number',right:true}],{activity_type:'',description:'',billing_hours:0,billing_amount:0})}
            </div>
        )},
        { key:'payments', label:'Payments', children:(
            <div className="space-y-8 animate-fade-in mt-2">
                <div className="grid grid-cols-2 gap-8">
                    <div></div>
                    <div><label className={lbl}>Paid Amount ({formData.currency})</label><div className={`${inp} bg-gray-50 font-semibold`}>{F(formData.paid_amount)}</div></div>
                </div>

                <div className={sec}>Advance Payments</div>
                <div className="space-y-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.allocate_advances_automatically} onChange={e=>setFormData({...formData,allocate_advances_automatically:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-semibold text-gray-700">Allocate Advances Automatically (FIFO)</span></label>
                    {!formData.allocate_advances_automatically && isDraft && <button className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-medium py-1.5 px-3 border border-gray-300 rounded shadow-sm transition">Get Advances Received</button>}
                    {!!formData.allocate_advances_automatically && <div><label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.only_include_allocated_payments} onChange={e=>setFormData({...formData,only_include_allocated_payments:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-medium text-gray-700">Only Include Allocated Payments</span></label>
                    <p className="text-xs text-gray-500 ml-6 mt-1">Advance payments allocated against orders will only be fetched</p></div>}
                </div>
                <label className="block text-xs text-gray-600 font-semibold mb-2 mt-4">Advances</label>
                {childTable('advances',[{label:'Reference Name',field:'reference_name'},{label:'Remarks',field:'remarks'},{label:'Advance amount',field:'advance_amount',type:'number',right:true},{label:'Allocated amount',field:'allocated_amount',type:'number',right:true},{label:'Difference Posting Date',field:'difference_posting_date',type:'date'}],{reference_name:'',remarks:'',advance_amount:0,allocated_amount:0,difference_posting_date:''})}

                <div className={sec}>Loyalty Points Redemption</div>
                <label className="flex items-center gap-2 mb-4"><input type="checkbox" checked={!!formData.redeem_loyalty_points} onChange={e=>setFormData({...formData,redeem_loyalty_points:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-semibold text-gray-700">Redeem Loyalty Points</span></label>
                {!!formData.redeem_loyalty_points && <>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Loyalty Points</label><input type="number" className={inp} value={formData.loyalty_points} onChange={e=>setFormData({...formData,loyalty_points:e.target.value})} disabled={!isDraft}/></div>
                    <div><label className={lbl}>Redemption Account</label><input className={inp} value={formData.loyalty_redemption_account} onChange={e=>setFormData({...formData,loyalty_redemption_account:e.target.value})} disabled={!isDraft}/></div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                    <div><label className={lbl}>Loyalty Amount</label><div className={`${inp} bg-gray-50`}>{F(formData.loyalty_amount)}</div></div>
                    <div><label className={lbl}>Redemption Cost Center</label><input className={inp} value={formData.loyalty_redemption_cost_center} onChange={e=>setFormData({...formData,loyalty_redemption_cost_center:e.target.value})} disabled={!isDraft}/></div>
                </div>
                </>}
            </div>
        )},
        { key:'address', label:'Address & Contact', children:(
            <div className="space-y-8 animate-fade-in mt-2">
                <div><h2 className="text-sm font-bold text-gray-800 mb-4">Billing Address</h2>
                    <div className="grid grid-cols-2 gap-8 mb-4"><div><label className={lbl}>Customer Address</label><input className={inp} value={formData.customer_address} onChange={e=>setFormData({...formData,customer_address:e.target.value})} disabled={!isDraft}/></div><div><label className={lbl}>Contact Person</label><input className={inp} value={formData.contact_person} onChange={e=>setFormData({...formData,contact_person:e.target.value})} disabled={!isDraft}/></div></div>
                    <div className="grid grid-cols-2 gap-8"><div></div><div><label className={lbl}>Territory</label><input className={inp} value={formData.territory} onChange={e=>setFormData({...formData,territory:e.target.value})} disabled={!isDraft}/></div></div>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div><h2 className="text-sm font-bold text-gray-800 mb-4">Shipping Address</h2>
                    <div className="grid grid-cols-2 gap-8"><div><label className={lbl}>Shipping Address Name</label><input className={inp} value={formData.shipping_address_name} onChange={e=>setFormData({...formData,shipping_address_name:e.target.value})} disabled={!isDraft}/></div><div><label className={lbl}>Dispatch Address Name</label><input className={inp} value={formData.dispatch_address_name} onChange={e=>setFormData({...formData,dispatch_address_name:e.target.value})} disabled={!isDraft}/></div></div>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div><h2 className="text-sm font-bold text-gray-800 mb-4">Company Address</h2>
                    <div className="grid grid-cols-2 gap-8"><div><label className={lbl}>Company Address Name</label><input className={inp} value={formData.company_address} onChange={e=>setFormData({...formData,company_address:e.target.value})} disabled={!isDraft}/></div><div><label className={lbl}>Company Contact Person</label><input className={inp} value={formData.company_contact_person} onChange={e=>setFormData({...formData,company_contact_person:e.target.value})} disabled={!isDraft}/></div></div>
                </div>
            </div>
        )},
        { key:'terms', label:'Terms', children:(
            <div className="space-y-6 animate-fade-in mt-2">
                <h2 className="text-sm font-bold text-gray-800">Payment Terms</h2>
                <div className="max-w-md"><label className={lbl}>Payment Terms Template</label><input className={inp} value={formData.payment_terms_template} onChange={e=>setFormData({...formData,payment_terms_template:e.target.value})} disabled={!isDraft}/></div>
                <label className="block text-xs text-gray-600 font-semibold mb-2">Payment Schedule</label>
                {childTable('payment_schedule',[{label:'Payment Term',field:'payment_term'},{label:'Description',field:'description'},{label:'Due Date *',field:'due_date',type:'date'},{label:'Invoice Portion',field:'invoice_portion',type:'number',right:true},{label:'Payment Amount *',field:'payment_amount',type:'number',right:true}],{payment_term:'',description:'',due_date:'',invoice_portion:0,payment_amount:0})}
                <div className="h-px bg-gray-200 my-6"></div>
                <h2 className="text-sm font-bold text-gray-800">Terms and Conditions</h2>
                <div className="max-w-md"><label className={lbl}>Terms</label><input className={inp} value={formData.tc_name} onChange={e=>setFormData({...formData,tc_name:e.target.value})} disabled={!isDraft}/></div>
                <div><label className={lbl}>Terms and Conditions Details</label>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-gray-500 font-medium">File</span><span className="text-xs text-gray-500 font-medium">Edit</span><span className="text-xs text-gray-500 font-medium">View</span><span className="text-xs text-gray-500 font-medium">Insert</span><span className="text-xs text-gray-500 font-medium">Format</span><span className="text-xs text-gray-500 font-medium">Tools</span><span className="text-xs text-gray-500 font-medium">Table</span><span className="text-xs text-gray-500 font-medium">Help</span>
                        </div>
                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 flex items-center gap-2 flex-wrap">
                            <button className="text-gray-500 hover:text-gray-700 text-sm px-1">↶</button><button className="text-gray-500 hover:text-gray-700 text-sm px-1">↷</button><span className="w-px h-4 bg-gray-300"></span>
                            <button className="text-gray-700 hover:text-gray-900 font-bold text-sm px-1">B</button><button className="text-gray-700 hover:text-gray-900 italic text-sm px-1">I</button><button className="text-gray-700 hover:text-gray-900 underline text-sm px-1">U</button><button className="text-gray-700 hover:text-gray-900 line-through text-sm px-1">S</button>
                        </div>
                        <textarea className="w-full border-0 p-3 text-sm min-h-[150px] resize-none focus:outline-none" value={formData.terms} onChange={e=>setFormData({...formData,terms:e.target.value})} disabled={!isDraft} placeholder="Enter terms and conditions..."></textarea>
                    </div>
                </div>
            </div>
        )},
        { key:'more_info', label:'More Info', children:(
            <div className="space-y-8 animate-fade-in mt-2">
                {/* Customer PO Details */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Customer PO Details</div><div className="p-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Customer's Purchase Order</label><input className={inp} value={formData.po_no} onChange={e=>setFormData({...formData,po_no:e.target.value})} disabled={!isDraft}/></div>
                        <div><label className={lbl}>Customer's Purchase Order Date</label><input type="date" className={inp} value={formData.po_date} onChange={e=>setFormData({...formData,po_date:e.target.value})} disabled={!isDraft}/></div>
                    </div>
                </div></div>

                {/* Accounting Details */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Accounting Details</div><div className="p-4 space-y-4">
                    <div className="max-w-md"><label className={lbl}>Debit To *</label><input className={inp} value={formData.debit_to} onChange={e=>setFormData({...formData,debit_to:e.target.value})} disabled={!isDraft}/></div>
                    <div className="max-w-md"><label className={lbl}>Is Opening Entry</label><select className={inp} value={formData.is_opening} onChange={e=>setFormData({...formData,is_opening:e.target.value})} disabled={!isDraft}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                </div></div>

                {/* Commission */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Commission</div><div className="p-4">
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div><label className={lbl}>Sales Partner</label><input className={inp} value={formData.sales_partner} onChange={e=>setFormData({...formData,sales_partner:e.target.value})} disabled={!isDraft}/></div>
                        <div><label className={lbl}>Commission Rate (%)</label><input type="number" className={inp} value={formData.commission_rate} onChange={e=>setFormData({...formData,commission_rate:e.target.value})} disabled={!isDraft}/></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div><label className={lbl}>Amount Eligible for Commission</label><div className={`${inp} bg-gray-50`}>{F(formData.amount_eligible_for_commission)}</div></div>
                        <div><label className={lbl}>Total Commission</label><input type="number" className={inp} value={formData.total_commission} onChange={e=>setFormData({...formData,total_commission:e.target.value})} disabled={!isDraft}/></div>
                    </div>
                </div></div>

                {/* Sales Team */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Sales Team</div><div className="p-4">
                    <label className="block text-xs text-gray-600 font-semibold mb-2">Sales Contributions and Incentives</label>
                    {childTable('sales_team',[{label:'Sales Person *',field:'sales_person'},{label:'Contribution (%)',field:'allocated_percentage',type:'number',right:true},{label:'Contribution to Net Total',field:'allocated_amount',readOnly:true,right:true,fmt:true},{label:'Commission Rate',field:'commission_rate',type:'number',right:true},{label:'Incentives',field:'incentives',type:'number',right:true}],{sales_person:'',allocated_percentage:0,allocated_amount:0,commission_rate:0,incentives:0})}
                </div></div>

                {/* Print Settings */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Print Settings</div><div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-8"><div><label className={lbl}>Letter Head</label><input className={inp} value={formData.letter_head} onChange={e=>setFormData({...formData,letter_head:e.target.value})} disabled={!isDraft}/></div><div><label className={lbl}>Print Heading</label><input className={inp} value={formData.select_print_heading} onChange={e=>setFormData({...formData,select_print_heading:e.target.value})} disabled={!isDraft}/></div></div>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!formData.group_same_items} onChange={e=>setFormData({...formData,group_same_items:e.target.checked?1:0})} className="w-4 h-4 rounded text-blue-600" disabled={!isDraft}/><span className="text-sm font-semibold text-gray-700">Group same items</span></label>
                </div></div>

                {/* Subscription */}
                <div className="border rounded"><div className={sec+' mt-0 mb-0 p-3 border-b-0'}>Subscription</div><div className="p-4">
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div><label className={lbl}>Subscription</label><input className={inp} value={formData.subscription} onChange={e=>setFormData({...formData,subscription:e.target.value})} disabled={!isDraft}/></div>
                        <div><label className={lbl}>To Date</label><input type="date" className={inp} value={formData.to_date} onChange={e=>setFormData({...formData,to_date:e.target.value})} disabled={!isDraft}/></div>
                    </div>
                    <div className="max-w-md"><label className={lbl}>From Date</label><input type="date" className={inp} value={formData.from_date} onChange={e=>setFormData({...formData,from_date:e.target.value})} disabled={!isDraft}/></div>
                </div></div>
            </div>
        )}
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {editingRecord || 'New Sales Invoice'}
                    </span>{badge()}
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 font-medium transition shadow-sm text-sm" onClick={()=>setView('list')}>Discard</button>
                    {!editingRecord && <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-md disabled:opacity-70" onClick={handleSave} disabled={saving}>{saving?'...':'Save'}</button>}
                    {editingRecord && isDraft && <>
                        <button className="px-5 py-2 border border-gray-300 bg-white text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition shadow-sm" onClick={handleDelete}>Delete</button>
                        <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-md disabled:opacity-70" onClick={handleSave} disabled={saving}>{saving?'...':'Save'}</button>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-70 ml-2" onClick={()=>handleDocAction('submit')} disabled={saving}>Submit</button>
                    </>}
                    {editingRecord && isSub && <button className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition shadow-md disabled:opacity-70" onClick={()=>handleDocAction('cancel')} disabled={saving}>Cancel</button>}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-[500px]">
                {loading ? <div className="flex justify-center items-center h-40"><Spin size="large"/></div> : <Tabs defaultActiveKey="details" items={tabs} className="custom-si-tabs"/>}
            </div>
            <style>{`.custom-si-tabs .ant-tabs-nav::before{border-bottom:2px solid #f3f4f6}.custom-si-tabs .ant-tabs-tab{padding:12px 0;margin:0 32px 0 0;color:#6b7280;font-size:14px}.custom-si-tabs .ant-tabs-tab-active .ant-tabs-tab-btn{color:#111827!important;font-weight:700}.custom-si-tabs .ant-tabs-ink-bar{background:#111827;height:3px!important;border-radius:4px}@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fadeIn .2s ease-out forwards}`}</style>
        </div>
    );
};

export default SalesInvoice;
