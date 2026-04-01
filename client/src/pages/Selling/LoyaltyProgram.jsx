import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const LoyaltyProgram = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [customerGroups, setCustomerGroups] = useState([]);
    const [territories, setTerritories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    const init = {
        loyalty_program_name: '', loyalty_program_type: 'Single Tier Program',
        from_date: new Date().toISOString().split('T')[0], to_date: '',
        customer_group: '', customer_territory: '', auto_opt_in: 0,
        collection_rules: [], conversion_factor: 0, expiry_duration: 0,
        expense_account: '', company: '', cost_center: ''
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Loyalty Program?fields=["name","loyalty_program_name","loyalty_program_type","from_date","to_date"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [cg, t, a, c, cc] = await Promise.all([
                API.get('/api/resource/Customer Group?fields=["name"]'),
                API.get('/api/resource/Territory?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&filters=[["report_type","=","Profit and Loss"]]&limit_page_length=1000'),
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=1000')
            ]);
            setCustomerGroups(cg.data.data || []);
            setTerritories(t.data.data || []);
            setAccounts(a.data.data || []);
            setCompanies(c.data.data || []);
            setCostCenters(cc.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Loyalty Program/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.collection_rules) d.collection_rules = [];
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.loyalty_program_name || !formData.from_date) { notification.warning({ message: 'Name and From Date are required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Loyalty Program/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Loyalty Program', formData);
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
            await API.delete(`/api/resource/Loyalty Program/${encodeURIComponent(editingRecord)}`);
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

    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Loyalty Programs</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    + New Loyalty Program
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>{['Name', 'Type', 'From Date', 'To Date'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => r.loyalty_program_name.toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.loyalty_program_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.loyalty_program_type}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.from_date}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.to_date || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Spin>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{editingRecord || 'New Loyalty Program'}</h1>
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
                            <div><label className={lbl}>Loyalty Program Name *</label><input className={inp} value={formData.loyalty_program_name} onChange={e => setFormData({ ...formData, loyalty_program_name: e.target.value })} /></div>
                            <div><label className={lbl}>Loyalty Program Type</label>
                                <select className={inp} value={formData.loyalty_program_type} onChange={e => setFormData({ ...formData, loyalty_program_type: e.target.value })}>
                                    <option value="Single Tier Program">Single Tier Program</option>
                                    <option value="Multi Tier Program">Multi Tier Program</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={lbl}>From Date *</label><input type="date" className={inp} value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} /></div>
                                <div><label className={lbl}>To Date</label><input type="date" className={inp} value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Customer Group</label>
                                <select className={inp} value={formData.customer_group} onChange={e => setFormData({ ...formData, customer_group: e.target.value })}>
                                    <option value="">Select Group</option>
                                    {customerGroups.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Customer Territory</label>
                                <select className={inp} value={formData.customer_territory} onChange={e => setFormData({ ...formData, customer_territory: e.target.value })}>
                                    <option value="">Select Territory</option>
                                    {territories.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pt-2">
                                <input type="checkbox" checked={!!formData.auto_opt_in} onChange={e => setFormData({ ...formData, auto_opt_in: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="text-sm font-semibold text-gray-700">Auto Opt In (For all customers)</span>
                            </label>
                        </div>
                    </div>

                    <div className={sec}>Collection Tier</div>
                    <div className="mb-4">
                        <label className={lbl}>Collection Rules</label>
                        <div className="border border-gray-200 rounded overflow-hidden text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className={th}>No.</th>
                                        <th className={th}>Tier Name *</th>
                                        <th className={th}>Collection Factor (=1 LP) *</th>
                                        <th className="w-10 px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {formData.collection_rules.map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-3"><input className={ri} value={r.tier_name} onChange={e => chRow('collection_rules', i, 'tier_name', e.target.value)} /></td>
                                            <td className="px-4 py-3"><input type="number" className={ri} value={r.collection_factor} onChange={e => chRow('collection_rules', i, 'collection_factor', e.target.value)} /></td>
                                            <td className="px-4 py-3 text-center"><button onClick={() => rmRow('collection_rules', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                                <button onClick={() => addRow('collection_rules', { tier_name: '', collection_factor: 0 })} className="text-[11px] font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">Add Row</button>
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Redemption</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={lbl}>Conversion Factor</label>
                                <input type="number" className={inp} value={formData.conversion_factor} onChange={e => setFormData({ ...formData, conversion_factor: e.target.value })} />
                                <p className="text-[10px] text-gray-400 mt-1">1 Loyalty Points = How much base currency?</p>
                            </div>
                            <div><label className={lbl}>Expiry Duration (in days)</label><input type="number" className={inp} value={formData.expiry_duration} onChange={e => setFormData({ ...formData, expiry_duration: e.target.value })} /></div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Expense Account</label>
                                <select className={inp} value={formData.expense_account} onChange={e => setFormData({ ...formData, expense_account: e.target.value })}>
                                    <option value="">Select Account</option>
                                    {accounts.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Company</label>
                                <select className={inp} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">Select Company</option>
                                    {companies.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Accounting Dimensions</div>
                    <div className="grid grid-cols-2 gap-x-12 mt-6">
                        <div><label className={lbl}>Cost Center</label>
                            <select className={inp} value={formData.cost_center} onChange={e => setFormData({ ...formData, cost_center: e.target.value })}>
                                <option value="">Select Cost Center</option>
                                {costCenters.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={sec}>Help Section</div>
                    <div className="bg-gray-100 rounded p-6 text-sm text-gray-600 space-y-3 shadow-none border border-gray-100">
                        <div className="font-bold text-gray-800">Notes</div>
                        <ul className="list-disc list-inside space-y-2 text-[13px]">
                            <li>Loyalty Points will be calculated from the spent done (via the Sales Invoice), based on collection factor mentioned.</li>
                            <li>There can be multiple tiered collection factor based on the total spent. But the conversion factor for redemption will always be same for all the tier.</li>
                            <li>In the case of multi-tier program, Customers will be auto assigned to the concerned tier as per their spent.</li>
                            <li>If unlimited expiry for the Loyalty Points, keep the Expiry Duration empty or 0.</li>
                            <li>If Auto Opt In is checked, then the customers will be automatically linked with the concerned Loyalty Program (on save).</li>
                            <li>One customer can be part of only single Loyalty Program.</li>
                        </ul>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default LoyaltyProgram;
