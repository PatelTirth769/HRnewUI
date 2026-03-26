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

const AssetValueAdjustment = () => {
    const [view, setView] = useState('list');
    const [adjustments, setAdjustments] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [assets, setAssets] = useState([]);
    const [financeBooks, setFinanceBooks] = useState([]);
    const [costCenters, setCostCenters] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        company: '',
        asset: '',
        date: '',
        finance_book: '',
        new_asset_value: 0,
        cost_center: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') fetchAdjustments();
        else fetchMasters();
    }, [view]);

    const fetchAdjustments = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Value Adjustment?fields=["name","company","asset","date","new_asset_value"]&limit_page_length=None');
            setAdjustments(res.data.data || []);
        } catch (err) {
            console.error('Error fetching adjustments', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [cRes, aRes, fbRes, ccRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Asset?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Finance Book?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Cost Center?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setCompanies((cRes.data.data || []).map(d => d.name));
            setAssets((aRes.data.data || []).map(d => d.name));
            setFinanceBooks((fbRes.data.data || []).map(d => d.name));
            setCostCenters((ccRes.data.data || []).map(d => d.name));
        } catch (err) {
            console.error('Error fetching masters', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            company: companies.length === 1 ? companies[0] : '',
            asset: '',
            date: '',
            finance_book: '',
            new_asset_value: 0,
            cost_center: ''
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Value Adjustment/${encodeURIComponent(id)}`);
            setFormData({ ...res.data.data });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            notification.error({ message: 'Failed to fetch adjustment' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Delete ${id}?`)) return;
        try {
            setLoading(true);
            await API.delete(`/api/resource/Asset Value Adjustment/${encodeURIComponent(id)}`);
            notification.success({ message: 'Deleted successfully!' });
            fetchAdjustments();
        } catch (err) {
            notification.error({ message: 'Failed to delete' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.asset || !formData.date) {
            notification.warning({ message: 'Asset and Date are required' });
            return;
        }
        try {
            setSaving(true);
            if (isEditing) {
                await API.put(`/api/resource/Asset Value Adjustment/${encodeURIComponent(editId)}`, formData);
                notification.success({ message: 'Updated successfully!' });
            } else {
                await API.post('/api/resource/Asset Value Adjustment', formData);
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
                            {isEditing ? `Edit: ${editId}` : 'New Asset Value Adjustment'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors" onClick={handleSave} disabled={saving}>
                        {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                    </button>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <SelectField label="Company" options={companies} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={saving} />
                            <InputField label="Date" required type="date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} disabled={saving} />
                            <SelectField label="Asset" required options={assets} value={formData.asset} onChange={(v) => setFormData({ ...formData, asset: v })} disabled={saving} />
                            <SelectField label="Finance Book" options={financeBooks} value={formData.finance_book} onChange={(v) => setFormData({ ...formData, finance_book: v })} disabled={saving} />
                        </div>

                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Value Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <InputField label="New Asset Value" required type="number" value={formData.new_asset_value} onChange={(v) => setFormData({ ...formData, new_asset_value: parseFloat(v) || 0 })} disabled={saving} />
                        </div>

                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Accounting Dimensions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <SelectField label="Cost Center" options={costCenters} value={formData.cost_center} onChange={(v) => setFormData({ ...formData, cost_center: v })} disabled={saving} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Asset Value Adjustments</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchAdjustments}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Adjustment
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
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">New Value</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : adjustments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Asset Value Adjustments Found</p>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.asset}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.date}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.new_asset_value}</td>
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

export default AssetValueAdjustment;
