import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors ${
                disabled ? 'bg-gray-50 text-gray-500' : ''
            }`}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
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

const CheckboxField = ({ label, checked, onChange }) => (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
        <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
        />
        {label}
    </label>
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

export default function Batch() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);
    const [itemOptions, setItemOptions] = useState([]);
    const [itemUomMap, setItemUomMap] = useState({});

    const initialForm = {
        batch_id: '',
        item: '',
        batch_uom: '',
        expiry_date: '',
        manufacturing_date: '',
        batch_description: '',
        disabled: 0,
        use_batchwise_valuation: 0
    };
    const [formData, setFormData] = useState(initialForm);

    const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchItems();
            if (editingRecord?.name) fetchSingle(editingRecord.name);
        }
    }, [view, editingRecord]);

    useEffect(() => {
        if (!formData.item) {
            setField('batch_uom', '');
            return;
        }
        setField('batch_uom', itemUomMap[formData.item] || '');
    }, [formData.item, itemUomMap]);

    const fetchItems = async () => {
        try {
            const res = await API.get('/api/resource/Item?fields=["name","item_code","item_name","stock_uom"]&limit_page_length=500&order_by=modified desc');
            const items = res.data?.data || [];
            setItemOptions(items.map((item) => ({
                value: item.item_code || item.name,
                label: item.item_name ? `${item.item_code || item.name} - ${item.item_name}` : (item.item_code || item.name)
            })));
            const uomMap = {};
            items.forEach((item) => {
                const key = item.item_code || item.name;
                if (key) uomMap[key] = item.stock_uom || '';
            });
            setItemUomMap(uomMap);
        } catch (err) {
            setItemOptions([]);
            setItemUomMap({});
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const fields = encodeURIComponent('["name","batch_id","item","expiry_date","manufacturing_date","disabled"]');
            const res = await API.get(`/api/resource/Batch?fields=${fields}&limit_page_length=500&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            notification.error({ message: 'Failed to load Batches', description: parseServerMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Batch/${encodeURIComponent(name)}`);
            const d = res.data?.data;
            if (!d) return;
            setFormData({
                batch_id: d.batch_id || d.name || '',
                item: d.item || '',
                batch_uom: d.batch_uom || itemUomMap[d.item] || '',
                expiry_date: toInputDate(d.expiry_date),
                manufacturing_date: toInputDate(d.manufacturing_date),
                batch_description: d.batch_description || '',
                disabled: d.disabled ? 1 : 0,
                use_batchwise_valuation: d.use_batchwise_valuation ? 1 : 0
            });
        } catch (err) {
            notification.error({ message: 'Failed to load Batch', description: parseServerMessage(err) });
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
        if (!formData.batch_id.trim()) {
            notification.warning({ message: 'Batch ID is required' });
            return;
        }
        if (!formData.item) {
            notification.warning({ message: 'Item is required' });
            return;
        }

        const payload = {
            batch_id: formData.batch_id.trim(),
            item: formData.item,
            expiry_date: formData.expiry_date || undefined,
            manufacturing_date: formData.manufacturing_date || undefined,
            batch_description: formData.batch_description?.trim() || undefined,
            disabled: formData.disabled ? 1 : 0,
            use_batchwise_valuation: formData.use_batchwise_valuation ? 1 : 0
        };

        setSaving(true);
        try {
            if (editingRecord?.name) {
                await API.put(`/api/resource/Batch/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Batch updated successfully' });
            } else {
                await API.post('/api/resource/Batch', payload);
                notification.success({ message: 'Batch created successfully' });
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
        if (!window.confirm(`Are you sure you want to delete "${record.batch_id || record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Batch/${encodeURIComponent(record.name)}`);
            notification.success({ message: 'Batch deleted successfully' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: parseServerMessage(err) });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((row) => [row.batch_id, row.name, row.item].filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));
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
                                {editingRecord ? (formData.batch_id || editingRecord.name) : 'New Batch'}
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
                        <div className="p-6 flex flex-wrap gap-8 border-b border-gray-100 bg-gray-50/30">
                            <CheckboxField label="Disabled" checked={formData.disabled} onChange={(v) => setField('disabled', v)} />
                            <CheckboxField
                                label="Use Batch-wise Valuation"
                                checked={formData.use_batchwise_valuation}
                                onChange={(v) => setField('use_batchwise_valuation', v)}
                            />
                        </div>

                        <div className="p-8 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800">Batch Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Batch ID" required value={formData.batch_id} onChange={(v) => setField('batch_id', v)} />
                                <InputField label="Batch UOM" value={formData.batch_uom} onChange={() => {}} disabled />
                                <SelectField
                                    label="Item"
                                    required
                                    value={formData.item}
                                    options={itemOptions}
                                    placeholder="Select Item"
                                    onChange={(v) => setField('item', v)}
                                />
                                <InputField type="date" label="Expiry Date" value={formData.expiry_date} onChange={(v) => setField('expiry_date', v)} />
                                <InputField
                                    type="date"
                                    label="Manufacturing Date"
                                    value={formData.manufacturing_date}
                                    onChange={(v) => setField('manufacturing_date', v)}
                                />
                            </div>
                        </div>

                        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30">
                            <h3 className="text-lg font-semibold text-gray-800">Batch Description</h3>
                        </div>
                        <div className="p-8 pt-6">
                            <textarea
                                className="w-full min-h-[120px] border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white shadow-sm transition-colors"
                                value={formData.batch_description || ''}
                                onChange={(e) => setField('batch_description', e.target.value)}
                                placeholder="Enter batch description"
                            />
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Batch</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage stock batches</p>
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
                        Add Batch
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <input
                        type="text"
                        placeholder="Search batch id, item..."
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
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Batch ID</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Item</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Expiry</th>
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
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-400">No Batches found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr
                                        key={row.name}
                                        className="hover:bg-blue-50/30 group transition-all cursor-pointer"
                                        onClick={() => handleEdit(row)}
                                    >
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.batch_id || row.name}</td>
                                        <td className="px-6 py-4">{row.item || '-'}</td>
                                        <td className="px-6 py-4">{toInputDate(row.expiry_date) || '-'}</td>
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
