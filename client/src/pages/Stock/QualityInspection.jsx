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
const InputField = ({ label, value, required = false, onChange, type = 'text', disabled = false, bg = 'bg-white', helpText }) => (
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
        {helpText && <p className="text-[11px] text-gray-400 mt-1">{helpText}</p>}
    </div>
);

const TextAreaField = ({ label, value, onChange, rows = 3, disabled = false, bg = 'bg-white' }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">{label}</label>}
        <textarea
            rows={rows}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors cursor-text`}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false, bg = 'bg-white' }) => (
    <div>
        {label && <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>}
        <select
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : `focus:border-blue-400 ${bg} shadow-sm transition-colors`}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            <option value="">Select...</option>
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

export default function QualityInspection() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const [formData, setFormData] = useState({
        naming_series: '',
        inspection_type: '',
        report_date: new Date().toISOString().split('T')[0],
        reference_type: '',
        status: 'Accepted',
        reference_name: '',
        manual_inspection: 0,
        item_code: '',
        description: '',
        item_serial_no: '',
        batch_no: '',
        sample_size: 1.0,
        quality_inspection_template: '',
        readings: [],
        inspected_by: 'amitjain@lingayasgroup.org', // Default from screenshot
        remarks: '',
        verified_by: ''
    });

    const [namingSeries, setNamingSeries] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [batchList, setBatchList] = useState([]);
    const [templateList, setTemplateList] = useState([]);
    const [userList, setUserList] = useState([]);

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [itemRes, batchRes, templateRes, userRes, metaRes] = await Promise.all([
                API.get('/api/resource/Item?fields=["name","item_name","description"]&limit_page_length=500'),
                API.get('/api/resource/Batch?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Quality Inspection Template?fields=["name"]&limit_page_length=100'),
                API.get('/api/resource/User?fields=["name","full_name"]&limit_page_length=200'),
                API.get('/api/resource/DocType/Quality Inspection')
            ]);
            setItemsList(itemRes.data?.data || []);
            setBatchList(batchRes.data?.data || []);
            setTemplateList(templateRes.data?.data || []);
            setUserList(userRes.data?.data || []);
            
            const nsField = metaRes.data?.data?.fields?.find(f => f.fieldname === 'naming_series');
            if (nsField && nsField.options) {
                setNamingSeries(nsField.options.split('\n').filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Quality Inspection?fields=["name","item_code","report_date","status","docstatus"]&order_by=modified desc');
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
            const res = await API.get(`/api/resource/Quality Inspection/${encodeURIComponent(name)}`);
            const v = res.data?.data || {};
            setFormData({
                naming_series: v.naming_series || '',
                inspection_type: v.inspection_type || '',
                report_date: v.report_date || new Date().toISOString().split('T')[0],
                reference_type: v.reference_type || '',
                status: v.status || 'Accepted',
                reference_name: v.reference_name || '',
                manual_inspection: v.manual_inspection || 0,
                item_code: v.item_code || '',
                description: v.description || '',
                item_serial_no: v.item_serial_no || '',
                batch_no: v.batch_no || '',
                sample_size: v.sample_size || 1.0,
                quality_inspection_template: v.quality_inspection_template || '',
                readings: Array.isArray(v.readings) ? v.readings : [],
                inspected_by: v.inspected_by || '',
                remarks: v.remarks || '',
                verified_by: v.verified_by || ''
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
            naming_series: namingSeries[0] || 'MAT-QA-.YYYY.-',
            inspection_type: '',
            report_date: new Date().toISOString().split('T')[0],
            reference_type: '',
            status: 'Accepted',
            reference_name: '',
            manual_inspection: 0,
            item_code: '',
            description: '',
            item_serial_no: '',
            batch_no: '',
            sample_size: 1.0,
            quality_inspection_template: '',
            readings: [],
            inspected_by: 'amitjain@lingayasgroup.org',
            remarks: '',
            verified_by: ''
        });
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        fetchSingle(record.name);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.item_code || !formData.inspection_type) {
            notification.warning({ message: 'Item Code and Inspection Type are required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Quality Inspection/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Quality Inspection', formData);
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

    const addReading = () => setFormData(p => ({ ...p, readings: [...p.readings, { specification: '', status: 'Accepted', numeric: 0, reading_value: 0, reading_1: '' }] }));
    const removeReading = (idx) => setFormData(p => ({ ...p, readings: p.readings.filter((_, i) => i !== idx) }));
    const updateReading = (idx, field, val) => {
        const arr = [...formData.readings];
        arr[idx] = { ...arr[idx], [field]: val };
        setFormData(p => ({ ...p, readings: arr }));
    };

    /* ═══════════ FORM VIEW ═══════════ */
    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1240px] mx-auto pb-24 text-gray-800">
                <style>{`
                    .custom-checkbox { width: 14px; height: 14px; border-radius: 3px; border: 1px solid #d1d5db; cursor: pointer; }
                    .custom-checkbox:checked { background-color: #1C1F26; border-color: #1C1F26; }
                    .custom-select-borderless .ant-select-selector { border: none !important; background: transparent !important; padding: 0 !important; box-shadow: none !important; font-size: 13px !important; color: #374151 !important; }
                `}</style>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1" onClick={() => setView('list')}>
                            <FiChevronLeft size={24} />
                        </button>
                        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Quality Inspection'}
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
                        {/* Section 1: Header */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <SelectField label="Series" value={formData.naming_series} required options={namingSeries.map(s => ({ value: s, label: s }))} onChange={v => setFormData(p => ({...p, naming_series: v}))} bg="bg-gray-50/50" />
                                <InputField label="Report Date" type="date" value={formData.report_date} required onChange={v => setFormData(p => ({...p, report_date: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Status" value={formData.status} required options={[{value:'Accepted',label:'Accepted'},{value:'Rejected',label:'Rejected'}]} onChange={v => setFormData(p => ({...p, status: v}))} bg="bg-gray-50/50" />
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="checkbox" className="custom-checkbox" checked={!!formData.manual_inspection} onChange={e => setFormData(p => ({...p, manual_inspection: e.target.checked ? 1 : 0}))} />
                                    <span className="text-[13px] text-gray-700 font-medium">Manual Inspection</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <SelectField label="Inspection Type" value={formData.inspection_type} required options={[{value:'Incoming',label:'Incoming'},{value:'Outgoing',label:'Outgoing'},{value:'In-Process',label:'In-Process'}]} onChange={v => setFormData(p => ({...p, inspection_type: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Reference Type" value={formData.reference_type} required options={[{value:'Purchase Receipt',label:'Purchase Receipt'},{value:'Purchase Invoice',label:'Purchase Invoice'},{value:'Delivery Note',label:'Delivery Note'},{value:'Sales Invoice',label:'Sales Invoice'},{value:'Stock Entry',label:'Stock Entry'},{value:'Job Card',label:'Job Card'}]} onChange={v => setFormData(p => ({...p, reference_type: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Reference Name" value={formData.reference_name} required options={[]} onChange={v => setFormData(p => ({...p, reference_name: v}))} bg="bg-gray-50/50" />
                            </div>
                        </div>

                        {/* Section 2: Item Details */}
                        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-x-12">
                            <div className="space-y-6">
                                <SelectField label="Item Code" value={formData.item_code} required options={itemsList.map(i => ({ value: i.name, label: i.name }))} onChange={v => {
                                    const item = itemsList.find(it => it.name === v);
                                    setFormData(p => ({...p, item_code: v, description: item?.description || ''}));
                                }} bg="bg-gray-50/50" />
                                <InputField label="Item Serial No" value={formData.item_serial_no} onChange={v => setFormData(p => ({...p, item_serial_no: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Batch No" value={formData.batch_no} options={batchList.map(b => ({ value: b.name, label: b.name }))} onChange={v => setFormData(p => ({...p, batch_no: v}))} bg="bg-gray-50/50" />
                                <InputField label="Sample Size" type="number" value={formData.sample_size} required onChange={v => setFormData(p => ({...p, sample_size: parseFloat(v)||1.0}))} bg="bg-gray-50/50" />
                            </div>
                            <div>
                                <TextAreaField label="Description" value={formData.description} rows={8} onChange={v => setFormData(p => ({...p, description: v}))} bg="bg-gray-50/50" />
                            </div>
                        </div>

                        {/* Section 3: Template */}
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <SelectField label="Quality Inspection Template" value={formData.quality_inspection_template} options={templateList.map(t => ({ value: t.name, label: t.name }))} onChange={v => setFormData(p => ({...p, quality_inspection_template: v}))} bg="bg-gray-50/50" />
                        </div>

                        {/* Section 4: Readings Table */}
                        <div className="mt-12">
                            <h3 className="text-[13px] font-bold text-gray-500 mb-3 tracking-wide uppercase">Readings</h3>
                            <div className="border border-gray-100 rounded bg-[#fafafa] overflow-x-auto">
                                <table className="w-full text-left table-fixed min-w-[800px]">
                                    <thead className="border-b border-gray-100 bg-[#fbfbfb]">
                                        <tr>
                                            <th className="px-4 py-2 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                            <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500">Parameter <span className="text-[#E02424]">*</span></th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 w-32">Status</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-center w-20">Numeric</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Reading Value</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Reading 1</th>
                                            <th className="px-4 py-2 text-center w-10 text-gray-400">⚙️</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.readings.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 bg-white">
                                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                                        <FiMoreHorizontal size={32} />
                                                        <span className="text-[14px]">No Data</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.readings.map((row, idx) => (
                                                <tr key={idx} className="bg-white border-b border-gray-50 hover:bg-gray-50 relative group">
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                                    <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <InputField value={row.specification} onChange={v => updateReading(idx, 'specification', v)} />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <select className="w-full border-none bg-transparent focus:ring-0 text-[13px] text-gray-800 p-0" value={row.status} onChange={e => updateReading(idx, 'status', e.target.value)}>
                                                            <option value="Accepted">Accepted</option>
                                                            <option value="Rejected">Rejected</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" checked={!!row.numeric} onChange={e => updateReading(idx, 'numeric', e.target.checked ? 1 : 0)} /></td>
                                                    <td className="px-4 py-2"><input type="number" className="w-full text-right bg-transparent border-none focus:ring-0 p-0" value={row.reading_value} onChange={e => updateReading(idx, 'reading_value', parseFloat(e.target.value)||0)} /></td>
                                                    <td className="px-4 py-2"><input type="text" className="w-full text-right bg-transparent border-none focus:ring-0 p-0" value={row.reading_1} onChange={e => updateReading(idx, 'reading_1', e.target.value)} /></td>
                                                    <td className="px-4 py-2 text-center opacity-0 group-hover:opacity-100 transition-all"><button className="text-gray-300 hover:text-red-500" onClick={() => removeReading(idx)}><FiTrash2 size={13}/></button></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200 mt-3" onClick={addReading}>Add Row</button>
                        </div>

                        {/* Section 5: Footer */}
                        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-x-12">
                            <div className="space-y-6">
                                <SelectField label="Inspected By" value={formData.inspected_by} required options={userList.map(u => ({ value: u.name, label: u.full_name || u.name }))} onChange={v => setFormData(p => ({...p, inspected_by: v}))} bg="bg-gray-50/50" />
                                <SelectField label="Verified By" value={formData.verified_by} options={userList.map(u => ({ value: u.name, label: u.full_name || u.name }))} onChange={v => setFormData(p => ({...p, verified_by: v}))} bg="bg-gray-50/50" />
                            </div>
                            <div>
                                <TextAreaField label="Remarks" value={formData.remarks} rows={6} onChange={v => setFormData(p => ({...p, remarks: v}))} bg="bg-gray-50/50" />
                            </div>
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quality Inspection</h1>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-gray-600" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="px-4 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-2" onClick={handleNew}>
                        <FiPlus size={16} /> Add Quality Inspection
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Item Code</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Report Date</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Loading inspections...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No quality inspections found.</td></tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.name} className="hover:bg-blue-50/20 group transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{row.item_code}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.report_date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.status === 'Accepted' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {row.status}
                                            </span>
                                        </td>
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
