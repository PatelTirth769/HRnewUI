import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const TABS = ['Details', 'Instructors'];
const GROUP_BASED_ON = ['', 'Batch', 'Course', 'Activity'];

const emptyForm = () => ({
    academic_year: '',
    academic_term: '',
    group_based_on: '',
    program: '',
    student_group_name: '',
    batch: '',
    max_strength: 0,
    student_category: '',
    disabled: 0,
    instructors: [],
});

const StudentGroup = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [groups, setGroups] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [activeTab, setActiveTab] = useState('Details');
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic dropdown options from ERPNext
    const [academicYears, setAcademicYears] = useState([]);
    const [academicTerms, setAcademicTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [batches, setBatches] = useState([]);
    const [studentCategories, setStudentCategories] = useState([]);
    const [instructorsList, setInstructorsList] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchGroups();
        } else {
            setActiveTab('Details');
            fetchDropdownData();
            if (editingRecord) {
                fetchStudentGroup(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchGroups = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Group?fields=["name","student_group_name","academic_year","academic_term","group_based_on","program","batch","max_strength","disabled"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            setGroups(response.data.data || []);
        } catch (err) {
            console.error('Error fetching student groups:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [yearRes, termRes, programRes, batchRes, categoryRes, instructorRes] = await Promise.all([
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None&order_by=name desc'),
                API.get('/api/resource/Academic Term?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Batch?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Student Category?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Instructor?fields=["name","instructor_name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setAcademicYears((yearRes.data.data || []).map(y => y.name));
            setAcademicTerms((termRes.data.data || []).map(t => t.name));
            setPrograms((programRes.data.data || []).map(p => p.name));
            setBatches((batchRes.data.data || []).map(b => b.name));
            setStudentCategories((categoryRes.data.data || []).map(c => c.name));
            setInstructorsList((instructorRes.data.data || []).map(i => ({ name: i.name, instructor_name: i.instructor_name || i.name })));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchStudentGroup = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Group/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                academic_year: d.academic_year || '',
                academic_term: d.academic_term || '',
                group_based_on: d.group_based_on || '',
                program: d.program || '',
                student_group_name: d.student_group_name || '',
                batch: d.batch || '',
                max_strength: d.max_strength || 0,
                student_category: d.student_category || '',
                disabled: d.disabled ?? 0,
                instructors: d.instructors || [],
            });
        } catch (err) {
            console.error('Error fetching student group:', err);
            notification.error({ message: 'Error', description: 'Failed to load student group data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.academic_year) {
            notification.warning({ message: 'Academic Year is required.' });
            return;
        }
        if (!form.group_based_on) {
            notification.warning({ message: 'Group Based on is required.' });
            return;
        }
        if (!form.student_group_name) {
            notification.warning({ message: 'Student Group Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Student Group/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Student Group updated successfully.' });
            } else {
                await API.post('/api/resource/Student Group', payload);
                notification.success({ message: 'Student Group created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this student group?')) return;
        try {
            await API.delete(`/api/resource/Student Group/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Student Group deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Child table helpers ---
    const addInstructor = () => {
        setForm(prev => ({
            ...prev,
            instructors: [...prev.instructors, { instructor: '', instructor_name: '' }]
        }));
    };
    const updateInstructor = (idx, key, val) => {
        setForm(prev => {
            const insts = [...prev.instructors];
            insts[idx] = { ...insts[idx], [key]: val };
            if (key === 'instructor') {
                const found = instructorsList.find(il => il.name === val);
                if (found) insts[idx].instructor_name = found.instructor_name;
            }
            return { ...prev, instructors: insts };
        });
    };
    const removeInstructor = (idx) => {
        setForm(prev => ({ ...prev, instructors: prev.instructors.filter((_, i) => i !== idx) }));
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const statusColor = (s) => {
        if (!s) return 'bg-green-50 text-green-700';
        return 'bg-red-50 text-red-600';
    };

    if (view === 'list') {
        const filtered = groups.filter(g => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (g.name || '').toLowerCase().includes(q) ||
                (g.student_group_name || '').toLowerCase().includes(q) ||
                (g.academic_year || '').toLowerCase().includes(q) ||
                (g.program || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Student Group</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchGroups} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Student Group
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search ID, Name, Year or Program..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {groups.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 w-32">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Student Group Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Based on</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Academic Year</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600 text-right">Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Student Groups Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new group.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${statusColor(row.disabled)}`}>
                                                {row.disabled ? 'Disabled' : 'Enabled'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.student_group_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.group_based_on || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-right">{row.max_strength || '0'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading student group data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Student Group'}</span>
                    {!editingRecord ? (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-medium ${statusColor(form.disabled)}`}>
                            {form.disabled ? 'Disabled' : 'Enabled'}
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex gap-0 border-b border-gray-200">
                    {TABS.map(tab => (
                        <button key={tab}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab(tab)}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'Details' && (
                        <div className="space-y-6">
                            <div className="mb-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600"
                                        checked={!form.disabled} onChange={e => updateField('disabled', e.target.checked ? 0 : 1)} />
                                    Enabled
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
                                <div>
                                    <label className={labelStyle}>Academic Year *</label>
                                    <select className={inputStyle} value={form.academic_year} onChange={e => updateField('academic_year', e.target.value)}>
                                        <option value="">Select Year...</option>
                                        {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Academic Term</label>
                                    <select className={inputStyle} value={form.academic_term} onChange={e => updateField('academic_term', e.target.value)}>
                                        <option value="">Select Term...</option>
                                        {academicTerms.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Group Based on *</label>
                                    <select className={inputStyle} value={form.group_based_on} onChange={e => updateField('group_based_on', e.target.value)}>
                                        {GROUP_BASED_ON.map(g => <option key={g} value={g}>{g || '—'}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Program</label>
                                    <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                        <option value="">Select Program...</option>
                                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Student Group Name *</label>
                                    <input className={inputStyle} value={form.student_group_name} onChange={e => updateField('student_group_name', e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Batch</label>
                                    <select className={inputStyle} value={form.batch} onChange={e => updateField('batch', e.target.value)}>
                                        <option value="">Select Batch...</option>
                                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Max Strength</label>
                                    <input type="number" className={inputStyle} value={form.max_strength} onChange={e => updateField('max_strength', parseInt(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Student Category</label>
                                    <select className={inputStyle} value={form.student_category} onChange={e => updateField('student_category', e.target.value)}>
                                        <option value="">Select Category...</option>
                                        {studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Instructors' && (
                        <div className="space-y-6">
                            <h3 className="font-semibold text-gray-800 text-sm">Instructors</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left w-12">No.</th>
                                            <th className="px-3 py-2.5 text-left">Instructor *</th>
                                            <th className="px-3 py-2.5 text-left">Instructor Name</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.instructors.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic text-sm">No Instructors Added</td></tr>
                                        ) : (
                                            form.instructors.map((inst, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={inst.instructor} onChange={e => updateInstructor(idx, 'instructor', e.target.value)}>
                                                            <option value="">Select Instructor...</option>
                                                            {instructorsList.map(il => <option key={il.name} value={il.name}>{il.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-500">{inst.instructor_name || inst.instructor || '-'}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => removeInstructor(idx)} className="text-gray-400 hover:text-red-500 transition">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addInstructor}>
                                Add Row
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentGroup;
