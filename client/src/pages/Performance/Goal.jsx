import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const RESOURCE = 'Goal';
const API_BASE = `/api/resource/${RESOURCE}`;

export default function Goal() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQ, setSearchQ] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');

    // Master data
    const [employees, setEmployees] = useState([]);
    const [goals, setGoals] = useState([]);
    const [appraisalCycles, setAppraisalCycles] = useState([]);
    const [kras, setKras] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    const defaultForm = {
        goal_name: '', is_group: 0, parent_goal: '',
        progress: 0, status: 'Pending',
        employee: '', employee_name: '', company: '', user: '',
        start_date: '', end_date: '',
        appraisal_cycle: '', kra: '',
        description: '',
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // ─── FETCH MASTERS ───────────────────────────────────────────
    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const [empRes, goalRes, cycleRes, kraRes] = await Promise.all([
                API.get('/api/resource/Employee?fields=["name","employee_name","company","user_id"]&limit_page_length=None&order_by=employee_name asc'),
                API.get(`${API_BASE}?fields=["name","goal_name","is_group","employee"]&filters=[["is_group","=",1]]&limit_page_length=None`),
                API.get('/api/resource/Appraisal Cycle?fields=["name","start_date","end_date"]&limit_page_length=None&order_by=modified desc'),
                API.get('/api/resource/KRA?fields=["name"]&limit_page_length=None'),
            ]);
            setEmployees(empRes.data?.data || []);
            setGoals(goalRes.data?.data || []);
            setAppraisalCycles(cycleRes.data?.data || []);
            setKras((kraRes.data?.data || []).map(k => k.name));
            setMastersLoaded(true);
        } catch (err) { console.error('Masters fetch error:', err); }
    };

    // ─── FETCH ALL ───────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${API_BASE}?fields=["name","goal_name","employee","employee_name","status","progress","is_group","company","kra","modified"]&limit_page_length=None&order_by=modified desc`);
            setData(res.data?.data || []);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Failed to load goals' });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchData();
        else fetchMasters();
    }, [view]);

    // ─── FETCH SINGLE ────────────────────────────────────────────
    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`${API_BASE}/${encodeURIComponent(name)}`);
            const d = res.data.data;
            setFormData({
                goal_name: d.goal_name || '', is_group: d.is_group || 0, parent_goal: d.parent_goal || '',
                progress: d.progress || 0, status: d.status || 'Pending',
                employee: d.employee || '', employee_name: d.employee_name || '',
                company: d.company || '', user: d.user || '',
                start_date: d.start_date || '', end_date: d.end_date || '',
                appraisal_cycle: d.appraisal_cycle || '', kra: d.kra || '',
                description: d.description || '',
            });
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load goal details' });
        }
    };

    // ─── FILTER ──────────────────────────────────────────────────
    const filtered = data.filter(d => {
        if (searchQ && !d.name.toLowerCase().includes(searchQ.toLowerCase()) &&
            !(d.goal_name || '').toLowerCase().includes(searchQ.toLowerCase()) &&
            !(d.employee_name || '').toLowerCase().includes(searchQ.toLowerCase())) return false;
        if (filterStatus && d.status !== filterStatus) return false;
        if (filterEmployee && d.employee !== filterEmployee) return false;
        return true;
    });

    const handleNew = () => { setEditingRecord(null); setFormData({ ...defaultForm }); setView('form'); };
    const handleEdit = async (record) => { setEditingRecord(record); setView('form'); await fetchSingle(record.name); };

    // ─── AUTO-FILL from Employee ─────────────────────────────────
    const handleEmployeeChange = (empId) => {
        const emp = employees.find(e => e.name === empId);
        setFormData(prev => ({
            ...prev, employee: empId,
            employee_name: emp?.employee_name || '', company: emp?.company || '',
            user: emp?.user_id || '',
        }));
    };

    // ─── AUTO-FILL from Appraisal Cycle ──────────────────────────
    const handleCycleChange = (cycleId) => {
        const cycle = appraisalCycles.find(c => c.name === cycleId);
        setFormData(prev => ({
            ...prev, appraisal_cycle: cycleId,
            start_date: prev.start_date || cycle?.start_date || '',
            end_date: prev.end_date || cycle?.end_date || '',
        }));
    };

    // ─── SAVE ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.goal_name?.trim()) { notification.warning({ message: 'Goal name is required' }); return; }
        if (!formData.employee?.trim()) { notification.warning({ message: 'Employee is required' }); return; }
        if (!formData.start_date) { notification.warning({ message: 'Start Date is required' }); return; }

        setSaving(true);
        try {
            const payload = {
                goal_name: formData.goal_name,
                is_group: formData.is_group,
                parent_goal: formData.parent_goal || '',
                employee: formData.employee,
                company: formData.company,
                start_date: formData.start_date,
                end_date: formData.end_date || '',
                appraisal_cycle: formData.appraisal_cycle || '',
                kra: formData.kra || '',
                description: formData.description || '',
                progress: formData.progress || 0,
                status: formData.status || 'Pending',
            };

            if (editingRecord) {
                await API.put(`${API_BASE}/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: `"${editingRecord.name}" updated successfully!` });
            } else {
                await API.post(API_BASE, payload);
                notification.success({ message: 'Goal created successfully!' });
            }
            setView('list');
        } catch (err) {
            console.error('Save failed:', err);
            let errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Save Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        } finally { setSaving(false); }
    };

    // ─── DELETE ───────────────────────────────────────────────────
    const handleDelete = async (name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await API.delete(`${API_BASE}/${encodeURIComponent(name)}`);
            notification.success({ message: `"${name}" deleted!` });
            if (view === 'form') setView('list'); else fetchData();
        } catch (err) {
            let errMsg = err.response?.data?._server_messages || err.response?.data?.exc || err.message;
            if (typeof errMsg === 'string' && errMsg.startsWith('[')) {
                try { const parsed = JSON.parse(errMsg); errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n'); } catch { /* */ }
            }
            notification.error({ message: 'Delete Failed', description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg), duration: 6 });
        }
    };

    const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const formatRelativeTime = (ds) => {
        if (!ds) return '-';
        const diff = Math.floor((new Date() - new Date(ds)) / 86400000);
        return diff === 0 ? 'Today' : `${diff}d ago`;
    };

    const statusColor = (s) => {
        switch (s) {
            case 'Pending': return 'bg-orange-50 text-orange-700';
            case 'In Progress': return 'bg-blue-50 text-blue-700';
            case 'Completed': return 'bg-green-50 text-green-700';
            case 'Archived': return 'bg-gray-100 text-gray-500';
            case 'Closed': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // ═══════════════════════════════════════════════════════════
    // ─── FORM VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{editingRecord ? editingRecord.name : 'New Goal'}</span>
                        {!editingRecord ? (
                            <span className="px-2 py-0.5 rounded text-[11px] uppercase tracking-wide bg-[#FCE8E8] text-[#E02424] font-medium">Not Saved</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wide font-medium ${statusColor(formData.status)}`}>{formData.status}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 border border-blue-400 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition" onClick={() => setView('list')} title="Go Back">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        {editingRecord && (
                            <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition shadow-sm" onClick={() => handleDelete(editingRecord.name)}>Delete</button>
                        )}
                        <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-70 flex items-center gap-2" onClick={handleSave} disabled={saving}>
                            {saving ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden p-6 space-y-5">

                    {/* Row 1: Goal | Progress */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Goal <span className="text-red-400">*</span></label>
                            <input type="text" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.goal_name} onChange={(e) => updateForm('goal_name', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Progress</label>
                            <input type="number" step="0.001" min="0" max="100" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={(formData.progress || 0).toFixed(3)} onChange={(e) => updateForm('progress', parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>

                    {/* Row 2: Is Group checkbox | Status */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="is_group" className="w-4 h-4 rounded border-gray-300"
                                checked={!!formData.is_group} onChange={(e) => updateForm('is_group', e.target.checked ? 1 : 0)} />
                            <label htmlFor="is_group" className="text-sm text-gray-700">Is Group</label>
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Status</label>
                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.status || 'Pending'}</p>
                        </div>
                    </div>

                    {/* Row 3: Parent Goal */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Parent Goal</label>
                            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.parent_goal} onChange={(e) => updateForm('parent_goal', e.target.value)}>
                                <option value=""></option>
                                {goals.filter(g => !editingRecord || g.name !== editingRecord.name).map(g => (
                                    <option key={g.name} value={g.name}>{g.name}: {g.goal_name}</option>
                                ))}
                            </select>
                        </div>
                        <div></div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Section: Employee + Dates */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Employee <span className="text-red-400">*</span></label>
                            <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.employee} onChange={(e) => handleEmployeeChange(e.target.value)}>
                                <option value=""></option>
                                {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Start Date <span className="text-red-400">*</span></label>
                            <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.start_date} onChange={(e) => updateForm('start_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Employee Name</label>
                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.employee_name || ''}</p>
                        </div>
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">End Date</label>
                            <input type="date" className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.end_date} onChange={(e) => updateForm('end_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">Company</label>
                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.company || ''}</p>
                        </div>
                        <div></div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label className="block text-[13px] text-gray-500 mb-1">User</label>
                            <p className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-700">{formData.user || ''}</p>
                        </div>
                        <div></div>
                    </div>

                    {/* Appraisal Linking Section */}
                    <hr className="border-gray-100" />
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Appraisal Linking</h3>
                        <p className="text-xs text-gray-400 mb-3">Link the cycle and tag KRA to your goal to update the appraisal's goal score based on the goal progress</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">Appraisal Cycle</label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.appraisal_cycle} onChange={(e) => handleCycleChange(e.target.value)}>
                                    <option value=""></option>
                                    {appraisalCycles.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] text-gray-500 mb-1">KRA</label>
                                <select className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.kra} onChange={(e) => updateForm('kra', e.target.value)}>
                                    <option value=""></option>
                                    {kras.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <hr className="border-gray-100" />
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1 cursor-pointer">
                            Description <span className="text-gray-400 text-xs">⌃</span>
                        </h3>
                        <label className="block text-[13px] text-gray-500 mb-1">Description</label>
                        <textarea className="w-full border border-gray-200 rounded px-3 py-2 text-sm min-h-[150px] bg-white focus:outline-none focus:border-blue-400"
                            value={formData.description?.replace(/<[^>]+>/g, '') || ''} onChange={(e) => updateForm('description', e.target.value)} />
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // ─── LIST VIEW ────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Goal</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 flex items-center gap-2 transition" onClick={fetchData} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition font-medium" onClick={handleNew}>
                        + Add Goal
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <input type="text" className="border border-gray-300 rounded px-3 py-2 text-sm w-48" placeholder="Search goal or name..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    {['Pending', 'In Progress', 'Completed', 'Archived', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(searchQ || filterStatus || filterEmployee) && (
                    <button className="text-red-500 hover:text-red-700 text-sm" onClick={() => { setSearchQ(''); setFilterStatus(''); setFilterEmployee(''); }}>✕ Clear</button>
                )}
                <div className="ml-auto text-xs text-gray-400">{filtered.length} of {data.length}</div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No goals found</p>
                        <p className="text-sm">Click "+ Add Goal" to create one</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Goal</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">KRA</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Modified</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row) => (
                                <tr key={row.name} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" onClick={() => handleEdit(row)}>
                                            {row.name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {row.is_group ? <span className="text-gray-400 mr-1">📁</span> : null}
                                        {row.goal_name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{row.employee_name || row.employee || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[11px] uppercase font-medium ${statusColor(row.status)}`}>{row.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{
                                                    width: `${Math.min(row.progress || 0, 100)}%`,
                                                    backgroundColor: (row.progress || 0) >= 100 ? '#22C55E' : (row.progress || 0) >= 50 ? '#3B82F6' : '#F59E0B'
                                                }} />
                                            </div>
                                            <span className="text-xs text-gray-500">{row.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{row.kra || '-'}</td>
                                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(row.modified)}</td>
                                    <td className="px-4 py-3">
                                        <button className="text-blue-600 hover:underline text-xs mr-3" onClick={() => handleEdit(row)}>Edit</button>
                                        <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(row.name)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && (
                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                    <span>Total: {data.length} (Showing {filtered.length})</span>
                    <span>Source: ERPNext → {API_BASE}</span>
                </div>
            )}
        </div>
    );
}
