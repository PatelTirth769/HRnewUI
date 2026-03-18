import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Table, Tag, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSAttendanceRegularise({ employeeData }) {
    const [form] = Form.useForm();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeData?.name) {
            fetchHistory();
        }
    }, [employeeData]);

    const regularisationTypeOptions = [
        'Late Entry',
        'Early Exit',
        'Absent',
        'Missed Punch',
        'Other'
    ];

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Attendance Request`, {
                params: {
                    fields: JSON.stringify(["name", "from_date", "reason", "docstatus"]),
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name]
                    ]),
                    order_by: "from_date desc"
                }
            });
            setHistory(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch regularisation history:", err);
        } finally {
            setLoading(false);
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
                doctype: 'Attendance Request',
                employee: employeeData.name,
                employee_name: employeeData.employee_name,
                company: employeeData.company,
                department: employeeData.department,
                from_date: dayjs(values.attendance_date).format('YYYY-MM-DD'),
                to_date: dayjs(values.attendance_date).format('YYYY-MM-DD'),
                half_day: 0,
                // Attendance Request might not have regularisation_type, we append it to the explanation
                reason: values.regularisation_type === 'Other' ? "Work From Home" : "On Duty", 
                explanation: `[${values.regularisation_type}] ${values.reason}`,
            };
            
            await API.post('/api/resource/Attendance Request', payload);
            notification.success({ message: 'Attendance regularisation applied successfully' });
            form.resetFields();
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            console.error('Failed to submit request:', err);
            let errMsg = "Failed to submit attendance regularisation application";
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
                message: 'Attendance Request Error',
                description: errMsg,
                duration: 10
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (recordName) => {
        try {
            await API.delete(`/api/resource/Attendance Request/${recordName}`);
            notification.success({ message: 'Request deleted successfully' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete request:', err);
            notification.error({
                message: 'Error',
                description: 'Failed to delete attendance regularisation request'
            });
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Attendance Date', dataIndex: 'from_date', key: 'from_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Reason', dataIndex: 'reason', key: 'reason' },
        { title: 'Status', key: 'display_status', render: (_, record) => (
            <Tag color={record.docstatus === 1 ? 'green' : record.docstatus === 0 ? 'blue' : 'red'}>
                {record.docstatus === 1 ? 'Approved' : record.docstatus === 0 ? 'Draft' : 'Cancelled'}
            </Tag>
        )},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.docstatus === 0 ? (
                    <Popconfirm
                        title="Delete this request?"
                        description="Are you sure you want to delete this regularisation request?"
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Attendance Regularisations</h2>
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
                title="New Attendance Regularisation Request"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="attendance_date" label="Attendance Date" rules={[{ required: true, message: 'Please select date' }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="regularisation_type" label="Regularisation Type" rules={[{ required: true, message: 'Please select type' }]}>
                                <Select placeholder="Select Type">
                                    {regularisationTypeOptions.map(type => (
                                        <Option key={type} value={type}>{type}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="reason" label="Reason/Description" rules={[{ required: true, message: 'Please provide a reason' }]}>
                                <TextArea rows={3} placeholder="Please provide a reason for regularisation" />
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
