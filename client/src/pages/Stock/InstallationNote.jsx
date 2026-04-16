import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const InputField = ({ label, value, onChange, required = false, type = 'text', disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

const SelectField = ({ label, value, onChange, options = [], placeholder = 'Select', required = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <select
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const toInputDate = (value) => {
    if (!value) return '';
    const normalized = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
};

const parseServerMessage = (err) => {
    const serverMsg = err?.response?.data?._server_messages;
    if (!serverMsg) return err?.message || 'Request failed';
    try {
        const parsed = JSON.parse(serverMsg);
        return typeof parsed?.[0] === 'string' ? parsed[0] : 'Request failed';
    } catch {
        return err?.message || 'Request failed';
    }
};

const getNowTime = () => {
    const dt = new Date();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};

export default function InstallationNote() {
    const [view, setView] = useState('list');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);

    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [items, setItems] = useState([]);

    const initialForm = {
        naming_series: 'MAT-INS-.YYYY.-',
        installation_date: new Date().toISOString().slice(0, 10),
        installation_time: getNowTime(),
        customer: '',
        status: 'Draft',
        company: '',
        remarks: '',
        items: []
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (view === 'list') {
            fetchRecords();
        } else {
            fetchMasters();
            if (editingRecord?.name) fetchSingle(editingRecord.name);
        }
    }, [view, editingRecord]);

    const fetchMasters = async () => {
        try {
            const [custRes, compRes, itemRes] = await Promise.allSettled([
                API.get('/api/resource/Customer?fields=["name","customer_name"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Item?fields=["name","item_code","item_name"]&limit_page_length=500&order_by=modified desc')
            ]);

            setCustomers(custRes.status === 'fulfilled' ? (custRes.value.data?.data || []) : []);
            setCompanies(compRes.status === 'fulfilled' ? (compRes.value.data?.data || []) : []);
            setItems(itemRes.status === 'fulfilled' ? (itemRes.value.data?.data || []) : []);
        } catch {
            setCustomers([]);
            setCompanies([]);
            setItems([]);
        }
    };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const fields = encodeURIComponent('["name","customer","installation_date","status","company"]');
            const res = await API.get(`/api/resource/Installation Note?fields=${fields}&limit_page_length=500&order_by=modified desc`);
            setRecords(res.data?.data || []);
        } catch (err) {
            notification.error({ message: 'Failed to load Installation Notes', description: parseServerMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Installation Note/${encodeURIComponent(name)}`);
            const d = res.data?.data;
            if (!d) return;
            setFormData({
                naming_series: d.naming_series || initialForm.naming_series,
                installation_date: toInputDate(d.installation_date) || initialForm.installation_date,
                installation_time: d.installation_time || initialForm.installation_time,
                customer: d.customer || '',
                status: d.status || 'Draft',
                company: d.company || '',
                remarks: d.remarks || '',
                items: (d.items || []).map((row) => ({
                    item_code: row.item_code || '',
                    installed_qty: row.installed_qty ?? row.qty ?? 0,
                    description: row.description || ''
                }))
            });
        } catch (err) {
            notification.error({ message: 'Failed to load Installation Note', description: parseServerMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData(initialForm);
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setView('form');
    };

    const handleAddItemRow = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, { item_code: '', installed_qty: 0, description: '' }]
        }));
    };

    const handleItemRowChange = (index, field, value) => {
        setFormData((prev) => {
            const nextItems = [...prev.items];
            nextItems[index] = { ...nextItems[index], [field]: value };
            return { ...prev, items: nextItems };
        });
    };

    const handleRemoveItemRow = (index) => {
        setFormData((prev) => {
            const nextItems = [...prev.items];
            nextItems.splice(index, 1);
            return { ...prev, items: nextItems };
        });
    };

    const handleSave = async () => {
        if (!formData.customer) {
            notification.warning({ message: 'Customer is required' });
            return;
        }
        if (!formData.company) {
            notification.warning({ message: 'Company is required' });
            return;
        }

        const payload = {
            naming_series: formData.naming_series,
            installation_date: formData.installation_date,
            installation_time: formData.installation_time || undefined,
            customer: formData.customer,
            company: formData.company,
            remarks: formData.remarks?.trim() || undefined,
            items: (formData.items || [])
                .filter((row) => row.item_code)
                .map((row) => ({
                    item_code: row.item_code,
                    installed_qty: Number(row.installed_qty || 0),
                    qty: Number(row.installed_qty || 0),
                    description: row.description || undefined
                }))
        };

        setSaving(true);
        try {
            if (editingRecord?.name) {
                await API.put(`/api/resource/Installation Note/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Installation Note updated successfully' });
            } else {
                await API.post('/api/resource/Installation Note', payload);
                notification.success({ message: 'Installation Note created successfully' });
            }
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Installation Note/${encodeURIComponent(record.name)}`);
            notification.success({ message: 'Installation Note deleted successfully' });
            fetchRecords();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: parseServerMessage(err) });
        }
    };

    const filteredRecords = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return records;
        return records.filter(
            (row) =>
                (row.name || '').toLowerCase().includes(term) ||
                (row.customer || '').toLowerCase().includes(term) ||
                (row.company || '').toLowerCase().includes(term)
        );
    }, [records, search]);

    const customerOptions = customers.map((c) => ({ value: c.name, label: c.customer_name || c.name }));
    const companyOptions = companies.map((c) => ({ value: c.name, label: c.name }));
    const itemOptions = items.map((i) => ({ value: i.item_code || i.name, label: i.item_name ? `${i.item_code || i.name} - ${i.item_name}` : (i.item_code || i.name) }));

    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                            onClick={() => setView('list')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                {editingRecord ? editingRecord.name : 'New Installation Note'}
                            </h1>
                            {!editingRecord && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold uppercase tracking-wider ring-1 ring-orange-100">
                                    Not Saved
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="px-8 py-2.5 bg-[#1C1F26] text-white font-semibold rounded-lg shadow-sm hover:bg-black transition-all disabled:opacity-50"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                <Spin spinning={loading}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800">Installation Note</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectField
                                    label="Series"
                                    value={formData.naming_series}
                                    onChange={(v) => setFormData((p) => ({ ...p, naming_series: v }))}
                                    options={[{ value: 'MAT-INS-.YYYY.-', label: 'MAT-INS-.YYYY.-' }]}
                                    required
                                />
                                <InputField
                                    label="Installation Date"
                                    type="date"
                                    value={formData.installation_date}
                                    onChange={(v) => setFormData((p) => ({ ...p, installation_date: v }))}
                                    required
                                />
                                <SelectField
                                    label="Customer"
                                    value={formData.customer}
                                    onChange={(v) => setFormData((p) => ({ ...p, customer: v }))}
                                    options={customerOptions}
                                    placeholder="Select Customer"
                                    required
                                />
                                <InputField
                                    label="Installation Time"
                                    type="time"
                                    value={formData.installation_time}
                                    onChange={(v) => setFormData((p) => ({ ...p, installation_time: v }))}
                                />
                                <InputField label="Status" value={formData.status} onChange={() => {}} disabled required />
                                <SelectField
                                    label="Company"
                                    value={formData.company}
                                    onChange={(v) => setFormData((p) => ({ ...p, company: v }))}
                                    options={companyOptions}
                                    placeholder="Select Company"
                                    required
                                />
                                <div className="md:col-span-2">
                                    <label className="block text-[13px] text-gray-500 mb-1 font-medium">Remarks</label>
                                    <textarea
                                        className="w-full min-h-[120px] border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors"
                                        value={formData.remarks || ''}
                                        onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30">
                            <h3 className="text-lg font-semibold text-gray-800">Items</h3>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                <table className="w-full text-left text-[13px]">
                                    <thead>
                                        <tr className="bg-gray-50/60">
                                            <th className="px-3 py-2 font-semibold text-gray-500 uppercase text-[11px]">No.</th>
                                            <th className="px-3 py-2 font-semibold text-gray-500 uppercase text-[11px]">Item Code *</th>
                                            <th className="px-3 py-2 font-semibold text-gray-500 uppercase text-[11px] text-right">Installed Qty *</th>
                                            <th className="px-3 py-2 font-semibold text-gray-500 uppercase text-[11px]">Description</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.items.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                                <td className="px-3 py-2 min-w-[260px]">
                                                    <select
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                        value={row.item_code || ''}
                                                        onChange={(e) => handleItemRowChange(idx, 'item_code', e.target.value)}
                                                    >
                                                        <option value="">Select Item</option>
                                                        {itemOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2 min-w-[140px]">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.001"
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400"
                                                        value={row.installed_qty ?? 0}
                                                        onChange={(e) => handleItemRowChange(idx, 'installed_qty', Number(e.target.value || 0))}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 min-w-[260px]">
                                                    <input
                                                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                        value={row.description || ''}
                                                        onChange={(e) => handleItemRowChange(idx, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <button
                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                                        onClick={() => handleRemoveItemRow(idx)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-8 text-center text-gray-400">No item rows</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                className="mt-3 px-4 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200 hover:bg-gray-200 transition-all"
                                onClick={handleAddItemRow}
                            >
                                Add Row
                            </button>
                        </div>
                    </div>
                </Spin>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Installation Note</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage installation notes</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-5 py-2.5 bg-white text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                        onClick={fetchRecords}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    <button
                        className="px-6 py-2.5 bg-[#1C1F26] text-white rounded-lg text-[13px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-all"
                        onClick={handleNew}
                    >
                        Add Installation Note
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <input
                        type="text"
                        placeholder="Search installation note, customer..."
                        className="max-w-sm w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredRecords.length} TOTAL RECORDS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">ID</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Customer</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Date</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Company</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">Fetching records...</td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">No Installation Notes found</td>
                                </tr>
                            ) : (
                                filteredRecords.map((row) => (
                                    <tr
                                        key={row.name}
                                        className="hover:bg-blue-50/30 group transition-all cursor-pointer"
                                        onClick={() => handleEdit(row)}
                                    >
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.name}</td>
                                        <td className="px-6 py-4">{row.customer || '-'}</td>
                                        <td className="px-6 py-4">{toInputDate(row.installation_date) || '-'}</td>
                                        <td className="px-6 py-4">{row.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    className="px-3 py-1.5 text-[12px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
