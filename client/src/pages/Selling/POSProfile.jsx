import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const POSProfile = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [companies, setCompanies] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [mopList, setMopList] = useState([]);
    const [userList, setUserList] = useState([]);

    const init = {
        name: '', pos_profile_name: '', company: '', warehouse: '', campaign: '',
        disabled: 0, is_default: 0, payments: [], users: []
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/POS Profile?fields=["name","pos_profile_name","company","warehouse","disabled","is_default"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [cp, wh, cg, mp, us] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=1000'),
                API.get('/api/resource/Campaign?fields=["name"]'),
                API.get('/api/resource/Mode of Payment?fields=["name"]'),
                API.get('/api/resource/User?fields=["name","full_name"]&limit_page_length=1000')
            ]);
            setCompanies(cp.data.data || []);
            setWarehouses(wh.data.data || []);
            setCampaigns(cg.data.data || []);
            setMopList(mp.data.data || []);
            setUserList(us.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/POS Profile/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.payments) d.payments = [];
            if (!d.users) d.users = [];
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.pos_profile_name || !formData.company) { notification.warning({ message: 'POS Profile Name and Company are required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/POS Profile/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/POS Profile', formData);
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
            await API.delete(`/api/resource/POS Profile/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted.' });
            setView('list');
        } catch (e) { notification.error({ message: 'Failed', description: e.message }); }
    };

    const addRow = (k, r) => setFormData(p => ({ ...p, [k]: [...(p[k] || []), r] }));
    const rmRow = (k, i) => { const a = [...(formData[k] || [])]; a.splice(i, 1); setFormData({ ...formData, [k]: a }); };
    const chRow = (k, i, f, v) => { const a = [...(formData[k] || [])]; a[i] = { ...a[i], [f]: v }; setFormData({ ...formData, [k]: a }); };

    const lbl = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inp = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const sec = "font-semibold text-gray-800 text-sm mb-4 mt-8 pb-2 border-b flex items-center gap-2";
    const th = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const ri = "w-full border border-gray-100 rounded bg-transparent py-1 px-2 text-sm focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors";

    if (view === 'list') return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">POS Profiles</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800">
                    + New POS Profile
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>{['Name', 'Profile Name', 'Company', 'Default', 'Status'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => r.pos_profile_name.toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.name}</td>
                                    <td className="px-4 py-3">{r.pos_profile_name}</td>
                                    <td className="px-4 py-3">{r.company}</td>
                                    <td className="px-4 py-3">{r.is_default ? 'Yes' : 'No'}</td>
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

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold">{editingRecord || 'New POS Profile'}</h1>
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
                            <div><label className={lbl}>POS Profile Name *</label><input className={inp} value={formData.pos_profile_name} onChange={e => setFormData({ ...formData, pos_profile_name: e.target.value })} /></div>
                            <div><label className={lbl}>Company *</label>
                                <select className={inp} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">Select Company</option>
                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div><label className={lbl}>Warehouse</label>
                                <select className={inp} value={formData.warehouse} onChange={e => setFormData({ ...formData, warehouse: e.target.value })}>
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Campaign</label>
                                <select className={inp} value={formData.campaign} onChange={e => setFormData({ ...formData, campaign: e.target.value })}>
                                    <option value="">Select Campaign</option>
                                    {campaigns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 0 : 1 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Enabled</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Is Default</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Transactions and Payments</div>
                    <div className="border border-gray-200 rounded overflow-hidden mb-8 text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>Mode of Payment</th>
                                    <th className={th}>Default</th>
                                    <th className="w-10 px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {formData.payments.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.mode_of_payment} onChange={e => chRow('payments', i, 'mode_of_payment', e.target.value)}>
                                                <option value="">Select Mode</option>
                                                {mopList.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!r.default} onChange={e => {
                                                const n = formData.payments.map((row, idx) => ({ ...row, default: idx === i ? (e.target.checked ? 1 : 0) : 0 }));
                                                setFormData({ ...formData, payments: n });
                                            }} />
                                        </td>
                                        <td className="px-4 py-3 text-center"><button onClick={() => rmRow('payments', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 font-bold text-xs"><button onClick={() => addRow('payments', { mode_of_payment: '', default: 0 })} className="text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">Add Row</button></div>
                    </div>

                    <div className={sec}>User Related Settings</div>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>User</th>
                                    <th className={th}>Default</th>
                                    <th className="w-10 px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {formData.users.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.user} onChange={e => chRow('users', i, 'user', e.target.value)}>
                                                <option value="">Select User</option>
                                                {userList.map(u => <option key={u.name} value={u.name}>{u.full_name} ({u.name})</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!r.default} onChange={e => {
                                                const n = formData.users.map((row, idx) => ({ ...row, default: idx === i ? (e.target.checked ? 1 : 0) : 0 }));
                                                setFormData({ ...formData, users: n });
                                            }} />
                                        </td>
                                        <td className="px-4 py-3 text-center"><button onClick={() => rmRow('users', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 font-bold text-xs"><button onClick={() => addRow('users', { user: '', default: 0 })} className="text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">Add Row</button></div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default POSProfile;
