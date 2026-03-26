import React, { useState, useEffect } from 'react';
import { Table, Tag, notification, Space, Button, Select, Input, Modal, Form, DatePicker, Tooltip, Checkbox, Divider, Typography, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ReloadOutlined, MinusCircleOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

export default function ESSOnboarding({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);
    const [loadingRecord, setLoadingRecord] = useState(false);

    // Master data for dropdowns
    const [masters, setMasters] = useState({
        applicants: [],
        employees: [],
        companies: [],
        jobOffers: [],
        templates: [],
        departments: [],
        designations: [],
        grades: [],
        holidayLists: [],
        users: []
    });

    useEffect(() => {
        fetchData();
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [
                applicantRes, empRes, companyRes, jobOfferRes, templateRes,
                deptRes, desigRes, gradeRes, holidayRes, userRes
            ] = await Promise.all([
                API.get('/api/resource/Job Applicant?fields=["name","applicant_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Job Offer?fields=["name","applicant_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee Onboarding Template?fields=["*"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Employee Grade?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Holiday List?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/User?fields=["name","full_name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);

            setMasters({
                applicants: applicantRes.data?.data || [],
                employees: empRes.data?.data || [],
                companies: companyRes.data?.data || [],
                jobOffers: jobOfferRes.data?.data || [],
                templates: templateRes.data?.data || [],
                departments: deptRes.data?.data || [],
                designations: desigRes.data?.data || [],
                grades: gradeRes.data?.data || [],
                holidayLists: holidayRes.data?.data || [],
                users: userRes.data?.data || []
            });
        } catch (err) {
            console.error("Failed to fetch masters:", err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let filters = [];
            if (filterStatus !== 'All') filters.push(["boarding_status", "=", filterStatus]);

            const res = await API.get(`/api/resource/Employee Onboarding?fields=["*"]&filters=${JSON.stringify(filters)}&order_by=modified desc`);
            setData(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch onboarding records:", err);
            notification.error({ message: "Failed to load onboarding records" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const payload = {
                ...values,
                date_of_joining: values.date_of_joining ? values.date_of_joining.format('YYYY-MM-DD') : null,
                boarding_begins_on: values.boarding_begins_on ? values.boarding_begins_on.format('YYYY-MM-DD') : null,
                notify_users_by_email: values.notify_users_by_email ? 1 : 0,
                activities: (values.activities || []).map(act => ({
                    ...act,
                    begin_on: parseInt(act.begin_on) || 0,
                    duration: parseInt(act.duration) || 0
                }))
            };

            if (editingRecord) {
                await API.put(`/api/resource/Employee Onboarding/${encodeURIComponent(editingRecord.name)}`, payload);
                notification.success({ message: "Onboarding record updated successfully" });
            } else {
                await API.post('/api/resource/Employee Onboarding', payload);
                notification.success({ message: "Onboarding record created successfully" });
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
        if (!window.confirm(`Are you sure you want to delete onboarding record ${name}?`)) return;
        try {
            await API.delete(`/api/resource/Employee Onboarding/${encodeURIComponent(name)}`);
            notification.success({ message: "Record deleted successfully" });
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
                const res = await API.get(`/api/resource/Employee Onboarding/${encodeURIComponent(record.name)}`);
                const fullRecord = res.data.data;
                form.setFieldsValue({
                    ...fullRecord,
                    date_of_joining: fullRecord.date_of_joining ? dayjs(fullRecord.date_of_joining) : null,
                    boarding_begins_on: fullRecord.boarding_begins_on ? dayjs(fullRecord.boarding_begins_on) : null,
                    notify_users_by_email: fullRecord.notify_users_by_email === 1,
                    activities: fullRecord.activities || []
                });
            } catch (err) {
                console.error("Failed to fetch full record:", err);
                notification.error({ message: "Failed to load full record details" });
                // Fallback to basic record if fetch fails
                form.setFieldsValue({
                    ...record,
                    date_of_joining: record.date_of_joining ? dayjs(record.date_of_joining) : null,
                    boarding_begins_on: record.boarding_begins_on ? dayjs(record.boarding_begins_on) : null,
                    notify_users_by_email: record.notify_users_by_email === 1,
                });
            } finally {
                setLoadingRecord(false);
            }
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'Pending', boarding_status: 'Pending', activities: [] });
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
            title: 'Employee Name',
            dataIndex: 'employee_name',
            key: 'employee_name',
        },
        {
            title: 'Job Applicant',
            dataIndex: 'job_applicant',
            key: 'job_applicant',
        },
        {
            title: 'Date of Joining',
            dataIndex: 'date_of_joining',
            key: 'date_of_joining',
            render: (d) => d ? dayjs(d).format('DD MMM YYYY') : '-',
        },
        {
            title: 'Template',
            dataIndex: 'employee_onboarding_template',
            key: 'employee_onboarding_template',
            render: (val) => {
                const t = masters.templates.find(x => x.name === val);
                return t ? (t.template_name || t.title || t.heading || val) : (val || '-');
            }
        },
        {
            title: 'Status',
            dataIndex: 'boarding_status',
            key: 'boarding_status',
            render: (status) => {
                let color = 'blue';
                if (status === 'Completed') color = 'green';
                if (status === 'Pending') color = 'orange';
                if (status === 'Cancelled') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            }
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
                <div className="flex flex-wrap items-center gap-4">
                    <Input 
                        placeholder="Search employee or ID..." 
                        prefix={<SearchOutlined className="text-gray-400" />}
                        className="w-64"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                    />
                    <Select 
                        value={filterStatus} 
                        onChange={setFilterStatus}
                        className="w-40"
                    >
                        <Option value="All">All Status</Option>
                        <Option value="Pending">Pending</Option>
                        <Option value="In Progress">In Progress</Option>
                        <Option value="Completed">Completed</Option>
                        <Option value="Cancelled">Cancelled</Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} />
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} className="bg-blue-600">
                    New Onboarding
                </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <Table 
                    columns={columns}
                    dataSource={data.filter(item => 
                        !searchText || 
                        (item.employee_name && item.employee_name.toLowerCase().includes(searchText.toLowerCase())) ||
                        (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
                        (item.job_applicant && item.job_applicant.toLowerCase().includes(searchText.toLowerCase()))
                    )}
                    loading={loading}
                    rowKey="name"
                    pagination={{ pageSize: 10 }}
                    size="middle"
                />
            </div>

            <Modal
                title={editingRecord ? `Edit Employee Onboarding: ${editingRecord.name}` : "New Employee Onboarding"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={saving}
                width={900}
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
                        {/* Row 1 */}
                        <Form.Item name="job_applicant" label="Job Applicant" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Select Applicant" allowClear optionFilterProp="children">
                                {masters.applicants.map(a => <Option key={a.name} value={a.name}>{a.applicant_name} ({a.name})</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="company" label="Company" rules={[{ required: true }]}>
                            <Select placeholder="Select Company">
                                {masters.companies.map(c => <Option key={c.name} value={c.name}>{c.name}</Option>)}
                            </Select>
                        </Form.Item>

                        {/* Row 2 */}
                        <Form.Item name="job_offer" label="Job Offer" rules={[{ required: true }]}>
                            <Select placeholder="Select Job Offer" showSearch optionFilterProp="children">
                                {masters.jobOffers.map(j => (
                                    <Option key={j.name} value={j.name}>
                                        {j.applicant_name ? `${j.applicant_name} (${j.name})` : j.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="boarding_status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="Pending">Pending</Option>
                                <Option value="In Progress">In Progress</Option>
                                <Option value="Completed">Completed</Option>
                                <Option value="Cancelled">Cancelled</Option>
                            </Select>
                        </Form.Item>

                        {/* Row 3 */}
                        <Form.Item name="employee_onboarding_template" label="Employee Onboarding Template">
                            <Select placeholder="Select Template" showSearch optionFilterProp="children">
                                {masters.templates.map(t => (
                                    <Option key={t.name} value={t.name}>
                                        {t.template_name || t.title || t.heading ? `${t.template_name || t.title || t.heading} (${t.name})` : t.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <div /> {/* Spacer */}
                    </div>

                    <Divider orientation="left" style={{ margin: '12px 0' }}><Text type="secondary" strong>Employee Details</Text></Divider>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <Form.Item name="employee_name" label="Employee Name" rules={[{ required: true }]}>
                            <Input placeholder="Full Name" />
                        </Form.Item>
                        <Form.Item name="date_of_joining" label="Date of Joining" rules={[{ required: true }]}>
                            <DatePicker className="w-full" />
                        </Form.Item>

                        <Form.Item name="department" label="Department">
                            <Select placeholder="Select Department">
                                {masters.departments.map(d => <Option key={d.name} value={d.name}>{d.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="boarding_begins_on" label="Onboarding Begins On" rules={[{ required: true }]}>
                            <DatePicker className="w-full" />
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

                        <Form.Item name="holiday_list" label="Holiday List">
                            <Select placeholder="Select Holiday List">
                                {masters.holidayLists.map(h => <Option key={h.name} value={h.name}>{h.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="employee" label="Employee Link">
                            <Select showSearch placeholder="Select Employee Record" allowClear>
                                {masters.employees.map(e => <Option key={e.name} value={e.name}>{e.employee_name} ({e.name})</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Divider orientation="left" style={{ margin: '12px 0' }}><Text type="secondary" strong>Onboarding Activities</Text></Divider>

                    <Form.List name="activities">
                        {(fields, { add, remove }) => (
                            <>
                                <div className="bg-gray-50 p-2 rounded border mb-4">
                                    {fields.map(({ key, name, ...restField }) => (
                                        <div key={key} className="flex gap-4 items-start mb-2 bg-white p-3 rounded border border-gray-100 shadow-sm relative">
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
                                            <div className="w-32">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'begin_on']}
                                                    label="Begin (Days)"
                                                    className="mb-0"
                                                >
                                                    <Input type="number" placeholder="Days" />
                                                </Form.Item>
                                            </div>
                                            <div className="w-32">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'duration']}
                                                    label="Duration (Days)"
                                                    className="mb-0"
                                                >
                                                    <Input type="number" placeholder="Days" />
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
                                    {fields.length === 0 && (
                                        <div className="text-center py-6 text-gray-400">No activities added yet</div>
                                    )}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-2">
                                        Add Row
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form.List>

                    <Form.Item name="notify_users_by_email" valuePropName="checked">
                        <Checkbox>Notify users by email</Checkbox>
                    </Form.Item>
                </Form>
                </Spin>
            </Modal>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; }
                .ant-modal-header { border-bottom: 1px solid #f0f0f0; margin-bottom: 0; padding: 16px 24px; }
                .ant-modal-title { font-weight: 600; color: #111827; }
                .ant-form-item-label label { font-size: 12px; color: #4b5563; font-weight: 500; height: auto !important; }
                .ant-divider-horizontal.ant-divider-with-text { font-size: 14px; border-top-color: #e5e7eb; }
                .ant-divider-inner-text { padding: 0 12px 0 0; }
                .ant-form-item { margin-bottom: 16px; }
            `}} />
        </div>
    );
}
