import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, notification, Row, Col, Space } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSProfilePersonal({ employeeData }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (employeeData) {
            form.setFieldsValue({
                ...employeeData,
                date_of_birth: employeeData.date_of_birth ? dayjs(employeeData.date_of_birth) : null,
            });
        }
    }, [employeeData, form]);

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const payload = {
                ...values,
                date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
            };
            
            await API.put(`/api/resource/Employee/${employeeData.name}`, payload);
            notification.success({ message: "Profile updated successfully" });
        } catch (err) {
            console.error(err);
            notification.error({ message: "Failed to update profile", description: err.response?.data?.message || err.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Personal Details</h2>
            
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={() => {}} // Can handle local state if needed
            >
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="salutation" label="Title">
                            <Select placeholder="Select Title">
                                {['Mr', 'Ms', 'Mrs', 'Dr'].map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="middle_name" label="Middle Name">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                            <Select placeholder="Select Gender">
                                {['Male', 'Female', 'Other'].map(g => <Option key={g} value={g}>{g}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="blood_group" label="Blood Group">
                            <Select placeholder="Select Blood Group">
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <Option key={b} value={b}>{b}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item name="personal_email" label="Personal Email" rules={[{ type: 'email' }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="cell_number" label="Mobile No.">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item name="current_address" label="Current Address">
                            <TextArea rows={2} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item name="permanent_address" label="Permanent Address">
                            <TextArea rows={2} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="marital_status" label="Marital Status">
                            <Select placeholder="Select Status">
                                {['Single', 'Married', 'Divorced', 'Widowed'].map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="pan_number" label="PAN No.">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                    <Button onClick={() => form.resetFields()}>Reset</Button>
                    <Button type="primary" htmlType="submit" loading={saving} className="bg-orange-500 border-none hover:bg-orange-600">
                        Update Profile
                    </Button>
                </div>
            </Form>

            <div className="mt-6 text-xs text-blue-700 bg-blue-50 p-4 rounded border border-blue-100">
                <div className="font-semibold mb-1">Note:</div>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Changes made here may require HR review before being finalized in some systems.</li>
                    <li>Please ensure your contact details are always up to date for emergency purposes.</li>
                </ul>
            </div>
        </div>
    );
}
