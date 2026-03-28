import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    program_name: '',
    program_abbreviation: '',
    department: '',
    courses: [], // Child table: Program Course
});

const Program = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [programs, setPrograms] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [departments, setDepartments] = useState([]);
    const [allCourses, setAllCourses] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchPrograms();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchProgram(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchPrograms = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Program?fields=["name","program_abbreviation","department"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setPrograms(response.data.data || []);
        } catch (err) {
            console.error('Error fetching programs:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [deptRes, courseRes] = await Promise.all([
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Course?fields=["name","course_name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setDepartments((deptRes.data.data || []).map(d => d.name));
            setAllCourses((courseRes.data.data || []).map(c => ({ name: c.name, title: c.course_name || c.name })));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchProgram = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Program/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                program_name: d.name || '',
                program_abbreviation: d.program_abbreviation || '',
                department: d.department || '',
                courses: (d.courses || []).map(c => ({
                    course: c.course || '',
                    course_name: c.course_name || '',
                    mandatory: c.mandatory || 0,
                    name: c.name // child record name
                })),
            });
        } catch (err) {
            console.error('Error fetching program:', err);
            notification.error({ message: 'Error', description: 'Failed to load program data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // Child Table Actions
    const addCourseRow = () => {
        setForm(prev => ({
            ...prev,
            courses: [...prev.courses, { course: '', course_name: '', mandatory: 0 }]
        }));
    };

    const removeCourseRow = (index) => {
        const newCourses = [...form.courses];
        newCourses.splice(index, 1);
        setForm(prev => ({ ...prev, courses: newCourses }));
    };

    const updateCourseRow = (index, field, value) => {
        const newCourses = [...form.courses];
        newCourses[index][field] = value;

        // Auto-fill course name if course is selected
        if (field === 'course') {
            const selected = allCourses.find(c => c.name === value);
            newCourses[index]['course_name'] = selected ? selected.title : '';
        }

        setForm(prev => ({ ...prev, courses: newCourses }));
    };

    const handleSave = async () => {
        if (!form.program_name) {
            notification.warning({ message: 'Program Name is required.' });
            return;
        }

        // Validate child table
        for (const c of form.courses) {
            if (!c.course) {
                notification.warning({ message: 'All course rows must have a Course selected.' });
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                program_name: form.program_name,
                program_abbreviation: form.program_abbreviation,
                department: form.department || null,
                courses: form.courses.map(c => ({
                    course: c.course,
                    mandatory: c.mandatory ? 1 : 0
                }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Program/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Program updated successfully.' });
            } else {
                await API.post('/api/resource/Program', payload);
                notification.success({ message: 'Program created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this program?')) return;
        try {
            await API.delete(`/api/resource/Program/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Program deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles (Standard App UI) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = programs.filter(p => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (p.name || '').toLowerCase().includes(q) ||
                (p.program_abbreviation || '').toLowerCase().includes(q) ||
                (p.department || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Program</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchPrograms} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Program
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Name, Abbr or Dept..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {programs.length}</div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">Program Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Abbreviation</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Programs Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new program.</p>
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
                                        <td className="px-4 py-3 text-gray-600 font-medium">
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] uppercase">{row.program_abbreviation || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.department || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading program data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header (Standard App UI) */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Program'}</span>
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

            {/* Form Card (Standard App UI) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                    <div>
                        <label className={labelStyle}>Program Name *</label>
                        <input type="text" className={inputStyle} value={form.program_name} onChange={e => updateField('program_name', e.target.value)} placeholder="e.g. Bachelor of Science" />
                    </div>
                    <div>
                        <label className={labelStyle}>Program Abbreviation</label>
                        <input type="text" className={inputStyle} value={form.program_abbreviation} onChange={e => updateField('program_abbreviation', e.target.value)} placeholder="e.g. B.Sc" />
                    </div>
                    <div>
                        <label className={labelStyle}>Department</label>
                        <select className={inputStyle} value={form.department} onChange={e => updateField('department', e.target.value)}>
                            <option value="">Select Department...</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Courses Child Table */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm mb-4">Program Courses</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                <tr>
                                    <th className="px-3 py-2.5 text-left w-12">No.</th>
                                    <th className="px-3 py-2.5 text-left">Course *</th>
                                    <th className="px-3 py-2.5 text-left">Course Name</th>
                                    <th className="px-3 py-2.5 text-center w-28">Mandatory</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {form.courses.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic text-sm">No Courses Added</td></tr>
                                ) : (
                                    form.courses.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                    value={row.course} onChange={e => updateCourseRow(idx, 'course', e.target.value)}>
                                                    <option value="">Select Course...</option>
                                                    {allCourses.map(c => <option key={c.name} value={c.name}>{c.title}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500">{row.course_name || row.course || '-'}</td>
                                            <td className="px-3 py-2.5 text-center">
                                                <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600"
                                                    checked={!!row.mandatory} onChange={e => updateCourseRow(idx, 'mandatory', e.target.checked ? 1 : 0)} />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeCourseRow(idx)} className="text-gray-400 hover:text-red-500 transition">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addCourseRow}>
                        Add Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Program;
