import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Table, Tag, Space, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSLeaveApplication({ employeeData }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [balance, setBalance] = useState(null);
    const [checkingBalance, setCheckingBalance] = useState(false);

    useEffect(() => {
        if (employeeData?.name) {
            fetchHistory();
            fetchLeaveTypes();
        }
    }, [employeeData]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Leave Application?fields=["name","leave_type","from_date","to_date","total_leave_days","status","posting_date"]&filters=[["employee","=","${employeeData.name}"]]&order_by=from_date desc`);
            setHistory(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            // Fetch leave types directly. Employees usually have read access to "Leave Type" 
            // but not always "Leave Allocation" depending on ERPNext permissions.
            const res = await API.get(`/api/resource/Leave Type?fields=["name"]&limit_page_length=None`);
            if (res.data && res.data.data) {
                const types = res.data.data.map(i => i.name);
                setLeaveTypes(types);
            }
        } catch (err) {
            console.error(err);
        }
    };
    
    const fetchBalance = async (leaveType) => {
        if (!leaveType || !employeeData?.name) return;
        setCheckingBalance(true);
        setBalance(null);
        try {
            const res = await API.get(`/api/resource/Leave Allocation?fields=["total_leaves_allocated","from_date","to_date"]&filters=[["employee","=","${employeeData.name}"],["leave_type","=","${leaveType}"],["docstatus","=","1"]]&limit_page_length=1`);
            if (res.data.data && res.data.data.length > 0) {
                setBalance(res.data.data[0]);
            } else {
                setBalance({ total_leaves_allocated: 0 });
            }
        } catch (err) {
            console.warn("Could not fetch balance:", err);
            setBalance('unknown'); 
        } finally {
            setCheckingBalance(false);
        }
    };

    const handleApply = async (values) => {
        if (!employeeData?.name) {
            notification.error({ message: "Employee data not loaded" });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                employee: employeeData.name,
                leave_type: values.leave_type,
                from_date: values.dates[0].format('YYYY-MM-DD'),
                to_date: values.dates[1].format('YYYY-MM-DD'),
                description: values.description,
                company: employeeData.company,
                posting_date: dayjs().format('YYYY-MM-DD'),
                doctype: "Leave Application"
            };

            await API.post('/api/resource/Leave Application', payload);
            notification.success({ message: "Leave applied successfully" });
            setIsModalOpen(false);
            form.resetFields();
            fetchHistory();
        } catch (err) {
            console.error("Save failed:", err);
            let errMsg = "Failed to apply leave";
            if (err.response?.data) {
                const { _server_messages, message, exc } = err.response.data;
                if (_server_messages) {
                    try {
                        const parsed = JSON.parse(_server_messages);
                        errMsg = parsed.map(m => { 
                            try { return JSON.parse(m).message; } catch { return m; } 
                        }).join('\n');
                    } catch { /* ignored */ }
                } else if (message) {
                    errMsg = typeof message === 'string' ? message : JSON.stringify(message);
                } else if (exc) {
                    errMsg = "Server Exception: Check backend logs";
                }
            }
            notification.error({ 
                message: "Leave Application Error", 
                description: errMsg,
                duration: 10
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await API.delete(`/api/resource/Leave Application/${encodeURIComponent(name)}`);
            notification.success({ message: "Leave application deleted successfully" });
            fetchHistory();
        } catch (err) {
            console.error("Failed to delete leave application:", err);
            notification.error({ message: "Failed to delete leave application", description: err.response?.data?.message || err.message });
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600">{id}</span> },
        { title: 'Leave Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'From', dataIndex: 'from_date', key: 'from_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'To', dataIndex: 'to_date', key: 'to_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Days', dataIndex: 'total_leave_days', key: 'total_leave_days', align: 'right' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => (
            <Tag color={s === 'Approved' ? 'green' : s === 'Open' ? 'blue' : 'orange'}>{s}</Tag>
        )},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.status === 'Open' ? (
                    <Popconfirm
                        title="Delete this request?"
                        description="Are you sure you want to delete this leave application?"
                        onConfirm={() => handleDelete(record.name)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                ) : null
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Leave Applications</h2>
                <Button type="primary" onClick={() => setIsModalOpen(true)} className="bg-orange-500 border-none hover:bg-orange-600">
                    Apply for Leave
                </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    columns={columns}
                    dataSource={history}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    className="ess-table"
                />
            </div>

            <Modal
                title="New Leave Request"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true }]}>
                                <Select placeholder="Select Leave Type" onChange={fetchBalance}>
                                    {leaveTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </Form.Item>

                            {checkingBalance && <div className="text-xs text-gray-500 mb-2">Checking allocation...</div>}
                            
                            {balance === 'unknown' && (
                                <div className="bg-orange-50 p-2 rounded text-orange-700 text-xs mb-4 border border-orange-100 italic">
                                    Note: Please ensure an active "Leave Allocation" exists in ERPNext for this employee for the selected period.
                                </div>
                            )}

                            {balance && balance.total_leaves_allocated === 0 && (
                                <div className="bg-red-50 p-2 rounded text-red-700 text-xs mb-4 border border-red-100">
                                    No active leave allocation found for this type. Application may fail.
                                </div>
                            )}

                            {balance && balance.total_leaves_allocated > 0 && (
                                <div className="bg-green-50 p-2 rounded text-green-700 text-xs mb-4 border border-green-100">
                                    Active Allocation Found: {balance.total_leaves_allocated} days ({dayjs(balance.from_date).format('DD MMM YYYY')} - {dayjs(balance.to_date).format('DD MMM YYYY')})
                                </div>
                            )}
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="dates" label="Duration" rules={[{ required: true }]}>
                                <DatePicker.RangePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="description" label="Reason/Description">
                                <TextArea rows={3} placeholder="Please provide a reason for your leave" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500 border-none hover:bg-orange-600">
                            Submit Application
                        </Button>
                    </div>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .ess-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
