import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const LOG_TYPES = ['General', 'Academic', 'Behavioral', 'Medical', 'Attendance', 'Other'];

const emptyForm = () => ({
    student: '',
    academic_year: '',
    type: 'General',
    academic_term: '',
    date: new Date().toISOString().slice(0, 10),
    program: '',
    student_batch: '',
    log: '',
});

const StudentLog = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [logs, setLogs] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dynamic dropdown options from ERPNext
    const [students, setStudents] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [academicTerms, setAcademicTerms] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchLogs();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchStudentLog(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchLogs = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Log?fields=["name","student","type","date","academic_year","academic_term","program","student_batch"]&limit_page_length=None&order_by=modified desc';
            const response = await API.get(url);
            setLogs(response.data.data || []);
        } catch (err) {
            console.error('Error fetching student logs:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [studentRes, yearRes, termRes, programRes, batchRes] = await Promise.all([
                API.get('/api/resource/Student?fields=["name","title"]&limit_page_length=None&order_by=title asc'),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None&order_by=name desc'),
                API.get('/api/resource/Academic Term?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None&order_by=name asc'),
                API.get('/api/resource/Batch?fields=["name"]&limit_page_length=None&order_by=name asc'),
            ]);
            setStudents((studentRes.data.data || []).map(s => ({ name: s.name, title: s.title || s.name })));
            setAcademicYears((yearRes.data.data || []).map(y => y.name));
            setAcademicTerms((termRes.data.data || []).map(t => t.name));
            setPrograms((programRes.data.data || []).map(p => p.name));
            setBatches((batchRes.data.data || []).map(b => b.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchStudentLog = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Log/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                student: d.student || '',
                academic_year: d.academic_year || '',
                type: d.type || 'General',
                academic_term: d.academic_term || '',
                date: d.date || '',
                program: d.program || '',
                student_batch: d.student_batch || d.batch || '',
                log: d.log || '',
            });
        } catch (err) {
            console.error('Error fetching student log:', err);
            notification.error({ message: 'Error', description: 'Failed to load student log data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.student) {
            notification.warning({ message: 'Student is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Student Log/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Student Log updated successfully.' });
            } else {
                await API.post('/api/resource/Student Log', payload);
                notification.success({ message: 'Student Log created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this student log?')) return;
        try {
            await API.delete(`/api/resource/Student Log/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Student Log deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = logs.filter(l => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (l.name || '').toLowerCase().includes(q) ||
                (l.student || '').toLowerCase().includes(q) ||
                (l.type || '').toLowerCase().includes(q) ||
                (l.program || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Student Log</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchLogs} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Student Log
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search ID, Student, Type or Program..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {logs.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Student</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Academic Year</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600">Batch</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="7" className="text-center py-10 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1">No Student Logs Found</p>
                                        <p className="text-sm">Try adjusting your search or add a new log.</p>
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
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.student || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-gray-100 text-gray-700 font-medium">
                                                {row.type || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.date || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.student_batch || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading student log data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Student Log'}</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 max-w-4xl">
                    <div>
                        <label className={labelStyle}>Student *</label>
                        <select className={inputStyle} value={form.student} onChange={e => updateField('student', e.target.value)}>
                            <option value="">Select Student...</option>
                            {students.map(s => <option key={s.name} value={s.name}>{s.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Academic Year</label>
                        <select className={inputStyle} value={form.academic_year} onChange={e => updateField('academic_year', e.target.value)}>
                            <option value="">Select Year...</option>
                            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Log Type</label>
                        <select className={inputStyle} value={form.type} onChange={e => updateField('type', e.target.value)}>
                            {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
                        <label className={labelStyle}>Date</label>
                        <input type="date" className={inputStyle} value={form.date} onChange={e => updateField('date', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelStyle}>Program</label>
                        <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                            <option value="">Select Program...</option>
                            {programs.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Student Batch</label>
                        <select className={inputStyle} value={form.student_batch} onChange={e => updateField('student_batch', e.target.value)}>
                            <option value="">Select Batch...</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-800 mb-4">Detailed Log</label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-gray-50">
                        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4 text-gray-500 text-[13px] overflow-x-auto whitespace-nowrap">
                            <div className="flex items-center gap-3 border-r pr-4">
                                <span className="cursor-default hover:text-gray-900 transition">File</span>
                                <span className="cursor-default hover:text-gray-900 transition">Edit</span>
                                <span className="cursor-default hover:text-gray-900 transition">Insert</span>
                            </div>
                            <div className="flex items-center gap-4 border-r pr-4">
                                <button className="font-bold hover:text-gray-900">B</button>
                                <button className="italic hover:text-gray-900">I</button>
                                <button className="underline hover:text-gray-900">U</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs">System Font</span>
                                <span className="text-xs ml-2">11pt</span>
                            </div>
                        </div>
                        <textarea
                            className="w-full px-6 py-4 text-sm bg-white focus:outline-none min-h-[400px] resize-y leading-relaxed text-gray-700"
                            value={form.log}
                            onChange={e => updateField('log', e.target.value)}
                            placeholder="Describe the incident or observation here..."
                        />
                        <div className="bg-gray-50 px-3 py-1 text-[10px] text-gray-400 font-mono text-right italic">
                            power by erpnext rich text
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentLog;
