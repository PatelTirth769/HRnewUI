import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function SalaryStructure() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [formTab, setFormTab] = useState('details');
    const [connectionsOpen, setConnectionsOpen] = useState(true);
    const [connections, setConnections] = useState({ salary_structure_assignment: 0, salary_slip: 0, employee_grade: 0 });

    const defaultForm = {
        name: '',
        company: '',
        letter_head: '',
        is_active: 'Yes',
        currency: 'INR',
        amended_from: '',
        leave_encashment_amount_per_day: '',
        max_benefits: '',
        salary_slip_based_on_timesheet: 0,
        salary_component: '',
        hour_rate: '',
        payroll_frequency: 'Monthly',
        mode_of_payment: '',
        payment_account: '',
        total_earning: 0,
        total_deduction: 0,
        net_pay: 0,
        earnings: [],
        deductions: [],
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Salary Structure?fields=["name","company","is_active","docstatus","modified"]&limit_page_length=None&order_by=modified desc');
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Salary Structures' });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // ─── FETCH SINGLE ─────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Salary Structure/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                name: d.name || '',
                company: d.company || '',
                letter_head: d.letter_head || '',
                is_active: d.is_active || 'Yes',
                currency: d.currency || 'INR',
                amended_from: d.amended_from || '',
                leave_encashment_amount_per_day: d.leave_encashment_amount_per_day ?? '',
                max_benefits: d.max_benefits ?? '',
                salary_slip_based_on_timesheet: d.salary_slip_based_on_timesheet ?? 0,
                salary_component: d.salary_component || '',
                hour_rate: d.hour_rate ?? '',
                payroll_frequency: d.payroll_frequency || 'Monthly',
                mode_of_payment: d.mode_of_payment || '',
                payment_account: d.payment_account || '',
                total_earning: d.total_earning ?? 0,
                total_deduction: d.total_deduction ?? 0,
                net_pay: d.net_pay ?? 0,
                earnings: (d.earnings || []).map(row => ({
                    salary_component: row.salary_component || '',
                    abbr: row.abbr || '',
                    amount: row.amount ?? 0,
                    depends_on_payment_days: row.depends_on_payment_days ?? 1,
                    is_tax_applicable: row.is_tax_applicable ?? 0,
                    amount_based_on_formula: row.amount_based_on_formula ?? 0,
                    formula: row.formula || '',
                    statistical_component: row.statistical_component ?? 0,
                    do_not_include_in_total: row.do_not_include_in_total ?? 0,
                    condition: row.condition || '',
                })),
                deductions: (d.deductions || []).map(row => ({
                    salary_component: row.salary_component || '',
                    abbr: row.abbr || '',
                    amount: row.amount ?? 0,
                    depends_on_payment_days: row.depends_on_payment_days ?? 1,
                    is_tax_applicable: row.is_tax_applicable ?? 0,
                    amount_based_on_formula: row.amount_based_on_formula ?? 0,
                    formula: row.formula || '',
                    statistical_component: row.statistical_component ?? 0,
                    do_not_include_in_total: row.do_not_include_in_total ?? 0,
                    condition: row.condition || '',
                })),
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Salary Structure details' });
        }
    };

    // ─── STATUS HELPER ────────────────────────────────────────────
    const getStatusLabel = (d) => {
        if (d.docstatus === 0) return 'Draft';
        if (d.docstatus === 1) return 'Submitted';
        if (d.docstatus === 2) return 'Cancelled';
        return 'Draft';
    };

    // ─── FILTERS ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterStatus && getStatusLabel(d) !== filterStatus) return false;
        if (filterActive === 'Yes' && d.is_active !== 'Yes') return false;
        if (filterActive === 'No' && d.is_active !== 'No') return false;
        return true;
    });
    const hasActiveFilters = searchId || filterStatus || filterActive;
    const clearFilters = () => { setSearchId(''); setFilterStatus(''); setFilterActive(''); };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setFormTab('details');
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setFormTab('details');
        setView('form');
        await fetchSingle(record.name);
        fetchConnections(record.name);
    };

    // ─── FETCH CONNECTIONS (linked docs) ──────────────────────────
    const fetchConnections = async (name) => {
        const encoded = encodeURIComponent(name);
        try {
            const [ssaRes, slipRes, gradeRes] = await Promise.all([
                API.get(`/api/method/frappe.client.get_count?doctype=Salary Structure Assignment&filters={"salary_structure":"${name}"}`).catch(() => ({ data: { message: 0 } })),
                API.get(`/api/method/frappe.client.get_count?doctype=Salary Slip&filters={"salary_structure":"${name}"}`).catch(() => ({ data: { message: 0 } })),
                API.get(`/api/method/frappe.client.get_count?doctype=Employee Grade&filters={"default_salary_structure":"${name}"}`).catch(() => ({ data: { message: 0 } })),
            ]);
            setConnections({
                salary_structure_assignment: ssaRes?.data?.message || 0,
                salary_slip: slipRes?.data?.message || 0,
                employee_grade: gradeRes?.data?.message || 0,
            });
        } catch { setConnections({ salary_structure_assignment: 0, salary_slip: 0, employee_grade: 0 }); }
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.company.trim()) {
            notification.warning({ message: 'Company is required' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                company: formData.company,
                letter_head: formData.letter_head,
                is_active: formData.is_active,
                currency: formData.currency,
                leave_encashment_amount_per_day: formData.leave_encashment_amount_per_day ? parseFloat(formData.leave_encashment_amount_per_day) : 0,
                max_benefits: formData.max_benefits ? parseFloat(formData.max_benefits) : 0,
                salary_slip_based_on_timesheet: formData.salary_slip_based_on_timesheet,
                salary_component: formData.salary_component,
                hour_rate: formData.hour_rate ? parseFloat(formData.hour_rate) : 0,
                payroll_frequency: formData.payroll_frequency,
                mode_of_payment: formData.mode_of_payment,
                payment_account: formData.payment_account,
                earnings: formData.earnings.filter(e => e.salary_component).map(e => ({
                    salary_component: e.salary_component,
                    abbr: e.abbr,
                    amount: e.amount ? parseFloat(e.amount) : 0,
                    depends_on_payment_days: e.depends_on_payment_days,
                    is_tax_applicable: e.is_tax_applicable,
                    amount_based_on_formula: e.amount_based_on_formula,
                    formula: e.formula,
                    statistical_component: e.statistical_component,
                    do_not_include_in_total: e.do_not_include_in_total,
                    condition: e.condition,
                })),
                deductions: formData.deductions.filter(e => e.salary_component).map(e => ({
                    salary_component: e.salary_component,
                    abbr: e.abbr,
                    amount: e.amount ? parseFloat(e.amount) : 0,
                    depends_on_payment_days: e.depends_on_payment_days,
                    is_tax_applicable: e.is_tax_applicable,
                    amount_based_on_formula: e.amount_based_on_formula,
                    formula: e.formula,
                    statistical_component: e.statistical_component,
                    do_not_include_in_total: e.do_not_include_in_total,
                    condition: e.condition,
                })),
            };

            if (editingRecord) {
                await API.put(`/api/resource/Salary Structure/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const createPayload = formData.name.trim() ? { name: formData.name, ...payload } : payload;
                const res = await API.post('/api/resource/Salary Structure', createPayload);
                const newName = res.data?.data?.name || formData.name || 'New record';
                notification.success({ message: `"${newName}" created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* noop */ }
            }
            notification.error({ message: editingRecord ? 'Update Failed' : 'Create Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Salary Structure/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* noop */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const updateChildRow = (table, idx, field, value) => {
        const updated = [...formData[table]];
        updated[idx] = { ...updated[idx], [field]: value };
        updateForm(table, updated);
    };

    const addChildRow = (table) => {
        updateForm(table, [...formData[table], {
            salary_component: '', abbr: '', amount: 0, depends_on_payment_days: 1,
            is_tax_applicable: 0, amount_based_on_formula: 0, formula: '',
            statistical_component: 0, do_not_include_in_total: 0, condition: '',
        }]);
    };

    const removeChildRow = (table, idx) => {
        updateForm(table, formData[table].filter((_, i) => i !== idx));
    };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        const tabs = [
            { key: 'details', label: 'Details' },
            { key: 'earnings_deductions', label: 'Earnings & Deductions' },
            { key: 'account', label: 'Account' },
        ];

        // ── Earnings / Deductions child table ──
        const ChildTable = ({ title, table }) => (
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
                <div className="border border-gray-200 rounded overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="w-8 px-3 py-2.5"><input type="checkbox" className="accent-blue-600" disabled /></th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-10">No.</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">Component <span className="text-red-500">*</span></th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-20">Abbr</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-28">Amount (INR)</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-24">Depends on...</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-24">Is Tax Appli...</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-24">Amount bas...</th>
                                <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-32">Formula</th>
                                <th className="w-8 px-3 py-2.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData[table].length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-10 text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                                            </svg>
                                            <span className="text-sm">No Data</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                formData[table].map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-2 text-center">
                                            <input type="checkbox" className="accent-blue-600" />
                                        </td>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-3 py-2">
                                            <input type="text"
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                value={row.salary_component}
                                                onChange={(e) => updateChildRow(table, idx, 'salary_component', e.target.value)}
                                                placeholder="e.g. Basic Pay" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="text"
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                                                value={row.abbr}
                                                onChange={(e) => updateChildRow(table, idx, 'abbr', e.target.value)}
                                                placeholder="Abbr" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number"
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                value={row.amount}
                                                onChange={(e) => updateChildRow(table, idx, 'amount', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <input type="checkbox" className="accent-blue-600"
                                                checked={!!row.depends_on_payment_days}
                                                onChange={(e) => updateChildRow(table, idx, 'depends_on_payment_days', e.target.checked ? 1 : 0)} />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <input type="checkbox" className="accent-blue-600"
                                                checked={!!row.is_tax_applicable}
                                                onChange={(e) => updateChildRow(table, idx, 'is_tax_applicable', e.target.checked ? 1 : 0)} />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <input type="checkbox" className="accent-blue-600"
                                                checked={!!row.amount_based_on_formula}
                                                onChange={(e) => updateChildRow(table, idx, 'amount_based_on_formula', e.target.checked ? 1 : 0)} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="text"
                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
                                                value={row.formula}
                                                onChange={(e) => updateChildRow(table, idx, 'formula', e.target.value)}
                                                placeholder="e.g. base * 0.4"
                                                disabled={!row.amount_based_on_formula} />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button className="text-red-400 hover:text-red-600 text-sm"
                                                onClick={() => removeChildRow(table, idx)} title="Delete row">✕</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <button
                    className="mt-3 px-4 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => addChildRow(table)}>
                    Add Row
                </button>
            </div>
        );

        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>☰</button>
                        <h1 className="text-lg font-bold text-gray-900">
                            {editingRecord ? editingRecord.name : 'New Salary Structure'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusLabel(editingRecord) === 'Submitted' ? 'bg-blue-50 text-blue-600' :
                                getStatusLabel(editingRecord) === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                    'bg-orange-50 text-orange-600'
                                }`}>{getStatusLabel(editingRecord)}</span>
                            : <span className="text-xs font-medium text-red-500">Not Saved</span>
                        }
                    </div>
                    <button
                        className="px-6 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
                        onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex border-b">
                        {tabs.map(t => (
                            <button key={t.key}
                                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${formTab === t.key
                                    ? 'border-gray-800 text-gray-800'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setFormTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* ═════ TAB: DETAILS ═════ */}
                        {formTab === 'details' && (
                            <>
                                {/* ── Connections section (edit mode only) ── */}
                                {editingRecord && (
                                    <div className="mb-6">
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
                                                {connections.salary_structure_assignment > 0 && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200">
                                                        <span className="font-medium">{connections.salary_structure_assignment}</span>
                                                        Salary Structure Assignment
                                                        <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200">
                                                    {connections.employee_grade > 0 && <span className="font-medium">{connections.employee_grade}</span>}
                                                    Employee Grade
                                                    <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                                </span>
                                                {connections.salary_slip > 0 && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200">
                                                        <span className="font-medium">{connections.salary_slip}</span>
                                                        Salary Slip
                                                        <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <hr className="mt-4 border-gray-200" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8">
                                    {/* Left Column */}
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${editingRecord ? 'bg-gray-50 border-gray-200 text-gray-500' : 'border-orange-300 bg-orange-50'}`}
                                            value={formData.name}
                                            onChange={(e) => updateForm('name', e.target.value)}
                                            readOnly={!!editingRecord}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Is Active <span className="text-red-500">*</span></label>
                                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                            value={formData.is_active} onChange={(e) => updateForm('is_active', e.target.value)}>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                            value={formData.company}
                                            onChange={(e) => updateForm('company', e.target.value)}
                                            placeholder="e.g. Preeshe Consultancy Services"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Currency <span className="text-red-500">*</span></label>
                                        <input type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                            value={formData.currency}
                                            onChange={(e) => updateForm('currency', e.target.value)}
                                            placeholder="INR"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Letter Head</label>
                                        <input type="text"
                                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                            value={formData.letter_head}
                                            onChange={(e) => updateForm('letter_head', e.target.value)}
                                        />
                                    </div>
                                    <div>{/* spacer for left col alignment */}</div>
                                    {formData.amended_from && (
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Amended From</label>
                                            <input type="text"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-blue-600 cursor-pointer focus:outline-none"
                                                value={formData.amended_from}
                                                readOnly
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Second section - separated by line */}
                                <div className="border-t border-gray-200 pt-5">
                                    <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Leave Encashment Amount Per Day (INR)</label>
                                            <input type="number"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                                value={formData.leave_encashment_amount_per_day}
                                                onChange={(e) => updateForm('leave_encashment_amount_per_day', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 cursor-pointer py-1 mt-5">
                                                <input type="checkbox" className="accent-blue-600"
                                                    checked={!!formData.salary_slip_based_on_timesheet}
                                                    onChange={(e) => updateForm('salary_slip_based_on_timesheet', e.target.checked ? 1 : 0)} />
                                                <span className="text-sm text-gray-700">Salary Slip Based on Timesheet</span>
                                            </label>
                                        </div>
                                        {!!formData.salary_slip_based_on_timesheet && (
                                            <>
                                                <div className="col-span-2"></div>
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Salary Component <span className="text-red-500">*</span></label>
                                                    <input type="text"
                                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                                        value={formData.salary_component}
                                                        onChange={(e) => updateForm('salary_component', e.target.value)}
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Salary Component for timesheet based payroll.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-600 mb-1">Hour Rate (INR) <span className="text-red-500">*</span></label>
                                                    <input type="number"
                                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                                        value={formData.hour_rate}
                                                        onChange={(e) => updateForm('hour_rate', e.target.value)}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Max Benefits (INR)</label>
                                            <input type="number"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                                value={formData.max_benefits}
                                                onChange={(e) => updateForm('max_benefits', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Payroll Frequency <span className="text-red-500">*</span></label>
                                            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                                                value={formData.payroll_frequency} onChange={(e) => updateForm('payroll_frequency', e.target.value)}>
                                                <option value="Monthly">Monthly</option>
                                                <option value="Fortnightly">Fortnightly</option>
                                                <option value="Bimonthly">Bimonthly</option>
                                                <option value="Weekly">Weekly</option>
                                                <option value="Daily">Daily</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ═════ TAB: EARNINGS & DEDUCTIONS ═════ */}
                        {formTab === 'earnings_deductions' && (
                            <>
                                <ChildTable title="Earnings" table="earnings" />
                                <ChildTable title="Deductions" table="deductions" />
                                <p className="text-xs text-gray-400 italic mt-4 border-t pt-3">Condition and Formula Help</p>
                            </>
                        )}

                        {/* ═════ TAB: ACCOUNT ═════ */}
                        {formTab === 'account' && (
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Mode of Payment</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.mode_of_payment}
                                        onChange={(e) => updateForm('mode_of_payment', e.target.value)}
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Payment Account</label>
                                    <input type="text"
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.payment_account}
                                        onChange={(e) => updateForm('payment_account', e.target.value)}
                                        placeholder=""
                                    />
                                </div>
                            </div>
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Structure</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200"
                        onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        onClick={handleNew}>
                        + Add Salary Structure
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                    placeholder="ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm"
                    value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
                    <option value="">Is Active</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
                {hasActiveFilters && (
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                            Filters {[searchId, filterStatus, filterActive].filter(Boolean).length}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={clearFilters}>✕</button>
                    </div>
                )}
                <div className="ml-auto text-xs text-gray-400">
                    {filtered.length} of {data.length}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading from ERPNext...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg mb-2">No salary structures found</p>
                        <p className="text-sm">Click "+ Add Salary Structure" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="w-8 px-4 py-3"><input type="checkbox" className="accent-blue-600" disabled /></th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Is Active</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Last Updated On</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => {
                                const status = getStatusLabel(row);
                                const td = row.modified ? getTimeDiff(row.modified) : '';
                                return (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleEdit(row)}>
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="accent-blue-600" />
                                        </td>
                                        <td className="px-4 py-3 text-blue-600 font-medium">{row.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${status === 'Submitted' ? 'bg-blue-50 text-blue-600' :
                                                status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                                    'bg-orange-50 text-orange-600'
                                                }`}>{status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1.5 text-xs ${row.is_active === 'Yes' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <span className={`w-2 h-2 rounded-full inline-block ${row.is_active === 'Yes' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                {row.is_active === 'Yes' ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-400 text-xs">{td}</td>
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-blue-600 hover:underline text-xs mr-3"
                                                onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-600 hover:underline text-xs"
                                                onClick={() => handleDelete(row)}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            {!loading && filtered.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                    {[20, 100, 500, 2500].map(n => (
                        <button key={n} className="text-xs text-gray-400 hover:text-blue-600">{n}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Time diff helper ─────────────────────────────────────────────
function getTimeDiff(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}M`;
}
