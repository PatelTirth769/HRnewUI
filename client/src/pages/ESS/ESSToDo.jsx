import React, { useState, useEffect } from 'react';
import { Table, Tag, notification, Space, Button } from 'antd';
import dayjs from 'dayjs';
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
        if (!employeeData?.user_id) {
            return;
        }
        setLoading(true);
        try {
            const userId = employeeData.user_id;
            const empId = employeeData.name;
            const empName = employeeData.employee_name;
            
            // 1. Fetch ALL ToDos where the user is allocated (by Email, ID, or Full Name)
            const allocUserReq = API.get('/api/resource/ToDo', {
                params: {
                    fields: '["name","description","status","priority","date","reference_type","reference_name","owner","allocated_to","creation"]',
                    filters: JSON.stringify([["allocated_to", "=", userId]]),
                    limit_page_length: 100
                }
            });

            const allocEmpReq = API.get('/api/resource/ToDo', {
                params: {
                    fields: '["name","description","status","priority","date","reference_type","reference_name","owner","allocated_to","creation"]',
                    filters: JSON.stringify([["allocated_to", "=", empId]]),
                    limit_page_length: 100
                }
            });

            const allocNameReq = API.get('/api/resource/ToDo', {
                params: {
                    fields: '["name","description","status","priority","date","reference_type","reference_name","owner","allocated_to","creation"]',
                    filters: JSON.stringify([["allocated_to", "=", empName]]),
                    limit_page_length: 100
                }
            });

            // 2. Fetch ALL ToDos owned by the user
            const ownerReq = API.get('/api/resource/ToDo', {
                params: {
                    fields: '["name","description","status","priority","date","reference_type","reference_name","owner","allocated_to","creation"]',
                    filters: JSON.stringify([["owner", "=", userId]]),
                    limit_page_length: 100
                }
            });

            // Wait for all 4 requests
            const [resAllocUser, resAllocEmp, resAllocName, resOwner] = await Promise.all([
                allocUserReq, allocEmpReq, allocNameReq, ownerReq
            ]);

            // Merge and deduplicate by 'name'
            const allToDos = [
                ...(resAllocUser.data.data || []), 
                ...(resAllocEmp.data.data || []), 
                ...(resAllocName.data.data || []),
                ...(resOwner.data.data || [])
            ];
            
            const seen = new Set();
            const unique = [];
            for (const t of allToDos) {
                 if (!seen.has(t.name)) {
                     seen.add(t.name);
                     unique.push(t);
                 }
            }

            // Sort by date (desc), falling back to creation date if date is null
            unique.sort((a, b) => {
                const dateA = a.date || a.creation || 0;
                const dateB = b.date || b.creation || 0;
                return new Date(dateB) - new Date(dateA);
            });

            setData(unique);
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
            render: (text) => <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap" dangerouslySetInnerHTML={{ __html: text }} />,
        },
        {
            title: 'Reference',
            key: 'reference',
            render: (_, record) => record.reference_type ? (
                <div className="text-xs">
                    <span className="text-gray-400">{record.reference_type}:</span> {record.reference_name}
                </div>
            ) : '-'
        },
        {
            title: 'Due Date',
            dataIndex: 'date',
            key: 'date',
            width: 110,
            render: (date) => date ? dayjs(date).format('DD-MM-YYYY') : '-'
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 90,
            render: (priority) => {
                let color = 'blue';
                if (priority === 'High') color = 'red';
                if (priority === 'Medium') color = 'orange';
                return <Tag color={color} className="text-[10px] uppercase font-bold">{priority}</Tag>;
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 90,
            render: (status) => (
                <Tag color={status === 'Open' ? 'processing' : 'success'} className="text-[10px] uppercase font-bold">
                    {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 110,
            render: (_, record) => (
                <Button size="small" className="text-[11px]" onClick={() => handleStatusChange(record.name, record.status)}>
                    Mark {record.status === 'Open' ? 'Closed' : 'Open'}
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
