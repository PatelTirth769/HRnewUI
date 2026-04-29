import React, { useState, useEffect } from 'react';
import { notification, Table, Button, Input, Modal, Spin } from 'antd';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import dayjs from 'dayjs';

const RANGE_PATH = 'schooler_system/transport_management/transport_ranges';

export default function TransportRange() {
    const [loading, setLoading] = useState(false);
    const [ranges, setRanges] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        range_km: '',
        academic_year: '2025-2026'
    });

    const fetchRanges = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, RANGE_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRanges(data);
        } catch (error) {
            notification.error({ message: 'Error fetching ranges' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanges();
    }, []);

    const resetForm = () => {
        setFormData({ range_km: '', academic_year: '2025-2026' });
        setEditingId(null);
        setIsFormVisible(false);
    };

    const handleSave = async () => {
        if (!formData.range_km) {
            notification.warning({ message: 'Please enter a range description (e.g., 0-5 KM)' });
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                const docRef = doc(db, RANGE_PATH, editingId);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp(),
                    updated_by: 'Shekharbhai' // Mock user from UI
                });
                notification.success({ message: 'Range updated successfully' });
            } else {
                await addDoc(collection(db, RANGE_PATH), {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                    created_by: 'Shekharbhai',
                    updated_by: 'Shekharbhai'
                });
                notification.success({ message: 'Range added successfully' });
            }
            resetForm();
            fetchRanges();
        } catch (error) {
            notification.error({ message: 'Error saving range' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete Range',
            content: 'Are you sure you want to delete this range? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deleteDoc(doc(db, RANGE_PATH, id));
                    notification.success({ message: 'Range deleted' });
                    fetchRanges();
                } catch (error) {
                    notification.error({ message: 'Delete failed' });
                }
            }
        });
    };

    const columns = [
        {
            title: 'Range (In Kilometer)',
            dataIndex: 'range_km',
            key: 'range_km',
            render: (text) => <span className="font-bold text-gray-800">{text}</span>
        },
        {
            title: 'Created By',
            dataIndex: 'created_by',
            key: 'created_by',
            render: (text) => <span className="text-gray-500 font-medium">{text || 'System'}</span>
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => <span className="text-gray-400 text-xs">{date ? dayjs(date.toDate()).format('DD-MM-YYYY HH:mm') : '-'}</span>
        },
        {
            title: 'Updated By',
            dataIndex: 'updated_by',
            key: 'updated_by',
            render: (text) => <span className="text-gray-500 font-medium">{text || '-'}</span>
        },
        {
            title: 'Updated Date',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date) => <span className="text-gray-400 text-xs">{date ? dayjs(date.toDate()).format('DD-MM-YYYY HH:mm') : '-'}</span>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <div className="flex gap-2">
                    <Button 
                        type="text" 
                        icon={<FiEdit2 className="text-blue-500" />} 
                        onClick={() => {
                            setEditingId(record.id);
                            setFormData({ range_km: record.range_km, academic_year: record.academic_year });
                            setIsFormVisible(true);
                        }}
                    />
                    <Button 
                        type="text" 
                        icon={<FiTrash2 className="text-red-500" />} 
                        onClick={() => handleDelete(record.id)}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto pb-40">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        <span>Home</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span>Transport</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span className="text-blue-600 font-black">Transport Range</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100">
                            <FiInfo className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Transport Range</h1>
                            <p className="text-gray-500 font-medium mt-1">Manage distance milestones for service optimization.</p>
                        </div>
                    </div>
                </div>

                {!isFormVisible && (
                    <Button 
                        type="primary" 
                        icon={<FiPlus />} 
                        onClick={() => setIsFormVisible(true)}
                        className="h-14 px-8 bg-blue-600 hover:bg-blue-700 border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200"
                    >
                        Add New Range
                    </Button>
                )}
            </div>

            {/* Form Section */}
            {isFormVisible && (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] p-10 mb-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-1"></div>
                    
                    <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                        {editingId ? 'Modify Range' : 'Register New Range'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Range (In Kilometer) <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                placeholder="e.g. 0-5 KM" 
                                className="h-12 rounded-xl"
                                value={formData.range_km}
                                onChange={e => setFormData({...formData, range_km: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-t border-gray-100 pt-10">
                        <Button 
                            type="primary"
                            icon={<FiCheck />}
                            onClick={handleSave}
                            loading={loading}
                            className="h-12 px-10 bg-green-600 hover:bg-green-700 border-none rounded-xl font-bold"
                        >
                            {editingId ? 'Update Range' : 'Save Range'}
                        </Button>
                        <Button 
                            type="text"
                            icon={<FiX />}
                            onClick={resetForm}
                            className="h-12 px-8 font-bold text-gray-400 hover:text-red-500 transition-colors"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-black/[0.01] overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={ranges} 
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    className="premium-table"
                />
            </div>

            <div className="mt-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                Powered by : Microweb Solutions ®
            </div>
        </div>
    );
}
