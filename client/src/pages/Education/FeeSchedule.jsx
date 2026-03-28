import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    fee_structure: '',
    academic_year: '',
    posting_date: new Date().toISOString().split('T')[0],
    academic_term: '',
    due_date: '',
    naming_series: 'EDU-FSH-.YYYY.-',
    send_payment_request_email: 0,
    
    // Child Tables
    student_groups: [], // { student_group: '', total_students: 0 }
    components: [],      // { fees_category: '', amount: 0, discount: 0, total: 0 }
    
    total_amount: 0,
    
    // Printing Settings
    letter_head: 'logixica Letter head',
    print_heading: '',
    
    // Accounting
    receivable_account: '',
    institution: 'Preeshe Consultancy Services',
    
    // Accounting Dimensions
    cost_center: '',
});

const FeeSchedule = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [schedules, setSchedules] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown data
    const [dropdowns, setDropdowns] = useState({
        feeStructures: [],
        academicYears: [],
        academicTerms: [],
        studentGroups: [],
        feesCategories: [],
        letterHeads: [],
        accounts: [],
        institutions: [],
        costCenters: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchSchedules();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchSchedule(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(err => { console.error(`Error fetching ${url}:`, err); return { data: { data: [] } }; });
            const [fsRes, yRes, tRes, sgRes, fcRes, lhRes, aRes, iRes, ccRes] = await Promise.all([
                safeGet('/api/resource/Fee Structure?limit_page_length=None'),
                safeGet('/api/resource/Academic Year?limit_page_length=None'),
                safeGet('/api/resource/Academic Term?limit_page_length=None'),
                safeGet('/api/resource/Student Group?limit_page_length=None'),
                safeGet('/api/resource/Fee Category?limit_page_length=None'),
                safeGet('/api/resource/Letter Head?limit_page_length=None'),
                safeGet('/api/resource/Account?limit_page_length=None'),
                safeGet('/api/resource/Company?limit_page_length=None'),
                safeGet('/api/resource/Cost Center?limit_page_length=None'),
            ]);
            setDropdowns({
                feeStructures: fsRes.data.data?.map(d => d.name) || [],
                academicYears: yRes.data.data?.map(d => d.name) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                feesCategories: fcRes.data.data?.map(d => d.name) || [],
                letterHeads: lhRes.data.data?.map(d => d.name) || [],
                accounts: aRes.data.data?.map(d => d.name) || [],
                institutions: iRes.data.data?.map(d => d.name) || [],
                costCenters: ccRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fee Schedule?fields=["name","fee_structure","academic_year","posting_date","due_date"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setSchedules(response.data.data || []);
        } catch (err) {
            console.error('Error fetching fee schedules:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchSchedule = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Fee Schedule/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                ...d,
                posting_date: d.posting_date || '',
                due_date: d.due_date || '',
                student_groups: d.student_groups || [],
                components: d.components || [],
            });
        } catch (err) {
            console.error('Error fetching schedule:', err);
            notification.error({ message: 'Error', description: 'Failed to load schedule data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'fee_structure' && value) {
                // Proactively pull component details if fee structure is selected
                fetchFeeStructureComponents(value);
            }
            return updated;
        });
    };

    const fetchFeeStructureComponents = async (structureId) => {
        try {
             const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(structureId)}`);
             const data = res.data.data;
             if (data && data.components) {
                 setForm(prev => ({
                     ...prev,
                     components: data.components.map(c => ({
                         fees_category: c.fees_category,
                         amount: c.amount,
                         discount: c.discount_amount || c.discount || 0,
                         total: c.total_amount || c.total || 0,
                     })),
                     total_amount: data.total_amount || 0
                 }));
             }
        } catch(err) {
            console.error("Failed to fetch structure components", err);
        }
    };

    // --- Child Table: Student Groups ---
    const addGroupRow = () => {
        setForm(prev => ({
            ...prev,
            student_groups: [...prev.student_groups, { student_group: '', total_students: 0 }]
        }));
    };
    const removeGroupRow = (index) => {
        const newRows = [...form.student_groups];
        newRows.splice(index, 1);
        setForm(prev => ({ ...prev, student_groups: newRows }));
    };
    const updateGroupRow = (index, field, value) => {
        const newRows = [...form.student_groups];
        newRows[index][field] = value;
        setForm(prev => ({ ...prev, student_groups: newRows }));
    };

    // --- Child Table: Components ---
    const addComponentRow = () => {
        setForm(prev => ({
            ...prev,
            components: [...prev.components, { fees_category: '', amount: 0, discount: 0, total: 0 }]
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
        if (field === 'amount' || field === 'discount') val = parseFloat(value) || 0;
        newRows[index][field] = val;
        
        // Recalculate row total
        const amt = field === 'amount' ? val : newRows[index].amount;
        const disc = field === 'discount' ? val : newRows[index].discount;
        newRows[index].total = amt - (amt * (disc / 100));
        
        setForm(prev => {
            const updated = { ...prev, components: newRows };
            calculateTotal(updated);
            return updated;
        });
    };

    const calculateTotal = (updatedForm) => {
        const total = updatedForm.components.reduce((sum, c) => sum + (c.total || 0), 0);
        updatedForm.total_amount = total;
    };

    const handleSave = async () => {
        if (!form.fee_structure || !form.academic_year || !form.due_date) {
            notification.warning({ message: 'Missing Fields', description: 'Fee Structure, Academic Year and Due Date are required.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Fee Schedule/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Fee Schedule updated successfully.' });
            } else {
                await API.post('/api/resource/Fee Schedule', form);
                notification.success({ message: 'Fee Schedule created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this fee schedule?')) return;
        try {
            await API.delete(`/api/resource/Fee Schedule/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Fee Schedule deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = schedules.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.fee_structure || '').toLowerCase().includes(q) ||
                (s.academic_year || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Fee Schedule</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchSchedules} disabled={loadingList}>
                            ⟳ Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Schedule
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Structure, Year or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Fee Structure</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Year</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Posting Date</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium">No schedules found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.fee_structure || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.posting_date || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-semibold">{row.due_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20 font-medium font-medium">Loading schedule data...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto pb-32">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Fee Schedule'}</span>
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
                {/* Header Fields */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Fee Structure *</label>
                            <select className={inputStyle} value={form.fee_structure} onChange={e => updateField('fee_structure', e.target.value)}>
                                <option value="">Select Structure</option>
                                {dropdowns.feeStructures.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Posting Date *</label>
                            <input type="date" className={inputStyle} value={form.posting_date} onChange={e => updateField('posting_date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Due Date *</label>
                            <input type="date" className={inputStyle} value={form.due_date} onChange={e => updateField('due_date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Naming Series</label>
                            <input type="text" className={inputStyle} value={form.naming_series} disabled />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input type="checkbox" id="sendEmail" checked={form.send_payment_request_email} onChange={e => updateField('send_payment_request_email', e.target.checked ? 1 : 0)} />
                            <label htmlFor="sendEmail" className="text-sm text-gray-600 cursor-pointer">Send Payment Request Email</label>
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
                            <label className={labelStyle}>Academic Term</label>
                            <select className={inputStyle} value={form.academic_term} onChange={e => updateField('academic_term', e.target.value)}>
                                <option value="">Select Term</option>
                                {dropdowns.academicTerms.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Student Groups Table */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider text-[12px]">Student Groups</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
                                <tr>
                                    <th className="px-3 py-2 text-left w-12 font-normal text-gray-400">No.</th>
                                    <th className="px-3 py-2 text-left">Student Group *</th>
                                    <th className="px-3 py-2 text-right">Total Students</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {form.student_groups.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-6 text-gray-400 italic">No Student Groups</td></tr>
                                ) : (
                                    form.student_groups.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-300 bg-white" value={row.student_group} onChange={e => updateGroupRow(idx, 'student_group', e.target.value)}>
                                                    <option value="">Select Group</option>
                                                    {dropdowns.studentGroups.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-gray-500">{row.total_students || 0}</td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeGroupRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addGroupRow}>Add Row</button>
                </div>

                <div className="border-t border-gray-100" />

                {/* components breakup */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wider text-[12px]">Fee Breakup (each student)</h3>
                    <p className="text-[11px] text-gray-400 mb-4 italic">Components automatically loaded from Fee Structure if selected.</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b font-medium">
                                <tr>
                                    <th className="px-3 py-2 text-left w-12 font-normal text-gray-400">No.</th>
                                    <th className="px-3 py-2 text-left">Fees Category *</th>
                                    <th className="px-3 py-2 text-right">Amount *</th>
                                    <th className="px-3 py-2 text-right">Discount(%)</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {form.components.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-6 text-gray-400 italic">No Components</td></tr>
                                ) : (
                                    form.components.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5 text-gray-400">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white outline-none focus:border-blue-300" value={row.fees_category} onChange={e => updateComponentRow(idx, 'fees_category', e.target.value)}>
                                                    <option value="">Select Category</option>
                                                    {dropdowns.feesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right outline-none focus:border-blue-300" value={row.amount} onChange={e => updateComponentRow(idx, 'amount', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right outline-none focus:border-blue-300" value={row.discount} onChange={e => updateComponentRow(idx, 'discount', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-semibold text-gray-700">₹ {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                    
                    <div className="mt-6 flex justify-end">
                       <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 w-64 text-right">
                           <span className={labelStyle}>Total Amount per Student</span>
                           <span className="text-xl font-bold text-blue-900 tracking-tight">₹ {form.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                       </div>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Additional Settings Sections */}
                <div className="space-y-8">
                    {/* Printing Settings */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-6">Printing Settings</h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Letter Head</label>
                                <select className={inputStyle} value={form.letter_head} onChange={e => updateField('letter_head', e.target.value)}>
                                    <option value="">Select Letter Head</option>
                                    {dropdowns.letterHeads.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Print Heading</label>
                                <input type="text" className={inputStyle} value={form.print_heading} onChange={e => updateField('print_heading', e.target.value)} placeholder="e.g. FEE BILL" />
                            </div>
                        </div>
                    </div>

                    {/* Accounting */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-6">Accounting</h3>
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className={labelStyle}>Receivable Account</label>
                                <select className={inputStyle} value={form.receivable_account} onChange={e => updateField('receivable_account', e.target.value)}>
                                    <option value="">Select Account</option>
                                    {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Institution</label>
                                <select className={inputStyle} value={form.institution} onChange={e => updateField('institution', e.target.value)}>
                                    <option value="">Select Institution</option>
                                    {dropdowns.institutions.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Accounting Dimensions */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-6 font-medium">Accounting Dimensions</h3>
                        <div className="grid grid-cols-2 gap-12">
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

export default FeeSchedule;
