import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    assessment_plan: '',
    student: '',
    program: '',
    student_group: '',
    course: '',
    assessment_group: '',
    academic_year: '',
    academic_term: '',
    details: [],
    comment: '',
});

const AssessmentResult = () => {
    const [view, setView] = useState('list');
    const [editingRecord, setEditingRecord] = useState(null);
    const [list, setList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [loadingForm, setLoadingForm] = useState(false);

    // Dropdowns
    const [plans, setPlans] = useState([]);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchRecord(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchList = async () => {
        try {
            setLoadingList(true);
            const res = await API.get('/api/resource/Assessment Result?fields=["name","student","assessment_plan","student_group","course"]&limit_page_length=None&order_by=creation desc');
            setList(res.data.data || []);
        } catch (err) {
            console.error('Fetch list error:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [planRes, studentRes] = await Promise.all([
                API.get('/api/resource/Assessment Plan?limit_page_length=None'),
                API.get('/api/resource/Student?fields=["name","student_name"]&limit_page_length=None'),
            ]);
            setPlans(planRes.data.data?.map(d => d.name) || []);
            setStudents(studentRes.data.data || []);
        } catch (err) {
            console.error('Fetch dropdowns error:', err);
        }
    };

    const fetchRecord = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Assessment Result/${encodeURIComponent(id)}`);
            setForm(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to load assessment result.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const handlePlanChange = async (planId) => {
        if (!planId) {
            setForm({ ...form, assessment_plan: '', program: '', student_group: '', course: '', assessment_group: '', academic_year: '', academic_term: '', details: [] });
            return;
        }
        try {
            const res = await API.get(`/api/resource/Assessment Plan/${encodeURIComponent(planId)}`);
            const planData = res.data.data;
            
            // Map plan criteria to result details
            const resultDetails = (planData.assessment_criteria || []).map(c => ({
                assessment_criteria: c.assessment_criteria,
                maximum_score: c.maximum_score,
                score: 0,
                grade: ''
            }));

            setForm({
                ...form,
                assessment_plan: planId,
                program: planData.program || '',
                student_group: planData.student_group || '',
                course: planData.course || '',
                assessment_group: planData.assessment_group || '',
                academic_year: planData.academic_year || '',
                academic_term: planData.academic_term || '',
                details: resultDetails
            });
        } catch (err) {
            console.error('Error fetching plan details:', err);
        }
    };

    const handleSave = async () => {
        if (!form.assessment_plan || !form.student) {
            notification.warning({ message: 'Required Fields', description: 'Please select Assessment Plan and Student.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Assessment Result/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Assessment Result updated.' });
            } else {
                await API.post('/api/resource/Assessment Result', form);
                notification.success({ message: 'Assessment Result created.' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await API.delete(`/api/resource/Assessment Result/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Deleted successfully.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const updateDetail = (idx, field, val) => {
        const newDetails = [...form.details];
        newDetails[idx][field] = val;
        setForm({ ...form, details: newDetails });
    };

    const inputStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500";
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";
    const sectionTitleStyle = "text-sm font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-6 block";

    if (view === 'list') {
        const filtered = list.filter(i => 
            (i.student || '').toLowerCase().includes(search.toLowerCase()) ||
            (i.assessment_plan || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessment Result</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200" onClick={fetchList}>Refresh</button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition shadow-sm font-bold" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + New Assessment Result
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64 shadow-sm" placeholder="Search Student or Plan..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Plan</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Group</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Course</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Syncing results...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No results found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 font-bold hover:underline" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{row.student}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.assessment_plan}</td>
                                        <td className="px-4 py-3 text-gray-500">{row.student_group || '-'}</td>
                                        <td className="px-4 py-3 text-gray-400">{row.course || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-24 font-bold uppercase tracking-widest">LOADING RESULT...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-40">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{editingRecord ? `EDIT ${editingRecord}` : 'NEW ASSESSMENT RESULT'}</h2>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 font-bold uppercase tracking-widest leading-none">Not Saved</span>}
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 bg-white transition-all shadow-sm" onClick={() => setView('list')}>Back</button>
                    {editingRecord && <button className="px-5 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all shadow-sm" onClick={handleDelete}>Delete</button>}
                    <button className="px-8 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 space-y-12">
                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    <div>
                        <label className={labelStyle}>Assessment Plan *</label>
                        <select className={inputStyle} value={form.assessment_plan} onChange={e => handlePlanChange(e.target.value)}>
                            <option value="">Select Plan</option>
                            {plans.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={e => setForm({ ...form, student: e.target.value })}>
                            <option value="">Select Student</option>
                            {students.map(s => <option key={s.name} value={s.name}>{s.student_name} ({s.name})</option>)}
                        </select>
                    </div>
                    
                    {/* Read-only / Reference Fields */}
                    <div>
                        <label className={labelStyle}>Program</label>
                        <input type="text" className={inputStyle} value={form.program} disabled />
                    </div>
                    <div>
                        <label className={labelStyle}>Student Group</label>
                        <input type="text" className={inputStyle} value={form.student_group} disabled />
                    </div>
                    <div>
                        <label className={labelStyle}>Course</label>
                        <input type="text" className={inputStyle} value={form.course} disabled />
                    </div>
                    <div>
                        <label className={labelStyle}>Assessment Group</label>
                        <input type="text" className={inputStyle} value={form.assessment_group} disabled />
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Year</label>
                        <input type="text" className={inputStyle} value={form.academic_year} disabled />
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Term</label>
                        <input type="text" className={inputStyle} value={form.academic_term} disabled />
                    </div>
                </div>

                {/* Result Section */}
                <div className="space-y-6">
                    <h3 className={sectionTitleStyle}>Result</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-12 text-center">No.</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Assessment Criteria</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-40">Max Score</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-40">Score *</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-32">Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 border-b">
                                {(form.details || []).length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic bg-gray-50/20 uppercase tracking-widest text-[10px] font-bold">Select an assessment plan to load criteria</td></tr>
                                ) : (
                                    form.details.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-4 py-3 text-gray-400 text-center font-bold">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{row.assessment_criteria}</td>
                                            <td className="px-4 py-3 text-gray-500 font-mono">{row.maximum_score}</td>
                                            <td className="px-4 py-3">
                                                <input type="number" 
                                                    className={`${inputStyle} h-8 px-2`}
                                                    value={row.score} 
                                                    onChange={e => updateDetail(idx, 'score', parseFloat(e.target.value))} 
                                                    max={row.maximum_score}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input type="text" 
                                                    className={`${inputStyle} h-8 px-2 font-bold text-blue-600 text-center`}
                                                    value={row.grade} 
                                                    onChange={e => updateDetail(idx, 'grade', e.target.value)}
                                                    placeholder="A+"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Section */}
                <div>
                    <h3 className={sectionTitleStyle}>Summary</h3>
                    <div className="space-y-2">
                        <label className={labelStyle}>Comment</label>
                        <textarea 
                            className={`${inputStyle} h-32 resize-none`} 
                            value={form.comment} 
                            onChange={e => setForm({...form, comment: e.target.value})}
                            placeholder="Add overall observations or remarks..."
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResult;
