import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, colSpan = 1, placeholder = "" }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
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

const SelectField = ({ label, value, options, required = false, onChange, disabled = false, colSpan = 1 }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
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

const AssetMaintenanceTeam = () => {
    const [view, setView] = useState('list');
    const [teams, setTeams] = useState([]);
    
    // Master data
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]); // [{name, employee_name}]
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        maintenance_team_name: '',
        company: '',
        maintenance_manager: '',
        company_team_members: [] // The subtable in API is typically named company_team_members or team_members, we'll try company_team_members
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') {
            fetchTeams();
        } else {
            fetchMasters();
        }
    }, [view]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Maintenance Team?fields=["name","maintenance_team_name","company","maintenance_manager"]&limit_page_length=None');
            setTeams(res.data.data || []);
        } catch (err) {
            console.error('Error fetching teams', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [cRes, eRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setCompanies((cRes.data.data || []).map(d => d.name));
            setEmployees(eRes.data.data || []);
        } catch (err) {
            console.error('Error fetching master data', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            maintenance_team_name: '',
            company: companies.length === 1 ? companies[0] : '',
            maintenance_manager: '',
            company_team_members: []
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Maintenance Team/${encodeURIComponent(id)}`);
            setFormData({
                ...res.data.data,
                company_team_members: res.data.data.company_team_members || res.data.data.team_members || [],
            });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            console.error('Error fetching Asset Maintenance Team', err);
            notification.error({ message: 'Failed to fetch Asset Maintenance Team data' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
        try {
            setLoading(true);
            await API.delete(`/api/resource/Asset Maintenance Team/${encodeURIComponent(id)}`);
            notification.success({ message: 'Asset Maintenance Team deleted successfully!' });
            fetchTeams();
        } catch (err) {
            console.error('Error deleting Asset Maintenance Team', err);
            notification.error({ message: 'Failed to delete Asset Maintenance Team' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.maintenance_team_name || !formData.company) {
            notification.warning({ message: 'Team Name and Company are required' });
            return;
        }
        
        try {
            setSaving(true);
            const payload = { ...formData };
            if (isEditing) {
                await API.put(`/api/resource/Asset Maintenance Team/${encodeURIComponent(editId)}`, payload);
                notification.success({ message: 'Asset Maintenance Team updated successfully!' });
            } else {
                await API.post('/api/resource/Asset Maintenance Team', payload);
                notification.success({ message: 'Asset Maintenance Team created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Error saving Asset Maintenance Team', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(errMsg);
                    errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                } catch { /* */ }
            }
            notification.error({ message: 'Failed to save', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 5 });
        } finally {
            setSaving(false);
        }
    };

    // Subtable Handlers
    const addTeamMemberRow = () => {
        setFormData({
            ...formData,
            company_team_members: [
                ...formData.company_team_members,
                {
                    team_member: '',
                    full_name: '',
                    maintenance_role: ''
                }
            ]
        });
    };

    const handleTeamMemberChange = (index, field, value) => {
        const updatedMembers = [...formData.company_team_members];
        updatedMembers[index][field] = value;
        
        // Auto fetch full name if team member changes
        if (field === 'team_member') {
            const emp = employees.find(e => e.name === value);
            if (emp) {
                updatedMembers[index].full_name = emp.employee_name || '';
            } else {
                updatedMembers[index].full_name = '';
            }
        }
        
        setFormData({ ...formData, company_team_members: updatedMembers });
    };

    const removeTeamMemberRow = (index) => {
        const updatedMembers = formData.company_team_members.filter((_, i) => i !== index);
        setFormData({ ...formData, company_team_members: updatedMembers });
    };


    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={saving}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit Asset Maintenance Team: ${editId}` : 'New Asset Maintenance Team'}
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold align-middle ml-2">Not Saved</span>
                        </h1>
                    </div>
                    <div>
                        <button className="px-4 py-1.5 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-70 flex items-center gap-2 shadow-sm transition-colors" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-8">
                        {/* Section 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <InputField label="Maintenance Team Name" required value={formData.maintenance_team_name} onChange={(v) => setFormData({ ...formData, maintenance_team_name: v })} disabled={saving || isEditing} />
                            <SelectField label="Company" required options={companies} value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} disabled={saving} />
                            <SelectField label="Maintenance Manager" options={employees.map(e => ({ value: e.name, label: e.name }))} value={formData.maintenance_manager} onChange={(v) => setFormData({ ...formData, maintenance_manager: v })} disabled={saving} />
                        </div>

                        {/* Team Details Table */}
                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Team</h3>
                        <div className="mb-10 text-sm">
                            <div className="text-gray-500 font-medium mb-2 text-xs">Maintenance Team Members</div>
                            <div className="border border-gray-200 rounded-md overflow-x-auto">
                                <table className="w-full text-left bg-white whitespace-nowrap">
                                    <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[12px]">
                                        <tr>
                                            <th className="px-3 py-2 font-medium w-6"><input type="checkbox" className="rounded border-gray-300 disabled:opacity-50" disabled /></th>
                                            <th className="px-3 py-2 font-medium w-12 text-center">No.</th>
                                            <th className="px-3 py-2 font-medium">Team Member *</th>
                                            <th className="px-3 py-2 font-medium">Full Name</th>
                                            <th className="px-3 py-2 font-medium">Maintenance Role *</th>
                                            <th className="px-3 py-2 font-medium w-10 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[13px]">
                                        {formData.company_team_members.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="bg-white">
                                                    <div className="flex px-3 py-2.5 items-center">
                                                        <input type="checkbox" className="rounded border-gray-300 mr-4" disabled />
                                                        <span className="text-gray-400 font-medium">1</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.company_team_members.map((row, index) => (
                                                <tr key={index}>
                                                    <td className="p-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                                                    <td className="p-2 text-center text-gray-500 font-medium">{index + 1}</td>
                                                    <td className="p-2">
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1.5 focus:border-blue-400 outline-none hover:border-gray-200" required value={row.team_member} onChange={(e) => handleTeamMemberChange(index, 'team_member', e.target.value)} disabled={saving}>
                                                            <option value="">Select Member</option>
                                                            {employees.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="text" className="w-full border border-transparent bg-transparent px-2 py-1.5 text-gray-700 outline-none" value={row.full_name} readOnly disabled={saving} />
                                                    </td>
                                                    <td className="p-2">
                                                        {/* Maintenance Role usually standard dropdown (Manager, Technician, etc.) */}
                                                        <select className="w-full border border-gray-100 rounded px-2 py-1.5 focus:border-blue-400 outline-none hover:border-gray-200" required value={row.maintenance_role} onChange={(e) => handleTeamMemberChange(index, 'maintenance_role', e.target.value)} disabled={saving}>
                                                            <option value=""></option>
                                                            <option value="Manager">Manager</option>
                                                            <option value="Technician">Technician</option>
                                                            <option value="Engineer">Engineer</option>
                                                            <option value="Contractor">Contractor</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button type="button" onClick={() => removeTeamMemberRow(index)} className="text-gray-400 hover:text-red-500 transition-colors"><FiTrash2 /></button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="bg-white p-2.5 border-t border-gray-100 rounded-b-md">
                                    <button type="button" onClick={addTeamMemberRow} className="px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors shadow-sm">
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Asset Maintenance Teams</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchTeams}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Team
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Team Name</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Company</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Manager</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : teams.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Asset Maintenance Teams Found</p>
                                    </td>
                                </tr>
                            ) : (
                                teams.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.maintenance_team_name || row.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.company}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.maintenance_manager}</td>
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

export default AssetMaintenanceTeam;
