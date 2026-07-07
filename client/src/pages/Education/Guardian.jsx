import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import { resolveInstructorId, fetchInstructorGroupDetails } from '../../utility/instructorHelper';
import { useUserRole } from '../../hooks/useUserRole';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';

const emptyForm = () => ({
    guardian_name: '',
    education: '',
    email_address: '',
    occupation: '',
    mobile_number: '',
    designation: '',
    alternate_number: '',
    work_address: '',
    date_of_birth: '',
    user_id: '',
    students: [],
    interests: [],
});

const Guardian = () => {
    const userRole = localStorage.getItem('userRole');
    const { isCoordinator } = useUserRole();
    const coordinatorScope = useCoordinatorScope();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [guardians, setGuardians] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        if (view === 'list') {
            fetchGuardians();
        } else {
            if (editingRecord) {
                fetchGuardian(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord, isCoordinator, coordinatorScope.loading]);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [search, pageSize]);

    const fetchGuardians = async () => {
        try {
            setLoadingList(true);
            const userEmail = localStorage.getItem('user');

            if (userRole === 'Instructor') {
                const instructorId = await resolveInstructorId(userEmail);
                if (instructorId) {
                    const groupDetails = await fetchInstructorGroupDetails(instructorId);
                    const studentIds = groupDetails.studentIds;

                    if (studentIds.length > 0) {
                        try {
                            const filterUri = `/api/resource/Guardian?filters=[["Guardian Student","student","in",${JSON.stringify(studentIds)}]]&fields=["name","guardian_name","email_address","mobile_number","occupation"]&limit_page_length=None&order_by=modified desc`;
                            const response = await API.get(filterUri);
                            setGuardians(response.data.data || []);
                        } catch (filterErr) {
                            console.warn("Child table filter failed, falling back to local filtration:", filterErr.message);
                            const response = await API.get('/api/resource/Guardian?fields=["name","guardian_name","email_address","mobile_number","occupation"]&limit_page_length=None&order_by=modified desc');
                            const allGuardians = response.data.data || [];

                            const studentDetailPromises = studentIds.map(id => API.get(`/api/resource/Student/${encodeURIComponent(id)}`));
                            const studentDetails = await Promise.all(studentDetailPromises);
                            const guardianIds = Array.from(new Set(
                                studentDetails.flatMap(res => (res.data.data?.guardians || []).map(g => g.guardian).filter(Boolean))
                            ));

                            const filtered = allGuardians.filter(g => guardianIds.includes(g.name));
                            setGuardians(filtered);
                        }
                    } else {
                        setGuardians([]);
                    }
                } else {
                    setGuardians([]);
                }
            } else if (isCoordinator && !coordinatorScope.loading) {
                // Coordinator: fetch students in assigned programs, then get their guardians
                const ctPrograms = coordinatorScope.programs || [];
                const ctBoards = coordinatorScope.boards || [];

                if (ctPrograms.length > 0 || ctBoards.length > 0) {
                    try {
                        // Get students enrolled in coordinator's programs
                        let enrollFilter = [];
                        if (ctPrograms.length > 0) {
                            enrollFilter.push(["program", "in", ctPrograms]);
                        }
                        const enrollRes = await API.get(`/api/resource/Program Enrollment?filters=${JSON.stringify(enrollFilter)}&fields=["student"]&limit_page_length=None`);
                        const studentIds = [...new Set((enrollRes.data.data || []).map(e => e.student))];

                        if (studentIds.length > 0) {
                            // Try child table filter first
                            try {
                                const filterUri = `/api/resource/Guardian?filters=[["Guardian Student","student","in",${JSON.stringify(studentIds)}]]&fields=["name","guardian_name","email_address","mobile_number","occupation"]&limit_page_length=None&order_by=modified desc`;
                                const response = await API.get(filterUri);
                                setGuardians(response.data.data || []);
                            } catch (filterErr) {
                                // Fallback: fetch all guardians and filter locally
                                const response = await API.get('/api/resource/Guardian?fields=["name","guardian_name","email_address","mobile_number","occupation"]&limit_page_length=None&order_by=modified desc');
                                const allGuardians = response.data.data || [];
                                const batchSize = 10;
                                const guardianIds = new Set();
                                for (let i = 0; i < studentIds.length; i += batchSize) {
                                    const batch = studentIds.slice(i, i + batchSize);
                                    const promises = batch.map(id => API.get(`/api/resource/Student/${encodeURIComponent(id)}`).catch(() => null));
                                    const results = await Promise.all(promises);
                                    results.forEach(res => {
                                        if (res?.data?.data?.guardians) {
                                            res.data.data.guardians.forEach(g => { if (g.guardian) guardianIds.add(g.guardian); });
                                        }
                                    });
                                }
                                setGuardians(allGuardians.filter(g => guardianIds.has(g.name)));
                            }
                        } else {
                            setGuardians([]);
                        }
                    } catch (err) {
                        console.error('Coordinator guardian fetch error:', err);
                        setGuardians([]);
                    }
                } else {
                    setGuardians([]);
                }
            } else {
                const url = '/api/resource/Guardian?fields=["name","guardian_name","email_address","mobile_number","occupation"]&limit_page_length=None&order_by=modified desc';
                const response = await API.get(url);
                setGuardians(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching guardians:', err);
        } finally {
            setLoadingList(false);
        }
    };


    const fetchGuardian = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Guardian/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                guardian_name: d.guardian_name || '',
                education: d.education || '',
                email_address: d.email_address || '',
                occupation: d.occupation || '',
                mobile_number: d.mobile_number || '',
                designation: d.designation || '',
                alternate_number: d.alternate_number || '',
                work_address: d.work_address || '',
                date_of_birth: d.date_of_birth || '',
                user_id: d.user_id || '',
                students: d.students || [],
                interests: d.interests || [],
            });
        } catch (err) {
            console.error('Error fetching guardian:', err);
            notification.error({ message: 'Error', description: 'Failed to load guardian data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!form.guardian_name) {
            notification.warning({ message: 'Guardian Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Guardian/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Guardian updated successfully.' });
            } else {
                await API.post('/api/resource/Guardian', payload);
                notification.success({ message: 'Guardian created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this guardian?')) return;
        try {
            await API.delete(`/api/resource/Guardian/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Guardian deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child table helpers
    const addInterestRow = () => {
        setForm(prev => ({
            ...prev,
            interests: [...prev.interests, { interest: '' }]
        }));
    };
    const updateInterestRow = (idx, val) => {
        setForm(prev => {
            const interests = [...prev.interests];
            interests[idx] = { ...interests[idx], interest: val };
            return { ...prev, interests };
        });
    };
    const removeInterestRow = (idx) => {
        setForm(prev => ({ ...prev, interests: prev.interests.filter((_, i) => i !== idx) }));
    };

    // --- Styles (Standard App UI) ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = guardians.filter(row => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (row.name || '').toLowerCase().includes(q) ||
                (row.guardian_name || '').toLowerCase().includes(q) ||
                (row.email_address || '').toLowerCase().includes(q) ||
                (row.occupation || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Guardians</h1>
                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchGuardians} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        {userRole !== 'Instructor' && (
                            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                                + Add Guardian
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-80" placeholder="Search ID, Name, Occupation or Email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {search && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={() => setSearch('')}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {guardians.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto w-full">
                    <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Guardian Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Email Address</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Mobile Number</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Occupation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Guardians Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new guardian.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, visibleCount).map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.guardian_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-medium italic">{row.email_address || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.mobile_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.occupation || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    {!loadingList && filtered.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50/30 border-t border-gray-100">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                {[20, 100, 500, 2500].map(size => (
                                    <button
                                        key={size}
                                        className={`px-4 py-1.5 text-xs font-bold border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition cursor-pointer ${
                                            pageSize === size ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
                                        }`}
                                        onClick={() => setPageSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {visibleCount < filtered.length && (
                                <button
                                    className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                    onClick={() => setVisibleCount(prev => prev + pageSize)}
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Form View
    if (loadingForm) {
        return <div className="p-6 max-w-5xl mx-auto text-center py-20 text-gray-400 italic font-medium">Loading guardian data...</div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? form.guardian_name || editingRecord : 'New Guardian'}</span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
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
                        <label className={labelStyle}>Guardian Name *</label>
                        <input className={inputStyle} value={form.guardian_name} onChange={e => updateField('guardian_name', e.target.value)} placeholder="Full Name" />
                    </div>
                    <div>
                        <label className={labelStyle}>Education</label>
                        <input className={inputStyle} value={form.education} onChange={e => updateField('education', e.target.value)} placeholder="Qualification" />
                    </div>
                    <div>
                        <label className={labelStyle}>Email Address</label>
                        <input type="email" className={inputStyle} value={form.email_address} onChange={e => updateField('email_address', e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div>
                        <label className={labelStyle}>Occupation</label>
                        <input className={inputStyle} value={form.occupation} onChange={e => updateField('occupation', e.target.value)} placeholder="Occupation" />
                    </div>
                    <div>
                        <label className={labelStyle}>Mobile Number</label>
                        <input className={inputStyle} value={form.mobile_number} onChange={e => updateField('mobile_number', e.target.value)} placeholder="+91 ..." />
                    </div>
                    <div>
                        <label className={labelStyle}>Designation</label>
                        <input className={inputStyle} value={form.designation} onChange={e => updateField('designation', e.target.value)} placeholder="Designation" />
                    </div>
                    <div>
                        <label className={labelStyle}>Alternate Number</label>
                        <input className={inputStyle} value={form.alternate_number} onChange={e => updateField('alternate_number', e.target.value)} />
                    </div>
                    <div className="row-span-2">
                        <label className={labelStyle}>Work Address</label>
                        <textarea className={`${inputStyle} h-24 resize-none`} value={form.work_address} onChange={e => updateField('work_address', e.target.value)} placeholder="Full Address" />
                    </div>
                    <div>
                        <label className={labelStyle}>Date of Birth</label>
                        <input type="date" className={inputStyle} value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider">Guardian Of</h3>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto max-w-2xl w-full">
                        <table className="w-full text-sm whitespace-nowrap min-w-[500px]">
                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                <tr>
                                    <th className="px-3 py-2.5 text-left w-12">No.</th>
                                    <th className="px-3 py-2.5 text-left">Student</th>
                                    <th className="px-3 py-2.5 text-left">Student Name</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {(!form.students || form.students.length === 0) ? (
                                    <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic text-sm">No Students Linked</td></tr>
                                ) : (
                                    form.students.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors not-italic">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-700">{student.student}</td>
                                            <td className="px-3 py-2.5 text-gray-600">{student.student_name}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider">Guardian Interests</h3>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto max-w-2xl w-full">
                        <table className="w-full text-sm whitespace-nowrap min-w-[500px]">
                            <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                <tr>
                                    <th className="px-3 py-2.5 text-left w-12">No.</th>
                                    <th className="px-3 py-2.5 text-left">Interest Name *</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {form.interests.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic text-sm">No Interests Listed</td></tr>
                                ) : (
                                    form.interests.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors group not-italic">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <input className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400" value={log.interest || ''} onChange={e => updateInterestRow(idx, e.target.value)} placeholder="e.g. Reading, Sports" />
                                            </td>
                                            <td className="px-3 py-2.5 text-center text-red-100 group-hover:text-red-400">
                                                <button onClick={() => removeInterestRow(idx)} className="font-bold transition">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addInterestRow}>
                        Add Interest Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Guardian;
