import React, { useState, useEffect } from 'react';
import { Form, Input, Button, notification, Row, Col, Table, Tag, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function ESSHelpDesk({ employeeData }) {
    const [form] = Form.useForm();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeData?.user_id) {
            fetchHistory();
        }
    }, [employeeData]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // In ERPNext, HelpDesk tickets are usually stored in the 'Issue' Doctype
            const res = await API.get(`/api/resource/Issue`, {
                params: {
                    fields: JSON.stringify(["name", "subject", "status", "creation"]),
                    filters: JSON.stringify([
                        ["raised_by", "=", employeeData.user_id]
                    ]),
                    order_by: "creation desc"
                }
            });
            setHistory(res.data.data || []);
        } catch (err) {
            console.warn("Could not fetch HelpDesk history. Ensure 'Issue' DocType is accessible.", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (values) => {
        if (!employeeData?.user_id) {
            notification.error({ message: "Employee user ID not loaded" });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                doctype: 'Issue',
                subject: values.subject,
                description: values.description,
                raised_by: employeeData.user_id,
                status: 'Open'
            };
            
            await API.post('/api/resource/Issue', payload);
            notification.success({ message: 'HelpDesk ticket created successfully' });
            form.resetFields();
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            console.error('Failed to submit ticket:', err);
            let errMsg = "Failed to submit HelpDesk ticket";
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
            await API.delete(`/api/resource/Issue/${recordName}`);
            notification.success({ message: 'Ticket deleted successfully' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete ticket:', err);
            notification.error({ message: 'Error', description: 'Failed to delete ticket or you do not have permission.' });
        }
    };

    const columns = [
        { title: 'Ticket ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Date', dataIndex: 'creation', key: 'creation', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Subject', dataIndex: 'subject', key: 'subject' },
        { title: 'Status', key: 'status', render: (_, record) => (
            <Tag color={record.status === 'Open' ? 'blue' : record.status === 'Closed' ? 'green' : 'orange'}>
                {record.status || 'Open'}
            </Tag>
        )},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.status === 'Open' ? (
                    <Popconfirm
                        title="Delete this ticket?"
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">My HelpDesk Tickets</h2>
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
                title="New HelpDesk Ticket"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="subject" label="Subject" rules={[{ required: true, message: 'Please provide a subject' }]}>
                                <Input placeholder="Ticket subject" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please provide details' }]}>
                                <TextArea rows={4} placeholder="Describe your issue in detail" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500 border-none hover:bg-orange-600">
                            Submit Ticket
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
