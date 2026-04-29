import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, TimePicker } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiPlus, FiClock, FiTrash2, FiEdit3, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import dayjs from 'dayjs';

// Firebase collection path: schooler_system/transport_management/punch_timings
const PUNCH_TIMINGS_PATH = 'schooler_system/transport_management/punch_timings';

const InputField = ({
    label,
    value,
    required = false,
    onChange,
    type = 'text',
    disabled = false,
    placeholder = ''
}) => (
    <div>
        <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white shadow-sm font-medium text-gray-900'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false }) => (
    <div>
        <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all appearance-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white shadow-sm font-medium text-gray-900'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
        >
            <option value="">Select status</option>
            {options.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt}>
                    {opt.label || opt}
                </option>
            ))}
        </select>
    </div>
);

export default function SetPunchTiming() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const initFormData = {
        punch_shift: '',
        short_code: '',
        start_time: '08:00',
        end_time: '14:00',
        status: 'Active'
    };

    const [formData, setFormData] = useState(initFormData);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            if (editingRecord) {
                setFormData({
                    punch_shift: editingRecord.punch_shift || '',
                    short_code: editingRecord.short_code || '',
                    start_time: editingRecord.start_time || '08:00',
                    end_time: editingRecord.end_time || '14:00',
                    status: editingRecord.status || 'Active'
                });
            } else {
                setFormData(initFormData);
            }
        }
    }, [view, editingRecord]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const colRef = collection(db, PUNCH_TIMINGS_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(results);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Error fetching records' });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingRecord(null);
        setFormData(initFormData);
        setView('form');
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setView('form');
    };

    const handleSave = async () => {
        if (!formData.punch_shift || !formData.short_code) {
            notification.warning({ message: 'Shift Name and Short Code are required' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, PUNCH_TIMINGS_PATH);

            if (editingRecord) {
                const docRef = doc(db, PUNCH_TIMINGS_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Shift "${formData.punch_shift}" updated!` });
            } else {
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Shift "${formData.punch_shift}" created!` });
            }

            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Save Failed', description: err?.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Delete shift "${record.punch_shift}"?`)) return;
        try {
            const docRef = doc(db, PUNCH_TIMINGS_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: `Shift deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed' });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => 
            (d.punch_shift || '').toLowerCase().includes(term) ||
            (d.short_code || '').toLowerCase().includes(term) ||
            (d.status || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-8 max-w-4xl mx-auto pb-40">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        <button 
                            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all text-gray-400 hover:text-gray-600 shadow-sm"
                            onClick={() => setView('list')}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight font-inter">
                                {editingRecord ? 'Edit Shift Timing' : 'New Shift Timing'}
                            </h1>
                            <p className="text-gray-500 font-medium text-sm mt-0.5">Define shift names and punch operation windows</p>
                        </div>
                    </div>
                    <button
                        className="px-10 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FiClock className="w-5 h-5" />}
                        {saving ? 'Saving...' : 'Save Timing'}
                    </button>
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 p-10 shadow-2xl shadow-black/[0.02] space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputField
                            label="Punch Shift Name"
                            value={formData.punch_shift}
                            required
                            onChange={(v) => setFormData(p => ({ ...p, punch_shift: v }))}
                            placeholder="eg. Morning Shift"
                        />
                        
                        <InputField
                            label="Short Code"
                            value={formData.short_code}
                            required
                            onChange={(v) => setFormData(p => ({ ...p, short_code: v }))}
                            placeholder="eg. M1"
                        />

                        <div className="space-y-2">
                             <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider">Start Time</label>
                             <TimePicker 
                                className="w-full h-[46px] rounded-xl border-gray-200"
                                format="HH:mm"
                                value={dayjs(formData.start_time, 'HH:mm')}
                                onChange={(time, timeString) => setFormData(p => ({ ...p, start_time: timeString }))}
                                allowClear={false}
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider">End Time</label>
                             <TimePicker 
                                className="w-full h-[46px] rounded-xl border-gray-200"
                                format="HH:mm"
                                value={dayjs(formData.end_time, 'HH:mm')}
                                onChange={(time, timeString) => setFormData(p => ({ ...p, end_time: timeString }))}
                                allowClear={false}
                             />
                        </div>

                        <SelectField
                            label="Current Status"
                            value={formData.status}
                            required
                            options={['Active', 'Inactive']}
                            onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 max-w-[1500px] mx-auto pb-40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                        <span>Transport</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span className="text-blue-600">Set Punch Timing</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight font-inter">Set Punch Timing</h1>
                    <p className="text-gray-500 text-lg font-medium mt-2">Manage employee and student punch timings for transport</p>
                </div>
                <div className="flex gap-4">
                    <button
                        className="px-6 py-3.5 bg-white text-gray-700 font-bold rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                    <button
                        className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-black/10 hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                        onClick={handleNew}
                    >
                        <FiPlus className="w-6 h-6" />
                        Add New Shift
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search shifts or codes..."
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[12px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-4 py-2 rounded-full">
                        {filteredData.length} TOTAL SHIFTS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Punch Shift</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Short Code</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">Timing Window</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-center">Status</th>
                                <th className="px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Synergy in progress...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm bg-gray-50/10">
                                        No matching records found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/20 group transition-all cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    {(row.punch_shift || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                                                        {row.punch_shift || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-black uppercase tracking-widest border border-gray-200/50">
                                                {row.short_code || '-'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 font-bold text-gray-600 font-mono text-sm">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-blue-500" />
                                                <span>{row.start_time} - {row.end_time}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${row.status === 'Active' ? 'bg-green-100 text-green-700 shadow-sm shadow-green-200/50' : 'bg-gray-100 text-gray-600'}`}>
                                                {row.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                <button
                                                    className="w-10 h-10 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl bg-blue-50 transition-all font-bold shadow-sm shadow-blue-200"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                                    title="Edit Record"
                                                >
                                                    <FiEdit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    className="w-10 h-10 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white rounded-xl bg-red-50 transition-all font-bold shadow-sm shadow-red-200"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                                    title="Delete Record"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>
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
