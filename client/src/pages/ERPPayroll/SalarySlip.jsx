import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useLocation } from 'react-router-dom';
import API from '../../services/api'; // Adjust path depending on location

// Helpers
const getStatusLabel = (doc) => {
    // If the API explicitly marks the slip as Withheld, honor it over the generic 'docstatus' state.
    if (doc.status === 'Withheld') return 'Withheld';

    // Otherwise rely on generic document states.
    if (doc.docstatus === 1) return 'Submitted';
    if (doc.docstatus === 2) return 'Cancelled';
    return doc.status || 'Draft';
};

const getStatusColor = (status) => {
    if (status === 'Submitted') return 'bg-[#EBF5FF] text-[#2B6CB0] font-medium';
    if (status === 'Cancelled') return 'bg-[#F3F4F6] text-[#374151] font-medium';
    if (status === 'Withheld') return 'bg-[#FEF0C7] text-[#B54708] font-medium';
    return 'bg-[#FCE8E8] text-[#E02424] font-medium'; // Draft
};

const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
};

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = true, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-sm text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SalarySlip = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [formTab, setFormTab] = useState('details');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [components, setComponents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [salaryStructures, setSalaryStructures] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form states
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeRowEdit, setActiveRowEdit] = useState(null); // { type: 'earnings' | 'deductions', index: number }

    const defaultForm = {
        name: '',
        employee: '',
        employee_name: '',
        posting_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        company: '',
        department: '',
        designation: '',
        branch: '',
        letter_head: '',
        salary_withholding: '',
        currency: 'INR',
        salary_structure: '',
        payroll_entry: '',
        mode_of_payment: '',
        payroll_frequency: '',
        start_date: '',
        end_date: '',
        salary_slip_based_on_timesheet: 0,
        deduct_tax_for_unclaimed_employee_benefits: 0,
        deduct_tax_for_unsubmitted_tax_exemption_proof: 0,
        total_working_days: '',
        payment_days: '',
        leave_without_pay: '',
        absent_days: '',
        gross_pay: '',
        gross_year_to_date: '',
        total_deduction: '',
        net_pay: '',
        rounded_total: '',
        year_to_date: '',
        month_to_date: '',
        total_in_words: '',
        journal_entry: '',
        bank_name: '',
        bank_account_no: '',
        ot_hours: '',
        ot_rate: '',
        earnings: [],
        deductions: []
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // Filter states
    const [searchId, setSearchId] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterEmployeeName, setFilterEmployeeName] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterStructure, setFilterStructure] = useState('');

    // Parse URL parameters for pre-filled filters
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [filterPayrollEntry, setFilterPayrollEntry] = useState(queryParams.get('Payroll Entry') || '');
    const [filterSalaryWithholding, setFilterSalaryWithholding] = useState(queryParams.get('Salary Withholding') || '');

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Salary Slip?fields=["name","employee","employee_name","posting_date","company","docstatus","status","department","branch","salary_structure"]&limit_page_length=None&order_by=modified desc';

            // Apply all active filters to the API call
            let filters = [];
            if (searchId) filters.push(`["name","like","%${searchId}%"]`);
            if (filterEmployee) filters.push(`["employee","like","%${filterEmployee}%"]`);
            if (filterEmployeeName) filters.push(`["employee_name","like","%${filterEmployeeName}%"]`);
            if (filterCompany) filters.push(`["company","=","${filterCompany}"]`);
            if (filterDepartment) filters.push(`["department","=","${filterDepartment}"]`);
            if (filterBranch) filters.push(`["branch","=","${filterBranch}"]`);
            if (filterPayrollEntry) filters.push(`["payroll_entry","=","${filterPayrollEntry}"]`);
            if (filterSalaryWithholding) filters.push(`["salary_withholding","=","${filterSalaryWithholding}"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Salary Slips' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, compRes, compnRes, deptRes, branchRes, ssRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company"]&filters={"status":"Active"}&limit_page_length=None'),
                API.get('/api/resource/Company?limit_page_length=None'),
                API.get('/api/resource/Salary Component?limit_page_length=None'),
                API.get('/api/resource/Department?limit_page_length=None'),
                API.get('/api/resource/Branch?limit_page_length=None'),
                API.get('/api/resource/Salary Structure?limit_page_length=None')
            ]);
            if (empRes.data.data) setEmployees(empRes.data.data);
            if (compRes.data.data) setCompanies(compRes.data.data.map(c => c.name));
            if (compnRes.data.data) setComponents(compnRes.data.data.map(c => c.name));
            if (deptRes.data.data) setDepartments(deptRes.data.data.map(d => d.name));
            if (branchRes.data.data) setBranches(branchRes.data.data.map(b => b.name));
            if (ssRes.data.data) setSalaryStructures(ssRes.data.data.map(s => s.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Salary Slip/${encodeURIComponent(name)}`);
            if (res.data.data) {
                const doc = res.data.data;
                setFormData({
                    ...defaultForm,
                    ...doc,
                    earnings: doc.earnings || [],
                    deductions: doc.deductions || [],
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

    const closeRowEdit = () => setActiveRowEdit(null);
    const openRowEdit = (type, index) => setActiveRowEdit({ type, index });

    // Column Config
    const [showColConfig, setShowColConfig] = useState(false);
    const [showFieldSelection, setShowFieldSelection] = useState(false);
    const [salaryDetailFields, setSalaryDetailFields] = useState([]);
    const defaultCols = [
        { fieldname: 'Component', width: 2 },
        { fieldname: 'Amount', width: 2 }
    ];
    const [configCols, setConfigCols] = useState(defaultCols);
    const [tempSelectedFields, setTempSelectedFields] = useState([]);

    const fetchSalaryDetailFields = async () => {
        try {
            const res = await API.get('/api/resource/DocType/Salary Detail');
            if (res.data && res.data.data && res.data.data.fields) {
                const fields = res.data.data.fields
                    .filter(f => f.label && !['Section Break', 'Column Break', 'HTML', 'Fold'].includes(f.fieldtype))
                    .map(f => ({ fieldname: f.label, original_fieldname: f.fieldname }));
                setSalaryDetailFields(fields);
            }
        } catch (error) {
            console.error('Failed to fetch Salary Detail fields from API, using fallback', error);
            // Fallback to standard fields if API fails
            setSalaryDetailFields([
                { fieldname: 'Component', original_fieldname: 'salary_component' },
                { fieldname: 'Amount (INR)', original_fieldname: 'amount' },
                { fieldname: 'Year To Date (INR)', original_fieldname: 'year_to_date' },
                { fieldname: 'Additional Salary', original_fieldname: 'additional_salary' },
                { fieldname: 'Is Recurring Additional Salary', original_fieldname: 'is_recurring_additional_salary' },
                { fieldname: 'Depends on Payment Days', original_fieldname: 'depends_on_payment_days' },
                { fieldname: 'Exempted from Income Tax', original_fieldname: 'exempted_from_income_tax' },
                { fieldname: 'Is Tax Applicable', original_fieldname: 'is_tax_applicable' },
                { fieldname: 'Is Flexible Benefit', original_fieldname: 'is_flexible_benefit' },
                { fieldname: 'Do not include in total', original_fieldname: 'do_not_include_in_total' },
                { fieldname: 'Deduct Full Tax on Selected Payroll Date', original_fieldname: 'deduct_full_tax_on_selected_payroll_date' },
                { fieldname: 'Condition', original_fieldname: 'condition' },
                { fieldname: 'Amount based on formula', original_fieldname: 'amount_based_on_formula' },
                { fieldname: 'Default Amount (INR)', original_fieldname: 'default_amount' },
                { fieldname: 'Tax on flexible benefit (INR)', original_fieldname: 'tax_on_flexible_benefit' },
                { fieldname: 'Tax on additional salary (INR)', original_fieldname: 'tax_on_additional_salary' }
            ]);
        }
    };

    const handleAddRemoveColumns = () => {
        if (salaryDetailFields.length === 0) fetchSalaryDetailFields();
        setTempSelectedFields(configCols.map(c => c.fieldname));
        setShowColConfig(false);
        setShowFieldSelection(true);
    };

    const applyFieldSelection = () => {
        // Keep existing columns and widths, add new ones with default width 2, remove unselected
        let newConfigCols = configCols.filter(c => tempSelectedFields.includes(c.fieldname));
        const currentFieldnames = newConfigCols.map(c => c.fieldname);
        tempSelectedFields.forEach(tf => {
            if (!currentFieldnames.includes(tf)) {
                newConfigCols.push({ fieldname: tf, width: 2 });
            }
        });
        setConfigCols(newConfigCols);
        setShowFieldSelection(false);
        setShowColConfig(true);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!activeRowEdit) return;
            if (e.key === 'Escape') closeRowEdit();
            if (e.ctrlKey && e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeRowEdit.index > 0) setActiveRowEdit({ ...activeRowEdit, index: activeRowEdit.index - 1 });
            }
            if (e.ctrlKey && e.key === 'ArrowDown') {
                e.preventDefault();
                const list = formData[activeRowEdit.type];
                if (activeRowEdit.index < list.length - 1) setActiveRowEdit({ ...activeRowEdit, index: activeRowEdit.index + 1 });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeRowEdit, formData]);

    // --- ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setFormTab('details');
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setFormTab('details');
        setView('form');
        await fetchSingle(record.name);
    };

    const handleSave = async () => {
        if (!formData.employee) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                posting_date: formData.posting_date,
                company: formData.company,
                letter_head: formData.letter_head,
                payroll_frequency: formData.payroll_frequency,
                start_date: formData.start_date,
                end_date: formData.end_date,
                salary_slip_based_on_timesheet: formData.salary_slip_based_on_timesheet,
                deduct_tax_for_unclaimed_employee_benefits: formData.deduct_tax_for_unclaimed_employee_benefits,
                deduct_tax_for_unsubmitted_tax_exemption_proof: formData.deduct_tax_for_unsubmitted_tax_exemption_proof,
                total_working_days: formData.total_working_days ? parseFloat(formData.total_working_days) : 0,
                payment_days: formData.payment_days ? parseFloat(formData.payment_days) : 0,
                leave_without_pay: formData.leave_without_pay ? parseFloat(formData.leave_without_pay) : 0,
                journal_entry: formData.journal_entry,
                bank_name: formData.bank_name,
                bank_account_no: formData.bank_account_no,
                ot_hours: formData.ot_hours ? parseFloat(formData.ot_hours) : 0,
                ot_rate: formData.ot_rate ? parseFloat(formData.ot_rate) : 0,
                earnings: formData.earnings.map(e => ({ salary_component: e.salary_component, amount: parseFloat(e.amount) || 0 })),
                deductions: formData.deductions.map(d => ({ salary_component: d.salary_component, amount: parseFloat(d.amount) || 0 })),
            };

            if (editingRecord) {
                await API.put(`/api/resource/Salary Slip/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Salary Slip', payload);
                notification.success({ message: `"${res.data?.data?.name || 'Record'}" created successfully!` });
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

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Salary Slip/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    // --- FORM HELPERS ---
    const updateField = (k, v) => setFormData(p => ({ ...p, [k]: v }));

    const handleEmployeeChange = (empName) => {
        const emp = employees.find(e => e.name === empName);
        if (emp) {
            updateField('employee', emp.name);
            updateField('employee_name', emp.employee_name || '');
            if (emp.company) updateField('company', emp.company);
        } else {
            updateField('employee', empName);
        }
    };

    const addEarnRow = () => updateField('earnings', [...formData.earnings, { salary_component: '', amount: 0 }]);
    const updateEarnRow = (i, f, v) => {
        const arr = [...formData.earnings];
        arr[i] = { ...arr[i], [f]: v };
        updateField('earnings', arr);
    };
    const remEarnRow = (i) => updateField('earnings', formData.earnings.filter((_, idx) => idx !== i));

    const addDedRow = () => updateField('deductions', [...formData.deductions, { salary_component: '', amount: 0 }]);
    const updateDedRow = (i, f, v) => {
        const arr = [...formData.deductions];
        arr[i] = { ...arr[i], [f]: v };
        updateField('deductions', arr);
    };
    const remDedRow = (i) => updateField('deductions', formData.deductions.filter((_, idx) => idx !== i));

    const CheckboxLabel = ({ label, field }) => (
        <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" className="accent-blue-600" checked={!!formData[field]} onChange={(e) => updateField(field, e.target.checked ? 1 : 0)} disabled={!!editingRecord} />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    const renderCell = (type, i, r, col) => {
        const updateFn = type === 'earnings' ? updateEarnRow : updateDedRow;
        if (col.fieldname === 'Component' || col.fieldname === 'salary_component') {
            return (
                <select className="w-full border-0 bg-transparent py-1 px-2 focus:ring-0 text-gray-800"
                    value={r.salary_component || ''} onChange={(e) => updateFn(i, 'salary_component', e.target.value)} disabled={!!editingRecord}>
                    <option value="">Select...</option>
                    {components.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            );
        }

        let dataKey = 'amount';
        if (col.fieldname === 'Amount' || col.fieldname === 'Amount (INR)') {
            dataKey = 'amount';
        } else {
            const fieldDef = salaryDetailFields.find(f => f.fieldname === col.fieldname);
            dataKey = fieldDef ? fieldDef.original_fieldname : col.fieldname.toLowerCase().replace(/ /g, '_');
        }

        const isCheckbox = ['is_tax_applicable', 'depends_on_payment_days', 'is_flexible_benefit', 'do_not_include_in_total', 'deduct_full_tax_on_selected_payroll_date', 'is_recurring_additional_salary', 'exempted_from_income_tax'].includes(dataKey) || col.fieldname.startsWith('Is ');

        if (isCheckbox) {
            return (
                <div className="flex justify-center p-1.5">
                    <input type="checkbox" className="w-4 h-4 text-black rounded border-gray-300 focus:ring-black focus:ring-offset-0 cursor-pointer"
                        checked={!!r[dataKey]} onChange={(e) => updateFn(i, dataKey, e.target.checked ? 1 : 0)} disabled={!!editingRecord} />
                </div>
            );
        }

        return (
            <input type="number" className="w-full border-0 bg-transparent py-1 px-2 text-right focus:ring-0 text-gray-800"
                value={r[dataKey] || ''} onChange={(e) => updateFn(i, dataKey, e.target.value)} disabled={!!editingRecord} />
        );
    };

    // --- FILTERING ---
    const filteredData = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterEmployee && d.employee !== filterEmployee) return false;
        if (filterEmployeeName && !d.employee_name?.toLowerCase().includes(filterEmployeeName.toLowerCase())) return false;
        if (filterCompany && d.company !== filterCompany) return false;
        if (filterDepartment && d.department !== filterDepartment) return false;
        if (filterBranch && d.branch !== filterBranch) return false;
        if (filterStructure && d.salary_structure !== filterStructure) return false;
        return true;
    });

    const hasActiveFilters = searchId || filterEmployee || filterEmployeeName || filterCompany || filterDepartment || filterBranch || filterStructure;
    const clearFilters = () => {
        setSearchId(''); setFilterEmployee(''); setFilterEmployeeName(''); setFilterCompany(''); setFilterDepartment(''); setFilterBranch(''); setFilterStructure('');
    };

    // --- RENDER ---
    if (view === 'form') {
        const tabs = [
            { id: 'details', label: 'Details' },
            { id: 'payment', label: 'Payment Days' },
            { id: 'earnings_deductions', label: 'Earnings & Deductions' },
            { id: 'net_pay', label: 'Net Pay Info' },
            { id: 'bank', label: 'Bank Details' },
            { id: 'ot', label: 'OT' }
        ];

        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {editingRecord ? editingRecord.name : 'New Salary Slip'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-[13px] px-2.5 py-0.5 rounded-full ${getStatusColor(getStatusLabel(editingRecord))}`}>{getStatusLabel(editingRecord)}</span>
                            : <span className="text-[13px] px-2.5 py-0.5 rounded-full bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded border hover:bg-gray-200" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <nav className="text-xs text-gray-400 mb-4">
                    <span className="cursor-pointer hover:text-blue-500" onClick={() => setView('list')}>Salary Slip</span>
                    <span className="mx-1">›</span>
                    <span>{editingRecord ? editingRecord.name : 'New'}</span>
                </nav>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-12">
                    <div className="flex border-b border-gray-200 bg-gray-50/50 px-4 pt-2">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${formTab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setFormTab(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        {formTab === 'details' && (
                            <div className="space-y-8">
                                {/* Employee Info */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Employee Info</h3>
                                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                                        {/* Column 1 */}
                                        <div className="space-y-6">
                                            {!editingRecord ? (
                                                <div>
                                                    <label className="block text-sm text-gray-500 mb-1">Employee <span className="text-red-400">*</span></label>
                                                    <select className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none bg-white text-gray-700 shadow-sm"
                                                        value={formData.employee} onChange={(e) => handleEmployeeChange(e.target.value)}>
                                                        <option value="">Select Employee...</option>
                                                        {employees.map(e => <option key={e.name} value={e.name}>{e.name} - {e.employee_name}</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <InputField label="Employee" value={`${formData.employee}: ${formData.employee_name}`} required />
                                            )}
                                            <InputField label="Employee Name" value={formData.employee_name} required />
                                            {!editingRecord ? (
                                                <div>
                                                    <label className="block text-sm text-gray-500 mb-1">Company <span className="text-red-400">*</span></label>
                                                    <select className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none bg-white text-gray-700 shadow-sm"
                                                        value={formData.company} onChange={(e) => updateField('company', e.target.value)}>
                                                        <option value="">Select Company...</option>
                                                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <InputField label="Company" value={formData.company} required />
                                            )}
                                            <InputField label="Department" value={formData.department} />
                                            <InputField label="Designation" value={formData.designation} />
                                            <InputField label="Branch" value={formData.branch} />
                                        </div>
                                        {/* Column 2 */}
                                        <div className="space-y-6">
                                            <InputField label="Posting Date" value={formData.posting_date} type="date" required onChange={(v) => !editingRecord && updateField('posting_date', v)} disabled={!!editingRecord} />
                                            <InputField label="Letter Head" value={formData.letter_head} onChange={(v) => !editingRecord && updateField('letter_head', v)} disabled={!!editingRecord} />
                                        </div>
                                        {/* Column 3 */}
                                        <div className="space-y-6">
                                            <InputField label="Status" value={getStatusLabel(formData)} />
                                            <InputField label="Salary Withholding" value={formData.salary_withholding} />
                                            <InputField label="Currency" value={formData.currency} required />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Payroll Info */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Payroll Info</h3>
                                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                                        <div className="space-y-6">
                                            <InputField label="Payroll Frequency" value={formData.payroll_frequency} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('payroll_frequency', v)} />
                                            <InputField label="Start Date" value={formData.start_date} type="date" disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('start_date', v)} />
                                            <InputField label="End Date" value={formData.end_date} type="date" disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('end_date', v)} />
                                        </div>
                                        <div className="space-y-6">
                                            <InputField label="Salary Structure" value={formData.salary_structure} required disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('salary_structure', v)} />
                                            <InputField label="Payroll Entry" value={formData.payroll_entry} />
                                            <InputField label="Mode Of Payment" value={formData.mode_of_payment} />
                                        </div>
                                        <div className="space-y-6 pt-6 mb-auto">
                                            <CheckboxLabel field="salary_slip_based_on_timesheet" label="Salary Slip Based on Timesheet" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                <div className="space-y-4">
                                    <CheckboxLabel field="deduct_tax_for_unclaimed_employee_benefits" label="Deduct Tax For Unclaimed Employee Benefits" />
                                    <CheckboxLabel field="deduct_tax_for_unsubmitted_tax_exemption_proof" label="Deduct Tax For Unsubmitted Tax Exemption Proof" />
                                </div>
                            </div>
                        )}

                        {formTab === 'payment' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-4xl">
                                    <InputField label="Working Days" value={formData.total_working_days} required disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('total_working_days', v)} type="number" />
                                    <InputField label="Absent Days" value={formData.absent_days} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('absent_days', v)} type="number" />
                                    <InputField label="Leave Without Pay" value={formData.leave_without_pay} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('leave_without_pay', v)} type="number" />
                                    <InputField label="Payment Days" value={formData.payment_days} required disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('payment_days', v)} type="number" />
                                </div>

                                <hr className="border-gray-100" />

                                <div className="space-y-4 text-sm text-gray-700">
                                    <p><strong>Note:</strong> Payment Days calculations are based on these Payroll Settings:</p>
                                    <div className="py-2">
                                        <p>Payroll Based On: <strong>Leave</strong></p>
                                        <p>Consider Unmarked Attendance As: <strong>Present</strong></p>
                                        <p>Consider Marked Attendance on Holidays: <strong>Disabled</strong></p>
                                    </div>
                                    <p>Click <a href="#" className="text-blue-600 hover:underline">here</a> to change the configuration and then resave salary slip</p>
                                </div>
                            </div>
                        )}

                        {formTab === 'earnings_deductions' && (
                            <div>
                                <div className="grid grid-cols-2 gap-8">
                                    {/* Earnings Grid */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
                                            <h4 className="text-sm font-medium text-gray-700">Earnings</h4>
                                        </div>
                                        <div className="p-0">
                                            <table className="w-full text-left text-sm text-gray-600">
                                                <thead className="bg-gray-50 text-gray-500 border-b relative">
                                                    <tr>
                                                        {configCols.map(col => (
                                                            <th key={col.fieldname} className={`font-normal px-4 py-2 ${col.fieldname !== 'Component' ? 'text-right' : ''}`}>
                                                                {col.fieldname} {col.fieldname === 'Component' ? '*' : ''}
                                                            </th>
                                                        ))}
                                                        <th className="w-12 text-center p-2">
                                                            <button className="text-gray-400 hover:text-gray-700 mx-auto block shrink-0" onClick={() => setShowColConfig('earnings')}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                            </button>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {formData.earnings.length === 0 ? (
                                                        <tr><td colSpan={configCols.length + 1} className="py-8 text-center text-gray-400">No Data</td></tr>
                                                    ) : formData.earnings.map((r, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            {configCols.map(col => (
                                                                <td key={col.fieldname} className="p-2 align-middle">
                                                                    {renderCell('earnings', i, r, col)}
                                                                </td>
                                                            ))}
                                                            <td className="p-2 text-center flex items-center justify-center gap-2 mt-1">
                                                                <button className="text-gray-400 hover:text-blue-500" onClick={() => openRowEdit('earnings', i)}>
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                </button>
                                                                {!editingRecord && (
                                                                    <button className="text-gray-400 hover:text-red-500" onClick={() => remEarnRow(i)}>×</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {!editingRecord && (
                                                <button className="w-full px-4 py-2 text-sm text-left text-gray-500 hover:bg-gray-50 bg-gray-50/50" onClick={addEarnRow}>Add Row</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deductions Grid */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
                                            <h4 className="text-sm font-medium text-gray-700">Deductions</h4>
                                        </div>
                                        <div className="p-0">
                                            <table className="w-full text-left text-sm text-gray-600">
                                                <thead className="bg-gray-50 text-gray-500 border-b relative">
                                                    <tr>
                                                        {configCols.map(col => (
                                                            <th key={col.fieldname} className={`font-normal px-4 py-2 ${col.fieldname !== 'Component' ? 'text-right' : ''}`}>
                                                                {col.fieldname} {col.fieldname === 'Component' ? '*' : ''}
                                                            </th>
                                                        ))}
                                                        <th className="w-12 text-center p-2">
                                                            <button className="text-gray-400 hover:text-gray-700 mx-auto block shrink-0" onClick={() => setShowColConfig('deductions')}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                            </button>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {formData.deductions.length === 0 ? (
                                                        <tr><td colSpan={configCols.length + 1} className="py-8 text-center text-gray-400">No Data</td></tr>
                                                    ) : formData.deductions.map((r, i) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            {configCols.map(col => (
                                                                <td key={col.fieldname} className="p-2 align-middle">
                                                                    {renderCell('deductions', i, r, col)}
                                                                </td>
                                                            ))}
                                                            <td className="p-2 text-center flex items-center justify-center gap-2 mt-1">
                                                                <button className="text-gray-400 hover:text-blue-500" onClick={() => openRowEdit('deductions', i)}>
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                                </button>
                                                                {!editingRecord && (
                                                                    <button className="text-gray-400 hover:text-red-500" onClick={() => remDedRow(i)}>×</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {!editingRecord && (
                                                <button className="w-full px-4 py-2 text-sm text-left text-gray-500 hover:bg-gray-50 bg-gray-50/50" onClick={addDedRow}>Add Row</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Configure Columns Modal */}
                                {showColConfig && (
                                    <div className="fixed inset-0 bg-gray-600/50 flex flex-col items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full relative">
                                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                                <h3 className="text-lg font-medium text-gray-800">Configure Columns</h3>
                                                <button className="text-gray-400 hover:text-gray-900" onClick={() => setShowColConfig(false)}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <div className="px-8 py-6">
                                                <table className="w-full text-left text-[15px] text-gray-700">
                                                    <thead>
                                                        <tr>
                                                            <th className="font-semibold text-gray-600 py-3 w-[60%] border-b border-transparent">Fieldname</th>
                                                            <th className="font-semibold text-gray-600 py-3 w-[40%] border-b border-transparent pl-4">Column Width</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="space-y-3 block">
                                                        {configCols.map((col, idx) => (
                                                            <tr key={idx} className="bg-gray-50 rounded-lg flex items-center w-full px-4 py-3">
                                                                <td className="w-[60%] flex items-center gap-3">
                                                                    <div className="text-gray-300">
                                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM14 6a2 2 0 11-4 0 2 2 0 014 0zM14 12a2 2 0 11-4 0 2 2 0 014 0zM14 18a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                                                    </div>
                                                                    <span className="font-medium text-gray-700">{col.fieldname}</span>
                                                                </td>
                                                                <td className="w-[40%] flex items-center justify-between pl-4">
                                                                    <input
                                                                        type="number"
                                                                        className="w-24 bg-white border border-transparent shadow-sm rounded px-3 py-1.5 text-right focus:outline-none focus:border-blue-400"
                                                                        value={col.width}
                                                                        onChange={(e) => {
                                                                            const newCols = [...configCols];
                                                                            newCols[idx].width = e.target.value;
                                                                            setConfigCols(newCols);
                                                                        }}
                                                                    />
                                                                    <button className="text-gray-400 hover:text-red-500 py-1 px-2" onClick={() => {
                                                                        setConfigCols(configCols.filter((_, i) => i !== idx));
                                                                    }}>
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <button className="text-[13px] text-gray-500 hover:text-gray-800 font-medium mt-4 tracking-wide" onClick={handleAddRemoveColumns}>+ Add / Remove Columns</button>
                                            </div>
                                            <div className="border-t border-gray-100 p-4 bg-white rounded-b-xl flex justify-end gap-3">
                                                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[15px] font-medium rounded-lg transition-colors" onClick={() => { setConfigCols(defaultCols); setShowColConfig(false); }}>Reset to default</button>
                                                <button className="px-6 py-2 bg-[#1C1F26] text-white text-[15px] font-medium rounded-lg hover:bg-black transition-colors" onClick={() => setShowColConfig(false)}>Update</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Salary Detail Fields Selection Modal */}
                                {showFieldSelection && (
                                    <div className="fixed inset-0 bg-gray-600/50 flex flex-col items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full relative">
                                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                                <h3 className="text-lg font-medium text-gray-800">Salary Detail Fields</h3>
                                                <button className="text-gray-400 hover:text-gray-900" onClick={() => { setShowFieldSelection(false); setShowColConfig(true); }}>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                                                <p className="text-sm text-gray-500 mb-4">Select Fields</p>
                                                {salaryDetailFields.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-gray-400">Loading fields from API...</div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                                                        {salaryDetailFields.map((field, idx) => {
                                                            const isChecked = tempSelectedFields.includes(field.fieldname);
                                                            return (
                                                                <label key={idx} className="flex flex-col items-start gap-1.5 cursor-pointer group">
                                                                    <div className="relative">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800 focus:ring-offset-0 cursor-pointer peer hidden"
                                                                            checked={isChecked}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setTempSelectedFields([...tempSelectedFields, field.fieldname]);
                                                                                } else {
                                                                                    setTempSelectedFields(tempSelectedFields.filter(f => f !== field.fieldname));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {/* Custom Checkbox UI */}
                                                                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${isChecked ? 'bg-[#1C1F26] border-[#1C1F26]' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                                                                            {isChecked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[14px] text-gray-800 font-medium leading-snug select-none">{field.fieldname}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-100 p-4 bg-white rounded-b-xl flex justify-end gap-3">
                                                <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[14px] font-medium rounded-lg transition-colors" onClick={() => {
                                                    if (tempSelectedFields.length === salaryDetailFields.length) {
                                                        setTempSelectedFields([]);
                                                    } else {
                                                        setTempSelectedFields(salaryDetailFields.map(f => f.fieldname));
                                                    }
                                                }}>
                                                    {tempSelectedFields.length === salaryDetailFields.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                                <button className="px-6 py-2 bg-[#1C1F26] text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors" onClick={applyFieldSelection}>Add</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Totals Section */}
                                <div className="mt-8 space-y-6">
                                    <h3 className="text-base font-semibold text-gray-800">Totals</h3>
                                    <hr className="border-gray-100" />
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-6">
                                            <InputField label="Gross Pay (INR)" value={formatINR(formData.gross_pay)} />
                                            <InputField label="Gross Year To Date (INR)" value={formatINR(formData.gross_year_to_date)} />
                                        </div>
                                        <div className="space-y-6">
                                            <InputField label="Total Deduction (INR)" value={formatINR(formData.total_deduction)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {formTab === 'net_pay' && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-4xl">
                                <InputField label="Net Pay (INR)" value={formatINR(formData.net_pay)} />
                                <div className="-space-y-1">
                                    <InputField label="Year To Date (INR)" value={formatINR(formData.year_to_date)} />
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Total salary booked for this employee from the beginning of the year (payroll period or fiscal year) up to the current salary slip's end date.</p>
                                </div>
                                <InputField label="Rounded Total (INR)" value={formatINR(formData.rounded_total || formData.net_pay)} />
                                <div className="-space-y-1">
                                    <InputField label="Month To Date (INR)" value={formatINR(formData.month_to_date || formData.net_pay)} />
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Total salary booked for this employee from the beginning of the month up to the current salary slip's end date.</p>
                                </div>
                                <div className="col-span-2 pt-4">
                                    <hr className="border-gray-100 mb-6" />
                                    <InputField label="Total in words (INR)" value={formData.total_in_words || 'INR Nineteen Thousand only.'} colSpan={2} />
                                </div>
                            </div>
                        )}

                        {formTab === 'bank' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <InputField label="Journal Entry" value={formData.journal_entry} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('journal_entry', v)} />
                                </div>
                                <div className="space-y-6">
                                    <InputField label="Bank Name" value={formData.bank_name} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('bank_name', v)} />
                                    <InputField label="Bank Account No" value={formData.bank_account_no} disabled={!!editingRecord} onChange={(v) => !editingRecord && updateField('bank_account_no', v)} />
                                </div>
                            </div>
                        )}

                        {formTab === 'ot' && (
                            <div className="space-y-10 mt-2">
                                {/* Grade Section */}
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <label className="block text-[13px] font-semibold text-gray-800">Grade</label>
                                        <svg className="w-3.5 h-3.5 text-white bg-gray-700/80 rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div className="bg-gray-50 text-gray-500 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">
                                        {formData.grade || 'Developer'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-x-12 px-1">
                                    {/* OT Details */}
                                    <div className="space-y-6">
                                        <h4 className="font-semibold text-[13px] text-gray-800 mb-2">OT Details</h4>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[13px] text-gray-500 mb-1.5">Overtime Hours</label>
                                                <div className="bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">{formData.overtime_hours || 0}</div>
                                            </div>
                                            <div>
                                                <label className="block text-[13px] text-gray-500 mb-1.5">Overtime Amount</label>
                                                <div className="bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">₹ {Number(formData.overtime_amount || 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Incentive Details */}
                                    <div className="space-y-6">
                                        <h4 className="font-semibold text-[13px] text-gray-800 mb-2">Incentive Details</h4>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[13px] text-gray-500 mb-1.5">Incentive Hours</label>
                                                <div className="bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">{formData.incentive_hours || 0}</div>
                                            </div>
                                            <div>
                                                <label className="block text-[13px] text-gray-500 mb-1.5">Incentive Amount</label>
                                                <div className="bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">₹ {Number(formData.incentive_amount || 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Night Shift Count */}
                                    <div className="space-y-6">
                                        <h4 className="font-semibold text-[13px] text-gray-800 mb-2">Night Shift Count</h4>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-[13px] text-gray-500 mb-1.5">#Night</label>
                                                <div className="bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-lg text-sm border border-gray-100">{formData.night_shift_count || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row Edit Modal */}
                {activeRowEdit && (
                    <div className="fixed inset-0 bg-gray-600/50 flex flex-col items-center justify-center z-50 p-4">
                        {/* A click outside listener can be added here, but explicit close button is fine */}
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold text-gray-800">Editing Row #{activeRowEdit.index + 1}</h3>
                                <button className="text-gray-400 hover:text-gray-900 absolute top-4 right-4" onClick={closeRowEdit}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {/* Component */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Component <span className="text-red-400">*</span></label>
                                        <div className="bg-gray-50 text-gray-800 font-medium px-3 py-2 rounded text-sm min-h-[36px]">
                                            {formData[activeRowEdit.type][activeRowEdit.index].salary_component || 'Select Component'}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Amount (INR)</label>
                                        <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded text-sm min-h-[36px]">
                                            ₹ {(parseFloat(formData[activeRowEdit.type][activeRowEdit.index].amount) || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    <div></div>
                                    {/* YTD */}
                                    <div className="mt-2">
                                        <label className="block text-sm text-gray-700 mb-1">Year To Date (INR)</label>
                                        <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded text-sm min-h-[36px]">
                                            ₹ {(parseFloat(formData[activeRowEdit.type][activeRowEdit.index].amount) || 0).toFixed(2)}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                            Total salary booked against this component for this employee from the beginning of the year (payroll period or fiscal year) up to the current salary slip's end date.
                                        </p>
                                    </div>
                                </div>

                                {/* Properties / References */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <h4 className="text-base text-gray-800 font-medium">Component properties and references</h4>
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        {[
                                            { label: 'Depends on Payment Days', key: 'depends_on_payment_days' },
                                            { label: 'Is Flexible Benefit', key: 'is_flexible_benefit' },
                                            { label: 'Is Tax Applicable', key: 'is_tax_applicable' },
                                            { label: 'Do not include in total', key: 'do_not_include_in_total' },
                                            { label: '', key: '' }, // empty placeholder for layout
                                            { label: 'Deduct Full Tax on\nSelected Payroll Date', key: 'deduct_full_tax_on_selected_payroll_date' }
                                        ].map((prop, idx) => {
                                            if (!prop.key) return <div key={idx}></div>;
                                            const isChecked = !!formData[activeRowEdit.type][activeRowEdit.index][prop.key];
                                            return (
                                                <div key={prop.key} className={`flex ${prop.label.includes('\n') ? 'items-start' : 'items-center'} gap-2.5`}>
                                                    {isChecked ? (
                                                        <div className={`w-4 h-4 rounded bg-gray-500 flex items-center justify-center shrink-0 ${prop.label.includes('\n') ? 'mt-0.5' : ''}`}>
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        </div>
                                                    ) : (
                                                        <div className={`w-4 h-4 rounded bg-gray-100 border border-gray-200 shrink-0 ${prop.label.includes('\n') ? 'mt-0.5' : ''}`}></div>
                                                    )}
                                                    <span className="text-[13px] text-gray-900 font-medium whitespace-pre-line leading-[1.3]">{prop.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer / Shortcuts */}
                                <div className="mt-8 pt-4 flex items-center gap-2.5 text-sm text-gray-700">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                                    <span className="font-semibold text-[13px]">Shortcuts:</span>
                                    <span className="px-2 py-0.5 border border-gray-300 rounded-md text-[13px] text-gray-600 bg-white shadow-sm font-medium tracking-tight">Ctrl + Up</span>
                                    <span className="text-gray-400 -mx-1 text-xs text-center">•</span>
                                    <span className="px-2 py-0.5 border border-gray-300 rounded-md text-[13px] text-gray-600 bg-white shadow-sm font-medium tracking-tight">Ctrl + Down</span>
                                    <span className="text-gray-400 -mx-1 text-xs text-center">•</span>
                                    <span className="px-2 py-0.5 border border-gray-300 rounded-md text-[13px] text-gray-600 bg-white shadow-sm font-medium tracking-tight">ESC</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Salary Slips</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800" onClick={handleNew}>
                        + Add Salary Slip
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {/* Filter Section matching ERPNext screenshot */}
            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4">
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
                            placeholder="Payroll Entry"
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={filterPayrollEntry}
                            onChange={e => setFilterPayrollEntry(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchData()}
                        />
                    </div>
                    <div className="flex-1 max-w-[200px]">
                        <input
                            type="text"
                            placeholder="Salary Withholding"
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={filterSalaryWithholding}
                            onChange={e => setFilterSalaryWithholding(e.target.value)}
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

                    <div className="flex-1"></div> {/* Spacer */}

                    <div className="flex gap-2">
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                            onClick={fetchData}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            {filterPayrollEntry || searchId || filterCompany || filterSalaryWithholding ? `Filters ${(filterPayrollEntry ? 1 : 0) + (searchId ? 1 : 0) + (filterCompany ? 1 : 0) + (filterSalaryWithholding ? 1 : 0)}` : 'Filter'}
                        </button>
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                            Last Updated On
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-wrap gap-4 items-center p-4">
                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                        value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(e => <option key={e.name} value={e.name}>{e.name} - {e.employee_name}</option>)}
                    </select>

                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                        value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                        <option value="">All Companies</option>
                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-blue-400 bg-gray-50"
                        value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-400 bg-gray-50"
                        value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                        value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)}>
                        <option value="">All Salary Structures</option>
                        {salaryStructures.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {hasActiveFilters && (
                        <button className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 shrink-0" onClick={() => { clearFilters(); setFilterSalaryWithholding(''); }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 font-medium cursor-pointer flex items-center gap-2">Employee Name</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Employee</th>
                                <th className="px-6 py-3 font-medium">Company</th>
                                <th className="px-6 py-3 font-medium">Posting Date</th>
                                <th className="px-6 py-3 font-medium">ID</th>
                                <th className="px-6 py-3 font-medium w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No Salary Slips found</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-3 font-medium text-gray-900 cursor-pointer" onClick={() => handleEdit(row)}>{row.employee_name || '-'}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[13px] inline-block ${getStatusColor(getStatusLabel(row))}`}>
                                                {getStatusLabel(row)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <a href="#" className="text-blue-600 hover:underline">{row.employee}</a>
                                        </td>
                                        <td className="px-6 py-3 max-w-[200px] truncate text-gray-500" title={row.company}>{row.company}</td>
                                        <td className="px-6 py-3 text-gray-500">{row.posting_date}</td>
                                        <td className="px-6 py-3 text-gray-500 text-xs">{row.name}</td>
                                        <td className="px-6 py-3 flex items-center h-full">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-[13px] mr-1" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-[#E02424] hover:text-red-800 font-medium text-[13px]" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div >
        </div >
    );
};

export default SalarySlip;
