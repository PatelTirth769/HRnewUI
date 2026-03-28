import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    student: '',
    program: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    academic_year: '',
    academic_term: '',
    student_category: '',
    school_house: '',
    student_batch: '',
    boarding_student: 0,
    
    // Child Tables
    courses: [], // { course: '', course_name: '' }
    fees: [], // { academic_term: '', fee_schedule: '', student_category: '', due_date: '', amount: 0 }
});

const ProgramEnrollment = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);
    const [activeTab, setActiveTab] = useState('Details');

    // List states
    const [enrollments, setEnrollments] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        students: [],
        programs: [],
        academicYears: [],
        academicTerms: [],
        studentCategories: [],
        schoolHouses: [],
        studentBatches: [],
        courses: [],
        feeSchedules: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchEnrollments();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchEnrollment(editingRecord);
            } else {
                setForm(emptyForm());
                setActiveTab('Details');
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const [sRes, pRes, yRes, tRes, cRes, hRes, bRes, csRes, fsRes] = await Promise.all([
                API.get('/api/resource/Student?limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Student Category?limit_page_length=None'),
                API.get('/api/resource/School House?limit_page_length=None'),
                API.get('/api/resource/Student Batch Name?limit_page_length=None'),
                API.get('/api/resource/Course?limit_page_length=None'),
                API.get('/api/resource/Fee Schedule?limit_page_length=None'),
            ]);
            setDropdowns({
                students: sRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                academicYears: yRes.data.data?.map(d => d.name) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                studentCategories: cRes.data.data?.map(d => d.name) || [],
                schoolHouses: hRes.data.data?.map(d => d.name) || [],
                studentBatches: bRes.data.data?.map(d => d.name) || [],
                courses: csRes.data.data || [],
                feeSchedules: fsRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchEnrollments = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Program Enrollment?fields=["name","student","program","academic_year","enrollment_date"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setEnrollments(response.data.data || []);
        } catch (err) {
            console.error('Error fetching enrollments:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchEnrollment = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Program Enrollment/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                student: d.student || '',
                program: d.program || '',
                enrollment_date: d.enrollment_date || '',
                academic_year: d.academic_year || '',
                academic_term: d.academic_term || '',
                student_category: d.student_category || '',
                school_house: d.school_house || '',
                student_batch: d.student_batch || '',
                boarding_student: d.boarding_student || 0,
                
                courses: (d.courses || []).map(c => ({
                    course: c.course || '',
                    course_name: c.course_name || ''
                })),
                fees: (d.fees || []).map(f => ({
                    academic_term: f.academic_term || '',
                    fee_schedule: f.fee_schedule || '',
                    student_category: f.student_category || '',
                    due_date: f.due_date || '',
                    amount: f.amount || 0
                })),
            });
        } catch (err) {
            console.error('Error fetching enrollment:', err);
            notification.error({ message: 'Error', description: 'Failed to load enrollment data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Enrolled Courses ---
    const addCourseRow = () => {
        setForm(prev => ({
            ...prev,
            courses: [...prev.courses, { course: '', course_name: '' }]
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
        if (field === 'course') {
            const courseObj = dropdowns.courses.find(c => c.name === value);
            newCourses[index]['course_name'] = courseObj ? courseObj.course_name : '';
        }
        setForm(prev => ({ ...prev, courses: newCourses }));
    };

    // --- Fees ---
    const addFeeRow = () => {
        setForm(prev => ({
            ...prev,
            fees: [...prev.fees, { academic_term: '', fee_schedule: '', student_category: '', due_date: '', amount: 0 }]
        }));
    };

    const removeFeeRow = (index) => {
        const newFees = [...form.fees];
        newFees.splice(index, 1);
        setForm(prev => ({ ...prev, fees: newFees }));
    };

    const updateFeeRow = (index, field, value) => {
        const newFees = [...form.fees];
        newFees[index][field] = value;
        setForm(prev => ({ ...prev, fees: newFees }));
    };

    const handleSave = async () => {
        if (!form.student) {
            notification.warning({ message: 'Student is required.' });
            return;
        }
        if (!form.program) {
            notification.warning({ message: 'Program is required.' });
            return;
        }
        if (!form.enrollment_date) {
            notification.warning({ message: 'Enrollment Date is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Program Enrollment/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Program Enrollment updated.' });
            } else {
                await API.post('/api/resource/Program Enrollment', payload);
                notification.success({ message: 'Program Enrollment created.' });
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
        if (!window.confirm('Are you sure you want to delete this enrollment?')) return;
        try {
            await API.delete(`/api/resource/Program Enrollment/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Program Enrollment deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const tabStyle = (name) => `px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === name ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

    if (view === 'list') {
        const filtered = enrollments.filter(e => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (e.name || '').toLowerCase().includes(q) ||
                (e.student || '').toLowerCase().includes(q) ||
                (e.program || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Program Enrollment</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchEnrollments} disabled={loadingList}>
                            ⟳ Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Enrollment
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Student, Program or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Student</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">{row.student}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.program}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.enrollment_date}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.academic_year}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20">Loading enrollment...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Program Enrollment'}</span>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-100 text-red-600 font-medium">Not Saved</span>}
                </div>
                <div className="flex gap-2">
                    <button className="p-2 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50" onClick={() => setView('list')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    {editingRecord && <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100" onClick={handleDelete}>Delete</button>}
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b bg-gray-50/50 px-4 pt-2 gap-4">
                    <div className={tabStyle('Details')} onClick={() => setActiveTab('Details')}>Details</div>
                    <div className={tabStyle('Fees')} onClick={() => setActiveTab('Fees')}>Fees</div>
                </div>

                <div className="p-8">
                    {activeTab === 'Details' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Student *</label>
                                        <select className={inputStyle} value={form.student} onChange={e => updateField('student', e.target.value)}>
                                            <option value="">Select Student</option>
                                            {dropdowns.students.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Enrollment Date *</label>
                                        <input type="date" className={inputStyle} value={form.enrollment_date} onChange={e => updateField('enrollment_date', e.target.value)} />
                                    </div>
                                    <div className="pt-2">
                                        <label className={labelStyle}>Student Category</label>
                                        <select className={inputStyle} value={form.student_category} onChange={e => updateField('student_category', e.target.value)}>
                                            <option value="">Select Category</option>
                                            {dropdowns.studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Student Batch</label>
                                        <select className={inputStyle} value={form.student_batch} onChange={e => updateField('student_batch', e.target.value)}>
                                            <option value="">Select Batch</option>
                                            {dropdowns.studentBatches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Program *</label>
                                        <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                            <option value="">Select Program</option>
                                            {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
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
                                    <div>
                                        <label className={labelStyle}>School House</label>
                                        <select className={inputStyle} value={form.school_house} onChange={e => updateField('school_house', e.target.value)}>
                                            <option value="">Select House</option>
                                            {dropdowns.schoolHouses.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <input type="checkbox" id="boarding" className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer" checked={!!form.boarding_student} onChange={e => updateField('boarding_student', e.target.checked ? 1 : 0)} />
                                        <label htmlFor="boarding" className="text-[13px] text-gray-700 font-medium cursor-pointer">Boarding Student</label>
                                    </div>
                                    <p className="text-[11px] text-gray-400 -mt-1 ml-6">Check this if the Student is residing at the Institute's Hostel.</p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-8">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4">Enrolled courses</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 border-b">
                                            <tr>
                                                <th className="px-3 py-2 text-left w-12 font-normal text-gray-400 text-[11px] uppercase tracking-wider">No.</th>
                                                <th className="px-3 py-2 text-left">Course *</th>
                                                <th className="px-3 py-2 text-left">Course Name</th>
                                                <th className="px-3 py-2 text-center w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {form.courses.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center py-6 text-gray-400 italic">No Data</td></tr>
                                            ) : (
                                                form.courses.map((row, idx) => (
                                                    <tr key={idx} className="group hover:bg-gray-50/50">
                                                        <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                        <td className="px-3 py-2.5">
                                                            <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.course} onChange={e => updateCourseRow(idx, 'course', e.target.value)}>
                                                                <option value="">Select Course</option>
                                                                {dropdowns.courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <input type="text" className="w-full border border-gray-100 rounded px-2 py-1 text-sm bg-gray-50" value={row.course_name} readOnly />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <button onClick={() => removeCourseRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold">✕</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addCourseRow}>Add Row</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Fees' && (
                        <div className="animate-in fade-in duration-300">
                             <h3 className="text-sm font-semibold text-gray-800 mb-4">Fees</h3>
                             <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b">
                                        <tr>
                                            <th className="px-3 py-2 text-left w-12 font-normal text-gray-400 text-[11px] uppercase tracking-wider">No.</th>
                                            <th className="px-3 py-2 text-left">Academic Term</th>
                                            <th className="px-3 py-2 text-left">Fee Schedule *</th>
                                            <th className="px-3 py-2 text-left">Student Category</th>
                                            <th className="px-3 py-2 text-left">Due Date</th>
                                            <th className="px-3 py-2 text-left">Amount</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {form.fees.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-10 text-gray-400 italic">No Data</td></tr>
                                        ) : (
                                            form.fees.map((row, idx) => (
                                                <tr key={idx} className="group hover:bg-gray-50/50">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.academic_term} onChange={e => updateFeeRow(idx, 'academic_term', e.target.value)}>
                                                            <option value="">Select Term</option>
                                                            {dropdowns.academicTerms.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.fee_schedule} onChange={e => updateFeeRow(idx, 'fee_schedule', e.target.value)}>
                                                            <option value="">Select Schedule</option>
                                                            {dropdowns.feeSchedules.map(f => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.student_category} onChange={e => updateFeeRow(idx, 'student_category', e.target.value)}>
                                                            <option value="">Select Category</option>
                                                            {dropdowns.studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input type="date" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.due_date} onChange={e => updateFeeRow(idx, 'due_date', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.amount} onChange={e => updateFeeRow(idx, 'amount', e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => removeFeeRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                             </div>
                             <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addFeeRow}>Add Row</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgramEnrollment;
