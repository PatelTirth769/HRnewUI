import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const InputField = ({ label, value, required = false, onChange, type = "text", disabled = false, placeholder }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none transition-colors ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-blue-500 bg-white shadow-sm text-gray-800 hover:border-gray-300'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const PayrollPeriod = () => {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Masters
    const [companies, setCompanies] = useState([]);
    const [mastersLoaded, setMastersLoaded] = useState(false);

    // Form states
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    const defaultForm = {
        name: '',
        company: '',
        start_date: '',
        end_date: ''
    };
    const [formData, setFormData] = useState({ ...defaultForm });

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(
                '/api/resource/Payroll Period?fields=["name","company","start_date","end_date"]&limit_page_length=None&order_by=modified desc'
            );
            if (res.data.data) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Fetch list failed:', err);
            notification.error({ message: 'Failed to load Payroll Periods' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        if (mastersLoaded) return;
        try {
            const compRes = await API.get('/api/resource/Company?limit_page_length=None');
            if (compRes.data.data) setCompanies(compRes.data.data.map(c => c.name));
            setMastersLoaded(true);
        } catch (err) {
            console.error('Fetch masters failed:', err);
        }
    };

    const fetchSingle = async (name) => {
        try {
            const res = await API.get(`/api/resource/Payroll Period/${encodeURIComponent(name)}`);
            if (res.data.data) {
                setFormData({ ...defaultForm, ...res.data.data });
            }
        } catch (err) {
            console.error('Fetch single failed:', err);
            notification.error({ message: 'Failed to load record details' });
        }
    };

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    // --- FORM ACTIONS ---
    const handleNew = () => {
        setEditingRecord(null);
        setFormData({ ...defaultForm });
        setView('form');
    };

    const handleEdit = (row) => {
        setEditingRecord(row);
        setFormData({ ...defaultForm, name: row.name }); // temp before fetch
        setView('form');
        fetchSingle(row.name);
    };

    const handleSave = async () => {
        if (!formData.name && !editingRecord) {
            notification.warning({ message: 'Name is required' });
            return;
        }
        if (!formData.company) {
            notification.warning({ message: 'Company is required' });
            return;
        }
        if (!formData.start_date) {
            notification.warning({ message: 'Start Date is required' });
            return;
        }
        if (!formData.end_date) {
            notification.warning({ message: 'End Date is required' });
            return;
        }

        setSaving(true);
        try {
            let payload = { ...formData };
            if (payload.start_date) payload.start_date = payload.start_date.split('T')[0];
            if (payload.end_date) payload.end_date = payload.end_date.split('T')[0];

            if (editingRecord) {
                delete payload.name;
                const res = await API.put(`/api/resource/Payroll Period/${encodeURIComponent(editingRecord.name)}`, payload);
                if (res.data.data) {
                    notification.success({ message: 'Payroll Period Updated' });
                    setFormData({ ...defaultForm, ...res.data.data });
                    fetchData();
                    setView('list');
                }
            } else {
                const res = await API.post('/api/resource/Payroll Period', payload);
                if (res.data.data) {
                    notification.success({ message: 'Payroll Period Created', description: res.data.data.name });
                    fetchData();
                    setView('list');
                }
            }
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Failed to save record', description: err.response?.data?.exception || err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Are you sure you want to delete ${row.name}?`)) return;
        try {
            await API.delete(`/api/resource/Payroll Period/${encodeURIComponent(row.name)}`);
            notification.success({ message: 'Record deleted' });
            fetchData();
        } catch (err) {
            console.error('Delete failed:', err);
            notification.error({ message: 'Failed to delete record' });
        }
    };

    const updateField = (k, v) => setFormData(p => ({ ...p, [k]: v }));


    // --- RENDER ---
    if (view === 'form') {
        const isNew = !editingRecord;
        return (
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-gray-800 transition-colors p-1" onClick={() => setView('list')}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
                            {isNew ? 'New Payroll Period' : formData.name}
                        </h1>
                        {isNew && <span className="text-[13px] px-2.5 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600">Not Saved</span>}
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white text-gray-700 text-[14px] font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm" onClick={() => setView('list')}>Cancel</button>
                        <button className="px-6 py-2 bg-gray-900 text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm disabled:opacity-50" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                            {/* Column 1 */}
                            <div className="space-y-6">
                                <InputField label="Name" value={formData.name} required onChange={(v) => updateField('name', v)} disabled={!isNew} />
                                <div>
                                    <label className="block text-[13px] text-gray-500 mb-1.5">Company <span className="text-red-400">*</span></label>
                                    <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white shadow-sm text-gray-800 hover:border-gray-300 transition-colors"
                                        value={formData.company || ''} onChange={(e) => updateField('company', e.target.value)}>
                                        <option value=""></option>
                                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-6">
                                <InputField label="Start Date" type="date" value={formData.start_date ? formData.start_date.split('T')[0] : ''} required onChange={(v) => updateField('start_date', v)} />
                                <InputField label="End Date" type="date" value={formData.end_date ? formData.end_date.split('T')[0] : ''} required onChange={(v) => updateField('end_date', v)} />
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
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Payroll Period</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-[14px] font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors" onClick={fetchData}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-[14px] font-medium hover:bg-black shadow-sm transition-colors" onClick={handleNew}>
                        + Add Payroll Period
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-3.5 font-medium">Name</th>
                                <th className="px-6 py-3.5 font-medium">Company</th>
                                <th className="px-6 py-3.5 font-medium">Start Date</th>
                                <th className="px-6 py-3.5 font-medium">End Date</th>
                                <th className="px-6 py-3.5 font-medium w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">No Payroll Periods found</td></tr>
                            ) : (
                                data.map(row => (
                                    <tr key={row.name} className="hover:bg-gray-50 group cursor-pointer transition-colors" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-3.5 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{row.company || '-'}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{row.start_date || '-'}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{row.end_date || '-'}</td>
                                        <td className="px-6 py-3.5 flex items-center h-full">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-[13px] mr-2 px-1 py-1 rounded hover:bg-blue-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>Edit</button>
                                            <button className="text-[#E02424] hover:text-red-800 font-medium text-[13px] px-1 py-1 rounded hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>Delete</button>
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

export default PayrollPeriod;
