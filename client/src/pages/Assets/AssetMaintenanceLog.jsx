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

const AssetMaintenanceLog = () => {
    const [view, setView] = useState('list');
    const [logs, setLogs] = useState([]);
    
    // Master data
    const [maintenances, setMaintenances] = useState([]);
    const [seriesList, setSeriesList] = useState([]); // if series exist
    const [tasks, setTasks] = useState([]);

    const statuses = ["Planned", "Completed", "Cancelled"];
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        asset_maintenance: '',
        naming_series: 'ACC-AML-.YYYY.-',
        task: '',
        maintenance_status: 'Planned',
        has_certificate: 0,
        completion_date: '',
        actions_performed: ''
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (view === 'list') {
            fetchLogs();
        } else {
            fetchMasters();
        }
    }, [view]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await API.get('/api/resource/Asset Maintenance Log?fields=["name","asset_maintenance","task","maintenance_status"]&limit_page_length=None');
            setLogs(res.data.data || []);
        } catch (err) {
            console.error('Error fetching Asset Maintenance Log', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [amRes, tRes] = await Promise.all([
                API.get('/api/resource/Asset Maintenance?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Task?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            setMaintenances((amRes.data.data || []).map(d => d.name));
            setTasks((tRes.data.data || []).map(d => d.name));
            // Default naming series usually fixed but we can provide generic if it fails.
            setSeriesList(['ACC-AML-.YYYY.-']);
        } catch (err) {
            console.error('Error fetching master data', err);
        }
    };

    const handleCreateNew = () => {
        setFormData({
            asset_maintenance: '',
            naming_series: 'ACC-AML-.YYYY.-',
            task: '',
            maintenance_status: 'Planned',
            has_certificate: 0,
            completion_date: '',
            actions_performed: ''
        });
        setIsEditing(false);
        setEditId(null);
        setView('form');
    };

    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const res = await API.get(`/api/resource/Asset Maintenance Log/${encodeURIComponent(id)}`);
            setFormData({
                ...res.data.data,
            });
            setIsEditing(true);
            setEditId(id);
            setView('form');
        } catch (err) {
            console.error('Error fetching Asset Maintenance Log', err);
            notification.error({ message: 'Failed to fetch Asset Maintenance Log data' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
        try {
            setLoading(true);
            await API.delete(`/api/resource/Asset Maintenance Log/${encodeURIComponent(id)}`);
            notification.success({ message: 'Asset Maintenance Log deleted successfully!' });
            fetchLogs();
        } catch (err) {
            console.error('Error deleting Asset Maintenance Log', err);
            notification.error({ message: 'Failed to delete Asset Maintenance Log' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.asset_maintenance) {
            notification.warning({ message: 'Asset Maintenance is required' });
            return;
        }
        
        try {
            setSaving(true);
            const payload = { ...formData };
            // Ensure checkbox format
            payload.has_certificate = payload.has_certificate ? 1 : 0;
            
            if (isEditing) {
                await API.put(`/api/resource/Asset Maintenance Log/${encodeURIComponent(editId)}`, payload);
                notification.success({ message: 'Asset Maintenance Log updated successfully!' });
            } else {
                await API.post('/api/resource/Asset Maintenance Log', payload);
                notification.success({ message: 'Asset Maintenance Log created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Error saving Asset Maintenance Log', err);
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


    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto font-sans bg-[#F4F5F6] min-h-screen">
                <div className="flex justify-between items-start mb-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-500 hover:text-gray-800 pt-1" onClick={() => setView('list')} disabled={saving}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {isEditing ? `Edit Asset Maintenance Log: ${editId}` : 'New Asset Maintenance Log'}
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
                            <div className="space-y-6">
                                <SelectField label="Asset Maintenance" required options={maintenances} value={formData.asset_maintenance} onChange={(v) => setFormData({ ...formData, asset_maintenance: v })} disabled={saving || isEditing} />
                                <SelectField label="Series" required options={seriesList} value={formData.naming_series} onChange={(v) => setFormData({ ...formData, naming_series: v })} disabled={saving || isEditing} />
                            </div>
                        </div>

                        <hr className="border-gray-100 -mx-8 mb-6" />
                        <h3 className="font-semibold text-gray-800 text-[15px] mb-4">Maintenance Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8">
                            <SelectField label="Task" options={tasks.length > 0 ? tasks : []} value={formData.task} onChange={(v) => setFormData({ ...formData, task: v })} disabled={saving} />
                            
                            <div className="space-y-6">
                                <SelectField label="Maintenance Status" required options={statuses} value={formData.maintenance_status} onChange={(v) => setFormData({ ...formData, maintenance_status: v })} disabled={saving} />
                                <InputField label="Completion Date" type="date" value={formData.completion_date} onChange={(v) => setFormData({ ...formData, completion_date: v })} disabled={saving} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-8">
                            <input 
                                type="checkbox" 
                                id="has_certificate"
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={!!formData.has_certificate}
                                onChange={(e) => setFormData({ ...formData, has_certificate: e.target.checked })}
                                disabled={saving}
                            />
                            <label htmlFor="has_certificate" className="text-[13px] font-medium text-gray-700 cursor-pointer">Has Certificate</label>
                        </div>
                        
                        {/* Rich Text area mimic */}
                        <div className="mt-8">
                            <label className="block text-[13px] font-medium text-gray-600 mb-2">Actions performed</label>
                            <div className="border border-gray-200 rounded overflow-hidden flex flex-col focus-within:border-blue-400 hover:border-gray-300 transition-colors bg-[#fcfcfc]">
                                {/* Fake Toolbar */}
                                <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex flex-wrap items-center gap-1 text-gray-600">
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">File</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Edit</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">View</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Insert</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Format</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Tools</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Table</div>
                                    <div className="px-2 py-1 text-xs hover:bg-gray-200 rounded cursor-pointer">Help</div>
                                    
                                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                    <button className="p-1 hover:bg-gray-200 rounded"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                                    <button className="p-1 hover:bg-gray-200 rounded"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
                                    
                                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                    <button className="p-1 hover:bg-gray-200 rounded font-bold">B</button>
                                    <button className="p-1 hover:bg-gray-200 rounded italic font-serif">I</button>
                                    <button className="p-1 hover:bg-gray-200 rounded underline">U</button>
                                    <button className="p-1 hover:bg-gray-200 rounded line-through">S</button>
                                </div>
                                
                                <textarea 
                                    className="w-full min-h-[300px] p-4 text-[13px] bg-white outline-none resize-y"
                                    value={formData.actions_performed}
                                    onChange={(e) => setFormData({ ...formData, actions_performed: e.target.value })}
                                    disabled={saving}
                                ></textarea>
                                <div className="bg-white border-t border-gray-100 p-1 flex justify-end">
                                    <span className="text-[10px] text-gray-400 px-1 font-semibold tracking-wider">tiny</span>
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
                <h1 className="text-2xl font-semibold text-gray-800">Asset Maintenance Logs</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors" onClick={fetchLogs}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5 shadow-sm transition-colors" onClick={handleCreateNew}>
                        <span>+</span> Add Log
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[13px] sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Log ID</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Asset Maintenance</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Task</th>
                                <th className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-100">Status</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-12 h-12 mx-auto stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                        </div>
                                        <p className="text-gray-500 text-base">No Asset Maintenance Logs Found</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((row) => (
                                    <tr key={row.name} className="hover:bg-gray-50/80 cursor-pointer transition-colors" onClick={() => handleEdit(row.name)}>
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.asset_maintenance}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.task}</td>
                                        <td className="px-4 py-2.5 text-gray-600">{row.maintenance_status}</td>
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

export default AssetMaintenanceLog;
