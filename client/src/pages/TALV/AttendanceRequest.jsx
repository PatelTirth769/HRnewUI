import React, { useState, useEffect } from 'react';
import { Table, Button, Space, notification, Popconfirm, Input, Form, Select, DatePicker, Checkbox, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

export default function AttendanceRequest() {
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
    const [shifts, setShifts] = useState([]);

    // Checkbox states
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
            const response = await api.get('/api/resource/Attendance Request?fields=["name","employee","employee_name","from_date","to_date","reason","docstatus"]&order_by=creation desc&limit_page_length=None');
            if (response.data && response.data.data) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
            notification.error({ message: "Failed to fetch Attendance Requests" });
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const [empRes, shiftRes] = await Promise.all([
                api.get('/api/resource/Employee?fields=["name","employee_name","company","department"]&filters=[["status","=","Active"]]&limit_page_length=None'),
                api.get('/api/resource/Shift Type?fields=["name"]&limit_page_length=None')
            ]);
            if (empRes.data && empRes.data.data) setEmployees(empRes.data.data);
            if (shiftRes.data && shiftRes.data.data) setShifts(shiftRes.data.data);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    };

    const fetchSingle = async (name) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/resource/Attendance Request/${encodeURIComponent(name)}`);
            if (res.data && res.data.data) {
                const record = res.data.data;
                form.setFieldsValue({
                    ...record,
                    from_date: record.from_date ? dayjs(record.from_date) : null,
                    to_date: record.to_date ? dayjs(record.to_date) : null,
                    half_day_date: record.half_day_date ? dayjs(record.half_day_date) : null,
                    half_day: !!record.half_day,
                    include_holidays: !!record.include_holidays
                });
                setIsHalfDay(!!record.half_day);
                // Handle different possible field names for shift matching ERPNext
                if (record.shift) form.setFieldValue('shift', record.shift);
                else if (record.shift_type) form.setFieldValue('shift', record.shift_type);

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
            await api.delete(`/api/resource/Attendance Request/${encodeURIComponent(name)}`);
            notification.success({ message: "Attendance Request deleted successfully" });
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            notification.error({ message: "Failed to delete request" });
        }
    };

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const payload = {
                ...values,
                doctype: "Attendance Request",
                from_date: values.from_date ? values.from_date.format('YYYY-MM-DD') : null,
                to_date: values.to_date ? values.to_date.format('YYYY-MM-DD') : null,
                half_day_date: values.half_day && values.half_day_date ? values.half_day_date.format('YYYY-MM-DD') : null,
                half_day: values.half_day ? 1 : 0,
                include_holidays: values.include_holidays ? 1 : 0
            };

            if (isEditMode) {
                await api.put(`/api/resource/Attendance Request/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: "Updated successfully!" });
            } else {
                await api.post('/api/resource/Attendance Request', payload);
                notification.success({ message: "Created successfully!" });
            }
            setView('list');
        } catch (error) {
            // Enhanced error parsing for frappe exceptions
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
                                    {isEditMode ? editingRecord.name : 'New Attendance Request'}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
                            </div>
                        </div>
                    </div>

                    {isEditMode && editingRecord?.attendance_warnings && editingRecord.attendance_warnings.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2 mb-3">
                                Attendance Warnings
                                <svg className="w-4 h-4 text-gray-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </h3>
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm mb-4">
                                Attendance for the following dates will be skipped/overwritten on submission
                            </div>
                            <Table
                                dataSource={editingRecord.attendance_warnings}
                                pagination={false}
                                rowKey={(r, i) => i}
                                className="border border-gray-100 rounded-md overflow-hidden"
                                columns={[
                                    { title: 'Date', dataIndex: 'date', key: 'date' },
                                    { title: 'Action on Submission', dataIndex: 'action', key: 'action' },
                                    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
                                    { title: 'Existing Record', dataIndex: 'existing_record', key: 'existing_record' },
                                ]}
                            />
                        </div>
                    )}

                    <Spin spinning={loading}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                {/* Left Column */}
                                <div className="space-y-1">
                                    <Form.Item
                                        name="employee"
                                        label="Employee"
                                        rules={[{ required: true, message: 'Please select an employee' }]}
                                    >
                                        <Select
                                            placeholder="Select Employee"
                                            showSearch
                                            optionFilterProp="children"
                                            onChange={(val) => {
                                                const emp = employees.find(e => e.name === val);
                                                if (emp) {
                                                    form.setFieldsValue({
                                                        company: emp.company,
                                                        employee_name: emp.employee_name,
                                                        department: emp.department
                                                    });
                                                }
                                            }}
                                        >
                                            {employees.map(emp => (
                                                <Option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item name="employee_name" label="Employee Name">
                                        <Input readOnly className="bg-gray-50 bg-opacity-50 text-gray-700" />
                                    </Form.Item>

                                    <Form.Item name="department" label="Department">
                                        <Input readOnly className="bg-gray-50 bg-opacity-50 text-gray-700" />
                                    </Form.Item>

                                    <Form.Item
                                        name="company"
                                        label="Company"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <Input readOnly className="bg-gray-50 bg-opacity-50 text-gray-700" />
                                    </Form.Item>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-1">
                                    <Form.Item
                                        name="from_date"
                                        label="From Date"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                                    </Form.Item>

                                    <Form.Item
                                        name="to_date"
                                        label="To Date"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <DatePicker className="w-full" format="YYYY-MM-DD" />
                                    </Form.Item>

                                    <div className="space-y-4 pt-1">
                                        <Form.Item name="half_day" valuePropName="checked" className="mb-0">
                                            <Checkbox onChange={(e) => setIsHalfDay(e.target.checked)}>Half Day</Checkbox>
                                        </Form.Item>

                                        {isHalfDay && (
                                            <Form.Item
                                                name="half_day_date"
                                                label="Half Day Date"
                                                rules={[{ required: true, message: 'Required when Half Day is checked' }]}
                                                className="mb-0"
                                            >
                                                <DatePicker className="w-full" format="YYYY-MM-DD" />
                                            </Form.Item>
                                        )}

                                        <Form.Item name="include_holidays" valuePropName="checked" className="mb-0">
                                            <Checkbox>Include Holidays</Checkbox>
                                        </Form.Item>

                                        <Form.Item name="shift" label="Shift" className="mb-0">
                                            <Select placeholder="Select Shift" showSearch optionFilterProp="children" allowClear>
                                                {shifts.map(s => (
                                                    <Option key={s.name} value={s.name}>{s.name}</Option>
                                                ))}
                                            </Select>
                                            <div className="text-xs text-gray-500 mt-1">Note: Shift will not be overwritten in existing attendance records</div>
                                        </Form.Item>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-6">

                                <div className="col-span-1 md:col-span-2 mt-6 mb-2">
                                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Reason</h3>
                                </div>

                                <Form.Item
                                    name="reason"
                                    label="Reason"
                                    rules={[{ required: true, message: 'Required' }]}
                                >
                                    <Select placeholder="Select Reason">
                                        <Option value="Work From Home">Work From Home</Option>
                                        <Option value="On Duty">On Duty</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="explanation"
                                    label="Explanation"
                                    className="row-span-2"
                                >
                                    <TextArea rows={5} placeholder="Provide explanation" />
                                </Form.Item>
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
            title: 'Reason',
            dataIndex: 'reason',
            key: 'reason',
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
                        <nav className="text-xs text-gray-500 mb-1">HOME {'>'} ATTENDANCE {'>'} ATTENDANCE REQUEST</nav>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Attendance Request</h1>
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
