import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

// --- Helpers ---
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

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1, placeholder = "" }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 bg-white shadow-sm'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, options, required = false, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-[13px] text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 bg-white shadow-sm'}`}
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
        >
            <option value=""></option>
            {options.map((opt, i) => (
                <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

const BenefitApplication = () => {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Master Data
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [payrollPeriods, setPayrollPeriods] = useState([]);
    const [salaryComponents, setSalaryComponents] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form Data
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    // Filters
    const [searchId, setSearchId] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    const defaultForm = {
        name: '',
        employee: '',
        employee_name: '',
        date: new Date().toISOString().split('T')[0],
        payroll_period: '',
        company: '',
        employee_benefits: [
            { earning_component: '', max_benefit_amount: 0, amount: 0 }
        ],
        docstatus: 0,
        status: 'Draft'
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Employee Benefit Application?fields=["name","employee","employee_name","date","payroll_period","company","max_benefits","docstatus","status"]&limit_page_length=None&order_by=modified desc';

            let filters = [];
            if (searchId) filters.push(`["name","like","%${searchId}%"]`);
            if (filterEmployee) filters.push(`["employee","like","%${filterEmployee}%"]`);
            if (filterCompany) filters.push(`["company","=","${filterCompany}"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch benefit applications failed:', err);
            notification.error({ message: 'Failed to load records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [emps, comps, periods, components] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Payroll Period?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Salary Component?fields=["name"]&filters=[["is_flexible_benefit","=","1"]]&limit_page_length=None')
            ]);
            setEmployees(emps.data.data || []);
            setCompanies((comps.data.data || []).map(c => c.name));
            setPayrollPeriods((periods.data.data || []).map(c => c.name));
            setSalaryComponents((components.data.data || []).map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchMasters();
        }
    }, [view]);

    // --- Handlers ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm, company: companies[0] || 'Preeshe Consultancy Services' });
        setView('form');
    };

    const handleEdit = async (record) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Benefit Application/${encodeURIComponent(record.name)}`);
            if (res.data.data) {
                setEditingRecord(res.data.data);
                setFormData(res.data.data);
                setView('form');
            }
        } catch (err) {
            notification.error({ message: 'Failed to load record details' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                employee: empId,
                employee_name: emp.employee_name,
                company: emp.company || prev.company
            }));
        } else {
            setFormData(prev => ({ ...prev, employee: empId, employee_name: '' }));
        }
    };

    const addBenefit = () => {
        setFormData(prev => ({
            ...prev,
            employee_benefits: [
                ...(prev.employee_benefits || []),
                { earning_component: '', max_benefit_amount: 0, amount: 0 }
            ]
        }));
    };

    const removeBenefit = (index) => {
        setFormData(prev => {
            const newBenefits = [...(prev.employee_benefits || [])];
            newBenefits.splice(index, 1);
            return { ...prev, employee_benefits: newBenefits };
        });
    };

    const updateBenefit = (index, field, value) => {
        setFormData(prev => {
            const newBenefits = [...(prev.employee_benefits || [])];
            newBenefits[index] = { ...newBenefits[index], [field]: value };
            return { ...prev, employee_benefits: newBenefits };
        });
    };

    const handleSave = async (submit = false) => {
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.employee) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.payroll_period) { notification.warning({ message: 'Payroll Period is required' }); return; }
        if (!formData.date) { notification.warning({ message: 'Date is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                date: formData.date,
                payroll_period: formData.payroll_period,
                company: formData.company,
                employee_benefits: formData.employee_benefits || [],
                docstatus: submit ? 1 : formData.docstatus
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Benefit Application/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" ${submit ? 'submitted' : 'updated'} successfully!` });
            } else {
                const res = await API.post('/api/resource/Employee Benefit Application', payload);
                notification.success({ message: `"${res.data?.data?.name || 'Benefit Application'}" created successfully!` });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* */ }
            }
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally {
            setSaving(false);
        }
    };


    // --- Views ---
    const renderList = () => {
        const hasActiveFilters = searchId || filterEmployee || filterCompany;
        const clearFilters = () => { setSearchId(''); setFilterEmployee(''); setFilterCompany(''); fetchData(); };

        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Benefit Application</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleNew}>
                            <span>+</span> Add Benefit Application
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[200px]">
                            <input
                                type="text"
                                placeholder="ID"
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={searchId}
                                onChange={e => setSearchId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchData()}
                            />
                        </div>
                        <div className="flex-1 max-w-[200px]">
                            <input
                                type="text"
                                placeholder="Employee"
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={filterEmployee}
                                onChange={e => setFilterEmployee(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchData()}
                            />
                        </div>
                        <div className="flex-1 max-w-[200px]">
                            <select
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={filterCompany}
                                onChange={e => setFilterCompany(e.target.value)}
                            >
                                <option value="">Company</option>
                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="flex-1"></div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                                onClick={fetchData}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                {hasActiveFilters ? `Filters ${(searchId ? 1 : 0) + (filterEmployee ? 1 : 0) + (filterCompany ? 1 : 0)}` : 'Filter'}
                            </button>
                            {hasActiveFilters && (
                                <button className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 shrink-0 ml-2" onClick={clearFilters}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden mt-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-6"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Status</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Employee Name</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Employee</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Date</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Payroll Period</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Max Benefits</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Company</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="9" className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-12">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                            </div>
                                            <p className="text-gray-500 text-base">No Benefit Applications Found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => {
                                        const statusColor = getStatusColor(getStatusLabel(row));
                                        return (
                                            <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row)}>
                                                <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" /></td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide flex w-max items-center justify-center ${statusColor}`}>
                                                        {getStatusLabel(row)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-gray-900">{row.employee_name}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.employee}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.payroll_period}</td>
                                                <td className="px-4 py-2.5 text-gray-900">{formatINR(row.max_benefits)}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                                <td className="px-4 py-2.5 text-gray-500 text-[13px]">{row.name}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderForm = () => {
        const isSubmitted = formData.docstatus === 1;
        const displayStatus = getStatusLabel(formData);
        const statusColor = getStatusColor(displayStatus);

        return (
            <div className="p-6 max-w-7xl mx-auto font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                {editingRecord ? editingRecord.name : 'New Employee Benefit Application'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${statusColor}`}>
                                {displayStatus}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 border border-gray-300 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                            onClick={() => setView('list')}
                            title="Go Back"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>

                        {!isSubmitted && (
                            <button
                                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                            </button>
                        )}
                        {editingRecord && formData.docstatus === 0 && (
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                            >
                                Submit
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Employee and Period */}
                        <div className="grid grid-cols-2 gap-x-12">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Employee <span className="text-red-400">*</span></label>
                                    <select
                                        className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${isSubmitted ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 bg-white shadow-sm'}`}
                                        value={formData.employee}
                                        onChange={(e) => handleEmployeeChange(e.target.value)}
                                        disabled={isSubmitted}
                                    >
                                        <option value=""></option>
                                        {employees.map((emp) => (
                                            <option key={emp.name} value={emp.name}>{emp.name}: {emp.employee_name}</option>
                                        ))}
                                    </select>
                                </div>
                                {editingRecord && <InputField label="Employee Name" value={formData.employee_name} disabled={true} />}
                            </div>
                            <div className="space-y-6">
                                <InputField label="Date" type="date" required value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} disabled={isSubmitted} />
                                <SelectField label="Payroll Period" options={payrollPeriods} required value={formData.payroll_period} onChange={(v) => setFormData({ ...formData, payroll_period: v })} disabled={isSubmitted} />
                                <SelectField label="Company" options={companies} required value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={isSubmitted} />
                            </div>
                        </div>

                        {/* Employee Benefits Subtable */}
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Employee Benefits</h3>
                            <div className="border border-gray-200 rounded overflow-hidden mb-8">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                        <tr>
                                            <th className="px-4 py-2 font-medium w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                                            <th className="px-4 py-2 font-medium w-16 text-center">No.</th>
                                            <th className="px-4 py-2 font-medium">Earning Component *</th>
                                            <th className="px-4 py-2 font-medium text-right w-48">Max Benefit Amount</th>
                                            <th className="px-4 py-2 font-medium text-right w-48">Amount *</th>
                                            {!isSubmitted && <th className="px-2 py-2 w-8"><svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(formData.employee_benefits || []).map((benefit, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                <td className="px-4 py-2 text-center text-gray-500 text-xs">{index + 1}</td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none' : ''}`}
                                                        value={benefit.earning_component || ''}
                                                        onChange={(e) => updateBenefit(index, 'earning_component', e.target.value)}
                                                        disabled={isSubmitted}
                                                    >
                                                        <option value=""></option>
                                                        {salaryComponents.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded text-right ${isSubmitted ? 'pointer-events-none text-gray-500' : ''}`}
                                                        value={benefit.max_benefit_amount}
                                                        onChange={(e) => updateBenefit(index, 'max_benefit_amount', e.target.value)}
                                                        readOnly={isSubmitted}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded text-right ${isSubmitted ? 'pointer-events-none font-medium' : ''}`}
                                                        value={benefit.amount}
                                                        onChange={(e) => updateBenefit(index, 'amount', e.target.value)}
                                                        readOnly={isSubmitted}
                                                    />
                                                </td>
                                                {!isSubmitted && (
                                                    <td className="px-2 py-2 text-center flex items-center justify-center gap-2">
                                                        <button
                                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                                            title="Edit Row"
                                                        >
                                                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                        </button>
                                                        <button
                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                            onClick={() => removeBenefit(index)}
                                                            title="Delete Row"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {(!formData.employee_benefits || formData.employee_benefits.length === 0) && (
                                            <tr>
                                                <td colSpan={isSubmitted ? 5 : 6} className="py-8">
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <svg className="w-8 h-8 mb-2 stroke-current opacity-50" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        <p className="text-sm">No Data</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {!isSubmitted && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-2">
                                        <button
                                            className="text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded transition-colors shadow-sm"
                                            onClick={addBenefit}
                                        >
                                            Add Row
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    return view === 'list' ? renderList() : renderForm();
};

export default BenefitApplication;
