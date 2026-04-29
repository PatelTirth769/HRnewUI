import React, { useState, useEffect } from 'react';
import { notification, Table, Button, Select, Modal, Tag, Switch } from 'antd';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiCheck, FiX, FiSettings, FiToggleLeft } from 'react-icons/fi';
import dayjs from 'dayjs';

const CONFIG_PATH = 'schooler_system/transport_management/configurations';

export default function TransportConfiguration() {
    const [loading, setLoading] = useState(false);
    const [configs, setConfigs] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        fee_point_mode: 'Base On Pick Up Point',
        transport_fee_mode: 'Base On Fee Cycle',
        status: 'Active'
    });

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, CONFIG_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConfigs(data);
        } catch (error) {
            notification.error({ message: 'Error fetching configurations' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const resetForm = () => {
        setFormData({
            fee_point_mode: 'Base On Pick Up Point',
            transport_fee_mode: 'Base On Fee Cycle',
            status: 'Active'
        });
        setEditingId(null);
        setIsFormVisible(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (editingId) {
                const docRef = doc(db, CONFIG_PATH, editingId);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp(),
                    updated_by: 'School Admin'
                });
                notification.success({ message: 'Configuration updated successfully' });
            } else {
                await addDoc(collection(db, CONFIG_PATH), {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                    created_by: 'School Admin',
                    updated_by: 'School Admin'
                });
                notification.success({ message: 'Configuration added successfully' });
            }
            resetForm();
            fetchConfigs();
        } catch (error) {
            notification.error({ message: 'Error saving configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Delete Configuration',
            content: 'Are you sure you want to delete this setting?',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deleteDoc(doc(db, CONFIG_PATH, id));
                    notification.success({ message: 'Configuration deleted' });
                    fetchConfigs();
                } catch (error) {
                    notification.error({ message: 'Delete failed' });
                }
            }
        });
    };

    const columns = [
        {
            title: 'Fee Point Mode',
            dataIndex: 'fee_point_mode',
            key: 'fee_point_mode',
            render: (text) => <span className="font-bold text-gray-800">{text}</span>
        },
        {
            title: 'Transport Fee Mode',
            dataIndex: 'transport_fee_mode',
            key: 'transport_fee_mode',
            render: (text) => <Tag color="blue" className="rounded-full px-4 font-bold border-none">{text}</Tag>
        },
        {
            title: 'Created By',
            dataIndex: 'created_by',
            key: 'created_by',
            render: (text) => <span className="text-gray-500 font-medium">{text || 'Admin'}</span>
        },
        {
            title: 'Created Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => <span className="text-gray-400 text-xs">{date ? dayjs(date.toDate()).format('DD/MM/YYYY HH:mm') : '-'}</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Active' ? 'green' : 'red'} className="rounded-md font-black uppercase text-[10px] border-none shadow-sm">
                    {status}
                </Tag>
            )
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
                            setFormData({
                                fee_point_mode: record.fee_point_mode,
                                transport_fee_mode: record.transport_fee_mode,
                                status: record.status
                            });
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
                        <span className="text-blue-600 font-black">School Transport Configuration</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100">
                            <FiSettings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">School Transport Configuration</h1>
                            <p className="text-gray-500 font-medium mt-1">Define global billing and calculation rules for transport fees.</p>
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
                        Add New
                    </Button>
                )}
            </div>

            {/* Form Section */}
            {isFormVisible && (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] p-10 mb-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl -z-1"></div>
                    
                    <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                        {editingId ? 'Modify Configuration' : 'Create Configuration'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Fee Point Mode <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                className="w-full h-12"
                                value={formData.fee_point_mode}
                                onChange={val => setFormData({...formData, fee_point_mode: val})}
                            >
                                <Select.Option value="Base On Pick Up Point">Base On Pick Up Point</Select.Option>
                                <Select.Option value="Base On Distance">Base On Distance/Range</Select.Option>
                                <Select.Option value="Fixed Rate">Fixed Rate</Select.Option>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Transport Fee Mode <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                className="w-full h-12"
                                value={formData.transport_fee_mode}
                                onChange={val => setFormData({...formData, transport_fee_mode: val})}
                            >
                                <Select.Option value="Base On Fee Cycle">Base On Fee Cycle</Select.Option>
                                <Select.Option value="Monthly">Monthly</Select.Option>
                                <Select.Option value="Quarterly">Quarterly</Select.Option>
                                <Select.Option value="Annual">Annual</Select.Option>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                className="w-full h-12"
                                value={formData.status}
                                onChange={val => setFormData({...formData, status: val})}
                            >
                                <Select.Option value="Active">Active</Select.Option>
                                <Select.Option value="Inactive">Inactive</Select.Option>
                            </Select>
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
                            {editingId ? 'Update Configuration' : 'Save Configuration'}
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
                    dataSource={configs} 
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
