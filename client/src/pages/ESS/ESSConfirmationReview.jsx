import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, notification, Row, Col, Table, Tag, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function ESSConfirmationReview({ employeeData }) {
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

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Employee Confirmation`, {
                params: {
                    fields: JSON.stringify(["name", "confirmation_date", "status", "docstatus"]),
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name]
                    ]),
                    order_by: "creation desc"
                }
            });
            setHistory(res.data.data || []);
        } catch (err) {
            console.warn("Could not fetch Confirmation Review history.", err);
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
                doctype: 'Employee Confirmation',
                employee: employeeData.name,
                confirmation_date: dayjs(values.confirmation_date).format('YYYY-MM-DD'),
                remarks: values.remarks,
            };
            
            await API.post('/api/resource/Employee Confirmation', payload);
            notification.success({ message: 'Request submitted successfully' });
            form.resetFields();
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            console.error('Failed to submit review:', err);
            let errMsg = "Failed to submit request";
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
            await API.delete(`/api/resource/Employee Confirmation/${recordName}`);
            notification.success({ message: 'Draft deleted successfully' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete draft:', err);
            notification.error({ message: 'Error', description: 'Failed to delete draft or you do not have permission.' });
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Confirmation Date', dataIndex: 'confirmation_date', key: 'confirmation_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Status', key: 'display_status', render: (_, record) => {
            const isDraft = record.docstatus === 0;
            const isCancelled = record.docstatus === 2;
            const statusLabel = isCancelled ? 'Cancelled' : record.status || (isDraft ? 'Draft' : 'Submitted');
            let color = isDraft ? 'blue' : isCancelled ? 'red' : 'green';
            if (record.status === 'Rejected') color = 'red';
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">Confirmation Review Entry</h2>
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
                title="New Confirmation Review"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="confirmation_date" label="Proposed Confirmation Date" rules={[{ required: true, message: 'Please select a date' }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="remarks" label="Remarks/Self Evaluation" rules={[{ required: true, message: 'Please provide remarks' }]}>
                                <TextArea rows={4} placeholder="Summarize your performance and reasons for confirmation" />
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
