import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const RESOURCE = 'Appraisal Cycle';
const API_BASE = `/api/resource/${encodeURIComponent(RESOURCE)}`;

export default function AppraisalCycle() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [formTab, setFormTab] = useState('overview');
    const [fetchingEmps, setFetchingEmps] = useState(false);

    // Stats & Connections (edit mode only)
    const [cycleStats, setCycleStats] = useState({ appraisees: 0, self_pending: 0, no_feedback: 0, no_goals: 0 });
    const [connections, setConnections] = useState({ appraisals: 0, feedbacks: 0, goals: 0 });

    // Master data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    const defaultForm = {
        cycle_name: '', company: '', status: 'Not Started',
        start_date: '', end_date: '', description: '',
        kra_evaluation_method: 'Automated Based on Goal Progress',
        calculate_final_score_based_on_formula: 0,
        final_score_formula: '',
        branch: '', department: '', designation: '',
        appraisees: [],
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ───────────────────────────────────────────
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [compRes, deptRes, desRes, brRes, empRes, tmplRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Branch?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Employee?fields=["name","employee_name","department","designation","branch"]&limit_page_length=None&order_by=employee_name asc'),
                API.get('/api/resource/Appraisal Template?fields=["name"]&limit_page_length=None'),
            ]);
            setCompanies((compRes.data?.data || []).map(c => c.name));
            setDepartments((deptRes.data?.data || []).map(d => d.name));
            setDesignations((desRes.data?.data || []).map(d => d.name));
            setBranches((brRes.data?.data || []).map(b => b.name));
            setEmployees(empRes.data?.data || []);
            setTemplates((tmplRes.data?.data || []).map(t => t.name));
            setMastersLoaded(true);
        } catch (err) { console.error('Masters fetch error:', err); }
    };

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${API_BASE}?fields=["name","company","status","start_date","end_date","kra_evaluation_method","modified"]&limit_page_length=None&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Appraisal Cycles' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
        else fetchMasters();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`${API_BASE}/${encodeURIComponent(name)}`);
            const d = res.data.data;
            const apprs = (d.appraisees || []).map(a => ({
                employee: a.employee || '', employee_name: a.employee_name || '',
                appraisal_template: a.appraisal_template || '',
                department: a.department || '', designation: a.designation || '', branch: a.branch || '',
            }));
            setFormData({
                cycle_name: d.cycle_name || '', company: d.company || '',
                status: d.status || 'Not Started',
                start_date: d.start_date || '', end_date: d.end_date || '',
                description: d.description || '',
                kra_evaluation_method: d.kra_evaluation_method || 'Automated Based on Goal Progress',
                calculate_final_score_based_on_formula: d.calculate_final_score_based_on_formula ?? 0,
                final_score_formula: d.final_score_formula || '',
                branch: d.branch || '', department: d.department || '', designation: d.designation || '',
                appraisees: apprs,
            });
            // Fetch linked stats and connections
            try {
                const eName = encodeURIComponent(name);
                const [apprRes, fbRes, goalRes] = await Promise.all([
                    API.get(`/api/resource/Appraisal?filters=[["appraisal_cycle","=","${eName}"]]&fields=["name","self_score"]&limit_page_length=None`),
                    API.get(`/api/resource/Employee Performance Feedback?filters=[["appraisal_cycle","=","${eName}"]]&fields=["name"]&limit_page_length=None`),
                    API.get(`/api/resource/Goal?filters=[["appraisal_cycle","=","${eName}"]]&fields=["name"]&limit_page_length=None`),
                ]);
                const appraisals = apprRes.data?.data || [];
                const feedbacks = fbRes.data?.data || [];
                const goals = goalRes.data?.data || [];
                const selfPending = appraisals.filter(a => !a.self_score || a.self_score === 0).length;
                const empWithFb = new Set(feedbacks.map(f => f.employee).filter(Boolean));
                const empWithGoals = new Set(goals.map(g => g.employee).filter(Boolean));
                const appraiseeEmps = apprs.map(a => a.employee);
                const noFb = appraiseeEmps.filter(e => !empWithFb.has(e)).length;
                const noGoals = appraiseeEmps.filter(e => !empWithGoals.has(e)).length;
                setCycleStats({ appraisees: apprs.length, self_pending: selfPending, no_feedback: noFb, no_goals: noGoals });
                setConnections({ appraisals: appraisals.length, feedbacks: feedbacks.length, goals: goals.length });
            } catch { /* stats are best-effort */ }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Appraisal Cycle details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterStatus && d.status !== filterStatus) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setFormTab('overview'); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setFormTab('overview'); setView('form'); await fetchSingle(record.name); };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.cycle_name?.trim()) { notification.warning({ message: 'Cycle Name is required' }); return; }
        if (!formData.company?.trim()) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.start_date) { notification.warning({ message: 'Start Date is required' }); return; }
        if (!formData.end_date) { notification.warning({ message: 'End Date is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                cycle_name: formData.cycle_name,
                company: formData.company,
                status: formData.status,
                start_date: formData.start_date,
                end_date: formData.end_date,
                description: formData.description,
                kra_evaluation_method: formData.kra_evaluation_method,
                calculate_final_score_based_on_formula: formData.calculate_final_score_based_on_formula,
                final_score_formula: formData.final_score_formula,
                branch: formData.branch,
                department: formData.department,
                designation: formData.designation,
                appraisees: formData.appraisees.map(a => ({
                    employee: a.employee, employee_name: a.employee_name,
                    appraisal_template: a.appraisal_template,
                    department: a.department, designation: a.designation, branch: a.branch,
                })),
            };

            if (editingRecord) {
                await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post(API_BASE, payload);
                notification.success({ message: 'Appraisal Cycle created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ───────────────────────────────────────────────────
    const handleDelete = async (name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await API.delete(`${API_BASE}/${encodeURIComponent(name)}`);
            notification.success({ message: `"${name}" deleted!` });
            if (view === 'form') setView('list'); else fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    // ─── EMPLOYEE SELECT AUTO-FILL ───────────────────────────────
    const handleAddAppraisee = (empId) => {
        if (!empId) return;
        const emp = employees.find(e => e.name === empId);
        if (!emp) return;
        if (formData.appraisees.some(a => a.employee === empId)) { notification.warning({ message: 'Employee already added' }); return; }
        updateForm('appraisees', [...formData.appraisees, {
            employee: emp.name, employee_name: emp.employee_name || '',
            appraisal_template: '', department: emp.department || '',
            designation: emp.designation || '', branch: emp.branch || '',
        }]);
    };

    // ─── GET EMPLOYEES (bulk add based on filters) ───────────────
    const handleGetEmployees = async () => {
        setFetchingEmps(true);
        try {
            let filters = [];
            if (formData.company) filters.push(`["company","=","${formData.company}"]`);
            if (formData.department) filters.push(`["department","=","${formData.department}"]`);
            if (formData.designation) filters.push(`["designation","=","${formData.designation}"]`);
            if (formData.branch) filters.push(`["branch","=","${formData.branch}"]`);
            filters.push(`["status","=","Active"]`);
            const filterStr = `[${filters.join(',')}]`;
            const res = await API.get(`/api/resource/Employee?filters=${filterStr}&fields=["name","employee_name","department","designation","branch"]&limit_page_length=None&order_by=employee_name asc`);
            const fetched = res.data?.data || [];
            const existing = new Set(formData.appraisees.map(a => a.employee));
            const newAppraisees = fetched.filter(e => !existing.has(e.name)).map(e => ({
                employee: e.name, employee_name: e.employee_name || '',
                appraisal_template: '', department: e.department || '',
                designation: e.designation || '', branch: e.branch || '',
            }));
            if (newAppraisees.length === 0) {
                notification.info({ message: 'No new employees found matching the filters' });
            } else {
                updateForm('appraisees', [...formData.appraisees, ...newAppraisees]);
                notification.success({ message: `Added ${newAppraisees.length} employee(s)` });
            }
        } catch (err) {
            console.error('Get employees failed:', err);
            notification.error({ message: 'Failed to fetch employees' });
        } finally { setFetchingEmps(false); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const formatRelativeTime = (ds) => {
        if (!ds) return '-';
        const diff = Math.floor((new Date() - new Date(ds)) / 86400000);
        return diff === 0 ? 'Today' : `${diff} d`;
    };
    const statusColor = (s) => {
        if (s === 'Not Started') return 'bg-red-50 text-red-600';
        if (s === 'In Progress') return 'bg-blue-50 text-blue-700';
        if (s === 'Completed') return 'bg-green-50 text-green-700';
        return 'bg-gray-50 text-gray-600';
    };

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        const tabList = [
            { key: 'overview', label: 'Overview' },
            { key: 'applicable_for', label: 'Applicable For' },
        ];

        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord.name : 'New Appraisal Cycle'}</span>
                        {!editingRecord ? (
                            <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-medium ${statusColor(formData.status)}`}>{formData.status}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        {editingRecord && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={() => handleDelete(editingRecord.name)}>Delete</button>
                        )}
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Stats Section (only when editing) */}
                {editingRecord && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Stats</h4>
                        <div className="flex items-center gap-8 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-sm text-gray-600">Appraisees: <strong>{cycleStats.appraisees}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-sm text-gray-600">Self Appraisal Pending: <strong>{cycleStats.self_pending}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-sm text-gray-600">Employees without Feedback: <strong>{cycleStats.no_feedback}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-sm text-gray-600">Employees without Goals: <strong>{cycleStats.no_goals}</strong></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connections Section (only when editing) */}
                {editingRecord && (connections.appraisals > 0 || connections.feedbacks > 0 || connections.goals > 0) && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Connections</h4>
                        <div className="flex items-center gap-4 flex-wrap">
                            {connections.appraisals > 0 && (
                                <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 flex items-center gap-1.5">
                                    <strong>{connections.appraisals}</strong> Appraisal
                                </span>
                            )}
                            {connections.feedbacks > 0 && (
                                <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 flex items-center gap-1.5">
                                    <strong>{connections.feedbacks}</strong> Employee Performance Feedback
                                </span>
                            )}
                            {connections.goals > 0 && (
                                <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 flex items-center gap-1.5">
                                    <strong>{connections.goals}</strong> Goal
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex gap-0 border-b border-gray-200">
                        {tabList.map(tab => (
                            <button key={tab.key}
                                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${formTab === tab.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setFormTab(tab.key)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* ── Tab: Overview ────────────────────────────── */}
                        {formTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                    {/* Cycle Name */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Cycle Name <span className="text-red-400">*</span></label>
                                        <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.cycle_name} onChange={(e) => updateForm('cycle_name', e.target.value)} placeholder="e.g. Annual Review 2026" />
                                    </div>
                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Start Date <span className="text-red-400">*</span></label>
                                        <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.start_date} onChange={(e) => updateForm('start_date', e.target.value)} />
                                    </div>
                                    {/* Company */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Company <span className="text-red-400">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.company} onChange={(e) => updateForm('company', e.target.value)}>
                                            <option value="">Select Company...</option>
                                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    {/* End Date */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">End Date <span className="text-red-400">*</span></label>
                                        <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.end_date} onChange={(e) => updateForm('end_date', e.target.value)} />
                                    </div>
                                    {/* Status */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Status</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.status} onChange={(e) => updateForm('status', e.target.value)}>
                                            {['Not Started', 'In Progress', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="max-w-4xl">
                                    <label className="block text-[13px] text-gray-500 mb-1">Description</label>
                                    <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[120px] bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Enter description..." />
                                </div>

                                <hr className="border-gray-100" />

                                {/* Settings Section */}
                                <h3 className="font-semibold text-gray-800 text-sm">Settings</h3>

                                <div className="max-w-xl space-y-5">
                                    {/* KRA Evaluation Method */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">KRA Evaluation Method</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.kra_evaluation_method} onChange={(e) => updateForm('kra_evaluation_method', e.target.value)}>
                                            <option value="Automated Based on Goal Progress">Automated Based on Goal Progress</option>
                                            <option value="Manual Rating">Manual Rating</option>
                                        </select>
                                    </div>

                                    {/* Calculate Final Score checkbox */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600"
                                                checked={!!formData.calculate_final_score_based_on_formula}
                                                onChange={(e) => updateForm('calculate_final_score_based_on_formula', e.target.checked ? 1 : 0)} />
                                            Calculate Final Score based on Formula
                                        </label>
                                        <p className="text-[11px] text-gray-400 mt-1 ml-6">
                                            By default, the Final Score is calculated as the average of Goal Score, Feedback Score, and Self Appraisal Score. Enable this to set a different formula.
                                        </p>
                                    </div>

                                    {/* Final Score Formula (shown when checkbox is checked) */}
                                    {!!formData.calculate_final_score_based_on_formula && (
                                        <div>
                                            <label className="block text-[13px] text-gray-500 mb-1">Final Score Formula <span className="text-red-400">*</span></label>
                                            <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[80px] bg-gray-900 text-green-400 font-mono focus:outline-none focus:border-blue-400"
                                                value={formData.final_score_formula} onChange={(e) => updateForm('final_score_formula', e.target.value)} placeholder="e.g. (goal_score + feedback_score + self_appraisal_score) / 3" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Applicable For ─────────────────────── */}
                        {formTab === 'applicable_for' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="grid grid-cols-3 gap-x-8 gap-y-5 max-w-4xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Department</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.department} onChange={(e) => updateForm('department', e.target.value)}>
                                            <option value="">All Departments</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Designation</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.designation} onChange={(e) => updateForm('designation', e.target.value)}>
                                            <option value="">All Designations</option>
                                            {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Branch</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.branch} onChange={(e) => updateForm('branch', e.target.value)}>
                                            <option value="">All Branches</option>
                                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                <p className="text-sm text-gray-500">Set optional filters to fetch employees in the appraisee list</p>

                                <hr className="border-gray-100" />

                                {/* Employees Section */}
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 text-sm">Employees</h3>
                                    <div className="flex items-center gap-2">
                                        <button className="px-4 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2"
                                            onClick={handleGetEmployees} disabled={fetchingEmps}>
                                            {fetchingEmps ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /> : null}
                                            Get Employees
                                        </button>
                                        <select className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value="" onChange={(e) => { handleAddAppraisee(e.target.value); e.target.value = ''; }}>
                                            <option value="">+ Add Employee...</option>
                                            {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                            <tr>
                                                <th className="px-3 py-2.5 text-left w-12">No.</th>
                                                <th className="px-3 py-2.5 text-left">Employee <span className="text-red-400">*</span></th>
                                                <th className="px-3 py-2.5 text-left">Employee Name</th>
                                                <th className="px-3 py-2.5 text-left">Appraisal Template</th>
                                                <th className="px-3 py-2.5 text-left">Department</th>
                                                <th className="px-3 py-2.5 text-left">Designation</th>
                                                <th className="px-3 py-2.5 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.appraisees.length === 0 ? (
                                                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No appraisees added. Use the dropdown above or "Add Employee" to add employees.</td></tr>
                                            ) : formData.appraisees.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5 text-blue-600 font-medium">{row.employee}</td>
                                                    <td className="px-3 py-2.5">{row.employee_name}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={row.appraisal_template || ''} onChange={(e) => {
                                                                const u = [...formData.appraisees]; u[idx] = { ...u[idx], appraisal_template: e.target.value }; updateForm('appraisees', u);
                                                            }}>
                                                            <option value="">Select Template...</option>
                                                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-600">{row.department || '-'}</td>
                                                    <td className="px-3 py-2.5 text-gray-600">{row.designation || '-'}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition" onClick={() => updateForm('appraisees', formData.appraisees.filter((_, i) => i !== idx))}>✕</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {formData.appraisees.length > 0 && (
                                    <p className="text-xs text-gray-400">{formData.appraisees.length} appraisee{formData.appraisees.length !== 1 ? 's' : ''} added</p>
                                )}
                            </div>
                        )}
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Appraisal Cycle</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Appraisal Cycle
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {['Not Started', 'In Progress', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(searchId || filterStatus) && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={() => { setSearchId(''); setFilterStatus(''); }}>✕ Clear</button>)}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No Appraisal Cycles found</p>
                        <p className="text-sm">Click "+ Add Appraisal Cycle" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Cycle Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">End Date</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">KRA Method</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                            {row.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">{row.company || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${statusColor(row.status)}`}>{row.status}</span>
                                    </td>
                                    <td className="px-4 py-3">{formatDate(row.start_date)}</td>
                                    <td className="px-4 py-3">{formatDate(row.end_date)}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{row.kra_evaluation_method || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)} ago</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                        <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row.name)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} (Showing {filtered.length})</span>
                    <span>Source: ERPNext → {API_BASE}</span>
                </div>
            )}
        </div>
    );
}
