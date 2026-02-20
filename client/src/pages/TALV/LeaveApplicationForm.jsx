import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, Select, notification, Spin, Checkbox } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const LeaveApplicationForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveApprovers, setLeaveApprovers] = useState([]);
    const [letterHeads, setLetterHeads] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState(0);
    const [allocationValidity, setAllocationValidity] = useState({ from: null, to: null, exists: false });
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        fetchDropdowns();
        if (id) {
            setIsEditMode(true);
            fetchLeaveDetails(id);
        }
    }, [id]);

    const fetchDropdowns = async () => {
        try {
            const [empRes, typeRes, userRes, lhRes] = await Promise.all([
                api.get('/api/resource/Employee?fields=["name","employee_name","company","department","reports_to"]&filters=[["status","=","Active"]]&limit_page_length=None'),
                api.get('/api/resource/Leave Type?fields=["name"]&limit_page_length=None'),
                api.get('/api/resource/User?fields=["name","full_name"]&filters=[["enabled","=",1]]&limit_page_length=None'),
                api.get('/api/resource/Letter Head?fields=["name"]&limit_page_length=None')
            ]);

            if (empRes.data && empRes.data.data) setEmployees(empRes.data.data);
            if (typeRes.data && typeRes.data.data) setLeaveTypes(typeRes.data.data);
            if (userRes.data && userRes.data.data) setLeaveApprovers(userRes.data.data);
            if (lhRes.data && lhRes.data.data) setLetterHeads(lhRes.data.data);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    };

    const fetchLeaveDetails = async (leaveId) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/resource/Leave Application/${leaveId}`);
            if (response.data && response.data.data) {
                const data = response.data.data;
                form.setFieldsValue({
                    ...data,
                    from_date: data.from_date ? dayjs(data.from_date) : null,
                    to_date: data.to_date ? dayjs(data.to_date) : null,
                    posting_date: data.posting_date ? dayjs(data.posting_date) : dayjs(),
                    color: data.color || '#F0F0F0',
                    leave_balance: data.leave_balance || 0
                });

                // If checking balance is needed on edit, can do here
            }
        } catch (error) {
            console.error("Error fetching leave details:", error);
            notification.error({ message: "Failed to fetch leave details" });
        } finally {
            setLoading(false);
        }
    };

    const fetchAllocationDetails = async (employee, leaveType) => {
        if (!employee || !leaveType) return;

        try {
            // Fetch active allocation for this employee and leave type
            const response = await api.get(`/api/resource/Leave Allocation?fields=["name","total_leaves_allocated","new_leaves_allocated","from_date","to_date"]&filters=[["employee","=","${employee}"],["leave_type","=","${leaveType}"],["docstatus","=",1]]&limit_page_length=1`);

            if (response.data && response.data.data && response.data.data.length > 0) {
                const alloc = response.data.data[0];
                setAllocationValidity({
                    from: alloc.from_date,
                    to: alloc.to_date,
                    exists: true
                });

                // For now, setting total allocated as balance placeholder. 
                // Actual balance requires calculating leaves taken which is complex on frontend.
                // Ideally use get_leave_balance_on API if available
                setLeaveBalance(alloc.total_leaves_allocated); // Simplified
                form.setFieldsValue({ leave_balance: alloc.total_leaves_allocated });
            } else {
                setAllocationValidity({ from: null, to: null, exists: false });
                setLeaveBalance(0);
                form.setFieldsValue({ leave_balance: 0 });
                notification.warning({
                    message: "No Active Allocation Found",
                    description: `No active ${leaveType} allocation found for this employee.`
                });
            }
        } catch (error) {
            console.error("Error fetching allocation:", error);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            let total_days = 0;
            if (values.from_date && values.to_date) {
                const start = dayjs(values.from_date);
                const end = dayjs(values.to_date);

                // Client-side validation for allocation
                if (allocationValidity.exists && allocationValidity.from && allocationValidity.to) {
                    const allocStart = dayjs(allocationValidity.from);
                    const allocEnd = dayjs(allocationValidity.to);

                    if (start.isBefore(allocStart) || end.isAfter(allocEnd)) {
                        notification.error({
                            message: "Invalid Leave Dates",
                            description: `Leave dates must be within the allocated period: ${allocationValidity.from} to ${allocationValidity.to}`
                        });
                        setLoading(false);
                        return;
                    }
                }

                const diff = end.diff(start, 'day') + 1;
                total_days = diff > 0 ? diff : 0;

                if (values.half_day) {
                    total_days = 0.5;
                }
            }

            const payload = {
                ...values,
                doctype: "Leave Application",
                from_date: values.from_date ? values.from_date.format('YYYY-MM-DD') : null,
                to_date: values.to_date ? values.to_date.format('YYYY-MM-DD') : null,
                posting_date: values.posting_date ? values.posting_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                status: values.status || 'Open',
                company: values.company,
                department: values.department,
                docstatus: values.status === 'Approved' || values.status === 'Rejected' ? 1 : 0,
                half_day: values.half_day ? 1 : 0,
                follow_via_email: values.follow_via_email ? 1 : 0,
                total_leave_days: total_days,
                color: values.color || '#000000'
            };

            if (isEditMode) {
                await api.put(`/api/resource/Leave Application/${id}`, payload);
                notification.success({ message: "Leave Application updated successfully" });
            } else {
                await api.post('/api/resource/Leave Application', payload);
                notification.success({ message: "Leave Application created successfully" });
            }
            navigate('/talv/leave-application');
        } catch (error) {
            console.error("Error saving leave application:", error);
            if (error.response) {
                console.error("Server Error Response Data:", error.response.data);
            }

            let errorMessage = "Failed to save leave application";
            if (error.response && error.response.data) {
                if (error.response.data._server_messages) {
                    try {
                        const msgs = JSON.parse(error.response.data._server_messages);
                        errorMessage = JSON.parse(msgs[0]).message;
                    } catch (e) {
                        errorMessage = error.response.data.exception || "Unknown server error";
                    }
                } else if (error.response.data.exception) {
                    errorMessage = error.response.data.exception;
                }
            }

            notification.error({
                message: "Failed to save leave application",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 border-b pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Leave Application' : 'New Leave Application'}</h1>
                        <p className="text-gray-500 text-sm">Fill in the details below</p>
                    </div>
                    <Button onClick={() => navigate('/talv/leave-application')}>Cancel</Button>
                </div>

                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={{ status: 'Open', posting_date: dayjs(), color: '#000000' }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item
                                name="employee"
                                label="Employee"
                                rules={[{ required: true, message: 'Please select an employee' }]}
                            >
                                <Select
                                    placeholder="Select Employee"
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(val) => {
                                        const emp = employees.find(e => e.name === val);
                                        if (emp) {
                                            form.setFieldsValue({
                                                employee_name: emp.employee_name,
                                                company: emp.company,
                                                department: emp.department
                                            });
                                            // Trigger allocation fetch if leave type is already selected
                                            const currentLeaveType = form.getFieldValue('leave_type');
                                            if (currentLeaveType) {
                                                fetchAllocationDetails(val, currentLeaveType);
                                            }
                                        }
                                    }}
                                >
                                    {employees.map(emp => (
                                        <Option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="employee_name" label="Employee Name" hidden>
                                <Input />
                            </Form.Item>

                            <Form.Item name="company" label="Company" hidden>
                                <Input />
                            </Form.Item>

                            <Form.Item name="department" label="Department" hidden>
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="leave_type"
                                label="Leave Type"
                                rules={[{ required: true, message: 'Please select leave type' }]}
                            >
                                <Select
                                    placeholder="Select Leave Type"
                                    onChange={(val) => {
                                        const currentEmployee = form.getFieldValue('employee');
                                        if (currentEmployee) {
                                            fetchAllocationDetails(currentEmployee, val);
                                        }
                                    }}
                                >
                                    {leaveTypes.map(type => (
                                        <Option key={type.name} value={type.name}>{type.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {allocationValidity.exists && (
                                <div className="text-xs text-green-600 mb-4 col-span-2 md:col-span-2">
                                    Active Allocation: {allocationValidity.from} to {allocationValidity.to}
                                </div>
                            )}

                            <Form.Item
                                name="from_date"
                                label="From Date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="YYYY-MM-DD"
                                    disabledDate={(current) => {
                                        if (!allocationValidity.exists || !allocationValidity.from || !allocationValidity.to) return false;
                                        return current && (current < dayjs(allocationValidity.from) || current > dayjs(allocationValidity.to));
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="to_date"
                                label="To Date"
                                rules={[{ required: true }]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="YYYY-MM-DD"
                                    disabledDate={(current) => {
                                        if (!allocationValidity.exists || !allocationValidity.from || !allocationValidity.to) return false;
                                        return current && (current < dayjs(allocationValidity.from) || current > dayjs(allocationValidity.to));
                                    }}
                                />
                            </Form.Item>

                            <Form.Item name="posting_date" label="Posting Date" hidden>
                                <DatePicker />
                            </Form.Item>

                            <Form.Item name="status" label="Status">
                                <Select>
                                    <Option value="Open">Open</Option>
                                    <Option value="Approved">Approved</Option>
                                    <Option value="Rejected">Rejected</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="leave_approver" label="Leave Approver">
                                <Select
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(val) => {
                                        const u = leaveApprovers.find(u => u.name === val);
                                        if (u) form.setFieldsValue({ leave_approver_name: u.full_name });
                                    }}
                                >
                                    {leaveApprovers.map(u => (
                                        <Option key={u.name} value={u.name}>{u.full_name} ({u.name})</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="leave_approver_name" label="Leave Approver Name" hidden>
                                <Input />
                            </Form.Item>

                            <Form.Item name="letter_head" label="Letter Head">
                                <Select>
                                    {letterHeads.map(lh => (
                                        <Option key={lh.name} value={lh.name}>{lh.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item name="color" label="Color">
                                <Input type="color" className="w-full h-9 p-1" />
                            </Form.Item>

                            <Form.Item name="leave_balance" label="Leave Balance Before Application">
                                <Input readOnly className="bg-gray-50" />
                            </Form.Item>

                            <Form.Item name="total_leave_days" label="Total Leave Days">
                                <Input readOnly className="bg-gray-50" />
                            </Form.Item>

                            <Form.Item name="follow_via_email" valuePropName="checked">
                                <Checkbox>Follow via Email</Checkbox>
                            </Form.Item>

                            <Form.Item name="half_day" valuePropName="checked">
                                <Checkbox>Half Day</Checkbox>
                            </Form.Item>
                        </div>

                        <Form.Item name="description" label="Reason (Description)">
                            <TextArea rows={4} placeholder="Enter reason for leave" />
                        </Form.Item>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button onClick={() => navigate('/talv/leave-application')}>Cancel</Button>
                            <Button type="primary" htmlType="submit" className="bg-blue-600">
                                {isEditMode ? 'Update' : 'Submit'}
                            </Button>
                        </div>
                    </Form>
                </Spin>
            </div>
        </div >
    );
};

export default LeaveApplicationForm;
