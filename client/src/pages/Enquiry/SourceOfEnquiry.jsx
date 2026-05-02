import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiArrowLeft, FiSave, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Firebase collection path
const SOURCE_PATH = 'schooler_system/enquiry_management/source_of_enquiry';

const InputField = ({ label, value, required = false, onChange, placeholder = '', disabled = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-gray-50' : 'bg-white'}`}
        />
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], placeholder = 'Select', disabled = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all bg-white ${disabled ? 'bg-gray-50' : 'bg-white'}`}
        >
            <option value="">{placeholder}</option>
            {options.map((opt, i) => (
                <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
        </select>
    </div>
);

export default function SourceOfEnquiry() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const initFormData = {
        sourceName: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(initFormData);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            if (editingRecord) {
                setFormData({
                    sourceName: editingRecord.sourceName || '',
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
            const colRef = collection(db, SOURCE_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const sources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(sources);
        } catch (err) {
            console.error('Fetch Source failed:', err);
            try {
                const colRef = collection(db, SOURCE_PATH);
                const snapshot = await getDocs(colRef);
                const sources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(sources);
            } catch (err2) {
                setData([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.sourceName) {
            notification.warning({ message: 'Source Name is required' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, SOURCE_PATH);
            if (editingRecord) {
                const docRef = doc(db, SOURCE_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Source updated successfully' });
            } else {
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Source created successfully' });
            }
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete source "${record.sourceName}"?`)) return;
        try {
            const docRef = doc(db, SOURCE_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: 'Source deleted' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter(d => (d.sourceName || '').toLowerCase().includes(term));
    }, [data, searchQuery]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-2xl mx-auto pb-24 text-gray-800 font-inter">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {editingRecord ? `Edit Source: ${editingRecord.sourceName}` : 'New Source Of Enquiry'}
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <InputField
                        label="Source Name"
                        value={formData.sourceName}
                        required
                        onChange={(v) => setFormData(p => ({ ...p, sourceName: v }))}
                        placeholder="eg. Social Media, Radio, Event"
                    />
                    <SelectField
                        label="Status"
                        value={formData.status}
                        required
                        options={['Active', 'Inactive']}
                        onChange={(v) => setFormData(p => ({ ...p, status: v }))}
                    />

                    <div className="flex gap-3 pt-4">
                        <button
                            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? <Spin size="small" /> : <FiSave className="w-4 h-4" />} Save
                        </button>
                        <button
                            className="px-8 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-200 transition-all"
                            onClick={() => setView('list')}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Source Of Enquiry</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Enquiry</span> / <span className="text-blue-600 font-bold">Source Of Enquiry</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiDownload className="w-4 h-4" /> Export
                    </button>
                    <button onClick={() => { setEditingRecord(null); setView('form'); }} className="px-5 py-2 bg-[#8C3A3A] text-white rounded-lg text-sm font-bold hover:bg-[#732929] transition-all shadow-lg shadow-black/10 flex items-center gap-2">
                        <FiPlus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search sources..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL SOURCES
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Source Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[11px] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic font-medium">No matching sources found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => { setEditingRecord(row); setView('form'); }}>
                                        <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{row.sourceName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingRecord(row); setView('form'); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"><FiTrash2 className="w-4 h-4" /></button>
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
