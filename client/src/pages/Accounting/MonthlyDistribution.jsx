import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
];

const emptyForm = () => ({
    distribution_name: '',
    fiscal_year: '',
    percentages: MONTHS.map(m => ({ 
        month: m, 
        percentage: 8.333 
    })),
});

const MonthlyDistribution = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [distributions, setDistributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState(emptyForm());
    const [fiscalYears, setFiscalYears] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchDistributions();
        } else {
            fetchFiscalYears();
            if (editingRecord) {
                fetchDetails(editingRecord);
            } else {
                setFormData(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDistributions = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Monthly Distribution?fields=["name","distribution_name","fiscal_year"]&limit_page_length=None&order_by=name asc');
            setDistributions(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch distributions' });
        } finally {
            setLoading(false);
        }
    };

    const fetchFiscalYears = async () => {
        try {
            const res = await API.get('/api/resource/Fiscal Year?fields=["name"]&limit_page_length=None');
            setFiscalYears(res.data.data || []);
        } catch (err) {
            console.error('Error fetching fiscal years:', err);
        }
    };

    const fetchDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Monthly Distribution/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.distribution_name) {
            notification.warning({ message: 'Validation', description: 'Distribution Name is required' });
            return;
        }

        const total = formData.percentages.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
        if (Math.abs(total - 100) > 0.01) {
            notification.warning({ message: 'Validation', description: `Total percentage must be 100. Current: ${total.toFixed(3)}%` });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Monthly Distribution/${encodeURIComponent(editingRecord)}`, formData);
                notification.success({ message: 'Distribution updated successfully' });
            } else {
                await API.post('/api/resource/Monthly Distribution', formData);
                notification.success({ message: 'Distribution created successfully' });
            }
            setView('list');
            fetchDistributions();
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Monthly Distribution/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted' });
            setView('list');
            fetchDistributions();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const updateRow = (idx, field, val) => {
        const updated = [...formData.percentages];
        updated[idx][field] = val;
        setFormData({ ...formData, percentages: updated });
    };

    const addRow = () => {
        setFormData({
            ...formData,
            percentages: [...formData.percentages, { month: '', percentage: 0 }]
        });
    };

    const removeRow = (idx) => {
        setFormData({
            ...formData,
            percentages: formData.percentages.filter((_, i) => i !== idx)
        });
    };

    // UI Styles
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50 shadow-sm";
    const labelStyle = "block text-[13px] text-gray-500 mb-2 font-medium";

    if (view === 'list') {
        const filtered = distributions.filter(d => {
            if (!search) return true;
            return (d.distribution_name || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Monthly Distributions</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchDistributions} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Distribution
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-96 shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder:italic" placeholder="Search Distribution Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Distribution Name</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Fiscal Year</th>
                                <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="3" className="py-12 text-center text-gray-400 italic font-medium tracking-tight">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="py-20 text-center text-gray-500 italic font-medium tracking-tight">No distributions found</td></tr>
                            ) : (
                                filtered.map((d) => (
                                    <tr key={d.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 font-bold text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => { setEditingRecord(d.name); setView('form'); }}>
                                            {d.distribution_name}
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-gray-700">{d.fiscal_year || '-'}</td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => { setEditingRecord(d.name); setView('form'); }} className="text-gray-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest">
                                                Edit
                                            </button>
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

    const totalPct = formData.percentages.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20 font-sans">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Monthly Distribution'}
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
                    <button className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-100 disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-12">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelStyle}>Distribution Name *</label>
                        <input 
                            className={inputStyle} 
                            value={formData.distribution_name} 
                            onChange={e => setFormData({ ...formData, distribution_name: e.target.value })}
                            placeholder="e.g. Even Distribution, Seasonal peak..."
                        />
                        <p className="text-[10px] text-gray-400 mt-1 italic">Name of the Monthly Distribution</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className={labelStyle}>Fiscal Year</label>
                        <select 
                            className={inputStyle} 
                            value={formData.fiscal_year} 
                            onChange={e => setFormData({ ...formData, fiscal_year: e.target.value })}
                        >
                            <option value="">Select Fiscal Year...</option>
                            {fiscalYears.map(fy => <option key={fy.name} value={fy.name}>{fy.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm mb-6 uppercase tracking-wider">Monthly Distribution Percentages</h3>
                    <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-[#F9FAFB] border-b text-gray-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 w-16 text-center text-[10px] uppercase font-bold tracking-widest text-gray-400">No.</th>
                                    <th className="px-4 py-3 text-[11px] uppercase tracking-tighter text-blue-600 italic">Month *</th>
                                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-tighter">Percentage Allocation</th>
                                    <th className="px-4 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 uppercase font-medium text-[12px]">
                                {formData.percentages.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-400 font-black text-[11px]">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            {MONTHS.includes(row.month) ? (
                                                <span className="text-gray-900 font-bold">{row.month}</span>
                                            ) : (
                                                <input 
                                                    className="w-full border-none bg-transparent focus:outline-none font-bold" 
                                                    value={row.month} 
                                                    onChange={e => updateRow(idx, 'month', e.target.value)}
                                                    placeholder="Month Name..."
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 border border-blue-50 rounded px-3 py-1 bg-blue-50/10 shadow-inner max-w-[120px] ml-auto">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent focus:outline-none text-right font-mono font-bold text-gray-700 text-sm"
                                                    value={row.percentage}
                                                    onChange={e => updateRow(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                                    step="0.001"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-gray-200 hover:text-red-500 transition-colors font-bold text-base px-2" onClick={() => removeRow(idx)}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan="2" className="px-4 py-3 text-right text-gray-400 font-black uppercase text-[10px]">Total Allocation</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className={`text-sm font-bold font-mono ${Math.abs(totalPct - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                                            {totalPct.toFixed(3)}%
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <button className="mt-4 px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black rounded hover:bg-gray-100 transition shadow-sm uppercase tracking-widest" onClick={addRow}>
                        + Add Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthlyDistribution;
