import React, { useState, useEffect } from 'react';
import { notification, Checkbox, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, min }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 bg-white shadow-sm text-gray-800 hover:border-gray-300'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
            min={min}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 bg-white shadow-sm text-gray-800 hover:border-gray-300'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            <option value=""></option>
            {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
        </select>
    </div>
);

const CheckboxField = ({ label, checked, onChange, disabled }) => (
    <div className="flex items-center gap-2 mt-6">
        <Checkbox
            checked={checked === 1 || checked === true}
            onChange={e => onChange(e.target.checked ? 1 : 0)}
            disabled={disabled}
        />
        <span className="text-sm text-gray-700">{label}</span>
    </div>
);

const PayrollEntry = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list', 'form'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [companies, setCompanies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [grades, setGrades] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [projects, setProjects] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    const getToday = () => new Date().toISOString().split('T')[0];

    const defaultForm = {
        name: '',
        posting_date: getToday(),
        company: '',
        payroll_payable_account: '',
        currency: '',
        exchange_rate: 1,

        salary_slip_based_on_timesheet: 0,
        payroll_frequency: '',
        start_date: '',
        end_date: '',
        deduct_tax_for_unclaimed_employee_benefits: 0,
        deduct_tax_for_unsubmitted_tax_exemption_proof: 0,

        // Employees filter fields
        branch: '',
        department: '',
        designation: '',
        grade: '',

        validate_attendance: 0,
        employees: [], // child table

        cost_center: '',
        project: '',
        payment_account: '',
        bank_account: ''
    };

    const [formData, setFormData] = useState({ ...defaultForm });
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Initial load
    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [
                compRes, accRes, branchRes, deptRes, desigRes, gradeRes,
                costCenterRes, projectRes, bankAccRes, currencyRes
            ] = await Promise.all([
                API.get('/api/resource/Company?limit_page_length=None'),
                API.get('/api/resource/Account?filters=[["is_group","=",0]]&limit_page_length=None'),
                API.get('/api/resource/Branch?limit_page_length=None'),
                API.get('/api/resource/Department?limit_page_length=None'),
                API.get('/api/resource/Designation?limit_page_length=None'),
                API.get('/api/resource/Employee Grade?limit_page_length=None'),
                API.get('/api/resource/Cost Center?limit_page_length=None'),
                API.get('/api/resource/Project?limit_page_length=None'),
                API.get('/api/resource/Bank Account?limit_page_length=None'),
                API.get('/api/resource/Currency?limit_page_length=None')
            ]);

            if (compRes.data.data) setCompanies(compRes.data.data.map(d => d.name));
            if (accRes.data.data) setAccounts(accRes.data.data.map(d => d.name));
            if (branchRes.data.data) setBranches(branchRes.data.data.map(d => d.name));
            if (deptRes.data.data) setDepartments(deptRes.data.data.map(d => d.name));
            if (desigRes.data.data) setDesignations(desigRes.data.data.map(d => d.name));
            if (gradeRes.data.data) setGrades(gradeRes.data.data.map(d => d.name));
            if (costCenterRes.data.data) setCostCenters(costCenterRes.data.data.map(d => d.name));
            if (projectRes.data.data) setProjects(projectRes.data.data.map(d => d.name));
            if (bankAccRes.data.data) setBankAccounts(bankAccRes.data.data.map(d => d.name));
            if (currencyRes.data.data) setCurrencies(currencyRes.data.data.map(d => d.name));

        } catch (err) {
            console.error("Failed to fetch masters", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Payroll Entry?fields=["name","status","company","start_date","end_date"]&limit_page_length=None&order_by=modified desc');
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            notification.error({ message: 'Failed to load Payroll Entries' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Payroll Entry/${encodeURIComponent(name)}`);
            if (res.data.data) {
                setEditingRecord(res.data.data);
                const doc = res.data.data;

                // Format dates for inputs
                if (doc.posting_date) doc.posting_date = doc.posting_date.split('T')[0];
                if (doc.start_date) doc.start_date = doc.start_date.split('T')[0];
                if (doc.end_date) doc.end_date = doc.end_date.split('T')[0];

                setFormData({
                    ...defaultForm,
                    ...doc,
                    employees: doc.employees || [],
                    number_of_employees: doc.employees ? doc.employees.length : 0
                });
                setView('form');
            }
        } catch (err) {
            notification.error({ message: 'Failed to load record' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        fetchSingle(record.name);
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete Payroll Entry ${record.name}?`)) return;
        try {
            await API.delete(`/api/resource/Payroll Entry/${encodeURIComponent(record.name)}`);
            notification.success({ message: 'Deleted successfully' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Deletion failed' });
        }
    };

    const handleSave = async () => {
        // Validate required fields based on schema
        if (!formData.posting_date) return notification.warning({ message: 'Posting Date is required' });
        if (!formData.company) return notification.warning({ message: 'Company is required' });
        if (!formData.currency) return notification.warning({ message: 'Currency is required' });
        if (!formData.payroll_payable_account) return notification.warning({ message: 'Payroll Payable Account is required' });
        if (!formData.start_date) return notification.warning({ message: 'Start Date is required' });
        if (!formData.end_date) return notification.warning({ message: 'End Date is required' });
        if (!formData.cost_center) return notification.warning({ message: 'Cost Center is required' });

        if (!formData.salary_slip_based_on_timesheet && !formData.payroll_frequency) {
            return notification.warning({ message: 'Payroll Frequency is required when not based on timesheet' });
        }

        setSaving(true);
        try {
            let payload = { ...formData };
            if (payload.posting_date) payload.posting_date = payload.posting_date.split('T')[0];
            if (payload.start_date) payload.start_date = payload.start_date.split('T')[0];
            if (payload.end_date) payload.end_date = payload.end_date.split('T')[0];

            if (editingRecord) {
                delete payload.name;
                await API.put(`/api/resource/Payroll Entry/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: 'Payroll Entry updated successfully' });
            } else {
                await API.post('/api/resource/Payroll Entry', payload);
                notification.success({ message: 'Payroll Entry created successfully' });
            }
            setView('list');
            fetchData();
        } catch (err) {
            console.error(err);
            notification.error({
                message: 'Save failed',
                description: err.response?.data?.exc_message || err.message
            });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // UI Renders

    if (view === 'list') {
        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Payroll Entry</h1>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        onClick={() => {
                            setEditingRecord(null);
                            setFormData({ ...defaultForm, number_of_employees: 0 });
                            setView('form');
                        }}
                    >
                        + Add Payroll Entry
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium text-sm">Name</th>
                                <th className="px-6 py-3 font-medium text-sm">Status</th>
                                <th className="px-6 py-3 font-medium text-sm">Company</th>
                                <th className="px-6 py-3 font-medium text-sm">Start Date</th>
                                <th className="px-6 py-3 font-medium text-sm">End Date</th>
                                <th className="px-6 py-3 font-medium text-sm w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No Payroll Entries found</td></tr>
                            ) : (
                                data.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-3.5 font-medium text-gray-900 text-sm">{row.name}</td>
                                        <td className="px-6 py-3.5 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${row.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {row.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-gray-600 text-sm">{row.company}</td>
                                        <td className="px-6 py-3.5 text-gray-500 text-sm">{row.start_date}</td>
                                        <td className="px-6 py-3.5 text-gray-500 text-sm">{row.end_date}</td>
                                        <td className="px-6 py-3.5 text-sm">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium mr-3" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-red-600 hover:text-red-800 font-medium" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
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

    // Form View
    const isEditing = !!editingRecord;
    const isSubmitted = formData.status === 'Submitted' || formData.docstatus === 1;

    // Overview Tab Content
    const overviewTabContent = (
        <div className="pt-4 space-y-8">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-6">
                    <InputField label="Posting Date" type="date" required value={formData.posting_date} onChange={v => updateField('posting_date', v)} disabled={isSubmitted} />
                    <SelectField label="Company" required options={companies} value={formData.company} onChange={v => updateField('company', v)} disabled={isEditing} />
                </div>
                <div className="space-y-6">
                    <SelectField label="Currency" required options={currencies} value={formData.currency} onChange={v => updateField('currency', v)} disabled={isSubmitted} />
                    <InputField label="Exchange Rate" type="number" required value={formData.exchange_rate} onChange={v => updateField('exchange_rate', v)} disabled={isSubmitted} />
                    <SelectField label="Payroll Payable Account" required options={accounts} value={formData.payroll_payable_account} onChange={v => updateField('payroll_payable_account', v)} disabled={isSubmitted} />
                    <InputField label="Status" value={formData.status || 'Draft'} disabled />
                </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-6">
                    <div className="mt-2 text-sm text-gray-700 flex items-center gap-2">
                        <input type="checkbox" checked={formData.salary_slip_based_on_timesheet === 1} onChange={e => updateField('salary_slip_based_on_timesheet', e.target.checked ? 1 : 0)} className="rounded border-gray-300" />
                        Salary Slip Based on Timesheet
                    </div>
                    <SelectField
                        label="Payroll Frequency"
                        required={!formData.salary_slip_based_on_timesheet}
                        options={["Monthly", "Fortnightly", "Bimonthly", "Weekly", "Daily"]}
                        value={formData.payroll_frequency}
                        onChange={v => updateField('payroll_frequency', v)}
                        disabled={formData.salary_slip_based_on_timesheet === 1}
                    />
                    <InputField label="Start Date" type="date" required value={formData.start_date} onChange={v => updateField('start_date', v)} />
                    <InputField label="End Date" type="date" required value={formData.end_date} onChange={v => updateField('end_date', v)} />
                </div>

                <div className="space-y-4 pt-2">
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                        <input type="checkbox" checked={formData.deduct_tax_for_unclaimed_employee_benefits === 1} onChange={e => updateField('deduct_tax_for_unclaimed_employee_benefits', e.target.checked ? 1 : 0)} className="rounded border-gray-300" />
                        Deduct Tax For Unclaimed Employee Benefits
                    </div>
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                        <input type="checkbox" checked={formData.deduct_tax_for_unsubmitted_tax_exemption_proof === 1} onChange={e => updateField('deduct_tax_for_unsubmitted_tax_exemption_proof', e.target.checked ? 1 : 0)} className="rounded border-gray-300" />
                        Deduct Tax For Unsubmitted Tax Exemption Proof
                    </div>
                </div>
            </div>
        </div>
    );

    // Employees Tab Content
    const employeesTabContent = (
        <div className="pt-4 space-y-6">
            <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-sm mt-2">Filter Employees</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-6">
                        <SelectField label="Branch" options={branches} value={formData.branch} onChange={v => updateField('branch', v)} disabled={isSubmitted} />
                        <SelectField label="Department" options={departments} value={formData.department} onChange={v => updateField('department', v)} disabled={isSubmitted} />
                    </div>
                    <div className="space-y-6">
                        <SelectField label="Designation" options={designations} value={formData.designation} onChange={v => updateField('designation', v)} disabled={isSubmitted} />
                        <SelectField label="Grade" options={grades} value={formData.grade} onChange={v => updateField('grade', v)} disabled={isSubmitted} />
                        <InputField label="Number Of Employees" type="number" readOnly disabled value={formData.number_of_employees || (formData.employees ? formData.employees.length : 0)} />
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">Employee Details</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 w-10 text-center">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </th>
                                    <th className="px-4 py-3 font-medium">No.</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Employee</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Employee Name</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Department</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Designation</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Is Salary Withheld</th>
                                    <th className="px-4 py-3 w-10 text-center text-gray-400 font-medium whitespace-nowrap">
                                        ⚙️
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-[13px]">No Data</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    formData.employees.map((emp, idx) => (
                                        <tr key={emp.employee || idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2 text-center text-gray-500"><input type="checkbox" className="rounded border-gray-300" /></td>
                                            <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                                            <td className="px-4 py-2 text-gray-900">{emp.employee}</td>
                                            <td className="px-4 py-2 text-gray-900">{emp.employee_name}</td>
                                            <td className="px-4 py-2 text-gray-600">{emp.department}</td>
                                            <td className="px-4 py-2 text-gray-600">{emp.designation}</td>
                                            <td className="px-4 py-2 text-gray-600">
                                                <input type="checkbox" checked={emp.is_salary_withheld} readOnly className="rounded border-gray-300 pointer-events-none" />
                                            </td>
                                            <td className="px-4 py-2 text-center text-gray-400"></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-4">
                    <button className="px-3 py-1.5 bg-gray-100/80 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm disabled:opacity-50" disabled={isSubmitted}>
                        Add Row
                    </button>
                </div>
            </div>

            <hr className="border-gray-100" />

            <div className="mt-4">
                <div className="text-sm text-gray-700 flex items-center gap-2">
                    <input type="checkbox" checked={formData.validate_attendance === 1} onChange={e => updateField('validate_attendance', e.target.checked ? 1 : 0)} className="rounded border-gray-300" disabled={isSubmitted} />
                    Validate Attendance
                </div>
            </div>
        </div>
    );

    // Accounting & Payment Tab Content
    const accPaymentTabContent = (
        <div className="pt-4 space-y-8">
            <div>
                <h3 className="font-semibold text-gray-800 mb-4 mt-2 text-sm">Accounting Dimensions</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <SelectField label="Cost Center" required options={costCenters} value={formData.cost_center} onChange={v => updateField('cost_center', v)} disabled={isSubmitted} />
                    <SelectField label="Project" options={projects} value={formData.project} onChange={v => updateField('project', v)} disabled={isSubmitted} />
                </div>
            </div>

            <hr className="border-gray-100" />

            <div>
                <h3 className="font-semibold text-gray-800 mb-4 text-sm">Payment Entry</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <SelectField label="Payment Account" options={accounts} value={formData.payment_account} onChange={v => updateField('payment_account', v)} disabled />
                    <SelectField label="Bank Account" options={bankAccounts} value={formData.bank_account} onChange={v => updateField('bank_account', v)} disabled={isSubmitted} />
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-1">Select Payment Account to make Bank Entry</p>
            </div>
        </div>
    );

    // Connections Tab Content
    const connectionsTabContent = (
        <div className="pt-4 pb-6 space-y-8">
            <div>
                <button className="flex items-center text-sm font-semibold text-gray-800 mb-4 hover:text-gray-600">
                    Connections <span className="ml-1 text-[10px]">▲</span>
                </button>
                <div className="flex flex-col gap-3 w-56">
                    <div className="flex items-center gap-2">
                        <button
                            className="flex-1 text-left px-3 py-1.5 bg-gray-50 text-gray-700 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 flex justify-start items-center gap-2 transition-colors"
                            onClick={() => navigate(`/erp-payroll/salary-slip?Payroll%20Entry=${encodeURIComponent(formData.name)}`)}
                        >
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-500 font-medium">{formData.employees ? formData.employees.length : 0}</span>
                            <span>Salary Slip</span>
                        </button>
                        <button className="p-1 px-2.5 bg-gray-50 text-gray-500 rounded text-sm hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors">
                            +
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex-1 text-left px-3 py-1.5 bg-gray-50 text-gray-700 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 transition-colors">
                            Journal Entry
                        </button>
                        <button className="p-1 px-2.5 bg-gray-50 text-gray-500 rounded text-sm hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors">
                            +
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const tabItems = [
        { key: '1', label: 'Overview', children: overviewTabContent },
        { key: '2', label: 'Employees', children: employeesTabContent },
        { key: '3', label: 'Accounting & Payment', children: accPaymentTabContent },
        ...(isEditing ? [{ key: '4', label: 'Connections', children: connectionsTabContent }] : []),
    ];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('list')}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        title="Back to list"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
                                {isEditing ? formData.name : 'New Payroll Entry'}
                            </h1>
                            <span className={`px-2.5 py-1 rounded text-xs font-medium border ${formData.status === 'Submitted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {formData.status || 'Not Saved'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isSubmitted && (
                        <button
                            className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-black transition-colors"
                        >
                            Make Bank Entry
                        </button>
                    )}
                    <button
                        onClick={() => setView('list')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    {!isSubmitted && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2 bg-gray-900 text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
                <div className="p-6 pt-2">
                    <Tabs defaultActiveKey="1" items={tabItems} className="custom-tabs" />
                </div>
            </div>

            {/* Some CSS override for AntD Tabs if needed */}
            <style>{`
                .custom-tabs .ant-tabs-nav::before {
                    border-bottom-color: #f3f4f6;
                }
                .custom-tabs .ant-tabs-tab {
                    padding: 12px 0;
                    margin: 0 32px 0 0;
                    color: #6b7280;
                }
                .custom-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 500;
                }
                .custom-tabs .ant-tabs-ink-bar {
                    background: #111827;
                }
            `}</style>
        </div>
    );
};

export default PayrollEntry;
