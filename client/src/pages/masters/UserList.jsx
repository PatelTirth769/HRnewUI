import React, { useState, useEffect, useRef } from 'react';
import { notification, Spin, Tabs, Dropdown, Button, Space, Popconfirm } from 'antd';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiPrinter, FiMoreHorizontal, FiEye, FiEyeOff, FiEdit2, FiTrash2 } from 'react-icons/fi';
import API from '../../services/api';

// ERPNext-style searchable Link Field dropdown
const LinkField = ({ label, value, options, onChange, placeholder = '', maxWidth = '', createLabel = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchText('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = options.filter(opt => {
        const optLabel = typeof opt === 'object' ? opt.label : opt;
        return optLabel.toLowerCase().includes(searchText.toLowerCase());
    });

    const displayValue = () => {
        if (isOpen) return searchText;
        if (!value) return '';
        const found = options.find(o => (typeof o === 'object' ? o.value : o) === value);
        return found ? (typeof found === 'object' ? found.label : found) : value;
    };

    return (
        <div ref={wrapperRef} className={`relative ${maxWidth}`}>
            {label && <label className="block text-[13px] text-gray-500 mb-1">{label}</label>}
            <input
                ref={inputRef}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                value={displayValue()}
                placeholder={placeholder}
                onFocus={() => { setIsOpen(true); setSearchText(''); }}
                onChange={(e) => { setSearchText(e.target.value); setIsOpen(true); }}
            />
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ minWidth: '100%' }}>
                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 italic">No results</div>
                    ) : (
                        filtered.map((opt, i) => {
                            const optValue = typeof opt === 'object' ? opt.value : opt;
                            const optLabel = typeof opt === 'object' ? opt.label : opt;
                            const isSelected = optValue === value;
                            return (
                                <div
                                    key={i}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                        isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                        setSearchText('');
                                    }}
                                >
                                    {optLabel}
                                </div>
                            );
                        })
                    )}
                    {createLabel && (
                        <div className="px-4 py-2.5 text-sm text-blue-600 font-medium border-t border-gray-100 cursor-pointer hover:bg-blue-50 flex items-center gap-1">
                            <span className="text-blue-500">+</span> {createLabel}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UserList = () => {
    const [api, contextHolder] = notification.useNotification();
    const [view, setView] = useState('list');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);
    const [showPassword, setShowPassword] = useState(false);

    // Dropdown masters
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [timezones, setTimezones] = useState([]);
    const [genders, setGenders] = useState([]);
    const [roleProfiles, setRoleProfiles] = useState([]);
    const [moduleProfiles, setModuleProfiles] = useState([]);

    const initialFormState = {
        email: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        full_name: '',
        username: '',
        language: '',
        time_zone: '',
        enabled: 1,
        user_type: 'System User',
        // More Information
        gender: '',
        phone: '',
        mobile_no: '',
        birth_date: '',
        location: '',
        bio: '',
        interest: '',
        // Roles & Permissions
        roles: [],
        block_modules: [],
        // Settings
        thread_notify: 1,
        send_me_notifications: 1,
        // Change password
        new_password: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (view === 'list') {
            fetchUsers();
        } else {
            fetchDropdownData();
            if (editingRecord) {
                fetchUserDetails(editingRecord);
            } else {
                setFormData(initialFormState);
            }
        }
    }, [view, editingRecord]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/User?fields=["name","full_name","email","enabled","user_type","last_active"]&limit_page_length=None&order_by=modified desc');
            setUsers(res.data.data || []);
        } catch (err) {
            api.error({ message: 'Error', description: 'Failed to fetch users' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [roleRes, moduleRes, langRes, tzRes, genderRes, rpRes, mpRes] = await Promise.all([
                API.get('/api/resource/Role?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Module Def?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Language?fields=["name","language_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/method/frappe.core.doctype.user.user.get_timezones').catch(() => ({ data: { message: { timezones: [] } } })),
                API.get('/api/resource/Gender?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Role Profile?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Module Profile?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            setRoles((roleRes.data.data || []).map(r => r.name).sort());
            setModules((moduleRes.data.data || []).map(m => m.name).sort());
            setLanguages((langRes.data.data || []).map(l => ({ value: l.name, label: l.language_name || l.name })).sort((a, b) => a.label.localeCompare(b.label)));
            // Handle timezone response - can come in different formats
            const tzData = tzRes.data?.message?.timezones || tzRes.data?.message || [];
            if (Array.isArray(tzData)) {
                setTimezones(tzData.sort());
            } else {
                setTimezones([]);
            }
            setGenders((genderRes.data.data || []).map(g => g.name).sort());
            setRoleProfiles((rpRes.data.data || []).map(r => r.name).sort());
            setModuleProfiles((mpRes.data.data || []).map(m => m.name).sort());
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchUserDetails = async (name) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/User/${encodeURIComponent(name)}`);
            const data = res.data.data;
            if (!data.roles) data.roles = [];
            if (!data.block_modules) data.block_modules = [];
            setFormData(data);
        } catch (err) {
            api.error({ message: 'Error', description: 'Failed to fetch user details' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const missingFields = [];
        if (!formData.email) missingFields.push('Email');
        if (!formData.first_name) missingFields.push('First Name');

        if (missingFields.length > 0) {
            api.warning({ 
                message: 'Validation Error', 
                description: `Missing field(s): ${missingFields.join(', ')}` 
            });
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingRecord) {
                await API.put(`/api/resource/User/${encodeURIComponent(editingRecord)}`, payload);
                api.success({ message: 'User updated successfully.' });
            } else {
                await API.post('/api/resource/User', payload);
                api.success({ message: 'User successfully created.' });
            }
            setView('list');
        } catch (err) {
            let errorMessage = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errorMessage === 'string' && errorMessage.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errorMessage);
                    errorMessage = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* */ }
            }
            api.error({ message: 'Save Failed', description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), duration: 6 });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userName = null) => {
        const targetUser = typeof userName === 'string' ? userName : editingRecord;
        try {
            await API.delete(`/api/resource/User/${encodeURIComponent(targetUser)}`);
            api.success({ message: 'User deleted.' });
            if (view === 'list') {
                fetchUsers();
            } else {
                setView('list');
            }
        } catch (err) {
            api.error({ message: 'Delete Failed', description: err.message });
        }
    };

    // Role toggle
    const toggleRole = (roleName) => {
        const currentRoles = formData.roles || [];
        const exists = currentRoles.find(r => r.role === roleName);
        if (exists) {
            setFormData({ ...formData, roles: currentRoles.filter(r => r.role !== roleName) });
        } else {
            setFormData({ ...formData, roles: [...currentRoles, { role: roleName }] });
        }
    };

    const selectAllRoles = () => {
        setFormData({ ...formData, roles: roles.map(r => ({ role: r })) });
    };

    const unselectAllRoles = () => {
        setFormData({ ...formData, roles: [] });
    };

    // Module toggle
    const toggleModule = (moduleName) => {
        const currentModules = formData.block_modules || [];
        const exists = currentModules.find(m => m.module === moduleName);
        if (exists) {
            setFormData({ ...formData, block_modules: currentModules.filter(m => m.module !== moduleName) });
        } else {
            setFormData({ ...formData, block_modules: [...currentModules, { module: moduleName }] });
        }
    };

    const isModuleAllowed = (moduleName) => {
        const blocked = formData.block_modules || [];
        return !blocked.find(m => m.module === moduleName);
    };

    const selectAllModules = () => {
        setFormData({ ...formData, block_modules: [] });
    };

    const unselectAllModules = () => {
        setFormData({ ...formData, block_modules: modules.map(m => ({ module: m })) });
    };

    // UI Styles
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 disabled:bg-gray-50";
    const labelStyle = "block text-[13px] text-gray-500 mb-1";

    // ============ LIST VIEW ============
    if (view === 'list') {
        const filtered = users.filter(u => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (u.name || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
        });

        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center transition font-medium" onClick={fetchUsers} disabled={loading}>
                            {loading ? '⟳ Loading...' : '⟳ Refresh'}
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={() => { setEditingRecord(null); setView('form'); }}>
                            + Add User
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-80 shadow-sm focus:ring-1 focus:ring-blue-400" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <div className="ml-auto text-xs text-gray-400 font-medium">{!loading && `${Math.min(visibleCount, filtered.length)} of ${filtered.length} TOTAL USERS`}</div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F9FAFB] border-b">
                            <tr>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">ID / Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Full Name</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">Status</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase">User Type</th>
                                <th className="px-5 py-3 font-semibold text-gray-600 text-[12px] uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-12 text-gray-400 italic">Fetching from ERPNext...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-500 italic">No Users found.</td></tr>
                            ) : (
                                filtered.slice(0, visibleCount).map((u) => (
                                    <tr key={u.name} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <button className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm" onClick={() => { setEditingRecord(u.name); setView('form'); }}>
                                                {u.name}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs">{u.full_name}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${u.enabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {u.enabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 text-xs">{u.user_type}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingRecord(u.name); setView('form'); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit">
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <Popconfirm title="Delete this user?" onConfirm={(e) => { e.stopPropagation(); handleDelete(u.name); }} onCancel={(e) => e.stopPropagation()}>
                                                    <button className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Delete" onClick={(e) => e.stopPropagation()}>
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </Popconfirm>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    {!loading && filtered.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50/30 border-t border-gray-100">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                {[20, 100, 500, 2500].map((size) => (
                                    <button
                                        key={size}
                                        className={`px-4 py-1.5 text-xs font-bold border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition cursor-pointer ${
                                            pageSize === size ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
                                        }`}
                                        onClick={() => {
                                            setPageSize(size);
                                            setVisibleCount(size);
                                        }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            {visibleCount < filtered.length && (
                                <button
                                    className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                    onClick={() => setVisibleCount(prev => prev + pageSize)}
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============ FORM VIEW ============
    const userRoles = (formData.roles || []).map(r => r.role);

    const tabItems = [
        {
            key: 'user_details',
            label: 'User Details',
            children: (
                <div className="space-y-6 animate-fade-in">
                    {/* Enabled Checkbox */}
                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="enabled" checked={!!formData.enabled} onChange={e => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="enabled" className="text-sm font-semibold text-gray-700">Enabled</label>
                    </div>

                    {/* Basic Info */}
                    <div className="border rounded mt-4">
                        <div className="font-semibold text-gray-800 text-sm bg-gray-50 p-2 border-b rounded-t text-[13px]">Basic Info</div>
                        <div className="p-4 grid grid-cols-3 gap-6">
                            <div>
                                <label className={labelStyle}>Email <span className="text-red-400">*</span></label>
                                <input className={inputStyle} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingRecord} />
                            </div>
                            <div>
                                <label className={labelStyle}>Full Name</label>
                                <input className={inputStyle} value={formData.full_name || ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                            </div>
                            <LinkField
                                label="Language"
                                value={formData.language || ''}
                                options={languages}
                                onChange={v => setFormData({ ...formData, language: v })}
                            />
                            <div>
                                <label className={labelStyle}>First Name <span className="text-red-400">*</span></label>
                                <input className={inputStyle} value={formData.first_name || ''} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Username</label>
                                <input className={inputStyle} value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <LinkField
                                label="Time Zone"
                                value={formData.time_zone || ''}
                                options={timezones}
                                onChange={v => setFormData({ ...formData, time_zone: v })}
                            />
                            <div>
                                <label className={labelStyle}>Middle Name</label>
                                <input className={inputStyle} value={formData.middle_name || ''} onChange={e => setFormData({ ...formData, middle_name: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelStyle}>Last Name</label>
                                <input className={inputStyle} value={formData.last_name || ''} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'roles_permissions',
            label: 'Roles & Permissions',
            children: (
                <div className="space-y-8 animate-fade-in">
                    {/* Roles */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Roles</h3>
                        <div className="mb-2">
                            <LinkField
                                label="Role Profile"
                                value={formData.role_profile_name || ''}
                                options={roleProfiles}
                                onChange={v => setFormData({ ...formData, role_profile_name: v })}
                                maxWidth="max-w-md"
                                createLabel="Create a new Role Profile"
                            />
                        </div>
                        <div className="flex gap-3 mt-4 mb-4">
                            <button onClick={selectAllRoles} className="text-sm text-gray-700 font-semibold border-b-2 border-gray-800 pb-0.5 hover:text-blue-600">Select All</button>
                            <button onClick={unselectAllRoles} className="text-sm text-gray-700 font-semibold border-b-2 border-gray-300 pb-0.5 hover:text-blue-600">Unselect All</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {roles.map(role => (
                                <label key={role} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-1">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                        checked={userRoles.includes(role)}
                                        onChange={() => toggleRole(role)}
                                    />
                                    {role}
                                </label>
                            ))}
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Allow Modules */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm mb-3">Allow Modules</h3>
                        <div className="mb-2">
                            <LinkField
                                label="Module Profile"
                                value={formData.module_profile || ''}
                                options={moduleProfiles}
                                onChange={v => setFormData({ ...formData, module_profile: v })}
                                maxWidth="max-w-md"
                                createLabel="Create a new Module Profile"
                            />
                        </div>
                        <div className="flex gap-3 mt-4 mb-4">
                            <button onClick={selectAllModules} className="text-sm text-gray-700 font-semibold border-b-2 border-gray-800 pb-0.5 hover:text-blue-600">Select All</button>
                            <button onClick={unselectAllModules} className="text-sm text-gray-700 font-semibold border-b-2 border-gray-300 pb-0.5 hover:text-blue-600">Unselect All</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {modules.map(mod => (
                                <label key={mod} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-1">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                        checked={isModuleAllowed(mod)}
                                        onChange={() => toggleModule(mod)}
                                    />
                                    {mod}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'more_information',
            label: 'More Information',
            children: (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-3 gap-6 mt-2">
                        <LinkField
                            label="Gender"
                            value={formData.gender || ''}
                            options={genders}
                            onChange={v => setFormData({ ...formData, gender: v })}
                        />
                        <div>
                            <label className={labelStyle}>Phone</label>
                            <input className={inputStyle} value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Mobile No</label>
                            <input className={inputStyle} value={formData.mobile_no || ''} onChange={e => setFormData({ ...formData, mobile_no: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Birth Date</label>
                            <input type="date" className={inputStyle} value={formData.birth_date || ''} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Location</label>
                            <input className={inputStyle} value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className={labelStyle}>Interests</label>
                            <textarea className={`${inputStyle} h-28 resize-none`} value={formData.interest || ''} onChange={e => setFormData({ ...formData, interest: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelStyle}>Bio</label>
                            <textarea className={`${inputStyle} h-28 resize-none`} value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'settings',
            label: 'Settings',
            children: (
                <div className="space-y-4 animate-fade-in mt-2">
                    <CollapsibleSection title="Desk Settings">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="thread_notify" checked={!!formData.thread_notify} onChange={e => setFormData({ ...formData, thread_notify: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="thread_notify" className="text-sm text-gray-700">Send Notifications for Threads</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="send_me_notifications" checked={!!formData.send_me_notifications} onChange={e => setFormData({ ...formData, send_me_notifications: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="send_me_notifications" className="text-sm text-gray-700">Send Me Notifications</label>
                            </div>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Change Password">
                        <div className="max-w-md relative">
                            <label className={labelStyle}>New Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className={`${inputStyle} pr-10`} 
                                    value={formData.new_password || ''} 
                                    onChange={e => setFormData({ ...formData, new_password: e.target.value })} 
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">Set a new password for this user.</p>
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Security Settings">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="bypass_restrict_ip_check_if_2fa" checked={!!formData.bypass_restrict_ip_check_if_2fa} onChange={e => setFormData({ ...formData, bypass_restrict_ip_check_if_2fa: e.target.checked ? 1 : 0 })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="bypass_restrict_ip_check_if_2fa" className="text-sm text-gray-700">Bypass Restrict IP check if 2FA enabled</label>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className={labelStyle}>Login After</label>
                            <input type="number" className={`${inputStyle} max-w-xs`} value={formData.login_after || ''} onChange={e => setFormData({ ...formData, login_after: e.target.value })} />
                        </div>
                        <div className="mt-4">
                            <label className={labelStyle}>Login Before</label>
                            <input type="number" className={`${inputStyle} max-w-xs`} value={formData.login_before || ''} onChange={e => setFormData({ ...formData, login_before: e.target.value })} />
                        </div>
                        <div className="mt-4">
                            <label className={labelStyle}>Restrict IP</label>
                            <input className={`${inputStyle} max-w-md`} value={formData.restrict_ip || ''} onChange={e => setFormData({ ...formData, restrict_ip: e.target.value })} placeholder="Restrict login from these IPs" />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="API Access">
                        <div className="space-y-4">
                            <div>
                                <label className={labelStyle}>API Key</label>
                                <input className={`${inputStyle} max-w-md bg-gray-50`} value={formData.api_key || ''} readOnly />
                            </div>
                            <div>
                                <label className={labelStyle}>API Secret</label>
                                <input className={`${inputStyle} max-w-md bg-gray-50`} value={formData.api_secret ? '••••••••' : ''} readOnly />
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>
            )
        },
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto pb-20">
            {contextHolder}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        {editingRecord ? formData.full_name || editingRecord : 'New User'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${formData.enabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {formData.enabled ? 'Active' : 'Disabled'}
                    </span>
                    {!editingRecord && (
                        <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium border border-[#F8B4B4]">Not Saved</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition font-medium" onClick={() => { setView('list'); setEditingRecord(null); }}>
                        ← Back
                    </button>

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
                        <Popconfirm title="Delete this user?" onConfirm={handleDelete}>
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
                    <Tabs defaultActiveKey="user_details" items={tabItems} className="custom-user-tabs" />
                )}
            </div>

            {/* Comments Section */}
            {editingRecord && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Comments</h3>
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">A</div>
                        <input className={`${inputStyle} flex-1`} placeholder="Type a reply / comment" />
                    </div>
                </div>
            )}

            <style>{`
                .custom-user-tabs .ant-tabs-nav::before {
                    border-bottom: 1px solid #e5e7eb;
                }
                .custom-user-tabs .ant-tabs-tab {
                    padding: 12px 0;
                    margin: 0 32px 0 0;
                    color: #6b7280;
                }
                .custom-user-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #111827 !important;
                    font-weight: 600;
                }
                .custom-user-tabs .ant-tabs-ink-bar {
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

// Collapsible Section Component for Settings
const CollapsibleSection = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
            >
                <span className="text-sm font-bold text-gray-800">{title}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-4 py-4 border-t border-gray-100 bg-white animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export default UserList;
