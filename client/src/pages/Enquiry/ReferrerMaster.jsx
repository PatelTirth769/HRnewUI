import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiSave } from 'react-icons/fi';

const REFERRER_PATH = 'schooler_system/enquiry_management/referrer_master';

export default function ReferrerMaster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [referrerName, setReferrerName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const colRef = collection(db, REFERRER_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const referrers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(referrers);
        } catch (err) {
            console.error('Fetch Referrer failed:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!referrerName.trim()) {
            notification.warning({ message: 'Input Required', description: 'Please enter Reference Person Name.' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, REFERRER_PATH);
            if (editingRecord) {
                const docRef = doc(db, REFERRER_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    name: referrerName,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Referrer updated successfully' });
            } else {
                await addDoc(colRef, {
                    name: referrerName,
                    status: 'Active',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Referrer created successfully' });
            }
            setIsModalOpen(false);
            setReferrerName('');
            setEditingRecord(null);
            fetchData();
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete "${record.name}"?`)) return;
        try {
            const docRef = doc(db, REFERRER_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: 'Deleted successfully' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const openModal = (record = null) => {
        if (record) {
            setEditingRecord(record);
            setReferrerName(record.name);
        } else {
            setEditingRecord(null);
            setReferrerName('');
        }
        setIsModalOpen(true);
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter(d => (d.name || '').toLowerCase().includes(term));
    }, [data, searchQuery]);

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Referrer Master</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Enquiry</span> / <span className="text-blue-600 font-bold">Referrer Master</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiDownload className="w-4 h-4" /> Export
                    </button>
                    <button onClick={() => openModal()} className="px-5 py-2 bg-[#8C3A3A] text-white rounded-lg text-sm font-bold hover:bg-[#732929] transition-all shadow-lg shadow-black/10 flex items-center gap-2">
                        <FiPlus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search referrers..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL REFERRERS
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[11px]">Reference Person Name</th>
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
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic font-medium font-inter">No matching records found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{row.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => openModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={<div className="flex items-center gap-2 text-white"><FiPlus /> {editingRecord ? 'Edit Reference Person' : 'Add Reference Person'}</div>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                closeIcon={<span className="text-white hover:text-gray-200">×</span>}
                className="referrer-modal"
            >
                <div className="p-6 space-y-6 bg-white">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700">Reference Person Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={referrerName}
                            onChange={(e) => setReferrerName(e.target.value)}
                            placeholder="Enter Reference Person Name"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                        >
                            {saving ? <Spin size="small" /> : <FiSave className="w-4 h-4" />} {editingRecord ? 'Update' : 'Create'}
                        </button>
                        <button
                            onClick={() => { setReferrerName(''); }}
                            className="px-8 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .referrer-modal .ant-modal-content { padding: 0; overflow: hidden; border-radius: 12px; }
                .referrer-modal .ant-modal-header { background: #565e7d; padding: 16px 24px; margin-bottom: 0; }
                .referrer-modal .ant-modal-title { color: white !important; font-weight: 700; font-family: 'Inter', sans-serif; }
                .referrer-modal .ant-modal-close { color: white !important; top: 16px; }
            `}} />
        </div>
    );
}
