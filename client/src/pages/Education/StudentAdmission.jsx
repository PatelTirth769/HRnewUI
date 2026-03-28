import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    title: '',
    route: '',
    publish_on_website: 0,
    enable_admission_application: 0,
    academic_year: '',
    admission_start_date: '',
    admission_end_date: '',
    
    // Child Table
    programs: [], // { program: '', minimum_age: '', maximum_age: '', application_fee: '' }
    
    introduction: '',
});

const StudentAdmission = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [admissions, setAdmissions] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        academicYears: [],
        programs: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchAdmissions();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchAdmission(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const [yRes, pRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None')
            ]);
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchAdmissions = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Student Admission?fields=["name","title","academic_year","admission_start_date","admission_end_date"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setAdmissions(response.data.data || []);
        } catch (err) {
            console.error('Error fetching student admissions:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchAdmission = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Student Admission/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                title: d.title || '',
                route: d.route || '',
                publish_on_website: d.publish_on_website || 0,
                enable_admission_application: d.enable_admission_application || 0,
                academic_year: d.academic_year || '',
                admission_start_date: d.admission_start_date || '',
                admission_end_date: d.admission_end_date || '',
                
                programs: (d.programs || d.eligibility_and_details || d.admission_program_eligibility || []).map(p => ({
                    program: p.program || '',
                    minimum_age: p.minimum_age || '',
                    maximum_age: p.maximum_age || '',
                    application_fee: p.application_fee || ''
                })),
                
                introduction: d.introduction || '',
            });
        } catch (err) {
            console.error('Error fetching admission:', err);
            notification.error({ message: 'Error', description: 'Failed to load admission data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Child Table Functions ---
    const addProgramRow = () => {
        setForm(prev => ({
            ...prev,
            programs: [...prev.programs, { program: '', minimum_age: '', maximum_age: '', application_fee: '' }]
        }));
    };

    const removeProgramRow = (index) => {
        const newPrograms = [...form.programs];
        newPrograms.splice(index, 1);
        setForm(prev => ({ ...prev, programs: newPrograms }));
    };

    const updateProgramRow = (index, field, value) => {
        const newPrograms = [...form.programs];
        newPrograms[index][field] = value;
        setForm(prev => ({ ...prev, programs: newPrograms }));
    };

    const handleSave = async () => {
        if (!form.academic_year) {
            notification.warning({ message: 'Academic Year is required.' });
            return;
        }
        if (!form.admission_start_date) {
            notification.warning({ message: 'Admission Start Date is required.' });
            return;
        }
        if (!form.admission_end_date) {
            notification.warning({ message: 'Admission End Date is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };
            
            // Map the generic state name 'programs' to what ERPNext typically expects 'programs' or 'admission_program_eligibility' 
            // We supply it as programs, ERPNext will map it if using standard naming, we assume 'programs' is standard for Student Admission doctype or 'admission_program_eligibility'
            // We'll pass it exactly as the custom app or standard app expects, standard ERPNext uses "programs" for Student Admission doctype.

            if (editingRecord) {
                await API.put(`/api/resource/Student Admission/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Student Admission updated successfully.' });
            } else {
                await API.post('/api/resource/Student Admission', payload);
                notification.success({ message: 'Student Admission created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this admission record?')) return;
        try {
            await API.delete(`/api/resource/Student Admission/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Student Admission deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = admissions.filter(a => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.title || '').toLowerCase().includes(q) ||
                (a.academic_year || '').toLowerCase().includes(q)
            );
        });

        const hasActiveFilters = !!search;
        const clearFilters = () => setSearch('');

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Student Admission</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchAdmissions} disabled={loadingList}>
                            {loadingList ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Admission
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Title, Year or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    {hasActiveFilters && (
                        <button className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1" onClick={clearFilters}>
                            ✕ Clear Filters
                        </button>
                    )}
                    <div className="ml-auto text-xs text-gray-400">{filtered.length} of {admissions.length}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Title</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Year</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Start Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">End Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-16 text-gray-500">
                                        <p className="text-lg font-medium mb-1 text-gray-400 italic">No Admissions Found</p>
                                        <p className="text-sm text-gray-300">Try adjusting your search or add a new record.</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-left text-sm" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.title || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.admission_start_date || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.admission_end_date || '-'}</td>
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
                <div className="text-center py-20 text-gray-400 italic font-medium">Loading admission data...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord : 'New Student Admission'}</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[500px]">
                <div className="max-w-5xl space-y-10">
                    
                    {/* General Section */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Title</label>
                                <input type="text" className={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Route</label>
                                <input type="text" className={inputStyle} value={form.route} onChange={e => updateField('route', e.target.value)} />
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="publish" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" checked={!!form.publish_on_website} onChange={e => updateField('publish_on_website', e.target.checked ? 1 : 0)} />
                                    <label htmlFor="publish" className="text-[14px] text-gray-800 font-medium cursor-pointer select-none">Publish on website</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="enable_admission" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" checked={!!form.enable_admission_application} onChange={e => updateField('enable_admission_application', e.target.checked ? 1 : 0)} />
                                    <label htmlFor="enable_admission" className="text-[14px] text-gray-800 font-medium cursor-pointer select-none">Enable Admission Application</label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Academic Year *</label>
                                <select className={inputStyle} value={form.academic_year} onChange={e => updateField('academic_year', e.target.value)}>
                                    <option value="">Select Year</option>
                                    {dropdowns.academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Admission Start Date *</label>
                                <input type="date" className={inputStyle} value={form.admission_start_date} onChange={e => updateField('admission_start_date', e.target.value)} />
                            </div>
                            <div>
                                <label className={labelStyle}>Admission End Date *</label>
                                <input type="date" className={inputStyle} value={form.admission_end_date} onChange={e => updateField('admission_end_date', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8" />

                    {/* Eligibility and Details Table */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Eligibility and Details</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 border-b text-[13px]">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left w-12 text-gray-400 font-normal">No.</th>
                                        <th className="px-3 py-2.5 text-left w-1/3">Program</th>
                                        <th className="px-3 py-2.5 text-left">Minimum Age</th>
                                        <th className="px-3 py-2.5 text-left">Maximum Age</th>
                                        <th className="px-3 py-2.5 text-left">Application Fee</th>
                                        <th className="px-3 py-2 text-center w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {form.programs.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic text-sm">No Data</td></tr>
                                    ) : (
                                        form.programs.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                                <td className="px-3 py-2.5">
                                                    <select className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.program} onChange={e => updateProgramRow(idx, 'program', e.target.value)}>
                                                        <option value="">Select</option>
                                                        {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.minimum_age} onChange={e => updateProgramRow(idx, 'minimum_age', e.target.value)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.maximum_age} onChange={e => updateProgramRow(idx, 'maximum_age', e.target.value)} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="number" className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-400"
                                                        value={row.application_fee} onChange={e => updateProgramRow(idx, 'application_fee', e.target.value)} />
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button onClick={() => removeProgramRow(idx)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 font-bold">✕</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 transition shadow-sm" onClick={addProgramRow}>
                            Add Row
                        </button>
                    </div>

                    <div className="border-t border-gray-100 pt-8" />

                    {/* Introduction */}
                    <div>
                        <label className="block text-[14px] text-gray-800 mb-3 font-medium">Introduction</label>
                        <textarea 
                            className={`${inputStyle} min-h-[150px] resize-y leading-relaxed text-gray-800`}
                            placeholder="Type introduction details here... (Rich Text is supported on the backend)"
                            value={form.introduction} 
                            onChange={e => updateField('introduction', e.target.value)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAdmission;
