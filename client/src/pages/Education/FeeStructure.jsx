import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    naming_series: 'EDU-FST-.YYYY.-',
    academic_year: '',
    program: '',
    academic_term: '',
    student_category: '',
    
    // Child Table
    components: [], // { fees_category: '', amount: 0, discount: 0, total: 0 }
    
    // Accounts
    receivable_account: 'Debtors - Preeshe',
    company: 'Preeshe Consultancy Services',
    
    // Accounting Dimensions
    cost_center: 'Main - Preeshe',
});

const FeeStructure = () => {
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [structures, setStructures] = useState([]);
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
        academicTerms: [],
        studentCategories: [],
        feesCategories: [],
        accounts: [],
        companies: [],
        costCenters: [],
    });

    useEffect(() => {
        if (view === 'list') {
            fetchStructures();
        } else {
            fetchDropdowns();
            if (editingRecord) {
                fetchStructure(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(err => { console.error(`Error fetching ${url}:`, err); return { data: { data: [] } }; });
            const [yRes, pRes, tRes, cRes, fRes, aRes, coRes, ccRes] = await Promise.all([
                safeGet('/api/resource/Academic Year?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Academic Term?limit_page_length=None'),
                safeGet('/api/resource/Student Category?limit_page_length=None'),
                safeGet('/api/resource/Fee Category?limit_page_length=None'),
                safeGet('/api/resource/Account?limit_page_length=None'),
                safeGet('/api/resource/Company?limit_page_length=None'),
                safeGet('/api/resource/Cost Center?limit_page_length=None'),
            ]);
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                studentCategories: cRes.data.data?.map(d => d.name) || [],
                feesCategories: fRes.data.data?.map(d => d.name) || [],
                accounts: aRes.data.data?.map(d => d.name) || [],
                companies: coRes.data.data?.map(d => d.name) || [],
                costCenters: ccRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchStructures = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fee Structure?fields=["name","academic_year","program","academic_term","student_category"]&limit_page_length=None&order_by=creation desc';
            const response = await API.get(url);
            setStructures(response.data.data || []);
        } catch (err) {
            console.error('Error fetching fee structures:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchStructure = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                naming_series: d.naming_series || 'EDU-FST-.YYYY.-',
                academic_year: d.academic_year || '',
                program: d.program || '',
                academic_term: d.academic_term || '',
                student_category: d.student_category || '',
                components: (d.components || []).map(c => ({
                    fees_category: c.fees_category || '',
                    amount: c.amount || 0,
                    discount: c.discount_amount || c.discount || 0,
                    total: c.total_amount || c.total || 0,
                })),
                receivable_account: d.receivable_account || 'Debtors - Preeshe',
                company: d.company || 'Preeshe Consultancy Services',
                cost_center: d.cost_center || 'Main - Preeshe',
            });
        } catch (err) {
            console.error('Error fetching structure:', err);
            notification.error({ message: 'Error', description: 'Failed to load fee structure data.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    // --- Child Table Functions ---
    const addComponentRow = () => {
        setForm(prev => ({
            ...prev,
            components: [...prev.components, { fees_category: '', amount: 0, discount: 0, total: 0 }]
        }));
    };

    const removeComponentRow = (index) => {
        const newComponents = [...form.components];
        newComponents.splice(index, 1);
        setForm(prev => ({ ...prev, components: newComponents }));
    };

    const updateComponentRow = (index, field, value) => {
        const newComponents = [...form.components];
        let val = value;
        if (field === 'amount' || field === 'discount') {
            val = parseFloat(value) || 0;
        }
        newComponents[index][field] = val;
        
        // Calculate total
        const amt = field === 'amount' ? val : newComponents[index].amount;
        const discStr = field === 'discount' ? val : newComponents[index].discount;
        const disc = parseFloat(discStr) || 0;
        
        // Assuming discount is percentage as per UI (%)
        newComponents[index].total = amt - (amt * (disc / 100));
        
        setForm(prev => ({ ...prev, components: newComponents }));
    };

    const handleSave = async () => {
        if (!form.academic_year) {
            notification.warning({ message: 'Academic Year is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Fee Structure/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Fee Structure updated successfully.' });
            } else {
                await API.post('/api/resource/Fee Structure', payload);
                notification.success({ message: 'Fee Structure created successfully.' });
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
        if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
        try {
            await API.delete(`/api/resource/Fee Structure/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Fee Structure deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = structures.filter(s => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.program || '').toLowerCase().includes(q) ||
                (s.academic_year || '').toLowerCase().includes(q)
            );
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Fee Structure</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchStructures} disabled={loadingList}>
                             ⟳ Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Structure
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-64" placeholder="Search Program, Year or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Year</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Program</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Term</th>
                                <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Student Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium">No structures found.</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{row.academic_year || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.academic_term || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{row.student_category || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20 font-medium">Loading structure data...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Fee Structure'}</span>
                    {!editingRecord && <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-100 text-red-600 font-medium">Not Saved</span>}
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
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyle}>Naming Series</label>
                            <input type="text" className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Program *</label>
                            <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)}>
                                <option value="">Select Program</option>
                                {dropdowns.programs.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Student Category</label>
                            <select className={inputStyle} value={form.student_category} onChange={e => updateField('student_category', e.target.value)}>
                                <option value="">Select Category</option>
                                {dropdowns.studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
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

                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider text-[12px]">Components</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 border-b">
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
                                                <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.fees_category} onChange={e => updateComponentRow(idx, 'fees_category', e.target.value)}>
                                                    <option value="">Select Category</option>
                                                    {dropdowns.feesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.amount} onChange={e => updateComponentRow(idx, 'amount', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.discount} onChange={e => updateComponentRow(idx, 'discount', e.target.value)} />
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-medium text-gray-700">₹ {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-3 py-2.5 text-center">
                                                <button onClick={() => removeComponentRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold">✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addComponentRow}>Add Row</button>
                </div>

                <div className="border-t border-gray-100" />
                
                <h3 className="text-base font-semibold text-gray-900 -mb-4">Accounts</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Receivable Account *</label>
                        <select className={inputStyle} value={form.receivable_account} onChange={e => updateField('receivable_account', e.target.value)}>
                            <option value="">Select Account</option>
                            {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Company</label>
                        <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                            <option value="">Select Company</option>
                            {dropdowns.companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">Ledger Entries will be created against the company mentioned here.</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8" />
                <h3 className="text-base font-semibold text-gray-900 -mb-4">Accounting Dimensions</h3>
                <div className="grid grid-cols-2 gap-x-12">
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
    );
};

export default FeeStructure;
