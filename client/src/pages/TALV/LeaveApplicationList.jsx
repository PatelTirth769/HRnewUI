import React, { useState, useEffect } from 'react';
import { Table, Button, Space, notification, Popconfirm, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LeaveApplicationList = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/resource/Leave Application?fields=["name","employee","employee_name","leave_type","from_date","to_date","status","total_leave_days"]&order_by=creation desc&limit_page_length=None');
            if (response.data && response.data.data) {
                setLeaves(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leave applications:", error);
            notification.error({ message: "Failed to fetch leave applications" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await api.delete(`/api/resource/Leave Application/${encodeURIComponent(name)}`);
            notification.success({ message: "Leave Application deleted successfully" });
            fetchLeaves();
        } catch (error) {
            console.error("Error deleting leave application:", error);
            notification.error({ message: "Failed to delete leave application" });
        }
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.employee_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        leave.leave_type?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'employee_name',
            key: 'employee_name',
            render: (text, record) => (
                <div>
                    <div className="font-medium">{text}</div>
                    <div className="text-xs text-gray-500">{record.employee}</div>
                </div>
            )
        },
        {
            title: 'Leave Type',
            dataIndex: 'leave_type',
            key: 'leave_type',
        },
        {
            title: 'From Date',
            dataIndex: 'from_date',
            key: 'from_date',
        },
        {
            title: 'To Date',
            dataIndex: 'to_date',
            key: 'to_date',
        },
        {
            title: 'Total Days',
            dataIndex: 'total_leave_days',
            key: 'total_leave_days',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'bg-gray-100 text-gray-800';
                if (status === 'Approved') color = 'bg-green-100 text-green-800';
                if (status === 'Rejected') color = 'bg-red-100 text-red-800';
                if (status === 'Open') color = 'bg-blue-100 text-blue-800';
                return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-blue-600" />}
                        onClick={() => navigate(`/talv/leave-application/edit/${record.name}`)}
                    />
                    <Popconfirm
                        title="Are you sure delete this leave application?"
                        onConfirm={() => handleDelete(record.name)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="text" icon={<DeleteOutlined className="text-red-600" />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <nav className="text-xs text-gray-500 mb-1">HOME {'>'} TA & LV {'>'} LEAVE APPLICATION</nav>
                        <h1 className="text-2xl font-bold text-gray-800">Leave Applications</h1>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/talv/leave-application/new')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        New Application
                    </Button>
                </div>

                <div className="mb-4 flex items-center gap-2 max-w-md">
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search by Employee or Leave Type"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredLeaves}
                    rowKey="name"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    );
};

export default LeaveApplicationList;
