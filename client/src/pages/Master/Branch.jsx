import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { getSystemQueryParam } from '../../services/api';
import axios from 'axios';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false }) => (
    <div>
        <label className="block text-sm text-gray-500 mb-1">{label} {required && <span className="text-[#E02424]">*</span>}</label>
        <input
            type={type}
            className={`w-full border border-gray-100 rounded px-3 py-1.5 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

export default function Branch() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        branch: '',
        latitude: '',
        longitude: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // Filter states
    const [searchName, setSearchName] = useState('');

    // --- FETCH ---
    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/api/resource/Branch?fields=["name","branch"]&limit_page_length=None&order_by=modified desc';

            let filters = [];
            if (searchName) filters.push(`["name","like","%${searchName}%"]`);

            if (filters.length > 0) {
                url += `&filters=[${filters.join(',')}]`;
            }

            const res = await API.get(url);
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Branches' });
        } finally {
            setLoading(false);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Branch/${encodeURIComponent(name)}`);
            if (res.data.data) {
                let initialData = res.data.data;
                try {
                    const confRes = await axios.get(`/local-api/attendance-configs/${encodeURIComponent(name)}${getSystemQueryParam()}`);
                    if (confRes.data.data) {
                        initialData.latitude = confRes.data.data.latitude || '';
                        initialData.longitude = confRes.data.data.longitude || '';
                    }
                } catch(e) { console.error('No config found', e) }
                setFormData({ ...defaultForm, ...initialData });
            }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = async (record) => {
        setEditingRecord(record);
        setView('form');
        await fetchSingle(record.name);
    };

    const handleSave = async () => {
        if (!formData.branch.trim() && !editingRecord && !formData.name?.trim()) {
            notification.warning({ message: 'Branch Name is required' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                branch: formData.branch || formData.name
            };

            if (editingRecord) {
                await API.put(`/api/resource/Branch/${encodeURIComponent(editingRecord.name)}`, payload);
                const branchValue = formData.branch || formData.name;
                await axios.post(`/local-api/attendance-configs${getSystemQueryParam()}`, { 
                    branchName: branchValue, 
                    latitude: formData.latitude, 
                    longitude: formData.longitude 
                });
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                const res = await API.post('/api/resource/Branch', payload);
                const branchValue = res.data?.data?.name || res.data?.data?.branch || formData.branch || formData.name;
                await axios.post(`/local-api/attendance-configs${getSystemQueryParam()}`, { 
                    branchName: branchValue, 
                    latitude: formData.latitude, 
                    longitude: formData.longitude 
                });
                notification.success({ message: `"${branchValue}" created successfully!` });
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

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            await API.delete(`/api/resource/Branch/${encodeURIComponent(record.name)}`);
            notification.success({ message: `"${record.name}" deleted successfully!` });
            fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateField = (f, v) => setFormData(p => ({ ...p, [f]: v }));

    // --- FILTER ---
    const filteredData = data.filter(d => {
        if (searchName && !d.name.toLowerCase().includes(searchName.toLowerCase())) return false;
        return true;
    });

    // --- RENDER ---
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header components */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 relative">
                        <button className="text-gray-500 hover:text-gray-700 text-lg transition-colors p-1" onClick={() => setView('list')}>←</button>
                        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
                            {editingRecord ? editingRecord.name : 'New Branch'}
                        </h1>
                        {!editingRecord && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#E02424] font-medium tracking-wide uppercase shadow-sm">Not Saved</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-5 py-2 min-w-[100px] bg-gray-100/80 text-gray-600 text-sm font-medium rounded shadow-sm border border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-colors focus:ring-2 focus:ring-gray-100" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-6 py-2 min-w-[100px] bg-[#1C1F26] text-white text-[14px] font-medium rounded shadow-sm hover:bg-black transition-colors focus:ring-2 focus:ring-gray-800 focus:ring-offset-1 disabled:opacity-50 flex items-center justify-center" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                            <div className="space-y-6">
                                <InputField
                                    label="Branch"
                                    value={formData.branch || formData.name}
                                    onChange={(v) => !editingRecord && updateField('branch', v)}
                                    required
                                    disabled={!!editingRecord}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Latitude"
                                        value={formData.latitude}
                                        onChange={(v) => updateField('latitude', v)}
                                    />
                                    <InputField
                                        label="Longitude"
                                        value={formData.longitude}
                                        onChange={(v) => updateField('longitude', v)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Branch</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded text-[14px] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors focus:ring-2 focus:ring-gray-100" onClick={fetchData}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-5 py-2 bg-[#1C1F26] text-white rounded text-[14px] font-medium hover:bg-black flex items-center gap-2 shadow-sm transition-colors focus:ring-2 focus:ring-gray-800 focus:ring-offset-1" onClick={handleNew}>
                        + Add Branch
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[240px]">
                        <input
                            type="text"
                            placeholder="Name"
                            className="w-full bg-gray-50 border border-transparent rounded px-3 py-1.5 text-sm focus:bg-white focus:border-blue-400 focus:outline-none transition-colors"
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchData()}
                        />
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex gap-2">
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200 transition-colors"
                            onClick={fetchData}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            {searchName ? `Filters 1` : 'Filter'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="px-6 py-3.5 font-medium">Branch</th>
                                <th className="px-6 py-3.5 font-medium w-32 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr><td colSpan="2" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="2" className="px-6 py-12 text-center text-gray-400">No Branches found</td></tr>
                            ) : (
                                filteredData.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50/50 group transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-gray-900 cursor-pointer" onClick={() => handleEdit(row)}>{row.name}</td>
                                        <td className="px-6 py-3.5 flex items-center justify-end h-full gap-3">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-[#E02424] hover:text-red-800 font-medium text-[13px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
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
}
