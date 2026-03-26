import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import API from '../../services/api';
import { FiTrash2 } from 'react-icons/fi';

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
        case 'Receipted': return 'bg-green-100 text-green-800 font-medium';
        default: return 'bg-gray-100 text-gray-700 font-medium';
    }
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

const CheckboxField = ({ label, checked, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 mt-6 pb-1">
            <input
                type="checkbox"
                className="rounded border-gray-300 w-4 h-4"
                checked={checked || false}
                onChange={(e) => onChange && onChange(e.target.checked)}
                disabled={disabled}
            />
            {label}
        </label>
    </div>
);

const AssetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Master Dropdown Arrays
    const [companies, setCompanies] = useState([]);
    const [items, setItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    const [formData, setFormData] = useState({
        company: '',
        naming_series: '',
        item_code: '',
        location: '',
        asset_owner: '',
        custodian: '',
        is_existing_asset: 0,
        is_composite_asset: 0,
        department: '',
        cost_center: '',
        purchase_receipt: '',
        purchase_invoice: '',
        gross_purchase_amount: 0,
        asset_quantity: 1,
        available_for_use_date: '',
        calculate_depreciation: 0,
        finance_books: [],
        policy_number: '',
        insurer: '',
        insured_value: 0,
        insurance_start_date: '',
        insurance_end_date: '',
        comprehensive_insurance: '',
        maintenance_required: 0,
        status: 'Draft',
        booked_fixed_asset: 0,
    });

    useEffect(() => {
        const load = async () => {
            await fetchMasters();
            if (isEditing) {
                await fetchAsset();
            }
        };
        load();
    }, [id]);

    const fetchMasters = async () => {
        try {
            const [cRes, iRes, lRes, dRes, eRes, ccRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Item?fields=["name"]&filters=[["is_fixed_asset","=",1]]&limit_page_length=None').catch(() => API.get('/api/resource/Item?fields=["name"]&limit_page_length=None')),
                API.get('/api/resource/Location?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setCompanies((cRes.data.data || []).map(d => d.name));
            setItems((iRes.data.data || []).map(d => d.name));
            setLocations((lRes.data.data || []).map(d => d.name));
            setDepartments((dRes.data.data || []).map(d => d.name));
            setEmployees((eRes.data.data || []).map(d => ({ value: d.name, label: `${d.name}: ${d.employee_name}` })));
            setCostCenters((ccRes.data.data || []).map(d => d.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Error fetching defaults:', err);
        }
    };

    const fetchAsset = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/api/resource/Asset/${encodeURIComponent(id)}`);
            const data = response.data.data;
            setFormData({
                ...data,
                finance_books: data.finance_books || [],
            });
        } catch (err) {
            console.error('Error fetching asset:', err);
            notification.error({ message: 'Failed to fetch asset details' });
        } finally {
            setLoading(false);
        }
    };

    const handleFinanceBookChange = (index, field, value) => {
        const updatedBooks = [...formData.finance_books];
        updatedBooks[index][field] = value;
        setFormData({ ...formData, finance_books: updatedBooks });
    };

    const addFinanceBookRow = () => {
        setFormData({
            ...formData,
            finance_books: [
                ...formData.finance_books,
                {
                    finance_book: '',
                    depreciation_method: '',
                    total_number_of_depreciations: 0,
                    frequency_of_depreciation_months: 0,
                    depreciation_posting_date: ''
                }
            ]
        });
    };

    const removeFinanceBookRow = (index) => {
        const updatedBooks = formData.finance_books.filter((_, i) => i !== index);
        setFormData({ ...formData, finance_books: updatedBooks });
    };

    const handleSave = async (submit = false) => {
        if (!formData.company) { notification.warning({ message: 'Company is required' }); return; }
        if (!formData.item_code) { notification.warning({ message: 'Item Code is required' }); return; }
        if (!formData.location) { notification.warning({ message: 'Location is required' }); return; }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                docstatus: submit ? 1 : formData.docstatus || 0
            };

            if (isEditing) {
                await API.put(`/api/resource/Asset/${encodeURIComponent(id)}`, payload);
                notification.success({ message: `Asset updated successfully!` });
            } else {
                await API.post('/api/resource/Asset', payload);
                notification.success({ message: `Asset created successfully!` });
                navigate('/assets/asset');
            }
        } catch (err) {
            console.error('Error saving asset:', err);
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

    if (loading || !mastersLoaded) return <div className="p-6 text-center text-gray-500">Loading Form Resources...</div>;

    const isSubmitted = formData.docstatus === 1 || formData.docstatus === 2;
    const displayStatus = getStatusLabel(formData);
    const statusColor = getStatusColor(displayStatus);

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Header section identical to Payroll modules */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            {isEditing ? id : 'New Asset'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide ${statusColor}`}>
                            {displayStatus}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        onClick={() => navigate('/assets/asset')}
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
                    {isEditing && formData.docstatus === 0 && (
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

            {/* Form Body identical to AddtionalSalary form structure */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-8">
                    
                    {/* Basic Settings */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-6">
                            <SelectField label="Company" options={companies} required value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={isSubmitted} />
                            <SelectField label="Item Code" options={items} required value={formData.item_code} onChange={(v) => setFormData({ ...formData, item_code: v })} disabled={isSubmitted} />
                            <SelectField label="Location" options={locations} required value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} disabled={isSubmitted} />
                            <SelectField label="Asset Owner" options={employees} value={formData.asset_owner} onChange={(v) => setFormData({ ...formData, asset_owner: v })} disabled={isSubmitted} />
                            <CheckboxField label="Is Existing Asset" checked={formData.is_existing_asset === 1} onChange={(v) => setFormData({ ...formData, is_existing_asset: v ? 1 : 0 })} disabled={isSubmitted} />
                        </div>

                        <div className="space-y-6">
                            <InputField label="Naming Series" value={formData.naming_series} onChange={(v) => setFormData({ ...formData, naming_series: v })} disabled={isSubmitted} />
                            <SelectField label="Department" options={departments} value={formData.department} onChange={(v) => setFormData({ ...formData, department: v })} disabled={isSubmitted} />
                            <SelectField label="Custodian" options={employees} value={formData.custodian} onChange={(v) => setFormData({ ...formData, custodian: v })} disabled={isSubmitted} />
                            <CheckboxField label="Is Composite Asset" checked={formData.is_composite_asset === 1} onChange={(v) => setFormData({ ...formData, is_composite_asset: v ? 1 : 0 })} disabled={isSubmitted} />
                        </div>
                    </div>

                    <hr className="border-gray-100" />
                    
                    {/* Accounting Dimensions */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-6 text-sm">Accounting Dimensions</h3>
                        <div className="grid grid-cols-2 gap-x-12">
                            <div className="space-y-6">
                                <SelectField label="Cost Center" options={costCenters} value={formData.cost_center} onChange={(v) => setFormData({ ...formData, cost_center: v })} disabled={isSubmitted} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Purchase Details */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-6 text-sm">Purchase Details</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <InputField label="Purchase Receipt" value={formData.purchase_receipt} onChange={(v) => setFormData({ ...formData, purchase_receipt: v })} disabled={isSubmitted} />
                                <InputField label="Purchase Invoice" value={formData.purchase_invoice} onChange={(v) => setFormData({ ...formData, purchase_invoice: v })} disabled={isSubmitted} />
                                <InputField label="Asset Quantity" type="number" value={formData.asset_quantity} onChange={(v) => setFormData({ ...formData, asset_quantity: parseFloat(v) })} disabled={isSubmitted} />
                            </div>
                            <div className="space-y-6">
                                <InputField label="Gross Purchase Amount" type="number" required value={formData.gross_purchase_amount} onChange={(v) => setFormData({ ...formData, gross_purchase_amount: parseFloat(v) })} disabled={isSubmitted} />
                                <InputField label="Available-for-use Date" type="date" required value={formData.available_for_use_date} onChange={(v) => setFormData({ ...formData, available_for_use_date: v })} disabled={isSubmitted} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Depreciation */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-6 text-sm">Depreciation</h3>
                        <CheckboxField label="Calculate Depreciation" checked={formData.calculate_depreciation === 1} onChange={(v) => setFormData({ ...formData, calculate_depreciation: v ? 1 : 0 })} disabled={isSubmitted} />
                        
                        {formData.calculate_depreciation === 1 && (
                            <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px]">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Finance Book</th>
                                            <th className="px-3 py-2 font-medium">Depreciation Method *</th>
                                            <th className="px-3 py-2 font-medium">Total Depreciations</th>
                                            <th className="px-3 py-2 font-medium">Frequency (Months)</th>
                                            <th className="px-3 py-2 font-medium">Posting Date</th>
                                            <th className="px-3 py-2 w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {formData.finance_books.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-6 text-gray-400 bg-white">No Data</td></tr>
                                        ) : (
                                            formData.finance_books.map((row, index) => (
                                                <tr key={index} className="bg-white">
                                                    <td className="p-2"><input type="text" className="w-full border border-gray-100 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none" value={row.finance_book} onChange={(e) => handleFinanceBookChange(index, 'finance_book', e.target.value)} disabled={isSubmitted} /></td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none bg-white" required value={row.depreciation_method} onChange={(e) => handleFinanceBookChange(index, 'depreciation_method', e.target.value)} disabled={isSubmitted}>
                                                            <option value="">Select</option>
                                                            <option value="Straight Line">Straight Line</option>
                                                            <option value="Double Declining Balance">Double Declining Balance</option>
                                                            <option value="Written Down Value">Written Down Value</option>
                                                            <option value="Manual">Manual</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2"><input type="number" className="w-full border border-gray-100 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none" value={row.total_number_of_depreciations} onChange={(e) => handleFinanceBookChange(index, 'total_number_of_depreciations', Number(e.target.value))} disabled={isSubmitted} /></td>
                                                    <td className="p-2"><input type="number" className="w-full border border-gray-100 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none" value={row.frequency_of_depreciation_months} onChange={(e) => handleFinanceBookChange(index, 'frequency_of_depreciation_months', Number(e.target.value))} disabled={isSubmitted} /></td>
                                                    <td className="p-2"><input type="date" className="w-full border border-gray-100 rounded px-2 py-1 text-sm focus:border-blue-400 outline-none" value={row.depreciation_posting_date} onChange={(e) => handleFinanceBookChange(index, 'depreciation_posting_date', e.target.value)} disabled={isSubmitted} /></td>
                                                    <td className="p-2 text-center">
                                                        {!isSubmitted && (
                                                            <button type="button" onClick={() => removeFinanceBookRow(index)} className="text-gray-400 hover:text-red-500"><FiTrash2 /></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                {!isSubmitted && (
                                    <div className="bg-gray-50 p-2 border-t border-gray-100">
                                        <button type="button" onClick={addFinanceBookRow} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-1 shadow-sm">
                                            <span>+</span> Add Row
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Insurance Details */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-6 text-sm">Insurance Details</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <InputField label="Policy number" value={formData.policy_number} onChange={(v) => setFormData({ ...formData, policy_number: v })} disabled={isSubmitted} />
                                <InputField label="Insurer" value={formData.insurer} onChange={(v) => setFormData({ ...formData, insurer: v })} disabled={isSubmitted} />
                                <InputField label="Insured value" type="number" value={formData.insured_value} onChange={(v) => setFormData({ ...formData, insured_value: parseFloat(v) })} disabled={isSubmitted} />
                            </div>
                            <div className="space-y-6">
                                <InputField label="Insurance Start Date" type="date" value={formData.insurance_start_date} onChange={(v) => setFormData({ ...formData, insurance_start_date: v })} disabled={isSubmitted} />
                                <InputField label="Insurance End Date" type="date" value={formData.insurance_end_date} onChange={(v) => setFormData({ ...formData, insurance_end_date: v })} disabled={isSubmitted} />
                                <InputField label="Comprehensive Insurance" value={formData.comprehensive_insurance} onChange={(v) => setFormData({ ...formData, comprehensive_insurance: v })} disabled={isSubmitted} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Maintenance and Other */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-6 text-sm">Maintenance & Other</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <CheckboxField label="Maintenance Required" checked={formData.maintenance_required === 1} onChange={(v) => setFormData({ ...formData, maintenance_required: v ? 1 : 0 })} disabled={isSubmitted} />
                                <CheckboxField label="Booked Fixed Asset" checked={formData.booked_fixed_asset === 1} onChange={(v) => setFormData({ ...formData, booked_fixed_asset: v ? 1 : 0 })} disabled={isSubmitted} />
                            </div>
                            <div className="space-y-6">
                                <SelectField 
                                    label="Status" 
                                    options={['Draft', 'Submitted', 'Partially Received', 'Receipted', 'In Maintenance', 'Out of Order', 'Scrapped', 'Sold']} 
                                    value={formData.status} 
                                    onChange={(v) => setFormData({ ...formData, status: v })} 
                                    disabled={isSubmitted} 
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AssetForm;
