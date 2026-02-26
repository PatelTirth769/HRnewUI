import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const RESOURCE = 'Employee Performance Feedback by HR';
const API_BASE = `/api/resource/${encodeURIComponent(RESOURCE)}`;

// ─── Star Rating Component ──────────────────────────────────────
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

export default function EmployeePerformanceFeedbackByHR() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchId, setSearchId] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [formTab, setFormTab] = useState('employee_details');

    // Master data
    const [employees, setEmployees] = useState([]);
    const [appraisals, setAppraisals] = useState([]);
    const [feedbackCriteria, setFeedbackCriteria] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    const defaultForm = {
        employee: '', employee_name: '', department: '', designation: '', company: '',
        reviewer: '', reviewer_name: '', reviewer_designation: '',
        hr: '', hr_name: '', hr_designation: '', user: '',
        added_on: new Date().toISOString().slice(0, 19).replace('T', ' '),
        appraisal: '', appraisal_cycle: '',
        feedback_ratings: [],
        total_score: 0,
        feedback: '',
        docstatus: 0,
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ───────────────────────────────────────────
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, apprRes, critRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","department","designation","company","branch","user_id"]&limit_page_length=None&order_by=employee_name asc'),
                API.get('/api/resource/Appraisal?fields=["name","employee","employee_name","appraisal_cycle"]&limit_page_length=None&order_by=modified desc'),
                API.get(`/api/resource/Employee Feedback Criteria?fields=["name"]&limit_page_length=None`),
            ]);
            setEmployees(empRes.data?.data || []);
            setAppraisals(apprRes.data?.data || []);
            setFeedbackCriteria((critRes.data?.data || []).map(c => c.name));
            setMastersLoaded(true);
        } catch (err) { console.error('Masters fetch error:', err); }
    };

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${API_BASE}?fields=["name","employee","employee_name","reviewer","reviewer_name","hr","hr_name","total_score","docstatus","modified","company"]&limit_page_length=None&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load feedback entries' });
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
                employee: d.employee || '', employee_name: d.employee_name || '',
                department: d.department || '', designation: d.designation || '', company: d.company || '',
                reviewer: d.reviewer || '', reviewer_name: d.reviewer_name || '',
                reviewer_designation: d.reviewer_designation || '',
                hr: d.hr || '', hr_name: d.hr_name || '', hr_designation: d.hr_designation || '',
                user: d.user || '',
                added_on: d.added_on || '',
                appraisal: d.appraisal || '', appraisal_cycle: d.appraisal_cycle || '',
                feedback_ratings: (d.feedback_ratings || []).map(r => ({
                    criteria: r.criteria || '', per_weightage: r.per_weightage || 0,
                    rating: r.rating || 0,
                })),
                total_score: d.total_score || 0,
                feedback: d.feedback || '',
                docstatus: d.docstatus ?? 0,
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load feedback details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase()) && !(d.employee_name || '').toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterStatus === 'Draft' && d.docstatus !== 0) return false;
        if (filterStatus === 'Submitted' && d.docstatus !== 1) return false;
        if (filterStatus === 'Cancelled' && d.docstatus !== 2) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm, added_on: new Date().toISOString().slice(0, 19).replace('T', ' ') }); setFormTab('employee_details'); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setFormTab('employee_details'); setView('form'); await fetchSingle(record.name); };

    // ─── AUTO-FILL from Employee Link ────────────────────────────
    const handleEmployeeChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        setFormData(prev => ({
            ...prev, employee: empId,
            employee_name: emp?.employee_name || '', department: emp?.department || '',
            designation: emp?.designation || '', company: emp?.company || '',
        }));
    };

    const handleReviewerChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        setFormData(prev => ({
            ...prev, reviewer: empId,
            reviewer_name: emp?.employee_name || '', reviewer_designation: emp?.designation || '',
            user: emp?.user_id || '',
        }));
    };

    const handleHRChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        setFormData(prev => ({
            ...prev, hr: empId,
            hr_name: emp?.employee_name || '', hr_designation: emp?.designation || ''
        }));
    };

    const handleAppraisalChange = (apprId) => {
        const appr = appraisals.find(a => a.name === apprId);
        setFormData(prev => ({
            ...prev, appraisal: apprId,
            appraisal_cycle: appr?.appraisal_cycle || '',
        }));
    };

    // ─── COMPUTE TOTAL SCORE ─────────────────────────────────────
    const computeTotalScore = (ratings) => {
        if (!ratings.length) return 0;
        let totalWeightedScore = 0;
        let totalWeight = 0;
        ratings.forEach(r => {
            const w = parseFloat(r.per_weightage) || 0;
            const rating = (parseFloat(r.rating) || 0);
            totalWeightedScore += rating * w;
            totalWeight += w;
        });
        return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 5 : 0;
    };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.employee?.trim()) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.reviewer?.trim()) { notification.warning({ message: 'Reviewer is required' }); return; }
        if (!formData.appraisal?.trim()) { notification.warning({ message: 'Appraisal is required' }); return; }
        if (!formData.feedback?.trim()) { notification.warning({ message: 'Feedback content is required' }); setFormTab('feedback'); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee, company: formData.company,
                reviewer: formData.reviewer,
                hr: formData.hr,
                added_on: formData.added_on,
                appraisal: formData.appraisal,
                feedback_ratings: formData.feedback_ratings.map(r => ({
                    criteria: r.criteria, per_weightage: r.per_weightage, rating: r.rating,
                })),
                feedback: formData.feedback,
            };

            if (editingRecord) {
                await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post(API_BASE, payload);
                notification.success({ message: 'Feedback created successfully!' });
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

    // ─── SUBMIT ──────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!editingRecord) return;
        if (!window.confirm('Submit this feedback? This action cannot be easily undone.')) return;
        try {
            await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, { docstatus: 1 });
            notification.success({ message: 'Feedback submitted!' });
            setView('list');
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            notification.error({ message: 'Submit Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        }
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

    const formatRelativeTime = (ds) => {
        if (!ds) return '-';
        const diff = Math.floor((new Date() - new Date(ds)) / 86400000);
        return diff === 0 ? 'Today' : `${diff}d ago`;
    };

    const docstatusLabel = (s) => {
        if (s === 0) return { text: 'Draft', cls: 'bg-red-50 text-red-600' };
        if (s === 1) return { text: 'Submitted', cls: 'bg-blue-50 text-blue-700' };
        if (s === 2) return { text: 'Cancelled', cls: 'bg-gray-100 text-gray-500' };
        return { text: 'Draft', cls: 'bg-red-50 text-red-600' };
    };

    const isEditable = !editingRecord || formData.docstatus === 0;

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        const tabList = [
            { key: 'employee_details', label: 'Employee Details' },
            { key: 'feedback', label: 'Feedback' },
        ];
        const ds = docstatusLabel(formData.docstatus);

        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord.name : 'New Employee Performance Feedback by HR'}</span>
                        {!editingRecord ? (
                            <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-medium ${ds.cls}`}>{ds.text}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        {editingRecord && formData.docstatus === 0 && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={() => handleDelete(editingRecord.name)}>Delete</button>
                        )}
                        {editingRecord && formData.docstatus === 0 && (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm" onClick={handleSubmit}>Submit</button>
                        )}
                        {isEditable && (
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                                {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                            </button>
                        )}
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
                        {/* ── Tab: Employee Details ────────────────────── */}
                        {formTab === 'employee_details' && (
                            <div className="space-y-5">
                                {/* Row 1: For Employee | Reviewer | HR */}
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-5xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">For Employee <span className="text-red-400">*</span></label>
                                        {isEditable ? (
                                            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                value={formData.employee} onChange={(e) => handleEmployeeChange(e.target.value)}>
                                                <option value="">Select Employee...</option>
                                                {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                            </select>
                                        ) : (
                                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">{formData.employee}{formData.employee_name ? `: ${formData.employee_name}` : ''}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Reviewer <span className="text-red-400">*</span></label>
                                        {isEditable ? (
                                            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                value={formData.reviewer} onChange={(e) => handleReviewerChange(e.target.value)}>
                                                <option value="">Select Reviewer...</option>
                                                {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                            </select>
                                        ) : (
                                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">{formData.reviewer}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">HR</label>
                                        {isEditable ? (
                                            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                value={formData.hr} onChange={(e) => handleHRChange(e.target.value)}>
                                                <option value="">Select HR...</option>
                                                {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                            </select>
                                        ) : (
                                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">{formData.hr || '-'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Employee Name | Reviewer Name | HR Name */}
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-5xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Employee Name</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.employee_name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Reviewer Name</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.reviewer_name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">HR Name</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.hr_name || '-'}</p>
                                    </div>
                                </div>

                                {/* Row 3: Added On | Appraisal Cycle | Company */}
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-5xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Added On <span className="text-red-400">*</span></label>
                                        <input type="datetime-local" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={(formData.added_on || '').replace(' ', 'T').slice(0, 16)}
                                            onChange={(e) => updateForm('added_on', e.target.value.replace('T', ' ') + ':00')}
                                            readOnly={!isEditable} />
                                        <p className="text-[11px] text-gray-400 mt-0.5">Asia/Kolkata</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Appraisal Cycle</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.appraisal_cycle || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Company <span className="text-red-400">*</span></label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.company || '-'}</p>
                                    </div>
                                </div>

                                {/* Row 4: Department | Designation (reviewer's) | Designation (HR's) */}
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-5xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Department</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.department || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Designation (Reviewer)</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.reviewer_designation || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Designation (HR)</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.hr_designation || '-'}</p>
                                    </div>
                                </div>

                                {/* Row 5: Designation (employee's) | User */}
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 max-w-5xl">
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">Designation (Employee)</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.designation || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] text-gray-500 mb-1">User</label>
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.user || '-'}</p>
                                    </div>
                                    <div></div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Appraisal Link */}
                                <div className="max-w-md">
                                    <label className="block text-[13px] text-gray-500 mb-1">Appraisal <span className="text-red-400">*</span></label>
                                    {isEditable ? (
                                        <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                            value={formData.appraisal} onChange={(e) => handleAppraisalChange(e.target.value)}>
                                            <option value="">Select Appraisal...</option>
                                            {appraisals.filter(a => !formData.employee || a.employee === formData.employee).map(a => (
                                                <option key={a.name} value={a.name}>{a.name}{a.employee_name ? ` (${a.employee_name})` : ''}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">{formData.appraisal || '-'}</p>
                                    )}
                                </div>

                                {/* Feedback Ratings Table */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-[13px] text-gray-500">Feedback Ratings</h3>
                                        {isEditable && (
                                            <button className="text-xs text-blue-600 hover:underline" onClick={() => updateForm('feedback_ratings', [...formData.feedback_ratings, { criteria: '', per_weightage: 0, rating: 0 }])}>
                                                Add Row
                                            </button>
                                        )}
                                    </div>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                                <tr>
                                                    <th className="px-2 py-2.5 w-8 text-center"><input type="checkbox" className="w-3.5 h-3.5" disabled /></th>
                                                    <th className="px-2 py-2.5 text-left w-12">No.</th>
                                                    <th className="px-3 py-2.5 text-left">Criteria <span className="text-red-400">*</span></th>
                                                    <th className="px-3 py-2.5 text-right w-32">Weightage (%) <span className="text-red-400">*</span></th>
                                                    <th className="px-3 py-2.5 text-left w-48">Rating</th>
                                                    <th className="px-2 py-2.5 w-8 text-center">⚙</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {formData.feedback_ratings.length === 0 ? (
                                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No Data</td></tr>
                                                ) : formData.feedback_ratings.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="px-2 py-2.5 text-center"><input type="checkbox" className="w-3.5 h-3.5" /></td>
                                                        <td className="px-2 py-2.5 text-gray-400">{idx + 1}</td>
                                                        <td className="px-3 py-2.5">
                                                            {isEditable ? (
                                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.criteria || ''} onChange={(e) => {
                                                                        const u = [...formData.feedback_ratings]; u[idx] = { ...u[idx], criteria: e.target.value };
                                                                        updateForm('feedback_ratings', u);
                                                                    }}>
                                                                    <option value="">Select Criteria...</option>
                                                                    {feedbackCriteria.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            ) : (
                                                                <span className="font-medium">{row.criteria || '-'}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            {isEditable ? (
                                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.per_weightage || ''} onChange={(e) => {
                                                                        const u = [...formData.feedback_ratings]; u[idx] = { ...u[idx], per_weightage: parseFloat(e.target.value) || 0 };
                                                                        updateForm('feedback_ratings', u);
                                                                    }} />
                                                            ) : (
                                                                <span>{row.per_weightage}%</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <StarRating value={(parseFloat(row.rating) || 0) * 5} editable={isEditable}
                                                                onChange={(val) => {
                                                                    const u = [...formData.feedback_ratings]; u[idx] = { ...u[idx], rating: val / 5 };
                                                                    const totalScore = computeTotalScore(u);
                                                                    setFormData(prev => ({ ...prev, feedback_ratings: u, total_score: totalScore }));
                                                                }} />
                                                        </td>
                                                        <td className="px-2 py-2.5 text-center">
                                                            {isEditable ? (
                                                                <button className="text-gray-400 hover:text-red-500 transition text-xs" title="Remove"
                                                                    onClick={() => {
                                                                        const u = formData.feedback_ratings.filter((_, i) => i !== idx);
                                                                        setFormData(prev => ({ ...prev, feedback_ratings: u, total_score: computeTotalScore(u) }));
                                                                    }}>✕</button>
                                                            ) : (
                                                                <span className="text-gray-400 cursor-pointer" title="Edit">✎</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total Score */}
                                <div className="max-w-md">
                                    <label className="block text-[13px] text-gray-500 mb-1">Total Score</label>
                                    <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">
                                        {(formData.total_score || 0).toFixed(3)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Feedback ────────────────────────────── */}
                        {formTab === 'feedback' && (
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Feedback <span className="text-red-400">*</span></label>
                                {isEditable ? (
                                    <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[250px] bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.feedback?.replace(/<[^>]+>/g, '') || ''} onChange={(e) => updateForm('feedback', e.target.value)} placeholder="Enter your feedback..." />
                                ) : (
                                    formData.feedback && formData.feedback.includes('<') ? (
                                        <div className="w-full border border-gray-200 rounded px-4 py-3 text-sm bg-white min-h-[200px] prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: formData.feedback }} />
                                    ) : (
                                        <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded min-h-[200px]">{formData.feedback || 'No feedback provided.'}</p>
                                    )
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
                <h1 className="text-2xl font-semibold text-gray-800">Employee Performance Feedback by HR</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Feedback
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Cancelled">Cancelled</option>
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
                        <p className="text-lg mb-2">No feedback entries found</p>
                        <p className="text-sm">Click "+ Add Feedback" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewer</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">HR</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Total Score</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => {
                                const ds = docstatusLabel(row.docstatus);
                                return (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.employee || '-'}</td>
                                        <td className="px-4 py-3">{row.employee_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.reviewer_name || row.reviewer || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.hr_name || row.hr || '-'}</td>
                                        <td className="px-4 py-3">
                                            <StarRating value={(row.total_score || 0)} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${ds.cls}`}>{ds.text}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)}</td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                            {row.docstatus === 0 && <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row.name)}>Delete</button>}
                                        </td>
                                    </tr>
                                );
                            })}
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
