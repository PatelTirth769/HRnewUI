import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import { useUserRole } from '../../hooks/useUserRole';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';

const emptyForm = () => ({
    program_enrollment: '',
    course: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    student: '',
});

const CourseEnrollment = () => {
    const { isCoordinator } = useUserRole();
    const coordinatorScope = useCoordinatorScope();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [enrollmentList, setEnrollmentList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        programEnrollments: [],
        courses: [],
        students: [],
    });

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        if (view === 'list') {
            fetchEnrollmentList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchEnrollment(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord, isCoordinator, coordinatorScope.loading]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [peRes, cRes, sRes] = await Promise.all([
                safeGet('/api/resource/Program Enrollment?fields=["name","program","student"]&limit_page_length=None'),
                safeGet('/api/resource/Course?limit_page_length=None'),
                safeGet('/api/resource/Student?fields=["name","first_name","last_name","custom_board"]&limit_page_length=None'),
            ]);
            let students = sRes.data.data || [];
            let programEnrollments = peRes.data.data || [];
            
            if (isCoordinator && !coordinatorScope.loading) {
                const ctPrograms = coordinatorScope.programs || [];
                const ctBoards = coordinatorScope.boards || [];
                if (ctPrograms.length > 0) {
                    programEnrollments = programEnrollments.filter(pe => ctPrograms.includes(pe.program));
                    const allowedStudents = programEnrollments.map(pe => pe.student);
                    students = students.filter(s => allowedStudents.includes(s.name));
                } else if (ctBoards.length > 0) {
                    students = students.filter(s => ctBoards.includes(s.custom_board));
                    const allowedStudents = students.map(s => s.name);
                    programEnrollments = programEnrollments.filter(pe => allowedStudents.includes(pe.student));
                }
            }

            setDropdowns({
                programEnrollments: programEnrollments.map(d => d.name) || [],
                courses: cRes.data.data?.map(d => d.name) || [],
                students: students.map(d => ({
                    id: d.name,
                    name: `${d.first_name || ''} ${d.last_name || ''}`.trim()
                })) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchEnrollmentList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Course Enrollment?fields=["name","student","student_name","course","enrollment_date","program_enrollment"]&limit_page_length=None&order_by=enrollment_date desc';
            const response = await API.get(url);
            let enrollments = response.data.data || [];
            if (isCoordinator && !coordinatorScope.loading) {
                const ctPrograms = coordinatorScope.programs || [];
                const ctBoards = coordinatorScope.boards || [];
                if (ctPrograms.length > 0 || ctBoards.length > 0) {
                     // Filter via students in dropdowns (we fetched and filtered them already)
                     // Re-use the fetched dropdowns
                     const safeGet = (u) => API.get(u).catch(() => ({ data: { data: [] } }));
                     const [peRes, sRes] = await Promise.all([
                         safeGet('/api/resource/Program Enrollment?fields=["name","program","student"]&limit_page_length=None'),
                         safeGet('/api/resource/Student?fields=["name","custom_board"]&limit_page_length=None'),
                     ]);
                     let programEnrollments = peRes.data.data || [];
                     let studentsList = sRes.data.data || [];
                     
                     if (ctPrograms.length > 0) {
                         const allowedStudents = programEnrollments.filter(pe => ctPrograms.includes(pe.program)).map(pe => pe.student);
                         enrollments = enrollments.filter(e => allowedStudents.includes(e.student));
                     } else if (ctBoards.length > 0) {
                         const allowedStudents = studentsList.filter(s => ctBoards.includes(s.custom_board)).map(s => s.name);
                         enrollments = enrollments.filter(e => allowedStudents.includes(e.student));
                     }
                }
            }
            setEnrollmentList(enrollments);
        } catch (err) {
            console.error('Error fetching enrollment list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchEnrollment = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Course Enrollment/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching enrollment:', err);
            notification.error({ message: 'Error', description: 'Failed to load enrollment data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student || !form.course || !form.enrollment_date) {
            notification.warning({ message: 'Missing Fields', description: 'Student, Course and Enrollment Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Course Enrollment/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Enrollment updated successfully.' });
            } else {
                await API.post('/api/resource/Course Enrollment', form);
                notification.success({ message: 'Course Enrollment created successfully.' });
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
            await API.delete(`/api/resource/Course Enrollment/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Enrollment deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";

    if (view === 'list') {
        const filtered = enrollmentList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.student || '').toLowerCase().includes(q) ||
                (s.student_name || '').toLowerCase().includes(q) ||
                (s.course || '').toLowerCase().includes(q) ||
                (s.name || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Course Enrollment</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchEnrollmentList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Enrollment
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Student, Course..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Course</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Enrollment Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Program Enrollment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Data is loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No enrollment records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <button className="text-blue-600 hover:text-blue-800" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800">{row.student_name || row.student}</div>
                                            <div className="text-[10px] text-gray-400">{row.student}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.course}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.enrollment_date}</td>
                                        <td className="px-4 py-3 text-gray-400 italic">{row.program_enrollment || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24">Fetching record details...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `Edit ${editingRecord}` : 'New Course Enrollment'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold uppercase tracking-widest shadow-sm">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center bg-white shadow-sm transition-all" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 flex items-center shadow-sm transition-all" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-sm transition-all" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-10">
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Program Enrollment *</label>
                        <select className={inputStyle} value={form.program_enrollment} onChange={e => setForm({ ...form, program_enrollment: e.target.value })}>
                            <option value="">Select Program Enrollment</option>
                            {dropdowns.programEnrollments.map(pe => <option key={pe} value={pe}>{pe}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Course *</label>
                        <select className={inputStyle} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                            <option value="">Select Course</option>
                            {dropdowns.courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Enrollment Date *</label>
                        <input type="date" className={inputStyle} value={form.enrollment_date} onChange={e => setForm({ ...form, enrollment_date: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
                            <option value="">Select Student</option>
                            {dropdowns.students.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseEnrollment;
