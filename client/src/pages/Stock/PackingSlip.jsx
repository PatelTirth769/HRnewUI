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

export default function PackingSlip() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const [formData, setFormData] = useState({
        naming_series: '',
        delivery_note: '',
        from_package_no: 1,
        to_package_no: 1,
        items: [],
        gross_weight: 0,
        gross_weight_uom: '',
        letter_head: ''
    });

    const [dnList, setDnList] = useState([]);
    const [itemsList, setItemsList] = useState([]);
    const [uomList, setUomList] = useState([]);
    const [lhList, setLhList] = useState([]);
    const [namingSeries, setNamingSeries] = useState([]);

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [dnRes, itemRes, uomRes, lhRes, metaRes] = await Promise.all([
                API.get('/api/resource/Delivery Note?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Item?fields=["name","item_name"]&limit_page_length=500'),
                API.get('/api/resource/UOM?fields=["name"]&limit_page_length=100'),
                API.get('/api/resource/Letter Head?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/DocType/Packing Slip')
            ]);
            setDnList(dnRes.data?.data || []);
            setItemsList(itemRes.data?.data || []);
            setUomList(uomRes.data?.data || []);
            setLhList(lhRes.data?.data || []);
            
            const namingSeriesField = metaRes.data?.data?.fields?.find(f => f.fieldname === 'naming_series');
            if (namingSeriesField && namingSeriesField.options) {
                setNamingSeries(namingSeriesField.options.split('\n').filter(Boolean));
            }
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Packing Slip?fields=["name","delivery_note","docstatus","creation"]&order_by=modified desc');
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
            const res = await API.get(`/api/resource/Packing Slip/${encodeURIComponent(name)}`);
            const v = res.data?.data || {};
            setFormData({
                naming_series: v.naming_series || '',
                delivery_note: v.delivery_note || '',
                from_package_no: v.from_package_no || 1,
                to_package_no: v.to_package_no || 1,
                items: Array.isArray(v.items) ? v.items : [],
                gross_weight: v.gross_weight || 0,
                gross_weight_uom: v.gross_weight_uom || '',
                letter_head: v.letter_head || ''
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
            naming_series: namingSeries[0] || 'MAT-PAC-.YYYY.-',
            delivery_note: '',
            from_package_no: 1,
            to_package_no: 1,
            items: [],
            gross_weight: 0,
            gross_weight_uom: '',
            letter_head: ''
        });
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        fetchSingle(record.name);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.delivery_note) {
            notification.warning({ message: 'Delivery Note is required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Packing Slip/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: 'Updated successfully' });
            } else {
                await API.post('/api/resource/Packing Slip', formData);
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

    const addItem = () => setFormData(p => ({ ...p, items: [...p.items, { item_code: '', item_name: '', qty: 0, net_weight: 0, page_break: 0 }] }));
    const removeItem = (idx) => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    const updateItem = (idx, field, val) => {
        const arr = [...formData.items];
        arr[idx] = { ...arr[idx], [field]: val };
        if (field === 'item_code' && val) {
            const item = itemsList.find(i => i.name === val);
            if (item) arr[idx].item_name = item.item_name || '';
        }
        setFormData(p => ({ ...p, items: arr }));
    };

    /* ═══════════ FORM VIEW ═══════════ */
    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1200px] mx-auto pb-24 text-gray-800">
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
                            {editingRecord ? editingRecord.name : 'New Packing Slip'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf2e9] text-[#e06c27] font-semibold tracking-wide uppercase">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        <button className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 flex items-center justify-center">
                            <FiMoreHorizontal size={18} />
                        </button>
                        <button className="px-5 py-1.5 bg-[#1C1F26] text-white rounded text-[13px] font-semibold hover:bg-black transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden text-[13px]">
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                            <div>
                                <SelectField 
                                    label="Delivery Note" 
                                    value={formData.delivery_note} 
                                    required 
                                    options={dnList.map(dn => ({ value: dn.name, label: dn.name }))}
                                    onChange={v => setFormData(p => ({...p, delivery_note: v}))}
                                    bg="bg-gray-50/50"
                                    helpText="Indicates that the package is a part of this delivery (Only Draft)"
                                />
                            </div>
                            <div>
                                <SelectField 
                                    label="Series" 
                                    value={formData.naming_series} 
                                    required 
                                    options={namingSeries.map(s => ({ value: s, label: s }))}
                                    onChange={v => setFormData(p => ({...p, naming_series: v}))}
                                    bg="bg-gray-50/50"
                                />
                            </div>
                            <div>
                                <InputField 
                                    label="From Package No." 
                                    type="number" 
                                    value={formData.from_package_no} 
                                    required
                                    onChange={v => setFormData(p => ({...p, from_package_no: parseInt(v)||0}))}
                                    bg="bg-gray-50/50"
                                    helpText="Identification of the package for the delivery (for print)"
                                />
                            </div>
                            <div>
                                <InputField 
                                    label="To Package No." 
                                    type="number" 
                                    value={formData.to_package_no} 
                                    onChange={v => setFormData(p => ({...p, to_package_no: parseInt(v)||0}))}
                                    bg="bg-gray-50/50"
                                    helpText="If more than one package of the same type (for print)"
                                />
                            </div>
                        </div>

                        <div className="mt-12">
                            <h3 className="text-[13px] font-bold text-gray-500 mb-3 tracking-wide uppercase">Items</h3>
                            <div className="border border-gray-100 rounded bg-[#fafafa]">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-center w-10"><input type="checkbox" className="custom-checkbox" /></th>
                                            <th className="py-2 text-gray-500 font-semibold w-12 text-center">No.</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500">Item Code <span className="text-[#E02424]">*</span></th>
                                            <th className="px-4 py-2 font-semibold text-gray-500">Item Name</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Quantity <span className="text-[#E02424]">*</span></th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-right w-32">Net Weight</th>
                                            <th className="px-4 py-2 font-semibold text-gray-500 text-center w-24">Page Break</th>
                                            <th className="px-4 py-2 text-center w-10 text-gray-400">⚙️</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.length === 0 ? (
                                            <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 italic bg-white">No items added.</td></tr>
                                        ) : (
                                            formData.items.map((row, idx) => (
                                                <tr key={idx} className="bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50 relative group">
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" /></td>
                                                    <td className="py-2 text-gray-400 text-center">{idx + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <Select showSearch className="w-full custom-select-borderless" value={row.item_code || undefined} onChange={v => updateItem(idx, 'item_code', v)} options={itemsList.map(i => ({value: i.name, label: i.name}))} />
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{row.item_name}</td>
                                                    <td className="px-4 py-2"><input type="number" className="w-full text-right bg-transparent border-none focus:ring-0 p-0" value={row.qty} step="0.001" onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value)||0)} /></td>
                                                    <td className="px-4 py-2"><input type="number" className="w-full text-right bg-transparent border-none focus:ring-0 p-0" value={row.net_weight} step="0.01" onChange={e => updateItem(idx, 'net_weight', parseFloat(e.target.value)||0)} /></td>
                                                    <td className="px-4 py-2 text-center"><input type="checkbox" className="custom-checkbox" checked={!!row.page_break} onChange={e => updateItem(idx, 'page_break', e.target.checked ? 1 : 0)} /></td>
                                                    <td className="px-4 py-2 text-center group-hover:opacity-100 opacity-0"><button className="text-gray-300 hover:text-red-500" onClick={() => removeItem(idx)}><FiTrash2 size={13}/></button></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 text-[12px] font-semibold hover:bg-gray-200 mt-3" onClick={addItem}>Add Row</button>
                        </div>

                        <div className="mt-12">
                            <h3 className="text-[14px] font-bold text-gray-800 mb-4 tracking-tight">Package Weight Details</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div></div>
                                <div className="space-y-6">
                                    <InputField 
                                        label="Gross Weight" 
                                        type="number" 
                                        value={formData.gross_weight} 
                                        onChange={v => setFormData(p => ({...p, gross_weight: parseFloat(v)||0}))}
                                        bg="bg-gray-50/50"
                                        helpText="The gross weight of the package. Usually net weight + packaging material weight. (for print)"
                                    />
                                    <SelectField 
                                        label="Gross Weight UOM" 
                                        value={formData.gross_weight_uom} 
                                        options={uomList.map(u => ({ value: u.name, label: u.name }))}
                                        onChange={v => setFormData(p => ({...p, gross_weight_uom: v}))}
                                        bg="bg-gray-50/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <h3 className="text-[14px] font-bold text-gray-800 mb-4 tracking-tight">Letter Head</h3>
                            <div className="w-1/2">
                                <SelectField 
                                    label="Letter Head" 
                                    value={formData.letter_head} 
                                    options={lhList.map(h => ({ value: h.name, label: h.name }))}
                                    onChange={v => setFormData(p => ({...p, letter_head: v}))}
                                    bg="bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ═══════════ LIST VIEW ═══════════ */
    return (
        <div className="p-6 max-w-[1200px] mx-auto text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Packing Slip</h1>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-gray-600" onClick={fetchData} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="px-4 py-2 bg-[#1C1F26] text-white rounded text-sm font-semibold hover:bg-black transition-all shadow-sm" onClick={handleNew}>
                        Add Packing Slip
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead className="bg-[#f8f9fa] border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Delivery Note</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Created On</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Loading data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No records found.</td></tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.name} className="hover:bg-blue-50/20 group transition-colors cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{row.delivery_note}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.docstatus === 1 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {row.docstatus === 1 ? 'Submitted' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-[13px]">{new Date(row.creation).toLocaleDateString()}</td>
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
