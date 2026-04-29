import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiPlus } from 'react-icons/fi';

// Firebase collection path: schooler_system/transport_management/vehicles
const VEHICLES_PATH = 'schooler_system/transport_management/vehicles';

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

export default function AddVehicle() {
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const initFormData = {
        vehicle_number: '',
        url_for_tracking: '',
        location: '',
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
                    vehicle_number: editingRecord.vehicle_number || '',
                    url_for_tracking: editingRecord.url_for_tracking || '',
                    location: editingRecord.location || '',
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
            const colRef = collection(db, VEHICLES_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const vehicles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(vehicles);
        } catch (err) {
            console.error('Fetch Vehicles failed:', err);
            // If orderBy fails (no index), fetch without ordering
            try {
                const colRef = collection(db, VEHICLES_PATH);
                const snapshot = await getDocs(colRef);
                const vehicles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(vehicles);
            } catch (err2) {
                console.error('Fetch Vehicles fallback failed:', err2);
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
        if (!formData.vehicle_number) {
            notification.warning({ message: 'Vehicle Number is required' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, VEHICLES_PATH);

            if (editingRecord) {
                // Update existing document
                const docRef = doc(db, VEHICLES_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Vehicle "${formData.vehicle_number}" updated successfully!` });
            } else {
                // Create new document
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: `Vehicle "${formData.vehicle_number}" created successfully!` });
            }

            setView('list');
            setEditingRecord(null);
        } catch (err) {
            console.error('Save failed:', err);
            notification.error({ message: 'Save Failed', description: err?.message || 'Could not save vehicle' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete vehicle "${record.vehicle_number || record.id}"?`)) return;
        try {
            const docRef = doc(db, VEHICLES_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: `Vehicle deleted successfully!` });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err?.message || 'Delete operation failed' });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter((d) => 
            (d.vehicle_number || '').toLowerCase().includes(term) ||
            (d.location || '').toLowerCase().includes(term) ||
            (d.status || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-4xl mx-auto pb-24 text-gray-800">
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
                                {editingRecord ? `Edit Vehicle: ${editingRecord.vehicle_number || editingRecord.id}` : 'New Vehicle'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Vehicle Number"
                                value={formData.vehicle_number}
                                required
                                onChange={(v) => setFormData(p => ({ ...p, vehicle_number: v }))}
                                placeholder="eg. MH-12-AB-3456"
                            />
                            
                            <SelectField
                                label="Status"
                                value={formData.status}
                                required
                                options={['Active', 'Inactive', 'Maintenance']}
                                onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                            />

                            <InputField
                                label="Location"
                                value={formData.location}
                                onChange={(v) => setFormData(p => ({ ...p, location: v }))}
                                placeholder="eg. Main Campus Garage"
                            />

                            <div className="md:col-span-2">
                                <InputField
                                    label="Url For Tracking"
                                    value={formData.url_for_tracking}
                                    onChange={(v) => setFormData(p => ({ ...p, url_for_tracking: v }))}
                                    placeholder="https://"
                                />
                            </div>
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
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight font-inter">Add Vehicle</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Manage transport vehicles, GPS tracking, and statuses</p>
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
                            placeholder="Search vehicles..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL VEHICLES
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Vehicle Number</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Url For Tracking</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Location</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100">Status</th>
                                <th className="px-6 py-4 font-bold text-[11px] text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#8C3A3A] rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400">Fetching records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center bg-gray-50/30">
                                        <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">No matching records found</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 group transition-all cursor-pointer" onClick={() => handleEdit(row)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {(row.vehicle_number || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors">
                                                    {row.vehicle_number || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-blue-600 max-w-[200px] truncate">
                                            {row.url_for_tracking ? (
                                                <a href={row.url_for_tracking} target="_blank" rel="noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                                    {row.url_for_tracking}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {row.location || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : row.status === 'Inactive' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
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
