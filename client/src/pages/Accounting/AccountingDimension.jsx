import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    reference_doctype: '',
    label: '',
    dimension_name: '',
    dimension_defaults: [], // Child table
});

const AccountingDimension = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [dimensions, setDimensions] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [doctypes, setDoctypes] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchDimensions();
        } else {
            fetchMetadata();
            if (editingRecord) {
                fetchDimension(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDimensions = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Accounting Dimension?fields=["name","reference_doctype","label","disabled"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setDimensions(response.data.data || []);
        } catch (err) {
            console.error('Error fetching dimensions:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchMetadata = async () => {
        try {
            const [compRes, dtRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/DocType?fields=["name"]&filters=[["istable","=",0]]&limit_page_length=None'),
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setDoctypes((dtRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    };

    const fetchDimension = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Accounting Dimension/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                reference_doctype: d.reference_doctype || '',
                label: d.label || '',
                dimension_name: d.dimension_name || '',
                dimension_defaults: (d.dimension_defaults || []).map(row => ({ 
                    company: row.company, 
                    default_dimension: row.default_dimension,
                    mandatory_for_bs: row.mandatory_for_bs ?? 0,
                    mandatory_for_pl: row.mandatory_for_pl ?? 0,
                    name: row.name 
                })),
            });
        } catch (err) {
            console.error('Error fetching dimension:', err);
            notification.error({ message: 'Error', description: 'Failed to load dimension data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // Child Table Handlers
    const addRow = () => {
        setForm(prev => ({
            ...prev,
            dimension_defaults: [...prev.dimension_defaults, { 
                company: '', 
                default_dimension: '', 
                mandatory_for_bs: 0, 
                mandatory_for_pl: 0 
            }]
        }));
    };

    const removeRow = (index) => {
        setForm(prev => ({
            ...prev,
            dimension_defaults: prev.dimension_defaults.filter((_, i) => i !== index)
        }));
    };

    const updateRow = (index, key, value) => {
        setForm(prev => {
            const newDefaults = [...prev.dimension_defaults];
            newDefaults[index] = { ...newDefaults[index], [key]: value };
            return { ...prev, dimension_defaults: newDefaults };
        });
    };

    const handleSave = async () => {
        if (!form.reference_doctype) {
            notification.warning({ message: 'Reference Document Type is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Accounting Dimension/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Dimension updated.' });
            } else {
                await API.post('/api/resource/Accounting Dimension', payload);
                notification.success({ message: 'Dimension created.' });
            }
            setView('list');
            fetchDimensions();
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this dimension?')) return;
        try {
            await API.delete(`/api/resource/Accounting Dimension/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Dimension deleted.' });
            setView('list');
            fetchDimensions();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Standard UI Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 shadow-sm transition-all";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = dimensions.filter(d => {
            if (!search) return true;
            return (d.label || '').toLowerCase().includes(search.toLowerCase()) || (d.name || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Accounting Dimensions</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchDimensions} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Dimension
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search Label or Reference Doctype..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Dimension Name</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Reference DocType</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-400 italic font-medium tracking-tight">No Dimensions defined yet</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-sm" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.label || row.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-900 font-medium text-xs">{row.reference_doctype}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                !row.disabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {!row.disabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20 font-sans">
            {/* Header matches Education modules */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Accounting Dimension'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving || loadingForm}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                {loadingForm ? (
                    <div className="py-20 text-center"><Spin tip="Loading dimension details..." /></div>
                ) : (
                    <div className="space-y-12">
                        {/* Primary Fields */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>Reference Document Type *</label>
                                <select className={inputStyle} value={form.reference_doctype} onChange={e => updateField('reference_doctype', e.target.value)}>
                                    <option value="">Select Reference DocType...</option>
                                    {doctypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Dimension Name</label>
                                <input className={inputStyle} value={form.label} onChange={e => updateField('label', e.target.value)} placeholder="e.g. Project, Service Center" />
                            </div>
                        </div>

                        {/* Dimension Defaults Child Table */}
                        <div className="pt-8 border-t border-gray-100">
                            <h3 className="font-bold text-gray-800 text-sm mb-6 uppercase tracking-wider">Dimension Defaults</h3>
                            <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                                        <tr>
                                            <th className="px-4 py-3 w-16 text-center text-[10px] uppercase">No.</th>
                                            <th className="px-4 py-3 text-[11px] uppercase tracking-tighter">Company</th>
                                            <th className="px-4 py-3 text-[11px] uppercase tracking-tighter text-blue-600 italic">Default Dimension</th>
                                            <th className="px-4 py-3 text-center text-[10px] uppercase max-w-[120px] leading-tight">Mandatory For Balance Sheet</th>
                                            <th className="px-4 py-3 text-center text-[10px] uppercase max-w-[120px] leading-tight">Mandatory For Profit and Loss Account</th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {form.dimension_defaults.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-16 text-center text-gray-400 italic font-medium tracking-tight">
                                                    <div className="flex flex-col items-center gap-3 opacity-60">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        No Data
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            form.dimension_defaults.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-center text-gray-400 font-black text-xs">{idx + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <select 
                                                            className="w-full border border-gray-100 rounded px-2 py-1.5 text-sm bg-transparent font-medium" 
                                                            value={row.company} 
                                                            onChange={(e) => updateRow(idx, 'company', e.target.value)}
                                                        >
                                                            <option value="">Select Company...</option>
                                                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input 
                                                            className="w-full border border-blue-50 rounded px-3 py-1.5 text-sm bg-blue-50/10 focus:outline-none focus:border-blue-400 font-bold text-gray-700 shadow-inner" 
                                                            value={row.default_dimension} 
                                                            onChange={(e) => updateRow(idx, 'default_dimension', e.target.value)}
                                                            placeholder="Value..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={!!row.mandatory_for_bs} 
                                                            onChange={(e) => updateRow(idx, 'mandatory_for_bs', e.target.checked ? 1 : 0)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={!!row.mandatory_for_pl} 
                                                            onChange={(e) => updateRow(idx, 'mandatory_for_pl', e.target.checked ? 1 : 0)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2" onClick={() => removeRow(idx)}>✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addRow}>
                                + Add Row
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountingDimension;
