import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const RESOURCE = 'Employee Referral';
const API_BASE = `/api/resource/${RESOURCE}`;

export default function EmployeeReferral() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Filters
    const [filterID, setFilterID] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterReferrer, setFilterReferrer] = useState('');

    // Master data
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Form
    const defaultForm = {
        first_name: '',
        last_name: '',
        date: '',
        status: 'Pending',
        for_designation: '',
        email: '',
        current_employer: '',
        contact_no: '',
        current_job_title: '',
        resume_link: '',
        resume_attachment: '',
        referrer: '',
        is_applicable_for_referral_bonus: 1,
        reason_for_recommendation: '',
        work_references: '',
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ───────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [desigRes, empRes] = await Promise.all([
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None&order_by=employee_name asc').catch(() => ({ data: { data: [] } })),
                ]);
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
            const res = await API.get(`${API_BASE}?fields=["name","first_name","last_name","date","status","for_designation","email","contact_no","referrer","referrer_name","modified"]&limit_page_length=None&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Employee Referrals' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`${API_BASE}/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                first_name: d.first_name || '',
                last_name: d.last_name || '',
                date: d.date || '',
                status: d.status || 'Pending',
                for_designation: d.for_designation || '',
                email: d.email || '',
                current_employer: d.current_employer || '',
                contact_no: d.contact_no || '',
                current_job_title: d.current_job_title || '',
                resume_link: d.resume_link || '',
                resume_attachment: d.resume_attachment || '',
                referrer: d.referrer || '',
                is_applicable_for_referral_bonus: d.is_applicable_for_referral_bonus ?? 1,
                reason_for_recommendation: d.reason_for_recommendation || '',
                work_references: d.work_references || '',
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.first_name?.trim()) { notification.warning({ message: 'First Name is required' }); return; }
        if (!formData.date) { notification.warning({ message: 'Date is required' }); return; }
        if (!formData.for_designation) { notification.warning({ message: 'For Designation is required' }); return; }
        if (!formData.email?.trim()) { notification.warning({ message: 'Email is required' }); return; }
        if (!formData.referrer) { notification.warning({ message: 'Referrer is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                date: formData.date,
                status: formData.status,
                for_designation: formData.for_designation,
                email: formData.email,
                current_employer: formData.current_employer || null,
                contact_no: formData.contact_no || null,
                current_job_title: formData.current_job_title || null,
                resume_link: formData.resume_link || null,
                referrer: formData.referrer,
                is_applicable_for_referral_bonus: formData.is_applicable_for_referral_bonus,
                reason_for_recommendation: formData.reason_for_recommendation || null,
                work_references: formData.work_references || null,
            };

            if (editingRecord) {
                await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Employee Referral updated successfully' });
            } else {
                const res = await API.post(API_BASE, payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Employee Referral ${newName || ''} created successfully` });
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

    // ─── DELETE ────────────────────────────────────────────────────
    const handleDelete = async (record) => {
        if (!window.confirm(`Delete "${record.name}"?`)) return;
        try {
            await API.delete(`${API_BASE}/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            if (view === 'form') setView('list');
            else fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    // ─── FILE UPLOAD ──────────────────────────────────────────────
    const [uploading, setUploading] = useState(false);
    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('is_private', 1);
            fd.append('doctype', RESOURCE);
            if (editingRecord) fd.append('docname', editingRecord.name);
            const res = await API.post('/api/method/upload_file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const fileUrl = res.data?.message?.file_url;
            if (fileUrl) {
                updateForm('resume_attachment', fileUrl);
                notification.success({ message: 'Resume uploaded' });
            }
        } catch (err) {
            console.error('Upload failed:', err);
            notification.error({ message: 'Upload failed', description: err.message });
        } finally { setUploading(false); }
    };

    const statusColor = (s) => {
        if (s === 'Pending') return 'bg-yellow-50 text-yellow-700';
        if (s === 'Accepted') return 'bg-green-50 text-green-700';
        if (s === 'Rejected') return 'bg-red-50 text-red-600';
        return 'bg-gray-50 text-gray-600';
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 d ago';
        return `${diffDays} d ago`;
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d => {
        const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim();
        const matchID = !filterID || (d.name || '').toLowerCase().includes(filterID.toLowerCase());
        const matchName = !filterName || fullName.toLowerCase().includes(filterName.toLowerCase());
        const matchStatus = !filterStatus || (d.status || '') === filterStatus;
        const matchDesignation = !filterDesignation || (d.for_designation || '').toLowerCase().includes(filterDesignation.toLowerCase());
        const matchReferrer = !filterReferrer || (d.referrer || '').toLowerCase().includes(filterReferrer.toLowerCase()) || (d.referrer_name || '').toLowerCase().includes(filterReferrer.toLowerCase());
        return matchID && matchName && matchStatus && matchDesignation && matchReferrer;
    });

    const hasActiveFilters = filterID || filterName || filterStatus || filterDesignation || filterReferrer;
    const clearFilters = () => { setFilterID(''); setFilterName(''); setFilterStatus(''); setFilterDesignation(''); setFilterReferrer(''); };

    // ═══════════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord.name : 'New Employee Referral'}</span>
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
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={() => handleDelete(editingRecord)}>Delete</button>
                        )}
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-8">

                        {/* ── Section 1: Basic Details ── */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">First Name <span className="text-red-400">*</span></label>
                                <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.first_name} onChange={e => updateForm('first_name', e.target.value)} placeholder="" />
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Date <span className="text-red-400">*</span></label>
                                <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.date} onChange={e => updateForm('date', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Last Name</label>
                                <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.last_name} onChange={e => updateForm('last_name', e.target.value)} placeholder="" />
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Status <span className="text-red-400">*</span></label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.status} onChange={e => updateForm('status', e.target.value)}>
                                    <option value="Pending">Pending</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div></div>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">For Designation <span className="text-red-400">*</span></label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.for_designation} onChange={e => updateForm('for_designation', e.target.value)}>
                                    <option value="">Select Designation...</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ── Section 2: Referral Details ── */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Referral Details</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Email <span className="text-red-400">*</span></label>
                                    <input type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.email} onChange={e => updateForm('email', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Current Employer</label>
                                    <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.current_employer} onChange={e => updateForm('current_employer', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Contact No.</label>
                                    <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.contact_no} onChange={e => updateForm('contact_no', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Current Job Title</label>
                                    <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.current_job_title} onChange={e => updateForm('current_job_title', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Resume Link</label>
                                    <input type="url" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.resume_link} onChange={e => updateForm('resume_link', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Resume</label>
                                    {formData.resume_attachment ? (
                                        <div className="flex items-center gap-2">
                                            <a href={formData.resume_attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-[200px]">
                                                {formData.resume_attachment.split('/').pop()}
                                            </a>
                                            <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={() => updateForm('resume_attachment', '')}>✕</button>
                                        </div>
                                    ) : (
                                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition">
                                            {uploading ? (
                                                <><span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Uploading...</>
                                            ) : (
                                                'Attach'
                                            )}
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleResumeUpload} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Referrer Details ── */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Referrer Details</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Referrer <span className="text-red-400">*</span></label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                        value={formData.referrer} onChange={e => updateForm('referrer', e.target.value)}>
                                        <option value="">Select Employee...</option>
                                        {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600"
                                            checked={!!formData.is_applicable_for_referral_bonus}
                                            onChange={e => updateForm('is_applicable_for_referral_bonus', e.target.checked ? 1 : 0)} />
                                        Is Applicable for Referral Bonus
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 4: Additional Information ── */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Additional Information</h3>
                            <div className="space-y-5 max-w-4xl">
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Why is this Candidate Qualified for this Position?</label>
                                    <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 min-h-[120px] resize-y"
                                        value={formData.reason_for_recommendation} onChange={e => updateForm('reason_for_recommendation', e.target.value)} placeholder="" />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Work References</label>
                                    <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 min-h-[120px] resize-y"
                                        value={formData.work_references} onChange={e => updateForm('work_references', e.target.value)} placeholder="" />
                                </div>
                            </div>
                        </div>

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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Employee Referral</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Employee Referral
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-44" placeholder="ID..." value={filterID} onChange={e => setFilterID(e.target.value)} />
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-44" placeholder="Full Name..." value={filterName} onChange={e => setFilterName(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-44" placeholder="Designation..." value={filterDesignation} onChange={e => setFilterDesignation(e.target.value)} />
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-44" placeholder="Referrer..." value={filterReferrer} onChange={e => setFilterReferrer(e.target.value)} />
                {hasActiveFilters && (<button className="text-red-500 hover:text-red-700 text-sm" onClick={clearFilters}>✕ Clear Filters</button>)}
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
                    <div className="text-center py-16 text-gray-400">
                        <div className="flex justify-center mb-4">
                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-sm mb-1">You haven't created an Employee Referral yet</p>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 hover:underline" onClick={handleNew}>Create your first Employee Referral</button>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Full Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">For Designation</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact No.</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Referrer</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => {
                                const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
                                return (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer text-xs" onClick={() => handleEdit(row)}>
                                                {row.name?.length > 15 ? row.name.substring(0, 15) + '...' : row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{fullName || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.date || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${statusColor(row.status)}`}>{row.status || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.for_designation || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.email || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.contact_no || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.referrer_name || row.referrer || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)}</td>
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                            <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row)}>Delete</button>
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
                    <span>Total: {data.length} records (Showing {filtered.length})</span>
                    <span>Source: ERPNext → {API_BASE}</span>
                </div>
            )}
        </div>
    );
}
