import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification, Spin } from 'antd';
import API from '../../services/api';

const emptyForm = () => ({
    tax_type: 'Sales',
    sales_tax_template: '',
    purchase_tax_template: '',
    use_for_shopping_cart: 0,
    customer: '',
    customer_group: '',
    item: '',
    item_group: '',
    billing_city: '',
    shipping_city: '',
    billing_county: '',
    shipping_county: '',
    billing_state: '',
    shipping_state: '',
    billing_zipcode: '',
    shipping_zipcode: '',
    billing_country: 'India',
    shipping_country: 'India',
    tax_category: '',
    from_date: '',
    to_date: '',
    priority: 1,
    company: 'Preeshee Consultancy Services',
});

const TaxRule = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form, setForm] = useState(emptyForm());

    // Options
    const [salesTemplates, setSalesTemplates] = useState([]);
    const [purchaseTemplates, setPurchaseTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerGroups, setCustomerGroups] = useState([]);
    const [items, setItems] = useState([]);
    const [itemGroups, setItemGroups] = useState([]);
    const [taxCategories, setTaxCategories] = useState([]);
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (view === 'list') {
            fetchRules();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchRule(editingRecord);
            } else {
                setForm(emptyForm());
            }
        }
    }, [view, editingRecord]);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Tax Rule?fields=["name","tax_type","sales_tax_template","purchase_tax_template","priority","company"]');
            setRules(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch tax rules' });
        } finally {
            setLoading(false);
        }
    };

    const fetchRule = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Tax Rule/${encodeURIComponent(name)}`);
            setForm(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch rule details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [salesRes, purchRes, custRes, cgRes, itemRes, igRes, catRes, compRes] = await Promise.all([
                API.get('/api/resource/Sales Taxes and Charges Template?fields=["name"]'),
                API.get('/api/resource/Purchase Taxes and Charges Template?fields=["name"]'),
                API.get('/api/resource/Customer?fields=["name"]'),
                API.get('/api/resource/Customer Group?fields=["name"]'),
                API.get('/api/resource/Item?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Item Group?fields=["name"]'),
                API.get('/api/resource/Tax Category?fields=["name"]'),
                API.get('/api/resource/Company?fields=["name"]'),
            ]);
            setSalesTemplates((salesRes.data.data || []).map(d => d.name));
            setPurchaseTemplates((purchRes.data.data || []).map(d => d.name));
            setCustomers((custRes.data.data || []).map(d => d.name));
            setCustomerGroups((cgRes.data.data || []).map(d => d.name));
            setItems((itemRes.data.data || []).map(d => d.name));
            setItemGroups((igRes.data.data || []).map(d => d.name));
            setTaxCategories((catRes.data.data || []).map(d => d.name));
            setCompanies((compRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingRecord) {
                await API.put(`/api/resource/Tax Rule/${encodeURIComponent(editingRecord)}`, form);
                notification.success({ message: 'Tax Rule updated' });
            } else {
                await API.post('/api/resource/Tax Rule', form);
                notification.success({ message: 'Tax Rule created' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Error', description: err.response?.data?._server_messages || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await API.delete(`/api/resource/Tax Rule/${encodeURIComponent(name)}`);
            notification.success({ message: 'Tax Rule deleted' });
            fetchRules();
        } catch (err) {
            notification.error({ message: 'Error', description: 'Delete failed' });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all";
    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";
    const sectionTitle = "text-[14px] font-black text-gray-800 mb-6 border-b border-gray-100 pb-2 uppercase tracking-widest";

    if (view === 'list') {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 border border-blue-100 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition shadow-sm font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tighter">Tax Rules</h1>
                    </div>
                    <button className="px-5 py-2.5 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100 uppercase tracking-widest text-[11px]" onClick={() => { setEditingRecord(null); setView('form'); }}>
                        + Add Tax Rule
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-50 overflow-hidden shadow-2xl shadow-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-[#FAFBFC] border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Applied Template</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Priority</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-20 italic text-gray-300 font-medium tracking-tight flex-col items-center gap-4"><Spin /></td></tr>
                            ) : rules.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-24 text-gray-400 font-bold italic tracking-tight uppercase text-[12px]">No tax rules found</td></tr>
                            ) : rules.map(rule => (
                                <tr key={rule.name} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border ${rule.tax_type === 'Sales' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                            {rule.tax_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => { setEditingRecord(rule.name); setView('form'); }} className="text-gray-800 font-black hover:text-blue-600 transition-colors leading-tight block truncate max-w-xs">
                                            {rule.sales_tax_template || rule.purchase_tax_template || rule.name}
                                        </button>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{rule.company}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-gray-500">
                                        {rule.priority}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(rule.name)} className="text-gray-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50" title="Delete Rule">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingRecord ? editingRecord : 'New Tax Rule'}
                    </h2>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-black border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="px-5 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition font-bold text-xs uppercase tracking-widest shadow-sm" onClick={() => setView('list')}>Cancel</button>
                    <button className="px-8 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Main Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className={labelStyle}>Tax Type</label>
                            <select className={inputStyle} value={form.tax_type} onChange={e => setForm({ ...form, tax_type: e.target.value })}>
                                <option value="Sales">Sales</option>
                                <option value="Purchase">Purchase</option>
                            </select>
                        </div>
                        <div>
                            {form.tax_type === 'Sales' ? (
                                <>
                                    <label className={labelStyle}>Sales Tax Template</label>
                                    <select className={inputStyle} value={form.sales_tax_template} onChange={e => setForm({ ...form, sales_tax_template: e.target.value })}>
                                        <option value="">Select Template...</option>
                                        {salesTemplates.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </>
                            ) : (
                                <>
                                    <label className={labelStyle}>Purchase Tax Template</label>
                                    <select className={inputStyle} value={form.purchase_tax_template} onChange={e => setForm({ ...form, purchase_tax_template: e.target.value })}>
                                        <option value="">Select Template...</option>
                                        {purchaseTemplates.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 text-[13px] group p-3 bg-gray-50/50 rounded-lg border border-gray-100/50 w-fit hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer" checked={!!form.use_for_shopping_cart} onChange={e => setForm({ ...form, use_for_shopping_cart: e.target.checked ? 1 : 0 })} />
                            <span className="group-hover:text-blue-600 transition-colors">Use for Shopping Cart</span>
                        </label>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm transition-all hover:shadow-md">
                    <h3 className={sectionTitle}>Filters</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <label className={labelStyle}>Customer</label>
                            <select className={inputStyle} value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                                <option value="">Select Customer...</option>
                                {customers.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Customer Group</label>
                            <select className={inputStyle} value={form.customer_group} onChange={e => setForm({ ...form, customer_group: e.target.value })}>
                                <option value="">Select Group...</option>
                                {customerGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Item</label>
                            <select className={inputStyle} value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}>
                                <option value="">Select Item...</option>
                                {items.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Item Group</label>
                            <select className={inputStyle} value={form.item_group} onChange={e => setForm({ ...form, item_group: e.target.value })}>
                                <option value="">Select Group...</option>
                                {itemGroups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Address Components */}
                        <div className="col-span-1 pt-6 border-t border-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-tighter">Billing Details</div>
                        <div className="col-span-1 pt-6 border-t border-gray-50 text-gray-400 font-bold text-[10px] uppercase tracking-tighter">Shipping Details</div>

                        <div>
                            <label className={labelStyle}>Billing City</label>
                            <input className={inputStyle} value={form.billing_city} onChange={e => setForm({ ...form, billing_city: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Shipping City</label>
                            <input className={inputStyle} value={form.shipping_city} onChange={e => setForm({ ...form, shipping_city: e.target.value })} />
                        </div>

                        <div>
                            <label className={labelStyle}>Billing County</label>
                            <input className={inputStyle} value={form.billing_county} onChange={e => setForm({ ...form, billing_county: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Shipping County</label>
                            <input className={inputStyle} value={form.shipping_county} onChange={e => setForm({ ...form, shipping_county: e.target.value })} />
                        </div>

                        <div>
                            <label className={labelStyle}>Billing State</label>
                            <input className={inputStyle} value={form.billing_state} onChange={e => setForm({ ...form, billing_state: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Shipping State</label>
                            <input className={inputStyle} value={form.shipping_state} onChange={e => setForm({ ...form, shipping_state: e.target.value })} />
                        </div>

                        <div>
                            <label className={labelStyle}>Billing Zipcode</label>
                            <input className={inputStyle} value={form.billing_zipcode} onChange={e => setForm({ ...form, billing_zipcode: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Shipping Zipcode</label>
                            <input className={inputStyle} value={form.shipping_zipcode} onChange={e => setForm({ ...form, shipping_zipcode: e.target.value })} />
                        </div>
                        
                        <div>
                            <label className={labelStyle}>Billing Country</label>
                            <input className={inputStyle} value={form.billing_country} onChange={e => setForm({ ...form, billing_country: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Shipping Country</label>
                            <input className={inputStyle} value={form.shipping_country} onChange={e => setForm({ ...form, shipping_country: e.target.value })} />
                        </div>

                        <div className="col-span-2 pt-6 border-t border-gray-50">
                            <label className={labelStyle}>Tax Category</label>
                            <select className={inputStyle} value={form.tax_category} onChange={e => setForm({ ...form, tax_category: e.target.value })}>
                                <option value="">Select Category...</option>
                                {taxCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Validity Section */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-[16px] font-black text-gray-800 mb-8 uppercase tracking-[0.2em] border-b border-gray-100 pb-4">Validity</h3>
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <label className={labelStyle}>From Date</label>
                            <input type="date" className={inputStyle} value={form.from_date || ''} onChange={e => setForm({ ...form, from_date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>To Date</label>
                            <input type="date" className={inputStyle} value={form.to_date || ''} onChange={e => setForm({ ...form, to_date: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Priority & Company Footer */}
                <div className="bg-[#111827] rounded-xl p-10 flex gap-8 items-end shadow-xl">
                    <div className="flex-[3]">
                        <label className={labelStyle}>Company</label>
                        <select 
                            className={inputStyle}
                            value={form.company} 
                            onChange={e => setForm({ ...form, company: e.target.value })}
                        >
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className={labelStyle}>Priority</label>
                        <input 
                            type="number" 
                            className={inputStyle}
                            value={form.priority} 
                            onChange={e => setForm({ ...form, priority: Number(e.target.value) })} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxRule;
