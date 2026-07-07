import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';
import { sortEducationalLevels } from '../../utility/sortHelper';
import { FiEdit2, FiTrash2, FiXCircle } from 'react-icons/fi';

const emptyForm = () => ({
    naming_series: 'EDU-FST-.YYYY.-',
    academic_year: '',
    program: '',
    academic_term: '',
    student_category: '',
    
    // Child Table
    components: [], // { fees_category: '', amount: 0, discount: 0, total: 0 }
    
    // Accounts
    receivable_account: '',
    company: '',
    
    // Accounting Dimensions
    cost_center: '',
    docstatus: 0,
});

const FeeStructure = () => {
    const [api, contextHolder] = notification.useNotification();

    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [structures, setStructures] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');
    const [boardFilter, setBoardFilter] = useState('');
    const [programFilter, setProgramFilter] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [search, boardFilter, programFilter, pageSize]);

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
                safeGet('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None'),
                safeGet('/api/resource/Academic Term?limit_page_length=None'),
                safeGet('/api/resource/Student Category?limit_page_length=None'),
                safeGet('/api/resource/Fee Category?limit_page_length=None'),
                safeGet('/api/resource/Account?limit_page_length=None'),
                safeGet('/api/resource/Company?limit_page_length=None'),
                safeGet('/api/resource/Cost Center?limit_page_length=None'),
            ]);
            const fetchedCompanies = coRes.data.data?.map(d => d.name) || [];
            const fetchedAccounts = aRes.data.data?.map(d => d.name) || [];
            const fetchedCostCenters = ccRes.data.data?.map(d => d.name) || [];

            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => ({ name: d.name, custom_board: d.custom_board })) || [],
                academicTerms: tRes.data.data?.map(d => d.name) || [],
                studentCategories: cRes.data.data?.map(d => d.name) || [],
                feesCategories: fRes.data.data?.map(d => d.name) || [],
                accounts: fetchedAccounts,
                companies: fetchedCompanies,
                costCenters: fetchedCostCenters,
            });

            if (fetchedCompanies.length > 0) {
                const activeSystemCode = localStorage.getItem('activeSystem') || 'schooler';
                let defaultComp = fetchedCompanies[0];
                const matchedComp = fetchedCompanies.find(c => 
                    c.toLowerCase().includes('3iinfotech') || 
                    c.toLowerCase().includes(activeSystemCode.toLowerCase())
                );
                if (matchedComp) {
                    defaultComp = matchedComp;
                }

                setForm(prev => {
                    const updates = {};
                    if (!prev.company) {
                        updates.company = defaultComp;
                    }
                    if (!prev.receivable_account) {
                        const matchedAcc = fetchedAccounts.find(a => 
                            a.toLowerCase().includes('debtors') && 
                            (a.toLowerCase().includes('3i') || a.toLowerCase().includes('3id') || a.toLowerCase().includes('schooler'))
                        ) || fetchedAccounts.find(a => a.toLowerCase().includes('debtors')) || fetchedAccounts[0] || '';
                        updates.receivable_account = matchedAcc;
                    }
                    if (!prev.cost_center) {
                        const matchedCC = fetchedCostCenters.find(cc => 
                            cc.toLowerCase().includes('main') && 
                            (cc.toLowerCase().includes('3i') || cc.toLowerCase().includes('3id') || cc.toLowerCase().includes('schooler'))
                        ) || fetchedCostCenters.find(cc => cc.toLowerCase().includes('main')) || fetchedCostCenters[0] || '';
                        updates.cost_center = matchedCC;
                    }
                    return { ...prev, ...updates };
                });
            } else {
                // Also set default program list if no companies are present or just standard loading
            }
        } catch (err) {
            console.error('Error fetching dropdowns', err);
        }
    };

    const fetchStructures = async () => {
        try {
            setLoadingList(true);
            const url = '/api/resource/Fee Structure?fields=["name","academic_year","program","academic_term","student_category","docstatus","total_amount","company"]&limit_page_length=None&order_by=creation desc';
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
                receivable_account: d.receivable_account || '',
                company: d.company || '',
                cost_center: d.cost_center || '',
                docstatus: d.docstatus ?? 0,
            });
        } catch (err) {
            console.error('Error fetching structure:', err);
            api.error({ message: 'Error', description: 'Failed to load fee structure data.' });
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
            api.warning({ message: 'Academic Year is required.' });
            return;
        }

        setSaving(true);
        try {
            const payload = { ...form };
            if (editingRecord) {
                await API.put(`/api/resource/Fee Structure/${encodeURIComponent(editingRecord)}`, payload);
                api.success({ message: 'Fee Structure updated successfully.' });
            } else {
                await API.post('/api/resource/Fee Structure', payload);
                api.success({ message: 'Fee Structure created successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error:', err);
            api.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleAction = async (action, id = null) => {
        const targetId = id || editingRecord;
        if (!targetId) return;
        if (!window.confirm(`Are you sure you want to ${action} ${targetId}?`)) return;
        setSubmitting(true);
        try {
            if (action === 'submit') {
                const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(targetId)}`);
                const latestDoc = res.data.data;
                await API.post('/api/method/frappe.client.submit', { doc: { ...latestDoc, doctype: 'Fee Structure' } });
            } else {
                await API.post('/api/method/frappe.client.cancel', { doctype: 'Fee Structure', name: targetId });
            }
            api.success({ message: `Fee Structure ${action === 'submit' ? 'submitted' : 'cancelled'} successfully.` });
            if (id) {
                fetchStructures();
            } else {
                setView('list');
            }
        } catch (err) {
            console.error(`${action} error:`, err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            api.error({ message: `${action === 'submit' ? 'Submit' : 'Cancel'} Failed`, description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id = null) => {
        const targetId = id || editingRecord;
        if (!targetId) return;
        if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
        try {
            await API.delete(`/api/resource/Fee Structure/${encodeURIComponent(targetId)}`);
            api.success({ message: 'Fee Structure deleted.' });
            if (id) {
                fetchStructures();
            } else {
                setView('list');
            }
        } catch (err) {
            api.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // --- Styles ---
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const uniqueBoards = [...new Set(structures.map(s => s.company).filter(Boolean))].sort();
        const uniquePrograms = [...new Set(structures.map(s => s.program).filter(Boolean))].sort((a, b) => sortEducationalLevels(a, b));

        const filtered = structures.filter(s => {
            if (boardFilter && s.company !== boardFilter) return false;
            if (programFilter && s.program !== programFilter) return false;
            
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.program || '').toLowerCase().includes(q) ||
                (s.academic_year || '').toLowerCase().includes(q)
            );
        });

        return (
            <>
                {contextHolder}
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

                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white shadow-sm focus:ring-1 focus:ring-blue-400" value={boardFilter} onChange={(e) => { setBoardFilter(e.target.value); setProgramFilter(''); }}>
                            <option value="">All Boards</option>
                            {uniqueBoards.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white shadow-sm focus:ring-1 focus:ring-blue-400" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                            <option value="">All Programs</option>
                            {uniquePrograms
                                .filter(p => !boardFilter || structures.some(s => s.program === p && s.company === boardFilter))
                                .map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Program, Year or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <div className="ml-auto text-xs text-gray-400 font-medium tracking-wide uppercase">
                            {!loadingList && `${filtered.length} Total Fee Structures`}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">ID</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Status</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Year</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Program (Class)</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Academic Term</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px]">Student Category</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-right">Total Fees</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 uppercase tracking-wider text-[11px] text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingList ? (
                                    <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic">Loading...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-10 text-gray-400 italic font-medium">No structures found.</td></tr>
                                ) : (
                                    filtered.slice(0, visibleCount).map((row) => (
                                        <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <button className="text-blue-600 hover:underline font-semibold" onClick={() => { setEditingRecord(row.name); setView('form'); }}>{row.name}</button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.docstatus === 1 ? 'bg-green-50 text-green-600 border border-green-200' : row.docstatus === 2 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                                    {row.docstatus === 1 ? 'Submitted' : row.docstatus === 2 ? 'Cancelled' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 font-medium">{row.academic_year || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.program || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.academic_term || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{row.student_category || '-'}</td>
                                            <td className="px-4 py-3 text-gray-900 font-semibold text-right">
                                                ₹ {row.total_amount ? row.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingRecord(row.name); setView('form'); }} 
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer border border-blue-100"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    {row.docstatus === 1 && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAction('cancel', row.name); }} 
                                                            className="p-1.5 text-orange-500 hover:bg-orange-100 rounded-md transition-colors cursor-pointer border border-orange-100"
                                                            title="Cancel"
                                                        >
                                                            <FiXCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(row.docstatus === 0 || row.docstatus === 2) && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(row.name); }} 
                                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors cursor-pointer border border-red-100"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        {!loadingList && filtered.length > 0 && (
                            <div className="flex justify-between items-center p-4 bg-gray-50/30 border-t border-gray-100">
                                <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                    {[20, 100, 500, 2500].map((size) => (
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
            </>
        );
    }

    const isEditable = !editingRecord || form.docstatus === 0;

    if (loadingForm) return <div className="p-6 text-center text-gray-400 italic py-20 font-medium">Loading structure data...</div>;

    return (
        <>
            {contextHolder}
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-6 pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord || 'New Fee Structure'}</span>
                        {!editingRecord ? (
                            <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-red-100 text-red-600 font-medium">Not Saved</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${form.docstatus === 1 ? 'bg-green-50 text-green-700' : form.docstatus === 2 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>
                                {form.docstatus === 1 ? 'Submitted' : form.docstatus === 2 ? 'Cancelled' : 'Draft'}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border border-blue-400 text-blue-600 rounded-md hover:bg-blue-50" onClick={() => setView('list')}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        {editingRecord && (form.docstatus === 0 || form.docstatus === 2) && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm disabled:opacity-50" onClick={handleDelete} disabled={submitting}>Delete</button>
                        )}
                        {editingRecord && form.docstatus === 1 && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm disabled:opacity-50" onClick={() => handleAction('cancel')} disabled={submitting}>Cancel</button>
                        )}
                        {editingRecord && form.docstatus === 0 && (
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50" onClick={() => handleAction('submit')} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        )}
                        {isEditable && (
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition shadow-sm" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-10">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Naming Series</label>
                                <input type="text" className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)} disabled={!isEditable} />
                            </div>
                            <div>
                                <label className={labelStyle}>Company (Board)</label>
                                <select className={inputStyle} value={form.company} onChange={e => {
                                    updateField('company', e.target.value);
                                    updateField('program', ''); // Reset program on board change
                                }} disabled={!isEditable}>
                                    <option value="">Select Company</option>
                                    {dropdowns.companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Program (Class) *</label>
                                <select className={inputStyle} value={form.program} onChange={e => updateField('program', e.target.value)} disabled={!isEditable}>
                                    <option value="">Select Program</option>
                                    {dropdowns.programs
                                        .filter(p => !form.company || p.custom_board === form.company)
                                        .map(p => p.name)
                                        .sort((a, b) => sortEducationalLevels(a, b))
                                        .map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Student Category</label>
                                <select className={inputStyle} value={form.student_category} onChange={e => updateField('student_category', e.target.value)} disabled={!isEditable}>
                                    <option value="">Select Category</option>
                                    {dropdowns.studentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className={labelStyle}>Academic Year *</label>
                                <select className={inputStyle} value={form.academic_year} onChange={e => updateField('academic_year', e.target.value)} disabled={!isEditable}>
                                    <option value="">Select Year</option>
                                    {dropdowns.academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Academic Term</label>
                                <select className={inputStyle} value={form.academic_term} onChange={e => updateField('academic_term', e.target.value)} disabled={!isEditable}>
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
                                                    <select className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white" value={row.fees_category} onChange={e => updateComponentRow(idx, 'fees_category', e.target.value)} disabled={!isEditable}>
                                                        <option value="">Select Category</option>
                                                        {dropdowns.feesCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.amount} onChange={e => updateComponentRow(idx, 'amount', e.target.value)} disabled={!isEditable} />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white text-right" value={row.discount} onChange={e => updateComponentRow(idx, 'discount', e.target.value)} disabled={!isEditable} />
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-medium text-gray-700">₹ {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {isEditable && (
                                                        <button onClick={() => removeComponentRow(idx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition font-bold">✕</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {isEditable && (
                            <button className="mt-4 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[13px] font-medium rounded hover:bg-gray-100 shadow-sm" onClick={addComponentRow}>Add Row</button>
                        )}
                    </div>

                    <div className="border-t border-gray-100" />
                    
                    <h3 className="text-base font-semibold text-gray-900 -mb-4">Accounts</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={labelStyle}>Receivable Account *</label>
                            <select className={inputStyle} value={form.receivable_account} onChange={e => updateField('receivable_account', e.target.value)} disabled={!isEditable}>
                                <option value="">Select Account</option>
                                {dropdowns.accounts.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            {/* Company dropdown moved to top */}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8" />
                    <h3 className="text-base font-semibold text-gray-900 -mb-4">Accounting Dimensions</h3>
                    <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <label className={labelStyle}>Cost Center</label>
                            <select className={inputStyle} value={form.cost_center} onChange={e => updateField('cost_center', e.target.value)} disabled={!isEditable}>
                                <option value="">Select Cost Center</option>
                                {dropdowns.costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FeeStructure;
