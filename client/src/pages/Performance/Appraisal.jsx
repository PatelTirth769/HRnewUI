import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const RESOURCE = 'Appraisal';
const API_BASE = `/api/resource/${RESOURCE}`;

// ─── Star Rating Component ──────────────────────────────────────────
function StarRating({ value = 0, max = 5, editable = false, onChange }) {
    const rounded = Math.round(value * 2) / 2;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => {
                const filled = rounded >= i + 1;
                const half = !filled && rounded >= i + 0.5;
                return (
                    <button key={i} type="button" disabled={!editable}
                        className={`text-lg ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition relative`}
                        style={{ color: filled || half ? '#F5A623' : '#D1D5DB', width: '1.1em', textAlign: 'center' }}
                        onClick={() => editable && onChange?.(i + 1)}>
                        <span>☆</span>
                        {filled && <span style={{ position: 'absolute', left: 0, top: 0, color: '#F5A623' }}>★</span>}
                        {half && <span style={{ position: 'absolute', left: 0, top: 0, color: '#F5A623', overflow: 'hidden', width: '0.55em', display: 'inline-block' }}>★</span>}
                    </button>
                );
            })}
            {value > 0 && <span className="text-sm text-gray-500 ml-1">({parseFloat(value).toFixed(1)})</span>}
        </div>
    );
}

export default function Appraisal() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [formTab, setFormTab] = useState('overview');
    const [feedbackReviews, setFeedbackReviews] = useState([]);

    // Master data
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [kras, setKras] = useState([]);
    const [criteria, setCriteria] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    const defaultForm = {
        naming_series: 'HR-APR-.YYYY.-',
        employee: '', employee_name: '', department: '', designation: '',
        company: '', status: 'Draft',
        appraisal_cycle: '', start_date: '', end_date: '',
        appraisal_template: '', rate_goals_manually: 0,
        appraisal_kra: [], goals: [],
        total_score: 0, final_score: 0, avg_feedback_score: 0, goal_score_percentage: 0,
        self_ratings: [], self_score: 0, reflections: '',
        remarks: '',
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ───────────────────────────────────────────
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, compRes, cycleRes, tmplRes, kraRes, critRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None&order_by=employee_name asc'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Appraisal Cycle?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Appraisal Template?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/KRA?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Employee Feedback Criteria?fields=["name"]&limit_page_length=None'),
            ]);
            setEmployees(empRes.data?.data || []);
            setCompanies((compRes.data?.data || []).map(c => c.name));
            setCycles((cycleRes.data?.data || []).map(c => c.name));
            setTemplates((tmplRes.data?.data || []).map(t => t.name));
            setKras((kraRes.data?.data || []).map(k => k.name));
            setCriteria((critRes.data?.data || []).map(c => c.name));
            setMastersLoaded(true);
        } catch (err) { console.error('Error fetching masters:', err); }
    };

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${API_BASE}?fields=["name","employee","employee_name","status","appraisal_cycle","final_score","total_score","modified","appraisal_template"]&limit_page_length=None&order_by=modified desc`);
            if (res.data.data) setData(res.data.data);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Appraisals' });
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
            setFormData({
                naming_series: d.naming_series || 'HR-APR-.YYYY.-',
                employee: d.employee || '', employee_name: d.employee_name || '',
                department: d.department || '', designation: d.designation || '',
                company: d.company || '', status: d.status || 'Draft',
                appraisal_cycle: d.appraisal_cycle || '',
                start_date: d.start_date || '', end_date: d.end_date || '',
                appraisal_template: d.appraisal_template || '',
                rate_goals_manually: d.rate_goals_manually ?? 0,
                appraisal_kra: (d.appraisal_kra || []).map(r => ({
                    kra: r.kra || '', per_weightage: r.per_weightage || 0,
                    goal_completion: r.goal_completion || 0, goal_score: r.goal_score || 0,
                })),
                goals: (d.goals || []).map(r => ({
                    kra: r.kra || '', per_weightage: r.per_weightage || 0,
                    score: r.score || 0, score_earned: r.score_earned || 0,
                })),
                total_score: d.total_score || 0,
                final_score: d.final_score || 0,
                avg_feedback_score: d.avg_feedback_score || 0,
                goal_score_percentage: d.goal_score_percentage || 0,
                self_ratings: (d.self_ratings || []).map(r => ({
                    criteria: r.criteria || '', per_weightage: r.per_weightage || 0,
                    rating: r.rating || 0,
                })),
                self_score: d.self_score || 0,
                reflections: d.reflections || '',
                remarks: d.remarks || '',
            });
            // Fetch linked feedback reviews
            try {
                const fbRes = await API.get(`/api/resource/Employee Performance Feedback?filters=[["appraisal","=","${encodeURIComponent(name)}"]]&fields=["name","reviewer","reviewer_name","reviewer_designation","total_score","feedback","added_on","modified"]&limit_page_length=None`);
                setFeedbackReviews(fbRes.data?.data || []);
            } catch { setFeedbackReviews([]); }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load Appraisal details' });
        }
    };

    // ─── EMPLOYEE CHANGE → auto-fill ─────────────────────────────
    const handleEmployeeChange = async (empId) => {
        updateForm('employee', empId);
        if (!empId) return;
        try {
            const res = await API.get(`/api/resource/Employee/${encodeURIComponent(empId)}`);
            const emp = res.data.data;
            setFormData(prev => ({
                ...prev, employee: empId,
                employee_name: emp.employee_name || '',
                department: emp.department || '',
                designation: emp.designation || '',
                company: emp.company || prev.company,
            }));
        } catch { /* ignore */ }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase()) && !(d.employee_name || '').toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterStatus && d.status !== filterStatus) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setFormTab('overview'); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setFormTab('overview'); setView('form'); await fetchSingle(record.name); };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.employee?.trim()) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.company?.trim()) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.appraisal_cycle?.trim()) { notification.warning({ message: 'Appraisal Cycle is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                naming_series: formData.naming_series,
                employee: formData.employee,
                company: formData.company,
                status: formData.status,
                appraisal_cycle: formData.appraisal_cycle,
                appraisal_template: formData.appraisal_template,
                rate_goals_manually: formData.rate_goals_manually,
                appraisal_kra: formData.appraisal_kra.map(r => ({
                    kra: r.kra, per_weightage: parseFloat(r.per_weightage) || 0,
                    goal_completion: parseFloat(r.goal_completion) || 0,
                    goal_score: parseFloat(r.goal_score) || 0,
                })),
                goals: formData.goals.map(r => ({
                    kra: r.kra, per_weightage: parseFloat(r.per_weightage) || 0,
                    score: parseFloat(r.score) || 0,
                    score_earned: parseFloat(r.score_earned) || 0,
                })),
                self_ratings: formData.self_ratings.map(r => ({
                    criteria: r.criteria, per_weightage: parseFloat(r.per_weightage) || 0,
                    rating: parseFloat(r.rating) || 0,
                })),
                reflections: formData.reflections,
                remarks: formData.remarks,
            };

            if (editingRecord) {
                await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post(API_BASE, payload);
                notification.success({ message: 'Appraisal created successfully!' });
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
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await API.delete(`${API_BASE}/${encodeURIComponent(name)}`);
            notification.success({ message: `"${name}" deleted successfully!` });
            if (view === 'form') setView('list');
            else fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 d';
        return `${diffDays} d`;
    };

    const statusColor = (s) => {
        if (s === 'Draft') return 'bg-red-50 text-red-600';
        if (s === 'Submitted') return 'bg-blue-50 text-blue-700';
        if (s === 'Completed') return 'bg-green-50 text-green-700';
        if (s === 'Cancelled') return 'bg-gray-100 text-gray-500';
        return 'bg-gray-50 text-gray-600';
    };

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        const tabList = [
            { key: 'overview', label: 'Overview' },
            { key: 'kras', label: 'KRAs' },
            { key: 'feedback', label: 'Feedback' },
            { key: 'self_appraisal', label: 'Self Appraisal' },
        ];

        // Compute KRA max scores for chart
        const kraChartData = formData.appraisal_kra.filter(r => r.kra);

        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord.name : 'New Appraisal'}</span>
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
                        {/* ── Tab: Overview ────────────────────────────────── */}
                        {formTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                    {/* Employee */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Employee <span className="text-red-400">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.employee} onChange={(e) => handleEmployeeChange(e.target.value)}>
                                            <option value="">Select Employee...</option>
                                            {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                        </select>
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
                                    {/* Employee Name (read-only) */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Employee Name</label>
                                        <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">{formData.employee_name || '—'}</div>
                                    </div>
                                    {/* Status */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Status <span className="text-red-400">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.status} onChange={(e) => updateForm('status', e.target.value)}>
                                            {['Draft', 'Submitted', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    {/* Department (read-only) */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Department</label>
                                        <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">{formData.department || '—'}</div>
                                    </div>
                                    {/* Appraisal Cycle */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Appraisal Cycle <span className="text-red-400">*</span></label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.appraisal_cycle} onChange={(e) => updateForm('appraisal_cycle', e.target.value)}>
                                            <option value="">Select Appraisal Cycle...</option>
                                            {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    {/* Designation (read-only) */}
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Designation</label>
                                        <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">{formData.designation || '—'}</div>
                                    </div>
                                </div>

                                {/* Final Score section */}
                                <hr className="border-gray-100" />
                                <div className="max-w-md">
                                    <label className="block text-[13px] text-gray-500 mb-1">Final Score</label>
                                    <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 font-medium">{formData.final_score || 0}</div>
                                    <p className="text-[11px] text-gray-400 mt-1">Average of Goal Score, Feedback Score, and Self Appraisal Score (out of 5)</p>
                                </div>
                            </div>
                        )}

                        {/* ── Tab: KRAs ──────────────────────────────────── */}
                        {formTab === 'kras' && (
                            <div className="space-y-6">
                                {/* KRA Score Chart (only in edit mode with data) */}
                                {editingRecord && kraChartData.length > 0 && (
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-3">Scores</label>
                                        <div className="flex items-end gap-8 h-40 px-4 pb-2 border border-gray-100 rounded-lg bg-gray-50/50">
                                            {kraChartData.map((row, idx) => {
                                                const maxScore = parseFloat(row.per_weightage) || 0;
                                                const scored = parseFloat(row.goal_score) || 0;
                                                const maxH = 120;
                                                const h1 = maxScore > 0 ? (maxScore / 100) * maxH : 5;
                                                const h2 = scored > 0 ? (scored / 100) * maxH : 0;
                                                return (
                                                    <div key={idx} className="flex flex-col items-center gap-1">
                                                        <div className="flex items-end gap-1" style={{ height: maxH + 'px' }}>
                                                            <div className="w-8 bg-blue-500 rounded-t" style={{ height: h1 + 'px' }} title={`Max: ${maxScore}%`} />
                                                            {h2 > 0 && <div className="w-8 bg-green-500 rounded-t" style={{ height: h2 + 'px' }} title={`Scored: ${scored}`} />}
                                                        </div>
                                                        <span className="text-[11px] text-gray-500 text-center max-w-20 truncate">{row.kra}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-6 mt-2">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" /> Maximum Score</span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" /> Score Obtained</span>
                                        </div>
                                    </div>
                                )}

                                <hr className="border-gray-100" />

                                {/* Appraisal Template + Rate Goals */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Appraisal Template</label>
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.appraisal_template} onChange={(e) => updateForm('appraisal_template', e.target.value)}>
                                            <option value="">Select Template...</option>
                                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600"
                                                checked={!!formData.rate_goals_manually}
                                                onChange={(e) => updateForm('rate_goals_manually', e.target.checked ? 1 : 0)} />
                                            Rate Goals Manually
                                        </label>
                                    </div>
                                </div>

                                {/* KRA vs Goals Table */}
                                <h3 className="font-semibold text-gray-800 text-sm pt-2">KRA vs Goals</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                            <tr>
                                                <th className="px-3 py-2.5 text-left w-12">No.</th>
                                                <th className="px-3 py-2.5 text-left">KRA <span className="text-red-400">*</span></th>
                                                <th className="px-3 py-2.5 text-right w-32">Weightage (%) <span className="text-red-400">*</span></th>
                                                <th className="px-3 py-2.5 text-right w-36">Goal Completion (%)</th>
                                                <th className="px-3 py-2.5 text-right w-40">Goal Score (weighted)</th>
                                                <th className="px-3 py-2.5 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.appraisal_kra.length === 0 ? (
                                                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No Data</td></tr>
                                            ) : formData.appraisal_kra.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={row.kra || ''} onChange={(e) => { const u = [...formData.appraisal_kra]; u[idx] = { ...u[idx], kra: e.target.value }; updateForm('appraisal_kra', u); }}>
                                                            <option value="" disabled>Select KRA...</option>
                                                            {kras.map(k => <option key={k} value={k}>{k}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input type="number" className="w-full text-right border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                            value={row.per_weightage || ''} onChange={(e) => { const u = [...formData.appraisal_kra]; u[idx] = { ...u[idx], per_weightage: e.target.value }; updateForm('appraisal_kra', u); }} />
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input type="number" className="w-full text-right border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                                                            value={row.goal_completion || ''} onChange={(e) => { const u = [...formData.appraisal_kra]; u[idx] = { ...u[idx], goal_completion: e.target.value }; updateForm('appraisal_kra', u); }} />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-gray-600">{parseFloat(row.goal_score || 0).toFixed(2)}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition" onClick={() => updateForm('appraisal_kra', formData.appraisal_kra.filter((_, i) => i !== idx))}>✕</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition"
                                    onClick={() => updateForm('appraisal_kra', [...formData.appraisal_kra, { kra: '', per_weightage: '', goal_completion: '', goal_score: 0 }])}>
                                    Add Row
                                </button>

                                <hr className="border-gray-100" />
                                <div className="max-w-md">
                                    <label className="block text-[13px] text-gray-500 mb-1">Total Goal Score</label>
                                    <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 font-medium">{formData.total_score || 0}</div>
                                    <p className="text-[11px] text-gray-400 mt-1">Out of 5</p>
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Feedback ──────────────────────────────── */}
                        {formTab === 'feedback' && (() => {
                            const avgScore = formData.avg_feedback_score || 0;
                            const totalReviews = feedbackReviews.length;
                            // Calculate star distribution
                            const starCounts = [0, 0, 0, 0, 0];
                            feedbackReviews.forEach(fb => {
                                const s = Math.floor(fb.total_score || 0);
                                if (s >= 1 && s <= 5) starCounts[s - 1]++;
                            });
                            return (
                                <div className="space-y-6">
                                    {/* Average Rating + Star Distribution */}
                                    <div className="flex items-start gap-10">
                                        <div className="text-center min-w-[120px]">
                                            <p className="text-[13px] text-gray-500 mb-1">Average Rating</p>
                                            <p className="text-5xl font-bold text-gray-900">{avgScore ? avgScore.toFixed(1) : '0.0'}</p>
                                            <div className="mt-1"><StarRating value={avgScore} /></div>
                                            <p className="text-[12px] text-gray-400 mt-1">based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex-1 space-y-1.5 pt-4">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = starCounts[star - 1];
                                                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-500 w-8 flex items-center gap-0.5">☆ {star}</span>
                                                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                            <div className="bg-gray-600 h-full rounded-full transition-all" style={{ width: pct + '%' }} />
                                                        </div>
                                                        <span className="text-gray-500 text-[12px] w-10 text-right">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Individual Feedback Cards */}
                                    {feedbackReviews.length > 0 && (
                                        <div className="space-y-4 pt-2">
                                            {feedbackReviews.map((fb, idx) => {
                                                const initials = (fb.reviewer_name || 'U')[0].toUpperCase();
                                                const timeAgo = formatRelativeTime(fb.added_on || fb.modified);
                                                return (
                                                    <div key={idx} className="border border-gray-100 rounded-lg p-5 bg-white shadow-sm">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-semibold">{initials}</div>
                                                                <div>
                                                                    <p className="font-semibold text-sm text-gray-900">{fb.reviewer_name || 'Unknown'}</p>
                                                                    <p className="text-[12px] text-gray-500">{fb.reviewer_designation || ''}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <StarRating value={fb.total_score || 0} />
                                                                <span className="text-[12px] text-gray-400">{timeAgo} ago</span>
                                                            </div>
                                                        </div>
                                                        {fb.feedback && (
                                                            <div className="mt-3 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: fb.feedback }} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {feedbackReviews.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-sm">No feedback reviews found for this appraisal.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ── Tab: Self Appraisal ───────────────────────── */}
                        {formTab === 'self_appraisal' && (
                            <div className="space-y-6">
                                <h3 className="font-semibold text-gray-800 text-sm">Ratings</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                            <tr>
                                                <th className="px-3 py-2.5 text-left w-12">No.</th>
                                                <th className="px-3 py-2.5 text-left">Criteria <span className="text-red-400">*</span></th>
                                                <th className="px-3 py-2.5 text-right w-32">Weightage (%) <span className="text-red-400">*</span></th>
                                                <th className="px-3 py-2.5 text-center w-48">Rating</th>
                                                <th className="px-3 py-2.5 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.self_ratings.length === 0 ? (
                                                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No Data</td></tr>
                                            ) : formData.self_ratings.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={row.criteria || ''} onChange={(e) => { const u = [...formData.self_ratings]; u[idx] = { ...u[idx], criteria: e.target.value }; updateForm('self_ratings', u); }}>
                                                            <option value="" disabled>Select Criteria...</option>
                                                            {criteria.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-gray-600">{parseFloat(row.per_weightage || 0)}%</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <StarRating value={(parseFloat(row.rating) || 0) * 5} editable
                                                            onChange={(val) => { const u = [...formData.self_ratings]; u[idx] = { ...u[idx], rating: val / 5 }; updateForm('self_ratings', u); }} />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button className="text-gray-400 hover:text-red-500 transition" onClick={() => updateForm('self_ratings', formData.self_ratings.filter((_, i) => i !== idx))}>✕</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition"
                                    onClick={() => updateForm('self_ratings', [...formData.self_ratings, { criteria: '', per_weightage: '', rating: 0 }])}>
                                    Add Row
                                </button>

                                {/* Total Self Score */}
                                <div className="max-w-md">
                                    <label className="block text-[13px] text-gray-500 mb-1">Total Self Score</label>
                                    <div className="w-full border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 font-medium">{formData.self_score || 0}</div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Reflections */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Reflections</h3>
                                    {editingRecord && formData.reflections && formData.reflections.includes('<') ? (
                                        <div className="w-full border border-gray-200 rounded px-4 py-3 text-sm bg-white min-h-[100px] prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: formData.reflections }} />
                                    ) : (
                                        <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[150px] bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.reflections} onChange={(e) => updateForm('reflections', e.target.value)} placeholder="Enter your reflections..." />
                                    )}
                                </div>
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
                <h1 className="text-2xl font-semibold text-gray-800">Appraisal</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Appraisal
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search ID / Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {['Draft', 'Submitted', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
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
                        Loading from ERPNext...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No Appraisals found</p>
                        <p className="text-sm">Click "+ Add Appraisal" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Appraisal Cycle</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Final Score</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">Total Goal Score</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{row.employee_name || row.employee || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${statusColor(row.status)}`}>{row.status}</span>
                                    </td>
                                    <td className="px-4 py-3">{row.appraisal_cycle || '-'}</td>
                                    <td className="px-4 py-3 text-right">{row.final_score?.toFixed(3) ?? '0.000'}</td>
                                    <td className="px-4 py-3 text-right">{row.total_score?.toFixed(3) ?? '0.000'}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                            {row.name?.length > 15 ? row.name.substring(0, 15) + '...' : row.name}
                                        </button>
                                    </td>
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
                    <span>Total: {data.length} Appraisals (Showing {filtered.length})</span>
                    <span>Source: ERPNext → {API_BASE}</span>
                </div>
            )}
        </div>
    );
}
