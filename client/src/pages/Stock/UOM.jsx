import React, { useEffect, useMemo, useState } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const InputField = ({
    label,
    value,
    required = false,
    onChange,
    type = 'text',
    disabled = false
}) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const CheckboxField = ({ label, checked, onChange, disabled = false, description = '' }) => (
    <div className="space-y-1">
        <label className={`flex items-center gap-2 py-1 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
            <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-[#1C1F26] focus:ring-[#1C1F26] focus:ring-offset-0 disabled:bg-gray-100"
                checked={!!checked}
                disabled={disabled}
                onChange={(e) => onChange && onChange(e.target.checked ? 1 : 0)}
            />
            <span className="text-sm text-gray-700 font-medium">{label}</span>
        </label>
        {description && <div className="text-xs text-gray-400 ml-6">{description}</div>}
    </div>
);

const isEnabled = (value) => value === 1 || value === true || value === '1';

export default function UOM() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        uom_name: '',
        enabled: 1,
        must_be_whole_number: 0
    });

    const updateField = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/UOM?fields=["name","uom_name","enabled","must_be_whole_number"]&limit_page_length=500&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch UOMs failed:', err);
            notification.error({ message: 'Failed to load UOMs' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/UOM/${encodeURIComponent(name)}`);
            if (res.data?.data) {
                setFormData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch single UOM failed:', err);
            notification.error({ message: 'Failed to load UOM details' });
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({
            uom_name: '',
            enabled: 1,
            must_be_whole_number: 0
        });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    const handleSave = async () => {
        if (!formData.uom_name) {
            notification.warning({ message: 'UOM Name is required' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                uom_name: formData.uom_name,
                enabled: isEnabled(formData.enabled) ? 1 : 0,
                must_be_whole_number: isEnabled(formData.must_be_whole_number) ? 1 : 0
            };

            if (editingRecord) {
                await API.put(`/api/resource/UOM/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${formData.uom_name}" updated successfully!` });
            } else {
                await API.post('/api/resource/UOM', payload);
                notification.success({ message: `"${formData.uom_name}" created successfully!` });
            }

            setView('list');
            setEditingRecord(null);
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            const errMsg = err?.response?.data?._server_messages || err?.message || 'Save Failed';
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.uom_name || record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/UOM/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.uom_name || record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err?.message || 'Delete operation failed' });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => (d.uom_name || d.name || '').toLowerCase().includes(term));
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg p-1" onClick={() => setView('list')}>
                            ←
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                            {editingRecord ? (formData.uom_name || editingRecord.name) : 'New UOM'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold uppercase">
                                Not Saved
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 text-[14px]">
                        <button
                            className="px-6 py-2 bg-[#1C1F26] text-white font-medium rounded shadow-sm hover:bg-black transition-colors disabled:opacity-50"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 gap-6 max-w-md">
                        <CheckboxField
                            label="Enabled"
                            checked={isEnabled(formData.enabled)}
                            onChange={(v) => updateField('enabled', v)}
                        />

                        <InputField
                            label="UOM Name"
                            value={formData.uom_name}
                            required
                            onChange={(v) => updateField('uom_name', v)}
                        />

                        <CheckboxField
                            label="Must be Whole Number"
                            checked={isEnabled(formData.must_be_whole_number)}
                            onChange={(v) => updateField('must_be_whole_number', v)}
                            description="Check this to disallow fractions. (for Nos)"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">UOM</h1>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition font-medium"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                        className="px-5 py-2 bg-[#1C1F26] text-white rounded text-[14px] font-medium hover:bg-black shadow-sm transition-colors"
                        onClick={handleNew}
                    >
                        + Add UOM
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search by UOM name..."
                        className="max-w-xs w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="text-xs text-gray-400 ml-auto">
                        {filteredData.length} items
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">UOM</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-gray-400">No UOMs found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 group transition-colors">
                                        <td
                                            className="px-6 py-3.5 font-medium text-gray-900 cursor-pointer"
                                            onClick={() => handleEdit(row)}
                                        >
                                            {row.uom_name || row.name}
                                        </td>
                                        <td className="px-6 py-3.5 flex items-center justify-end gap-3">
                                            <button
                                                className="text-blue-600 hover:text-blue-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleEdit(row)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-red-500 hover:text-red-700 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDelete(row)}
                                            >
                                                Delete
                                            </button>
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
