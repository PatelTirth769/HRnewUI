import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="block text-sm text-gray-500 mb-1">{label} {required && <span className="text-[#E02424]">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const CheckboxLabel = ({ label, checked, onChange, disabled }) => (
    <label className={`flex items-center gap-2 py-1 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
        <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-[#1C1F26] focus:ring-[#1C1F26] focus:ring-offset-0 disabled:bg-gray-100"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            disabled={disabled}
        />
        <span className="text-sm text-gray-700">{label}</span>
    </label>
);

export default function EmployeeGrade() {
    const navigate = useNavigate();
    const location = useLocation();
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [salaryStructures, setSalaryStructures] = useState([]);
    const [otMultiplierOptions, setOtMultiplierOptions] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form State
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);
    const [connectionsOpen, setConnectionsOpen] = useState(true);
    const [connections, setConnections] = useState({ employee: 0, leave_period: 0, employee_onboarding_template: 0, employee_separation_template: 0 });

    const defaultForm = {
        name: '',
        default_salary_structure: '',
        default_base_pay: '',
        is_overtime_paid: 0,
        only_applicable_on_holidays: 0,
        minimum_working_hours: '',
        ot_multiplier: '',
        ot_multiplier_based_on: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // Filter states
    const [searchName, setSearchName] = useState('');
    const [filterStructure, setFilterStructure] = useState('');

    // --- FETCH ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Employee Grade?fields=["name","default_salary_structure","default_base_pay","is_overtime_paid"]&limit_page_length=None&order_by=modified desc';

            let filters = [];
            if (searchName) filters.push(`["name","like","%${searchName}%"]`);
            if (filterStructure) filters.push(`["default_salary_structure","=","${filterStructure}"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Employee Grades' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const ssRes = await API.get('/api/resource/Salary Structure?limit_page_length=None');

            if (ssRes.data?.data) {
                setSalaryStructures(ssRes.data.data.map(s => s.name));
            }

            // Hardcode standard options to avoid permissions/DocField issues
            setOtMultiplierOptions([
                "Gross Pay",
                "Net Pay",
                "Base (Salary Structure Assignment)"
            ]);

            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Employee Grade/${encodeURIComponent(name)}`);
            if (res.data.data) {
                setFormData({ ...defaultForm, ...res.data.data });
            }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    const fetchConnections = async (name) => {
        try {
            const [empRes, leaveRes, onboardRes, sepRes] = await Promise.all([
                API.get(`/api/method/frappe.client.get_count?doctype=Employee&filters={"grade":"${name}"}`).catch(() => ({ data: { message: 0 } })),
                API.get(`/api/method/frappe.client.get_count?doctype=Leave Period&filters={"employee_grade":"${name}"}`).catch(() => ({ data: { message: 0 } })),
                API.get(`/api/method/frappe.client.get_count?doctype=Employee Onboarding Template&filters={"employee_grade":"${name}"}`).catch(() => ({ data: { message: 0 } })),
                API.get(`/api/method/frappe.client.get_count?doctype=Employee Separation Template&filters={"employee_grade":"${name}"}`).catch(() => ({ data: { message: 0 } })),
            ]);
            setConnections({
                employee: empRes?.data?.message || 0,
                leave_period: leaveRes?.data?.message || 0,
                employee_onboarding_template: onboardRes?.data?.message || 0,
                employee_separation_template: sepRes?.data?.message || 0,
            });
        } catch {
            setConnections({ employee: 0, leave_period: 0, employee_onboarding_template: 0, employee_separation_template: 0 });
        }
    };

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    useEffect(() => {
        if (mastersLoaded && location.state) {
            if (location.state.filterStructure && !location.state.openForm) {
                setFilterStructure(location.state.filterStructure);
            }
            if (location.state.openForm) {
                handleNew();
                if (location.state.newRecordWithStructure) {
                    setFormData(prev => ({ ...prev, default_salary_structure: location.state.newRecordWithStructure }));
                }
                navigate(location.pathname, { replace: true, search: location.search });
            }
        }
    }, [mastersLoaded, location.state, navigate]);

    // --- ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setConnections({ employee: 0, leave_period: 0, employee_onboarding_template: 0, employee_separation_template: 0 });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
        fetchConnections(record.name);
    };

    const handleSave = async () => {
        if (!formData.name.trim() && !editingRecord) {
            notification.warning({ message: 'Name is required' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                default_salary_structure: formData.default_salary_structure,
                default_base_pay: formData.default_base_pay ? parseFloat(formData.default_base_pay) : 0,
                is_overtime_paid: formData.is_overtime_paid,
                only_applicable_on_holidays: formData.only_applicable_on_holidays,
                minimum_working_hours: formData.minimum_working_hours ? parseFloat(formData.minimum_working_hours) : 0,
                ot_multiplier: formData.ot_multiplier ? parseFloat(formData.ot_multiplier) : 0,
                ot_multiplier_based_on: formData.ot_multiplier_based_on
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Grade/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Employee Grade', payload);
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
            await API.delete(`/api/resource/Employee Grade/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateField = (f, v) => setFormData(p => ({ ...p, [f]: v }));

    // --- FILTER ---
    const filteredData = data.filter(d => {
        if (searchName && !d.name.toLowerCase().includes(searchName.toLowerCase())) return false;
        if (filterStructure && d.default_salary_structure !== filterStructure) return false;
        return true;
    });

    // --- RENDER ---
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header components */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 relative">
                        <button className="text-gray-500 hover:text-gray-700 text-lg transition-colors p-1" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Employee Grade'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#E02424] font-medium tracking-wide uppercase shadow-sm">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 min-w-[100px] bg-gray-100/80 text-gray-600 text-sm font-medium rounded shadow-sm border border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-colors focus:ring-2 focus:ring-gray-100" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-6 py-2 min-w-[100px] bg-[#1C1F26] text-white text-[14px] font-medium rounded shadow-sm hover:bg-black transition-colors focus:ring-2 focus:ring-gray-800 focus:ring-offset-1 disabled:opacity-50 flex items-center justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* ── Connections section (edit mode only) ── */}
                        {editingRecord && (
                            <div className="mb-6">
                                <button
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4 hover:text-gray-600 transition-colors"
                                    onClick={() => setConnectionsOpen(!connectionsOpen)}>
                                    <span>Connections</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${connectionsOpen ? '' : '-rotate-90'}`}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                {connectionsOpen && (
                                    <div className="flex flex-col gap-3 pb-6 border-b border-gray-100">
                                        <div className="flex gap-12">
                                            {/* Left Column Connections */}
                                            <div className="flex flex-col gap-3 min-w-[200px]">
                                                {/* Employee Connection */}
                                                <div className="flex items-center">
                                                    <div className="flex bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 shadow-sm w-full">
                                                        <div className="px-3 py-1.5 flex-1 border-r border-gray-200">Employee {connections.employee > 0 ? `(${connections.employee})` : ''}</div>
                                                        <button
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center font-medium"
                                                            title="New Employee"
                                                            onClick={() => navigate('/add-employee')}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Leave Period Connection */}
                                                <div className="flex items-center">
                                                    <div className="flex bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 shadow-sm w-full">
                                                        <div className="px-3 py-1.5 flex-1 border-r border-gray-200">Leave Period {connections.leave_period > 0 ? `(${connections.leave_period})` : ''}</div>
                                                        <button
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center font-medium"
                                                            title="New Leave Period"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column Connections */}
                                            <div className="flex flex-col gap-3 min-w-[260px]">
                                                {/* Onboarding Template Connection */}
                                                <div className="flex items-center">
                                                    <div className="flex bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 shadow-sm w-full">
                                                        <div className="px-3 py-1.5 flex-1 border-r border-gray-200">Employee Onboarding Template {connections.employee_onboarding_template > 0 ? `(${connections.employee_onboarding_template})` : ''}</div>
                                                        <button
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center font-medium"
                                                            title="New Employee Onboarding Template"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Separation Template Connection */}
                                                <div className="flex items-center">
                                                    <div className="flex bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 shadow-sm w-full">
                                                        <div className="px-3 py-1.5 flex-1 border-r border-gray-200">Employee Separation Template {connections.employee_separation_template > 0 ? `(${connections.employee_separation_template})` : ''}</div>
                                                        <button
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center font-medium"
                                                            title="New Employee Separation Template"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section 1: Basic Info */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <InputField
                                    label="Name"
                                    value={formData.name}
                                    onChange={(v) => !editingRecord && updateField('name', v)}
                                    required
                                    disabled={!!editingRecord}
                                />
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Default Salary Structure</label>
                                    <select
                                        className="w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none bg-white text-gray-700 shadow-sm transition-colors"
                                        value={formData.default_salary_structure || ''}
                                        onChange={(e) => updateField('default_salary_structure', e.target.value)}
                                    >
                                        <option value="">Select Structure...</option>
                                        {salaryStructures.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <InputField
                                    label="Default Base Pay"
                                    value={formData.default_base_pay}
                                    onChange={(v) => updateField('default_base_pay', v)}
                                    type="number"
                                />
                            </div>
                            <div className="space-y-6">
                                {/* Empty right column for top section as per screenshot */}
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Section 2: Overtime Info */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-4 pt-1">
                                <CheckboxLabel
                                    label="Is Overtime Paid"
                                    checked={formData.is_overtime_paid}
                                    onChange={(v) => updateField('is_overtime_paid', v)}
                                />
                                <CheckboxLabel
                                    label="Only Applicable on Holidays"
                                    checked={formData.only_applicable_on_holidays}
                                    onChange={(v) => updateField('only_applicable_on_holidays', v)}
                                    disabled={!formData.is_overtime_paid}
                                />
                                <div className="pt-2">
                                    <InputField
                                        label="Minimum Working Hours"
                                        value={formData.minimum_working_hours}
                                        onChange={(v) => updateField('minimum_working_hours', v)}
                                        type="number"
                                        disabled={!formData.is_overtime_paid}
                                    />
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                        If set to any number greater than zero, system will calculate OT hours based on the formula:<br />
                                        (Total Approved OT hrs) + Working Hours (based on Payment Days) - Minimum Working Hours
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6 pt-1">
                                <InputField
                                    label="OT Multiplier"
                                    value={formData.ot_multiplier}
                                    onChange={(v) => updateField('ot_multiplier', v)}
                                    type="number"
                                    disabled={!formData.is_overtime_paid}
                                />
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">OT Multiplier Based on</label>
                                    <select
                                        className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none transition-colors shadow-sm ${!formData.is_overtime_paid ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : 'bg-white text-gray-700 focus:border-blue-400'}`}
                                        value={formData.ot_multiplier_based_on || ''}
                                        onChange={(e) => updateField('ot_multiplier_based_on', e.target.value)}
                                        disabled={!formData.is_overtime_paid}
                                    >
                                        <option value="">Select Context...</option>
                                        {otMultiplierOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Employee Grades</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded text-[14px] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors focus:ring-2 focus:ring-gray-100" onClick={fetchData}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-5 py-2 bg-[#1C1F26] text-white rounded text-[14px] font-medium hover:bg-black flex items-center gap-2 shadow-sm transition-colors focus:ring-2 focus:ring-gray-800 focus:ring-offset-1" onClick={handleNew}>
                        + Add Employee Grade
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[240px]">
                        <input
                            type="text"
                            placeholder="Name"
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchData()}
                        />
                    </div>
                    <div className="flex-1 max-w-[240px]">
                        <select
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={filterStructure}
                            onChange={e => setFilterStructure(e.target.value)}
                        >
                            <option value="">Default Salary Structure</option>
                            {salaryStructures.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex-1"></div>

                    <div className="flex gap-2">
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                            onClick={fetchData}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            {searchName || filterStructure ? `Filters ${(searchName ? 1 : 0) + (filterStructure ? 1 : 0)}` : 'Filter'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-3.5 font-medium">Name</th>
                                <th className="px-6 py-3.5 font-medium">Default Salary Structure</th>
                                <th className="px-6 py-3.5 font-medium">Is OT Paid</th>
                                <th className="px-6 py-3.5 font-medium w-32 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No Employee Grades found</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 group transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-gray-900 cursor-pointer" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-6 py-3.5 text-gray-600 truncate max-w-[200px]" title={row.default_salary_structure}>{row.default_salary_structure || '-'}</td>
                                        <td className="px-6 py-3.5">
                                            {row.is_overtime_paid ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                                        </td>
                                        <td className="px-6 py-3.5 flex items-center justify-end h-full gap-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-[#E02424] hover:text-red-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
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
}
