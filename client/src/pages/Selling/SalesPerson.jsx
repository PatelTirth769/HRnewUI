import React, { useState, useEffect } from 'react';
import { notification, Spin, Popconfirm } from 'antd';
import API from '../../services/api';

const SalesPerson = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState([]);
    const [salesPersons, setSalesPersons] = useState([]);
    const [itemGroups, setItemGroups] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);

    const init = {
        sales_person_name: '', employee: '', parent_sales_person: '',
        commission_rate: 0, is_group: 0, enabled: 1, targets: []
    };

    const [formData, setFormData] = useState(init);

    useEffect(() => {
        if (view === 'list') fetchRecords();
        else { fetchMasters(); editingRecord ? fetchDetails(editingRecord) : setFormData(init); }
    }, [view, editingRecord]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const r = await API.get('/api/resource/Sales Person?fields=["name","sales_person_name","employee","parent_sales_person","enabled"]&order_by=modified desc');
            setRecords(r.data.data || []);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch list' }); }
        finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [e, s, i, f] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=1000'),
                API.get('/api/resource/Sales Person?fields=["name","sales_person_name"]&limit_page_length=1000'),
                API.get('/api/resource/Item Group?fields=["name"]'),
                API.get('/api/resource/Fiscal Year?fields=["name"]')
            ]);
            setEmployees(e.data.data || []);
            setSalesPersons(s.data.data || []);
            setItemGroups(i.data.data || []);
            setFiscalYears(f.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchDetails = async (n) => {
        try {
            setLoading(true);
            const r = await API.get(`/api/resource/Sales Person/${encodeURIComponent(n)}`);
            const d = r.data.data;
            if (!d.targets) d.targets = [];
            setFormData(d);
        } catch { notification.error({ message: 'Error', description: 'Failed to fetch details' }); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.sales_person_name) { notification.warning({ message: 'Sales Person Name is required.' }); return; }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Sales Person/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Updated.' });
            } else {
                await API.post('/api/resource/Sales Person', formData);
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
            await API.delete(`/api/resource/Sales Person/${encodeURIComponent(editingRecord)}`);
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
                <h1 className="text-xl font-bold">Sales Persons</h1>
                <button onClick={() => { setEditingRecord(null); setView('form'); }} className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    + New Sales Person
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <input className="w-full max-w-md border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Spin spinning={loading}>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>{['Name', 'Employee', 'Parent Sales Person', 'Status'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.filter(r => r.sales_person_name.toLowerCase().includes(search.toLowerCase())).map(r => (
                                <tr key={r.name} className="hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                    <td className="px-4 py-3 font-medium text-blue-600">{r.sales_person_name}</td>
                                    <td className="px-4 py-3">{r.employee || '-'}</td>
                                    <td className="px-4 py-3">{r.parent_sales_person || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {r.enabled ? 'Enabled' : 'Disabled'}
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
                    <h1 className="text-xl font-bold">{editingRecord || 'New Sales Person'}</h1>
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
                    <div className="mb-4 text-sm font-semibold text-gray-800 border-b pb-2">Name and Employee ID</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div><label className={lbl}>Sales Person Name *</label><input className={inp} value={formData.sales_person_name} onChange={e => setFormData({ ...formData, sales_person_name: e.target.value })} /></div>
                            <div><label className={lbl}>Parent Sales Person</label>
                                <select className={inp} value={formData.parent_sales_person} onChange={e => setFormData({ ...formData, parent_sales_person: e.target.value })}>
                                    <option value="">Select Parent</option>
                                    {salesPersons.filter(s => s.name !== editingRecord).map(s => <option key={s.name} value={s.name}>{s.sales_person_name}</option>)}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">Select company name first.</p>
                            </div>
                            <div><label className={lbl}>Commission Rate</label><input type="number" className={inp} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} /></div>
                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.is_group} onChange={e => setFormData({ ...formData, is_group: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Is Group</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={!!formData.enabled} onChange={e => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Enabled</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div><label className={lbl}>Employee</label>
                                <select className={inp} value={formData.employee} onChange={e => setFormData({ ...formData, employee: e.target.value })}>
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => <option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={sec}>Sales Person Targets</div>
                    <p className="text-xs text-gray-500 mb-4">Set targets Item Group-wise for this Sales Person.</p>
                    <div className="border border-gray-200 rounded overflow-hidden text-xs">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider font-bold">
                                <tr>
                                    <th className={th}>No.</th>
                                    <th className={th}>Item Group</th>
                                    <th className={th}>Fiscal Year *</th>
                                    <th className={th}>Target Qty</th>
                                    <th className={th}>Target Amount</th>
                                    <th className={th}>Target Distribution *</th>
                                    <th className="w-10 px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white text-xs">
                                {formData.targets.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.item_group} onChange={e => chRow('targets', i, 'item_group', e.target.value)}>
                                                <option value="">Select Group</option>
                                                {itemGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select className={ri} value={r.fiscal_year} onChange={e => chRow('targets', i, 'fiscal_year', e.target.value)}>
                                                <option value="">Select Year</option>
                                                {fiscalYears.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.target_qty} onChange={e => chRow('targets', i, 'target_qty', e.target.value)} /></td>
                                        <td className="px-4 py-3"><input type="number" className={ri} value={r.target_amount} onChange={e => chRow('targets', i, 'target_amount', e.target.value)} /></td>
                                        <td className="px-4 py-3"><input className={ri} value={r.target_distribution} onChange={e => chRow('targets', i, 'target_distribution', e.target.value)} /></td>
                                        <td className="px-4 py-3 text-center"><button onClick={() => rmRow('targets', i)} className="text-gray-400 hover:text-red-500">✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <button onClick={() => addRow('targets', { item_group: '', fiscal_year: '', target_qty: 0, target_amount: 0, target_distribution: '' })} className="text-[11px] font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20">Add Row</button>
                        </div>
                    </div>
                </Spin>
            </div>
        </div>
    );
};

export default SalesPerson;
