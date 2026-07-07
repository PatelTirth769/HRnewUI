import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import { resolveInstructorId } from '../../utility/instructorHelper';
import { FiEdit2, FiTrash2, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const STATUSES = ['Active', 'Left'];
const GENDERS = ['', 'Male', 'Female', 'Other'];

const emptyForm = () => ({
    instructor_name: '',
    status: 'Active',
    employee: '',
    naming_series: 'EDU-INS-.YYYY.-',
    gender: '',
    department: '',
    instructor_email: '',
    instructor_log: [],
    custom_mobile_number: '',
    custom_student_group: '',
});

const Instructor = () => {
    const userRole = localStorage.getItem('userRole');
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [instructors, setInstructors] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic dropdown options from ERPNext
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [academicTerms, setAcademicTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [studentGroups, setStudentGroups] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchInstructors();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchInstructor(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchInstructors = async () => {
        try {
            setLoadingList(true);
            const userEmail = localStorage.getItem('user');

            const url = '/api/resource/Instructor?fields=["name","instructor_name","employee","department","gender","status","instructor_email","custom_mobile_number","custom_student_group"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            let rawInstructors = response.data.data || [];

            if (userRole === 'Instructor') {
                const instructorId = await resolveInstructorId(userEmail);
                if (instructorId) {
                    rawInstructors = rawInstructors.filter(ins => ins.name === instructorId);
                } else {
                    rawInstructors = [];
                }
            }

            setInstructors(rawInstructors);
        } catch (err) {
            console.error('Error fetching instructors:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [deptRes, empRes, ayRes, atRes, progRes, courseRes, sgRes] = await Promise.all([
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Employee?fields=["name","employee_name","company_email","personal_email","user_id","cell_number"]&limit_page_length=None&order_by=employee_name asc'),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Academic Term?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Course?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Student Group?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setDepartments((deptRes.data.data || []).map(d => d.name));
            setEmployees((empRes.data.data || []).map(e => ({
                name: e.name,
                employee_name: e.employee_name || e.name,
                email: e.company_email || e.personal_email || e.user_id || '',
                cell_number: e.cell_number || ''
            })));
            setAcademicYears((ayRes.data.data || []).map(a => a.name));
            setAcademicTerms((atRes.data.data || []).map(a => a.name));
            setPrograms((progRes.data.data || []).map(p => p.name));
            setCourses((courseRes.data.data || []).map(c => c.name));
            setStudentGroups((sgRes.data.data || []).map(s => s.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchInstructor = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Instructor/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                instructor_name: d.instructor_name || '',
                status: d.status || 'Active',
                employee: d.employee || '',
                naming_series: d.naming_series || 'EDU-INS-.YYYY.-',
                gender: d.gender || '',
                department: d.department || '',
                instructor_email: d.instructor_email || '',
                instructor_log: d.instructor_log || [],
                custom_mobile_number: d.custom_mobile_number || '',
                custom_student_group: d.custom_student_group || '',
            });
        } catch (err) {
            console.error('Error fetching instructor:', err);
            notification.error({ message: 'Error', description: 'Failed to load instructor data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => {
            const updated = { ...prev, [key]: value };
            // Auto-fill instructor_name, email, and mobile when employee is selected
            if (key === 'employee') {
                const found = employees.find(e => e.name === value);
                if (found) {
                    updated.instructor_name = found.employee_name;
                    if (found.email) {
                        updated.instructor_email = found.email;
                    }
                    if (found.cell_number) {
                        updated.custom_mobile_number = found.cell_number;
                    }
                }
            }
            return updated;
        });
    };

    const handleSave = async () => {
        if (!form.instructor_name) {
            notification.warning({ message: 'Instructor Name is required.' });
            return;
        }
        if (!form.instructor_email) {
            notification.warning({ message: 'Instructor Email is required.' });
            return;
        }
        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.instructor_email)) {
            notification.warning({ message: 'Please enter a valid email address.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            let instructorId = editingRecord;

            if (editingRecord) {
                await API.put(`/api/resource/Instructor/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Instructor updated successfully.' });
            } else {
                const res = await API.post('/api/resource/Instructor', payload);
                instructorId = res.data.data.name;
                notification.success({ message: 'Instructor created successfully.' });
            }

            // Explicitly sync/update User's mobile number in ERP
            if (form.instructor_email) {
                try {
                    const userPayload = {
                        mobile_no: form.custom_mobile_number ? String(form.custom_mobile_number).trim() : null,
                        role_profile_name: 'Instructor',
                        module_profile: 'Instructor',
                        enabled: 1,
                        roles: [{ role: 'Instructor' }]
                    };
                    const email = form.instructor_email.trim();
                    try {
                        await API.put(`/api/resource/User/${encodeURIComponent(email)}`, userPayload);
                    } catch (uErr) {
                        if (uErr.response?.status === 404) {
                            await API.post('/api/resource/User', {
                                email: email,
                                first_name: form.instructor_name || 'Instructor',
                                send_welcome_email: 0,
                                ...userPayload
                            });
                        }
                    }
                } catch (uSyncErr) {
                    console.warn('[User Sync] Silent fail:', uSyncErr.message);
                }
            }



            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const targetId = id || editingRecord;
        if (!targetId) return;
        if (!window.confirm(`Are you sure you want to delete instructor "${targetId}"?`)) return;
        try {
            await API.delete(`/api/resource/Instructor/${encodeURIComponent(targetId)}`);
            notification.success({ message: 'Instructor deleted.' });
            if (view === 'list') {
                fetchInstructors();
            } else {
                setView('list');
            }
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Instructor Log child table helpers
    const addLogRow = () => {
        setForm(prev => ({
            ...prev,
            instructor_log: [...prev.instructor_log, { academic_year: '', academic_term: '', program: '', course: '' }]
        }));
    };
    const updateLogRow = (idx, key, val) => {
        setForm(prev => {
            const logs = [...prev.instructor_log];
            logs[idx] = { ...logs[idx], [key]: val };
            return { ...prev, instructor_log: logs };
        });
    };
    const removeLogRow = (idx) => {
        setForm(prev => ({ ...prev, instructor_log: prev.instructor_log.filter((_, i) => i !== idx) }));
    };

    // Export logic
    const handleExport = (format) => {
        const filtered = instructors.filter(row => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (row.name || '').toLowerCase().includes(q) ||
                (row.instructor_name || '').toLowerCase().includes(q) ||
                (row.employee || '').toLowerCase().includes(q) ||
                (row.department || '').toLowerCase().includes(q) ||
                (row.instructor_email || '').toLowerCase().includes(q)
            );
        });

        if (!filtered || filtered.length === 0) {
            notification.warning({ message: 'No data to export' });
            return;
        }

        const exportData = filtered.map(row => ({
            ID: row.name,
            Instructor_Name: row.instructor_name || '-',
            Email: row.instructor_email || '-',
            Status: row.status || 'Active',
            Employee: row.employee || '-',
            Gender: row.gender || '-',
            Department: row.department || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Instructors");

        if (format === 'csv') {
            XLSX.writeFile(workbook, `Instructors_${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            XLSX.writeFile(workbook, `Instructors_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
        
        notification.success({ message: `Exported as ${format.toUpperCase()} successfully` });
    };

    // --- Styles (Standard App UI) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = instructors.filter(row => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (row.name || '').toLowerCase().includes(q) ||
                (row.instructor_name || '').toLowerCase().includes(q) ||
                (row.employee || '').toLowerCase().includes(q) ||
                (row.department || '').toLowerCase().includes(q) ||
                (row.instructor_email || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Instructors</h1>
                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 cursor-pointer" onClick={() => handleExport('csv')} disabled={loadingList}>
                            <FiDownload className="w-4 h-4 text-blue-600" /> CSV
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 cursor-pointer" onClick={() => handleExport('excel')} disabled={loadingList}>
                            <FiDownload className="w-4 h-4 text-green-600" /> Excel
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchInstructors} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        {userRole !== 'Instructor' && (
                            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                                + Add Instructor
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-80" placeholder="Search ID, Name, Employee or Dept..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {instructors.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto w-full">
                    <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Instructor Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Employee</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Gender</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                                <th className="px-4 py-3 font-medium text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Instructors Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new instructor.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                        <td className="px-4 py-3 font-semibold text-blue-600">{row.name}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.instructor_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.instructor_email || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                row.status === 'Active' ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                                            }`}>
                                                {row.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.employee || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.gender || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.department || '-'}</td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setEditingRecord(row.name); setView('form'); }} 
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer border border-blue-100"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                {userRole !== 'Instructor' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(row.name); }} 
                                                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer border border-red-100"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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
        return <div className="p-6 max-w-5xl mx-auto text-center py-20 text-gray-400 italic font-medium">Loading instructor data...</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? form.instructor_name || editingRecord : 'New Instructor'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                    )}
                    {editingRecord && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                            form.status === 'Active' ? 'bg-[#DEF7EC] text-[#03543F] border-[#BCF0DA]' : 'bg-[#FDE2E2] text-[#9B1C1C] border-[#F8B4B4]'
                        }`}>
                            {form.status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && userRole !== 'Instructor' && (
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={handleDelete}>Delete</button>
                    )}
                    {userRole !== 'Instructor' && (
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                    <div>
                        <label className={labelStyle}>Instructor Name *</label>
                        <input className={inputStyle} value={form.instructor_name} onChange={e => updateField('instructor_name', e.target.value)} placeholder="Full Name" />
                    </div>
                    <div>
                        <label className={labelStyle}>Status</label>
                        <select className={inputStyle} value={form.status} onChange={e => updateField('status', e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Employee</label>
                        <select className={inputStyle} value={form.employee} onChange={e => updateField('employee', e.target.value)}>
                            <option value="">Select Employee...</option>
                            {employees.map(e => <option key={e.name} value={e.name}>{e.name} — {e.employee_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Naming Series</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)}>
                            <option value="EDU-INS-.YYYY.-">EDU-INS-.YYYY.-</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Gender</label>
                        <select className={inputStyle} value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                            {GENDERS.map(g => <option key={g} value={g}>{g || 'Select Gender...'}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Department</label>
                        <select className={inputStyle} value={form.department} onChange={e => updateField('department', e.target.value)}>
                            <option value="">Select Department...</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Instructor Email *</label>
                        <input type="email" className={inputStyle} value={form.instructor_email} onChange={e => updateField('instructor_email', e.target.value)} placeholder="Email Address" />
                    </div>
                    <div></div>
                    <div>
                        <label className={labelStyle}>Mobile number</label>
                        <input className={inputStyle} value={form.custom_mobile_number} onChange={e => updateField('custom_mobile_number', e.target.value)} placeholder="Mobile Number" />
                    </div>
                    <div></div>
                    <div>
                        <label className={labelStyle}>Student Group</label>
                        <select className={inputStyle} value={form.custom_student_group} onChange={e => updateField('custom_student_group', e.target.value)}>
                            <option value="">Select Student Group...</option>
                            {studentGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                        </select>
                    </div>
                    <div></div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider">Instructor Log</h3>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto w-full">
                        <table className="w-full text-sm whitespace-nowrap min-w-[500px]">
                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                <tr>
                                    <th className="px-3 py-2.5 text-left w-12">No.</th>
                                    <th className="px-3 py-2.5 text-left">Academic Year *</th>
                                    <th className="px-3 py-2.5 text-left">Academic Term</th>
                                    <th className="px-3 py-2.5 text-left font-bold text-blue-600">Program (Class) *</th>
                                    <th className="px-3 py-2.5 text-left">Course</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {form.instructor_log.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic text-sm">No History Logged</td></tr>
                                ) : (
                                    form.instructor_log.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group not-italic">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={log.academic_year || ''} onChange={e => updateLogRow(idx, 'academic_year', e.target.value)}>
                                                    <option value="">—</option>
                                                    {academicYears.map(ay => <option key={ay} value={ay}>{ay}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={log.academic_term || ''} onChange={e => updateLogRow(idx, 'academic_term', e.target.value)}>
                                                    <option value="">—</option>
                                                    {academicTerms.map(at => <option key={at} value={at}>{at}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-blue-200 rounded px-2 py-1.5 text-sm bg-blue-50/30 focus:outline-none font-medium" value={log.program || ''} onChange={e => updateLogRow(idx, 'program', e.target.value)}>
                                                    <option value="">—</option>
                                                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none" value={log.course || ''} onChange={e => updateLogRow(idx, 'course', e.target.value)}>
                                                    <option value="">—</option>
                                                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeLogRow(idx)} className="text-gray-300 hover:text-red-500 font-bold transition opacity-0 group-hover:opacity-100">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addLogRow}>
                        Add History Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Instructor;
