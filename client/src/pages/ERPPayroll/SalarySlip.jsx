import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api'; // Adjust path depending on location

// Helper for status colors
const getStatusLabel = (doc) => {
    if (doc.docstatus === 1) return 'Submitted';
    if (doc.docstatus === 2) return 'Cancelled';
    return doc.status || 'Draft';
};

const getStatusColor = (status) => {
    if (status === 'Submitted') return 'bg-blue-50 text-blue-600';
    if (status === 'Cancelled') return 'bg-red-50 text-red-600';
    if (status === 'Withheld') return 'bg-yellow-50 text-yellow-600';
    return 'bg-orange-50 text-orange-600';
};

const SalarySlip = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [formTab, setFormTab] = useState('details');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [components, setComponents] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form states
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        name: '',
        employee: '',
        employee_name: '',
        posting_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        company: '',
        letter_head: '',
        payroll_frequency: '',
        start_date: '',
        end_date: '',
        salary_slip_based_on_timesheet: 0,
        deduct_tax_for_unclaimed_employee_benefits: 0,
        deduct_tax_for_unsubmitted_tax_exemption_proof: 0,
        total_working_days: '',
        payment_days: '',
        leave_without_pay: '',
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

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(
                '/api/resource/Salary Slip?fields=["name","employee","employee_name","posting_date","company","docstatus","status"]&limit_page_length=None&order_by=modified desc'
            );
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
            const [empRes, compRes, compnRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company"]&filters={"status":"Active"}&limit_page_length=None'),
                API.get('/api/resource/Company?limit_page_length=None'),
                API.get('/api/resource/Salary Component?limit_page_length=None')
            ]);
            if (empRes.data.data) setEmployees(empRes.data.data);
            if (compRes.data.data) setCompanies(compRes.data.data.map(c => c.name));
            if (compnRes.data.data) setComponents(compnRes.data.data.map(c => c.name));
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

    // --- FILTERING ---
    const filteredData = data.filter(d => {
        if (searchId && !d.name.toLowerCase().includes(searchId.toLowerCase())) return false;
        if (filterEmployee && !d.employee?.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
        if (filterEmployeeName && !d.employee_name?.toLowerCase().includes(filterEmployeeName.toLowerCase())) return false;
        if (filterCompany && !d.company?.toLowerCase().includes(filterCompany.toLowerCase())) return false;
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
            { id: 'bank', label: 'Bank Details' },
            { id: 'ot', label: 'OT' }
        ];

        return (
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header matching SalaryComponent standard */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-700 text-lg" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {editingRecord ? editingRecord.name : 'New Salary Slip'}
                        </h1>
                        {editingRecord
                            ? <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(getStatusLabel(editingRecord))}`}>{getStatusLabel(editingRecord)}</span>
                            : <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">Not Saved</span>}
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

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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

                    <div className="p-6">
                        {formTab === 'details' && (
                            <div className="space-y-8">
                                {/* Employee Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Employee Info</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Employee <span className="text-red-500">*</span></label>
                                            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-orange-50/50"
                                                value={formData.employee} onChange={(e) => handleEmployeeChange(e.target.value)} disabled={!!editingRecord}>
                                                <option value="">Select Employee...</option>
                                                {employees.map(e => <option key={e.name} value={e.name}>{e.name} - {e.employee_name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Posting Date <span className="text-red-500">*</span></label>
                                            <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-orange-50/50"
                                                value={formData.posting_date} onChange={(e) => updateField('posting_date', e.target.value)} disabled={!!editingRecord} />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Status</label>
                                            <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500" value={getStatusLabel(formData)} readOnly />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Company <span className="text-red-500">*</span></label>
                                            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                value={formData.company} onChange={(e) => updateField('company', e.target.value)} disabled={!!editingRecord}>
                                                <option value="">Select Company...</option>
                                                {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Letter Head</label>
                                            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                value={formData.letter_head} onChange={(e) => updateField('letter_head', e.target.value)} disabled={!!editingRecord} />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                {/* Payroll Info */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Payroll Info</h3>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Payroll Frequency</label>
                                                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50/50"
                                                    value={formData.payroll_frequency} onChange={(e) => updateField('payroll_frequency', e.target.value)} disabled={!!editingRecord}>
                                                    <option value="">Select...</option>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Fortnightly">Fortnightly</option>
                                                    <option value="Weekly">Weekly</option>
                                                    <option value="Daily">Daily</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                                <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50/50"
                                                    value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} disabled={!!editingRecord} />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                                <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-gray-50/50"
                                                    value={formData.end_date} onChange={(e) => updateField('end_date', e.target.value)} disabled={!!editingRecord} />
                                            </div>
                                        </div>
                                        <div className="space-y-4 content-center">
                                            <CheckboxLabel field="salary_slip_based_on_timesheet" label="Salary Slip Based on Timesheet" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                <div className="space-y-2">
                                    <CheckboxLabel field="deduct_tax_for_unclaimed_employee_benefits" label="Deduct Tax For Unclaimed Employee Benefits" />
                                    <CheckboxLabel field="deduct_tax_for_unsubmitted_tax_exemption_proof" label="Deduct Tax For Unsubmitted Tax Exemption Proof" />
                                </div>
                            </div>
                        )}

                        {formTab === 'payment' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Total Working Days</label>
                                        <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.total_working_days} onChange={(e) => updateField('total_working_days', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Payment Days</label>
                                        <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.payment_days} onChange={(e) => updateField('payment_days', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Leave Without Pay</label>
                                        <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.leave_without_pay} onChange={(e) => updateField('leave_without_pay', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formTab === 'earnings_deductions' && (
                            <div className="grid grid-cols-2 gap-6">
                                {/* Earnings Grid */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                        <h4 className="text-sm font-medium text-gray-700">Earnings</h4>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-left text-sm text-gray-600">
                                            <thead className="bg-gray-50 text-gray-500 border-b">
                                                <tr>
                                                    <th className="font-normal px-4 py-2">Component *</th>
                                                    <th className="font-normal px-4 py-2 text-right">Amount</th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {formData.earnings.length === 0 ? (
                                                    <tr><td colSpan="3" className="py-8 text-center text-gray-400">No Data</td></tr>
                                                ) : formData.earnings.map((r, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="p-2">
                                                            <select className="w-full border-0 bg-transparent py-1 px-2 focus:ring-0 text-gray-800"
                                                                value={r.salary_component} onChange={(e) => updateEarnRow(i, 'salary_component', e.target.value)} disabled={!!editingRecord}>
                                                                <option value="">Select...</option>
                                                                {components.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="number" className="w-full border-0 bg-transparent py-1 px-2 text-right focus:ring-0 text-gray-800"
                                                                value={r.amount} onChange={(e) => updateEarnRow(i, 'amount', e.target.value)} disabled={!!editingRecord} />
                                                        </td>
                                                        <td className="p-2 text-center">
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
                                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                        <h4 className="text-sm font-medium text-gray-700">Deductions</h4>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-left text-sm text-gray-600">
                                            <thead className="bg-gray-50 text-gray-500 border-b">
                                                <tr>
                                                    <th className="font-normal px-4 py-2">Component *</th>
                                                    <th className="font-normal px-4 py-2 text-right">Amount</th>
                                                    <th className="w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {formData.deductions.length === 0 ? (
                                                    <tr><td colSpan="3" className="py-8 text-center text-gray-400">No Data</td></tr>
                                                ) : formData.deductions.map((r, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="p-2">
                                                            <select className="w-full border-0 bg-transparent py-1 px-2 focus:ring-0 text-gray-800"
                                                                value={r.salary_component} onChange={(e) => updateDedRow(i, 'salary_component', e.target.value)} disabled={!!editingRecord}>
                                                                <option value="">Select...</option>
                                                                {components.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="p-2">
                                                            <input type="number" className="w-full border-0 bg-transparent py-1 px-2 text-right focus:ring-0 text-gray-800"
                                                                value={r.amount} onChange={(e) => updateDedRow(i, 'amount', e.target.value)} disabled={!!editingRecord} />
                                                        </td>
                                                        <td className="p-2 text-center">
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
                        )}

                        {formTab === 'bank' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Journal Entry</label>
                                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.journal_entry} onChange={(e) => updateField('journal_entry', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
                                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.bank_name} onChange={(e) => updateField('bank_name', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Bank Account No</label>
                                        <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                            value={formData.bank_account_no} onChange={(e) => updateField('bank_account_no', e.target.value)} disabled={!!editingRecord} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formTab === 'ot' && (
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">OT Hours</label>
                                    <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        value={formData.ot_hours} onChange={(e) => updateField('ot_hours', e.target.value)} disabled={!!editingRecord} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">OT Rate</label>
                                    <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                        value={formData.ot_rate} onChange={(e) => updateField('ot_rate', e.target.value)} disabled={!!editingRecord} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-3 flex-1">
                        <input type="text" placeholder="ID" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                        <input type="text" placeholder="Employee" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} />
                        <input type="text" placeholder="Employee Name" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterEmployeeName} onChange={(e) => setFilterEmployeeName(e.target.value)} />
                        <input type="text" placeholder="Company" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} />
                        <input type="text" placeholder="Department" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} />
                        <input type="text" placeholder="Branch" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} />
                        <input type="text" placeholder="Salary Structure" className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-blue-400 bg-gray-50"
                            value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)} />
                    </div>
                    {hasActiveFilters && (
                        <button className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 shrink-0" onClick={clearFilters}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                                <th className="px-6 py-3 w-20"></th>
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
                                            <span className={`px-2 py-0.5 rounded text-xs inline-block ${getStatusColor(getStatusLabel(row))}`}>
                                                {getStatusLabel(row)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <a href="#" className="text-blue-600 hover:underline">{row.employee}</a>
                                        </td>
                                        <td className="px-6 py-3 max-w-[200px] truncate text-gray-500" title={row.company}>{row.company}</td>
                                        <td className="px-6 py-3 text-gray-500">{row.posting_date}</td>
                                        <td className="px-6 py-3 text-gray-500 text-xs">{row.name}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" onClick={() => handleDelete(row)} title="Delete">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
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

export default SalarySlip;
