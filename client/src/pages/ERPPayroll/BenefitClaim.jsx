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

const BenefitClaim = () => {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Master Data
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [earningComponents, setEarningComponents] = useState([]);
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
        claim_date: new Date().toISOString().split('T')[0],
        company: '',
        earning_component: '',
        claimed_amount: 0,
        docstatus: 0,
        status: 'Draft'
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Employee Benefit Claim?fields=["name","employee","employee_name","earning_component","claimed_amount","claim_date","company","docstatus","status"]&limit_page_length=None&order_by=modified desc';

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
            console.error('Fetch benefit claims failed:', err);
            notification.error({ message: 'Failed to load records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [emps, comps, components] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company"]&limit_page_length=None'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Salary Component?fields=["name"]&filters=[["is_flexible_benefit","=","1"]]&limit_page_length=None')
            ]);
            setEmployees(emps.data.data || []);
            setCompanies((comps.data.data || []).map(c => c.name));
            setEarningComponents((components.data.data || []).map(c => c.name));
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
            const res = await API.get(`/api/resource/Employee Benefit Claim/${encodeURIComponent(record.name)}`);
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

    const handleSave = async (submit = false) => {
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.employee) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.claim_date) { notification.warning({ message: 'Claim Date is required' }); return; }
        if (!formData.earning_component) { notification.warning({ message: 'Claim Benefit For is required' }); return; }
        if (!formData.claimed_amount) { notification.warning({ message: 'Claimed Amount is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                employee: formData.employee,
                claim_date: formData.claim_date,
                company: formData.company,
                earning_component: formData.earning_component,
                claimed_amount: parseFloat(formData.claimed_amount) || 0,
                docstatus: submit ? 1 : formData.docstatus
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Benefit Claim/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" ${submit ? 'submitted' : 'updated'} successfully!` });
            } else {
                const res = await API.post('/api/resource/Employee Benefit Claim', payload);
                notification.success({ message: `"${res.data?.data?.name || 'Benefit Claim'}" created successfully!` });
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

    const handleDelete = async () => {
        if (!editingRecord || !window.confirm('Are you sure you want to delete this benefit claim?')) return;
        setSaving(true);
        try {
            await API.delete(`/api/resource/Employee Benefit Claim/${encodeURIComponent(editingRecord.name)}`);
            notification.success({ message: 'Benefit Claim deleted successfully' });
            setView('list');
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.response?.data?.message || err.message });
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
                    <h1 className="text-2xl font-semibold text-gray-800">Benefit Claim</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleNew}>
                            <span>+</span> Add Benefit Claim
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
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Claim Benefit For</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Claim Date</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer text-right hover:bg-gray-100">Claimed Amount</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Employee</th>
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
                                            <p className="text-gray-500 text-base">No Benefit Claims Found</p>
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
                                                <td className="px-4 py-2.5 text-gray-900">{row.earning_component}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.claim_date}</td>
                                                <td className="px-4 py-2.5 text-gray-900 text-right">{formatINR(row.claimed_amount)}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{row.employee}</td>
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
                                {editingRecord ? editingRecord.name : 'New Employee Benefit Claim'}
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

                        {editingRecord && formData.docstatus === 0 && (
                            <button
                                className="px-4 py-2 border border-red-200 text-red-600 bg-white rounded-md text-sm font-medium hover:bg-red-50 transition-colors shadow-sm disabled:opacity-70"
                                onClick={handleDelete}
                                disabled={saving}
                            >
                                Delete
                            </button>
                        )}

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
                                <InputField label="Claim Date" type="date" required value={formData.claim_date} onChange={(v) => setFormData({ ...formData, claim_date: v })} disabled={isSubmitted} />
                                <SelectField label="Company" options={companies} required value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={isSubmitted} />
                            </div>
                        </div>

                        {/* Benefits Section */}
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Benefits</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <SelectField label="Claim Benefit For" options={earningComponents} required value={formData.earning_component} onChange={(v) => setFormData({ ...formData, earning_component: v })} disabled={isSubmitted} />
                                <InputField label="Claimed Amount" type="number" required value={formData.claimed_amount} onChange={(v) => setFormData({ ...formData, claimed_amount: v })} disabled={isSubmitted} />
                            </div>
                        </div>

                        {/* Expense Proof */}
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm mb-4">Expense Proof</h3>
                            <div className="grid grid-cols-2 gap-x-12">
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1">Attachments</label>
                                    <div className="mt-1 flex justify-start">
                                        <button
                                            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded text-xs font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                                            onClick={(e) => { e.preventDefault(); /* mock file input click */ }}
                                            disabled={isSubmitted}
                                        >
                                            Attach
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2">Maximum file size: 5MB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return view === 'list' ? renderList() : renderForm();
};

export default BenefitClaim;
