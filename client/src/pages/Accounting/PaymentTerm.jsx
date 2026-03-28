import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    payment_term_name: '',
    due_date_based_on: 'Day(s) after invoice date',
    invoice_portion: 100,
    credit_days: 0,
    mode_of_payment: '',
    discount_type: 'Percentage',
    discount: 0,
    description: '',
});

const PaymentTerm = () => {
    const navigate = useNavigate();
    // View state
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [editingRecord, setEditingRecord] = useState(null);

    // List states
    const [terms, setTerms] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [search, setSearch] = useState('');

    // Form states
    const [form, setForm] = useState(emptyForm());
    const [loadingForm, setLoadingForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dropdown options
    const [modesOfPayment, setModesOfPayment] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchTerms();
        } else {
            fetchModesOfPayment();
            if (editingRecord) {
                fetchTerm(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchTerms = async () => {
        try {
            setLoadingList(true);
            const response = await API.get('/api/resource/Payment Term?fields=["name","payment_term_name","credit_days","invoice_portion"]&limit_page_length=None');
            setTerms(response.data.data || []);
        } catch (err) {
            console.error('Error fetching payment terms:', err);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchModesOfPayment = async () => {
        try {
            const res = await API.get('/api/resource/Mode of Payment?fields=["name"]');
            setModesOfPayment((res.data.data || []).map(m => m.name));
        } catch (err) {
            console.error('Error fetching modes of payment:', err);
        }
    };

    const fetchTerm = async (id) => {
        setLoadingForm(true);
        try {
            const res = await API.get(`/api/resource/Payment Term/${encodeURIComponent(id)}`);
            const d = res.data.data;
            setForm({
                payment_term_name: d.payment_term_name || '',
                due_date_based_on: d.due_date_based_on || 'Day(s) after invoice date',
                invoice_portion: d.invoice_portion ?? 100,
                credit_days: d.credit_days ?? 0,
                mode_of_payment: d.mode_of_payment || '',
                discount_type: d.discount_type || 'Percentage',
                discount: d.discount ?? 0,
                description: d.description || '',
            });
        } catch (err) {
            console.error('Error fetching payment term:', err);
            notification.error({ message: 'Error', description: 'Failed to load payment term.' });
        } finally {
            setLoadingForm(false);
        }
    };

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!form.payment_term_name) {
            notification.warning({ message: 'Payment Term Name is required.' });
            return;
        }
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Payment Term/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Payment Term updated.' });
            } else {
                await API.post('/api/resource/Payment Term', form);
                notification.success({ message: 'Payment Term created.' });
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
        if (!window.confirm('Are you sure you want to delete this payment term?')) return;
        try {
            await API.delete(`/api/resource/Payment Term/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Payment Term deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    if (view === 'list') {
        const filtered = terms.filter(t => (t.payment_term_name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="mr-3 p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center"
                            title="Go Back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800">Payment Terms</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={fetchTerms} disabled={loadingList}>
                             Refresh
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Payment Term
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80" placeholder="Search Payment Term..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-600">Payment Term Name</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Invoice Portion (%)</th>
                                <th className="px-6 py-3 font-medium text-gray-600">Credit Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingList ? (
                                <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic font-medium flex-col items-center gap-2">
                                    <Spin />
                                    <span>Fetching payment terms...</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-16 text-gray-500 font-medium italic">No Payment Terms Found</td></tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.name} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-bold block text-base" onClick={() => { setEditingRecord(row.name); setView('form'); }}>
                                                {row.payment_term_name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700">{row.invoice_portion}%</td>
                                        <td className="px-6 py-3 text-gray-600">{row.credit_days} Days</td>
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
                Loading payment term details...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                        {editingRecord ? editingRecord : 'New Payment Term'}
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
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                        <label className={labelStyle}>Payment Term Name</label>
                        <input className={inputStyle} value={form.payment_term_name} onChange={e => updateField('payment_term_name', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelStyle}>Due Date Based On</label>
                        <select className={inputStyle} value={form.due_date_based_on} onChange={e => updateField('due_date_based_on', e.target.value)}>
                            <option value="Day(s) after invoice date">Day(s) after invoice date</option>
                            <option value="Day(s) after end of invoice month">Day(s) after end of invoice month</option>
                            <option value="Day(s) after end of next month">Day(s) after end of next month</option>
                            <option value="Month(s) after end of invoice month">Month(s) after end of invoice month</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>Invoice Portion (%)</label>
                        <input type="number" className={inputStyle} value={form.invoice_portion} onChange={e => updateField('invoice_portion', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelStyle}>Credit Days</label>
                        <input type="number" className={inputStyle} value={form.credit_days} onChange={e => updateField('credit_days', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelStyle}>Mode of Payment</label>
                        <select className={inputStyle} value={form.mode_of_payment} onChange={e => updateField('mode_of_payment', e.target.value)}>
                            <option value="">Select MoP...</option>
                            {modesOfPayment.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {/* Discount Settings Section */}
                <div className="pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-[13px] mb-4 uppercase tracking-wider">Discount Settings</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={labelStyle}>Discount Type</label>
                            <select className={inputStyle} value={form.discount_type} onChange={e => updateField('discount_type', e.target.value)}>
                                <option value="Percentage">Percentage</option>
                                <option value="Amount">Amount</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Discount</label>
                            <input type="number" className={inputStyle} value={form.discount} onChange={e => updateField('discount', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <label className={labelStyle}>Description</label>
                    <textarea 
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50/30 focus:outline-none focus:border-blue-400 min-h-[120px]" 
                        value={form.description} 
                        onChange={e => updateField('description', e.target.value)}
                        placeholder="Detailed terms and conditions..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentTerm;
