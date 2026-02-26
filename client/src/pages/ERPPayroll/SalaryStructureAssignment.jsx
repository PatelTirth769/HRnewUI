import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import API from '../../services/api';
import SalarySlipPreviewModal from '../../components/common/SalarySlipPreviewModal';

export default function SalaryStructureAssignment() {
    const location = useLocation();
    const navigate = useNavigate();
    // ─── STATE ────────────────────────────────────────────────────
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [connectionsOpen, setConnectionsOpen] = useState(true);
    const [connections, setConnections] = useState({ salary_slip: 0 });
    const [actionsOpen, setActionsOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Dropdown masters
    const [employees, setEmployees] = useState([]);
    const [structures, setStructures] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // ─── DEFAULT FORM ─────────────────────────────────────────────
    const defaultForm = {
        name: '',
        employee: '',
        employee_name: '',
        salary_structure: '',
        from_date: '',
        company: '',
        department: '',
        designation: '',
        currency: 'INR',
        base: '',
        variable: '',
        income_tax_slab: '',
        payroll_cost_centers: [],
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH LIST ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(
                '/api/resource/Salary Structure Assignment?fields=["name","employee","employee_name","department","designation","salary_structure","from_date","base","company","docstatus"]&limit_page_length=None&order_by=modified desc'
            );
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Salary Structure Assignments' });
        } finally { setLoading(false); }
    };

    // ─── FETCH MASTERS (employees, structures, departments, designations) ──
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, structRes, deptRes, desigRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company","department"]&filters=[["status","=","Active"]]&limit_page_length=None'),
                API.get('/api/resource/Salary Structure?fields=["name","company","currency"]&filters=[["docstatus","=",1],["is_active","=","Yes"]]&limit_page_length=None'),
                API.get('/api/resource/Department?limit_page_length=None'),
                API.get('/api/resource/Designation?limit_page_length=None'),
            ]);
            if (empRes.data.data) setEmployees(empRes.data.data);
            if (structRes.data.data) setStructures(structRes.data.data);
            if (deptRes.data.data) setDepartments(deptRes.data.data.map(d => typeof d === 'string' ? d : d.name));
            if (desigRes.data.data) setDesignations(desigRes.data.data.map(d => typeof d === 'string' ? d : d.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    useEffect(() => { fetchData(); fetchMasters(); }, []);

    // ─── EFFECTS FOR INTERNAL LINKS ───────────────────────────────
    useEffect(() => {
        if (mastersLoaded && location.state) {
            if (location.state.filterStructure && !location.state.openForm) {
                setFilterStructure(location.state.filterStructure);
            }
            if (location.state.openForm) {
                handleNew().then(() => {
                    if (location.state.newRecordWithStructure) {
                        handleStructureChange(location.state.newRecordWithStructure);
                    }
                });
                // clear state to prevent re-opening on refresh
                navigate(location.pathname, { replace: true });
            }
        }
    }, [mastersLoaded, location.state, navigate]);

    // ─── FETCH SINGLE ─────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Salary Structure Assignment/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                name: d.name || '',
                employee: d.employee || '',
                employee_name: d.employee_name || '',
                salary_structure: d.salary_structure || '',
                from_date: d.from_date || '',
                company: d.company || '',
                department: d.department || '',
                designation: d.designation || '',
                grade: d.grade || '',
                payroll_payable_account: d.payroll_payable_account || '',
                currency: d.currency || 'INR',
                base: d.base ?? '',
                variable: d.variable ?? '',
                income_tax_slab: d.income_tax_slab || '',
                payroll_cost_centers: (d.payroll_cost_centers || []).map(r => ({
                    cost_center: r.cost_center || '',
                    percentage: r.percentage ?? 100,
                })),
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load assignment details' });
        }
    };

    // ─── FETCH CONNECTIONS ────────────────────────────────────────
    const fetchConnections = async (name) => {
        try {
            const filterStr = encodeURIComponent(JSON.stringify({ salary_structure_assignment: name }));
            const slipRes = await API.get(`/api/method/frappe.client.get_count?doctype=Salary Slip&filters=${filterStr}`).catch(() => ({ data: { message: 0 } }));
            setConnections({ salary_slip: slipRes?.data?.message || 0 });
        } catch { setConnections({ salary_slip: 0 }); }
    };

    // ─── STATUS HELPER ────────────────────────────────────────────
    const getStatusLabel = (d) => {
        if (d.docstatus === 0) return 'Draft';
        if (d.docstatus === 1) return 'Submitted';
        if (d.docstatus === 2) return 'Cancelled';
        return 'Draft';
    };

    // Extra filter states
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterStructure, setFilterStructure] = useState(location.state?.filterStructure && !location.state?.openForm ? location.state.filterStructure : '');

    // ─── FILTERS ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId) {
            const q = searchId.toLowerCase();
            const matchName = d.name?.toLowerCase().includes(q);
            const matchEmpId = d.employee?.toLowerCase().includes(q);
            const matchEmpName = d.employee_name?.toLowerCase().includes(q);
            if (!matchName && !matchEmpId && !matchEmpName) return false;
        }
        if (filterDepartment && d.department !== filterDepartment) return false;
        if (filterDesignation && d.designation !== filterDesignation) return false;
        if (filterStructure && d.salary_structure !== filterStructure) return false;
        if (filterStatus && getStatusLabel(d) !== filterStatus) return false;
        return true;
    });
    const hasActiveFilters = searchId || filterDepartment || filterDesignation || filterStructure || filterStatus;
    const clearFilters = () => { setSearchId(''); setFilterDepartment(''); setFilterDesignation(''); setFilterStructure(''); setFilterStatus(''); };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = async () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        await fetchMasters();
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await Promise.all([fetchSingle(record.name), fetchMasters()]);
        fetchConnections(record.name);
    };

    // ─── EMPLOYEE CHANGE (auto-fill fields) ───────────────────────
    const handleEmployeeChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                employee: emp.name,
                employee_name: emp.employee_name || '',
                company: emp.company || '',
                department: emp.department || '',
                designation: emp.designation || '',
            }));
        } else {
            updateForm('employee', empId);
        }
    };

    // ─── SALARY STRUCTURE CHANGE (auto-fill currency) ────────────
    const handleStructureChange = (structName) => {
        const s = structures.find(st => st.name === structName);
        updateForm('salary_structure', structName);
        if (s) updateForm('currency', s.currency || 'INR');
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.employee.trim()) {
            notification.warning({ message: 'Employee is required' });
            return;
        }
        if (!formData.salary_structure.trim()) {
            notification.warning({ message: 'Salary Structure is required' });
            return;
        }
        if (!formData.from_date) {
            notification.warning({ message: 'From Date is required' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                salary_structure: formData.salary_structure,
                from_date: formData.from_date,
                company: formData.company,
                currency: formData.currency,
                base: formData.base ? parseFloat(formData.base) : 0,
                variable: formData.variable ? parseFloat(formData.variable) : 0,
                income_tax_slab: formData.income_tax_slab,
                payroll_cost_centers: formData.payroll_cost_centers
                    .filter(r => r.cost_center)
                    .map(r => ({
                        cost_center: r.cost_center,
                        percentage: parseFloat(r.percentage) || 0,
                    })),
            };

            if (editingRecord) {
                await API.put(`/api/resource/Salary Structure Assignment/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Salary Structure Assignment', payload);
                const newName = res.data?.data?.name || 'New record';
                notification.success({ message: `"${newName}" created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* noop */ }
            }
            notification.error({ message: editingRecord ? 'Update Failed' : 'Create Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Salary Structure Assignment/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* noop */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const addCostCenterRow = () => {
        updateForm('payroll_cost_centers', [...formData.payroll_cost_centers, { cost_center: '', percentage: 100 }]);
    };
    const updateCostCenterRow = (idx, field, val) => {
        const updated = [...formData.payroll_cost_centers];
        updated[idx] = { ...updated[idx], [field]: val };
        updateForm('payroll_cost_centers', updated);
    };
    const removeCostCenterRow = (idx) => {
        updateForm('payroll_cost_centers', formData.payroll_cost_centers.filter((_, i) => i !== idx));
    };

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
                            {editingRecord ? editingRecord.name : 'New Salary Structure Assignment'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded ${getStatusLabel(editingRecord) === 'Submitted' ? 'bg-blue-50 text-blue-600' :
                                getStatusLabel(editingRecord) === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>{getStatusLabel(editingRecord)}</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-2 relative">
                        {editingRecord && (
                            <>
                                <button
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded border hover:bg-gray-200 flex items-center gap-2"
                                    onClick={() => setActionsOpen(!actionsOpen)}
                                >
                                    ACTIONS
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {actionsOpen && (
                                    <div className="absolute top-11 left-0 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50 py-1">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                                            onClick={() => {
                                                setShowPreview(true);
                                                setActionsOpen(false);
                                            }}
                                        >
                                            Preview Salary Slip
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Salary Structure Assignment</span>
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
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                        onClick={() => {
                                            window.open(
                                                `https://preeshe.hrhovercraft.in/app/salary-slip?salary_structure_assignment=${encodeURIComponent(editingRecord.name)}`,
                                                '_blank'
                                            );
                                        }}
                                    >
                                        {connections.salary_slip > 0 && <span className="font-medium text-blue-600">{connections.salary_slip}</span>}
                                        Salary Slip
                                        <span
                                            className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                    `https://preeshe.hrhovercraft.in/app/salary-slip/new?employee=${encodeURIComponent(formData.employee)}&salary_structure=${encodeURIComponent(formData.salary_structure)}`,
                                                    '_blank'
                                                );
                                            }}
                                        >+</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        {/* ── Section 1: Main fields ── */}
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8">
                            {/* Left Column */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Employee <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.employee}
                                    onChange={(e) => handleEmployeeChange(e.target.value)}>
                                    <option value="">Select Employee...</option>
                                    {employees.map(e => (
                                        <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Right Column */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Salary Structure <span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.salary_structure}
                                    onChange={(e) => handleStructureChange(e.target.value)}>
                                    <option value="">Select Structure...</option>
                                    {structures.map(s => (
                                        <option key={s.name} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Employee Name (auto-filled) */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Employee Name</label>
                                <input type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                    value={formData.employee_name} readOnly />
                            </div>

                            {/* From Date */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">From Date <span className="text-red-500">*</span></label>
                                <input type="date"
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.from_date}
                                    onChange={(e) => updateForm('from_date', e.target.value)} />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Department</label>
                                <input type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                    value={formData.department} readOnly />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                    value={formData.company} readOnly />
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Designation</label>
                                <input type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                    value={formData.designation} readOnly />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Currency <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                    value={formData.currency} readOnly />
                            </div>
                        </div>

                        {/* ── Section 2: Base & Variable ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Base & Variable</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Base</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                                        <input type="number"
                                            className="w-full border border-gray-200 rounded pl-7 pr-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                            value={formData.base}
                                            onChange={(e) => updateForm('base', e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Variable</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                                        <input type="number"
                                            className="w-full border border-gray-200 rounded pl-7 pr-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                            value={formData.variable}
                                            onChange={(e) => updateForm('variable', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Payroll Cost Centers ── */}
                        <div className="border-t border-gray-200 pt-5">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Payroll Cost Centers</h3>
                            <div className="border border-gray-200 rounded overflow-hidden mb-3">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="w-8 px-3 py-2.5"><input type="checkbox" className="accent-blue-600" disabled /></th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-10">No.</th>
                                            <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">Cost Center <span className="text-red-500">*</span></th>
                                            <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-36">Percentage (%) <span className="text-red-500">*</span></th>
                                            <th className="w-8 px-3 py-2.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.payroll_cost_centers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-10 text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                                                        </svg>
                                                        <span className="text-sm">No Data</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.payroll_cost_centers.map((row, idx) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-center"><input type="checkbox" className="accent-blue-600" /></td>
                                                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <input type="text"
                                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                            value={row.cost_center}
                                                            onChange={(e) => updateCostCenterRow(idx, 'cost_center', e.target.value)}
                                                            placeholder="e.g. Main - Company Name" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number"
                                                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:border-blue-400"
                                                            value={row.percentage}
                                                            onChange={(e) => updateCostCenterRow(idx, 'percentage', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button className="text-red-400 hover:text-red-600 text-sm"
                                                            onClick={() => removeCostCenterRow(idx)} title="Delete row">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                                onClick={addCostCenterRow}>
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
                {/* Salary Slip Preview Modal */}
                <SalarySlipPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    assignmentData={formData}
                />
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
                <h1 className="text-2xl font-semibold text-gray-800">Salary Structure Assignment</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Assignment
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input
                    type="text"
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-52"
                    placeholder="Search by ID / Name..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)} />

                {/* Salary Structure dropdown with available options */}
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    value={filterStructure}
                    onChange={(e) => setFilterStructure(e.target.value)}>
                    <option value="">Salary Structure</option>
                    {structures.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                </select>

                {/* Department dropdown */}
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}>
                    <option value="">Department</option>
                    {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                {/* Designation dropdown */}
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    value={filterDesignation}
                    onChange={(e) => setFilterDesignation(e.target.value)}>
                    <option value="">Designation</option>
                    {designations.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                {/* Status dropdown */}
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Cancelled">Cancelled</option>
                </select>

                {hasActiveFilters && (
                    <button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>
                        ✕ Clear Filters
                    </button>
                )}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="w-8 px-4 py-3"><input type="checkbox" className="accent-blue-600" disabled /></th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Employee Name</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Salary Structure</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">From Date</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Base</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                                    <span>Loading assignments...</span>
                                </div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-16 text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                                        <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    <span className="text-base">{hasActiveFilters ? 'No records match your filters' : 'No assignments found'}</span>
                                    {hasActiveFilters && <button className="text-blue-600 hover:underline text-sm" onClick={clearFilters}>Clear Filters</button>}
                                </div>
                            </td></tr>
                        ) : (
                            filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(row)}>
                                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" className="accent-blue-600" />
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 font-medium hover:underline">{row.name}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.employee}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.employee_name}</td>
                                    <td className="px-4 py-3 text-gray-700">{row.salary_structure}</td>
                                    <td className="px-4 py-3 text-gray-500">{row.from_date}</td>
                                    <td className="px-4 py-3 text-gray-700 font-medium">
                                        {row.base != null ? `₹${Number(row.base).toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusLabel(row) === 'Submitted' ? 'bg-blue-50 text-blue-700' :
                                            getStatusLabel(row) === 'Cancelled' ? 'bg-red-50 text-red-700' :
                                                'bg-orange-50 text-orange-700'
                                            }`}>{getStatusLabel(row)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="text-blue-500 hover:text-blue-700 text-xs mr-3"
                                            onClick={() => handleEdit(row)}>
                                            Edit
                                        </button>
                                        {row.docstatus === 0 && (
                                            <button
                                                className="text-red-400 hover:text-red-600 text-xs"
                                                onClick={() => handleDelete(row)}>
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer row count */}
                {!loading && data.length > 0 && (
                    <div className="border-t px-4 py-3 text-xs text-gray-400 flex justify-between">
                        <span>Showing {filtered.length} of {data.length} records</span>
                        {hasActiveFilters && <span className="text-blue-500">{data.length - filtered.length} filtered out</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
