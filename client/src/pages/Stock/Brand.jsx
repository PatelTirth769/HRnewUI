import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
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
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const TextAreaField = ({ label, value, onChange, placeholder = '' }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label}
        </label>
        <textarea
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 min-h-[120px] bg-white shadow-sm transition-colors"
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default function Brand() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Masters for child table
    const [companies, setCompanies] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [priceLists, setPriceLists] = useState([]);

    const initFormData = {
        name: '',
        description: '',
        brand_defaults: []
    };

    const [formData, setFormData] = useState(initFormData);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
            if (editingRecord) {
                fetchSingle(editingRecord.name);
            } else {
                setFormData(initFormData);
            }
        }
    }, [view, editingRecord]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Standard Brand doctype uses 'name' as the identifier. 'brand_name' usually does not exist.
            const res = await API.get('/api/resource/Brand?fields=["name","description"]&limit_page_length=500&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch Brands failed:', err);
            notification.error({ message: 'Failed to load Brands' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [cmp, wh, pl] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_name"]&limit_page_length=500'),
                API.get('/api/resource/Price List?fields=["name"]&limit_page_length=500')
            ]);
            setCompanies(cmp.data.data || []);
            setWarehouses(wh.data.data || []);
            setPriceLists(pl.data.data || []);
        } catch (err) {
            console.error('Fetch Masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Brand/${encodeURIComponent(name)}`);
            if (res.data?.data) {
                const d = res.data.data;
                if (!d.brand_defaults) d.brand_defaults = [];
                setFormData(d);
            }
        } catch (err) {
            console.error('Fetch single Brand failed:', err);
            notification.error({ message: 'Failed to load Brand details' });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData(initFormData);
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.name) {
            notification.warning({ message: 'Brand Name is required' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Brand/${encodeURIComponent(editingRecord.name)}`, formData);
                notification.success({ message: `"${formData.name}" updated successfully!` });
            } else {
                await API.post('/api/resource/Brand', formData);
                notification.success({ message: `"${formData.name}" created successfully!` });
            }

            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save failed:', err);
            const errMsg = err?.response?.data?._server_messages 
                ? JSON.parse(err.response.data._server_messages)[0] 
                : (err?.message || 'Save Failed');
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Brand/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err?.message || 'Delete operation failed' });
        }
    };

    // Child table helpers
    const addRow = () => {
        setFormData(p => ({
            ...p,
            brand_defaults: [...p.brand_defaults, { company: '', default_warehouse: '', default_price_list: '' }]
        }));
    };

    const removeRow = (index) => {
        const updated = [...formData.brand_defaults];
        updated.splice(index, 1);
        setFormData(p => ({ ...p, brand_defaults: updated }));
    };

    const updateRow = (index, field, value) => {
        const updated = [...formData.brand_defaults];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(p => ({ ...p, brand_defaults: updated }));
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => (d.name || '').toLowerCase().includes(term));
    }, [data, searchQuery]);

    const thClass = "px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100";
    const tdInp = "w-full border border-gray-100 rounded bg-transparent py-1.5 px-2 text-[13px] focus:ring-1 focus:ring-blue-400 focus:bg-white focus:border-blue-400 transition-colors outline-none";

    if (view === 'form') {
        return (
            <div className="p-6 max-w-4xl mx-auto pb-24 text-gray-800">
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
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-inter">
                                {editingRecord ? (formData.name || editingRecord.name) : 'New Brand'}
                            </h1>
                            {!editingRecord && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold uppercase tracking-wider ring-1 ring-orange-100">
                                    Not Saved
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="px-8 py-2.5 bg-[#1C1F26] text-white font-semibold rounded-lg shadow-sm hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </div>
                        ) : 'Save'}
                    </button>
                </div>

                <Spin spinning={loading}>
                    <div className="space-y-8">
                        {/* Main Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                            <div className="max-w-md">
                                <InputField
                                    label="Brand Name"
                                    value={formData.name}
                                    required
                                    onChange={(v) => setFormData(p => ({ ...p, name: v }))}
                                />
                            </div>
                            <div>
                                <TextAreaField
                                    label="Description"
                                    value={formData.description}
                                    onChange={(v) => setFormData(p => ({ ...p, description: v }))}
                                    placeholder="Enter brand description..."
                                />
                            </div>
                        </div>

                        {/* Defaults Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Defaults</h3>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-1 bg-gray-50/50">
                                    <h4 className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Defaults</h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[13px]">
                                        <thead>
                                            <tr>
                                                <th className="w-12 px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">No.</th>
                                                <th className={thClass}>Company *</th>
                                                <th className={thClass}>Default Warehouse</th>
                                                <th className={thClass}>Default Price List</th>
                                                <th className="w-12 bg-gray-50 border-b border-gray-100"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-700">
                                            {formData.brand_defaults.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 bg-gray-50/20">
                                                        <div className="flex flex-col items-center gap-2 opacity-60">
                                                            <svg className="w-10 h-10 stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path d="M9 17h6M9 13h6M9 9h2M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                                            </svg>
                                                            <span className="text-xs font-medium">No Data</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                formData.brand_defaults.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-4 py-3 text-center text-gray-400 font-medium">{idx + 1}</td>
                                                        <td className="px-4 py-3 min-w-[200px]">
                                                            <select 
                                                                className={tdInp}
                                                                value={row.company} 
                                                                onChange={(e) => updateRow(idx, 'company', e.target.value)}
                                                            >
                                                                <option value="">Select Company</option>
                                                                {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 min-w-[200px]">
                                                            <select 
                                                                className={tdInp}
                                                                value={row.default_warehouse} 
                                                                onChange={(e) => updateRow(idx, 'default_warehouse', e.target.value)}
                                                            >
                                                                <option value="">Select Warehouse</option>
                                                                {warehouses.map(w => <option key={w.name} value={w.name}>{w.warehouse_name || w.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 min-w-[200px]">
                                                            <select 
                                                                className={tdInp}
                                                                value={row.default_price_list} 
                                                                onChange={(e) => updateRow(idx, 'default_price_list', e.target.value)}
                                                            >
                                                                <option value="">Select Price List</option>
                                                                {priceLists.map(pl => <option key={pl.name} value={pl.name}>{pl.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                                onClick={() => removeRow(idx)}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <button 
                                        className="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200 transition-all shadow-sm active:scale-95"
                                        onClick={addRow}
                                    >
                                        Add Row
                                    </button>
                                </div>
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight font-inter">Brands</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage item brands and their defaults</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-5 py-2.5 bg-white text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button
                        className="px-6 py-2.5 bg-[#1C1F26] text-white rounded-lg text-[13px] font-bold hover:bg-black shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center gap-2"
                        onClick={handleNew}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Brand
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search brands..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL BRANDS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Brand</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Description</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400">Fetching records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <svg className="w-16 h-16 stroke-1 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-3.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <span className="text-lg font-bold text-gray-400 tracking-tight">No Brands Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.name} className="hover:bg-blue-50/30 group transition-all cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {(row.name).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                                    {row.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 max-w-md truncate">
                                            {row.description || <span className="text-gray-300 italic">No description</span>}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
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
