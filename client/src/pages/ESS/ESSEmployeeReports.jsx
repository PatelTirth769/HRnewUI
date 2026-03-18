import React, { useState, useEffect } from 'react';
import { Table, Input, Button, notification, Tag, Descriptions } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Search } = Input;

export default function ESSEmployeeReports({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee`, {
                params: {
                    fields: JSON.stringify(["name","employee_name","department","designation","company","date_of_joining","status","user_id"]),
                    filters: JSON.stringify([["status","=","Active"]]),
                    order_by: "employee_name asc",
                    limit_page_length: 500
                }
            });
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Failed to fetch employee report' });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = employees.filter(e => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return (
            (e.employee_name || '').toLowerCase().includes(q) ||
            (e.name || '').toLowerCase().includes(q) ||
            (e.department || '').toLowerCase().includes(q) ||
            (e.designation || '').toLowerCase().includes(q)
        );
    });

    const columns = [
        { title: 'Sr.', key: 'sr', render: (_, __, i) => i + 1, width: 50 },
        { title: 'Employee ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Employee Name', dataIndex: 'employee_name', key: 'employee_name' },
        { title: 'Department', dataIndex: 'department', key: 'department', render: (d) => d || '-' },
        { title: 'Designation', dataIndex: 'designation', key: 'designation', render: (d) => d || '-' },
        { title: 'Date of Joining', dataIndex: 'date_of_joining', key: 'date_of_joining', render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '-' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Active' ? 'green' : 'red'}>{s}</Tag> },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <Search
                    placeholder="Search by name, ID, department, or designation"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ maxWidth: 400 }}
                    allowClear
                />
                <Button type="primary" onClick={fetchData} className="bg-orange-500 border-none hover:bg-orange-600">Refresh</Button>
                <span className="text-sm text-gray-500">{filteredData.length} employees</span>
            </div>

            {/* Summary for the logged-in employee */}
            {employeeData && (
                <div className="bg-white border rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">My Details</h3>
                    <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered>
                        <Descriptions.Item label="Employee ID">{employeeData.name}</Descriptions.Item>
                        <Descriptions.Item label="Name">{employeeData.employee_name}</Descriptions.Item>
                        <Descriptions.Item label="Department">{employeeData.department || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Designation">{employeeData.designation || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Company">{employeeData.company || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Date of Joining">{employeeData.date_of_joining ? dayjs(employeeData.date_of_joining).format('DD MMM YYYY') : '-'}</Descriptions.Item>
                    </Descriptions>
                </div>
            )}

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table columns={columns} dataSource={filteredData} loading={loading} rowKey="name" pagination={{ pageSize: 20 }} size="middle" className="ess-table" />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `.ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; } .ess-table .ant-table-cell { font-size: 13px; }` }} />
        </div>
    );
}
