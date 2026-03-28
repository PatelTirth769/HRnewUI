import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const TABS = ['Details', 'Address', 'Relations', 'Customer Details', 'Exit'];
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['', 'Male', 'Female', 'Other'];

const emptyForm = () => ({
    enabled: 1,
    first_name: '',
    naming_series: 'EDU-STU-.YYYY.-',
    middle_name: '',
    joining_date: new Date().toISOString().slice(0, 10),
    last_name: '',
    user: '',
    student_email_id: '',
    student_mobile_number: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    nationality: '',
    // Address
    address_line_1: '',
    address_line_2: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    // Relations
    guardians: [],
    siblings: [],
    // Customer Details
    customer_group: '',
    // Exit
    date_of_leaving: '',
    reason_for_leaving: '',
    leaving_certificate_number: '',
});

const Student = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [students, setStudents] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [activeTab, setActiveTab] = useState('Details');
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic dropdown options from ERPNext
    const [countries, setCountries] = useState([]);
    const [customerGroups, setCustomerGroups] = useState([]);
    const [guardiansList, setGuardiansList] = useState([]);
    const [programs, setPrograms] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchStudents();
        } else {
            setActiveTab('Details');
            fetchDropdownData();
            if (editingRecord) {
                fetchStudent(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchStudents = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student?fields=["name","first_name","middle_name","last_name","student_email_id","student_mobile_number","joining_date","enabled","gender"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            setStudents(response.data.data || []);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [countryRes, custGroupRes, guardianRes, programRes] = await Promise.all([
                API.get('/api/resource/Country?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Customer Group?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Guardian?fields=["name","guardian_name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setCountries((countryRes.data.data || []).map(c => c.name));
            setCustomerGroups((custGroupRes.data.data || []).map(c => c.name));
            setGuardiansList((guardianRes.data.data || []).map(g => ({ name: g.name, guardian_name: g.guardian_name || g.name })));
            setPrograms((programRes.data.data || []).map(p => p.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchStudent = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                enabled: d.enabled ?? 1,
                first_name: d.first_name || '',
                naming_series: d.naming_series || 'EDU-STU-.YYYY.-',
                middle_name: d.middle_name || '',
                joining_date: d.joining_date || '',
                last_name: d.last_name || '',
                user: d.user || '',
                student_email_id: d.student_email_id || '',
                student_mobile_number: d.student_mobile_number || '',
                date_of_birth: d.date_of_birth || '',
                gender: d.gender || '',
                blood_group: d.blood_group || '',
                nationality: d.nationality || '',
                address_line_1: d.address_line_1 || '',
                address_line_2: d.address_line_2 || '',
                pincode: d.pincode || '',
                city: d.city || '',
                state: d.state || '',
                country: d.country || 'India',
                guardians: d.guardians || [],
                siblings: d.siblings || [],
                customer_group: d.customer_group || '',
                date_of_leaving: d.date_of_leaving || '',
                reason_for_leaving: d.reason_for_leaving || '',
                leaving_certificate_number: d.leaving_certificate_number || '',
            });
        } catch (err) {
            console.error('Error fetching student:', err);
            notification.error({ message: 'Error', description: 'Failed to load student data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.first_name) {
            notification.warning({ message: 'First Name is required.' });
            return;
        }
        if (!form.student_email_id) {
            notification.warning({ message: 'Student Email Address is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Student/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Student updated successfully.' });
            } else {
                await API.post('/api/resource/Student', payload);
                notification.success({ message: 'Student created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await API.delete(`/api/resource/Student/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Student deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Child table helpers ---
    const addGuardian = () => {
        setForm(prev => ({
            ...prev,
            guardians: [...prev.guardians, { guardian: '', guardian_name: '', relation: '' }]
        }));
    };
    const updateGuardian = (idx, key, val) => {
        setForm(prev => {
            const g = [...prev.guardians];
            g[idx] = { ...g[idx], [key]: val };
            // Auto-fill guardian_name when guardian is selected
            if (key === 'guardian') {
                const found = guardiansList.find(gl => gl.name === val);
                if (found) g[idx].guardian_name = found.guardian_name;
            }
            return { ...prev, guardians: g };
        });
    };
    const removeGuardian = (idx) => {
        setForm(prev => ({ ...prev, guardians: prev.guardians.filter((_, i) => i !== idx) }));
    };

    const addSibling = () => {
        setForm(prev => ({
            ...prev,
            siblings: [...prev.siblings, { full_name: '', gender: '', program: '', date_of_birth: '' }]
        }));
    };
    const updateSibling = (idx, key, val) => {
        setForm(prev => {
            const s = [...prev.siblings];
            s[idx] = { ...s[idx], [key]: val };
            return { ...prev, siblings: s };
        });
    };
    const removeSibling = (idx) => {
        setForm(prev => ({ ...prev, siblings: prev.siblings.filter((_, i) => i !== idx) }));
    };

    // --- Styles (Standard App UI) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider";

    if (view === 'list') {
        const filtered = students.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.first_name || '').toLowerCase().includes(q) ||
                (s.last_name || '').toLowerCase().includes(q) ||
                (s.student_email_id || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchStudents} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Student
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search ID, Name or Email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {students.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600">First Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Last Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Mobile</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Joining Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Students Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new student.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                row.enabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {row.enabled ? 'Active/Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.first_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium">{row.last_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-500 italic">{row.student_email_id || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.student_mobile_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.joining_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Form View
    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading student data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? `${form.first_name || ''} ${form.last_name || ''}`.trim() || editingRecord : 'New Student'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                    {editingRecord && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            form.enabled ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {form.enabled ? 'Enabled' : 'Disabled'}
                        </span>
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

            <div className="flex gap-8 mb-8 border-b border-gray-100">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-all relative ${
                            activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                {/* ─── Details Tab ─── */}
                {activeTab === 'Details' && (
                    <div className="space-y-10">
                        <div className="flex items-center gap-2 mb-2 p-3 bg-gray-50/50 border border-gray-100 rounded-lg w-fit">
                            <input
                                type="checkbox"
                                id="enabled_chk"
                                checked={!!form.enabled}
                                onChange={e => updateField('enabled', e.target.checked ? 1 : 0)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <label htmlFor="enabled_chk" className="text-sm font-semibold text-gray-700 cursor-pointer">Account Enabled</label>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>First Name *</label>
                                <input className={inputStyle} value={form.first_name} onChange={e => updateField('first_name', e.target.value)} placeholder="First Name" />
                            </div>
                            <div>
                                <label className={labelStyle}>Naming Series</label>
                                <select className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)}>
                                    <option value="EDU-STU-.YYYY.-">EDU-STU-.YYYY.-</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Middle Name</label>
                                <input className={inputStyle} value={form.middle_name} onChange={e => updateField('middle_name', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Joining Date</label>
                                <input type="date" className={inputStyle} value={form.joining_date} onChange={e => updateField('joining_date', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Last Name</label>
                                <input className={inputStyle} value={form.last_name} onChange={e => updateField('last_name', e.target.value)} placeholder="Last Name" />
                            </div>
                            <div>
                                <label className={labelStyle}>User ID (Optional)</label>
                                <input className={inputStyle} value={form.user} onChange={e => updateField('user', e.target.value)} placeholder="ERPNext User ID" />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <h3 className={sectionTitleStyle}>Personal Details</h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <label className={labelStyle}>Student Email Address *</label>
                                    <input type="email" className={inputStyle} value={form.student_email_id} onChange={e => updateField('student_email_id', e.target.value)} placeholder="email@college.edu" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Student Mobile Number</label>
                                    <input className={inputStyle} value={form.student_mobile_number} onChange={e => updateField('student_mobile_number', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Date of Birth</label>
                                    <input type="date" className={inputStyle} value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Gender</label>
                                    <select className={inputStyle} value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                                        {GENDERS.map(g => <option key={g} value={g}>{g || 'Select Gender...'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Blood Group</label>
                                    <select className={inputStyle} value={form.blood_group} onChange={e => updateField('blood_group', e.target.value)}>
                                        {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || 'Select Group...'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Nationality</label>
                                    <input className={inputStyle} value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Address Tab ─── */}
                {activeTab === 'Address' && (
                    <div>
                        <h3 className={sectionTitleStyle}>Residential Address</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>Address Line 1</label>
                                <input className={inputStyle} value={form.address_line_1} onChange={e => updateField('address_line_1', e.target.value)} placeholder="House No, Street" />
                            </div>
                            <div>
                                <label className={labelStyle}>City</label>
                                <input className={inputStyle} value={form.city} onChange={e => updateField('city', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Address Line 2</label>
                                <input className={inputStyle} value={form.address_line_2} onChange={e => updateField('address_line_2', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>State</label>
                                <input className={inputStyle} value={form.state} onChange={e => updateField('state', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Pincode</label>
                                <input className={inputStyle} value={form.pincode} onChange={e => updateField('pincode', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Country</label>
                                <select className={inputStyle} value={form.country} onChange={e => updateField('country', e.target.value)}>
                                    <option value="">Select Country...</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Relations Tab ─── */}
                {activeTab === 'Relations' && (
                    <div className="space-y-12">
                        <div>
                            <h3 className={sectionTitleStyle}>Guardian Details</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left w-12">No.</th>
                                            <th className="px-3 py-2.5 text-left font-bold text-blue-600">Guardian ID *</th>
                                            <th className="px-3 py-2.5 text-left">Guardian Name</th>
                                            <th className="px-3 py-2.5 text-left">Relation</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.guardians.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No Guardians Linked</td></tr>
                                        ) : (
                                            form.guardians.map((g, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm bg-blue-50/20 shadow-sm focus:outline-none font-medium" value={g.guardian} onChange={e => updateGuardian(idx, 'guardian', e.target.value)}>
                                                            <option value="">Link Guardian...</option>
                                                            {guardiansList.map(gl => <option key={gl.name} value={gl.name}>{gl.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input className="w-full bg-transparent text-gray-600 font-medium px-2 py-1.5 border-none focus:outline-none" value={g.guardian_name} readOnly />
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" value={g.relation} onChange={e => updateGuardian(idx, 'relation', e.target.value)} placeholder="Father, Mother..." />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button onClick={() => removeGuardian(idx)} className="text-gray-300 hover:text-red-500 font-bold transition opacity-0 group-hover:opacity-100 italic">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addGuardian} className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm">+ Add Guardian</button>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                            <h3 className={sectionTitleStyle}>Sibling Details</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left w-12">No.</th>
                                            <th className="px-3 py-2.5 text-left">Full Name</th>
                                            <th className="px-3 py-2.5 text-left">Gender</th>
                                            <th className="px-3 py-2.5 text-left">Program</th>
                                            <th className="px-3 py-2.5 text-left">DOB</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.siblings.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic">No Siblings Recorded</td></tr>
                                        ) : (
                                            form.siblings.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5"><input className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 font-medium" value={s.full_name} onChange={e => updateSibling(idx, 'full_name', e.target.value)} /></td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.gender} onChange={e => updateSibling(idx, 'gender', e.target.value)}>
                                                            {GENDERS.map(g => <option key={g} value={g}>{g || '—'}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.program} onChange={e => updateSibling(idx, 'program', e.target.value)}>
                                                            <option value="">—</option>
                                                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5"><input type="date" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={s.date_of_birth} onChange={e => updateSibling(idx, 'date_of_birth', e.target.value)} /></td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button onClick={() => removeSibling(idx)} className="text-gray-300 hover:text-red-500 font-bold transition opacity-0 group-hover:opacity-100 italic">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addSibling} className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm">+ Add Sibling</button>
                        </div>
                    </div>
                )}

                {/* ─── Customer Details Tab ─── */}
                {activeTab === 'Customer Details' && (
                    <div className="max-w-xl">
                        <h3 className={sectionTitleStyle}>Linked Customer Data</h3>
                        <div>
                            <label className={labelStyle}>Customer Group</label>
                            <select className={inputStyle} value={form.customer_group} onChange={e => updateField('customer_group', e.target.value)}>
                                <option value="">Select Group...</option>
                                {customerGroups.map(cg => <option key={cg} value={cg}>{cg}</option>)}
                            </select>
                            <p className="mt-2 text-[12px] text-gray-400 italic">Changing this affects the default accounting settings for this student.</p>
                        </div>
                    </div>
                )}

                {/* ─── Exit Tab ─── */}
                {activeTab === 'Exit' && (
                    <div className="space-y-10">
                        <h3 className={sectionTitleStyle}>Student Exit Clearance</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <label className={labelStyle}>Date of Leaving</label>
                                <input type="date" className={inputStyle} value={form.date_of_leaving} onChange={e => updateField('date_of_leaving', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Leaving Certificate Number</label>
                                <input className={inputStyle} value={form.leaving_certificate_number} onChange={e => updateField('leaving_certificate_number', e.target.value)} placeholder="Ref No." />
                            </div>
                            <div className="col-span-2 max-w-2xl">
                                <label className={labelStyle}>Reason For Leaving</label>
                                <textarea className={`${inputStyle} min-h-[120px] resize-none`} value={form.reason_for_leaving} onChange={e => updateField('reason_for_leaving', e.target.value)} placeholder="Provide detailed remarks..." />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Student;
