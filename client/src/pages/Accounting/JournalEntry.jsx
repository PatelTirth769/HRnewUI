import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    voucher_type: 'Journal Entry',
    naming_series: 'ACC-JV-.YYYY.-',
    company: 'Preeshee Consultancy Services',
    posting_date: new Date().toISOString().split('T')[0],
    cheque_no: '',
    cheque_date: '',
    user_remark: '',
    multi_currency: 0,
    accounts: [],
    // Reference
    bill_no: '',
    bill_date: '',
    due_date: '',
    // Printing
    pay_to_recd_from: '',
    letter_head: '',
    print_heading: '',
    // More Info
    mode_of_payment: '',
    is_opening: 'No',
});

const JournalEntry = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [entries, setEntries] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Collapsible states
    const [sections, setSections] = useState({
        reference: false,
        printing: false,
        moreInfo: false
    });

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [modesOfPayment, setModesOfPayment] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);
    const [partyTypes, setPartyTypes] = useState(['Customer', 'Supplier', 'Shareholder', 'Employee', 'Student']);

    useEffect(() => {
        if (view === 'list') {
            fetchEntries();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchEntry(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchEntries = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Journal Entry?fields=["name","posting_date","voucher_type","company","total_debit","total_credit"]&limit_page_length=None&order_by=posting_date desc');
            setEntries(response.data.data || []);
        } catch (err) {
            console.error('Error fetching journal entries:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, mopRes, accRes, lhRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Mode of Payment?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Letter Head?fields=["name"]'),
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setModesOfPayment((mopRes.data.data || []).map(m => m.name));
            setAccounts((accRes.data.data || []).map(a => a.name));
            setLetterHeads((lhRes.data.data || []).map(l => l.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchEntry = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Journal Entry/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                ...d,
                accounts: (d.accounts || []).map(acc => ({ ...acc, id: Math.random().toString(36).substr(2, 9) })),
            });
        } catch (err) {
            console.error('Error fetching entry:', err);
            notification.error({ message: 'Error', description: 'Failed to load journal entry.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        const totalDebit = form.accounts.reduce((sum, a) => sum + (Number(a.debit) || 0), 0);
        const totalCredit = form.accounts.reduce((sum, a) => sum + (Number(a.credit) || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            notification.warning({ message: 'Entry Unbalanced', description: `Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)}).` });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Journal Entry/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Journal Entry updated.' });
            } else {
                await API.post('/api/resource/Journal Entry', form);
                notification.success({ message: 'Journal Entry created.' });
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
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await API.delete(`/api/resource/Journal Entry/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Journal Entry deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Handlers
    const addAccountRow = () => {
        setForm(prev => ({
            ...prev,
            accounts: [...prev.accounts, { id: Math.random().toString(36).substr(2, 9), account: '', party_type: '', party: '', debit: 0, credit: 0 }]
        }));
    };

    const removeAccountRow = (id) => {
        setForm(prev => ({
            ...prev,
            accounts: prev.accounts.filter(a => a.id !== id)
        }));
    };

    const updateAccountRow = (id, key, value) => {
        setForm(prev => ({
            ...prev,
            accounts: prev.accounts.map(a => a.id === id ? { ...a, [key]: value } : a)
        }));
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = entries.filter(e => (e.name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Journal Entries</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchEntries} disabled={loadingList}>
                             Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Journal Entry
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Voucher ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600">ID / Date</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Voucher Type</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-right">Debit</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-right">Credit</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-center">Company</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching entries...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-16 text-gray-500 font-medium italic">No Entries Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400">{row.posting_date}</div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">{row.voucher_type}</td>
                                        <td className="px-6 py-3 text-gray-900 font-bold text-right">{row.total_debit?.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-gray-900 font-bold text-right">{row.total_credit?.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-gray-500 text-center text-xs italic">{row.company}</td>
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
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20 text-gray-400 italic font-medium flex-col items-center gap-4">
                <Spin size="large" />
                Loading journal entry details...
            </div>
        );
    }

    const totalDebit = form.accounts.reduce((sum, a) => sum + (Number(a.debit) || 0), 0);
    const totalCredit = form.accounts.reduce((sum, a) => sum + (Number(a.credit) || 0), 0);

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Journal Entry'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-10 text-gray-800">
                {/* Main Fields */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Entry Type *</label>
                        <select className={inputStyle} value={form.voucher_type} onChange={e => updateField('voucher_type', e.target.value)}>
                            <option value="Journal Entry">Journal Entry</option>
                            <option value="Contra Entry">Contra Entry</option>
                            <option value="Excise Entry">Excise Entry</option>
                            <option value="Credit Note">Credit Note</option>
                            <option value="Debit Note">Debit Note</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>From Template</label>
                        <input className={inputStyle} placeholder="Search template..." />
                    </div>
                    <div>
                        <label className={labelStyle}>Series *</label>
                        <select className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)}>
                            <option value="ACC-JV-.YYYY.-">ACC-JV-.YYYY.-</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Company *</label>
                        <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Posting Date *</label>
                        <input type="date" className={inputStyle} value={form.posting_date} onChange={e => updateField('posting_date', e.target.value)} />
                    </div>
                </div>

                {/* Accounting Entries Grid */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[15px] mb-6 tracking-tight">Accounting Entries</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b">
                                <tr className="text-gray-600 font-medium whitespace-nowrap">
                                    <th className="px-4 py-2 w-12 text-center">No.</th>
                                    <th className="px-4 py-2 text-left min-w-[200px]">Account *</th>
                                    <th className="px-4 py-2 text-left">Party Type</th>
                                    <th className="px-4 py-2 text-left">Party</th>
                                    <th className="px-4 py-2 text-right">{form.multi_currency ? 'Debit in Account Currency' : 'Debit'}</th>
                                    <th className="px-4 py-2 text-right">{form.multi_currency ? 'Credit in Account Currency' : 'Credit'}</th>
                                    <th className="px-4 py-2 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {form.accounts.length === 0 ? (
                                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400 italic">No Rows - Add an entry below</td></tr>
                                ) : (
                                    form.accounts.map((row, idx) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                            <td className="px-4 py-2">
                                                <select className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.account} onChange={e => updateAccountRow(row.id, 'account', e.target.value)}>
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <select className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.party_type} onChange={e => updateAccountRow(row.id, 'party_type', e.target.value)}>
                                                    <option value="">N/A</option>
                                                    {partyTypes.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.party} onChange={e => updateAccountRow(row.id, 'party', e.target.value)} placeholder="Search party..." />
                                            </td>
                                            <td className="px-4 py-2 bg-blue-50/10">
                                                <input type="number" className="w-[100px] border-none focus:ring-0 text-sm py-1 bg-transparent text-right font-medium text-blue-700" value={row.debit} onChange={e => updateAccountRow(row.id, 'debit', Number(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-2 bg-orange-50/10">
                                                <input type="number" className="w-[100px] border-none focus:ring-0 text-sm py-1 bg-transparent text-right font-medium text-orange-700" value={row.credit} onChange={e => updateAccountRow(row.id, 'credit', Number(e.target.value))} />
                                            </td>
                                            <td className="px-4 py-2 text-center text-red-300 hover:text-red-500 transition">
                                                <button onClick={() => removeAccountRow(row.id)}>✕</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <div className="p-3 bg-gray-100/50 border-t border-gray-200 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button className="px-4 py-1.5 bg-white border border-gray-200 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm" onClick={addAccountRow}>Add Row</button>
                                <button className="px-4 py-1.5 bg-white border border-gray-200 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">Add Multiple</button>
                            </div>
                            <div className="flex gap-6 text-[13px] font-bold">
                                <div>Total Debit: <span className="text-blue-600">₹{totalDebit.toFixed(2)}</span></div>
                                <div>Total Credit: <span className="text-orange-600">₹{totalCredit.toFixed(2)}</span></div>
                                <div className={`px-2 rounded ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Diff: ₹{(totalDebit - totalCredit).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 pt-4 items-end">
                        <div className="space-y-1">
                            <label className={labelStyle}>Reference Number</label>
                            <input className={inputStyle} value={form.cheque_no} onChange={e => updateField('cheque_no', e.target.value)} placeholder="" />
                        </div>
                        <div className="pb-2">
                            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-800 font-medium">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={!!form.multi_currency} onChange={e => updateField('multi_currency', e.target.checked ? 1 : 0)} />
                                Multi Currency
                            </label>
                        </div>
                        <div>
                            <label className={labelStyle}>Reference Date</label>
                            <input type="date" className={inputStyle} value={form.cheque_date} onChange={e => updateField('cheque_date', e.target.value)} />
                        </div>
                        <div></div>
                        <div className="col-span-2">
                            <label className={labelStyle}>User Remark</label>
                            <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50/30 focus:outline-none focus:border-blue-400 min-h-[80px]" value={form.user_remark} onChange={e => updateField('user_remark', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Collapsible Metadata Sections */}
                {[
                    { id: 'reference', title: 'Reference', fields: [ { label: 'Bill No', key: 'bill_no' }, { label: 'Bill Date', key: 'bill_date', type: 'date' }, { label: 'Due Date', key: 'due_date', type: 'date' } ] },
                    { id: 'printing', title: 'Printing Settings', fields: [ { label: 'Pay To / Recd From', key: 'pay_to_recd_from' }, { label: 'Letter Head', key: 'letter_head', type: 'select', options: letterHeads }, { label: 'Print Heading', key: 'print_heading' } ] },
                    { id: 'moreInfo', title: 'More Information', fields: [ { label: 'Mode of Payment', key: 'mode_of_payment', type: 'select', options: modesOfPayment }, { label: 'Is Opening', key: 'is_opening', type: 'select', options: ['No', 'Yes'] } ] },
                ].map(section => (
                    <div key={section.id} className="pt-8 border-t border-gray-100">
                        <button className="flex items-center justify-between w-full group" onClick={() => setSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}>
                            <h3 className="font-bold text-gray-800 text-[15px] tracking-tight">{section.title}</h3>
                            <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${sections[section.id] ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {sections[section.id] && (
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mt-6">
                                {section.fields.map(field => (
                                    <div key={field.key}>
                                        <label className={labelStyle}>{field.label}</label>
                                        {field.type === 'select' ? (
                                            <select className={inputStyle} value={form[field.key]} onChange={e => updateField(field.key, e.target.value)}>
                                                <option value="">Select...</option>
                                                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input type={field.type || 'text'} className={inputStyle} value={form[field.key]} onChange={e => updateField(field.key, e.target.value)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JournalEntry;
