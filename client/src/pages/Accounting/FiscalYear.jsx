import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    year: '',
    disabled: 0,
    is_short_year: 0,
    year_start_date: '2026-01-01',
    year_end_date: '2026-12-31',
    companies: [], // Child table
});

const FiscalYear = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [years, setYears] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [availableCompanies, setAvailableCompanies] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchYears();
        } else {
            fetchCompanies();
            if (editingRecord) {
                fetchYear(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchYears = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fiscal Year?fields=["name","year","year_start_date","year_end_date","disabled"]&limit_page_length=None&order_by=year_start_date desc';
            const response = await API.get(url);
            setYears(response.data.data || []);
        } catch (err) {
            console.error('Error fetching fiscal years:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await API.get('/api/resource/Company?fields=["name"]');
            setAvailableCompanies((res.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    };

    const fetchYear = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Fiscal Year/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                year: d.year || '',
                disabled: d.disabled ?? 0,
                is_short_year: d.is_short_year ?? 0,
                year_start_date: d.year_start_date || '',
                year_end_date: d.year_end_date || '',
                companies: (d.companies || []).map(row => ({ company: row.company, name: row.name })),
            });
        } catch (err) {
            console.error('Error fetching fiscal year:', err);
            notification.error({ message: 'Error', description: 'Failed to load fiscal year data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // Child Table Handlers
    const addRow = () => {
        setForm(prev => ({
            ...prev,
            companies: [...prev.companies, { company: '' }]
        }));
    };

    const removeRow = (index) => {
        setForm(prev => ({
            ...prev,
            companies: prev.companies.filter((_, i) => i !== index)
        }));
    };

    const updateRow = (index, value) => {
        setForm(prev => {
            const newCompanies = [...prev.companies];
            newCompanies[index] = { ...newCompanies[index], company: value };
            return { ...prev, companies: newCompanies };
        });
    };

    const handleSave = async () => {
        if (!form.year) {
            notification.warning({ message: 'Year Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Fiscal Year/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Fiscal Year updated successfully.' });
            } else {
                await API.post('/api/resource/Fiscal Year', payload);
                notification.success({ message: 'Fiscal Year created successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this fiscal year?')) return;
        try {
            await API.delete(`/api/resource/Fiscal Year/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Fiscal Year deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = years.filter(y => {
            if (!search) return true;
            return (y.name || '').toLowerCase().includes(search.toLowerCase());
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center"
                            title="Go Back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Fiscal Years</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchYears} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Fiscal Year
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Year..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">Year Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Start Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600">End Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic">Fetching fiscal years...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-16 text-gray-500">No Fiscal Years Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.year}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium font-mono">{row.year_start_date}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium font-mono">{row.year_end_date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
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

    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading fiscal year data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Fiscal Year'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className={labelStyle}>Year Name *</label>
                            <input className={inputStyle} value={form.year} onChange={e => updateField('year', e.target.value)} placeholder="e.g. 2026, 2026-27" />
                        </div>
                        <div className="col-span-2 md:col-span-1 pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="disabled_chk"
                                        checked={!!form.disabled}
                                        onChange={e => updateField('disabled', e.target.checked ? 1 : 0)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <label htmlFor="disabled_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Disabled</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_short_year_chk"
                                        checked={!!form.is_short_year}
                                        onChange={e => updateField('is_short_year', e.target.checked ? 1 : 0)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                    />
                                    <label htmlFor="is_short_year_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Short/Long Year</label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Year Start Date *</label>
                            <input type="date" className={inputStyle} value={form.year_start_date} onChange={e => updateField('year_start_date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Year End Date *</label>
                            <input type="date" className={inputStyle} value={form.year_end_date} onChange={e => updateField('year_end_date', e.target.value)} />
                        </div>
                    </div>

                    {/* Companies Child Table */}
                    <div className="pt-8 border-t border-gray-100">
                        <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider">Companies</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-4 py-2 w-12 text-gray-400 font-medium text-center">No.</th>
                                        <th className="px-4 py-2 text-gray-600 font-medium text-left">Company</th>
                                        <th className="px-4 py-2 w-16 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {form.companies.length === 0 ? (
                                        <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">No Data - Add a company below</td></tr>
                                    ) : (
                                        form.companies.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                                <td className="px-4 py-2">
                                                    <select 
                                                        className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" 
                                                        value={row.company} 
                                                        onChange={(e) => updateRow(idx, e.target.value)}
                                                    >
                                                        <option value="">Select Company...</option>
                                                        {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button className="text-red-400 hover:text-red-600 transition p-1" onClick={() => removeRow(idx)}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm" onClick={addRow}>
                                    Add Row
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiscalYear;
