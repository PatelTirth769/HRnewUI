import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function StaffingPlan() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [connectionsOpen, setConnectionsOpen] = useState(true);

    // Master data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    // Form data
    const defaultForm = {
        name: '',
        company: 'Preeshe Consultancy Services',
        department: '',
        from_date: '',
        to_date: '',
        staffing_details: [],
        total_estimated_budget: 0
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ────────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [compRes, deptRes, desigRes] = await Promise.all([
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                    API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                ]);
                setCompanies((compRes.data?.data || []).map(c => c.name));
                setDepartments((deptRes.data?.data || []).map(d => d.name));
                setDesignations((desigRes.data?.data || []).map(d => d.name));
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Staffing Plan?fields=["name","company","department","from_date","to_date","total_estimated_budget"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Staffing Plans' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Staffing Plan/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                name: d.name || '',
                company: d.company || '',
                department: d.department || '',
                from_date: d.from_date || '',
                to_date: d.to_date || '',
                staffing_details: d.staffing_details || [],
                total_estimated_budget: d.total_estimated_budget || 0
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setView('form'); };
    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── CHILD TABLE OPERATIONS ──────────────────────────────────
    const handleAddRow = () => {
        setFormData(prev => ({
            ...prev,
            staffing_details: [
                ...prev.staffing_details,
                { designation: '', vacancies: 0, estimated_cost_per_position: 0, total_estimated_cost: 0, number_of_positions: 0 }
            ]
        }));
    };

    const handleRemoveRow = (idx) => {
        setFormData(prev => {
            const newRows = [...prev.staffing_details];
            newRows.splice(idx, 1);
            return calculateBudget({ ...prev, staffing_details: newRows });
        });
    };

    const handleRowChange = (idx, field, value) => {
        setFormData(prev => {
            const newRows = [...prev.staffing_details];
            const row = { ...newRows[idx], [field]: value };

            // Recalculate row total cost when vacancies or cost changes
            if (field === 'vacancies' || field === 'estimated_cost_per_position') {
                const vac = parseFloat(row.vacancies) || 0;
                const cost = parseFloat(row.estimated_cost_per_position) || 0;
                row.total_estimated_cost = vac * cost;
            }
            newRows[idx] = row;
            return calculateBudget({ ...prev, staffing_details: newRows });
        });
    };

    const calculateBudget = (dataObj) => {
        const total = dataObj.staffing_details.reduce((acc, row) => acc + (parseFloat(row.total_estimated_cost) || 0), 0);
        return { ...dataObj, total_estimated_budget: total };
    };

    // ─── SAVE & DELETE ───────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.company || !formData.from_date || !formData.to_date) {
            notification.warning({ message: 'Please fill all mandatory fields (Company, From Date, To Date)' });
            return;
        }

        // Child table validation
        const invalidRows = formData.staffing_details.some(r => !r.designation);
        if (invalidRows) {
            notification.warning({ message: 'Designation is required for all Staffing Details rows' });
            return;
        }

        setSaving(true);
        try {
            const staffingRows = formData.staffing_details.map((r, idx) => ({
                doctype: 'Staffing Plan Detail',
                parenttype: 'Staffing Plan',
                parentfield: 'staffing_details',
                idx: idx + 1,
                designation: r.designation,
                vacancies: parseFloat(r.vacancies) || 0,
                estimated_cost_per_position: parseFloat(r.estimated_cost_per_position) || 0,
                total_estimated_cost: parseFloat(r.total_estimated_cost) || 0,
                number_of_positions: parseFloat(r.number_of_positions) || 0,
                ...(r.name ? { name: r.name } : {})
            }));

            const doc = {
                doctype: 'Staffing Plan',
                company: formData.company,
                department: formData.department,
                from_date: formData.from_date,
                to_date: formData.to_date,
                staffing_details: staffingRows,
                total_estimated_budget: formData.total_estimated_budget
            };

            if (editingRecord) {
                doc.name = editingRecord.name;
                await API.post('/api/method/frappe.client.save', { doc });
                notification.success({ message: `Staffing Plan updated successfully!` });
            } else {
                if (formData.name) doc.name = formData.name;
                await API.post('/api/method/frappe.client.insert', { doc });
                notification.success({ message: `Staffing Plan created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            console.error('Response data:', err.response?.data);
            let errMsg = 'Failed to save Staffing Plan';
            const respData = err.response?.data;
            if (respData) {
                if (respData._server_messages) {
                    try {
                        const msgs = JSON.parse(respData._server_messages);
                        errMsg = msgs.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                    } catch { errMsg = respData._server_messages; }
                } else if (respData.exc_message) {
                    errMsg = respData.exc_message;
                } else if (respData.message) {
                    errMsg = respData.message;
                }
            }
            notification.error({ message: 'Save Failed', description: errMsg, duration: 8 });
        } finally { setSaving(false); }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Staffing Plan/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // ─── UI COMPONENTS ───────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(searchId.toLowerCase())
    );

    const hasActiveFilters = searchId !== '';
    const clearFilters = () => { setSearchId(''); };

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">{editingRecord ? editingRecord.name : 'New Staffing Plan'}</h1>
                        {editingRecord
                            ? <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">Editing</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Staffing Plan</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                {/* ── Card ── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                    {/* ── Connections (edit mode only) ── */}
                    {editingRecord && (
                        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                            <button
                                className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3 hover:text-gray-600"
                                onClick={() => setConnectionsOpen(!connectionsOpen)}>
                                <span>Connections</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${connectionsOpen ? '' : '-rotate-90'}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {connectionsOpen && (
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                        Job Opening
                                        <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        {/* ── Section 1: Main fields ── */}
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8">
                            {/* Name */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${editingRecord ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-orange-300 bg-orange-50'}`}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!!editingRecord}
                                    placeholder={editingRecord ? '' : 'Auto-generated or enter name'}
                                />
                            </div>

                            {/* From Date */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">From Date <span className="text-red-500">*</span></label>
                                <input type="date"
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* To Date */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">To Date <span className="text-red-500">*</span></label>
                                <input type="date"
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })}
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Department</label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                    <option value="">Select Department...</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ── Section 2: Staffing Details ── */}
                        <div className="border-t border-gray-200 pt-5">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Staffing Details</h3>
                            <div className="border border-gray-200 rounded overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="w-8 px-3 py-2.5"><input type="checkbox" className="accent-blue-600" disabled /></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-10">No.</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">Designation <span className="text-red-500">*</span></th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-28">Vacancies</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-44">Est. Cost/Position</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-40">Total Est. Cost</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-36">No. of Positions</th>
                                            <th className="w-8 px-3 py-2.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.staffing_details.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-10 text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                                                        </svg>
                                                        <span className="text-sm">No Data</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.staffing_details.map((row, idx) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-center"><input type="checkbox" className="accent-blue-600" /></td>
                                                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                            value={row.designation} onChange={e => handleRowChange(idx, 'designation', e.target.value)}>
                                                            <option value=""></option>
                                                            {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" min="0"
                                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400"
                                                            value={row.vacancies || ''} onChange={e => handleRowChange(idx, 'vacancies', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" min="0"
                                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400"
                                                            value={row.estimated_cost_per_position || ''} onChange={e => handleRowChange(idx, 'estimated_cost_per_position', e.target.value)} placeholder="0" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="text" readOnly
                                                            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right bg-gray-50 text-gray-500"
                                                            value={`₹ ${parseFloat(row.total_estimated_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" min="0"
                                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400"
                                                            value={row.number_of_positions || ''} onChange={e => handleRowChange(idx, 'number_of_positions', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-red-400 hover:text-red-600 text-sm"
                                                            onClick={() => handleRemoveRow(idx)} title="Delete row">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                                onClick={handleAddRow}>
                                Add Row
                            </button>
                        </div>

                        {/* ── Total Estimated Budget ── */}
                        <div className="border-t border-gray-200 pt-5 mt-6">
                            <div className="grid grid-cols-2 gap-x-10">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Total Estimated Budget</label>
                                    <input type="text" readOnly
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                        value={`₹ ${parseFloat(formData.total_estimated_budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Staffing Plan</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Staffing Plan
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-56" placeholder="Search by name or department..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading from ERPNext...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No Staffing Plans found</p>
                        <p className="text-sm">Click "+ Add Staffing Plan" to create one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">From Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">To Date</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Total Budget</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-4 py-3">{row.company || '-'}</td>
                                        <td className="px-4 py-3">{row.department || '-'}</td>
                                        <td className="px-4 py-3">{row.from_date || '-'}</td>
                                        <td className="px-4 py-3">{row.to_date || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            ₹ {parseFloat(row.total_estimated_budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 flex text-center">
                                            <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} records</span>
                </div>
            )}
        </div>
    );
}
