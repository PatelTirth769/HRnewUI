import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

// --- Helpers ---
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

const CheckboxField = ({ label, checked, onChange, disabled = false }) => (
    <div className="flex items-center gap-2 mt-6">
        <input
            type="checkbox"
            className={`rounded border-gray-300 text-gray-900 focus:ring-gray-900 ${disabled ? 'bg-gray-100' : ''}`}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
        />
        <label className="text-[13px] text-gray-700">{label}</label>
    </div>
);

const formatINR = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '₹ 0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
};

const TaxExemptionCategories = () => {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Master Data
    const [categories, setCategories] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form Data
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Filters
    const [searchName, setSearchName] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const defaultForm = {
        name: '', // The user sets the name on creation
        tax_exemption_category: '',
        max_exemption_amount: 0,
        is_active: 1
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Employee Tax Exemption Sub Category?fields=["name","tax_exemption_category","max_exemption_amount","is_active"]&limit_page_length=None&order_by=modified desc';

            let filters = [];
            if (searchName) filters.push(`["name","like","%${searchName}%"]`);
            if (filterCategory) filters.push(`["tax_exemption_category","=","${filterCategory}"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch tax exemption sub categories failed:', err);
            notification.error({ message: 'Failed to load records' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [catRes] = await Promise.all([
                API.get('/api/resource/Employee Tax Exemption Category?fields=["name"]&limit_page_length=None')
            ]);
            setCategories((catRes.data.data || []).map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Error fetching masters:', err);
            // If the category doctype doesn't exist or errors, provide some fallbacks just in case
            if (categories.length === 0) {
                setCategories(['House Rent Allowance', 'Leave Travel Allowance', '80C', '80D']);
            }
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
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Tax Exemption Sub Category/${encodeURIComponent(record.name)}`);
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

    const handleSave = async () => {
        if (!editingRecord && !formData.name) { notification.warning({ message: 'Name is required' }); return; }
        if (!formData.tax_exemption_category) { notification.warning({ message: 'Tax Exemption Category is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                name: formData.name, // Will be ignored on PUT by frappe usually, but needed for POST
                tax_exemption_category: formData.tax_exemption_category,
                max_exemption_amount: parseFloat(formData.max_exemption_amount) || 0,
                is_active: formData.is_active
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Tax Exemption Sub Category/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Employee Tax Exemption Sub Category', payload);
                notification.success({ message: `"${res.data?.data?.name || formData.name}" created successfully!` });
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
        if (!editingRecord) return;
        if (!window.confirm(`Are you sure you want to delete ${editingRecord.name}?`)) return;

        setDeleting(true);
        try {
            await API.delete(`/api/resource/Employee Tax Exemption Sub Category/${encodeURIComponent(editingRecord.name)}`);
            notification.success({ message: 'Deleted successfully' });
            setView('list');
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: 'Delete failed', description: err.response?.data?.message || err.message });
        } finally {
            setDeleting(false);
        }
    };


    // --- Views ---
    const renderList = () => {
        const hasActiveFilters = searchName || filterCategory;
        const clearFilters = () => { setSearchName(''); setFilterCategory(''); fetchData(); };

        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Employee Tax Exemption Sub Category</h1>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2" onClick={fetchData}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm" onClick={handleNew}>
                            <span>+</span> Add Sub Category
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[250px]">
                            <input
                                type="text"
                                placeholder="Name"
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchData()}
                            />
                        </div>
                        <div className="flex-1 max-w-[250px]">
                            <input
                                type="text"
                                placeholder="Tax Exemption Category"
                                className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchData()}
                            />
                        </div>

                        <div className="flex-1"></div>

                        <div className="flex gap-2 shrink-0">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                                onClick={fetchData}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                {hasActiveFilters ? `Filters ${(searchName ? 1 : 0) + (filterCategory ? 1 : 0)}` : 'Filter'}
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
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Name</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Tax Exemption Category</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Max Exemption Amount</th>
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12">
                                            <div className="text-gray-400 mb-2">
                                                <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                            </div>
                                            <p className="text-gray-500 text-base">No Sub Categories Found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => (
                                        <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row)}>
                                            <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded border-gray-300" /></td>
                                            <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.tax_exemption_category}</td>
                                            <td className="px-4 py-2.5 text-gray-900">{formatINR(row.max_exemption_amount)}</td>
                                            <td className="px-4 py-2.5 text-gray-600">{row.is_active ? 'Yes' : 'No'}</td>
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

    const renderForm = () => {
        return (
            <div className="p-6 max-w-7xl mx-auto font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                {editingRecord ? editingRecord.name : 'New Employee Tax Exemption Sub Category'}
                            </span>
                            {!editingRecord && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Not Saved</span>}
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

                        {editingRecord && (
                            <button
                                className="p-2 border border-red-200 bg-white text-red-600 rounded-md hover:bg-red-50 transition-colors shadow-sm disabled:opacity-70"
                                onClick={handleDelete}
                                disabled={deleting}
                                title="Delete"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
                        <button
                            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-x-12">
                            <div className="space-y-6">
                                <InputField
                                    label="Name"
                                    required
                                    value={formData.name}
                                    onChange={(v) => setFormData({ ...formData, name: v })}
                                    disabled={!!editingRecord}
                                />
                                <SelectField
                                    label="Tax Exemption Category"
                                    options={categories}
                                    required
                                    value={formData.tax_exemption_category}
                                    onChange={(v) => setFormData({ ...formData, tax_exemption_category: v })}
                                />
                                <InputField
                                    label="Max Exemption Amount"
                                    type="number"
                                    value={formData.max_exemption_amount}
                                    onChange={(v) => setFormData({ ...formData, max_exemption_amount: v })}
                                />
                                <CheckboxField
                                    label="Is Active"
                                    checked={formData.is_active === 1}
                                    onChange={(v) => setFormData({ ...formData, is_active: v ? 1 : 0 })}
                                />
                            </div>
                            <div>
                                {/* Right side intentionally blank to match screenshot layout which only has one column of fields */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return view === 'list' ? renderList() : renderForm();
};

export default TaxExemptionCategories;
