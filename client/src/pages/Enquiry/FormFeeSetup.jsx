import React, { useState, useEffect } from 'react';
import { notification, Spin, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiRefreshCw, FiDollarSign } from 'react-icons/fi';

const PATH = 'schooler_system/enquiry_management/form_fee_setup';

export default function FormFeeSetup() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const [formData, setFormData] = useState({
        feeType: '',
        feeName: '',
        academicYear: '2025-2026',
        amount: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Fetch Fee Setup failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.feeType || !formData.feeName) {
            notification.warning({ message: 'Missing Fields', description: 'Please enter fee type and name.' });
            return;
        }

        setSaving(true);
        try {
            if (editingRecord) {
                await updateDoc(doc(db, PATH, editingRecord.id), { ...formData, updated_at: serverTimestamp() });
                notification.success({ message: 'Fee Updated' });
            } else {
                await addDoc(collection(db, PATH), { ...formData, created_at: serverTimestamp(), updated_at: serverTimestamp() });
                notification.success({ message: 'Fee Added' });
            }
            setModalVisible(false);
            fetchData();
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this fee setup?')) return;
        try {
            await deleteDoc(doc(db, PATH, id));
            notification.success({ message: 'Deleted Successfully' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed' });
        }
    };

    return (
        <div className="p-6 max-w-[1200px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Form Fees</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Admission</span> / <span>Form Fee Setup</span> / <span className="text-blue-600 font-bold">Form Fees</span>
                    </div>
                </div>
                <button 
                    onClick={() => { setEditingRecord(null); setFormData({ feeType: '', feeName: '', academicYear: '2025-2026', amount: '', status: 'Active' }); setModalVisible(true); }}
                    className="px-5 py-2 bg-[#8C3A3A] text-white rounded-lg text-sm font-black hover:bg-[#732929] transition-all shadow-lg flex items-center gap-2 active:scale-95"
                >
                    <FiPlus /> Add New
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Fee Name</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Fee Type</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Fee Setup</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center"><Spin /></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic font-inter">No matching records found</td></tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900">{row.feeName}</td>
                                    <td className="px-6 py-4 font-medium text-gray-600">{row.feeType}</td>
                                    <td className="px-6 py-4 font-black text-blue-600">₹ {row.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { 
                                                    setEditingRecord(row); 
                                                    setFormData({
                                                        feeType: row.feeType || '',
                                                        feeName: row.feeName || '',
                                                        academicYear: row.academicYear || '2025-2026',
                                                        amount: row.amount || '',
                                                        status: row.status || 'Active'
                                                    }); 
                                                    setModalVisible(true); 
                                                }} 
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(row.id)} 
                                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                title={<div className="flex items-center gap-2 text-lg font-black text-gray-800"><FiPlus className="text-blue-600" /> {editingRecord ? 'Edit Form Fee' : 'Add Form Fee'}</div>}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
                centered
                closeIcon={<FiX className="text-gray-400 hover:text-gray-600" />}
            >
                <div className="space-y-6 py-6 border-t border-gray-100 mt-2">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-gray-700">Fee Type <span className="text-red-500">*</span></label>
                            <select 
                                value={formData.feeType} 
                                onChange={(e) => setFormData({...formData, feeType: e.target.value})}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="">Select Fee Type</option>
                                <option value="Registration">Registration</option>
                                <option value="Admission">Admission</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-gray-700">Fee Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                placeholder="Enter Fee Name"
                                value={formData.feeName}
                                onChange={(e) => setFormData({...formData, feeName: e.target.value})}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-gray-700">Amount (₹)</label>
                            <input 
                                type="number" 
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-gray-700">Academic Year</label>
                            <select 
                                value={formData.academicYear} 
                                onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="2025-2026">2025-2026</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-gray-700">Status</label>
                            <select 
                                value={formData.status} 
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-start gap-3 mt-8">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Spin size="small" /> : 'Save'}
                        </button>
                        <button 
                            onClick={() => setModalVisible(false)}
                            className="px-8 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
