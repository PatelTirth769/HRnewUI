import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function JobRequisition() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [connectionsOpen, setConnectionsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    // Master data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Form data
    const defaultForm = {
        name: '',
        naming_series: 'HR-HIREQ-',
        no_of_positions: '',
        company: 'Preeshe Consultancy Services',
        designation: '',
        expected_compensation: '',
        status: 'Pending',
        department: '',
        requested_by: '',
        requested_by_name: '',
        req_department: '',
        req_designation: '',
        posting_date: new Date().toISOString().split('T')[0],
        expected_by: '',
        description: '',
        reason_for_requesting: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ────────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [compRes, deptRes, desigRes, empRes] = await Promise.all([
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                    API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Employee?fields=["name","employee_name","department","designation"]&limit_page_length=None&order_by=name asc'),
                ]);
                setCompanies((compRes.data?.data || []).map(c => c.name));
                setDepartments((deptRes.data?.data || []).map(d => d.name));
                setDesignations((desigRes.data?.data || []).map(d => d.name));
                setEmployees(empRes.data?.data || []);
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Job Requisition?fields=["name","designation","department","no_of_positions","expected_compensation","status","requested_by","posting_date","company"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Job Requisitions' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Job Requisition/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            // Look up employee details for Requested By section
            let empName = d.requested_by_name || '';
            let empDept = d.req_department || '';
            let empDesig = d.req_designation || '';
            if (d.requested_by && (!empDept || !empDesig)) {
                try {
                    const empRes = await API.get(`/api/resource/Employee/${encodeURIComponent(d.requested_by)}?fields=["employee_name","department","designation"]`);
                    const emp = empRes.data?.data || {};
                    empName = empName || emp.employee_name || '';
                    empDept = empDept || emp.department || '';
                    empDesig = empDesig || emp.designation || '';
                } catch (e) { console.warn('Could not fetch employee details:', e); }
            }
            setFormData({
                name: d.name || '',
                naming_series: d.naming_series || 'HR-HIREQ-',
                no_of_positions: d.no_of_positions || '',
                company: d.company || '',
                designation: d.designation || '',
                expected_compensation: d.expected_compensation || '',
                status: d.status || 'Pending',
                department: d.department || '',
                requested_by: d.requested_by || '',
                requested_by_name: empName,
                req_department: empDept,
                req_designation: empDesig,
                posting_date: d.posting_date || '',
                expected_by: d.expected_by || '',
                description: d.description || '',
                reason_for_requesting: d.reason_for_requesting || ''
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm, posting_date: new Date().toISOString().split('T')[0] });
        setActiveTab('details');
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setActiveTab('details');
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.no_of_positions || !formData.company || !formData.designation || !formData.expected_compensation || !formData.requested_by || !formData.posting_date) {
            notification.warning({ message: 'Please fill all required fields' });
            return;
        }

        setSaving(true);
        try {
            // ── Enforce Staff Planning Check ──
            const settingsRes = await fetch('/local-api/recruitment-settings');
            const settings = await settingsRes.json();

            if (settings.enforceStaffPlanning) {
                // Check if a matching Staffing Plan exists
                const today = new Date().toISOString().split('T')[0];
                const filters = JSON.stringify([
                    ["company", "=", formData.company],
                    ["from_date", "<=", today],
                    ["to_date", ">=", today]
                ]);
                const spRes = await API.get(`/api/resource/Staffing Plan?filters=${encodeURIComponent(filters)}&fields=["name"]&limit_page_length=None`);
                const staffingPlans = spRes.data?.data || [];

                if (staffingPlans.length === 0) {
                    window.alert(
                        `❌ No Active Staffing Plan!\n\nEnforce Staff Planning is enabled.\n\nNo active Staffing Plan found for "${formData.company}" covering today's date.\n\nPlease create a Staffing Plan first before creating a Job Requisition.`
                    );
                    setSaving(false);
                    return;
                }

                // Check if any plan has the required designation with available vacancies
                let hasVacancies = false;
                for (const sp of staffingPlans) {
                    const detailRes = await API.get(`/api/resource/Staffing Plan/${encodeURIComponent(sp.name)}`);
                    const details = detailRes.data?.data?.staffing_details || [];
                    const match = details.find(d => d.designation === formData.designation);
                    if (match && (match.vacancies > 0 || match.number_of_positions > 0)) {
                        hasVacancies = true;
                        break;
                    }
                }

                if (!hasVacancies) {
                    window.alert(
                        `❌ No Vacancies for Designation "${formData.designation}"!\n\nEnforce Staff Planning is enabled.\n\nNo active Staffing Plan has vacancies for this designation.\n\nPlease update your Staffing Plan to add "${formData.designation}" with available vacancies before creating a Job Requisition.`
                    );
                    setSaving(false);
                    return;
                }
            }

            // ── Proceed with save ──
            const payload = {
                naming_series: formData.naming_series,
                no_of_positions: parseInt(formData.no_of_positions) || 0,
                company: formData.company,
                designation: formData.designation,
                expected_compensation: parseFloat(formData.expected_compensation) || 0,
                status: formData.status,
                department: formData.department,
                requested_by: formData.requested_by,
                posting_date: formData.posting_date,
                expected_by: formData.expected_by || null,
                description: formData.description,
                reason_for_requesting: formData.reason_for_requesting
            };

            if (editingRecord) {
                await API.put(`/api/resource/Job Requisition/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Job Requisition updated successfully' });
            } else {
                const res = await API.post('/api/resource/Job Requisition', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Job Requisition ${newName || ''} created successfully` });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: `Save failed: ${err.response?.data?.exc || err.message}` });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Job Requisition/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => {
        setFormData(prev => {
            const updated = { ...prev, [key]: val };
            // Auto-populate employee fields when requested_by changes
            if (key === 'requested_by' && val) {
                const emp = employees.find(e => e.name === val);
                if (emp) {
                    updated.requested_by_name = emp.employee_name || '';
                    updated.req_department = emp.department || '';
                    updated.req_designation = emp.designation || '';
                }
            } else if (key === 'requested_by' && !val) {
                updated.requested_by_name = '';
                updated.req_department = '';
                updated.req_designation = '';
            }
            return updated;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': case 'Pending': return 'bg-orange-50 text-orange-600';
            case 'Open & Approved': return 'bg-blue-50 text-blue-600';
            case 'Filled': case 'Completed': return 'bg-green-50 text-green-600';
            case 'Cancelled': case 'Rejected': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.designation || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.requested_by || '').toLowerCase().includes(searchId.toLowerCase())
    );

    const hasActiveFilters = searchId !== '';
    const clearFilters = () => { setSearchId(''); };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {editingRecord ? editingRecord.name : 'New Job Requisition'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(formData.status)}`}>{formData.status}</span>
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
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Job Requisition</span>
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

                    {/* ── Tabs ── */}
                    <div className="px-6 pt-4 border-b border-gray-200">
                        <div className="flex gap-6">
                            <button
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('details')}>
                                Details
                            </button>
                            <button
                                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'job_description' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('job_description')}>
                                Job Description
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* ═══ DETAILS TAB ═══ */}
                        {activeTab === 'details' && (
                            <>
                                {/* ── Section 1: Main fields (3-column grid) ── */}
                                <div className="grid grid-cols-3 gap-x-8 gap-y-5 mb-8">
                                    {/* Row 1: Designation, No of Positions, Company */}
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Designation <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                            value={formData.designation} onChange={e => updateForm('designation', e.target.value)}>
                                            <option value="">Select Designation...</option>
                                            {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">No of. Positions <span className="text-red-500">*</span></label>
                                        <input type="number" min="0"
                                            className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                            value={formData.no_of_positions} onChange={e => updateForm('no_of_positions', e.target.value)}
                                            placeholder="" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                        <input type="text" readOnly
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                            value={formData.company} />
                                    </div>

                                    {/* Row 2: Department, Expected Compensation, Status */}
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Department</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                            value={formData.department} onChange={e => updateForm('department', e.target.value)}>
                                            <option value="">Select Department...</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Expected Compensation <span className="text-red-500">*</span></label>
                                        <input type="number" min="0"
                                            className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                            value={formData.expected_compensation} onChange={e => updateForm('expected_compensation', e.target.value)}
                                            placeholder="" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Status <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                            value={formData.status} onChange={e => updateForm('status', e.target.value)}>
                                            <option value="Pending">Pending</option>
                                            <option value="Open & Approved">Open & Approved</option>
                                            <option value="Filled">Filled</option>
                                            <option value="On Hold">On Hold</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ── Section 2: Requested By ── */}
                                <div className="border-t border-gray-200 pt-5 mb-6">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Requested By</h3>
                                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                        {/* Row 1: Requested By, Department */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Requested By <span className="text-red-500">*</span></label>
                                            <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                                value={formData.requested_by} onChange={e => updateForm('requested_by', e.target.value)}>
                                                <option value="">Select Employee...</option>
                                                {employees.map(emp => (
                                                    <option key={emp.name} value={emp.name}>{emp.name}: {emp.employee_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Department</label>
                                            <input type="text" readOnly
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                                value={formData.req_department} />
                                        </div>

                                        {/* Row 2: Requested By (Name), Designation */}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Requested By (Name)</label>
                                            <input type="text" readOnly
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                                value={formData.requested_by_name} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Designation</label>
                                            <input type="text" readOnly
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                                value={formData.req_designation} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 3: Timelines ── */}
                                <div className="border-t border-gray-200 pt-5">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Timelines</h3>
                                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Posting Date <span className="text-red-500">*</span></label>
                                            <input type="date"
                                                className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                                value={formData.posting_date} onChange={e => updateForm('posting_date', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Expected By</label>
                                            <input type="date"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                                value={formData.expected_by} onChange={e => updateForm('expected_by', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═══ JOB DESCRIPTION TAB ═══ */}
                        {activeTab === 'job_description' && (
                            <>
                                {/* Job Description */}
                                <div className="mb-6">
                                    <label className="block text-sm text-gray-600 mb-1">Job Description <span className="text-red-500">*</span></label>
                                    <textarea
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400 min-h-[200px]"
                                        rows={10}
                                        value={formData.description}
                                        onChange={e => updateForm('description', e.target.value)}
                                        placeholder="Enter job description..."
                                    />
                                </div>

                                {/* Reason for Requesting */}
                                <div className="border-t border-gray-200 pt-5">
                                    <label className="block text-sm text-gray-600 mb-1">Reason for Requesting</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        rows={6}
                                        value={formData.reason_for_requesting}
                                        onChange={e => updateForm('reason_for_requesting', e.target.value)}
                                        placeholder="Enter reason for requesting..."
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Job Requisition</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Job Requisition
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
                    placeholder="Search by name, designation..."
                    value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* ── Data Table ── */}
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
                        <p className="text-lg mb-2">No Job Requisitions found</p>
                        <p className="text-sm">Click "+ Add Job Requisition" to create one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Designation</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600">Positions</th>
                                    <th className="text-right px-4 py-3 font-medium text-gray-600">Compensation</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Posting Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-4 py-3">{row.designation || '-'}</td>
                                        <td className="px-4 py-3">{row.department || '-'}</td>
                                        <td className="px-4 py-3 text-center">{row.no_of_positions || 0}</td>
                                        <td className="px-4 py-3 text-right">
                                            ₹ {parseFloat(row.expected_compensation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(row.status)}`}>{row.status || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">{row.posting_date || '-'}</td>
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
                    <span>Source: ERPNext → /api/resource/Job Requisition</span>
                </div>
            )}
        </div>
    );
}
