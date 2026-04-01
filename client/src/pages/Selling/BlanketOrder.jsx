import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const BlanketOrder = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [companies, setCompanies] = useState([]);
    const [itemsList, setItemsList] = useState([]);

    const init = {
        naming_series: 'MFG-BLR-.YYYY.-', order_type: 'Selling', order_no: '',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        company: '', tc_name: '', terms: '', items: [], docstatus: 0
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Blanket Order?fields=["name","order_type","company","from_date","to_date","docstatus"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [cp, it] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Item?fields=["name"]')
            ]);
            setCompanies(cp.data.data || []);
            setItemsList(it.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Blanket Order/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.items) d.items = [];
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.company) { notification.warning({ message: 'Company is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Blanket Order/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Blanket Order', formData);
                notification.success({ message: 'Created.' });
            }
            setView('list');
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Save Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDocAction = async (action) => {
        setSaving(true);
        try {
            const ep = action === 'submit' ? '/api/method/frappe.client.submit' : '/api/method/frappe.client.cancel';
            await API.post(ep, { doctype: 'Blanket Order', name: editingRecord });
            notification.success({ message: `${action === 'submit' ? 'Submitted' : 'Cancelled'}.` });
            setView('list');
        } catch (e) {
            const m = e.response?.data?._server_messages ? JSON.parse(e.response.data._server_messages)[0] : e.message;
            notification.error({ message: 'Failed', description: m });
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Blanket Order/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const isDraft = formData.docstatus === 0;
    const isSubmitted = formData.docstatus === 1;
    const isCancelled = formData.docstatus === 2;

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const td = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-800">Blanket Orders</h1>
                <button 
                  onClick={() => { setEditingRecord(null); setView('form'); }} 
                  className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                >
                    + New Blanket Order
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input 
                      className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" 
                      placeholder="Search Blanket Orders..." 
                      value={search} onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80">
                            <tr>
                                {['Name', 'Order Type', 'Company', 'From Date', 'To Date', 'Status'].map(h => <th key={h} className={th}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                    <td className={td}>{r.order_type}</td>
                                    <td className={td}>{r.company}</td>
                                    <td className={td}>{r.from_date}</td>
                                    <td className={td}>{r.to_date}</td>
                                    <td className={td}>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            r.docstatus === 0 ? 'bg-orange-100 text-orange-700' : 
                                            r.docstatus === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>{r.docstatus === 0 ? 'Draft' : r.docstatus === 1 ? 'Submitted' : 'Cancelled'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Spin>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="hover:text-blue-600 cursor-pointer" onClick={() => setView('list')}>Blanket Order</span>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">{editingRecord || 'New Blanket Order'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-900">{editingRecord || 'New Blanket Order'}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isDraft ? 'bg-orange-100 text-orange-700' : 
                            isSubmitted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{isDraft ? 'Not Saved' : isSubmitted ? 'Submitted' : 'Cancelled'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold hover:bg-gray-50">Back</button>
                    {isDraft && <button onClick={handleSave} disabled={saving} className="bg-black text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-gray-800 disabled:opacity-50 tracking-wide">Save</button>}
                    {editingRecord && isDraft && <Popconfirm title="Submit?" onConfirm={() => handleDocAction('submit')}><button className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-700">Submit</button></Popconfirm>}
                    {isSubmitted && <Popconfirm title="Cancel?" onConfirm={() => handleDocAction('cancel')}><button className="bg-red-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-red-700">Cancel</button></Popconfirm>}
                    {isCancelled && <Popconfirm title="Delete?" onConfirm={handleDelete}><button className="bg-gray-200 text-red-600 px-6 py-2 rounded text-sm font-bold hover:bg-red-50">Delete</button></Popconfirm>}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <Spin spinning={loading}>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Series *</label><input className={inp} value={formData.naming_series} onChange={e => setFormData({ ...formData, naming_series: e.target.value })} disabled={!isDraft} /></div>
                            <div><label className={lbl}>Order Type *</label>
                                <select className={inp} value={formData.order_type} onChange={e => setFormData({ ...formData, order_type: e.target.value })} disabled={!isDraft}>
                                    <option value="Selling">Selling</option>
                                    <option value="Buying">Buying</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Order No</label><input className={inp} value={formData.order_no} disabled /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>From Date *</label><input type="date" className={inp} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} disabled={!isDraft} /></div>
                                <div><label className={lbl}>To Date *</label><input type="date" className={inp} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} disabled={!isDraft} /></div>
                            </div>
                            <div><label className={lbl}>Company *</label>
                                <select className={inp} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} disabled={!isDraft}>
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Item</div>
                    <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>Item Code *</th>
                                    <th className={th}>Quantity</th>
                                    <th className={th}>Rate *</th>
                                    <th className={th}>Ordered Quantity</th>
                                    {isDraft && <th className="w-10 px-4"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.items.map((r, i) => (
                                    <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.item_code} onChange={e => chRow('items', i, 'item_code', e.target.value)} disabled={!isDraft}>
                                                <option value="">Select Item</option>
                                                {itemsList.map(it => <option key={it.name} value={it.name}>{it.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.qty} onChange={e => chRow('items', i, 'qty', e.target.value)} disabled={!isDraft} /></td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.rate} onChange={e => chRow('items', i, 'rate', e.target.value)} disabled={!isDraft} /></td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.ordered_qty} disabled /></td>
                                        {isDraft && <td className="px-4 py-3 text-center"><button onClick={() => rmRow('items', i)} className="text-gray-400 hover:text-red-500">✕</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {isDraft && <div className="p-4 bg-gray-50 border-t border-gray-100"><button onClick={() => addRow('items', { item_code: '', qty: 0, rate: 0, ordered_qty: 0 })} className="text-xs font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 shadow-sm">Add Row</button></div>}
                    </div>

                    <div className={sec}>Terms and Conditions</div>
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <label className={lbl}>Terms</label>
                            <input className={inp} value={formData.tc_name} onChange={e => setFormData({ ...formData, tc_name: e.target.value })} disabled={!isDraft} />
                        </div>
                        <div>
                            <label className={lbl}>Terms and Conditions Details</label>
                            <div className="border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 flex items-center gap-2">
                                    <button className="text-gray-500 font-bold px-1">B</button><button className="text-gray-500 italic px-1">I</button><button className="text-gray-500 underline px-1">U</button>
                                </div>
                                <textarea className="w-full p-4 text-sm min-h-[150px] focus:outline-none" value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} disabled={!isDraft} placeholder="Enter details..."></textarea>
                            </div>
                        </div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default BlanketOrder;
