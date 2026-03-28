import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const STATUS_OPTIONS = ['Applied', 'Approved', 'Rejected', 'Admitted'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const emptyForm = () => ({
    // Details
    first_name: '',
    middle_name: '',
    last_name: '',
    naming_series: 'EDU-APP-.YYYY.-',
    application_date: new Date().toISOString().split('T')[0],
    application_status: 'Applied',
    program: '',
    student_email_address: '',
    academic_year: '',
    student_admission: '',
    academic_term: '',
    student_category: '',
    paid: 0,

    // Personal Details
    date_of_birth: '',
    gender: '',
    blood_group: '',
    student_mobile_number: '',
    nationality: '',

    // Relations
    guardians: [], // { guardian: '', guardian_name: '', relation: '' }
    siblings: [], // { full_name: '', gender: '', program: '', date_of_birth: '' }

    // Address
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
});

const StudentApplicant = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('Details');

    // List states
    const [applicants, setApplicants] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        programs: [],
        academicYears: [],
        academicTerms: [],
        studentCategories: [],
        studentAdmissions: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchApplicants();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchApplicant(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const [pRes, yRes, tRes, cRes, aRes] = await Promise.all([
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Student Category?limit_page_length=None'),
                API.get('/api/resource/Student Admission?limit_page_length=None'),
            ]);
            setDropdowns({
                programs: pRes.data.data?.map(d => d.name) || [],
                academicYears: yRes.data.data?.map(d => d.name) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                studentCategories: cRes.data.data?.map(d => d.name) || [],
                studentAdmissions: aRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchApplicants = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Applicant?fields=["name","first_name","last_name","application_status","program","application_date"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setApplicants(response.data.data || []);
        } catch (err) {
            console.error('Error fetching student applicants:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchApplicant = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Applicant/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                first_name: d.first_name || '',
                middle_name: d.middle_name || '',
                last_name: d.last_name || '',
                naming_series: d.naming_series || 'EDU-APP-.YYYY.-',
                application_date: d.application_date || '',
                application_status: d.application_status || 'Applied',
                program: d.program || '',
                student_email_address: d.student_email_address || '',
                academic_year: d.academic_year || '',
                student_admission: d.student_admission || '',
                academic_term: d.academic_term || '',
                student_category: d.student_category || '',
                paid: d.paid || 0,

                date_of_birth: d.date_of_birth || '',
                gender: d.gender || '',
                blood_group: d.blood_group || '',
                student_mobile_number: d.student_mobile_number || '',
                nationality: d.nationality || '',

                guardians: (d.guardians || []).map(g => ({
                    guardian: g.guardian || '',
                    guardian_name: g.guardian_name || '',
                    relation: g.relation || ''
                })),
                siblings: (d.siblings || []).map(s => ({
                    full_name: s.full_name || '',
                    gender: s.gender || '',
                    program: s.program || '',
                    date_of_birth: s.date_of_birth || ''
                })),

                address_line_1: d.address_line_1 || '',
                address_line_2: d.address_line_2 || '',
                city: d.city || '',
                state: d.state || '',
                pincode: d.pincode || '',
                country: d.country || 'India',
            });
        } catch (err) {
            console.error('Error fetching applicant:', err);
            notification.error({ message: 'Error', description: 'Failed to load applicant data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Child Table Functions ---
    const addGuardianRow = () => {
        setForm(prev => ({
            ...prev,
            guardians: [...prev.guardians, { guardian: '', guardian_name: '', relation: '' }]
        }));
    };

    const removeGuardianRow = (index) => {
        const newGuardians = [...form.guardians];
        newGuardians.splice(index, 1);
        setForm(prev => ({ ...prev, guardians: newGuardians }));
    };

    const updateGuardianRow = (index, field, value) => {
        const newGuardians = [...form.guardians];
        newGuardians[index][field] = value;
        setForm(prev => ({ ...prev, guardians: newGuardians }));
    };

    const addSiblingRow = () => {
        setForm(prev => ({
            ...prev,
            siblings: [...prev.siblings, { full_name: '', gender: '', program: '', date_of_birth: '' }]
        }));
    };

    const removeSiblingRow = (index) => {
        const newSiblings = [...form.siblings];
        newSiblings.splice(index, 1);
        setForm(prev => ({ ...prev, siblings: newSiblings }));
    };

    const updateSiblingRow = (index, field, value) => {
        const newSiblings = [...form.siblings];
        newSiblings[index][field] = value;
        setForm(prev => ({ ...prev, siblings: newSiblings }));
    };

    const handleSave = async () => {
        if (!form.first_name) {
            notification.warning({ message: 'First Name is required.' });
            setActiveTab('Details');
            return;
        }
        if (!form.program) {
            notification.warning({ message: 'Program is required.' });
            setActiveTab('Details');
            return;
        }
        if (!form.student_email_address) {
            notification.warning({ message: 'Student Email Address is required.' });
            setActiveTab('Details');
            return;
        }
        if (!form.academic_year) {
            notification.warning({ message: 'Academic Year is required.' });
            setActiveTab('Details');
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };

            if (editingRecord) {
                await API.put(`/api/resource/Student Applicant/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Student Applicant updated successfully.' });
            } else {
                await API.post('/api/resource/Student Applicant', payload);
                notification.success({ message: 'Student Applicant created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this applicant?')) return;
        try {
            await API.delete(`/api/resource/Student Applicant/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Student Applicant deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const tabStyle = (tabName) => `px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === tabName ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

    if (view === 'list') {
        const filtered = applicants.filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.first_name || '').toLowerCase().includes(q) ||
                (a.last_name || '').toLowerCase().includes(q) ||
                (a.program || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Student Applicant</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchApplicants} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Applicant
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Name, Program or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {applicants.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Applicant Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1 text-gray-400 italic">No Applicants Found</p>
                                        <p className="text-sm text-gray-300">Try adjusting your search or add a new record.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-sm" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            {row.first_name} {row.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${row.application_status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                row.application_status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    row.application_status === 'Admitted' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.application_status || 'Applied'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.application_date || '-'}</td>
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
            <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading applicant data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Student Applicant'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50/50 px-4 pt-2 gap-4">
                    <div className={tabStyle('Details')} onClick={() => setActiveTab('Details')}>Details</div>
                    <div className={tabStyle('Personal Details')} onClick={() => setActiveTab('Personal Details')}>Personal Details</div>
                    <div className={tabStyle('Relations')} onClick={() => setActiveTab('Relations')}>Relations</div>
                    <div className={tabStyle('Address')} onClick={() => setActiveTab('Address')}>Address</div>
                </div>

                <div className="p-8">
                    <div className="max-w-4xl space-y-8">
                        {/* Tab 1: Details */}
                        {activeTab === 'Details' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelStyle}>First Name *</label>
                                            <input type="text" className={inputStyle} value={form.first_name} onChange={e => updateField('first_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Middle Name</label>
                                            <input type="text" className={inputStyle} value={form.middle_name} onChange={e => updateField('middle_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Last Name</label>
                                            <input type="text" className={inputStyle} value={form.last_name} onChange={e => updateField('last_name', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelStyle}>Naming Series</label>
                                            <input type="text" className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Application Date</label>
                                            <input type="date" className={inputStyle} value={form.application_date} onChange={e => updateField('application_date', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Application Status</label>
                                            <select className={inputStyle} value={form.application_status} onChange={e => updateField('application_status', e.target.value)}>
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Program *</label>
                                            <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                                <option value="">Select Program</option>
                                                {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-8 grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelStyle}>Student Email Address *</label>
                                            <input type="email" className={inputStyle} value={form.student_email_address} onChange={e => updateField('student_email_address', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Student Admission</label>
                                            <select className={inputStyle} value={form.student_admission} onChange={e => updateField('student_admission', e.target.value)}>
                                                <option value="">Select Admission</option>
                                                {dropdowns.studentAdmissions.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Student Category</label>
                                            <select className={inputStyle} value={form.student_category} onChange={e => updateField('student_category', e.target.value)}>
                                                <option value="">Select Category</option>
                                                {dropdowns.studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className={labelStyle}>Academic Year *</label>
                                            <select className={inputStyle} value={form.academic_year} onChange={e => updateField('academic_year', e.target.value)}>
                                                <option value="">Select Year</option>
                                                {dropdowns.academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelStyle}>Academic Term</label>
                                            <select className={inputStyle} value={form.academic_term} onChange={e => updateField('academic_term', e.target.value)}>
                                                <option value="">Select Term</option>
                                                {dropdowns.academicTerms.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 pb-1">
                                            <input type="checkbox" id="paidCheckbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" checked={!!form.paid} onChange={e => updateField('paid', e.target.checked ? 1 : 0)} />
                                            <label htmlFor="paidCheckbox" className="text-[13px] text-gray-700 font-medium cursor-pointer select-none">Paid</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Personal Details */}
                        {activeTab === 'Personal Details' && (
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in duration-300">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Date of Birth</label>
                                        <input type="date" className={inputStyle} value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Gender</label>
                                        <select className={inputStyle} value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                                            <option value="">Select Gender</option>
                                            {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Blood Group</label>
                                        <select className={inputStyle} value={form.blood_group} onChange={e => updateField('blood_group', e.target.value)}>
                                            <option value="">Select Blood Group</option>
                                            {BLOOD_GROUP_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Student Mobile Number</label>
                                        <input type="text" className={inputStyle} value={form.student_mobile_number} onChange={e => updateField('student_mobile_number', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Nationality</label>
                                        <input type="text" className={inputStyle} value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Relations */}
                        {activeTab === 'Relations' && (
                            <div className="space-y-10 animate-in fade-in duration-300">
                                {/* Guardians */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm mb-4">Guardian Details</h3>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-left w-12 text-gray-400 font-normal">No.</th>
                                                    <th className="px-3 py-2.5 text-left">Guardian *</th>
                                                    <th className="px-3 py-2.5 text-left">Guardian Name *</th>
                                                    <th className="px-3 py-2.5 text-left">Relation</th>
                                                    <th className="px-3 py-2 text-center w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {form.guardians.length === 0 ? (
                                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic text-sm">No Data</td></tr>
                                                ) : (
                                                    form.guardians.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                            <td className="px-3 py-2.5">
                                                                <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.guardian} onChange={e => updateGuardianRow(idx, 'guardian', e.target.value)} />
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.guardian_name} onChange={e => updateGuardianRow(idx, 'guardian_name', e.target.value)} />
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.relation} onChange={e => updateGuardianRow(idx, 'relation', e.target.value)} />
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <button onClick={() => removeGuardianRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addGuardianRow}>
                                        Add Row
                                    </button>
                                </div>

                                {/* Siblings */}
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-sm mb-4">Sibling Details</h3>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                                <tr>
                                                    <th className="px-3 py-2.5 text-left w-12 text-gray-400 font-normal">No.</th>
                                                    <th className="px-3 py-2.5 text-left">Full Name</th>
                                                    <th className="px-3 py-2.5 text-left">Gender</th>
                                                    <th className="px-3 py-2.5 text-left">Program</th>
                                                    <th className="px-3 py-2.5 text-left">Date of Birth</th>
                                                    <th className="px-3 py-2 text-center w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {form.siblings.length === 0 ? (
                                                    <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic text-sm">No Data</td></tr>
                                                ) : (
                                                    form.siblings.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                            <td className="px-3 py-2.5">
                                                                <input type="text" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.full_name} onChange={e => updateSiblingRow(idx, 'full_name', e.target.value)} />
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.gender} onChange={e => updateSiblingRow(idx, 'gender', e.target.value)}>
                                                                    <option value="">Select</option>
                                                                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.program} onChange={e => updateSiblingRow(idx, 'program', e.target.value)}>
                                                                    <option value="">Select</option>
                                                                    {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <input type="date" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                    value={row.date_of_birth} onChange={e => updateSiblingRow(idx, 'date_of_birth', e.target.value)} />
                                                            </td>
                                                            <td className="px-3 py-2.5 text-center">
                                                                <button onClick={() => removeSiblingRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addSiblingRow}>
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab 4: Address */}
                        {activeTab === 'Address' && (
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 animate-in fade-in duration-300">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Address Line 1</label>
                                        <input type="text" className={inputStyle} value={form.address_line_1} onChange={e => updateField('address_line_1', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Address Line 2</label>
                                        <input type="text" className={inputStyle} value={form.address_line_2} onChange={e => updateField('address_line_2', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>City</label>
                                        <input type="text" className={inputStyle} value={form.city} onChange={e => updateField('city', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>State</label>
                                        <input type="text" className={inputStyle} value={form.state} onChange={e => updateField('state', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Pincode</label>
                                        <input type="text" className={inputStyle} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Country</label>
                                        <input type="text" className={inputStyle} value={form.country} onChange={e => updateField('country', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentApplicant;
