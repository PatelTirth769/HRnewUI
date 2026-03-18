import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, notification, Row, Col, Table, Tag, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSLeaveEncashment({ employeeData }) {
    const [form] = Form.useForm();
    const [history, setHistory] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeData?.name) {
            fetchHistory();
            fetchLeaveTypes();
        }
    }, [employeeData]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Leave Encashment`, {
                params: {
                    fields: JSON.stringify(["name", "leave_type", "encashment_days", "docstatus"]),
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name]
                    ]),
                    order_by: "creation desc"
                }
            });
            setHistory(res.data.data || []);
        } catch (err) {
            console.warn("Could not fetch Leave Encashment history.", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            // Fetch all leave types, users usually filter this manually if needed.
            const res = await API.get(`/api/resource/Leave Type?fields=["name","is_encashable"]&filters=[["is_encashable","=",1]]`);
            if (res.data && res.data.data) {
                setLeaveTypes(res.data.data.map(i => i.name));
            }
        } catch (err) {
            console.warn("Failed to fetch leave types for encashment.", err);
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
                doctype: 'Leave Encashment',
                employee: employeeData.name,
                leave_type: values.leave_type,
                encashment_days: values.encashment_days,
                reason: values.reason,
            };
            
            await API.post('/api/resource/Leave Encashment', payload);
            notification.success({ message: 'Leave Encashment request submitted successfully' });
            form.resetFields();
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            console.error('Failed to submit request:', err);
            let errMsg = "Failed to submit leave encashment request";
            if (err.response?.data?.message) {
                errMsg = typeof err.response.data.message === 'string' ? err.response.data.message : JSON.stringify(err.response.data.message);
            }
            notification.error({ message: 'Error', description: errMsg });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (recordName) => {
        try {
            await API.delete(`/api/resource/Leave Encashment/${recordName}`);
            notification.success({ message: 'Draft deleted successfully' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete draft:', err);
            notification.error({ message: 'Error', description: 'Failed to delete draft or you do not have permission.' });
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Leave Type', dataIndex: 'leave_type', key: 'leave_type' },
        { title: 'Encashment Days', dataIndex: 'encashment_days', key: 'encashment_days' },
        { title: 'Status', key: 'display_status', render: (_, record) => {
            const isDraft = record.docstatus === 0;
            const isCancelled = record.docstatus === 2;
            const statusLabel = isCancelled ? 'Cancelled' : isDraft ? 'Draft' : 'Submitted/Approved';
            let color = isDraft ? 'blue' : isCancelled ? 'red' : 'green';
            return <Tag color={color}>{statusLabel}</Tag>;
        }},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.docstatus === 0 ? (
                    <Popconfirm
                        title="Delete this request?"
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Leave Encashments</h2>
                <Button 
                    type="primary" 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-orange-500 border-none hover:bg-orange-600"
                >
                    New Request
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
                title="New Leave Encashment Request"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true, message: 'Please select a leave type' }]}>
                                <Select placeholder="Select Leave Type">
                                    {leaveTypes.map(type => (
                                        <Option key={type} value={type}>{type}</Option>
                                    ))}
                                    {leaveTypes.length === 0 && <Option disabled key="none" value="none">No encashable leaves found</Option>}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="encashment_days" label="Encashment Days" rules={[{ required: true, message: 'Please enter number of days' }]}>
                                <InputNumber min={1} style={{ width: '100%' }} placeholder="Number of days to encash" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="reason" label="Reason/Remarks">
                                <TextArea rows={3} placeholder="Optional reason" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500 border-none hover:bg-orange-600">
                            Submit Request
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
