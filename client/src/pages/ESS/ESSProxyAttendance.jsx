import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Table, Tag, Modal, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSProxyAttendance({ employeeData }) {
    const [form] = Form.useForm();
    const [history, setHistory] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeData?.user_id) {
            fetchHistory();
            fetchEmployees();
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
            // Fetch records created by the logged in user, but NOT for themselves
            const res = await API.get(`/api/resource/Attendance Request`, {
                params: {
                    fields: JSON.stringify(["name", "employee", "employee_name", "from_date", "reason", "docstatus"]),
                    filters: JSON.stringify([
                        ["owner", "=", employeeData.user_id],
                        ["employee", "!=", employeeData.name]
                    ]),
                    order_by: "creation desc"
                }
            });
            setHistory(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch proxy regularisation history:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            // Managers usually have permission to fetch employees under them.
            // We fetch the basic employee array. Wait, if there are thousands, limit might be hit.
            const res = await API.get(`/api/resource/Employee`, {
                params: {
                    fields: JSON.stringify(["name", "employee_name"]),
                    filters: JSON.stringify([["status", "=", "Active"]]),
                    limit_page_length: 500
                }
            });
            if (res.data?.data) {
                setEmployees(res.data.data);
            }
        } catch (err) {
            console.warn("Failed to fetch employees list.", err);
        }
    };

    const handleApply = async (values) => {
        setSubmitting(true);
        try {
            // Find employee name to augment payload
            const selectedEmp = employees.find(e => e.name === values.employee) || {};
            
            const payload = {
                doctype: 'Attendance Request',
                employee: values.employee,
                employee_name: selectedEmp.employee_name || '',
                from_date: dayjs(values.attendance_date).format('YYYY-MM-DD'),
                to_date: dayjs(values.attendance_date).format('YYYY-MM-DD'),
                half_day: 0,
                reason: values.regularisation_type === 'Other' ? "Work From Home" : "On Duty", 
                explanation: `[Proxy - ${values.regularisation_type}] ${values.reason}`,
            };
            
            await API.post('/api/resource/Attendance Request', payload);
            notification.success({ message: 'Proxy attendance request submitted successfully' });
            form.resetFields();
            setIsModalOpen(false);
            fetchHistory();
        } catch (err) {
            console.error('Failed to submit proxy request:', err);
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
            await API.delete(`/api/resource/Attendance Request/${recordName}`);
            notification.success({ message: 'Request deleted successfully' });
            fetchHistory();
        } catch (err) {
            console.error('Failed to delete request:', err);
            notification.error({ message: 'Error', description: 'Failed to delete request' });
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600 font-medium">{id}</span> },
        { title: 'Employee', dataIndex: 'employee_name', key: 'employee_name', render: (text, record) => `${text} (${record.employee})` },
        { title: 'Date', dataIndex: 'from_date', key: 'from_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
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
                        onConfirm={() => handleDelete(record.name)}
                        okText="Yes"
                        cancelText="No"
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">Proxy Attendance Regularisation</h2>
                <Button 
                    type="primary" 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-orange-500 border-none hover:bg-orange-600"
                >
                    New Proxy Request
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
                title="Proxy Attendance Regularisation"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="employee" label="Select Employee" rules={[{ required: true, message: 'Please select an employee' }]}>
                                <Select 
                                    showSearch
                                    placeholder="Search Employee"
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={employees.map(e => ({ value: e.name, label: `${e.employee_name} (${e.name})` }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
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
                                <TextArea rows={3} placeholder="Please provide a reason for proxy regularisation" />
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
