import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Table, Tag, Space, Modal, Popconfirm, InputNumber } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSExpenseClaim({ employeeData }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [approvers, setApprovers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (employeeData?.name) {
            fetchHistory();
            fetchExpenseTypes();
            fetchApprovers();
        }
    }, [employeeData]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/resource/Expense Claim?fields=["name","posting_date","total_claimed_amount","approval_status","company"]&filters=[["employee","=","${employeeData.name}"]]&order_by=posting_date desc`);
            setHistory(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenseTypes = async () => {
        try {
            const res = await API.get(`/api/resource/Expense Claim Type?fields=["name"]&limit_page_length=None`);
            if (res.data && res.data.data) {
                setExpenseTypes(res.data.data.map(i => i.name));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchApprovers = async () => {
        try {
            // Usually approvers are employees with certain roles or mapped in Department
            const res = await API.get(`/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&limit_page_length=None`);
            if (res.data && res.data.data) {
                setApprovers(res.data.data);
            }
        } catch (err) {
            console.error(err);
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
                company: employeeData.company,
                expense_approver: values.expense_approver,
                posting_date: values.posting_date.format('YYYY-MM-DD'),
                expenses: values.expenses.map(exp => ({
                    expense_date: exp.expense_date.format('YYYY-MM-DD'),
                    expense_type: exp.expense_type,
                    description: exp.description,
                    amount: exp.amount
                })),
                doctype: "Expense Claim"
            };

            await API.post('/api/resource/Expense Claim', payload);
            notification.success({ message: "Expense Claim submitted successfully" });
            setIsModalOpen(false);
            form.resetFields();
            fetchHistory();
        } catch (err) {
            console.error("Save failed:", err);
            let errMsg = "Failed to submit expense claim";
            if (err.response?.data?.message) {
                errMsg = err.response.data.message;
            }
            notification.error({ 
                message: "Submission Error", 
                description: errMsg
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await API.delete(`/api/resource/Expense Claim/${encodeURIComponent(name)}`);
            notification.success({ message: "Expense Claim deleted successfully" });
            fetchHistory();
        } catch (err) {
            console.error("Failed to delete claim:", err);
            notification.error({ message: "Failed to delete claim", description: err.response?.data?.message || err.message });
        }
    };

    const historyColumns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600">{id}</span> },
        { title: 'Posting Date', dataIndex: 'posting_date', key: 'posting_date', render: (d) => dayjs(d).format('DD MMM YYYY') },
        { title: 'Amount', dataIndex: 'total_claimed_amount', key: 'total_claimed_amount', align: 'right', render: (val) => `₹${val.toLocaleString()}` },
        { title: 'Status', dataIndex: 'approval_status', key: 'approval_status', render: (s) => (
            <Tag color={s === 'Approved' ? 'green' : s === 'Draft' ? 'blue' : 'orange'}>{s}</Tag>
        )},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.approval_status === 'Draft' ? (
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
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Expense Claims</h2>
                <Button type="primary" onClick={() => setIsModalOpen(true)} className="bg-orange-500 border-none hover:bg-orange-600">
                    Add Expense Claim
                </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    columns={historyColumns}
                    dataSource={history}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    className="ess-table"
                />
            </div>

            <Modal
                title="New Expense Claim"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleApply} 
                    className="mt-4"
                    initialValues={{
                        posting_date: dayjs(),
                        expenses: [{ expense_date: dayjs() }]
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="expense_approver" label="Expense Approver" rules={[{ required: true }]}>
                                <Select placeholder="Select Approver" showSearch optionFilterProp="children">
                                    {approvers.map(a => <Option key={a.name} value={a.name}>{a.employee_name} ({a.name})</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="posting_date" label="Posting Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="mb-4">
                        <h3 className="text-sm font-semibold mb-2">Expenses</h3>
                        <Form.List name="expenses">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="bg-gray-50 p-3 rounded mb-3 border relative">
                                            <Row gutter={12}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'expense_date']}
                                                        label="Date"
                                                        rules={[{ required: true }]}
                                                    >
                                                        <DatePicker style={{ width: '100%' }} size="small" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={10}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'expense_type']}
                                                        label="Type"
                                                        rules={[{ required: true }]}
                                                    >
                                                        <Select placeholder="Type" size="small">
                                                            {expenseTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={6}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'amount']}
                                                        label="Amount"
                                                        rules={[{ required: true }]}
                                                    >
                                                        <InputNumber style={{ width: '100%' }} size="small" min={0} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={12}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'description']}
                                                        label="Description"
                                                    >
                                                        <Input placeholder="Description" size="small" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            {fields.length > 1 && (
                                                <Button 
                                                    type="text" 
                                                    danger 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={() => remove(name)}
                                                    className="absolute top-1 right-1"
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <Button type="dashed" onClick={() => add({ expense_date: dayjs() })} block icon={<PlusOutlined />}>
                                        Add Row
                                    </Button>
                                </>
                            )}
                        </Form.List>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500 border-none hover:bg-orange-600">
                            Submit Claim
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
