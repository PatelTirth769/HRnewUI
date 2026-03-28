import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    student: '',
    student_name: '',
    program: '',
    academic_year: '',
    academic_term: '',
    fee_structure: '',
    fee_schedule: '',
    posting_date: new Date().toISOString().split('T')[0],
    due_date: '',
    receivable_account: '',
    income_account: '',
    cost_center: '',
    grand_total: 0,
    outstanding_amount: 0,
    paid_amount: 0,
    components: [], // { fees_category: '', amount: 0 }
});

const Fees = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [feesList, setFeesList] = useState([]);
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
        feeStructures: [],
        feeSchedules: [],
        accounts: [],
        companies: [],
        costCenters: [],
        feesCategories: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchFeesList();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchFees(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(err => { console.error(`Error fetching ${url}:`, err); return { data: { data: [] } }; });
            const [sRes, pRes, yRes, tRes, fsRes, fshRes, aRes, coRes, ccRes, fcRes] = await Promise.all([
                safeGet('/api/resource/Student?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Academic Year?limit_page_length=None'),
                safeGet('/api/resource/Academic Term?limit_page_length=None'),
                safeGet('/api/resource/Fee Structure?limit_page_length=None'),
                safeGet('/api/resource/Fee Schedule?limit_page_length=None'),
                safeGet('/api/resource/Account?limit_page_length=None'),
                safeGet('/api/resource/Company?limit_page_length=None'),
                safeGet('/api/resource/Cost Center?limit_page_length=None'),
                safeGet('/api/resource/Fee Category?limit_page_length=None'),
            ]);
            setDropdowns({
                students: sRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                academicYears: yRes.data.data?.map(d => d.name) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                feeStructures: fsRes.data.data?.map(d => d.name) || [],
                feeSchedules: fshRes.data.data?.map(d => d.name) || [],
                accounts: aRes.data.data?.map(d => d.name) || [],
                companies: coRes.data.data?.map(d => d.name) || [],
                costCenters: ccRes.data.data?.map(d => d.name) || [],
                feesCategories: fcRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchFeesList = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fees?fields=["name","student","student_name","program","grand_total","outstanding_amount","posting_date"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setFeesList(response.data.data || []);
        } catch (err) {
            console.error('Error fetching fees list:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchFees = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Fees/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                ...d,
                components: d.components || [],
                posting_date: d.posting_date || '',
                due_date: d.due_date || '',
            });
        } catch (err) {
            console.error('Error fetching fees:', err);
            notification.error({ message: 'Error', description: 'Failed to load fees data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'student' && value) {
                fetchStudentDetails(value);
            }
            if (key === 'fee_structure' && value) {
                fetchFeeStructureDetails(value);
            }
            if (key === 'fee_schedule' && value) {
                fetchFeeScheduleDetails(value);
            }
            return updated;
        });
    };

    const fetchStudentDetails = async (studentId) => {
        try {
            const res = await API.get(`/api/resource/Student/${encodeURIComponent(studentId)}`);
            const data = res.data.data;
            if (data) {
                setForm(prev => ({ ...prev, student_name: data.title || data.student_name }));
            }
        } catch (err) {
            console.error('Failed to fetch student details', err);
        }
    };

    const fetchFeeStructureDetails = async (structureId) => {
        try {
            const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(structureId)}`);
            const data = res.data.data;
            if (data && data.components) {
                const components = data.components.map(c => ({
                    fees_category: c.fees_category,
                    amount: c.amount,
                }));
                const total = components.reduce((sum, c) => sum + (c.amount || 0), 0);
                setForm(prev => ({
                    ...prev,
                    components,
                    grand_total: total,
                    outstanding_amount: total - prev.paid_amount,
                    academic_year: data.academic_year || prev.academic_year,
                    program: data.program || prev.program,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch fee structure details', err);
        }
    };

    const fetchFeeScheduleDetails = async (scheduleId) => {
        try {
            const res = await API.get(`/api/resource/Fee Schedule/${encodeURIComponent(scheduleId)}`);
            const data = res.data.data;
            if (data) {
                const components = data.components || [];
                const total = components.reduce((sum, c) => sum + (c.amount || 0), 0);
                setForm(prev => ({
                    ...prev,
                    fee_structure: data.fee_structure || prev.fee_structure,
                    academic_year: data.academic_year || prev.academic_year,
                    academic_term: data.academic_term || prev.academic_term,
                    due_date: data.due_date || prev.due_date,
                    components: components.map(c => ({ fees_category: c.fees_category, amount: c.amount })),
                    grand_total: total,
                    outstanding_amount: total - prev.paid_amount,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch fee schedule details', err);
        }
    };

    // --- Child Table: Components ---
    const addComponentRow = () => {
        setForm(prev => ({
            ...prev,
            components: [...prev.components, { fees_category: '', amount: 0 }]
        }));
    };
    const removeComponentRow = (index) => {
        const newRows = [...form.components];
        newRows.splice(index, 1);
        setForm(prev => {
            const updated = { ...prev, components: newRows };
            calculateTotal(updated);
            return updated;
        });
    };
    const updateComponentRow = (index, field, value) => {
        const newRows = [...form.components];
        let val = value;
        if (field === 'amount') val = parseFloat(value) || 0;
        newRows[index][field] = val;
        setForm(prev => {
            const updated = { ...prev, components: newRows };
            calculateTotal(updated);
            return updated;
        });
    };

    const calculateTotal = (updatedForm) => {
        const total = updatedForm.components.reduce((sum, c) => sum + (c.amount || 0), 0);
        updatedForm.grand_total = total;
        updatedForm.outstanding_amount = total - updatedForm.paid_amount;
    };

    const handleSave = async () => {
        if (!form.student || !form.posting_date) {
            notification.warning({ message: 'Missing Fields', description: 'Student and Posting Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Fees/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Fees updated successfully.' });
            } else {
                await API.post('/api/resource/Fees', form);
                notification.success({ message: 'Fees created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this fees record?')) return;
        try {
            await API.delete(`/api/resource/Fees/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Fees record deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = feesList.filter(f => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (f.name || '').toLowerCase().includes(q) ||
                (f.student || '').toLowerCase().includes(q) ||
                (f.student_name || '').toLowerCase().includes(q) ||
                (f.program || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Fees</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchFeesList} disabled={loadingList}>
                            ⟳ Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Fees
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Student, Program or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Student</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Posting Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-right">Grand Total</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-right">Outstanding</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic font-medium">No fees records found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{row.student_name || '-'}</div>
                                            <div className="text-[11px] text-gray-400 uppercase tracking-tight">{row.student}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.posting_date || '-'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">₹ {row.grand_total?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.outstanding_amount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                ₹ {row.outstanding_amount?.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20 font-medium">Loading fees data...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-32">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Fees'}</span>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-100 text-red-600 font-medium tracking-wide">Not Saved</span>}
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-10">
                {/* Student Details Section */}
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
                            <label className={labelStyle}>Student Name</label>
                            <input type="text" className={inputStyle} value={form.student_name} disabled />
                        </div>
                        <div>
                            <label className={labelStyle}>Program</label>
                            <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                <option value="">Select Program</option>
                                {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Academic Year</label>
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
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Scheduling & Structure */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Fee Schedule</label>
                            <select className={inputStyle} value={form.fee_schedule} onChange={e => updateField('fee_schedule', e.target.value)}>
                                <option value="">Select Schedule</option>
                                {dropdowns.feeSchedules.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1 italic">Selecting a schedule will automatically load components and structure.</p>
                        </div>
                        <div>
                            <label className={labelStyle}>Fee Structure</label>
                            <select className={inputStyle} value={form.fee_structure} onChange={e => updateField('fee_structure', e.target.value)}>
                                <option value="">Select Structure</option>
                                {dropdowns.feeStructures.map(fst => <option key={fst} value={fst}>{fst}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Posting Date *</label>
                            <input type="date" className={inputStyle} value={form.posting_date} onChange={e => updateField('posting_date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Due Date</label>
                            <input type="date" className={inputStyle} value={form.due_date} onChange={e => updateField('due_date', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* components Table */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider text-[12px]">Fee Components</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden font-medium">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-3 py-2 text-left w-12 font-normal text-gray-400">No.</th>
                                    <th className="px-3 py-2 text-left">Fees Category *</th>
                                    <th className="px-3 py-2 text-right">Amount *</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-700">
                                {form.components.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-6 text-gray-400 italic">No Components Add manually if no schedule selected.</td></tr>
                                ) : (
                                    form.components.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5 text-gray-400 font-normal">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.fees_category} onChange={e => updateComponentRow(idx, 'fees_category', e.target.value)}>
                                                    <option value="">Select Category</option>
                                                    {dropdowns.feesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.amount} onChange={e => updateComponentRow(idx, 'amount', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeComponentRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold p-1">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addComponentRow}>Add Row</button>
                    
                    <div className="mt-8 flex justify-end">
                       <div className="space-y-3 w-72">
                           <div className="flex justify-between items-center text-sm font-medium">
                               <span className="text-gray-500">Subtotal</span>
                               <span className="text-gray-900 font-bold">₹ {form.grand_total.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm font-medium">
                               <span className="text-gray-500">Paid Amount</span>
                               <span className="text-green-600 font-bold">₹ {form.paid_amount.toLocaleString()}</span>
                           </div>
                           <div className="h-px bg-gray-200" />
                           <div className="flex justify-between items-center">
                               <span className="text-gray-800 font-bold tracking-tight">Grand Total</span>
                               <span className="text-2xl font-black text-blue-900 tracking-tighter">₹ {form.grand_total.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Outstanding</span>
                               <span className="text-lg font-bold text-red-600 tracking-tight">₹ {form.outstanding_amount.toLocaleString()}</span>
                           </div>
                       </div>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Accounting Information */}
                <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-6">Accounting Details</h3>
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Receivable Account</label>
                                <select className={inputStyle} value={form.receivable_account} onChange={e => updateField('receivable_account', e.target.value)}>
                                    <option value="">Select Account</option>
                                    {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Income Account</label>
                                <select className={inputStyle} value={form.income_account} onChange={e => updateField('income_account', e.target.value)}>
                                    <option value="">Select Account</option>
                                    {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Cost Center</label>
                                <select className={inputStyle} value={form.cost_center} onChange={e => updateField('cost_center', e.target.value)}>
                                    <option value="">Select Cost Center</option>
                                    {dropdowns.costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Fees;
