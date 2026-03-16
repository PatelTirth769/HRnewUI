import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Table, Tag, Space, Modal } from 'antd';
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
            // Fetch leave types available for the employee through allocation
            const res = await API.get(`/api/resource/Leave Allocation?fields=["leave_type"]&filters=[["employee","=","${employeeData.name}"],["docstatus","=","1"]]`);
            const types = [...new Set(res.data.data.map(i => i.leave_type))];
            setLeaveTypes(types);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApply = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                employee: employeeData.name,
                leave_type: values.leave_type,
                from_date: values.dates[0].format('YYYY-MM-DD'),
                to_date: values.dates[1].format('YYYY-MM-DD'),
                description: values.description,
                doctype: "Leave Application"
            };

            await API.post('/api/resource/Leave Application', payload);
            notification.success({ message: "Leave applied successfully" });
            setIsModalOpen(false);
            form.resetFields();
            fetchHistory();
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to apply leave", description: err.response?.data?.message || err.message });
        } finally {
            setSubmitting(false);
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
                                <Select placeholder="Select Leave Type">
                                    {leaveTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                                </Select>
                            </Form.Item>
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
