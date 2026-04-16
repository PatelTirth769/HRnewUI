import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { notification, Spin, Select } from 'antd';
import { FiRefreshCw, FiChevronLeft, FiPlus, FiTrash2, FiEdit2, FiMoreHorizontal } from 'react-icons/fi';

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

/* ─── shared components ─── */
const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false, bg = 'bg-white' }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>}
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors`}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

export default function QualityInspectionTemplate() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const [formData, setFormData] = useState({
        quality_inspection_template_name: '',
        item_quality_inspection_parameter: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Quality Inspection Template?fields=["name","quality_inspection_template_name"]&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Quality Inspection Template/${encodeURIComponent(name)}`);
            const v = res.data?.data || {};
            setFormData({
                quality_inspection_template_name: v.quality_inspection_template_name || '',
                item_quality_inspection_parameter: Array.isArray(v.item_quality_inspection_parameter) ? v.item_quality_inspection_parameter : []
            });
        } catch (err) {
            notification.error({ message: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({
            quality_inspection_template_name: '',
            item_quality_inspection_parameter: []
        });
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        fetchSingle(record.name);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.quality_inspection_template_name) {
            notification.warning({ message: 'Template Name is required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Quality Inspection Template/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Quality Inspection Template', formData);
                notification.success({ message: 'Created successfully' });
            }
            setView('list');
            fetchData();
        } catch (err) {
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
        } finally {
            setSaving(false);
        }
    };

    const addRow = () => setFormData(p => ({ ...p, item_quality_inspection_parameter: [...p.item_quality_inspection_parameter, { specification: '', acceptance_criteria_value: '', numeric: 0, min_value: 0, max_value: 0 }] }));
    const removeRow = (idx) => setFormData(p => ({ ...p, item_quality_inspection_parameter: p.item_quality_inspection_parameter.filter((_, i) => i !== idx) }));
    const updateRow = (idx, field, val) => {
        const arr = [...formData.item_quality_inspection_parameter];
        arr[idx] = { ...arr[idx], [field]: val };
        setFormData(p => ({ ...p, item_quality_inspection_parameter: arr }));
    };

    /* ═══════════ FORM VIEW ═══════════ */
    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1240px] mx-auto pb-24 text-gray-800">
                <style>{`
                    .custom-checkbox { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d1d5db; cursor: pointer; }
                    .custom-checkbox:checked { background-color: #1C1F26; border-color: #1C1F26; }
                `}</style>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1" onClick={() => setView('list')}>
                            <FiChevronLeft size={24} />
                        </button>
                        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Quality Inspection Template'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf2e9] text-[#e06c27] font-semibold tracking-wide uppercase">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button className="px-5 py-1.5 bg-[#1C1F26] text-white rounded text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden text-[13px]">
                    <div className="p-8">
                        <div className="w-1/2 mb-10">
                            <InputField 
                                label="Quality Inspection Template Name" 
                                value={formData.quality_inspection_template_name} 
                                required 
                                onChange={v => setFormData(p => ({...p, quality_inspection_template_name: v}))} 
                                bg="bg-gray-50/50" 
                            />
                        </div>

                        <div className="mt-8">
                            <h3 className="text-[13px] font-bold text-gray-500 mb-3 tracking-wide uppercase">Item Quality Inspection Parameter</h3>
                            <div className="border border-gray-100 rounded bg-[#fafafa]">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                            <th className="py-3 text-gray-500 font-semibold w-12 text-center">No.</th>
                                            <th className="px-4 py-3 font-semibold text-gray-500 w-1/4">Parameter <span className="text-[#E02424]">*</span></th>
                                            <th className="px-4 py-3 font-semibold text-gray-500">Acceptance Criteria Value</th>
                                            <th className="px-4 py-3 font-semibold text-gray-500 text-center w-24">Numeric</th>
                                            <th className="px-4 py-3 font-semibold text-gray-500 text-right w-32">Minimum Value</th>
                                            <th className="px-4 py-3 font-semibold text-gray-500 text-right w-32">Maximum Value</th>
                                            <th className="px-4 py-3 text-center w-10 text-gray-400">⚙️</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.item_quality_inspection_parameter.length === 0 ? (
                                            <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 italic bg-white">No parameters added. Click 'Add Row' to start.</td></tr>
                                        ) : (
                                            formData.item_quality_inspection_parameter.map((row, idx) => (
                                                <tr key={idx} className="bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50 relative group">
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                                    <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-800" value={row.specification} onChange={e => updateRow(idx, 'specification', e.target.value)} placeholder="e.g. Dimensions" />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="text" className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-600" value={row.acceptance_criteria_value} onChange={e => updateRow(idx, 'acceptance_criteria_value', e.target.value)} />
                                                    </td>
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" checked={!!row.numeric} onChange={e => updateRow(idx, 'numeric', e.target.checked ? 1 : 0)} /></td>
                                                    <td className="px-4 py-2"><input type="number" className={`w-full text-right bg-transparent border-none focus:ring-0 p-0 ${!row.numeric ? 'opacity-20 pointer-events-none' : ''}`} value={row.min_value} step="0.001" onChange={e => updateRow(idx, 'min_value', parseFloat(e.target.value)||0)} /></td>
                                                    <td className="px-4 py-2"><input type="number" className={`w-full text-right bg-transparent border-none focus:ring-0 p-0 ${!row.numeric ? 'opacity-20 pointer-events-none' : ''}`} value={row.max_value} step="0.001" onChange={e => updateRow(idx, 'max_value', parseFloat(e.target.value)||0)} /></td>
                                                    <td className="px-4 py-2 text-center group-hover:opacity-100 opacity-0"><button className="text-gray-300 hover:text-red-500" onClick={() => removeRow(idx)}><FiTrash2 size={13}/></button></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200 mt-4 flex items-center gap-1" onClick={addRow}>
                                <FiPlus size={14} /> Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════ LIST VIEW ═══════════ */
    return (
        <div className="p-6 max-w-[1240px] mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Inspection Template</h1>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-gray-600" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="px-4 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-2" onClick={handleNew}>
                        <FiPlus size={16} /> Add Quality Inspection Template
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Template Name</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">Loading templates...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">No inspection templates found.</td></tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.name} className="hover:bg-blue-50/20 group transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{row.quality_inspection_template_name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                                                <FiEdit2 size={14} />
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
