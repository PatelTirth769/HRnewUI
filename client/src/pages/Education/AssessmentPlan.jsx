import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    student_group: '',
    program: '',
    assessment_name: '',
    course: '',
    assessment_group: '',
    academic_year: '',
    grading_scale: '',
    academic_term: '',
    schedule_date: new Date().toISOString().split('T')[0],
    from_time: '',
    to_time: '',
    room: '',
    examiner: '',
    supervisor: '',
    maximum_assessment_score: 0,
    assessment_criteria: [],
});

const AssessmentPlan = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [planList, setPlanList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        studentGroups: [],
        programs: [],
        courses: [],
        assessmentGroups: [],
        academicYears: [],
        gradingScales: [],
        academicTerms: [],
        rooms: [],
        instructors: [],
        criteriaOptions: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchPlanList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchPlan(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(() => ({ data: { data: [] } }));
            const [sgRes, pRes, cRes, agRes, ayRes, gsRes, atRes, rRes, iRes, critRes] = await Promise.all([
                safeGet('/api/resource/Student Group?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Course?limit_page_length=None'),
                safeGet('/api/resource/Assessment Group?limit_page_length=None'),
                safeGet('/api/resource/Academic Year?limit_page_length=None'),
                safeGet('/api/resource/Grading Scale?limit_page_length=None'),
                safeGet('/api/resource/Academic Term?limit_page_length=None'),
                safeGet('/api/resource/Room?limit_page_length=None'),
                safeGet('/api/resource/Instructor?limit_page_length=None'),
                safeGet('/api/resource/Assessment Criteria?limit_page_length=None'),
            ]);
            setDropdowns({
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                courses: cRes.data.data?.map(d => d.name) || [],
                assessmentGroups: agRes.data.data?.map(d => d.name) || [],
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                gradingScales: gsRes.data.data?.map(d => d.name) || [],
                academicTerms: atRes.data.data?.map(d => d.name) || [],
                rooms: rRes.data.data?.map(d => d.name) || [],
                instructors: iRes.data.data?.map(d => d.name) || [],
                criteriaOptions: critRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchPlanList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Assessment Plan?fields=["name","student_group","course","assessment_name","schedule_date"]&limit_page_length=None&order_by=schedule_date desc';
            const response = await API.get(url);
            setPlanList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching plan list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchPlan = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Assessment Plan/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            console.error('Error fetching plan:', err);
            notification.error({ message: 'Error', description: 'Failed to load assessment plan.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handleSave = async () => {
        if (!form.student_group || !form.course || !form.assessment_group || !form.grading_scale || !form.schedule_date || !form.from_time || !form.to_time) {
            notification.warning({ message: 'Missing Fields', description: 'Please fill all required (*) fields.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Assessment Plan/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Assessment Plan updated successfully.' });
            } else {
                await API.post('/api/resource/Assessment Plan', form);
                notification.success({ message: 'Assessment Plan created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this assessment plan?')) return;
        try {
            await API.delete(`/api/resource/Assessment Plan/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Assessment Plan deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Handlers
    const addCriteriaRow = () => {
        const newCriteria = [...(form.assessment_criteria || []), { assessment_criteria: '', maximum_score: 0 }];
        setForm({ ...form, assessment_criteria: newCriteria });
    };

    const removeCriteriaRow = (index) => {
        const newCriteria = form.assessment_criteria.filter((_, i) => i !== index);
        setForm({ ...form, assessment_criteria: newCriteria });
    };

    const updateCriteriaRow = (index, field, value) => {
        const newCriteria = [...form.assessment_criteria];
        newCriteria[index][field] = value;
        setForm({ ...form, assessment_criteria: newCriteria });
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white hover:border-gray-400";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";
    const sectionTitleStyle = "text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-6 block";

    if (view === 'list') {
        const filtered = planList.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.student_group || '').toLowerCase().includes(q) ||
                (s.course || '').toLowerCase().includes(q) ||
                (s.assessment_name || '').toLowerCase().includes(q) ||
                (s.name || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessment Plan</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchPlanList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-bold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Assessment Plan
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Group, Course, Plan..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student Group</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Course</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Assessment Name</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Syncing plans...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No plans found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{row.student_group}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.course}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.assessment_name || '-'}</td>
                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{row.schedule_date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24 font-bold uppercase tracking-widest">LOADING ASSESSMENT PLAN...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-40">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `EDIT ${editingRecord}` : 'NEW ASSESSMENT PLAN'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-widest">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center bg-white shadow-sm transition-all" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-md text-sm font-semibold hover:bg-red-100 flex items-center shadow-sm transition-all" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-50 shadow-sm transition-all" onClick={handleSave} disabled={saving}>
                        {saving ? 'Processing...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-12">
                {/* Basic Details */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Student Group *</label>
                        <select className={inputStyle} value={form.student_group} onChange={e => setForm({ ...form, student_group: e.target.value })}>
                            <option value="">Select Group</option>
                            {dropdowns.studentGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Program</label>
                        <select className={inputStyle} value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}>
                            <option value="">Select Program</option>
                            {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Assessment Name</label>
                        <input type="text" className={inputStyle} value={form.assessment_name} onChange={e => setForm({ ...form, assessment_name: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelStyle}>Course *</label>
                        <select className={inputStyle} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                            <option value="">Select Course</option>
                            {dropdowns.courses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Assessment Group *</label>
                        <select className={inputStyle} value={form.assessment_group} onChange={e => setForm({ ...form, assessment_group: e.target.value })}>
                            <option value="">Select Assessment Group</option>
                            {dropdowns.assessmentGroups.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Year</label>
                        <select className={inputStyle} value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })}>
                            <option value="">Select Academic Year</option>
                            {dropdowns.academicYears.map(ay => <option key={ay} value={ay}>{ay}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Grading Scale *</label>
                        <select className={inputStyle} value={form.grading_scale} onChange={e => setForm({ ...form, grading_scale: e.target.value })}>
                            <option value="">Select Grading Scale</option>
                            {dropdowns.gradingScales.map(gs => <option key={gs} value={gs}>{gs}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Term</label>
                        <select className={inputStyle} value={form.academic_term} onChange={e => setForm({ ...form, academic_term: e.target.value })}>
                            <option value="">Select Academic Term</option>
                            {dropdowns.academicTerms.map(at => <option key={at} value={at}>{at}</option>)}
                        </select>
                    </div>
                </div>

                {/* Schedule Section */}
                <div>
                    <h3 className={sectionTitleStyle}>Schedule</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <label className={labelStyle}>Schedule Date *</label>
                            <input type="date" className={inputStyle} value={form.schedule_date} onChange={e => setForm({ ...form, schedule_date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>From Time *</label>
                            <input type="time" className={inputStyle} value={form.from_time} onChange={e => setForm({ ...form, from_time: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Room</label>
                            <select className={inputStyle} value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                                <option value="">Select Room</option>
                                {dropdowns.rooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>To Time *</label>
                            <input type="time" className={inputStyle} value={form.to_time} onChange={e => setForm({ ...form, to_time: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Examiner</label>
                            <select className={inputStyle} value={form.examiner} onChange={e => setForm({ ...form, examiner: e.target.value })}>
                                <option value="">Select Instructor</option>
                                {dropdowns.instructors.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Supervisor</label>
                            <select className={inputStyle} value={form.supervisor} onChange={e => setForm({ ...form, supervisor: e.target.value })}>
                                <option value="">Select Instructor</option>
                                {dropdowns.instructors.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Evaluate Section */}
                <div className="space-y-8">
                    <h3 className={sectionTitleStyle}>Evaluate</h3>
                    <div className="w-1/2 pr-6">
                        <label className={labelStyle}>Maximum Assessment Score *</label>
                        <input type="number" className={inputStyle} value={form.maximum_assessment_score} onChange={e => setForm({ ...form, maximum_assessment_score: parseFloat(e.target.value) })} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Assessment Criteria</span>
                            <button onClick={addCriteriaRow} className="text-blue-600 text-[11px] font-black hover:text-blue-800 uppercase tracking-widest">+ Add Criteria</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight w-12 text-center">No.</th>
                                        <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight">Assessment Criteria *</th>
                                        <th className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-tight w-48">Maximum Score *</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 border-b">
                                    {(form.assessment_criteria || []).length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic font-medium bg-gray-50/20 uppercase tracking-widest text-[10px]">No criteria defined for this plan</td></tr>
                                    ) : (
                                        form.assessment_criteria.map((row, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/30 transition-colors">
                                                <td className="px-3 py-2 text-gray-400 text-center font-bold">{idx + 1}</td>
                                                <td className="px-3 py-2">
                                                    <select className={inputStyle} value={row.assessment_criteria} onChange={e => updateCriteriaRow(idx, 'assessment_criteria', e.target.value)}>
                                                        <option value="">Select Criteria</option>
                                                        {dropdowns.criteriaOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="number" className={inputStyle} value={row.maximum_score} onChange={e => updateCriteriaRow(idx, 'maximum_score', parseFloat(e.target.value))} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button onClick={() => removeCriteriaRow(idx)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 font-black">✕</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentPlan;
