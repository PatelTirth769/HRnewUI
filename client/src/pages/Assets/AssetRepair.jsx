import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, placeholder = "" }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, options, required = false, onChange, disabled = false }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            className={`w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
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

const TextAreaField = ({ label, value, onChange, disabled = false }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label}</label>
        <textarea
            className={`w-full border border-gray-100 rounded bg-[#f8f8f8] px-3 py-2 text-[13px] min-h-[180px] resize-y focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700 pointer-events-none' : 'focus:border-blue-400 hover:border-gray-300 transition-colors'}`}
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const AssetRepair = () => {
    const [view, setView] = useState('list');
    const [repairs, setRepairs] = useState([]);

    const [assets, setAssets] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [projects, setProjects] = useState([]);
    const [purchaseInvoices, setPurchaseInvoices] = useState([]);

    const seriesList = ['ACC-ASR-.YYYY.-'];

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        asset: '',
        naming_series: 'ACC-ASR-.YYYY.-',
        company: '',
        failure_date: '',
        cost_center: '',
        project: '',
        purchase_invoice: '',
        repair_cost: 0,
        error_description: '',
        actions_performed: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') fetchRepairs();
        else fetchMasters();
    }, [view]);

    const fetchRepairs = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Repair?fields=["name","asset","company","failure_date","repair_cost"]&limit_page_length=None');
            setRepairs(res.data.data || []);
        } catch (err) {
            console.error('Error fetching repairs', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [aRes, cRes, ccRes, pRes, piRes] = await Promise.all([
                API.get('/api/resource/Asset?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Project?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Purchase Invoice?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setAssets((aRes.data.data || []).map(d => d.name));
            setCompanies((cRes.data.data || []).map(d => d.name));
            setCostCenters((ccRes.data.data || []).map(d => d.name));
            setProjects((pRes.data.data || []).map(d => d.name));
            setPurchaseInvoices((piRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching masters', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            asset: '',
            naming_series: 'ACC-ASR-.YYYY.-',
            company: companies.length === 1 ? companies[0] : '',
            failure_date: '',
            cost_center: '',
            project: '',
            purchase_invoice: '',
            repair_cost: 0,
            error_description: '',
            actions_performed: ''
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Repair/${encodeURIComponent(id)}`);
            setFormData({ ...res.data.data });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            notification.error({ message: 'Failed to fetch repair' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Delete ${id}?`)) return;
        try {
            setLoading(true);
            await API.delete(`/api/resource/Asset Repair/${encodeURIComponent(id)}`);
            notification.success({ message: 'Deleted successfully!' });
            fetchRepairs();
        } catch (err) {
            notification.error({ message: 'Failed to delete' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.asset || !formData.failure_date) {
            notification.warning({ message: 'Asset and Failure Date are required' });
            return;
        }
        try {
            setSaving(true);
            if (isEditing) {
                await API.put(`/api/resource/Asset Repair/${encodeURIComponent(editId)}`, formData);
                notification.success({ message: 'Updated successfully!' });
            } else {
                await API.post('/api/resource/Asset Repair', formData);
                notification.success({ message: 'Created successfully!' });
            }
            setView('list');
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const p = JSON.parse(errMsg); errMsg = p.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch {}
            }
            notification.error({ message: 'Failed to save', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 5 });
        } finally {
            setSaving(false);
        }
    };

    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={saving}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit: ${editId}` : 'New Asset Repair'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        {/* Top Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <SelectField label="Asset" required options={assets} value={formData.asset} onChange={(v) => setFormData({ ...formData, asset: v })} disabled={saving} />
                            <SelectField label="Series" required options={seriesList} value={formData.naming_series} onChange={(v) => setFormData({ ...formData, naming_series: v })} disabled={saving || isEditing} />
                            <SelectField label="Company" options={companies} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={saving} />
                        </div>

                        {/* Repair Details */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Repair Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-2">
                            <div>
                                <InputField label="Failure Date" required type="date" value={formData.failure_date} onChange={(v) => setFormData({ ...formData, failure_date: v })} disabled={saving} />
                                <p className="text-[11px] text-gray-400 mt-1 ml-1">Asia/Kolkata</p>
                            </div>
                        </div>

                        {/* Accounting Dimensions */}
                        <hr className="border-gray-100 -mx-8 my-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Accounting Dimensions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <SelectField label="Cost Center" options={costCenters} value={formData.cost_center} onChange={(v) => setFormData({ ...formData, cost_center: v })} disabled={saving} />
                            <SelectField label="Project" options={projects} value={formData.project} onChange={(v) => setFormData({ ...formData, project: v })} disabled={saving} />
                        </div>

                        {/* Accounting Details */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Accounting Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <SelectField label="Purchase Invoice" options={purchaseInvoices} value={formData.purchase_invoice} onChange={(v) => setFormData({ ...formData, purchase_invoice: v })} disabled={saving} />
                            <div>
                                <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Repair Cost</label>
                                <div className="flex items-center border border-gray-100 rounded bg-[#fcfcfc] focus-within:border-blue-400 hover:border-gray-300 transition-colors">
                                    <span className="pl-3 text-[13px] text-gray-500">₹</span>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-2 text-[13px] bg-transparent outline-none"
                                        value={formData.repair_cost}
                                        onChange={(e) => setFormData({ ...formData, repair_cost: parseFloat(e.target.value) || 0 })}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Description</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <TextAreaField label="Error Description" value={formData.error_description} onChange={(v) => setFormData({ ...formData, error_description: v })} disabled={saving} />
                            <TextAreaField label="Actions performed" value={formData.actions_performed} onChange={(v) => setFormData({ ...formData, actions_performed: v })} disabled={saving} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Asset Repairs</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchRepairs}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Repair
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Asset</th>
                                <th className="px-4 py-3 font-medium">Company</th>
                                <th className="px-4 py-3 font-medium">Failure Date</th>
                                <th className="px-4 py-3 font-medium">Repair Cost</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : repairs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Asset Repairs Found</p>
                                    </td>
                                </tr>
                            ) : (
                                repairs.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.asset}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.failure_date}</td>
                                        <td className="px-4 py-2.5 text-gray-600">₹ {row.repair_cost}</td>
                                        <td className="px-4 py-2.5 text-center flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                                            <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => handleEdit(row.name)}><FiEdit2 /></button>
                                            <button className="text-red-500 hover:text-red-700 transition-colors" onClick={() => handleDelete(row.name)}><FiTrash2 /></button>
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

export default AssetRepair;
