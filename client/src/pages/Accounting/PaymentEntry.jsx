import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    naming_series: 'ACC-PAY-.YYYY.-',
    posting_date: new Date().toISOString().split('T')[0],
    payment_type: 'Receive',
    company: 'Preeshee Consultancy Services',
    mode_of_payment: '',
    party_type: 'Customer',
    party: '',
    party_name: '',
    paid_to: '',
    paid_amount: 0,
    received_amount: 0,
    taxes: [],
});

const PaymentEntry = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [payments, setPayments] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Collapsible states
    const [sections, setSections] = useState({
        accounts: true,
        taxes: false,
        dimensions: false
    });

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [modesOfPayment, setModesOfPayment] = useState([]);
    const [partyTypes, setPartyTypes] = useState(['Customer', 'Supplier', 'Shareholder', 'Employee', 'Student']);
    const [accounts, setAccounts] = useState([]);
    const [parties, setParties] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchPayments();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchPayment(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchPayments = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Payment Entry?fields=["name","posting_date","payment_type","party","paid_amount","received_amount","status"]&limit_page_length=None&order_by=posting_date desc');
            setPayments(response.data.data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [compRes, mopRes, accRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]'),
                API.get('/api/resource/Mode of Payment?fields=["name"]'),
                API.get('/api/resource/Account?fields=["name","account_name"]&limit_page_length=None'),
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setModesOfPayment((mopRes.data.data || []).map(m => m.name));
            setAccounts((accRes.data.data || []).map(a => a.name));
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
        }
    };

    const fetchParties = async (type) => {
        try {
            const res = await API.get(`/api/resource/${type}?fields=["name"]&limit_page_length=None`);
            setParties((res.data.data || []).map(p => p.name));
        } catch (err) {
            console.error('Error fetching parties:', err);
        }
    };

    useEffect(() => {
        if (form.party_type && view === 'form') {
            fetchParties(form.party_type);
        }
    }, [form.party_type, view]);

    const fetchPayment = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Payment Entry/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                naming_series: d.naming_series || 'ACC-PAY-.YYYY.-',
                posting_date: d.posting_date || '',
                payment_type: d.payment_type || 'Receive',
                company: d.company || '',
                mode_of_payment: d.mode_of_payment || '',
                party_type: d.party_type || 'Customer',
                party: d.party || '',
                party_name: d.party_name || '',
                paid_to: d.paid_to || '',
                paid_amount: d.paid_amount ?? 0,
                received_amount: d.received_amount ?? 0,
                taxes: (d.taxes || []).map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9) })),
            });
        } catch (err) {
            console.error('Error fetching payment:', err);
            notification.error({ message: 'Error', description: 'Failed to load payment entry.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Payment Entry/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Payment Entry updated.' });
            } else {
                await API.post('/api/resource/Payment Entry', form);
                notification.success({ message: 'Payment Entry created.' });
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
        if (!window.confirm('Are you sure you want to delete this payment entry?')) return;
        try {
            await API.delete(`/api/resource/Payment Entry/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Payment Entry deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Handlers
    const addTaxRow = () => {
        setForm(prev => ({
            ...prev,
            taxes: [...prev.taxes, { id: Math.random().toString(36).substr(2, 9), charge_type: 'On Net Total', account_head: '', rate: 0, tax_amount: 0, total: 0 }]
        }));
    };

    const removeTaxRow = (id) => {
        setForm(prev => ({
            ...prev,
            taxes: prev.taxes.filter(t => t.id !== id)
        }));
    };

    const updateTaxRow = (id, key, value) => {
        setForm(prev => {
            const newTaxes = prev.taxes.map(t => {
                if (t.id === id) {
                    const updated = { ...t, [key]: value };
                    if (key === 'rate' || key === 'tax_amount') {
                        // Simple calc for demo
                        updated.total = updated.tax_amount; 
                    }
                    return updated;
                }
                return t;
            });
            return { ...prev, taxes: newTaxes };
        });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = payments.filter(p => (p.party || '').toLowerCase().includes(search.toLowerCase()) || (p.name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Payment Entries</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchPayments} disabled={loadingList}>
                             Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Payment Entry
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Payment ID or Party..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600">ID / Date</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Party</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Type</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-gray-600 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching entries...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-16 text-gray-500 font-medium italic">No Payments Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400">{row.posting_date}</div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 font-medium">{row.party || '-'}</td>
                                        <td className="px-6 py-3 text-gray-600">{row.payment_type}</td>
                                        <td className="px-6 py-3 text-gray-900 font-bold text-right">
                                            {row.payment_type === 'Receive' ? row.received_amount : row.paid_amount}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                                                row.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
                                            }`}>
                                                {row.status || 'Draft'}
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

    if (loadingForm) {
        return (
            <div className="p-6 max-w-5xl mx-auto flex justify-center py-20 text-gray-400 italic font-medium flex-col items-center gap-4">
                <Spin size="large" />
                Loading payment entry details...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Payment Entry'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-10 text-gray-800">
                {/* Type of Payment */}
                <div>
                   <h3 className="font-bold text-gray-800 text-[15px] mb-6 tracking-tight">Type of Payment</h3>
                   <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={labelStyle}>Series *</label>
                            <select className={inputStyle} value={form.naming_series} onChange={e => updateField('naming_series', e.target.value)}>
                                <option value="ACC-PAY-.YYYY.-">ACC-PAY-.YYYY.-</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Posting Date *</label>
                            <input type="date" className={inputStyle} value={form.posting_date} onChange={e => updateField('posting_date', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelStyle}>Payment Type *</label>
                            <select className={inputStyle} value={form.payment_type} onChange={e => updateField('payment_type', e.target.value)}>
                                <option value="Receive">Receive</option>
                                <option value="Pay">Pay</option>
                                <option value="Internal Transfer">Internal Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Company *</label>
                            <select className={inputStyle} value={form.company} onChange={e => updateField('company', e.target.value)}>
                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className={labelStyle}>Mode of Payment</label>
                            <select className={inputStyle} value={form.mode_of_payment} onChange={e => updateField('mode_of_payment', e.target.value)}>
                                <option value="">Select MoP...</option>
                                {modesOfPayment.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                   </div>
                </div>

                {/* Payment From / To */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[15px] mb-6 tracking-tight">Payment From / To</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={labelStyle}>Party Type</label>
                            <select className={inputStyle} value={form.party_type} onChange={e => updateField('party_type', e.target.value)}>
                                {partyTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </select>
                        </div>
                        <div></div>
                        <div>
                            <label className={labelStyle}>Party</label>
                            <select className={inputStyle} value={form.party} onChange={e => updateField('party', e.target.value)}>
                                <option value="">Select Party...</option>
                                {parties.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Party Name</label>
                            <input className={inputStyle} value={form.party_name} disabled placeholder="Fetched from party..." />
                        </div>
                    </div>
                </div>

                {/* Accounts (Collapsible) */}
                <div className="pt-8 border-t border-gray-100">
                    <button className="flex items-center justify-between w-full mb-4 group" onClick={() => setSections(prev => ({ ...prev, accounts: !prev.accounts }))}>
                        <h3 className="font-bold text-gray-800 text-[15px] tracking-tight">Accounts</h3>
                        <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${sections.accounts ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {sections.accounts && (
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-4">
                            <div>
                                <label className={labelStyle}>Account Paid To *</label>
                                <select className={inputStyle} value={form.paid_to} onChange={e => updateField('paid_to', e.target.value)}>
                                    <option value="">Select Account...</option>
                                    {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Paid Amount</label>
                                    <input type="number" className={inputStyle} value={form.paid_amount} onChange={e => updateField('paid_amount', Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Received Amount</label>
                                    <input type="number" className={inputStyle} value={form.received_amount} onChange={e => updateField('received_amount', Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Taxes and Charges (Collapsible) */}
                <div className="pt-8 border-t border-gray-100">
                    <button className="flex items-center justify-between w-full mb-4 group" onClick={() => setSections(prev => ({ ...prev, taxes: !prev.taxes }))}>
                        <h3 className="font-bold text-gray-800 text-[15px] tracking-tight">Taxes and Charges</h3>
                        <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${sections.taxes ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {sections.taxes && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Advance Taxes and Charges</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 border-b">
                                        <tr className="text-gray-600 font-medium">
                                            <th className="px-4 py-2 w-12 text-center">No.</th>
                                            <th className="px-4 py-2 text-left">Type *</th>
                                            <th className="px-4 py-2 text-left">Account Head *</th>
                                            <th className="px-4 py-2 text-right">Rate</th>
                                            <th className="px-4 py-2 text-right">Amount</th>
                                            <th className="px-4 py-2 text-right">Total</th>
                                            <th className="px-4 py-2 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {form.taxes.length === 0 ? (
                                            <tr><td colSpan="7" className="px-4 py-16 text-center text-gray-400 italic">No Data</td></tr>
                                        ) : (
                                            form.taxes.map((row, idx) => (
                                                <tr key={row.id}>
                                                    <td className="px-4 py-2 text-center text-gray-400 font-mono">{idx + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <select className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.charge_type} onChange={e => updateTaxRow(row.id, 'charge_type', e.target.value)}>
                                                            <option value="On Net Total">On Net Total</option>
                                                            <option value="On Previous Row Total">On Pervious Row Total</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <select className="w-full border-none focus:ring-0 text-sm py-1 bg-transparent" value={row.account_head} onChange={e => updateTaxRow(row.id, 'account_head', e.target.value)}>
                                                            <option value="">Select Account...</option>
                                                            {accounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <input type="number" className="w-20 border-none focus:ring-0 text-sm py-1 bg-transparent text-right" value={row.rate} onChange={e => updateTaxRow(row.id, 'rate', Number(e.target.value))} />
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <input type="number" className="w-24 border-none focus:ring-0 text-sm py-1 bg-transparent text-right" value={row.tax_amount} onChange={e => updateTaxRow(row.id, 'tax_amount', Number(e.target.value))} />
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-gray-900 font-medium">{row.total}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <button className="text-red-400 hover:text-red-600 transition p-1" onClick={() => removeTaxRow(row.id)}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                                    <button className="px-4 py-1.5 bg-white border border-gray-300 rounded text-[13px] font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm" onClick={addTaxRow}>
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Accounting Dimensions (Collapsible) */}
                <div className="pt-8 border-t border-gray-100">
                    <button className="flex items-center justify-between w-full mb-4 group" onClick={() => setSections(prev => ({ ...prev, dimensions: !prev.dimensions }))}>
                        <h3 className="font-bold text-gray-800 text-[15px] tracking-tight">Accounting Dimensions</h3>
                        <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${sections.dimensions ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {sections.dimensions && (
                        <div className="py-4 text-center text-gray-400 italic text-sm">No dimensions configured</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentEntry;
