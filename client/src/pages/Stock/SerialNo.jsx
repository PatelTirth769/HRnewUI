import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = 'text' }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], placeholder = 'Select' }) => (
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
    return '';
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

export default function SerialNo() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);
    const [itemOptions, setItemOptions] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [workOrderOptions, setWorkOrderOptions] = useState([]);

    const initialForm = {
        serial_no: '',
        item_code: '',
        warranty_expiry_date: '',
        amc_expiry_date: '',
        company: '',
        work_order: ''
    };
    const [formData, setFormData] = useState(initialForm);

    const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
            if (editingRecord?.name) {
                fetchSingle(editingRecord.name);
            }
        }
    }, [view, editingRecord]);

    const fetchMasters = async () => {
        try {
            const [itemsRes, companyRes, workOrderRes] = await Promise.allSettled([
                API.get('/api/resource/Item?fields=["name","item_code","item_name"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500&order_by=modified desc'),
                API.get('/api/resource/Work Order?fields=["name"]&limit_page_length=500&order_by=modified desc')
            ]);

            if (itemsRes.status === 'fulfilled') {
                const items = itemsRes.value.data?.data || [];
                setItemOptions(items.map((item) => ({
                    value: item.item_code || item.name,
                    label: item.item_name ? `${item.item_code || item.name} - ${item.item_name}` : (item.item_code || item.name)
                })));
            } else {
                setItemOptions([]);
            }

            if (companyRes.status === 'fulfilled') {
                const companies = companyRes.value.data?.data || [];
                setCompanyOptions(companies.map((c) => ({ value: c.name, label: c.name })));
            } else {
                setCompanyOptions([]);
            }

            if (workOrderRes.status === 'fulfilled') {
                const workOrders = workOrderRes.value.data?.data || [];
                setWorkOrderOptions(workOrders.map((w) => ({ value: w.name, label: w.name })));
            } else {
                setWorkOrderOptions([]);
            }
        } catch (err) {
            console.error('Fetch Serial No masters failed:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const fields = encodeURIComponent('["name","serial_no","item_code","company","work_order","warranty_expiry_date","amc_expiry_date"]');
            const res = await API.get(`/api/resource/Serial No?fields=${fields}&limit_page_length=500&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch Serial No failed:', err);
            notification.error({ message: 'Failed to load Serial Nos', description: parseServerMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Serial No/${encodeURIComponent(name)}`);
            const d = res.data?.data;
            if (!d) return;
            setFormData({
                serial_no: d.serial_no || d.name || '',
                item_code: d.item_code || '',
                warranty_expiry_date: toInputDate(d.warranty_expiry_date),
                amc_expiry_date: toInputDate(d.amc_expiry_date),
                company: d.company || '',
                work_order: d.work_order || ''
            });
        } catch (err) {
            console.error('Fetch single Serial No failed:', err);
            notification.error({ message: 'Failed to load Serial No', description: parseServerMessage(err) });
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

    const handleSave = async () => {
        if (!formData.serial_no.trim()) {
            notification.warning({ message: 'Serial No is required' });
            return;
        }
        if (!formData.item_code.trim()) {
            notification.warning({ message: 'Item Code is required' });
            return;
        }

        const payload = {
            serial_no: formData.serial_no?.trim(),
            item_code: formData.item_code?.trim(),
            warranty_expiry_date: formData.warranty_expiry_date || undefined,
            amc_expiry_date: formData.amc_expiry_date || undefined,
            company: formData.company?.trim() || undefined,
            work_order: formData.work_order?.trim() || undefined
        };

        setSaving(true);
        try {
            if (editingRecord?.name) {
                await API.put(`/api/resource/Serial No/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Serial No updated successfully' });
            } else {
                await API.post('/api/resource/Serial No', payload);
                notification.success({ message: 'Serial No created successfully' });
            }
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save Serial No failed:', err);
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.serial_no || record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Serial No/${encodeURIComponent(record.name)}`);
            notification.success({ message: 'Serial No deleted successfully' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: parseServerMessage(err) });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((row) =>
            [row.serial_no, row.name, row.item_code, row.company]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term))
        );
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-6xl mx-auto pb-24 text-gray-800">
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
                                {editingRecord ? (formData.serial_no || editingRecord.name) : 'New Serial No'}
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
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Serial No" required value={formData.serial_no} onChange={(v) => setField('serial_no', v)} />
                                    <SelectField
                                        label="Item Code"
                                        required
                                        value={formData.item_code}
                                        options={itemOptions}
                                        placeholder="Select Item Code"
                                        onChange={(v) => setField('item_code', v)}
                                    />
                                </div>
                            </div>

                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30">
                                <h3 className="text-lg font-semibold text-gray-800">Warranty / AMC Details</h3>
                            </div>
                            <div className="p-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    type="date"
                                    label="Warranty Expiry Date"
                                    value={formData.warranty_expiry_date}
                                    onChange={(v) => setField('warranty_expiry_date', v)}
                                />
                                <InputField
                                    type="date"
                                    label="AMC Expiry Date"
                                    value={formData.amc_expiry_date}
                                    onChange={(v) => setField('amc_expiry_date', v)}
                                />
                            </div>

                            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30">
                                <h3 className="text-lg font-semibold text-gray-800">More Information</h3>
                            </div>
                            <div className="p-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectField
                                    label="Company"
                                    value={formData.company}
                                    options={companyOptions}
                                    placeholder="Select Company"
                                    onChange={(v) => setField('company', v)}
                                />
                                <SelectField
                                    label="Work Order"
                                    value={formData.work_order}
                                    options={workOrderOptions}
                                    placeholder="Select Work Order"
                                    onChange={(v) => setField('work_order', v)}
                                />
                            </div>
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Serial No</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage serial numbers</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-5 py-2.5 bg-white text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                    <button
                        className="px-6 py-2.5 bg-[#1C1F26] text-white rounded-lg text-[13px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-all"
                        onClick={handleNew}
                    >
                        Add Serial No
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <input
                        type="text"
                        placeholder="Search serial no, item code, company..."
                        className="max-w-sm w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL RECORDS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Serial No</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Item Code</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Company</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">Fetching records...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">No Serial Nos found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr
                                        key={row.name}
                                        className="hover:bg-blue-50/30 group transition-all cursor-pointer"
                                        onClick={() => handleEdit(row)}
                                    >
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.serial_no || row.name}</td>
                                        <td className="px-6 py-4">{row.item_code || '-'}</td>
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
