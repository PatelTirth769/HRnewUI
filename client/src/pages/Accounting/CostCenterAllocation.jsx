import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    main_cost_center: '',
    valid_from: new Date().toISOString().split('T')[0],
    company: '',
    allocation_percentages: [],
    docstatus: 0, // 0: Draft, 1: Submitted, 2: Cancelled
});

const CostCenterAllocation = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchAllocations();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchAllocationDetails(editingRecord);
            } else {
                setFormData(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchAllocations = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Cost Center Allocation?fields=["name","main_cost_center","company","valid_from","docstatus"]&limit_page_length=None&order_by=modified desc');
            setAllocations(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch allocations' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, ccRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None')
            ]);
            setCompanies(compRes.data.data || []);
            setCostCenters(ccRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchAllocationDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Cost Center Allocation/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch allocation details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.main_cost_center || !formData.company || !formData.valid_from) {
            notification.warning({ message: 'Validation', description: 'Main CC, Company and Date are required' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Cost Center Allocation/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Allocation updated successfully' });
            } else {
                await API.post('/api/resource/Cost Center Allocation', formData);
                notification.success({ message: 'Allocation created successfully' });
            }
            setView('list');
            fetchAllocations();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save allocation' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Submit this allocation? It will become read-only and enforce budget rules.')) return;
        setSaving(true);
        try {
            // Using frappe.client.submit as requested
            await API.post('/api/method/frappe.client.submit', { doc: formData });
            notification.success({ message: 'Submitted', description: 'Allocation submitted successfully' });
            setView('list');
            fetchAllocations();
        } catch (err) {
            notification.error({ message: 'Submission Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('Cancel this allocation?')) return;
        setSaving(true);
        try {
            // Using frappe.client.cancel as requested
            await API.post('/api/method/frappe.client.cancel', { 
                doctype: 'Cost Center Allocation', 
                name: editingRecord 
            });
            notification.success({ message: 'Cancelled', description: 'Allocation cancelled successfully' });
            setView('list');
            fetchAllocations();
        } catch (err) {
            notification.error({ message: 'Cancellation Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Cost Center Allocation/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchAllocations();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const addRow = () => {
        setFormData({
            ...formData,
            allocation_percentages: [...formData.allocation_percentages, { cost_center: '', percentage: 0 }]
        });
    };

    const updateRow = (idx, field, val) => {
        const updated = [...formData.allocation_percentages];
        updated[idx][field] = val;
        setFormData({ ...formData, allocation_percentages: updated });
    };

    const removeRow = (idx) => {
        setFormData({
            ...formData,
            allocation_percentages: formData.allocation_percentages.filter((_, i) => i !== idx)
        });
    };

    // UI Styles
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 shadow-sm";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = allocations.filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.main_cost_center || '').toLowerCase().includes(q) ||
                (a.company || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Cost Center Allocations</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchAllocations} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Allocation
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search ID, Cost Center or Company..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">ID / Main Cost Center</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Company / Valid From</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-500 italic font-medium tracking-tight">No allocations found</td></tr>
                            ) : (
                                filtered.map((a) => (
                                    <tr key={a.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button onClick={() => { setEditingRecord(a.name); setView('form'); }} className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                                                {a.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{a.main_cost_center}</div>
                                        </td>
                                        <td className="px-5 py-4 font-medium">
                                            <div className="text-gray-900 text-xs">{a.company}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5 uppercase font-black">{a.valid_from}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                a.docstatus === 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                a.docstatus === 1 ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 
                                                'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {a.docstatus === 0 ? 'Draft' : a.docstatus === 1 ? 'Submitted' : 'Cancelled'}
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

    const isReadOnly = formData.docstatus !== 0;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Cost Center Allocation'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                    {editingRecord && (
                         <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            formData.docstatus === 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            formData.docstatus === 1 ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 
                            'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {formData.docstatus === 0 ? 'Draft' : formData.docstatus === 1 ? 'Submitted' : 'Cancelled'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    
                    {editingRecord && formData.docstatus === 0 && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}

                    {formData.docstatus === 0 && (
                        <>
                            <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                            </button>
                            {editingRecord && (
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-70" onClick={handleSubmit} disabled={saving}>
                                    Submit
                                </button>
                            )}
                        </>
                    )}

                    {formData.docstatus === 1 && (
                        <button className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-100" onClick={handleCancel} disabled={saving}>
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-12">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Main Cost Center *</label>
                        <select 
                            className={inputStyle} 
                            value={formData.main_cost_center} 
                            onChange={e => setFormData({ ...formData, main_cost_center: e.target.value })}
                            disabled={isReadOnly}
                        >
                            <option value="">Select Main Cost Center...</option>
                            {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelStyle}>Valid From *</label>
                        <input 
                            type="date" 
                            className={inputStyle} 
                            value={formData.valid_from} 
                            onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>

                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select 
                            className={inputStyle} 
                            value={formData.company} 
                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                            disabled={isReadOnly}
                        >
                            <option value="">Select Company...</option>
                            {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm mb-6 uppercase tracking-wider">Cost Center Allocation Percentages</h3>
                    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 w-16 text-center text-[10px] uppercase font-bold tracking-widest text-gray-400">No.</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-tighter text-blue-600 italic">Cost Center *</th>
                                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-tighter">Percentage (%) *</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {formData.allocation_percentages.length === 0 ? (
                                    <tr><td colSpan="4" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">No percentages added yet. Click 'Add Row' to start.</td></tr>
                                ) : (
                                    formData.allocation_percentages.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-400 font-black text-xs">{idx + 1}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    className="w-full border border-blue-50 rounded px-3 py-1.5 text-sm bg-blue-50/10 focus:outline-none focus:border-blue-400 font-bold text-gray-700"
                                                    value={row.cost_center}
                                                    onChange={e => updateRow(idx, 'cost_center', e.target.value)}
                                                    disabled={isReadOnly}
                                                >
                                                    <option value="">Select Cost Center...</option>
                                                    {costCenters.map(cc => <option key={cc.name} value={cc.name}>{cc.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 border border-blue-50 rounded px-3 bg-blue-50/10 shadow-inner max-w-[120px] ml-auto">
                                                    <input
                                                        type="number"
                                                        className="w-full py-1.5 text-sm bg-transparent focus:outline-none text-right font-mono font-bold text-gray-700"
                                                        value={row.percentage}
                                                        onChange={e => updateRow(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                                        disabled={isReadOnly}
                                                        max="100"
                                                        min="0"
                                                    />
                                                    <span className="text-gray-400 font-black text-xs">%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!isReadOnly && (
                                                    <button className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2" onClick={() => removeRow(idx)}>✕</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {formData.allocation_percentages.length > 0 && (
                                <tfoot className="bg-gray-50/30">
                                    <tr>
                                        <td colSpan="2" className="px-4 py-2 text-right text-gray-400 font-black uppercase text-[10px]">Total</td>
                                        <td className="px-4 py-2 text-right">
                                            <div className={`text-sm font-bold font-mono ${
                                                formData.allocation_percentages.reduce((sum, r) => sum + r.percentage, 0) === 100 ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                                {formData.allocation_percentages.reduce((sum, r) => sum + r.percentage, 0)}%
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                    {!isReadOnly && (
                         <button className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addRow}>
                            + Add Row
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CostCenterAllocation;
