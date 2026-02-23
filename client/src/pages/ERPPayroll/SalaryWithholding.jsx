import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

// Helpers
const getStatusLabel = (doc) => {
    if (doc.status === 'Withheld') return 'Withheld';
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

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false }) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 bg-white shadow-sm'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, options = [], required = false, onChange, disabled = false }) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 bg-white shadow-sm'}`}
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
        >
            <option value=""></option>
            {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const getToday = () => new Date().toISOString().split('T')[0];

const SalaryWithholding = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form states
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        name: '',
        employee: '',
        employee_name: '',
        posting_date: getToday(),
        status: 'Draft',
        company: '',
        payroll_frequency: 'Monthly',
        number_of_withholding_cycles: 1,
        from_date: getToday(),
        to_date: '',
        reason_for_withholding_salary: '',
        date_of_joining: '',
        docstatus: 0,
        cycles: [] // Not always directly editable, managed by server but kept for UI
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // Filter states
    const [searchId, setSearchId] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterEmployeeName, setFilterEmployeeName] = useState('');
    const [filterCompany, setFilterCompany] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Salary Withholding?fields=["name","employee","employee_name","posting_date","company","docstatus","status","from_date"]&limit_page_length=None&order_by=modified desc';

            let filters = [];
            if (searchId) filters.push(`["name","like","%${searchId}%"]`);
            if (filterEmployee) filters.push(`["employee","like","%${filterEmployee}%"]`);
            if (filterEmployeeName) filters.push(`["employee_name","like","%${filterEmployeeName}%"]`);
            if (filterCompany) filters.push(`["company","=","${filterCompany}"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Salary Withholding records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, compRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company","date_of_joining"]&filters={"status":"Active"}&limit_page_length=None'),
                API.get('/api/resource/Company?limit_page_length=None')
            ]);
            if (empRes.data.data) setEmployees(empRes.data.data);
            if (compRes.data.data) setCompanies(compRes.data.data.map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Salary Withholding/${encodeURIComponent(name)}`);
            if (res.data.data) {
                setFormData({
                    ...defaultForm,
                    ...res.data.data,
                    cycles: res.data.data.cycles || []
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

    // --- ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    const handleEmployeeChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        if (emp) {
            setFormData(prev => ({
                ...prev,
                employee: empId,
                employee_name: emp.employee_name,
                company: emp.company || prev.company,
                date_of_joining: emp.date_of_joining || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, employee: empId, employee_name: '', date_of_joining: '' }));
        }
    };

    const handleSave = async (submit = false) => {
        if (!formData.employee) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.from_date) { notification.warning({ message: 'From Date is required' }); return; }
        if (!formData.number_of_withholding_cycles || formData.number_of_withholding_cycles <= 0) { notification.warning({ message: 'Number of Withholding Cycles must be at least 1' }); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                posting_date: formData.posting_date,
                company: formData.company,
                from_date: formData.from_date,
                to_date: formData.to_date,
                number_of_withholding_cycles: parseInt(formData.number_of_withholding_cycles),
                payroll_frequency: formData.payroll_frequency,
                reason_for_withholding_salary: formData.reason_for_withholding_salary,
                docstatus: submit ? 1 : formData.docstatus
            };

            if (editingRecord) {
                await API.put(`/api/resource/Salary Withholding/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" ${submit ? 'submitted' : 'updated'} successfully!` });
            } else {
                const res = await API.post('/api/resource/Salary Withholding', payload);
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

    // --- RENDER VIEWS ---
    const renderList = () => {
        const hasActiveFilters = searchId || filterEmployee || filterEmployeeName || filterCompany;
        const clearFilters = () => { setSearchId(''); setFilterEmployee(''); setFilterEmployeeName(''); setFilterCompany(''); fetchData(); };

        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Salary Withholding</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleNew}>
                            <span>+</span> Add Salary Withholding
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
                            <input
                                type="text"
                                placeholder="Employee Name"
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={filterEmployeeName}
                                onChange={e => setFilterEmployeeName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchData()}
                            />
                        </div>

                        <div className="flex-1"></div> {/* Spacer */}

                        <div className="flex gap-2 shrink-0">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                                onClick={fetchData}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                {hasActiveFilters ? `Filters ${(searchId ? 1 : 0) + (filterEmployee ? 1 : 0) + (filterEmployeeName ? 1 : 0)}` : 'Filter'}
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                                Created On
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden mt-0">
                    <div className="flex flex-wrap gap-4 items-center p-4 border-b border-gray-100">
                        <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                            <option value="">All Companies</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-400 bg-gray-50" disabled>
                            <option value="">Status</option>
                        </select>
                        <select className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-400 bg-gray-50" disabled>
                            <option value="">Payroll Freq...</option>
                        </select>
                        {hasActiveFilters && (
                            <button className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 shrink-0" onClick={clearFilters}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600">
                                <tr>
                                    <th className="px-6 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                                    <th className="px-6 py-3 font-medium">Employee Name</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Company</th>
                                    <th className="px-6 py-3 font-medium">From Date</th>
                                    <th className="px-6 py-3 font-medium">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading records...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No Salary Withholdings found</td></tr>
                                ) : (
                                    data.map((row) => {
                                        const displayStatus = getStatusLabel(row);
                                        const colorClass = getStatusColor(displayStatus);
                                        return (
                                            <tr key={row.name} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleEdit(row)}>
                                                <td className="px-6 py-3 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" /></td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{row.employee_name || row.employee}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs box-border ${colorClass}`}>{displayStatus}</span>
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 truncate max-w-[200px]" title={row.company}>{row.company}</td>
                                                <td className="px-6 py-3 text-gray-600">{row.from_date}</td>
                                                <td className="px-6 py-3 text-gray-500">{row.name}</td>
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
        const colorClass = getStatusColor(displayStatus);

        return (
            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors" title="Back to list">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
                                {editingRecord ? formData.name : 'New Salary Withholding'}
                            </h1>
                            <span className={`px-2.5 py-1 rounded text-xs border ${colorClass} bg-transparent bg-opacity-10`} style={{ borderColor: 'currentColor', opacity: 0.8 }}>
                                {displayStatus === 'Draft' ? 'Not Saved' : displayStatus}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setView('list')} className="px-4 py-2 border border-gray-300 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                            Cancel
                        </button>
                        {!isSubmitted && (
                            <button onClick={() => handleSave(false)} disabled={saving} className="px-5 py-2 bg-gray-900 text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                        {!isSubmitted && editingRecord && (
                            <button onClick={() => handleSave(true)} disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-[14px] font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                                Submit
                            </button>
                        )}
                    </div>
                </div>

                {/* Connections Tab */}
                {editingRecord && (
                    <div className="pt-2 pb-6 space-y-8">
                        <div>
                            <button className="flex items-center text-sm font-semibold text-gray-800 mb-4 hover:text-gray-600">
                                Connections <span className="ml-1 text-[10px]">▲</span>
                            </button>
                            <div className="flex flex-col gap-3 w-56">
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex-1 text-left px-3 py-1.5 bg-gray-50 text-gray-700 text-[13px] rounded-md border border-gray-200 hover:bg-gray-100 flex justify-start items-center gap-2 transition-colors"
                                        onClick={() => navigate(`/erp-payroll/salary-slip?Salary Withholding=${encodeURIComponent(formData.name)}`)}
                                    >
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-500 font-medium">
                                            {/* Dummy count, real counting implies more complex linked doc queries */}
                                            {formData.number_of_withholding_cycles}
                                        </span>
                                        <span>Salary Slip</span>
                                    </button>
                                    <button className="p-1 px-2.5 bg-gray-50 text-gray-500 rounded text-sm hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors">
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-3 gap-x-12 gap-y-6">
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
                                <SelectField label="Company" options={companies} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={isSubmitted} />
                            </div>

                            <div className="space-y-6">
                                <InputField label="Posting Date" type="date" required value={formData.posting_date} onChange={(v) => setFormData({ ...formData, posting_date: v })} disabled={isSubmitted} />
                                {editingRecord && (
                                    <SelectField
                                        label="Payroll Frequency"
                                        options={["Monthly", "Bimonthly", "Fortnightly", "Weekly", "Daily"]}
                                        value={formData.payroll_frequency}
                                        onChange={(v) => setFormData({ ...formData, payroll_frequency: v })}
                                        disabled={isSubmitted}
                                    />
                                )}
                                <InputField type="number" label="Number of Withholding Cycles" required value={formData.number_of_withholding_cycles} onChange={(v) => setFormData({ ...formData, number_of_withholding_cycles: v })} disabled={isSubmitted} />
                            </div>

                            <div className="space-y-6">
                                <InputField label="Status" value={displayStatus} disabled={true} />
                                <InputField label="From Date" type="date" required value={formData.from_date} onChange={(v) => setFormData({ ...formData, from_date: v })} disabled={isSubmitted} />
                                {editingRecord && <InputField label="To Date" type="date" required value={formData.to_date} onChange={(v) => setFormData({ ...formData, to_date: v })} disabled={isSubmitted} />}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div>
                            <button className="flex items-center text-sm font-semibold text-gray-800 mb-4 hover:text-gray-600">
                                Reason <span className="ml-1 text-[10px]">▲</span>
                            </button>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Reason for Withholding Salary</label>
                                <textarea
                                    className={`w-full border border-gray-100 rounded px-3 py-2 text-sm focus:outline-none resize-y min-h-[120px] bg-gray-50 text-gray-700 ${!isSubmitted && 'focus:bg-white focus:border-blue-400 shadow-sm'}`}
                                    value={formData.reason_for_withholding_salary || ''}
                                    onChange={(e) => setFormData({ ...formData, reason_for_withholding_salary: e.target.value })}
                                    disabled={isSubmitted}
                                    placeholder=""
                                />
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {editingRecord && (
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-6 text-sm">Exit Details</h3>
                                <div className="grid grid-cols-2 gap-x-12">
                                    <div className="space-y-6 pr-12">
                                        <InputField label="Date of Joining" type="date" value={formData.date_of_joining} disabled={true} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Subtable: Cycles */}
                {editingRecord && (
                    <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-white border-b border-gray-200 flex justify-between items-center">
                            <span className="font-semibold text-sm text-gray-800">Cycles</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-200 text-[13px]">
                                    <tr>
                                        <th className="px-4 py-2.5 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" disabled /></th>
                                        <th className="px-4 py-2.5 font-medium">No.</th>
                                        <th className="px-4 py-2.5 font-medium text-gray-700">From Date <span className="text-red-400">*</span></th>
                                        <th className="px-4 py-2.5 font-medium text-gray-700">To Date <span className="text-red-400">*</span></th>
                                        <th className="px-4 py-2.5 font-medium text-gray-700">Is Salary Released</th>
                                        <th className="px-4 py-2.5 font-medium text-gray-700">Journal Entry</th>
                                        <th className="px-3 py-2.5 w-10 text-center text-gray-400 font-medium">⚙️</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.cycles && formData.cycles.length > 0 ? (
                                        formData.cycles.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-center text-gray-500"><input type="checkbox" className="rounded border-gray-300 pointer-events-none" /></td>
                                                <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-2 text-gray-900">{row.from_date}</td>
                                                <td className="px-4 py-2 text-gray-900">{row.to_date}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <input type="checkbox" checked={row.is_salary_released === 1} readOnly className="rounded border-gray-300 pointer-events-none" />
                                                </td>
                                                <td className="px-4 py-2 text-blue-600">{row.journal_entry}</td>
                                                <td className="px-3 py-2 text-center text-gray-400 cursor-not-allowed">✏️</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-10 text-center text-gray-400 bg-gray-50/50">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-[13px]">No Data</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        );
    };

    return view === 'list' ? renderList() : renderForm();
};

export default SalaryWithholding;
