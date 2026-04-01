import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const LoyaltyPointEntry = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);

    const init = {
        customer: '', loyalty_program: '', loyalty_points: 0,
        purchase_amount: 0, expiry_date: '', posting_date: new Date().toISOString().split('T')[0],
        invoice_type: 'Sales Invoice', invoice_id: ''
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Loyalty Point Entry?fields=["name","customer","loyalty_program","loyalty_points","purchase_amount","posting_date"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [c, lp] = await Promise.all([
                API.get('/api/resource/Customer?fields=["name"]&limit_page_length=1000'),
                API.get('/api/resource/Loyalty Program?fields=["name","loyalty_program_name"]')
            ]);
            setCustomers(c.data.data || []);
            setLoyaltyPrograms(lp.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Loyalty Point Entry/${encodeURIComponent(n)}`);
            setFormData(r.data.data);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.customer || !formData.loyalty_program) { notification.warning({ message: 'Customer and Loyalty Program are required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Loyalty Point Entry/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Loyalty Point Entry', formData);
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
            await API.delete(`/api/resource/Loyalty Point Entry/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const td = "px-4 py-3 whitespace-nowrap text-sm border-t border-gray-100";

    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Loyalty Point Entries</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm">
                    + New Entry
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search by customer..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>{['Name', 'Customer', 'Loyalty Program', 'Points', 'Purchase Amount', 'Date'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => r.customer.toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                    <td className={td}>{r.customer}</td>
                                    <td className={td}>{r.loyalty_program}</td>
                                    <td className={td}>{r.loyalty_points}</td>
                                    <td className={td}>{r.purchase_amount}</td>
                                    <td className={td}>{r.posting_date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Spin>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{editingRecord || 'New Loyalty Point Entry'}</h1>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">{editingRecord ? 'Saved' : 'Not Saved'}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">Back</button>
                    <button onClick={handleSave} disabled={saving} className="bg-black text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-gray-800 disabled:opacity-50">Save</button>
                    {editingRecord && <Popconfirm title="Delete?" onConfirm={handleDelete}><button className="bg-gray-100 text-red-600 px-6 py-2 rounded text-sm font-bold hover:bg-red-50">Delete</button></Popconfirm>}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                <Spin spinning={loading}>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Customer *</label>
                                <select className={inp} value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                                    <option value="">Select Customer</option>
                                    {customers.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Loyalty Program *</label>
                                <select className={inp} value={formData.loyalty_program} onChange={e => setFormData({ ...formData, loyalty_program: e.target.value })}>
                                    <option value="">Select Program</option>
                                    {loyaltyPrograms.map(x => <option key={x.name} value={x.name}>{x.loyalty_program_name} ({x.name})</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Loyalty Points</label><input type="number" className={inp} value={formData.loyalty_points} onChange={e => setFormData({ ...formData, loyalty_points: e.target.value })} /></div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Posting Date</label><input type="date" className={inp} value={formData.posting_date} onChange={e => setFormData({ ...formData, posting_date: e.target.value })} /></div>
                            <div><label className={lbl}>Purchase Amount</label><input type="number" className={inp} value={formData.purchase_amount} onChange={e => setFormData({ ...formData, purchase_amount: e.target.value })} /></div>
                            <div><label className={lbl}>Expiry Date</label><input type="date" className={inp} value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} /></div>
                        </div>
                    </div>

                    <div className={sec}>Invoice Details</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div><label className={lbl}>Invoice Type</label>
                            <select className={inp} value={formData.invoice_type} onChange={e => setFormData({ ...formData, invoice_type: e.target.value })}>
                                <option value="Sales Invoice">Sales Invoice</option>
                                <option value="POS Invoice">POS Invoice</option>
                            </select>
                        </div>
                        <div><label className={lbl}>Invoice ID</label><input className={inp} value={formData.invoice_id} onChange={e => setFormData({ ...formData, invoice_id: e.target.value })} /></div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default LoyaltyPointEntry;
