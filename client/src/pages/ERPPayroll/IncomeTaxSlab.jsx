import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const formatINR = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = parseFloat(val.toString().replace(/,/g, ''));
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const parseNum = (val) => {
    if (val === '') return '';
    return val.toString().replace(/,/g, '');
};

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1, helperText }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 bg-white shadow-sm text-gray-800 hover:border-gray-300'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
        {helperText && <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{helperText}</p>}
    </div>
);

const CheckboxField = ({ label, checked, onChange, disabled = false, helperText }) => (
    <div>
        <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
            <div className="relative flex items-center pt-0.5">
                <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                    checked={!!checked}
                    onChange={e => onChange(e.target.checked ? 1 : 0)}
                    disabled={disabled}
                />
            </div>
            <div className="flex flex-col">
                <span className={`text-[13px] font-medium leading-tight ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>{label}</span>
                {helperText && <span className="text-xs text-gray-500 mt-1 leading-relaxed">{helperText}</span>}
            </div>
        </label>
    </div>
);

const IncomeTaxSlab = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [companies, setCompanies] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form states
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        name: '',
        company: '',
        currency: 'INR',
        effective_from: '',
        standard_tax_exemption_amount: 0,
        allow_tax_exemption: 0,
        disabled: 0,
        slabs: [
            { from_amount: 0.00, to_amount: '', percent_deduction: 0.000, condition: '' }
        ],
        other_taxes_and_charges: []
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(
                '/api/resource/Income Tax Slab?fields=["name","company","effective_from","disabled"]&limit_page_length=None&order_by=modified desc'
            );
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Income Tax Slabs' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const compRes = await API.get('/api/resource/Company?limit_page_length=None');
            if (compRes.data.data) setCompanies(compRes.data.data.map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Income Tax Slab/${encodeURIComponent(name)}`);
            if (res.data.data) {
                const doc = res.data.data;
                setFormData({
                    ...defaultForm,
                    ...doc,
                    slabs: doc.slabs || [],
                    other_taxes_and_charges: doc.other_taxes_and_charges || [],
                });
            }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    // --- FORM ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = (row) => {
        setEditingRecord(row);
        setFormData({ ...defaultForm, name: row.name }); // temp before fetch
        setView('form');
        fetchSingle(row.name);
    };

    const handleSave = async () => {
        if (!formData.name && !editingRecord) {
            notification.warning({ message: 'Name is required' });
            return;
        }
        if (!formData.effective_from) {
            notification.warning({ message: 'Effective From date is required' });
            return;
        }

        setSaving(true);
        try {
            let payload = { ...formData };
            // Format dates
            if (payload.effective_from) {
                payload.effective_from = payload.effective_from.split('T')[0];
            }

            if (editingRecord) {
                // Remove immutable fields for PUT
                delete payload.name;
                const res = await API.put(`/api/resource/Income Tax Slab/${encodeURIComponent(editingRecord.name)}`, payload);
                if (res.data.data) {
                    notification.success({ message: 'Income Tax Slab Updated' });
                    setFormData({ ...defaultForm, ...res.data.data });
                    fetchData();
                    setView('list');
                }
            } else {
                const res = await API.post('/api/resource/Income Tax Slab', payload);
                if (res.data.data) {
                    notification.success({ message: 'Income Tax Slab Created', description: res.data.data.name });
                    fetchData();
                    setView('list');
                }
            }
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Failed to save record', description: err.response?.data?.exception || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Are you sure you want to delete ${row.name}?`)) return;
        try {
            await API.delete(`/api/resource/Income Tax Slab/${encodeURIComponent(row.name)}`);
            notification.success({ message: 'Record deleted' });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: 'Failed to delete record' });
        }
    };

    // --- FORM HELPERS ---
    const updateField = (k, v) => setFormData(p => ({ ...p, [k]: v }));

    const updateSlabRow = (type, index, field, value) => {
        const arr = [...formData[type]];
        // Store raw numbers in state
        arr[index] = { ...arr[index], [field]: field.includes('amount') || field.includes('percent') || field.includes('income') ? parseNum(value) : value };
        updateField(type, arr);
    };

    const addSlabRow = (type) => {
        let newRow = {};
        if (type === 'slabs') {
            newRow = { from_amount: 0, to_amount: 0, percent_deduction: 0, condition: '' };
        } else {
            newRow = { description: '', percent: 0, min_taxable_income: 0, max_taxable_income: 0 };
        }
        updateField(type, [...formData[type], newRow]);
    };

    const removeSlabRow = (type, index) => {
        updateField(type, formData[type].filter((_, i) => i !== index));
    };


    // --- RENDER ---
    if (view === 'form') {
        const isNew = !editingRecord;
        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-800 transition-colors p-1" onClick={() => setView('list')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
                            {isNew ? 'New Income Tax Slab' : formData.name}
                        </h1>
                        <span className={`text-[13px] px-2.5 py-0.5 rounded-full font-medium ${formData.disabled ? 'bg-[#FCE8E8] text-[#E02424]' : (isNew ? 'bg-orange-50 text-orange-600' : 'bg-[#EBF5FF] text-[#2B6CB0]')}`}>
                            {isNew ? 'Not Saved' : (formData.disabled ? 'Disabled' : 'Active')}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white text-gray-700 text-[14px] font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-6 py-2 bg-gray-900 text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-x-16 gap-y-8 max-w-5xl">
                            {/* Section 1 */}
                            <div className="space-y-6">
                                <InputField label="Name" value={formData.name} required onChange={(v) => updateField('name', v)} disabled={!isNew} />
                                <CheckboxField label="Disabled" checked={formData.disabled} onChange={(v) => updateField('disabled', v)} />

                                <div className="mt-8">
                                    <InputField label="Effective from" type="date" value={formData.effective_from ? formData.effective_from.split('T')[0] : ''} required onChange={(v) => updateField('effective_from', v)} />
                                </div>
                                <div className="mt-6">
                                    <label className="block text-[13px] text-gray-500 mb-1.5">Company</label>
                                    <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white shadow-sm text-gray-800"
                                        value={formData.company || ''} onChange={(e) => updateField('company', e.target.value)}>
                                        <option value=""></option>
                                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6 pt-1">
                                <div className="mt-[72px]">
                                    <InputField label="Currency" value={formData.currency} required onChange={(v) => updateField('currency', v)} />
                                </div>
                                <div className="mt-6">
                                    <InputField label="Standard Tax Exemption Amount" type="number" value={formData.standard_tax_exemption_amount} onChange={(v) => updateField('standard_tax_exemption_amount', v)} />
                                </div>
                                <div className="mt-6">
                                    <CheckboxField
                                        label="Allow Tax Exemption"
                                        checked={formData.allow_tax_exemption}
                                        onChange={(v) => updateField('allow_tax_exemption', v)}
                                        helperText="If enabled, Tax Exemption Declaration will be considered for income tax calculation."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Subtables */}
                        <div className="mt-12 space-y-12">
                            {/* Taxable Salary Slabs Table */}
                            <div>
                                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Taxable Salary Slabs</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500 text-[12px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 w-12 text-center">No.</th>
                                                <th className="px-4 py-3">From Amount <span className="text-red-400">*</span></th>
                                                <th className="px-4 py-3">To Amount</th>
                                                <th className="px-4 py-3">Percent Deduction <span className="text-red-400">*</span></th>
                                                <th className="px-4 py-3">Condition</th>
                                                <th className="px-4 py-3 w-16 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.slabs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            <span className="text-sm">No Data</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                formData.slabs.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 group transition-colors">
                                                        <td className="px-4 py-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="relative">
                                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">₹</span>
                                                                <input type="text" className="w-full pl-7 pr-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                    value={formatINR(row.from_amount)} onChange={e => updateSlabRow('slabs', idx, 'from_amount', e.target.value)} onFocus={e => e.target.value = parseNum(row.from_amount)} />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="relative">
                                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">₹</span>
                                                                <input type="text" className="w-full pl-7 pr-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                    value={formatINR(row.to_amount)} onChange={e => updateSlabRow('slabs', idx, 'to_amount', e.target.value)} onFocus={e => e.target.value = parseNum(row.to_amount)} />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="relative">
                                                                <input type="text" className="w-full pl-3 pr-7 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                    value={row.percent_deduction} onChange={e => updateSlabRow('slabs', idx, 'percent_deduction', e.target.value)} />
                                                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="text" className="w-full px-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors"
                                                                value={row.condition || ''} onChange={e => updateSlabRow('slabs', idx, 'condition', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100" onClick={() => removeSlabRow('slabs', idx)}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                    <div className="px-4 py-3 border-t border-gray-100 bg-[#FCFDFD]">
                                        <button className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded" onClick={() => addSlabRow('slabs')}>
                                            Add Row
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Taxes and Charges Table */}
                            <div>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 cursor-pointer text-gray-800 hover:text-gray-600">
                                    <h3 className="text-base font-semibold">Taxes and Charges on Income Tax</h3>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500 text-[12px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 w-12 text-center">No.</th>
                                                <th className="px-4 py-3">Description <span className="text-red-400">*</span></th>
                                                <th className="px-4 py-3 w-32">Percent <span className="text-red-400">*</span></th>
                                                <th className="px-4 py-3 w-40">Min Taxable Income</th>
                                                <th className="px-4 py-3 w-40">Max Taxable Income</th>
                                                <th className="px-4 py-3 w-16 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.other_taxes_and_charges.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-4 py-12 text-center">
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                            <span className="text-sm">No Data</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                formData.other_taxes_and_charges.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 group transition-colors">
                                                        <td className="px-4 py-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-2">
                                                            <input type="text" className="w-full px-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors"
                                                                value={row.description || ''} onChange={e => updateSlabRow('other_taxes_and_charges', idx, 'description', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="relative">
                                                                <input type="text" className="w-full pl-3 pr-7 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                    value={row.percent} onChange={e => updateSlabRow('other_taxes_and_charges', idx, 'percent', e.target.value)} />
                                                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="number" className="w-full px-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                value={row.min_taxable_income || ''} onChange={e => updateSlabRow('other_taxes_and_charges', idx, 'min_taxable_income', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="number" className="w-full px-3 py-1.5 border border-transparent hover:border-gray-200 focus:border-blue-400 focus:bg-white bg-transparent rounded text-sm text-gray-800 transition-colors text-right"
                                                                value={row.max_taxable_income || ''} onChange={e => updateSlabRow('other_taxes_and_charges', idx, 'max_taxable_income', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100" onClick={() => removeSlabRow('other_taxes_and_charges', idx)}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                    <div className="px-4 py-3 border-t border-gray-100 bg-[#FCFDFD]">
                                        <button className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded" onClick={() => addSlabRow('other_taxes_and_charges')}>
                                            Add Row
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Income Tax Slab</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-[14px] font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors" onClick={fetchData}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-[14px] font-medium hover:bg-black shadow-sm transition-colors" onClick={handleNew}>
                        + Add Income Tax Slab
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-3.5 font-medium">Name</th>
                                <th className="px-6 py-3.5 font-medium">Company</th>
                                <th className="px-6 py-3.5 font-medium">Effective From</th>
                                <th className="px-6 py-3.5 font-medium">Disabled</th>
                                <th className="px-6 py-3.5 font-medium w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No Income Tax Slabs found</td></tr>
                            ) : (
                                data.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50 group cursor-pointer transition-colors" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-3.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{row.company || '-'}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{row.effective_from || '-'}</td>
                                        <td className="px-6 py-3.5 text-gray-600">
                                            {row.disabled ? (
                                                <span className="bg-[#FCE8E8] text-[#E02424] px-2.5 py-0.5 rounded-full text-xs font-medium">Yes</span>
                                            ) : (
                                                <span className="bg-[#EBF5FF] text-[#2B6CB0] px-2.5 py-0.5 rounded-full text-xs font-medium">No</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 flex items-center h-full">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-[13px] mr-2 px-1 py-1 rounded hover:bg-blue-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-[#E02424] hover:text-red-800 font-medium text-[13px] px-1 py-1 rounded hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IncomeTaxSlab;
