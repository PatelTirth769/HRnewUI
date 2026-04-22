import React, { useState, useEffect } from 'react';
import { notification, Spin, Button, Space, Popconfirm } from 'antd';
import { FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal } from 'react-icons/fi';
import API from '../../services/api';

const RoleProfileList = () => {
    const [view, setView] = useState('list');
    const [profiles, setProfiles] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');

    const initialFormState = {
        role_profile: '',
        roles: []
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchProfiles();
        } else {
            fetchAllRoles();
            if (editingRecord) {
                fetchProfileDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchProfiles = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Role Profile?fields=["name"]&limit_page_length=None&order_by=modified desc');
            setProfiles(res.data.data || []);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch role profiles' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllRoles = async () => {
        try {
            const res = await API.get('/api/resource/Role?fields=["name"]&limit_page_length=None&order_by=name asc');
            setAllRoles((res.data.data || []).map(r => r.name));
        } catch (err) {
            console.error('Error fetching roles:', err);
        }
    };

    const fetchProfileDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Role Profile/${encodeURIComponent(name)}`);
            setFormData(res.data.data);
        } catch (err) {
            notification.error({ message: 'Error', description: 'Failed to fetch profile details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.role_profile) {
            notification.warning({ message: 'Validation Error', description: 'Role Profile Name is required.' });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/Role Profile/${encodeURIComponent(editingRecord)}`, payload);
                notification.success({ message: 'Role Profile updated successfully.' });
            } else {
                await API.post('/api/resource/Role Profile', payload);
                notification.success({ message: 'Role Profile created successfully.' });
            }
            setView('list');
        } catch (err) {
            console.error('Save error details:', err.response?.data);
            notification.error({ 
                message: 'Save Failed', 
                description: err.response?.data?.message || err.response?.data?.exception || err.message,
                duration: 10
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/api/resource/Role Profile/${encodeURIComponent(editingRecord)}`);
            notification.success({ message: 'Role Profile deleted.' });
            setView('list');
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const toggleRole = (role) => {
        const currentRoles = formData.roles || [];
        const exists = currentRoles.find(r => r.role === role);
        if (exists) {
            setFormData({ ...formData, roles: currentRoles.filter(r => r.role !== role) });
        } else {
            setFormData({ ...formData, roles: [...currentRoles, { role: role }] });
        }
    };

    const handleSelectAll = () => {
        setFormData({ ...formData, roles: allRoles.map(r => ({ role: r })) });
    };

    const handleUnselectAll = () => {
        setFormData({ ...formData, roles: [] });
    };

    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400 transition-colors";
    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";

    if (view === 'list') {
        const filtered = profiles.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()));

        return (
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Role Profiles</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchProfiles} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-5 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition font-bold shadow-sm" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add Role Profile
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <input type="text" className="border border-gray-300 rounded px-4 py-2 text-sm w-full max-w-md shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search Role Profile..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600 text-[11px] uppercase tracking-wider">Profile Name</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td className="text-center py-20 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td className="text-center py-24 text-gray-500 italic">No Role Profiles found.</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.name} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingRecord(p.name); setView('form'); }}>
                                        <td className="px-6 py-4">
                                            <span className="text-blue-600 font-bold hover:underline">
                                                {p.name}
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

    const selectedRoles = (formData.roles || []).map(r => r.role);

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => { setView('list'); setEditingRecord(null); }}>
                        <FiChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            {editingRecord || 'New Role Profile'}
                            {!editingRecord && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide bg-orange-50 text-orange-600 font-bold border border-orange-100">Not Saved</span>
                            )}
                        </h1>
                        <nav className="flex text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-1">
                             Role Profile &gt; {editingRecord || 'New'}
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
                        <Popconfirm title="Delete this profile?" onConfirm={handleDelete}>
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-2 bg-white rounded border border-gray-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 min-h-[500px]">
                {loading ? (
                    <div className="flex justify-center items-center h-60">
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="max-w-md">
                            <label className={labelStyle}>Role Profile Name <span className="text-red-400">*</span></label>
                            <input className={inputStyle} value={formData.role_profile || ''} onChange={e => setFormData({ ...formData, role_profile: e.target.value })} disabled={!!editingRecord} placeholder="e.g. Sales Manager Profile" />
                        </div>

                        <div>
                            <div className="flex gap-3 mb-6">
                                <button onClick={handleSelectAll} className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Select All</button>
                                <button onClick={handleUnselectAll} className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">Unselect All</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                                {allRoles.map(role => (
                                    <div key={role} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors group cursor-pointer" onClick={() => toggleRole(role)}>
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                            checked={selectedRoles.includes(role)}
                                            readOnly 
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
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

export default RoleProfileList;
