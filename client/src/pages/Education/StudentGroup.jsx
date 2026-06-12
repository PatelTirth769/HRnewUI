import React, { useState, useEffect } from 'react';
import { notification, Select } from 'antd';
import API from '../../services/api';

const { Option } = Select;

const parseServerMessage = (err) => {
    const serverMsg = err?.response?.data?._server_messages;
    if (!serverMsg) return err?.response?.data?.message || err?.message || 'Request failed';
    try {
        const parsed = JSON.parse(serverMsg);
        const firstMsg = parsed?.[0];
        if (typeof firstMsg === 'string') return firstMsg;
        if (firstMsg && typeof firstMsg === 'object') {
            return firstMsg.message || JSON.stringify(firstMsg);
        }
        return err?.message || 'Request failed';
    } catch {
        return err?.message || 'Request failed';
    }
};

const TABS = ['Details', 'Instructors'];
const GROUP_BASED_ON = ['', 'Batch', 'Course', 'Activity'];

const emptyForm = () => ({
    academic_year: '',
    academic_term: '',
    group_based_on: '',
    program: '',
    custom_board: '',
    student_group_name: '',
    batch: '',
    course: '',
    max_strength: 0,
    student_category: '',
    disabled: 0,
    instructors: [],
    students: [],
    custom_class_teacher: '',
});

const StudentGroup = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [groups, setGroups] = useState([]);
    const [studentCountMap, setStudentCountMap] = useState({}); // { groupName: count }
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [filterBoard, setFilterBoard] = useState('');

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
    const [boards, setBoards] = useState([]);
    const [studentCategories, setStudentCategories] = useState([]);
    const [instructorsList, setInstructorsList] = useState([]);
    const [studentsList, setStudentsList] = useState([]);
    const [coursesList, setCoursesList] = useState([]);
    const [filteredStudentsList, setFilteredStudentsList] = useState([]);
    
    // Checkbox selection state for students child table
    const [selectedStudentIndices, setSelectedStudentIndices] = useState([]);

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

    useEffect(() => {
        if (view === 'form') {
            const fetchFilteredStudents = async () => {
                if (!form.academic_year) {
                    let fallbackList = studentsList;
                    if (form.custom_board) {
                        fallbackList = fallbackList.filter(s => s.custom_board === form.custom_board);
                    }
                    setFilteredStudentsList(fallbackList);
                    return;
                }
                try {
                    let peFilters = [["academic_year", "=", form.academic_year]];
                    if (form.academic_term) peFilters.push(["academic_term", "=", form.academic_term]);
                    if (form.program) peFilters.push(["program", "=", form.program]);
                    if (form.batch) peFilters.push(["student_batch", "=", form.batch]);
                    if (form.student_category) peFilters.push(["student_category", "=", form.student_category]);

                    const peUrl = `/api/resource/Program Enrollment?filters=${encodeURIComponent(JSON.stringify(peFilters))}&fields=["student","student_name"]&limit_page_length=None`;
                    const peRes = await API.get(peUrl);
                    const peStudents = peRes.data.data || [];

                    let enrolled = [];
                    if (form.group_based_on === 'Course' && form.course) {
                        const ceUrl = `/api/resource/Course Enrollment?filters=${encodeURIComponent(JSON.stringify([["course", "=", form.course]]))}&fields=["student","student_name"]&limit_page_length=None`;
                        const ceRes = await API.get(ceUrl);
                        const ceStudents = ceRes.data.data || [];
                        const peStudentIds = new Set(peStudents.map(s => s.student));
                        enrolled = ceStudents.filter(s => peStudentIds.size === 0 || peStudentIds.has(s.student));
                    } else {
                        enrolled = peStudents;
                    }

                    // Apply Board Filter locally
                    if (form.custom_board) {
                        const boardMap = {};
                        studentsList.forEach(s => { boardMap[s.name] = s.custom_board; });
                        enrolled = enrolled.filter(s => boardMap[s.student] === form.custom_board);
                    }

                    if (enrolled.length > 0) {
                        setFilteredStudentsList(enrolled.map(s => ({
                            name: s.student,
                            student_name: s.student_name || s.student
                        })));
                    } else {
                        setFilteredStudentsList([]);
                    }
                } catch (err) {
                    console.error("Error fetching filtered students:", err);
                    let fallbackList = studentsList;
                    if (form.custom_board) {
                        fallbackList = fallbackList.filter(s => s.custom_board === form.custom_board);
                    }
                    setFilteredStudentsList(fallbackList);
                }
            };
            fetchFilteredStudents();
        } else {
            setFilteredStudentsList([]);
        }
    }, [form.academic_year, form.academic_term, form.program, form.batch, form.student_category, form.course, form.group_based_on, form.custom_board, studentsList, view]);

    const fetchGroups = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Group?fields=["name","student_group_name","academic_year","academic_term","group_based_on","program","custom_board","batch","max_strength","disabled","custom_class_teacher"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            const groupData = response.data.data || [];
            setGroups(groupData);

            // Fetch student counts per group asynchronously by fetching the individual records
            // We do this in the background so it doesn't block the list render
            fetchStudentCounts(groupData);

            if (boards.length === 0) {
                const compRes = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } }));
                if (compRes.data?.data) {
                    setBoards(compRes.data.data.map(c => c.name));
                }
            }
        } catch (err) {
            console.error('Error fetching student groups:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchStudentCounts = async (groupData) => {
        try {
            // Fetch up to 50 groups to avoid overloading the server if the list is huge
            const groupsToFetch = groupData.slice(0, 100);
            const countPromises = groupsToFetch.map(g => 
                API.get(`/api/resource/Student Group/${encodeURIComponent(g.name)}`)
                   .then(res => ({ name: g.name, count: res.data.data?.students?.length || 0 }))
                   .catch(() => ({ name: g.name, count: 0 }))
            );
            
            const results = await Promise.all(countPromises);
            const countMap = {};
            results.forEach(r => {
                countMap[r.name] = r.count;
            });
            setStudentCountMap(countMap);
        } catch (err) {
            console.error('Error fetching student counts:', err);
        }
    };

    const fetchDropdownData = async () => {
        const safeGet = (url) => API.get(url).catch((err) => {
            console.error(`Failed to fetch ${url}:`, err);
            return { data: { data: [] } };
        });
        try {
            const [yearRes, termRes, programRes, batchRes, categoryRes, instructorRes, courseRes, studentRes, boardRes] = await Promise.all([
                safeGet('/api/resource/Academic Year?fields=["name"]&limit_page_length=None&order_by=name desc'),
                safeGet('/api/resource/Academic Term?fields=["name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Batch?fields=["name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Student Category?fields=["name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Instructor?fields=["name","instructor_name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Course?fields=["name"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Student?fields=["name","first_name","last_name","custom_board"]&limit_page_length=None&order_by=name asc'),
                safeGet('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setAcademicYears((yearRes.data.data || []).map(y => y.name));
            setAcademicTerms((termRes.data.data || []).map(t => t.name));
            setPrograms((programRes.data.data || []).map(p => p.name));
            setBatches((batchRes.data.data || []).map(b => b.name));
            setBoards((boardRes.data.data || []).map(b => b.name));
            setStudentCategories((categoryRes.data.data || []).map(c => c.name));
            setInstructorsList((instructorRes.data.data || []).map(i => ({ name: i.name, instructor_name: i.instructor_name || i.name })));
            setCoursesList((courseRes.data.data || []).map(c => c.name));
            setStudentsList((studentRes.data.data || []).map(s => ({
                name: s.name,
                student_name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                custom_board: s.custom_board || ''
            })));
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
                custom_board: d.custom_board || '',
                student_group_name: d.student_group_name || '',
                batch: d.batch || '',
                course: d.course || '',
                max_strength: d.max_strength || 0,
                student_category: d.student_category || '',
                disabled: d.disabled ?? 0,
                instructors: d.instructors || [],
                students: d.students || [],
                custom_class_teacher: d.custom_class_teacher || '',
            });
        } catch (err) {
            console.error('Error fetching student group:', err);
            notification.error({ message: 'Error', description: parseServerMessage(err) });
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
            const payload = {
                ...form,
                students: (form.students || []).map(s => {
                    const parsedRow = {
                        ...s,
                        active: s.active ? 1 : 0
                    };
                    if (s.group_roll_number !== undefined && s.group_roll_number !== null && s.group_roll_number !== '') {
                        const parsedNum = parseInt(s.group_roll_number);
                        if (!isNaN(parsedNum)) {
                            parsedRow.group_roll_number = parsedNum;
                        }
                    }
                    return parsedRow;
                })
            };
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
            notification.error({ message: 'Save Failed', description: parseServerMessage(err) });
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
            notification.error({ message: 'Delete Failed', description: parseServerMessage(err) });
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

    // --- Students Child Table Helpers ---
    const addStudentRow = () => {
        setForm(prev => ({
            ...prev,
            students: [...prev.students, { student: '', student_name: '', group_roll_number: String(prev.students.length + 1), active: 1 }]
        }));
    };

    const updateStudentRow = (idx, key, val) => {
        setForm(prev => {
            const studs = [...prev.students];
            studs[idx] = { ...studs[idx], [key]: val };
            if (key === 'student') {
                const found = studentsList.find(s => s.name === val);
                if (found) {
                    studs[idx].student_name = found.student_name;
                } else {
                    studs[idx].student_name = '';
                }
            }
            return { ...prev, students: studs };
        });
    };

    const removeStudentRow = (idx) => {
        setForm(prev => ({
            ...prev,
            students: prev.students.filter((_, i) => i !== idx)
        }));
        setSelectedStudentIndices(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    };

    const deleteSelectedStudents = () => {
        setForm(prev => ({
            ...prev,
            students: prev.students.filter((_, idx) => !selectedStudentIndices.includes(idx))
        }));
        setSelectedStudentIndices([]);
    };

    const handleSelectAllStudents = (checked) => {
        if (checked) {
            setSelectedStudentIndices(form.students.map((_, idx) => idx));
        } else {
            setSelectedStudentIndices([]);
        }
    };

    const handleSelectStudent = (idx, checked) => {
        if (checked) {
            setSelectedStudentIndices(prev => [...prev, idx]);
        } else {
            setSelectedStudentIndices(prev => prev.filter(i => i !== idx));
        }
    };

    const getStudents = async () => {
        if (!form.group_based_on) {
            notification.warning({ message: 'Group Based on is required.' });
            return;
        }
        if (form.group_based_on === 'Course' && !form.course) {
            notification.warning({ message: 'Course is required.' });
            return;
        }
        if (!form.academic_year) {
            notification.warning({ message: 'Academic Year is required.' });
            return;
        }

        setLoadingForm(true);
        try {
            let fetchedStudents = [];

            // 1. Fetch from Program Enrollment first (filters by year/term/program/batch/category)
            const peFilters = [["academic_year", "=", form.academic_year]];
            if (form.academic_term) peFilters.push(["academic_term", "=", form.academic_term]);
            if (form.program) peFilters.push(["program", "=", form.program]);
            if (form.batch) peFilters.push(["student_batch", "=", form.batch]);
            if (form.student_category) peFilters.push(["student_category", "=", form.student_category]);

            const peUrl = `/api/resource/Program Enrollment?filters=${encodeURIComponent(JSON.stringify(peFilters))}&fields=["student","student_name"]&limit_page_length=None`;
            const peRes = await API.get(peUrl);
            const peStudents = peRes.data.data || [];

            if (form.group_based_on === 'Course') {
                // Fetch from Course Enrollment
                const ceUrl = `/api/resource/Course Enrollment?filters=${encodeURIComponent(JSON.stringify([["course", "=", form.course]]))}&fields=["student","student_name"]&limit_page_length=None`;
                const ceRes = await API.get(ceUrl);
                const ceStudents = ceRes.data.data || [];

                // Intersect with Program Enrollment students to respect academic year/program/batch filters
                const peStudentIds = new Set(peStudents.map(s => s.student));
                fetchedStudents = ceStudents.filter(s => peStudentIds.size === 0 || peStudentIds.has(s.student));
            } else {
                fetchedStudents = peStudents;
            }

            if (fetchedStudents.length === 0) {
                notification.info({ message: 'No Students Found', description: 'No students found matching the selected criteria.' });
                return;
            }

            const newStudents = fetchedStudents.map((s, idx) => ({
                student: s.student,
                student_name: s.student_name || s.student,
                group_roll_number: String(idx + 1),
                active: 1
            }));

            setForm(prev => ({
                ...prev,
                students: newStudents
            }));
            setSelectedStudentIndices([]);
            notification.success({ message: 'Success', description: `Fetched ${newStudents.length} students.` });

        } catch (err) {
            console.error('Error fetching students:', err);
            notification.error({ message: 'Fetch Failed', description: parseServerMessage(err) });
        } finally {
            setLoadingForm(false);
        }
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
            if (filterBoard && g.custom_board !== filterBoard) return false;
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (g.name || '').toLowerCase().includes(q) ||
                (g.student_group_name || '').toLowerCase().includes(q) ||
                (g.academic_year || '').toLowerCase().includes(q) ||
                (g.program || '').toLowerCase().includes(q) ||
                (g.custom_board || '').toLowerCase().includes(q) ||
                (g.custom_class_teacher || '').toLowerCase().includes(q)
            );
        });

        const filterOptions = boards.length > 0 ? boards : [...new Set(groups.map(g => g.custom_board).filter(Boolean))];
        const hasActiveFilters = !!search || !!filterBoard;
        const clearFilters = () => {
            setSearch('');
            setFilterBoard('');
        };

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
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400" value={filterBoard} onChange={(e) => setFilterBoard(e.target.value)}>
                        <option value="">All Boards</option>
                        {filterOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
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
                                <th className="px-4 py-3 font-medium text-gray-600">Program (Class)</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Board</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Class Teacher</th>
                                <th className="px-4 py-3 font-medium text-gray-600 text-right">Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-16 text-gray-500">
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
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            {row.student_group_name || '-'}
                                            <span className="ml-1.5 text-[11px] text-gray-400 font-normal">
                                                ({studentCountMap[row.name] || 0})
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.group_based_on || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {row.custom_board ? <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">{row.custom_board}</span> : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.custom_class_teacher || '-'}</td>
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
                                {form.group_based_on === 'Course' && (
                                    <div>
                                        <label className={labelStyle}>Course *</label>
                                        <select className={inputStyle} value={form.course} onChange={e => updateField('course', e.target.value)}>
                                            <option value="">Select Course...</option>
                                            {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className={labelStyle}>Program (Class)</label>
                                    <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                        <option value="">Select Program...</option>
                                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Board</label>
                                    <select className={inputStyle} value={form.custom_board} onChange={e => updateField('custom_board', e.target.value)}>
                                        <option value="">Select Board...</option>
                                        {boards.map(b => <option key={b} value={b}>{b}</option>)}
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
                                <div>
                                    <label className={labelStyle}>Class Teacher</label>
                                    <select className={inputStyle} value={form.custom_class_teacher} onChange={e => updateField('custom_class_teacher', e.target.value)}>
                                        <option value="">Select Class Teacher...</option>
                                        {instructorsList.map(il => <option key={il.name} value={il.name}>{il.instructor_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6 mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 text-sm">Students</h3>
                                    <div className="flex gap-2">
                                        <button type="button" className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded hover:bg-gray-200 transition shadow-sm" onClick={getStudents}>
                                            Get Students
                                        </button>
                                        {selectedStudentIndices.length > 0 && (
                                            <button type="button" className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-semibold rounded hover:bg-red-100 transition shadow-sm" onClick={deleteSelectedStudents}>
                                                Delete Selected ({selectedStudentIndices.length})
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                            <tr>
                                                <th className="px-3 py-2.5 text-center w-10">
                                                    <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600 animate-none"
                                                        checked={form.students.length > 0 && selectedStudentIndices.length === form.students.length}
                                                        onChange={e => handleSelectAllStudents(e.target.checked)} />
                                                </th>
                                                <th className="px-3 py-2.5 text-left w-12">No.</th>
                                                <th className="px-3 py-2.5 text-left w-1/4">Student *</th>
                                                <th className="px-3 py-2.5 text-left w-1/4">Student Name</th>
                                                <th className="px-3 py-2.5 text-left w-1/4">Group Roll Number</th>
                                                <th className="px-3 py-2.5 text-center w-20">Active</th>
                                                <th className="px-3 py-2.5 text-center w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {form.students.length === 0 ? (
                                                <tr><td colSpan="7" className="text-center py-10 text-gray-400 italic text-sm">No Students Added</td></tr>
                                            ) : (
                                                form.students.map((s, idx) => (
                                                    <tr key={idx} className={`hover:bg-gray-50/50 ${selectedStudentIndices.includes(idx) ? 'bg-blue-50/20' : ''}`}>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600 animate-none"
                                                                checked={selectedStudentIndices.includes(idx)}
                                                                onChange={e => handleSelectStudent(idx, e.target.checked)} />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                                        <td className="px-3 py-2.5">
                                                            <Select
                                                                showSearch
                                                                className="w-full text-sm"
                                                                placeholder="Select Student..."
                                                                value={s.student || undefined}
                                                                onChange={val => updateStudentRow(idx, 'student', val)}
                                                                optionFilterProp="children"
                                                                dropdownRender={menu => (
                                                                    <div>
                                                                        {menu}
                                                                        <div className="p-2 border-t border-gray-100 text-xs text-gray-400 italic">
                                                                            Filters applied for Group Based On = {form.group_based_on || '—'}, Academic Year = {form.academic_year || '—'}, Program = {form.program || '—'}, Student Group = {form.student_group_name || '—'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            >
                                                                {filteredStudentsList.map(sl => (
                                                                    <Option key={sl.name} value={sl.name}>{sl.student_name || sl.name}</Option>
                                                                ))}
                                                            </Select>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-500">{s.student_name || '-'}</td>
                                                        <td className="px-3 py-2.5">
                                                            <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                                value={s.group_roll_number || ''} onChange={e => updateStudentRow(idx, 'group_roll_number', e.target.value)} />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4 accent-blue-600 animate-none"
                                                                checked={!!s.active} onChange={e => updateStudentRow(idx, 'active', e.target.checked ? 1 : 0)} />
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <button type="button" onClick={() => removeStudentRow(idx)} className="text-gray-400 hover:text-red-500 transition">✕</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 flex items-center gap-3 flex-wrap">
                                    <button type="button" className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addStudentRow}>
                                        Add Row
                                    </button>
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-sm text-gray-600 shadow-sm">
                                        <span className="font-semibold text-xs text-gray-500 uppercase tracking-wide">Add Multiple Students:</span>
                                        <Select
                                            mode="multiple"
                                            style={{ minWidth: '280px', maxWidth: '400px' }}
                                            placeholder="Search and add multiple..."
                                            value={[]}
                                            onChange={selectedValues => {
                                                if (selectedValues && selectedValues.length > 0) {
                                                    setForm(prev => {
                                                        const newStudents = [...prev.students];
                                                        selectedValues.forEach(val => {
                                                            if (!newStudents.some(st => st.student === val)) {
                                                                const found = studentsList.find(st => st.name === val);
                                                                newStudents.push({
                                                                    student: val,
                                                                    student_name: found ? found.student_name : '',
                                                                    group_roll_number: String(newStudents.length + 1),
                                                                    active: 1
                                                                });
                                                            }
                                                        });
                                                        return { ...prev, students: newStudents };
                                                    });
                                                }
                                            }}
                                            optionFilterProp="children"
                                        >
                                            {filteredStudentsList.map(sl => (
                                                <Option key={sl.name} value={sl.name}>{sl.student_name || sl.name}</Option>
                                            ))}
                                        </Select>
                                    </div>
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
