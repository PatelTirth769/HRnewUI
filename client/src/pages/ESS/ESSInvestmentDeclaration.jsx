import React, { useState, useEffect } from 'react';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const getStatusLabel = (doc) => {
    if (doc.docstatus === 1) return 'Submitted';
    if (doc.docstatus === 2) return 'Cancelled';
    return doc.status || 'Draft';
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Submitted': return 'bg-[#EBF5FF] text-[#2B6CB0] font-medium';
        case 'Cancelled': return 'bg-[#F3F4F6] text-[#374151] font-medium';
        case 'Draft': return 'bg-[#FCE8E8] text-[#E02424] font-medium';
        default: return 'bg-gray-100 text-gray-700 font-medium';
    }
};

const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
};

export default function ESSInvestmentDeclaration({ employeeData }) {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Form Data
    const [editingRecord, setEditingRecord] = useState(null);
    const defaultForm = {
        name: '',
        employee: employeeData?.name || '',
        employee_name: employeeData?.employee_name || '',
        company: employeeData?.company || '',
        payroll_period: '',
        total_declared_amount: 0,
        total_exemption_amount: 0,
        declarations: [],
        docstatus: 0,
        status: 'Draft'
    };
    const [formData, setFormData] = useState({ ...defaultForm });
    const [payrollPeriods, setPayrollPeriods] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
        }
    }, [view, employeeData]);

    const fetchData = async () => {
        if (!employeeData?.name) return;
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Tax Exemption Declaration?fields=["name","employee","employee_name","company","payroll_period","total_declared_amount","total_exemption_amount","docstatus"]&filters=[["employee","=","${employeeData.name}"]]&order_by=modified desc`);
            setData(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Failed to load records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [periods, cats] = await Promise.all([
                API.get('/api/resource/Payroll Period?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Employee Tax Exemption Category?fields=["name"]&limit_page_length=None')
            ]);
            setPayrollPeriods((periods.data.data || []).map(p => p.name));
            setCategories((cats.data.data || []).map(c => c.name));
        } catch (err) {
            console.error('Master fetch failed', err);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm, declarations: [] });
        setView('form');
    };

    const handleEdit = async (record) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Tax Exemption Declaration/${encodeURIComponent(record.name)}`);
            if (res.data.data) {
                setEditingRecord(res.data.data);
                setFormData(res.data.data);
                setView('form');
            }
        } catch (err) {
            notification.error({ message: 'Failed to load details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (submit = false) => {
        if (!formData.payroll_period) { notification.warning({ message: 'Payroll Period is required' }); return; }
        setSaving(true);
        try {
            const payload = {
                ...formData,
                docstatus: submit ? 1 : 0
            };
            if (editingRecord) {
                await API.put(`/api/resource/Employee Tax Exemption Declaration/${encodeURIComponent(editingRecord.name)}`, payload);
            } else {
                await API.post('/api/resource/Employee Tax Exemption Declaration', payload);
            }
            notification.success({ message: `Declaration ${submit ? 'submitted' : 'saved'}!` });
            setView('list');
            fetchData();
        } catch (err) {
            notification.error({ message: 'Save failed', description: err.response?.data?.message || err.message });
        } finally {
            setSaving(false);
        }
    };

    const addRow = () => {
        setFormData(prev => ({
            ...prev,
            declarations: [...(prev.declarations || []), { exemption_sub_category: '', exemption_category: '', amount: 0 }]
        }));
    };

    const removeRow = (idx) => {
        setFormData(prev => ({
            ...prev,
            declarations: (prev.declarations || []).filter((_, i) => i !== idx)
        }));
    };

    const updateRow = (idx, field, val) => {
        setFormData(prev => {
            const news = [...(prev.declarations || [])];
            news[idx] = { ...news[idx], [field]: val };
            return { ...prev, declarations: news };
        });
    };

    if (view === 'list') {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">My Investment Declarations</h2>
                    <button onClick={handleNew} className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600">
                        + New Declaration
                    </button>
                </div>
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Payroll Period</th>
                                <th className="px-4 py-3 font-medium text-right">Amount</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">No records found.</td></tr>
                            ) : (
                                data.map(r => (
                                    <tr key={r.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(r)}>
                                        <td className="px-4 py-3 text-blue-600 font-medium">{r.name}</td>
                                        <td className="px-4 py-3">{r.payroll_period}</td>
                                        <td className="px-4 py-3 text-right">{formatINR(r.total_declared_amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${getStatusColor(getStatusLabel(r))}`}>
                                                {getStatusLabel(r)}
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

    const isSubmitted = formData.docstatus === 1;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-lg font-semibold">{editingRecord ? editingRecord.name : 'New Declaration'}</h2>
                    <span className={`px-2 py-0.5 rounded text-[11px] uppercase ${getStatusColor(getStatusLabel(formData))}`}>
                        {getStatusLabel(formData)}
                    </span>
                </div>
                <div className="flex gap-2">
                    {!isSubmitted && (
                        <>
                            <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 bg-gray-900 text-white rounded text-sm disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            {editingRecord && (
                                <button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
                                    Submit
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white border rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Payroll Period *</label>
                        <select 
                            className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-orange-400 disabled:bg-gray-50"
                            value={formData.payroll_period}
                            onChange={e => setFormData({...formData, payroll_period: e.target.value})}
                            disabled={isSubmitted}
                        >
                            <option value=""></option>
                            {payrollPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-sm font-semibold mb-3">Declarations</h3>
                    <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-2 font-medium w-48">Category</th>
                                    <th className="px-4 py-2 font-medium">Sub Category / Description</th>
                                    <th className="px-4 py-2 font-medium text-right w-32">Amount</th>
                                    {!isSubmitted && <th className="px-2 py-2 w-8"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(formData.declarations || []).map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="px-2 py-1">
                                            <select 
                                                className="w-full border-none bg-transparent text-sm focus:ring-0 disabled:text-gray-500"
                                                value={row.exemption_category}
                                                onChange={e => updateRow(idx, 'exemption_category', e.target.value)}
                                                disabled={isSubmitted}
                                            >
                                                <option value=""></option>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1">
                                            <input 
                                                className="w-full border-none bg-transparent text-sm focus:ring-0 disabled:text-gray-500"
                                                value={row.exemption_sub_category}
                                                onChange={e => updateRow(idx, 'exemption_sub_category', e.target.value)}
                                                placeholder="e.g. Life Insurance, PPF"
                                                readOnly={isSubmitted}
                                            />
                                        </td>
                                        <td className="px-2 py-1">
                                            <input 
                                                type="number"
                                                className="w-full border-none bg-transparent text-sm text-right focus:ring-0 disabled:text-gray-500"
                                                value={row.amount}
                                                onChange={e => updateRow(idx, 'amount', e.target.value)}
                                                readOnly={isSubmitted}
                                            />
                                        </td>
                                        {!isSubmitted && (
                                            <td className="px-2 py-1 text-center">
                                                <button onClick={() => removeRow(idx)} className="text-gray-400 hover:text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {!isSubmitted && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-2 bg-gray-50/50">
                                            <button onClick={addRow} className="text-xs text-blue-600 font-medium hover:underline">+ Add Row</button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
