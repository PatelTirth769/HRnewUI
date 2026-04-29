import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiPlus } from 'react-icons/fi';

// Firebase collection path: schooler_system/transport_management/bus_stops
const BUS_STOPS_PATH = 'schooler_system/transport_management/bus_stops';

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
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value !== undefined && value !== null ? value : ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={disabled}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], disabled = false }) => (
    <div>
        <label className="block text-[13px] text-gray-500 mb-1 font-medium">
            {label} {required && <span className="text-[#E02424]">*</span>}
        </label>
        <select
            className={`w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none ${disabled ? 'bg-gray-50 text-gray-700' : 'focus:border-blue-400 bg-white shadow-sm transition-colors'}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            <option value="">Select an option</option>
            {options.map((opt) => (
                <option key={opt.value || opt} value={opt.value || opt}>
                    {opt.label || opt}
                </option>
            ))}
        </select>
    </div>
);

export default function AddBusStop() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const initFormData = {
        bus_stop: '',
        fee_component: '',
        fee_cycle: '',
        no_of_periods: '',
        discontinue_academic_year: '',
        range_name: '',
        total_amount: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(initFormData);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            if (editingRecord) {
                // Load form data from existing record
                setFormData({
                    bus_stop: editingRecord.bus_stop || '',
                    fee_component: editingRecord.fee_component || '',
                    fee_cycle: editingRecord.fee_cycle || '',
                    no_of_periods: editingRecord.no_of_periods || '',
                    discontinue_academic_year: editingRecord.discontinue_academic_year || '',
                    range_name: editingRecord.range_name || '',
                    total_amount: editingRecord.total_amount || '',
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
            const colRef = collection(db, BUS_STOPS_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const busStops = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(busStops);
        } catch (err) {
            console.error('Fetch Bus Stops failed:', err);
            // If orderBy fails (no index), fetch without ordering
            try {
                const colRef = collection(db, BUS_STOPS_PATH);
                const snapshot = await getDocs(colRef);
                const busStops = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(busStops);
            } catch (err2) {
                console.error('Fetch Bus Stops fallback failed:', err2);
                setData([]);
            }
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
        if (!formData.bus_stop) {
            notification.warning({ message: 'Bus Stop Name is required' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, BUS_STOPS_PATH);

            if (editingRecord) {
                // Update existing document
                const docRef = doc(db, BUS_STOPS_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Bus Stop "${formData.bus_stop}" updated successfully!` });
            } else {
                // Create new document
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Bus Stop "${formData.bus_stop}" created successfully!` });
            }

            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Save Failed', description: err?.message || 'Could not save bus stop' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete bus stop "${record.bus_stop || record.id}"?`)) return;
        try {
            const docRef = doc(db, BUS_STOPS_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: `Bus Stop deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err?.message || 'Delete operation failed' });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => 
            (d.bus_stop || '').toLowerCase().includes(term) ||
            (d.fee_component || '').toLowerCase().includes(term) ||
            (d.status || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-5xl mx-auto pb-24 text-gray-800">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600" 
                            onClick={() => setView('list')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-inter">
                                {editingRecord ? `Edit Bus Stop: ${editingRecord.bus_stop || editingRecord.id}` : 'New Bus Stop'}
                            </h1>
                            {!editingRecord && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-bold uppercase tracking-wider ring-1 ring-orange-100">
                                    Not Saved
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className="px-8 py-2.5 bg-[#1C1F26] text-white font-semibold rounded-lg shadow-sm hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </div>
                        ) : 'Save'}
                    </button>
                </div>

                <Spin spinning={loading}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField
                                label="Bus Stop"
                                value={formData.bus_stop}
                                required
                                onChange={(v) => setFormData(p => ({ ...p, bus_stop: v }))}
                                placeholder="eg. Main Square"
                            />
                            
                            <InputField
                                label="Fee Component"
                                value={formData.fee_component}
                                onChange={(v) => setFormData(p => ({ ...p, fee_component: v }))}
                                placeholder="eg. Transport Fee"
                            />

                            <InputField
                                label="Fee Cycle"
                                value={formData.fee_cycle}
                                onChange={(v) => setFormData(p => ({ ...p, fee_cycle: v }))}
                                placeholder="eg. Monthly"
                            />

                            <InputField
                                label="No. of Period(s)"
                                type="number"
                                value={formData.no_of_periods}
                                onChange={(v) => setFormData(p => ({ ...p, no_of_periods: v }))}
                                placeholder="0"
                            />

                            <InputField
                                label="Discontinue Academic Year"
                                value={formData.discontinue_academic_year}
                                onChange={(v) => setFormData(p => ({ ...p, discontinue_academic_year: v }))}
                                placeholder="eg. 2025-26"
                            />

                            <InputField
                                label="Range Name"
                                value={formData.range_name}
                                onChange={(v) => setFormData(p => ({ ...p, range_name: v }))}
                                placeholder="eg. Zone A"
                            />

                            <InputField
                                label="Total Amount"
                                type="number"
                                value={formData.total_amount}
                                onChange={(v) => setFormData(p => ({ ...p, total_amount: v }))}
                                placeholder="0.00"
                            />

                            <SelectField
                                label="Status"
                                value={formData.status}
                                required
                                options={['Active', 'Inactive']}
                                onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                            />
                        </div>
                    </div>
                </Spin>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight font-inter">Add Bus Stop</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage bus stop locations, fee components, and cycles</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-5 py-2.5 bg-white text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <button className="px-5 py-2.5 bg-white text-gray-700 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                        Export
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <button
                        className="px-6 py-2.5 bg-[#8C3A3A] text-white rounded-lg text-[13px] font-bold hover:bg-[#732929] shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center gap-2"
                        onClick={handleNew}
                    >
                        <FiPlus className="w-4 h-4" />
                        Add New
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search bus stops..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL BUS STOPS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Bus Stop</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Fee Component</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Fee Cycle</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-center">No. of Period(s)</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Discontinue Academic Year</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Range Name</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Total Amount</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#8C3A3A] rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400">Fetching records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center bg-gray-50/30">
                                        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">No matching records found</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 group transition-all cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {(row.bus_stop || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                                    {row.bus_stop || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.fee_component || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.fee_cycle || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {row.no_of_periods || '0'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.discontinue_academic_year || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.range_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ₹{parseFloat(row.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {row.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    className="px-3 py-1.5 text-[12px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="px-3 py-1.5 text-[12px] font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                                >
                                                    Delete
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
