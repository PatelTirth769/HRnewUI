import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiArrowLeft, FiSave, FiList, FiCheckCircle, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { useUserRole } from '../../hooks/useUserRole';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';
import { resolveInstructorId, fetchInstructorGroupDetails } from '../../utility/instructorHelper';

const RollGRAssign = () => {
    const navigate = useNavigate();
    const { isCoordinator } = useUserRole();
    const coordinatorScope = useCoordinatorScope();

    // Filters
    const [selectedProgram, setSelectedProgram] = useState('');
    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');

    // Dropdown Data
    const [programs, setPrograms] = useState([]);
    const [boards, setBoards] = useState([]);
    const [allStudentGroups, setAllStudentGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);

    // Data
    const [students, setStudents] = useState([]);
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
    
    // Sort State
    const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });

    // Custom Toast
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);
    const showToast = (type, title, desc) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ type, title, desc });
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    };

    // ─── Fetch Masters ───
    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;

        const fetchMasters = async () => {
            setLoadingMasters(true);
            try {
                const userRole = localStorage.getItem('userRole');
                const userEmail = localStorage.getItem('user');

                const [pRes, sgRes, bRes] = await Promise.all([
                    API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Student Group?fields=["name","program","custom_board","custom_class_teacher"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                    API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                ]);
                
                let progs = pRes.data.data?.map(d => ({ value: d.name, label: d.name, custom_board: d.custom_board })) || [];
                let groups = sgRes.data.data?.map(d => ({ value: d.name, label: d.name, program: d.program, custom_board: d.custom_board, custom_class_teacher: d.custom_class_teacher })) || [];
                const fetchedBoards = bRes.data.data?.map(c => c.name) || [];

                // ─── Apply RBAC Filters ───
                if (userRole === 'Instructor') {
                    const instructorId = await resolveInstructorId(userEmail);
                    if (instructorId) {
                        const groupDetails = await fetchInstructorGroupDetails(instructorId);
                        const validGroupNames = groupDetails.allGroups.map(g => g.name);
                        groups = groups.filter(sg => validGroupNames.includes(sg.value));
                    } else {
                        groups = [];
                    }
                    // Filter programs to only those where the instructor has a student group
                    const instructorPrograms = [...new Set(groups.map(sg => sg.program))];
                    progs = progs.filter(p => instructorPrograms.includes(p.value));
                } else if (isCoordinator && !coordinatorScope.loading) {
                    groups = groups.filter(sg => coordinatorScope.programs.includes(sg.program));
                    progs = progs.filter(p => coordinatorScope.programs.includes(p.value));
                }

                const studentBoards = [...new Set(groups.map(g => g.custom_board).filter(Boolean))];
                
                setPrograms(progs);
                setAllStudentGroups(groups);
                setFilteredGroups(groups);
                setBoards([...new Set([...fetchedBoards, ...studentBoards])].sort());
            } catch (err) {
                console.error('Error fetching masters:', err);
                showToast('error', 'Master Data Error', 'Could not load master lists.');
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
    }, [isCoordinator, coordinatorScope.loading]);

    // ─── Filter Groups on Program/Board Change ───
    useEffect(() => {
        let filtered = allStudentGroups;
        if (selectedProgram) {
            filtered = filtered.filter(g => g.program === selectedProgram);
        }
        if (selectedBoard) {
            filtered = filtered.filter(g => g.custom_board === selectedBoard);
        }
        setFilteredGroups(filtered);
        setSelectedGroup('');
        setStudents([]);
    }, [selectedProgram, selectedBoard, allStudentGroups]);

    // ─── Get Students ───
    const handleGetStudents = async () => {
        if (!selectedGroup || !selectedProgram || !selectedBoard) {
            showToast('warning', 'Selection Required', 'Please select Board, Program, and Student Group.');
            return;
        }

        setFetchingStudents(true);
        try {
            // 1. Get student IDs in this group from ERPNext
            const sgRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(selectedGroup)}`);
            const groupStudents = sgRes.data.data.students || [];
            
            if (groupStudents.length === 0) {
                showToast('info', 'No Students', 'No students found in this Student Group.');
                setStudents([]);
                return;
            }

            const erpStudentIds = groupStudents.map(s => s.student);

            // 2. Query Firestore Admissions for these students
            // Since `in` queries have a max of 10, we'll fetch by Program/Board and filter client-side.
            const admissionsRef = collection(db, 'schooler_system/enquiry_management/final_admissions');
            const q = query(
                admissionsRef,
                where('program', '==', selectedProgram),
                where('custom_board', '==', selectedBoard)
            );
            const snapshot = await getDocs(q);
            const allAdmissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // 3. Filter only those in the current group
            let groupAdmissions = allAdmissions.filter(a => erpStudentIds.includes(a.erp_student_id));

            // Also check if some students don't have erp_student_id but have the exact same group
            // (If FinalAdmission Form didn't save student_group, we rely strictly on erp_student_id mapped from Frappe)

            if (groupAdmissions.length === 0) {
                showToast('warning', 'Sync Issue', 'Students exist in ERPNext group but could not be found in Firestore admissions. Please verify sync.');
                setStudents([]);
                return;
            }

            // Clean up missing fields for sorting and store original values for change detection
            const mapped = groupAdmissions.map(s => {
                const fname = s.first_name || '';
                const mname = s.middle_name || '';
                const lname = s.last_name || '';
                const fullName = `${fname} ${mname} ${lname}`.replace(/\s+/g, ' ').trim();
                return {
                    ...s,
                    first_name: fname,
                    middle_name: mname,
                    last_name: lname,
                    full_name: fullName,
                    roll_number: s.roll_number || '',
                    gr_number: s.gr_number || '',
                    original_roll_number: s.roll_number || '',
                    original_gr_number: s.gr_number || ''
                };
            });

            setStudents(mapped);
            handleSort('full_name', mapped);
            showToast('success', 'Students Loaded', `Loaded ${mapped.length} students for assignment.`);

        } catch (err) {
            console.error('Error fetching students:', err);
            showToast('error', 'Fetch Failed', 'Failed to retrieve students.');
        } finally {
            setFetchingStudents(false);
        }
    };

    // ─── Sort Logic ───
    const handleSort = (key, dataList = students) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        const sorted = [...dataList].sort((a, b) => {
            const aVal = (a[key] || '').toLowerCase();
            const bVal = (b[key] || '').toLowerCase();
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setStudents(sorted);
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // ─── Edit Handlers ───
    const handleInputChange = (id, field, value) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    // ─── Auto Assign Roll Numbers ───
    const handleAutoAssignRollNo = () => {
        if (students.length === 0) return;
        const confirmAuto = window.confirm("This will overwrite all currently visible Roll Numbers starting from 1 sequentially down the list based on current sort order. Continue?");
        if (!confirmAuto) return;

        setStudents(prev => prev.map((s, index) => ({
            ...s,
            roll_number: (index + 1).toString()
        })));
    };

    // ─── Save All Logic ───
    const handleSaveAll = async () => {
        if (students.length === 0) return;

        // Filter only students whose roll_number or gr_number has changed
        const studentsToUpdate = students.filter(s => 
            s.roll_number !== s.original_roll_number || 
            s.gr_number !== s.original_gr_number
        );

        if (studentsToUpdate.length === 0) {
            showToast('info', 'No Changes', 'No new Roll or GR numbers were modified.');
            return;
        }

        setSaving(true);
        setSaveProgress({ done: 0, total: studentsToUpdate.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < studentsToUpdate.length; i++) {
            const student = studentsToUpdate[i];
            
            try {
                // 1. Update ERPNext Student record
                if (student.erp_student_id) {
                    await API.put(`/api/resource/Student/${encodeURIComponent(student.erp_student_id)}`, {
                        roll_number: student.roll_number,
                        gr_number: student.gr_number
                    });
                }

                // 2. Update Firestore Final Admissions
                await updateDoc(doc(db, 'schooler_system/enquiry_management/final_admissions', student.id), {
                    roll_number: student.roll_number,
                    gr_number: student.gr_number
                });

                // 3. Update Firestore Registrations (if registrationId exists)
                if (student.registrationId) {
                    await updateDoc(doc(db, 'schooler_system/enquiry_management/registrations', student.registrationId), {
                        roll_number: student.roll_number,
                        gr_number: student.gr_number
                    });
                } else if (student.registrationNo) {
                    // Try to find by registrationNo if registrationId is missing
                    const regQ = query(collection(db, 'schooler_system/enquiry_management/registrations'), where('registrationNo', '==', student.registrationNo));
                    const snap = await getDocs(regQ);
                    if (!snap.empty) {
                        await updateDoc(doc(db, 'schooler_system/enquiry_management/registrations', snap.docs[0].id), {
                            roll_number: student.roll_number,
                            gr_number: student.gr_number
                        });
                    }
                }

                // Update the original values so subsequent saves don't re-process them
                setStudents(prev => prev.map(s => s.id === student.id ? { 
                    ...s, 
                    original_roll_number: student.roll_number, 
                    original_gr_number: student.gr_number 
                } : s));

                successCount++;
            } catch (err) {
                console.error(`Error saving for student ${student.first_name}:`, err);
                failCount++;
            }
            
            setSaveProgress({ done: i + 1, total: studentsToUpdate.length });
        }

        setSaving(false);
        if (failCount === 0) {
            showToast('success', 'Assigned Successfully', `${successCount} students updated successfully across ERPNext, Admissions, and Registrations.`);
        } else {
            showToast('warning', 'Partial Success', `${successCount} updated successfully, ${failCount} failed. Check console for details.`);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* ── Custom Toast ── */}
            {toast && (
                <div
                    onClick={() => setToast(null)}
                    style={{
                        position: 'fixed',
                        top: '24px',
                        right: '24px',
                        zIndex: 99999,
                        minWidth: '320px',
                        maxWidth: '420px',
                        borderRadius: '10px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        animation: 'slideIn 0.3s ease',
                        background:
                            toast.type === 'success' ? '#f0fdf4' :
                            toast.type === 'warning' ? '#fffbeb' :
                            toast.type === 'error'   ? '#fef2f2' : '#eff6ff',
                        border:
                            toast.type === 'success' ? '1px solid #86efac' :
                            toast.type === 'warning' ? '1px solid #fde68a' :
                            toast.type === 'error'   ? '1px solid #fca5a5' : '1px solid #93c5fd',
                    }}
                >
                    <span style={{ fontSize: '20px', lineHeight: '1', marginTop: '1px' }}>
                        {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: '700',
                            fontSize: '14px',
                            color: toast.type === 'success' ? '#166534' : toast.type === 'warning' ? '#92400e' : toast.type === 'error' ? '#991b1b' : '#1e40af',
                            marginBottom: '3px',
                        }}>
                            {toast.title}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                            {toast.desc}
                        </div>
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1' }}>×</span>
                </div>
            )}
            <style>{`@keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
                        title="Go Back"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Roll & GR Number Assignment</h2>
                </div>
                
                <div className="flex items-center gap-3">
                    {saving && (
                        <span className="text-xs text-gray-500 font-medium animate-pulse flex items-center gap-2">
                            <FiRefreshCw className="animate-spin" />
                            Saving {saveProgress.done}/{saveProgress.total}...
                        </span>
                    )}
                    <button
                        className="h-9 px-6 rounded-md font-bold text-sm shadow-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2"
                        onClick={handleSaveAll}
                        disabled={students.length === 0 || saving}
                    >
                        <FiSave />
                        {saving ? 'Saving...' : 'Save Assignments'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                    {/* Board */}
                    <div>
                        <label className={labelStyle}>Board <span className="text-red-500">*</span></label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            style={{ height: '38px' }}
                            value={selectedBoard}
                            onChange={e => setSelectedBoard(e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Board</option>
                            {boards.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Program */}
                    <div>
                        <label className={labelStyle}>Program / Class <span className="text-red-500">*</span></label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            style={{ height: '38px' }}
                            value={selectedProgram}
                            onChange={e => setSelectedProgram(e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Program</option>
                            {programs.filter(p => !selectedBoard || p.custom_board === selectedBoard).map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Group */}
                    <div>
                        <label className={labelStyle}>Student Group <span className="text-red-500">*</span></label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                            style={{ height: '38px' }}
                            value={selectedGroup}
                            onChange={e => {
                                setSelectedGroup(e.target.value);
                                setStudents([]);
                            }}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Student Group</option>
                            {filteredGroups.map(g => (
                                <option key={g.value} value={g.value}>{g.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Fetch Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        className="h-9 px-5 text-[13px] font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-40 shadow-sm flex items-center gap-2"
                        onClick={handleGetStudents}
                        disabled={fetchingStudents || !selectedGroup || !selectedProgram || !selectedBoard}
                    >
                        {fetchingStudents ? <FiRefreshCw className="animate-spin" /> : <FiList />}
                        {fetchingStudents ? 'Fetching...' : 'Get Students'}
                    </button>
                    {students.length > 0 && (
                        <span className="text-xs text-gray-500 font-medium bg-gray-200 px-3 py-1 rounded-full">
                            {students.length} Students Listed
                        </span>
                    )}
                </div>
            </div>

            {/* Students List */}
            {students.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <span className="text-sm font-bold text-gray-700">Assignment Editor</span>
                        <button 
                            className="text-[12px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                            onClick={handleAutoAssignRollNo}
                        >
                            Auto-Assign Sequential Roll Nos
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200">
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[50px]">#</th>
                                    <th 
                                        className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors w-[50%]"
                                        onClick={() => handleSort('full_name')}
                                    >
                                        Full Name <span className="ml-1 text-gray-400">{getSortIcon('full_name')}</span>
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[20%]">
                                        Roll No.
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-[20%]">
                                        GR No.
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => (
                                    <tr key={student.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-3 text-[12px] font-mono text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3 text-[14px] font-semibold text-gray-800">{student.full_name || '-'}</td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                value={student.roll_number}
                                                onChange={(e) => handleInputChange(student.id, 'roll_number', e.target.value)}
                                                placeholder="e.g. 1"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input 
                                                type="text" 
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                value={student.gr_number}
                                                onChange={(e) => handleInputChange(student.id, 'gr_number', e.target.value)}
                                                placeholder="e.g. GR-2026-01"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {students.length === 0 && selectedGroup && !fetchingStudents && (
                <div className="mt-8 text-center px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FiUsers className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Students Loaded</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Click 'Get Students' to load the students for the selected group.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RollGRAssign;
