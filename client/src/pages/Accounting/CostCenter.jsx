import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const CostCenter = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [costCenters, setCostCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        cost_center_name: '',
        cost_center_number: '',
        parent_cost_center: '',
        is_group: 0,
        company: '',
        disabled: 0
    });

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [parentCostCenters, setParentCostCenters] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchCostCenters();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchCostCenterDetails(editingRecord);
            } else {
                setFormData({
                    cost_center_name: '',
                    cost_center_number: '',
                    parent_cost_center: '',
                    is_group: 0,
                    company: '',
                    disabled: 0
                });
            }
        }
    }, [view, editingRecord]);

    const fetchCostCenters = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Cost Center?fields=["name","cost_center_name","parent_cost_center","is_group","disabled","company"]&limit_page_length=None&order_by=modified desc');
            setCostCenters(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch cost centers' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, parentRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Cost Center?fields=["name"]&filters=[["is_group","=",1]]&limit_page_length=None')
            ]);
            setCompanies(compRes.data.data || []);
            setParentCostCenters(parentRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchCostCenterDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Cost Center/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch cost center details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.cost_center_name || !formData.company) {
            notification.warning({ message: 'Validation', description: 'Cost Center Name and Company are required' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Cost Center/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Cost Center updated successfully.' });
            } else {
                await API.post('/api/resource/Cost Center', payload);
                notification.success({ message: 'Cost Center created successfully.' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this cost center?')) return;
        try {
            await API.delete(`/api/resource/Cost Center/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Cost Center deleted.' });
            setView('list');
            fetchCostCenters();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Standard App UI Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider";

    if (view === 'list') {
        const filtered = costCenters.filter(cc => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (cc.name || '').toLowerCase().includes(q) ||
                (cc.cost_center_name || '').toLowerCase().includes(q) ||
                (cc.company || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Cost Centers</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition font-medium" onClick={fetchCostCenters} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Cost Center
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none" placeholder="Search Name, ID or Company..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {costCenters.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase tracking-wider">ID / Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase tracking-wider">Parent</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase tracking-wider">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase tracking-wider">Company</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic font-medium tracking-tight">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-500 italic font-medium">No Cost Centers found.</td></tr>
                            ) : (
                                filtered.map((cc) => (
                                    <tr key={cc.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(cc.name); setView('form'); }}>
                                                {cc.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{cc.cost_center_name}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                                !cc.disabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {!cc.disabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 font-medium text-[13px]">{cc.parent_cost_center || '-'}</td>
                                        <td className="px-5 py-4">
                                            {cc.is_group ? (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-tighter border border-blue-100">Group</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-bold uppercase tracking-tighter border border-gray-100">Leaf</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-900 font-medium text-[13px]">{cc.company}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Form View Header Standard
    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? formData.cost_center_name || editingRecord : 'New Cost Center'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                    {editingRecord && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            !formData.disabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {!formData.disabled ? 'Enabled' : 'Disabled'}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            {/* Form Content standard within a card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-[1fr,280px] gap-20">
                    
                    {/* Left Column: Form Fields */}
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Cost Center Name *</label>
                            <input className={inputStyle} value={formData.cost_center_name} onChange={e => setFormData({ ...formData, cost_center_name: e.target.value })} placeholder="e.g. Sales Department" />
                        </div>

                        <div>
                            <label className={labelStyle}>Cost Center Number</label>
                            <input className={inputStyle} value={formData.cost_center_number} onChange={e => setFormData({ ...formData, cost_center_number: e.target.value })} placeholder="Optional code" />
                        </div>

                        <div>
                            <label className={labelStyle}>Parent Cost Center *</label>
                            <select className={inputStyle} value={formData.parent_cost_center} onChange={e => setFormData({ ...formData, parent_cost_center: e.target.value })}>
                                <option value="">Select Parent...</option>
                                {parentCostCenters.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelStyle}>Company *</label>
                            <select
                                className={inputStyle}
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                            >
                                <option value="">Select Company...</option>
                                {companies.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right Column: Checkboxes */}
                    <div className="pt-6 space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                            <input
                                type="checkbox"
                                id="is_group_chk"
                                checked={!!formData.is_group}
                                onChange={e => setFormData({ ...formData, is_group: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="is_group_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Group</label>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg">
                            <input
                                type="checkbox"
                                id="disabled_chk"
                                checked={!!formData.disabled}
                                onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="disabled_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Disabled</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostCenter;
