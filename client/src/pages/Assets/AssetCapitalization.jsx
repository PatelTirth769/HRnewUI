import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, placeholder = "" }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input type={type} placeholder={placeholder}
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''} onChange={onChange ? (e) => onChange(e.target.value) : undefined} readOnly={disabled} />
    </div>
);

const SelectField = ({ label, value, options, required = false, onChange, disabled = false }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <select className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value || ''} onChange={onChange ? (e) => onChange(e.target.value) : undefined} disabled={disabled}>
            <option value=""></option>
            {options.map((opt, i) => <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>)}
        </select>
    </div>
);

/* Reusable empty-state sub-table */
const SubTable = ({ title, subtitle, columns, rows, onAdd, onRemove, onRowChange, masterOptions, saving }) => (
    <div className="mb-10">
        <h3 className="font-semibold text-gray-800 text-[15px] mb-2">{title}</h3>
        {subtitle && <div className="text-gray-500 font-medium mb-2 text-xs">{subtitle}</div>}
        <div className="border border-gray-200 rounded-md overflow-x-auto">
            <table className="w-full text-left bg-white whitespace-nowrap min-w-[700px]">
                <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[12px]">
                    <tr>
                        <th className="px-3 py-2 font-medium w-6"><input type="checkbox" className="rounded border-gray-300" disabled /></th>
                        <th className="px-3 py-2 font-medium w-12 text-center">No.</th>
                        {columns.map((col, i) => (
                            <th key={i} className="px-3 py-2 font-medium">{col.label} {col.required && <span className="text-red-400">*</span>}</th>
                        ))}
                        <th className="px-3 py-2 font-medium w-10 text-center"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[13px]">
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 3} className="text-center py-8">
                                <div className="text-gray-300 mb-1"><svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></div>
                                <p className="text-gray-400 text-sm">No Data</p>
                            </td>
                        </tr>
                    ) : rows.map((row, idx) => (
                        <tr key={idx}>
                            <td className="p-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                            <td className="p-2 text-center text-gray-500 font-medium">{idx + 1}</td>
                            {columns.map((col, ci) => (
                                <td key={ci} className="p-2">
                                    {col.type === 'select' ? (
                                        <select className="w-full border border-gray-100 rounded px-2 py-1.5 focus:border-blue-400 outline-none hover:border-gray-200"
                                            value={row[col.field] || ''} onChange={(e) => onRowChange(idx, col.field, e.target.value)} disabled={saving}>
                                            <option value=""></option>
                                            {(masterOptions[col.optionsKey] || []).map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={col.type || 'text'} className="w-full border border-gray-100 rounded px-2 py-1.5 focus:border-blue-400 outline-none hover:border-gray-200"
                                            value={row[col.field] !== undefined && row[col.field] !== null ? row[col.field] : ''} onChange={(e) => onRowChange(idx, col.field, e.target.value)} disabled={saving || col.readOnly} readOnly={col.readOnly} />
                                    )}
                                </td>
                            ))}
                            <td className="p-2 text-center">
                                <button type="button" onClick={() => onRemove(idx)} className="text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="bg-white p-2.5 border-t border-gray-100 rounded-b-md">
                <button type="button" onClick={onAdd} className="px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors shadow-sm">Add Row</button>
            </div>
        </div>
    </div>
);

const AssetCapitalization = () => {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [financeBooks, setFinanceBooks] = useState([]);
    const [assets, setAssets] = useState([]);
    const [items, setItems] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    const capitalizationMethods = ['Create a composite asset', 'Choose a WIP composite asset'];
    const entryTypes = ['Capitalization', 'Decapitalization'];
    const seriesList = ['ACC-ASC-.YYYY.-'];

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        company: '', capitalization_method: '', finance_book: '',
        naming_series: 'ACC-ASC-.YYYY.-', entry_type: 'Capitalization',
        posting_date: new Date().toISOString().split('T')[0],
        posting_time: new Date().toTimeString().split(' ')[0],
        edit_posting_date_and_time: 0,
        stock_items: [], asset_items: [], service_items: [],
        cost_center: ''
    };

    const [formData, setFormData] = useState({ ...emptyForm });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => { view === 'list' ? fetchRecords() : fetchMasters(); }, [view]);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Capitalization?fields=["name","company","entry_type","posting_date","naming_series"]&limit_page_length=None');
            setRecords(res.data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const [cR, fbR, aR, iR, wR, acR, ccR] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Finance Book?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Asset?fields=["name","asset_name","item_code","gross_purchase_amount"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Item?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Account?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setCompanies((cR.data.data || []).map(d => d.name));
            setFinanceBooks((fbR.data.data || []).map(d => d.name));
            setAssets(aR.data.data || []);
            setItems((iR.data.data || []).map(d => d.name));
            setWarehouses((wR.data.data || []).map(d => d.name));
            setAccounts((acR.data.data || []).map(d => d.name));
            setCostCenters((ccR.data.data || []).map(d => d.name));
        } catch (err) { console.error(err); }
    };

    const handleCreateNew = () => { setFormData({ ...emptyForm, company: companies.length === 1 ? companies[0] : '' }); setIsEditing(false); setEditId(null); setView('form'); };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Capitalization/${encodeURIComponent(id)}`);
            setFormData({ ...res.data.data, stock_items: res.data.data.stock_items || [], asset_items: res.data.data.asset_items || [], service_items: res.data.data.service_items || [] });
            setIsEditing(true); setEditId(id); setView('form');
        } catch (err) { notification.error({ message: 'Failed to fetch record' }); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Delete ${id}?`)) return;
        try { setLoading(true); await API.delete(`/api/resource/Asset Capitalization/${encodeURIComponent(id)}`); notification.success({ message: 'Deleted!' }); fetchRecords(); }
        catch (err) { notification.error({ message: 'Delete failed' }); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!formData.company || !formData.posting_date) { notification.warning({ message: 'Company and Posting Date are required' }); return; }
        try {
            setSaving(true);
            if (isEditing) { await API.put(`/api/resource/Asset Capitalization/${encodeURIComponent(editId)}`, formData); notification.success({ message: 'Updated!' }); }
            else { await API.post('/api/resource/Asset Capitalization', formData); notification.success({ message: 'Created!' }); }
            setView('list');
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) { try { const p = JSON.parse(errMsg); errMsg = p.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch {} }
            notification.error({ message: 'Save failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 5 });
        } finally { setSaving(false); }
    };

    // Generic sub-table helpers
    const addRow = (table, template) => setFormData({ ...formData, [table]: [...formData[table], { ...template }] });
    const removeRow = (table, idx) => setFormData({ ...formData, [table]: formData[table].filter((_, i) => i !== idx) });
    const changeRow = (table, idx, field, val) => { const arr = [...formData[table]]; arr[idx][field] = val; setFormData({ ...formData, [table]: arr }); };

    const masterOpts = { items, warehouses, assets: assets.map(a => a.name), accounts, costCenters };

    // Column definitions for each sub-table
    const stockCols = [
        { label: 'Item Code', field: 'item_code', type: 'select', optionsKey: 'items', required: true },
        { label: 'Warehouse', field: 'warehouse', type: 'select', optionsKey: 'warehouses', required: true },
        { label: 'Qty', field: 'qty', type: 'number' },
        { label: 'Stock UOM', field: 'stock_uom', type: 'text', required: true },
        { label: 'Valuation Rate', field: 'valuation_rate', type: 'number' },
        { label: 'Amount', field: 'amount', type: 'number' },
    ];
    const assetCols = [
        { label: 'Asset', field: 'asset', type: 'select', optionsKey: 'assets', required: true },
        { label: 'Asset Name', field: 'asset_name', type: 'text', readOnly: true },
        { label: 'Item Code', field: 'item_code', type: 'text', readOnly: true, required: true },
        { label: 'Current Asset Value', field: 'current_asset_value', type: 'number', readOnly: true },
        { label: 'Asset Value', field: 'asset_value', type: 'number' },
    ];
    const serviceCols = [
        { label: 'Item Code', field: 'item_code', type: 'select', optionsKey: 'items' },
        { label: 'Expense Account', field: 'expense_account', type: 'select', optionsKey: 'accounts', required: true },
        { label: 'Qty', field: 'qty', type: 'number' },
        { label: 'UOM', field: 'uom', type: 'text' },
        { label: 'Rate', field: 'rate', type: 'number' },
        { label: 'Amount', field: 'amount', type: 'number' },
    ];

    const handleAssetRowChange = (idx, field, val) => {
        const arr = [...formData.asset_items];
        arr[idx][field] = val;
        if (field === 'asset') {
            const found = assets.find(a => a.name === val);
            if (found) { arr[idx].asset_name = found.asset_name || ''; arr[idx].item_code = found.item_code || ''; arr[idx].current_asset_value = found.gross_purchase_amount || 0; }
        }
        setFormData({ ...formData, asset_items: arr });
    };

    if (view === 'form') {
        return (
            <div className="p-6 max-w-6xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={saving}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit: ${editId}` : 'New Asset Capitalization'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        {/* Top fields - 3 column grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6 mb-8">
                            <SelectField label="Company" required options={companies} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={saving} />
                            <SelectField label="Capitalization Method" required options={capitalizationMethods} value={formData.capitalization_method} onChange={(v) => setFormData({ ...formData, capitalization_method: v })} disabled={saving} />
                            <SelectField label="Finance Book" options={financeBooks} value={formData.finance_book} onChange={(v) => setFormData({ ...formData, finance_book: v })} disabled={saving} />

                            <SelectField label="Series" required options={seriesList} value={formData.naming_series} onChange={(v) => setFormData({ ...formData, naming_series: v })} disabled={saving || isEditing} />
                            <div></div>
                            <InputField label="Posting Date" required type="date" value={formData.posting_date} onChange={(v) => setFormData({ ...formData, posting_date: v })} disabled={saving} />

                            <SelectField label="Entry Type" required options={entryTypes} value={formData.entry_type} onChange={(v) => setFormData({ ...formData, entry_type: v })} disabled={saving} />
                            <div></div>
                            <div>
                                <InputField label="Posting Time" required type="time" value={formData.posting_time} onChange={(v) => setFormData({ ...formData, posting_time: v })} disabled={saving} />
                                <div className="flex items-center gap-2 mt-3">
                                    <input type="checkbox" id="edit_posting" className="w-3.5 h-3.5 rounded border-gray-300" checked={!!formData.edit_posting_date_and_time}
                                        onChange={(e) => setFormData({ ...formData, edit_posting_date_and_time: e.target.checked ? 1 : 0 })} disabled={saving} />
                                    <label htmlFor="edit_posting" className="text-[13px] text-gray-600 cursor-pointer">Edit Posting Date and Time</label>
                                </div>
                            </div>
                        </div>

                        {/* Consumed Stock Items */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <SubTable title="Consumed Stock Items" subtitle="Stock Items"
                            columns={stockCols} rows={formData.stock_items} masterOptions={masterOpts} saving={saving}
                            onAdd={() => addRow('stock_items', { item_code: '', warehouse: '', qty: 0, stock_uom: '', valuation_rate: 0, amount: 0 })}
                            onRemove={(i) => removeRow('stock_items', i)}
                            onRowChange={(i, f, v) => changeRow('stock_items', i, f, v)} />

                        {/* Consumed Assets */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <SubTable title="Consumed Assets" subtitle="Assets"
                            columns={assetCols} rows={formData.asset_items} masterOptions={masterOpts} saving={saving}
                            onAdd={() => addRow('asset_items', { asset: '', asset_name: '', item_code: '', current_asset_value: 0, asset_value: 0 })}
                            onRemove={(i) => removeRow('asset_items', i)}
                            onRowChange={handleAssetRowChange} />

                        {/* Service Expenses */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <SubTable title="Service Expenses" subtitle="Services"
                            columns={serviceCols} rows={formData.service_items} masterOptions={masterOpts} saving={saving}
                            onAdd={() => addRow('service_items', { item_code: '', expense_account: '', qty: 0, uom: '', rate: 0, amount: 0 })}
                            onRemove={(i) => removeRow('service_items', i)}
                            onRowChange={(i, f, v) => changeRow('service_items', i, f, v)} />

                        {/* Accounting Dimensions */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Accounting Dimensions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <SelectField label="Cost Center" options={costCenters} value={formData.cost_center} onChange={(v) => setFormData({ ...formData, cost_center: v })} disabled={saving} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Asset Capitalization</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchRecords}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Record
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Company</th>
                                <th className="px-4 py-3 font-medium">Entry Type</th>
                                <th className="px-4 py-3 font-medium">Posting Date</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12">
                                        <div className="text-gray-400 mb-2"><svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></div>
                                        <p className="text-gray-500 text-base">No Asset Capitalization Records Found</p>
                                    </td>
                                </tr>
                            ) : records.map((row) => (
                                <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                    <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{row.entry_type}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{row.posting_date}</td>
                                    <td className="px-4 py-2.5 text-center flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                                        <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => handleEdit(row.name)}><FiEdit2 /></button>
                                        <button className="text-red-500 hover:text-red-700 transition-colors" onClick={() => handleDelete(row.name)}><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssetCapitalization;
