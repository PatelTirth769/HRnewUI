import React, { useState, useEffect } from 'react';
import { Table, Tag, notification, Space, Button } from 'antd';
import API from '../../services/api';

export default function ESSToDo({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (employeeData?.user_id) {
            fetchToDos();
        }
    }, [employeeData]);

    const fetchToDos = async () => {
        setLoading(true);
        try {
            // Fetch ToDos where the user is the owner or it's allocated to them
            const userId = employeeData.user_id;
            const res = await API.get(`/api/resource/ToDo?fields=["name","description","status","priority","date","reference_type","reference_name"]&filters=[["allocated_to","=","${userId}"]]&order_by=date desc`);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to load To Do items" });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (todoId, currentStatus) => {
        const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
        try {
            await API.put(`/api/resource/ToDo/${todoId}`, { status: newStatus });
            notification.success({ message: `To Do marked as ${newStatus}` });
            fetchToDos();
        } catch (err) {
            notification.error({ message: "Failed to update status" });
        }
    };

    const columns = [
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => <div dangerouslySetInnerHTML={{ __html: text }} />,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 120,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority) => {
                let color = 'blue';
                if (priority === 'High') color = 'red';
                if (priority === 'Medium') color = 'orange';
                return <Tag color={color}>{priority}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 'Open' ? 'processing' : 'success'}>
                    {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button size="small" onClick={() => handleStatusChange(record.name, record.status)}>
                    Mark as {record.status === 'Open' ? 'Closed' : 'Open'}
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My To Do List</h2>
                <Button type="primary" size="small" onClick={fetchToDos} loading={loading}>Refresh</Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </div>
        </div>
    );
}
