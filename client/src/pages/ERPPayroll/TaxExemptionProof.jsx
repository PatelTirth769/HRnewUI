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

const TaxExemptionProof = () => {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Form Tabs
    const [activeTab, setActiveTab] = useState('Employee');

    // Master Data
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [payrollPeriods, setPayrollPeriods] = useState([]);
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
        company: '',
        payroll_period: '',
        submission_date: new Date().toISOString().split('T')[0],
        total_actual_amount: 0,
        exemption_balance: 0,
        house_rent_payment_amount: 0,
        tax_exemption_proofs: [],
        docstatus: 0,
        status: 'Draft'
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Employee Tax Exemption Proof Submission?fields=["name","employee","employee_name","company","payroll_period","total_actual_amount","submission_date","docstatus","status"]&limit_page_length=None&order_by=modified desc';

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
            console.error('Fetch tax exemption proof failed:', err);
            notification.error({ message: 'Failed to load records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [emps, comps, periods] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Payroll Period?fields=["name"]&limit_page_length=None')
            ]);
            setEmployees(emps.data.data || []);
            setCompanies((comps.data.data || []).map(c => c.name));
            setPayrollPeriods((periods.data.data || []).map(c => c.name));
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
        setFormData({ ...defaultForm, company: companies[0] || 'Preeshe Consultancy Services', tax_exemption_proofs: [] });
        setActiveTab('Employee');
        setView('form');
    };

    const handleEdit = async (record) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Tax Exemption Proof Submission/${encodeURIComponent(record.name)}`);
            if (res.data.data) {
                setEditingRecord(res.data.data);
                setFormData(res.data.data);
                setActiveTab('Employee');
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

    const addProof = () => {
        setFormData(prev => ({
            ...prev,
            tax_exemption_proofs: [
                ...(prev.tax_exemption_proofs || []),
                { exemption_sub_category: '', exemption_category: '', max_amount: 0, amount: 0, type_of_proof: '' }
            ]
        }));
    };

    const removeProof = (index) => {
        setFormData(prev => {
            const newProofs = [...(prev.tax_exemption_proofs || [])];
            newProofs.splice(index, 1);
            return { ...prev, tax_exemption_proofs: newProofs };
        });
    };

    const updateProof = (index, field, value) => {
        setFormData(prev => {
            const newProofs = [...(prev.tax_exemption_proofs || [])];
            newProofs[index] = { ...newProofs[index], [field]: value };
            return { ...prev, tax_exemption_proofs: newProofs };
        });
    };

    const handleSave = async (submit = false) => {
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.employee) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.payroll_period) { notification.warning({ message: 'Payroll Period is required' }); return; }
        if (!formData.submission_date) { notification.warning({ message: 'Submission Date is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                company: formData.company,
                payroll_period: formData.payroll_period,
                submission_date: formData.submission_date,
                tax_exemption_proofs: formData.tax_exemption_proofs,
                house_rent_payment_amount: formData.house_rent_payment_amount || 0,
                docstatus: submit ? 1 : formData.docstatus
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Tax Exemption Proof Submission/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" ${submit ? 'submitted' : 'updated'} successfully!` });
            } else {
                const res = await API.post('/api/resource/Employee Tax Exemption Proof Submission', payload);
                notification.success({ message: `"${res.data?.data?.name || 'Proof Submission'}" created successfully!` });
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
                    <h1 className="text-2xl font-semibold text-gray-800">Tax Exemption Proof Submission</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleNew}>
                            <span>+</span> Add Proof Submission
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
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                Last Updated On
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
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Payroll Period</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Submission Date</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Total Actual Amount</th>
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
                                            <p className="text-gray-500 text-base">No Proof Submissions Found</p>
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
                                                <td className="px-4 py-2.5 text-gray-600">{row.payroll_period}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.submission_date}</td>
                                                <td className="px-4 py-2.5 text-gray-900">{formatINR(row.total_actual_amount)}</td>
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
                                {editingRecord ? editingRecord.name : 'New Employee Tax Exemption Proof Submission'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${statusColor}`}>
                                {displayStatus}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isSubmitted && (
                            <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md text-sm border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
                                Get Details From Declaration
                            </button>
                        )}
                        <button
                            className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
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
                    {/* Tabs Navbar */}
                    <div className="border-b border-gray-200 bg-gray-50/50 flex text-[13px] font-medium text-gray-600 mb-6">
                        {['Employee', 'Exemption Proofs'].map(tab => (
                            <button
                                key={tab}
                                className={`px-6 py-3 border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-gray-900 hover:bg-gray-100/50'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 space-y-8">
                        {activeTab === 'Employee' && (
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
                                    <InputField label="Submission Date" type="date" required value={formData.submission_date} onChange={(v) => setFormData({ ...formData, submission_date: v })} disabled={isSubmitted} />
                                    <SelectField label="Payroll Period" options={payrollPeriods} required value={formData.payroll_period} onChange={(v) => setFormData({ ...formData, payroll_period: v })} disabled={isSubmitted} />
                                    <SelectField label="Company" options={companies} required value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={isSubmitted} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'Exemption Proofs' && (
                            <div>
                                <h3 className="font-semibold text-gray-800 text-sm mb-4">Tax Exemption Proofs</h3>
                                <div className="border border-gray-200 rounded overflow-hidden mb-8">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                            <tr>
                                                <th className="px-4 py-2 font-medium w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                                                <th className="px-4 py-2 font-medium">No.</th>
                                                <th className="px-4 py-2 font-medium">Exemption Sub Category *</th>
                                                <th className="px-4 py-2 font-medium">Exemption Category *</th>
                                                <th className="px-4 py-2 font-medium">Maximum Exemption Amount</th>
                                                <th className="px-4 py-2 font-medium">Actual Amount</th>
                                                <th className="px-4 py-2 font-medium">Type of Proof</th>
                                                <th className="px-4 py-2 font-medium">Attach Proof</th>
                                                {!isSubmitted && <th className="px-2 py-2 w-8"><svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(formData.tax_exemption_proofs || []).map((proof, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="px-4 py-2 text-center text-gray-500 text-xs">{index + 1}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none' : ''}`}
                                                            value={proof.exemption_sub_category || ''}
                                                            onChange={(e) => updateProof(index, 'exemption_sub_category', e.target.value)}
                                                            readOnly={isSubmitted}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none text-gray-500' : ''}`}
                                                            value={proof.exemption_category || ''}
                                                            onChange={(e) => updateProof(index, 'exemption_category', e.target.value)}
                                                            readOnly={isSubmitted}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none text-gray-500 text-right' : ''}`}
                                                            value={proof.max_amount}
                                                            onChange={(e) => updateProof(index, 'max_amount', e.target.value)}
                                                            readOnly={isSubmitted}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none text-right' : ''}`}
                                                            value={proof.amount}
                                                            onChange={(e) => updateProof(index, 'amount', e.target.value)}
                                                            readOnly={isSubmitted}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <select
                                                            className={`w-full border-0 bg-transparent px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 rounded ${isSubmitted ? 'pointer-events-none text-gray-500' : ''}`}
                                                            value={proof.type_of_proof || ''}
                                                            onChange={(e) => updateProof(index, 'type_of_proof', e.target.value)}
                                                            disabled={isSubmitted}
                                                        >
                                                            <option value=""></option>
                                                            <option value="Document">Document</option>
                                                            <option value="Receipt">Receipt</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button className="text-gray-400 hover:text-blue-500">
                                                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                        </button>
                                                    </td>
                                                    {!isSubmitted && (
                                                        <td className="px-2 py-2 text-center">
                                                            <button
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                                onClick={() => removeProof(index)}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {(!formData.tax_exemption_proofs || formData.tax_exemption_proofs.length === 0) && (
                                                <tr>
                                                    <td colSpan={isSubmitted ? 8 : 9} className="py-12">
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <svg className="w-10 h-10 mb-2 stroke-current opacity-50" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
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
                                                onClick={addProof}
                                            >
                                                Add Row
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-semibold text-gray-800 text-sm mb-4">HRA Exemption</h3>
                                <div className="max-w-md">
                                    <InputField
                                        label="House Rent Payment Amount"
                                        type="number"
                                        value={formData.house_rent_payment_amount}
                                        onChange={(v) => setFormData({ ...formData, house_rent_payment_amount: v })}
                                        disabled={isSubmitted}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return view === 'list' ? renderList() : renderForm();
};

export default TaxExemptionProof;
