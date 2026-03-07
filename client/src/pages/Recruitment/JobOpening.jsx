import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function JobOpening() {
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
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    // Helper: get current datetime string in dd-mm-yyyy HH:mm:ss format
    const getCurrentDateTime = () => {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const hh = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    };

    // Get timezone string
    const getTimezone = () => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Map legacy timezone names to modern ones
            if (tz === 'Asia/Calcutta') return 'Asia/Kolkata';
            return tz;
        } catch {
            return 'Asia/Kolkata';
        }
    };

    // Form data
    const defaultForm = {
        name: '',
        job_title: '',
        status: 'Open',
        designation: '',
        posted_on: getCurrentDateTime(),
        closes_on: '',
        company: 'Preeshe Consultancy Services',
        employment_type: '',
        department: '',
        location: '',
        publish: 1,
        route: '',
        job_application_route: '',
        publish_applications: 1,
        description: '',
        currency: 'INR',
        salary_per: 'Month',
        lower_range: '',
        upper_range: '',
        publish_salary_range: 0
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ────────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [compRes, deptRes, desigRes, empTypeRes, locRes, currRes] = await Promise.all([
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                    API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Employment Type?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Location?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Currency?fields=["name","enabled"]&limit_page_length=None&order_by=name asc'),
                ]);
                setCompanies((compRes.data?.data || []).map(c => c.name));
                setDepartments((deptRes.data?.data || []).map(d => d.name));
                setDesignations((desigRes.data?.data || []).map(d => d.name));
                setEmploymentTypes((empTypeRes.data?.data || []).map(d => d.name));
                setLocations((locRes.data?.data || []).map(d => d.name));
                setCurrencies((currRes.data?.data || []).map(d => d.name));
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH LIST ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Job Opening?fields=["*"]&limit_page_length=None&order_by=modified desc');
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load Job Openings' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Job Opening/${encodeURIComponent(name)}`);
            const d = res.data?.data || {};
            setFormData({
                name: d.name || '',
                job_title: d.job_title || '',
                status: d.status || 'Open',
                designation: d.designation || '',
                posted_on: d.posted_on || d.posting_date || '',
                closes_on: d.closes_on || '',
                company: d.company || '',
                employment_type: d.employment_type || '',
                department: d.department || '',
                location: d.location || '',
                publish: d.publish ?? 1,
                route: d.route || '',
                job_application_route: d.job_application_route || '',
                publish_applications: d.publish_applications ?? 1,
                description: d.description || '',
                currency: d.currency || 'INR',
                salary_per: d.salary_per || 'Month',
                lower_range: d.lower_range || '',
                upper_range: d.upper_range || '',
                publish_salary_range: d.publish_salary_range ?? 0
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    // ─── ACTIONS ──────────────────────────────────────────────────
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm, posted_on: getCurrentDateTime() });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    // ─── SAVE ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.job_title || !formData.designation || !formData.company) {
            notification.warning({ message: 'Please fill all required fields (Job Title, Designation, Company)' });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                job_title: formData.job_title,
                status: formData.status,
                designation: formData.designation,
                posted_on: formData.posted_on || null,
                closes_on: formData.closes_on || null,
                company: formData.company,
                employment_type: formData.employment_type || null,
                department: formData.department || null,
                location: formData.location || null,
                publish: formData.publish ? 1 : 0,
                route: formData.route || null,
                job_application_route: formData.job_application_route || null,
                publish_applications: formData.publish_applications ? 1 : 0,
                description: formData.description,
                currency: formData.currency,
                salary_per: formData.salary_per,
                lower_range: parseFloat(formData.lower_range) || 0,
                upper_range: parseFloat(formData.upper_range) || 0,
                publish_salary_range: formData.publish_salary_range ? 1 : 0
            };

            if (editingRecord) {
                await API.put(`/api/resource/Job Opening/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Job Opening updated successfully' });
            } else {
                const res = await API.post('/api/resource/Job Opening', payload);
                const newName = res.data?.data?.name;
                notification.success({ message: `Job Opening ${newName || ''} created successfully` });
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
            await API.delete(`/api/resource/Job Opening/${encodeURIComponent(record.name)}`);
            notification.success({ message: `Deleted ${record.name}` });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: `Delete failed: ${err.response?.data?.exc || err.message}` });
        }
    };

    // ─── FORM HELPERS ─────────────────────────────────────────────
    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-blue-50 text-blue-600';
            case 'Closed': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    // Format datetime for display (dd-mm-yyyy HH:mm:ss)
    const formatDateTimeDisplay = (val) => {
        if (!val) return '';
        // If already in display format, return as is
        if (/^\d{2}-\d{2}-\d{4}/.test(val)) return val;
        // Convert from yyyy-mm-dd HH:mm:ss
        const parts = val.split(' ');
        const dateParts = (parts[0] || '').split('-');
        if (dateParts.length === 3 && dateParts[0].length === 4) {
            return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}${parts[1] ? ' ' + parts[1] : ''}`;
        }
        return val;
    };

    // ─── FILTER ───────────────────────────────────────────────────
    const filtered = data.filter(d =>
        (d.name || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.job_title || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.designation || '').toLowerCase().includes(searchId.toLowerCase()) ||
        (d.department || '').toLowerCase().includes(searchId.toLowerCase())
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
                            {editingRecord ? editingRecord.name : 'New Job Opening'}
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
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Job Opening</span>
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
                                        Job Applicant
                                        <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700 border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                        Job Requisition
                                        <span className="text-gray-400 ml-1 cursor-pointer hover:text-blue-600">+</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        {/* ── Section 1: Top Fields (2 columns) ── */}
                        <div className="grid grid-cols-2 gap-x-10 gap-y-5 mb-8">
                            {/* Job Title */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Job Title <span className="text-red-500">*</span></label>
                                <input type="text"
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.job_title} onChange={e => updateForm('job_title', e.target.value)}
                                    placeholder="" />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Status</label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                    value={formData.status} onChange={e => updateForm('status', e.target.value)}>
                                    <option value="Open">Open</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Designation <span className="text-red-500">*</span></label>
                                <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={formData.designation} onChange={e => updateForm('designation', e.target.value)}>
                                    <option value="">Select Designation...</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Posted On (datetime + timezone) */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Posted On</label>
                                <input type="datetime-local" step="1"
                                    className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                    value={(formData.posted_on || '').replace(' ', 'T')}
                                    onChange={e => updateForm('posted_on', e.target.value.replace('T', ' '))} />
                                <p className="text-xs text-gray-400 mt-1">{getTimezone()}</p>
                            </div>

                            {/* Empty left column spacer */}
                            <div></div>

                            {/* Closes On */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Closes On</label>
                                <input type="date"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                    value={formData.closes_on} onChange={e => updateForm('closes_on', e.target.value)} />
                                <p className="text-xs text-gray-400 mt-1">If set, the job opening will be closed automatically after this date</p>
                            </div>
                        </div>

                        {/* ── Section 2: Company Details ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-4">Company Details</h3>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                    <input type="text" readOnly
                                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
                                        value={formData.company} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Employment Type</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.employment_type} onChange={e => updateForm('employment_type', e.target.value)}>
                                        <option value="">Select...</option>
                                        {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Department</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.department} onChange={e => updateForm('department', e.target.value)}>
                                        <option value="">Select Department...</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Location</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.location} onChange={e => updateForm('location', e.target.value)}>
                                        <option value="">Select Location...</option>
                                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Publish Settings ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="publish"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={!!formData.publish} onChange={e => updateForm('publish', e.target.checked ? 1 : 0)} />
                                    <label htmlFor="publish" className="text-sm text-gray-700">Publish on website</label>
                                </div>
                                <div></div>

                                {/* Only show these fields when Publish on website is checked */}
                                {!!formData.publish && (
                                    <>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Route</label>
                                            <input type="text"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                                value={formData.route} onChange={e => updateForm('route', e.target.value)}
                                                placeholder="" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Job Application Route</label>
                                            <input type="text"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                                value={formData.job_application_route} onChange={e => updateForm('job_application_route', e.target.value)}
                                                placeholder="" />
                                            <p className="text-xs text-gray-400 mt-1">Route to the custom Job Application Webform</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="publish_applications"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={!!formData.publish_applications} onChange={e => updateForm('publish_applications', e.target.checked ? 1 : 0)} />
                                            <label htmlFor="publish_applications" className="text-sm text-gray-700">Publish Applications Received</label>
                                        </div>
                                        <div></div>
                                        <p className="text-xs text-gray-400 -mt-3 col-span-2">If enabled, the total no. of applications received for this opening will be displayed on the website</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── Section 4: Description ── */}
                        <div className="border-t border-gray-200 pt-5 mb-6">
                            <label className="block text-sm text-gray-600 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 min-h-[200px]"
                                rows={10}
                                value={formData.description}
                                onChange={e => updateForm('description', e.target.value)}
                                placeholder="Job profile, qualifications required etc."
                            />
                            <p className="text-xs text-gray-400 mt-1">Job profile, qualifications required etc.</p>
                        </div>

                        {/* ── Section 5: Salary ── */}
                        <div className="border-t border-gray-200 pt-5">
                            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Currency</label>
                                    <select className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.currency} onChange={e => updateForm('currency', e.target.value)}>
                                        <option value="">Select Currency...</option>
                                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Salary Paid Per</label>
                                    <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                        value={formData.salary_per} onChange={e => updateForm('salary_per', e.target.value)}>
                                        <option value="Month">Month</option>
                                        <option value="Week">Week</option>
                                        <option value="Day">Day</option>
                                        <option value="Hour">Hour</option>
                                        <option value="Year">Year</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Lower Range</label>
                                    <input type="number" min="0"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.lower_range} onChange={e => updateForm('lower_range', e.target.value)}
                                        placeholder="" />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="publish_salary_range"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={!!formData.publish_salary_range} onChange={e => updateForm('publish_salary_range', e.target.checked ? 1 : 0)} />
                                    <label htmlFor="publish_salary_range" className="text-sm text-gray-700">Publish Salary Range</label>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Upper Range</label>
                                    <input type="number" min="0"
                                        className="w-full border border-orange-300 rounded px-3 py-2 text-sm bg-orange-50 focus:outline-none focus:border-blue-400"
                                        value={formData.upper_range} onChange={e => updateForm('upper_range', e.target.value)}
                                        placeholder="" />
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
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Job Opening</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700" onClick={handleNew}>
                        + Add Job Opening
                    </button>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
                    placeholder="Search by title, designation..."
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
                        <p className="text-lg mb-2">No Job Openings found</p>
                        <p className="text-sm">Click "+ Add Job Opening" to create one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">#</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Job Title</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Designation</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Posted On</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                        <td className="px-4 py-3 text-blue-600 cursor-pointer font-medium" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-4 py-3">{row.job_title || '-'}</td>
                                        <td className="px-4 py-3">{row.designation || '-'}</td>
                                        <td className="px-4 py-3">{row.department || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(row.status)}`}>{row.status || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">{row.posted_on || row.posting_date || '-'}</td>
                                        <td className="px-4 py-3">{row.location || '-'}</td>
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
                    <span>Source: ERPNext → /api/resource/Job Opening</span>
                </div>
            )}
        </div>
    );
}
