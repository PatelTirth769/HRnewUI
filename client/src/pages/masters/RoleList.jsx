import React, { useState, useEffect } from 'react';
import { notification, Spin, Button, Space, Popconfirm } from 'antd';
import { FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const RoleList = () => {
    const [view, setView] = useState('list');
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const initialFormState = {
        role_name: '',
        home_page: '',
        route: '',
        restrict_to_domain: '',
        disabled: 0,
        is_custom: 1,
        desk_access: 1,
        two_factor_auth: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchRoles();
        } else {
            if (editingRecord) {
                fetchRoleDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Role?fields=["name","role_name","disabled"]&limit_page_length=None&order_by=modified desc');
            setRoles(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch roles' });
        } finally {
            setLoading(false);
        }
    };

    const fetchRoleDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Role/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch role details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.role_name) {
            notification.warning({ message: 'Validation Error', description: 'Role Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Role/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Role updated successfully.' });
            } else {
                await API.post('/api/resource/Role', payload);
                notification.success({ message: 'Role created successfully.' });
            }
            setView('list');
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.response?.data?.message || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Role/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Role deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-[#f4f5f6] focus:outline-none focus:border-blue-400 disabled:bg-gray-50 transition-colors";
    const labelStyle = "block text-[13px] text-gray-600 mb-1 font-medium";

    if (view === 'list') {
        const filtered = roles.filter(r => (r.role_name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Roles</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchRoles} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition font-bold shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Role
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-4 py-2 text-sm w-full max-w-md shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search by Role Name..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider">Role Name</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="2" className="text-center py-20 text-gray-400 italic font-medium">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="2" className="text-center py-24 text-gray-500 italic font-medium">No Roles found.</td></tr>
                            ) : (
                                filtered.map((r) => (
                                    <tr key={r.name} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingRecord(r.name); setView('form'); }}>
                                        <td className="px-6 py-4">
                                            <span className="text-blue-600 font-bold hover:underline">
                                                {r.role_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${r.disabled ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                {r.disabled ? 'Disabled' : 'Enabled'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => { setView('list'); setEditingRecord(null); }}>
                        <FiChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            {editingRecord || 'New Role'}
                            {editingRecord && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formData.disabled ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                    {formData.disabled ? 'Disabled' : 'Enabled'}
                                </span>
                            )}
                            {!editingRecord && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-orange-50 text-orange-600 font-bold border border-orange-100">Not Saved</span>
                            )}
                        </h1>
                        <nav className="flex text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-1">
                             Role &gt; {editingRecord || 'New'}
                        </nav>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Space.Compact>
                        <Button icon={<FiChevronLeft />} className="h-9 w-9 flex items-center justify-center border-gray-300 hover:bg-gray-50" />
                        <Button icon={<FiChevronRight />} className="h-9 w-9 flex items-center justify-center border-gray-300 hover:bg-gray-50" />
                    </Space.Compact>
                    
                    <Button icon={<FiPrinter />} className="h-9 w-9 flex items-center justify-center border-gray-300 hover:bg-gray-50" />
                    <Button icon={<FiMoreHorizontal />} className="h-9 w-9 flex items-center justify-center border-gray-300 hover:bg-gray-50" />

                    <button className="px-6 py-2 bg-gray-900 text-white rounded text-sm font-black hover:bg-gray-800 transition shadow-lg disabled:opacity-70 flex items-center gap-2 ml-2" onClick={handleSave} disabled={saving}>
                        {saving ? <Spin size="small" /> : 'Save'}
                    </button>

                    {editingRecord && (
                        <Popconfirm title="Delete this role?" onConfirm={handleDelete}>
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-2 bg-white rounded border border-gray-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-10 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-60">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Left Column */}
                        <div className="flex-1 space-y-8">
                            <div>
                                <label className={labelStyle}>Role Name <span className="text-red-400">*</span></label>
                                <input className={inputStyle} value={formData.role_name || ''} onChange={e => setFormData({ ...formData, role_name: e.target.value })} disabled={!!editingRecord} placeholder="e.g. Sales Manager" />
                            </div>
                            <div>
                                <label className={labelStyle}>Home Page</label>
                                <input className={inputStyle} value={formData.home_page || ''} onChange={e => setFormData({ ...formData, home_page: e.target.value })} placeholder="e.g. /app/desktop" />
                            </div>
                            <div>
                                <label className={labelStyle}>Route</label>
                                <input className={inputStyle} value={formData.route || ''} onChange={e => setFormData({ ...formData, route: e.target.value })} placeholder="Example '/app'" />
                            </div>
                            <div>
                                <label className={labelStyle}>Restrict To Domain</label>
                                <input className={inputStyle} value={formData.restrict_to_domain || ''} onChange={e => setFormData({ ...formData, restrict_to_domain: e.target.value })} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex-1 space-y-6 pt-6">
                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100" onClick={() => setFormData({ ...formData, disabled: formData.disabled ? 0 : 1 })}>
                                <input type="checkbox" checked={!!formData.disabled} readOnly className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                                <div>
                                    <div className="text-sm font-bold text-gray-900">Disabled</div>
                                    <div className="text-[11px] text-gray-400">If disabled, this role will be removed from all users.</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100" onClick={() => setFormData({ ...formData, is_custom: formData.is_custom ? 0 : 1 })}>
                                <input type="checkbox" checked={!!formData.is_custom} readOnly className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                                <div className="text-sm font-bold text-gray-900">Is Custom</div>
                            </div>

                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100" onClick={() => setFormData({ ...formData, desk_access: formData.desk_access ? 0 : 1 })}>
                                <input type="checkbox" checked={!!formData.desk_access} readOnly className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                                <div className="text-sm font-bold text-gray-900">Desk Access</div>
                            </div>

                            <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-100" onClick={() => setFormData({ ...formData, two_factor_auth: formData.two_factor_auth ? 0 : 1 })}>
                                <input type="checkbox" checked={!!formData.two_factor_auth} readOnly className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                                <div className="text-sm font-bold text-gray-900">Two Factor Authentication</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default RoleList;
