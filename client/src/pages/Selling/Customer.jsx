import React, { useState, useEffect } from 'react';
import { notification, Spin, Tabs, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const Customer = () => {
    // Basic standard CRUD state
    const [view, setView] = useState('list');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    
    // Dropdowns
    const [customerGroups, setCustomerGroups] = useState([]);
    const [territories, setTerritories] = useState([]);
    const [companies, setCompanies] = useState([]);

    const initialFormState = {
        customer_name: '',
        customer_type: 'Company',
        customer_group: '',
        territory: '',
        lead_name: '',
        opportunity_name: '',
        prospect_name: '',
        account_manager: '',
        default_currency: '',
        default_price_list: '',
        default_bank_account: '',
        is_internal_customer: 0,
        represents_company: '',
        market_segment: '',
        industry: '',
        website: '',
        language: 'English',
        customer_details: '',
        primary_address: '',
        customer_primary_contact: '',
        tax_id: '',
        tax_category: '',
        tax_withholding_category: '',
        
        // Accounting
        payment_terms: '',
        loyalty_program: '',

        // Sales
        sales_partner: '',
        commission_rate: '',

        // Settings
        allow_sales_invoice_creation_without_sales_order: 0,
        allow_sales_invoice_creation_without_delivery_note: 0,
        is_frozen: 0,
        disabled: 0,

        // Child Tables
        credit_limits: [],
        accounts: [],
        sales_team: [],
        portal_users: []
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchCustomers();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchCustomerDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Customer?fields=["name","customer_name","customer_type","customer_group","territory"]&limit_page_length=None&order_by=modified desc');
            setCustomers(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch customers' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [grpRes, terRes, compRes] = await Promise.all([
                API.get('/api/resource/Customer Group?fields=["name"]'),
                API.get('/api/resource/Territory?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]')
            ]);
            setCustomerGroups(grpRes.data.data || []);
            setTerritories(terRes.data.data || []);
            setCompanies(compRes.data.data || []);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchCustomerDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Customer/${encodeURIComponent(name)}`);
            const data = res.data.data;
            // Ensure arrays exist
            if (!data.credit_limits) data.credit_limits = [];
            if (!data.accounts) data.accounts = [];
            if (!data.sales_team) data.sales_team = [];
            if (!data.portal_users) data.portal_users = [];
            setFormData(data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch customer details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.customer_name || !formData.customer_type) {
            notification.warning({ message: 'Validation Error', description: 'Customer Name and Type are required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Customer/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Customer updated successfully.' });
            } else {
                await API.post('/api/resource/Customer', payload);
                notification.success({ message: 'Customer created successfully.' });
            }
            setView('list');
        } catch (err) {
            const errorMessage = err.response?.data?._server_messages 
                                 ? JSON.parse(err.response.data._server_messages)[0]
                                 : err.message;
            notification.error({ message: 'Save Failed', description: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await API.delete(`/api/resource/Customer/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Customer deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Child Table Management
    const handleAddRow = (tableKey, emptyRow) => {
        setFormData({ ...formData, [tableKey]: [...(formData[tableKey] || []), emptyRow] });
    };
    const handleRemoveRow = (tableKey, index) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr.splice(index, 1);
        setFormData({ ...formData, [tableKey]: newArr });
    };
    const handleRowChange = (tableKey, index, field, value) => {
        const newArr = [...(formData[tableKey] || [])];
        newArr[index] = { ...newArr[index], [field]: value };
        setFormData({ ...formData, [tableKey]: newArr });
    };
    const renderEmptyTable = () => (
        <div className="flex flex-col items-center justify-center p-8 bg-white border border-t-0 rounded-b border-gray-200">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-400">No Data</span>
        </div>
    );
    const thStyle = "px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 whitespace-nowrap text-sm border-t border-gray-100";
    const rowInputStyle = "w-full border-none bg-transparent py-1 text-sm focus:ring-0";

    // UI Styles
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";
    const sectionTitleStyle = "font-semibold text-gray-800 text-sm mb-4 bg-gray-50 p-2 border-b rounded-t text-[13px]";

    if (view === 'list') {
        const filtered = customers.filter(c => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (c.name || '').toLowerCase().includes(q) || (c.customer_name || '').toLowerCase().includes(q);
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchCustomers} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Customer
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Customer Name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{filtered.length} of {customers.length} results</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID / Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Group</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Territory</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No Customers found.</td></tr>
                            ) : (
                                filtered.map((c) => (
                                    <tr key={c.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(c.name); setView('form'); }}>
                                                {c.name}
                                            </button>
                                            <div className="text-[11px] text-gray-400 mt-0.5">{c.customer_name}</div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs">{c.customer_type}</td>
                                        <td className="px-5 py-4 text-gray-600 text-xs">{c.customer_group}</td>
                                        <td className="px-5 py-4 text-gray-600 text-xs">{c.territory}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const tabItems = [
        {
            key: 'details',
            label: 'Details',
            children: (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-[1fr,1fr] gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Customer Name *</label>
                                <input className={inputStyle} value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Customer Type *</label>
                                <select className={inputStyle} value={formData.customer_type} onChange={e => setFormData({ ...formData, customer_type: e.target.value })}>
                                    <option value="Company">Company</option>
                                    <option value="Individual">Individual</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>Customer Group</label>
                                <select className={inputStyle} value={formData.customer_group} onChange={e => setFormData({ ...formData, customer_group: e.target.value })}>
                                    <option value="">Select...</option>
                                    {customerGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>Territory</label>
                                <select className={inputStyle} value={formData.territory} onChange={e => setFormData({ ...formData, territory: e.target.value })}>
                                    <option value="">Select...</option>
                                    {territories.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelStyle}>From Lead</label>
                                <input className={inputStyle} value={formData.lead_name} onChange={e => setFormData({ ...formData, lead_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>From Opportunity</label>
                                <input className={inputStyle} value={formData.opportunity_name} onChange={e => setFormData({ ...formData, opportunity_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>From Prospect</label>
                                <input className={inputStyle} value={formData.prospect_name} onChange={e => setFormData({ ...formData, prospect_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Account Manager</label>
                                <input className={inputStyle} value={formData.account_manager} onChange={e => setFormData({ ...formData, account_manager: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded mt-6">
                        <div className={sectionTitleStyle}>Defaults</div>
                        <div className="p-4 grid grid-cols-2 gap-8">
                            <div>
                                <label className={labelStyle}>Billing Currency</label>
                                <input className={inputStyle} value={formData.default_currency} onChange={e => setFormData({ ...formData, default_currency: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Default Price List</label>
                                <input className={inputStyle} value={formData.default_price_list} onChange={e => setFormData({ ...formData, default_price_list: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Default Company Bank Account</label>
                                <input className={inputStyle} value={formData.default_bank_account} onChange={e => setFormData({ ...formData, default_bank_account: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded mt-6">
                        <div className={sectionTitleStyle}>Internal Customer</div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_internal" checked={!!formData.is_internal_customer} onChange={e => setFormData({ ...formData, is_internal_customer: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="is_internal" className="text-sm font-semibold text-gray-700">Is Internal Customer</label>
                            </div>
                            {!!formData.is_internal_customer && (
                                <div>
                                    <label className={labelStyle}>Represents Company *</label>
                                    <select className={inputStyle} value={formData.represents_company} onChange={e => setFormData({ ...formData, represents_company: e.target.value })}>
                                        <option value="">Select Company...</option>
                                        {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded mt-6 mb-4">
                        <div className={sectionTitleStyle}>More Information</div>
                        <div className="p-4 grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className={labelStyle}>Market Segment</label>
                                    <input className={inputStyle} value={formData.market_segment} onChange={e => setFormData({ ...formData, market_segment: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Industry</label>
                                    <input className={inputStyle} value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Website</label>
                                    <input className={inputStyle} value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Print Language</label>
                                    <input className={inputStyle} value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Customer Details</label>
                                <textarea className={`${inputStyle} h-[240px] resize-none`} value={formData.customer_details} onChange={e => setFormData({ ...formData, customer_details: e.target.value })} placeholder="Additional information regarding the customer."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'address_contact',
            label: 'Address & Contact',
            children: (
                <div className="space-y-4 animate-fade-in">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-2">Primary Address and Contact</h3>
                    <p className="text-[11px] text-gray-500 mb-4">Select, to make the customer searchable with these fields</p>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className={labelStyle}>Customer Primary Address</label>
                            <input className={inputStyle} value={formData.primary_address} onChange={e => setFormData({ ...formData, primary_address: e.target.value })} />
                            <p className="text-[10px] text-gray-400 mt-1">Reselect, if the chosen address is edited after save</p>
                        </div>
                        <div>
                            <label className={labelStyle}>Customer Primary Contact</label>
                            <input className={inputStyle} value={formData.customer_primary_contact} onChange={e => setFormData({ ...formData, customer_primary_contact: e.target.value })} />
                            <p className="text-[10px] text-gray-400 mt-1">Reselect, if the chosen contact is edited after save</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'tax',
            label: 'Tax',
            children: (
                <div className="grid grid-cols-2 gap-8 mt-2 animate-fade-in">
                    <div>
                        <label className={labelStyle}>Tax ID</label>
                        <input className={inputStyle} value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelStyle}>Tax Category</label>
                            <input className={inputStyle} value={formData.tax_category} onChange={e => setFormData({ ...formData, tax_category: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Tax Withholding Category</label>
                            <input className={inputStyle} value={formData.tax_withholding_category} onChange={e => setFormData({ ...formData, tax_withholding_category: e.target.value })} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'accounting',
            label: 'Accounting',
            children: (
                <div className="space-y-6 animate-fade-in mt-2">
                    <h2 className="text-sm font-bold text-gray-800">Credit Limit and Payment Terms</h2>
                    
                    <div>
                        <label className={labelStyle}>Default Payment Terms Template</label>
                        <input className={`${inputStyle} max-w-md`} value={formData.payment_terms} onChange={e => setFormData({ ...formData, payment_terms: e.target.value })} />
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-2">Credit Limit</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Company</th>
                                        <th className={thStyle}>Credit Limit</th>
                                        <th className={thStyle}>Bypass Credit Limit Check at Sales Order</th>
                                        <th className={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.credit_limits.length === 0 ? null : formData.credit_limits.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}>
                                                <select className={rowInputStyle} value={row.company || ''} onChange={(e) => handleRowChange('credit_limits', i, 'company', e.target.value)}>
                                                    <option value="">Select Company</option>
                                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.credit_limit || ''} onChange={(e) => handleRowChange('credit_limits', i, 'credit_limit', e.target.value)} /></td>
                                            <td className={tdStyle}><input type="checkbox" className="ml-2 w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={!!row.bypass_credit_limit_check} onChange={(e) => handleRowChange('credit_limits', i, 'bypass_credit_limit_check', e.target.checked ? 1 : 0)} /></td>
                                            <td className={tdStyle}><button onClick={() => handleRemoveRow('credit_limits', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.credit_limits.length === 0 && renderEmptyTable()}
                        </div>
                        <button onClick={() => handleAddRow('credit_limits', { company: '', credit_limit: 0, bypass_credit_limit_check: 0 })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                            Add Row
                        </button>
                    </div>

                    <div className="h-px bg-gray-200 my-6"></div>
                    
                    <h2 className="text-sm font-bold text-gray-800">Default Accounts</h2>
                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-1">Accounts</label>
                        <p className="text-[11px] text-gray-500 mb-2">Mention if non-standard Receivable account</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Company *</th>
                                        <th className={thStyle}>Default Account</th>
                                        <th className={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.accounts.length === 0 ? null : formData.accounts.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}>
                                                <select className={rowInputStyle} value={row.company || ''} onChange={(e) => handleRowChange('accounts', i, 'company', e.target.value)}>
                                                    <option value="">Select Company</option>
                                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.account || ''} onChange={(e) => handleRowChange('accounts', i, 'account', e.target.value)} /></td>
                                            <td className={tdStyle}><button onClick={() => handleRemoveRow('accounts', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.accounts.length === 0 && renderEmptyTable()}
                        </div>
                        <button onClick={() => handleAddRow('accounts', { company: '', account: '' })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                            Add Row
                        </button>
                    </div>

                    <div className="border rounded mt-6">
                        <div className={sectionTitleStyle}>Loyalty Points</div>
                        <div className="p-4 grid grid-cols-2 gap-8">
                            <div>
                                <label className={labelStyle}>Loyalty Program</label>
                                <input className={inputStyle} value={formData.loyalty_program} onChange={e => setFormData({ ...formData, loyalty_program: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'sales_team',
            label: 'Sales Team',
            children: (
                <div className="space-y-6 animate-fade-in mt-2">
                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-2">Sales Team</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>Sales Person *</th>
                                        <th className={thStyle}>Contribution (%)</th>
                                        <th className={thStyle}>Contribution to Net Total</th>
                                        <th className={thStyle}>Commission Rate</th>
                                        <th className={thStyle}>Incentives</th>
                                        <th className={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.sales_team.length === 0 ? null : formData.sales_team.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.sales_person || ''} onChange={(e) => handleRowChange('sales_team', i, 'sales_person', e.target.value)} /></td>
                                            <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.allocated_percentage || ''} onChange={(e) => handleRowChange('sales_team', i, 'allocated_percentage', e.target.value)} /></td>
                                            <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.allocated_amount || ''} onChange={(e) => handleRowChange('sales_team', i, 'allocated_amount', e.target.value)} /></td>
                                            <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.commission_rate || ''} onChange={(e) => handleRowChange('sales_team', i, 'commission_rate', e.target.value)} /></td>
                                            <td className={tdStyle}><input type="number" className={rowInputStyle} value={row.incentives || ''} onChange={(e) => handleRowChange('sales_team', i, 'incentives', e.target.value)} /></td>
                                            <td className={tdStyle}><button onClick={() => handleRemoveRow('sales_team', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.sales_team.length === 0 && renderEmptyTable()}
                        </div>
                        <button onClick={() => handleAddRow('sales_team', { sales_person: '', allocated_percentage: 0, allocated_amount: 0, commission_rate: 0, incentives: 0 })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                            Add Row
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border rounded p-4 mt-6">
                        <div>
                            <label className={labelStyle}>Sales Partner</label>
                            <input className={inputStyle} value={formData.sales_partner} onChange={e => setFormData({ ...formData, sales_partner: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Commission Rate</label>
                            <input className={inputStyle} value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'settings',
            label: 'Settings',
            children: (
                <div className="mt-2 animate-fade-in border rounded p-6">
                    <div className="grid grid-cols-2 gap-y-6">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="no_sales_order" checked={!!formData.allow_sales_invoice_creation_without_sales_order} onChange={e => setFormData({ ...formData, allow_sales_invoice_creation_without_sales_order: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-[1px]" />
                            <label htmlFor="no_sales_order" className="text-sm font-semibold text-gray-700">Allow Sales Invoice Creation Without Sales Order</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_frozen" checked={!!formData.is_frozen} onChange={e => setFormData({ ...formData, is_frozen: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-[1px]" />
                            <label htmlFor="is_frozen" className="text-sm font-semibold text-gray-700">Is Frozen</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="no_delivery_note" checked={!!formData.allow_sales_invoice_creation_without_delivery_note} onChange={e => setFormData({ ...formData, allow_sales_invoice_creation_without_delivery_note: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-[1px]" />
                            <label htmlFor="no_delivery_note" className="text-sm font-semibold text-gray-700">Allow Sales Invoice Creation Without Delivery Note</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_disabled" checked={!!formData.disabled} onChange={e => setFormData({ ...formData, disabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-[1px]" />
                            <label htmlFor="is_disabled" className="text-sm font-semibold text-gray-700">Disabled</label>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'portal_users',
            label: 'Portal Users',
            children: (
                <div className="space-y-6 animate-fade-in mt-2">
                    <div className="mt-4">
                        <label className="block text-xs text-gray-600 font-semibold mb-2">Customer Portal Users</label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden relative">
                            <table className="w-full">
                                <thead className="bg-[#F8F9FB] border-b border-gray-200">
                                    <tr>
                                        <th className={thStyle}>No.</th>
                                        <th className={thStyle}>User *</th>
                                        <th className={thStyle}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.portal_users.length === 0 ? null : formData.portal_users.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 bg-white">
                                            <td className={tdStyle}>{i + 1}</td>
                                            <td className={tdStyle}><input type="text" className={rowInputStyle} value={row.user || ''} onChange={(e) => handleRowChange('portal_users', i, 'user', e.target.value)} /></td>
                                            <td className={tdStyle}><button onClick={() => handleRemoveRow('portal_users', i)} className="text-red-500 hover:text-red-700 text-xs py-1 px-2 rounded hover:bg-red-50 transition ml-auto block">✕</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.portal_users.length === 0 && renderEmptyTable()}
                        </div>
                        <button onClick={() => handleAddRow('portal_users', { user: '' })} className="mt-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1 px-3 border border-gray-300 rounded shadow-sm transition">
                            Add Row
                        </button>
                    </div>
                </div>
            )
        }
    ];

    const actionMenuItems = [
        { key: 'placeholder1', label: 'Action 1' },
        { key: 'placeholder2', label: 'Action 2' },
    ];

    const viewMenuItems = [
        { key: 'view', label: 'View' },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord ? formData.customer_name || editingRecord : 'New Customer'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${!formData.disabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {!formData.disabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] border-gray-300">
                            View <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
                        <Button className="flex items-center gap-1 h-8 text-[13px] bg-gray-100 border-gray-300 font-medium">
                            Actions <FiChevronDown />
                        </Button>
                    </Dropdown>

                    <Button className="h-8 text-[13px] border-gray-300">Duplicate</Button>

                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                        <Button icon={<FiChevronRight />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    </Space.Compact>

                    <Button icon={<FiPrinter />} className="h-8 w-8 flex items-center justify-center border-gray-300" />
                    <Button icon={<FiMoreHorizontal />} className="h-8 w-8 flex items-center justify-center border-gray-300" />

                    <button className="px-5 py-1.5 bg-gray-900 text-white rounded text-sm font-bold hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                    
                    {editingRecord && (
                        <Popconfirm title="Delete this customer?" onConfirm={handleDelete}>
                            <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Spin size="large" />
                    </div>
                ) : (
                    <Tabs defaultActiveKey="details" items={tabItems} className="custom-customer-tabs" />
                )}
            </div>

            <style>{`
                .custom-customer-tabs .ant-tabs-nav::before {
                    border-bottom: 1px solid #e5e7eb;
                }
                .custom-customer-tabs .ant-tabs-tab {
                    padding: 12px 0;
                    margin: 0 32px 0 0;
                    color: #6b7280;
                }
                .custom-customer-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600;
                }
                .custom-customer-tabs .ant-tabs-ink-bar {
                    background: #111827;
                    height: 2px !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(2px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.15s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Customer;
