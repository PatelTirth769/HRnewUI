import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const TABS = ['Details', 'Assessment'];

const emptyForm = () => ({
    course_name: '',
    department: '',
    description: '',
    topics: [], // Child table: Course Topic
    default_grading_scale: '',
    assessment_criteria: [], // Child table: Course Assessment Criteria
});

const Course = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [courses, setCourses] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [activeTab, setActiveTab] = useState('Details');
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [departments, setDepartments] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [gradingScales, setGradingScales] = useState([]);
    const [allCriteria, setAllCriteria] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchCourses();
        } else {
            setActiveTab('Details');
            fetchDropdownData();
            if (editingRecord) {
                fetchCourse(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchCourses = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Course?fields=["name","course_name","department"]&limit_page_length=None&order_by=name asc';
            const response = await API.get(url);
            setCourses(response.data.data || []);
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [deptRes, topicRes, scaleRes, criteriaRes] = await Promise.all([
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Topic?fields=["name","topic_name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Grading Scale?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Assessment Criteria?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setDepartments((deptRes.data.data || []).map(d => d.name));
            setAllTopics((topicRes.data.data || []).map(t => ({ name: t.name, title: t.topic_name || t.name })));
            setGradingScales((scaleRes.data.data || []).map(s => s.name));
            setAllCriteria((criteriaRes.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchCourse = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Course/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                course_name: d.name || '',
                department: d.department || '',
                description: d.description || '',
                topics: (d.topics || []).map(t => ({
                    topic: t.topic || '',
                    topic_name: t.topic_name || '',
                    name: t.name
                })),
                default_grading_scale: d.default_grading_scale || '',
                assessment_criteria: (d.assessment_criteria || []).map(ac => ({
                    assessment_criteria: ac.assessment_criteria || '',
                    weightage: ac.weightage || 0,
                    name: ac.name
                })),
            });
        } catch (err) {
            console.error('Error fetching course:', err);
            notification.error({ message: 'Error', description: 'Failed to load course data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Topics Child Table ---
    const addTopicRow = () => {
        setForm(prev => ({
            ...prev,
            topics: [...prev.topics, { topic: '', topic_name: '' }]
        }));
    };

    const removeTopicRow = (index) => {
        const newTopics = [...form.topics];
        newTopics.splice(index, 1);
        setForm(prev => ({ ...prev, topics: newTopics }));
    };

    const updateTopicRow = (index, field, value) => {
        const newTopics = [...form.topics];
        newTopics[index][field] = value;
        if (field === 'topic') {
            const selected = allTopics.find(t => t.name === value);
            newTopics[index]['topic_name'] = selected ? selected.title : '';
        }
        setForm(prev => ({ ...prev, topics: newTopics }));
    };

    // --- Assessment Criteria Child Table ---
    const addCriteriaRow = () => {
        setForm(prev => ({
            ...prev,
            assessment_criteria: [...prev.assessment_criteria, { assessment_criteria: '', weightage: 0 }]
        }));
    };

    const removeCriteriaRow = (index) => {
        const newCriteria = [...form.assessment_criteria];
        newCriteria.splice(index, 1);
        setForm(prev => ({ ...prev, assessment_criteria: newCriteria }));
    };

    const updateCriteriaRow = (index, field, value) => {
        const newCriteria = [...form.assessment_criteria];
        newCriteria[index][field] = value;
        setForm(prev => ({ ...prev, assessment_criteria: newCriteria }));
    };

    const handleSave = async () => {
        if (!form.course_name) {
            notification.warning({ message: 'Course Name is required.' });
            return;
        }

        const totalWeightage = form.assessment_criteria.reduce((sum, ac) => sum + Number(ac.weightage || 0), 0);
        if (form.assessment_criteria.length > 0 && totalWeightage !== 100) {
            notification.warning({ message: 'Warning', description: `Total weightage should be 100. Current total: ${totalWeightage}` });
        }

        setSaving(true);
        try {
            const payload = {
                course_name: form.course_name,
                department: form.department || null,
                description: form.description || null,
                topics: form.topics.map(t => ({ topic: t.topic })),
                default_grading_scale: form.default_grading_scale || null,
                assessment_criteria: form.assessment_criteria.map(ac => ({
                    assessment_criteria: ac.assessment_criteria,
                    weightage: ac.weightage
                }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Course/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Course updated successfully.' });
            } else {
                await API.post('/api/resource/Course', payload);
                notification.success({ message: 'Course created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await API.delete(`/api/resource/Course/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Course deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const tabStyle = (tab) => `px-6 py-2.5 text-sm font-semibold transition-all border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`;

    if (view === 'list') {
        const filtered = courses.filter(c => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (c.name || '').toLowerCase().includes(q) ||
                (c.course_name || '').toLowerCase().includes(q) ||
                (c.department || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Course</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchCourses} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Course
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Code, Name or Dept..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {courses.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">Course Code</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Course Name</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Courses Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new course.</p>
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
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.course_name || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading course data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Course'}</span>
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

            <div className="flex bg-white px-2 border-b border-gray-100 mb-6">
                {TABS.map(tab => (
                    <button key={tab} className={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 min-h-[500px]">
                {activeTab === 'Details' && (
                    <div className="max-w-4xl">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelStyle}>Course Name *</label>
                                    <input type="text" className={inputStyle} value={form.course_name} onChange={e => updateField('course_name', e.target.value)} placeholder="e.g. Introduction to Physics" />
                                </div>
                                <div>
                                    <label className={labelStyle}>Department</label>
                                    <select className={inputStyle} value={form.department} onChange={e => updateField('department', e.target.value)}>
                                        <option value="">Select Department...</option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Description</label>
                                <textarea className={`${inputStyle} h-[130px] resize-none pt-2 leading-relaxed text-gray-700`} value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Provide a brief overview of the course content..." />
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100">
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Course Topics</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left w-12">No.</th>
                                            <th className="px-3 py-2.5 text-left">Topic *</th>
                                            <th className="px-3 py-2.5 text-left">Topic Name</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.topics.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic text-sm">No Topics Added</td></tr>
                                        ) : (
                                            form.topics.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={row.topic} onChange={e => updateTopicRow(idx, 'topic', e.target.value)}>
                                                            <option value="">Select Topic...</option>
                                                            {allTopics.map(t => <option key={t.name} value={t.name}>{t.title}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-500">{row.topic_name || row.topic || '-'}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => removeTopicRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <button className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addTopicRow}>
                                Add Topic Row
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'Assessment' && (
                    <div className="max-w-4xl">
                        <div className="mb-10 max-w-md">
                            <label className={labelStyle}>Default Grading Scale</label>
                            <select className={inputStyle} value={form.default_grading_scale} onChange={e => updateField('default_grading_scale', e.target.value)}>
                                <option value="">Select Grading Scale...</option>
                                {gradingScales.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Assessment Criteria</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left">Criteria *</th>
                                            <th className="px-3 py-2.5 text-center w-40">Weightage (%) *</th>
                                            <th className="px-3 py-2 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {form.assessment_criteria.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic text-sm">No Criteria Defined</td></tr>
                                        ) : (
                                            form.assessment_criteria.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-3 py-2.5">
                                                        <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                            value={row.assessment_criteria} onChange={e => updateCriteriaRow(idx, 'assessment_criteria', e.target.value)}>
                                                            <option value="">Select Criteria...</option>
                                                            {allCriteria.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400 text-center font-bold text-blue-600"
                                                            value={row.weightage} onChange={e => updateCriteriaRow(idx, 'weightage', e.target.value)} min="0" max="100" />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button onClick={() => removeCriteriaRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-gray-50/50 border-t border-gray-100">
                                        <tr>
                                            <td className="px-6 py-3 text-right text-xs font-bold text-gray-400 tracking-wider">TOTAL WEIGHTAGE</td>
                                            <td className={`px-6 py-3 text-center font-black text-sm ${form.assessment_criteria.reduce((s, a) => s + Number(a.weightage || 0), 0) === 100 ? 'text-green-600' : 'text-red-500 underline decoration-dotted capitalize italic'}`}>
                                                {form.assessment_criteria.reduce((s, a) => s + Number(a.weightage || 0), 0)}%
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <button className="mt-3 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addCriteriaRow}>
                                Add Criteria Row
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Course;
