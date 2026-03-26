import React, { useState, useEffect } from 'react';
import { Table, Tag, notification, Space, Button, Select, Input, Modal, Form, Tooltip, Checkbox, Divider, Typography, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, MinusCircleOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Option } = Select;
const { Text } = Typography;

export default function ESSOnboardingTemplate() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loadingRecord, setLoadingRecord] = useState(false);

    // Master data for dropdowns
    const [masters, setMasters] = useState({
        companies: [],
        departments: [],
        designations: [],
        grades: [],
        users: []
    });

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [companyRes, deptRes, desigRes, gradeRes, userRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee Grade?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/User?fields=["name","full_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);

            setMasters({
                companies: companyRes.data?.data || [],
                departments: deptRes.data?.data || [],
                designations: desigRes.data?.data || [],
                grades: gradeRes.data?.data || [],
                users: userRes.data?.data || []
            });
        } catch (err) {
            console.error("Failed to fetch masters:", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/resource/Employee Onboarding Template?fields=["*"]&order_by=modified desc');
            setData(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch templates:", err);
            notification.error({ message: "Failed to load onboarding templates" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const payload = {
                ...values,
                title: values.template_name, // Map to title for compatibility
                activities: (values.activities || []).map(act => ({
                    ...act,
                    begin_on: parseInt(act.begin_on) || 0,
                    duration: parseInt(act.duration) || 0
                }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Onboarding Template/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: "Template updated successfully" });
            } else {
                await API.post('/api/resource/Employee Onboarding Template', payload);
                notification.success({ message: "Template created successfully" });
            }
            setIsModalVisible(false);
            fetchData();
        } catch (err) {
            console.error("Save failed:", err);
            notification.error({ 
                message: "Save failed", 
                description: err.response?.data?.message || err.message 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (name) => {
        if (!window.confirm(`Are you sure you want to delete template ${name}?`)) return;
        try {
            await API.delete(`/api/resource/Employee Onboarding Template/${encodeURIComponent(name)}`);
            notification.success({ message: "Template deleted successfully" });
            fetchData();
        } catch (err) {
            console.error("Delete failed:", err);
            notification.error({ message: "Delete failed" });
        }
    };

    const showModal = async (record = null) => {
        setIsModalVisible(true);
        setEditingRecord(record);
        if (record) {
            setLoadingRecord(true);
            try {
                const res = await API.get(`/api/resource/Employee Onboarding Template/${encodeURIComponent(record.name)}`);
                const fullData = res.data.data;
                form.setFieldsValue({
                    ...fullData,
                    template_name: fullData.template_name || fullData.title || '',
                    activities: fullData.activities || []
                });
            } catch (err) {
                console.error("Failed to fetch template details:", err);
                form.setFieldsValue(record);
            } finally {
                setLoadingRecord(false);
            }
        } else {
            form.resetFields();
            form.setFieldsValue({ activities: [] });
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-medium text-blue-600">{text}</span>,
        },
        {
            title: 'Template Name',
            key: 'template_name',
            render: (_, record) => record.template_name || record.title || record.heading || '-',
        },
        {
            title: 'Company',
            dataIndex: 'company',
            key: 'company',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} onClick={() => showModal(record)} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.name)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap items-center justify-between gap-4">
                <Input 
                    placeholder="Search templates..." 
                    prefix={<SearchOutlined className="text-gray-400" />}
                    className="w-64"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} className="bg-blue-600">
                    New Template
                </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    columns={columns}
                    dataSource={data.filter(item => 
                        !searchText || 
                        (item.template_name && item.template_name.toLowerCase().includes(searchText.toLowerCase())) ||
                        (item.title && item.title.toLowerCase().includes(searchText.toLowerCase())) ||
                        (item.name && item.name.toLowerCase().includes(searchText.toLowerCase()))
                    )}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </div>

            <Modal
                title={editingRecord ? `Edit Template: ${editingRecord.name}` : "New Onboarding Template"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width={800}
                destroyOnClose
            >
                <Spin spinning={loadingRecord}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSave}
                        className="mt-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <Form.Item name="template_name" label="Template Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. Standard Onboarding" />
                            </Form.Item>
                            <Form.Item name="company" label="Company" rules={[{ required: true }]}>
                                <Select placeholder="Select Company">
                                    {masters.companies.map(c => <Option key={c.name} value={c.name}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>

                            <Form.Item name="department" label="Department">
                                <Select placeholder="Select Department">
                                    {masters.departments.map(d => <Option key={d.name} value={d.name}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item name="designation" label="Designation">
                                <Select placeholder="Select Designation">
                                    {masters.designations.map(d => <Option key={d.name} value={d.name}>{d.name}</Option>)}
                                </Select>
                            </Form.Item>

                            <Form.Item name="employee_grade" label="Employee Grade">
                                <Select placeholder="Select Grade">
                                    {masters.grades.map(g => <Option key={g.name} value={g.name}>{g.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </div>

                        <Divider orientation="left" style={{ margin: '12px 0' }}><Text type="secondary" strong>Activities</Text></Divider>

                        <Form.List name="activities">
                            {(fields, { add, remove }) => (
                                <>
                                    <div className="bg-gray-50 p-2 rounded border mb-4">
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} className="flex gap-4 items-start mb-2 bg-white p-3 rounded border border-gray-100 relative">
                                                <div className="flex-1">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'activity_name']}
                                                        label="Activity Name"
                                                        rules={[{ required: true, message: 'Required' }]}
                                                        className="mb-0"
                                                    >
                                                        <Input placeholder="e.g. IT Setup" />
                                                    </Form.Item>
                                                </div>
                                                <div className="w-48">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'user']}
                                                        label="User"
                                                        className="mb-0"
                                                    >
                                                        <Select placeholder="Select User" showSearch optionFilterProp="children">
                                                            {masters.users.map(u => <Option key={u.name} value={u.name}>{u.full_name || u.name}</Option>)}
                                                        </Select>
                                                    </Form.Item>
                                                </div>
                                                <div className="w-24">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'begin_on']}
                                                        label="Begin (Days)"
                                                        className="mb-0"
                                                    >
                                                        <Input type="number" placeholder="0" />
                                                    </Form.Item>
                                                </div>
                                                <div className="w-24">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'duration']}
                                                        label="Duration"
                                                        className="mb-0"
                                                    >
                                                        <Input type="number" placeholder="0" />
                                                    </Form.Item>
                                                </div>
                                                <Button 
                                                    type="text" 
                                                    danger 
                                                    icon={<MinusCircleOutlined />} 
                                                    onClick={() => remove(name)} 
                                                    className="mt-8"
                                                />
                                            </div>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-2">
                                            Add Row
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Spin>
            </Modal>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
                .ant-modal-header { border-bottom: 1px solid #f0f0f0; margin-bottom: 0; padding: 16px 24px; }
                .ant-modal-title { font-weight: 600; color: #111827; }
                .ant-form-item-label label { font-size: 12px; color: #4b5563; font-weight: 500; height: auto !important; }
            `}} />
        </div>
    );
}
