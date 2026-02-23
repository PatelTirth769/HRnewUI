import React, { useState, useEffect, useMemo } from 'react';
import { notification, Checkbox } from 'antd';
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

const BulkSalaryStructureAssignment = () => {
    // --- MASTERS ---
    const [structures, setStructures] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [grades, setGrades] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [incomeTaxSlabs, setIncomeTaxSlabs] = useState([]);

    const [structureDetails, setStructureDetails] = useState({}); // to get company and currency implicitly

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        salary_structure: '',
        from_date: '',
        payroll_payable_account: '',
        income_tax_slab: '',  // Optional based on screenshot, but good to have
        // Quick Filters
        branch: '',
        department: '',
        designation: '',
        grade: '',
        employment_type: ''
    });

    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // --- FETCH MASTERS ---
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [structRes, accRes, branchRes, deptRes, desigRes, gradeRes, empTypeRes, taxSlabRes] = await Promise.all([
                    API.get('/api/resource/Salary Structure?fields=["name","company","currency"]&limit_page_length=None'),
                    API.get('/api/resource/Account?filters=[["is_group","=",0]]&limit_page_length=None'),
                    API.get('/api/resource/Branch?limit_page_length=None'),
                    API.get('/api/resource/Department?limit_page_length=None'),
                    API.get('/api/resource/Designation?limit_page_length=None'),
                    API.get('/api/resource/Employee Grade?limit_page_length=None'),
                    API.get('/api/resource/Employment Type?limit_page_length=None'),
                    API.get('/api/resource/Income Tax Slab?limit_page_length=None')
                ]);

                if (structRes.data.data) {
                    setStructures(structRes.data.data.map(s => s.name));
                    const detailsMap = {};
                    structRes.data.data.forEach(s => detailsMap[s.name] = { company: s.company, currency: s.currency });
                    setStructureDetails(detailsMap);
                }
                if (accRes.data.data) setAccounts(accRes.data.data.map(a => a.name));
                if (branchRes.data.data) setBranches(branchRes.data.data.map(b => b.name));
                if (deptRes.data.data) setDepartments(deptRes.data.data.map(d => d.name));
                if (desigRes.data.data) setDesignations(desigRes.data.data.map(d => d.name));
                if (gradeRes.data.data) setGrades(gradeRes.data.data.map(g => g.name));
                if (empTypeRes.data.data) setEmploymentTypes(empTypeRes.data.data.map(e => e.name));
                if (taxSlabRes.data.data) setIncomeTaxSlabs(taxSlabRes.data.data.map(t => t.name));

            } catch (err) {
                console.error("Failed to fetch masters", err);
            }
        };
        fetchMasters();
    }, []);

    // --- FETCH ELIGIBLE EMPLOYEES ---
    useEffect(() => {
        const fetchEligibleEmployees = async () => {
            if (!formData.salary_structure || !formData.from_date) {
                setEmployees([]);
                return;
            }

            setLoadingEmployees(true);
            try {
                const company = structureDetails[formData.salary_structure]?.company;

                // Build filters for Employee fetching
                let filters = [
                    ["status", "=", "Active"],
                    ["company", "=", company],
                    ["date_of_joining", "<=", formData.from_date]
                ];

                if (formData.branch) filters.push(["branch", "=", formData.branch]);
                if (formData.department) filters.push(["department", "=", formData.department]);
                if (formData.designation) filters.push(["designation", "=", formData.designation]);
                if (formData.grade) filters.push(["grade", "=", formData.grade]);
                if (formData.employment_type) filters.push(["employment_type", "=", formData.employment_type]);

                const filterStr = JSON.stringify(filters);
                const empRes = await API.get(`/api/resource/Employee?fields=["name","employee_name","grade","relieving_date"]&filters=${encodeURIComponent(filterStr)}&limit_page_length=None`);

                let eligible = empRes.data.data || [];

                // Filter out relieved employees
                eligible = eligible.filter(e => !e.relieving_date || new Date(e.relieving_date) > new Date(formData.from_date));

                // Fetch existing assignments to filter them out
                const assignRes = await API.get(`/api/resource/Salary Structure Assignment?fields=["employee"]&filters=[["docstatus","=",1],["from_date","=","${formData.from_date}"]]&limit_page_length=None`);
                const assignedEmployees = new Set((assignRes.data.data || []).map(a => a.employee));

                eligible = eligible.filter(e => !assignedEmployees.has(e.name));

                // Format for table and fetch default base from Grade if possible (simplification)
                // In ERPNext, it joins with Employee Grade, here we'll just set it to 0 as base and let user edit
                const finalEmployees = eligible.map(e => ({
                    employee: e.name,
                    employee_name: e.employee_name,
                    grade: e.grade,
                    base: 0,
                    variable: 0
                }));

                setEmployees(finalEmployees);
                setSelectedEmployees(new Set()); // Reset selection
            } catch (err) {
                console.error("Failed to fetch employees", err);
                notification.error({ message: "Failed to fetch eligible employees" });
            } finally {
                setLoadingEmployees(false);
            }
        };

        // Small debounce to prevent rapid firing while typing/selecting
        const timeoutId = setTimeout(() => {
            fetchEligibleEmployees();
        }, 500);
        return () => clearTimeout(timeoutId);

    }, [formData.salary_structure, formData.from_date, formData.branch, formData.department, formData.designation, formData.grade, formData.employment_type, structureDetails]);

    // --- HANDLERS ---
    const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleEmployeeDataChange = (employeeId, field, value) => {
        setEmployees(prev => prev.map(emp =>
            emp.employee === employeeId ? { ...emp, [field]: parseFloat(value) || 0 } : emp
        ));
    };

    const toggleEmployeeSelection = (employeeId) => {
        setSelectedEmployees(prev => {
            const next = new Set(prev);
            if (next.has(employeeId)) next.delete(employeeId);
            else next.add(employeeId);
            return next;
        });
    };

    const toggleAllSelection = () => {
        if (selectedEmployees.size === employees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(employees.map(e => e.employee)));
        }
    };

    const handleAssign = async () => {
        if (!formData.salary_structure) return notification.warning({ message: "Salary Structure is required" });
        if (!formData.from_date) return notification.warning({ message: "From Date is required" });
        if (selectedEmployees.size === 0) return notification.warning({ message: "Please select at least one employee" });

        setAssigning(true);
        const { company, currency } = structureDetails[formData.salary_structure] || {};

        const success = [];
        const failed = [];

        const selectedDocs = employees.filter(e => selectedEmployees.has(e.employee));

        for (const emp of selectedDocs) {
            const payload = {
                employee: emp.employee,
                salary_structure: formData.salary_structure,
                company: company,
                currency: currency,
                payroll_payable_account: formData.payroll_payable_account || undefined,
                from_date: formData.from_date,
                base: emp.base,
                variable: emp.variable,
                income_tax_slab: formData.income_tax_slab || undefined,
                docstatus: 1 // Attempt to submit it directly as ERPNext's bulk assign does
            };

            try {
                await API.post('/api/resource/Salary Structure Assignment', payload);
                success.push(emp.employee);
            } catch (err) {
                console.error(`Assignment failed for ${emp.employee}:`, err);
                failed.push(emp.employee);
            }
        }

        setAssigning(false);

        if (success.length > 0) {
            notification.success({
                message: "Assignment Complete",
                description: `Successfully assigned structure to ${success.length} employee(s).`
            });
            // Refetch to remove newly assigned employees from the list
            updateField('from_date', formData.from_date); // hack to trigger refetch
        }

        if (failed.length > 0) {
            notification.error({
                message: "Assignment Partially Failed",
                description: `Failed to assign structure to ${failed.length} employee(s). Check console for details.`,
                duration: 8
            });
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Bulk Salary Structure Assignment</h1>
                <button
                    className="px-5 py-2 bg-gray-900 text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    onClick={handleAssign}
                    disabled={assigning || selectedEmployees.size === 0}
                >
                    {assigning ? (
                        <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Assigning...</>
                    ) : 'Assign Structure'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Assignment Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 font-medium text-gray-700">Set Assignment Details</div>
                    <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6">
                        <SelectField label="Salary Structure" required options={structures} value={formData.salary_structure} onChange={v => updateField('salary_structure', v)} />
                        <SelectField label="Payroll Payable Account" options={accounts} value={formData.payroll_payable_account} onChange={v => updateField('payroll_payable_account', v)} />
                        <InputField label="From Date" type="date" required value={formData.from_date} onChange={v => updateField('from_date', v)} />
                        <SelectField label="Income Tax Slab" options={incomeTaxSlabs} value={formData.income_tax_slab} onChange={v => updateField('income_tax_slab', v)} />
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 font-medium text-gray-700">Quick Filters</div>
                    <div className="p-6 grid grid-cols-2 gap-x-12 gap-y-6">
                        <SelectField label="Branch" options={branches} value={formData.branch} onChange={v => updateField('branch', v)} />
                        <SelectField label="Employee Grade" options={grades} value={formData.grade} onChange={v => updateField('grade', v)} />
                        <SelectField label="Department" options={departments} value={formData.department} onChange={v => updateField('department', v)} />
                        <SelectField label="Employment Type" options={employmentTypes} value={formData.employment_type} onChange={v => updateField('employment_type', v)} />
                        <SelectField label="Designation" options={designations} value={formData.designation} onChange={v => updateField('designation', v)} />
                    </div>
                </div>

                {/* Employees Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 font-medium text-gray-700 flex justify-between items-center">
                        Select Employees
                        {selectedEmployees.size > 0 && <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selectedEmployees.size} selected</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500">
                                <tr>
                                    <th className="px-5 py-3 w-12 text-center">
                                        <Checkbox
                                            checked={employees.length > 0 && selectedEmployees.size === employees.length}
                                            indeterminate={selectedEmployees.size > 0 && selectedEmployees.size < employees.length}
                                            onChange={toggleAllSelection}
                                        />
                                    </th>
                                    <th className="px-5 py-3 font-medium">Employee</th>
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Grade</th>
                                    <th className="px-5 py-3 font-medium w-48">Base</th>
                                    <th className="px-5 py-3 font-medium w-48">Variable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {!formData.salary_structure || !formData.from_date ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">Please select Salary Structure and From Date.</td></tr>
                                ) : loadingEmployees ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Fetching Eligible Employees...
                                    </td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No eligible employees found for the selected criteria.</td></tr>
                                ) : (
                                    employees.map(row => (
                                        <tr key={row.employee} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-2 text-center">
                                                <Checkbox
                                                    checked={selectedEmployees.has(row.employee)}
                                                    onChange={() => toggleEmployeeSelection(row.employee)}
                                                />
                                            </td>
                                            <td className="px-5 py-2 font-medium text-gray-900">{row.employee}</td>
                                            <td className="px-5 py-2 text-gray-600">{row.employee_name}</td>
                                            <td className="px-5 py-2 text-gray-500">{row.grade || '-'}</td>
                                            <td className="px-5 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 hover:border-gray-300 transition-colors bg-white text-right"
                                                    value={row.base}
                                                    onChange={e => handleEmployeeDataChange(row.employee, 'base', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-5 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400 hover:border-gray-300 transition-colors bg-white text-right"
                                                    value={row.variable}
                                                    onChange={e => handleEmployeeDataChange(row.employee, 'variable', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkSalaryStructureAssignment;
