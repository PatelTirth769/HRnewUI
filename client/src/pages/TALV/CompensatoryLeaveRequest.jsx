import React, { useState, useEffect } from 'react';
import { Table, Button, Space, notification, Popconfirm, Input, Form, Select, DatePicker, Checkbox, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function CompensatoryLeaveRequest() {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'form'
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Form State
    const [form] = Form.useForm();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [saving, setSaving] = useState(false);

    // Dropdowns
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);

    // Half Day state
    const [isHalfDay, setIsHalfDay] = useState(false);

    useEffect(() => {
        if (view === 'list') {
            fetchData();
        } else {
            fetchDropdowns();
        }
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/resource/Compensatory Leave Request?fields=["name","employee","employee_name","leave_type","work_from_date","work_end_date","docstatus"]&order_by=creation desc&limit_page_length=None');
            if (response.data && response.data.data) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            notification.error({ message: "Failed to fetch Compensatory Leave Requests" });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [empRes, typeRes] = await Promise.all([
                api.get('/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&limit_page_length=None'),
                api.get('/api/resource/Leave Type?fields=["name"]&limit_page_length=None')
            ]);
            if (empRes.data && empRes.data.data) setEmployees(empRes.data.data);
            if (typeRes.data && typeRes.data.data) setLeaveTypes(typeRes.data.data);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/resource/Compensatory Leave Request/${encodeURIComponent(name)}`);
            if (res.data && res.data.data) {
                const record = res.data.data;
                form.setFieldsValue({
                    ...record,
                    work_from_date: record.work_from_date ? dayjs(record.work_from_date) : null,
                    work_end_date: record.work_end_date ? dayjs(record.work_end_date) : null,
                    half_day_date: record.half_day_date ? dayjs(record.half_day_date) : null,
                    half_day: !!record.half_day
                });
                setIsHalfDay(!!record.half_day);
            }
        } catch (error) {
            console.error("Error fetching record:", error);
            notification.error({ message: "Failed to fetch record details" });
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setIsEditMode(false);
        setEditingRecord(null);
        form.resetFields();
        setIsHalfDay(false);

        // Form default behavior from screenshot
        // For Compensatory Leave, Leave Type defaults to "Compensatory Off" in ERPNext usually. 
        form.setFieldsValue({ leave_type: "Compensatory Off" });

        setView('form');
    };

    const handleEdit = async (record) => {
        setIsEditMode(true);
        setEditingRecord(record);
        form.resetFields();
        setView('form');
        await fetchSingle(record.name);
    };

    const handleDelete = async (name) => {
        try {
            await api.delete(`/api/resource/Compensatory Leave Request/${encodeURIComponent(name)}`);
            notification.success({ message: "Compensatory Leave Request deleted successfully" });
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            notification.error({ message: "Failed to delete application" });
        }
    };

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const payload = {
                ...values,
                doctype: "Compensatory Leave Request",
                work_from_date: values.work_from_date ? values.work_from_date.format('YYYY-MM-DD') : null,
                work_end_date: values.work_end_date ? values.work_end_date.format('YYYY-MM-DD') : null,
                half_day_date: values.half_day && values.half_day_date ? values.half_day_date.format('YYYY-MM-DD') : null,
                half_day: values.half_day ? 1 : 0
            };

            if (isEditMode) {
                await api.put(`/api/resource/Compensatory Leave Request/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: "Updated successfully!" });
            } else {
                await api.post('/api/resource/Compensatory Leave Request', payload);
                notification.success({ message: "Created successfully!" });
            }
            setView('list');
        } catch (error) {
            console.error("Save failed:", error);
            let errMsg = "Save Failed";
            if (error.response?.data) {
                const { _server_messages, message, exc } = error.response.data;
                if (_server_messages) {
                    try {
                        const parsed = JSON.parse(_server_messages);
                        errMsg = parsed.map(m => { try { return JSON.parse(m).message; } catch { return m; } }).join('\n');
                    } catch { /* ignored */ }
                } else if (message) {
                    errMsg = typeof message === 'string' ? message : JSON.stringify(message);
                } else if (exc) {
                    errMsg = "Server Exception";
                }
            }
            notification.error({ message: "Failed to save request", description: errMsg, duration: 6 });
        } finally {
            setSaving(false);
        }
    };

    // --- RENDER ---

    if (view === 'form') {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <div className="mb-6 pb-4 border-b flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setView('list')} />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                    {isEditMode ? editingRecord.name : 'New Compensatory Leave Request'}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
                            </div>
                        </div>
                    </div>

                    <Spin spinning={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                <Form.Item
                                    name="employee"
                                    label="Employee"
                                    rules={[{ required: true, message: 'Please select an employee' }]}
                                >
                                    <Select
                                        placeholder="Select Employee"
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {employees.map(emp => (
                                            <Option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="leave_type"
                                    label="Leave Type"
                                >
                                    <Select placeholder="Select Leave Type" showSearch optionFilterProp="children">
                                        {leaveTypes.map(type => (
                                            <Option key={type.name} value={type.name}>{type.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <div className="col-span-1 md:col-span-2 mt-4 mb-2">
                                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Worked On Holiday</h3>
                                </div>

                                <Form.Item
                                    name="work_from_date"
                                    label="Work From Date"
                                    rules={[{ required: true, message: 'Required' }]}
                                    className="mb-4"
                                >
                                    <DatePicker className="w-full" format="YYYY-MM-DD" />
                                </Form.Item>

                                <Form.Item
                                    name="reason"
                                    label="Reason"
                                    rules={[{ required: true, message: 'Required' }]}
                                    className="row-span-3 mb-4"
                                >
                                    <TextArea rows={6} placeholder="Description of work done" />
                                </Form.Item>

                                <Form.Item
                                    name="work_end_date"
                                    label="Work End Date"
                                    rules={[{ required: true, message: 'Required' }]}
                                    className="mb-4"
                                >
                                    <DatePicker className="w-full" format="YYYY-MM-DD" />
                                </Form.Item>

                                <Form.Item name="half_day" valuePropName="checked" className="mb-2">
                                    <Checkbox onChange={(e) => setIsHalfDay(e.target.checked)}>Half Day</Checkbox>
                                </Form.Item>

                                {isHalfDay && (
                                    <Form.Item
                                        name="half_day_date"
                                        label="Half Day Date"
                                        rules={[{ required: true, message: 'Required when Half Day is checked' }]}
                                        className="mb-4"
                                    >
                                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                                    </Form.Item>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                <Button onClick={() => setView('list')} className="px-5">Cancel</Button>
                                <Button type="primary" htmlType="submit" className="bg-blue-600 px-6" loading={saving}>
                                    {isEditMode ? 'Update' : 'Save'}
                                </Button>
                            </div>
                        </Form>
                    </Spin>
                </div>
            </div>
        );
    }

    const filteredData = data.filter(item =>
        item.employee_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'ID',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <a onClick={() => handleEdit(record)} className="font-medium text-blue-600 hover:text-blue-800">
                    {text}
                </a>
            )
        },
        {
            title: 'Employee',
            key: 'employee',
            render: (text, record) => (
                <div>
                    <div className="font-medium">{record.employee_name}</div>
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
            title: 'Work From Date',
            dataIndex: 'work_from_date',
            key: 'work_from_date',
        },
        {
            title: 'Work End Date',
            dataIndex: 'work_end_date',
            key: 'work_end_date',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined className="text-blue-600" />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this request?"
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
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <nav className="text-xs text-gray-500 mb-1">HOME {'>'} TA & LV {'>'} COMPENSATORY LEAVE REQUEST</nav>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Compensatory Leave Request</h1>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleNew}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        New Request
                    </Button>
                </div>

                <div className="mb-4 flex items-center gap-2 max-w-md">
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search by Employee or ID"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="rounded"
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="name"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </div>
        </div>
    );
}
