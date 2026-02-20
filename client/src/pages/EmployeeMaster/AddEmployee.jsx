import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import './AddEmployee.css';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Tabs,
  Row,
  Col,
  message,
  notification,
  Checkbox,
  Spin,
  Card,
  Typography
} from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;
const TextArea = Input.TextArea;

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ERPNext 'name' (e.g. HR-EMP-00001)
  const isEdit = !!id;
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Dropdown Options (Static for now, can be fetched if APIs exist) ---
  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Admin'];
  const designations = ['Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager', 'HR Manager', 'Accountant', 'Marketing Executive', 'Sales Executive'];
  const companies = ['Preeshe Consultancy Services', 'BOMBAIM', 'DCSAMAI', 'Kolkata_Frontend'];
  const genders = ['Male', 'Female', 'Other'];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const salutations = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Mx'];
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Probation'];
  const statusOptions = ['Active', 'Inactive', 'Suspended', 'Left'];

  useEffect(() => {
    if (isEdit) {
      fetchEmployeeDetails();
    } else {
      // Set defaults for new employee
      form.setFieldsValue({
        company: 'Preeshe Consultancy Services',
        status: 'Active',
        employment_type: 'Full-time'
      });
    }
  }, [isEdit, id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      // Fetch all fields
      const response = await API.get(`/api/resource/Employee/${id}`);
      const data = response.data.data;

      // Prepare data for Ant Design Form
      // Date fields need dayjs objects
      const formData = {
        ...data,
        date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth) : null,
        date_of_joining: data.date_of_joining ? dayjs(data.date_of_joining) : null,
        offer_date: data.offer_date ? dayjs(data.offer_date) : null,
        confirmation_date: data.confirmation_date ? dayjs(data.confirmation_date) : null,
        contract_end_date: data.contract_end_date ? dayjs(data.contract_end_date) : null,
        date_of_retirement: data.date_of_retirement ? dayjs(data.date_of_retirement) : null,
        resignation_letter_date: data.resignation_letter_date ? dayjs(data.resignation_letter_date) : null,
        relieving_date: data.relieving_date ? dayjs(data.relieving_date) : null,
        passport_issue_date: data.passport_issue_date ? dayjs(data.passport_issue_date) : null,
        passport_expiry_date: data.passport_expiry_date ? dayjs(data.passport_expiry_date) : null,
        exit_interview_held_on: data.exit_interview_held_on ? dayjs(data.exit_interview_held_on) : null,
      };

      form.setFieldsValue(formData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employee details:", err);
      message.error("Failed to fetch employee details.");
      setLoading(false);
    }
  };

  const showSuccessNotification = () => {
    api.open({
      message: 'Saved',
      description: '',
      icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
      placement: 'bottomRight',
      className: 'success-notification',
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
        borderRadius: '4px',
      },
    });
  };

  const onFinish = async (values) => {
    setSaving(true);
    try {
      // Convert dayjs dates back to strings (YYYY-MM-DD)
      const payload = { ...values };
      const dateFields = [
        'date_of_birth', 'date_of_joining', 'offer_date', 'confirmation_date',
        'contract_end_date', 'date_of_retirement', 'resignation_letter_date',
        'relieving_date', 'passport_issue_date', 'passport_expiry_date',
        'exit_interview_held_on'
      ];

      dateFields.forEach(field => {
        if (payload[field]) {
          payload[field] = payload[field].format('YYYY-MM-DD');
        } else {
          payload[field] = null; // Send null if cleared
        }
      });

      if (isEdit) {
        await API.put(`/api/resource/Employee/${id}`, payload);
        showSuccessNotification();
      } else {
        await API.post('/api/resource/Employee', payload);
        showSuccessNotification();
        // Allow user to see notification before redirecting immediately, or redirect now
        // For 'Add New', maybe stay or redirect. The previous code redirected.
        // If we redirect immediately, the notification might be lost unless handled globally.
        // For now, let's delay slightly or just redirect. Notification hooks persist through re-renders but not route changes usually?
        // Actually, 'contextHolder' is rendered here. If we navigate away, it disappears.
        // So for 'Add New', we might want to perform the action and maybe use global message or just show it and wait a bit.
        // Given 'edit' is the main focus, this works perfectly. For 'create', we'll rely on it showing briefly or change UX if needed.
        setTimeout(() => navigate('/employee-master'), 1000);
      }
    } catch (err) {
      console.error("Error saving employee:", err);
      const msg = err.response?.data?.exception || err.response?.data?.message || err.message;
      message.error(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/employee-master');
  };

  // --- Rendering Helpers for Form Sections ---
  // Using a consistent grid layou: Row with gutter, Cols with span
  const renderInput = (name, label, required = false, type = 'text') => (
    <Col span={8}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required, message: `${label} is required` }]}
      >
        {type === 'number' ? <Input type="number" /> : <Input />}
      </Form.Item>
    </Col>
  );

  const renderSelect = (name, label, options, required = false) => (
    <Col span={8}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required, message: `${label} is required` }]}
      >
        <Select showSearch optionFilterProp="children">
          {options.map(opt => (
            <Option key={opt} value={opt}>{opt}</Option>
          ))}
        </Select>
      </Form.Item>
    </Col>
  );

  const renderDate = (name, label, required = false) => (
    <Col span={8}>
      <Form.Item
        name={name}
        label={label}
        rules={[{ required, message: `${label} is required` }]}
      >
        <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" />
      </Form.Item>
    </Col>
  );

  const renderTextArea = (name, label, rows = 3) => (
    <Col span={12}>
      <Form.Item name={name} label={label}>
        <TextArea rows={rows} />
      </Form.Item>
    </Col>
  );


  // --- Tab Contents ---

  const OverviewTab = () => (
    <>
      <Title level={5}>Basic Details</Title>
      <Row gutter={16}>
        {renderSelect('salutation', 'Salutation', salutations)}
        {renderInput('first_name', 'First Name', true)}
        {renderInput('middle_name', 'Middle Name')}
        {renderInput('last_name', 'Last Name')}
        {renderSelect('gender', 'Gender', genders, true)}
        {renderDate('date_of_birth', 'Date of Birth', true)}
        {renderDate('date_of_joining', 'Date of Joining', true)}
        {renderSelect('status', 'Status', statusOptions, true)}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Company Details</Title>
      <Row gutter={16}>
        {renderSelect('company', 'Company', companies, true)}
        {renderSelect('department', 'Department', departments)}
        {renderSelect('designation', 'Designation', designations)}
        {renderInput('branch', 'Branch')}
        {renderInput('reports_to', 'Reports To (Manager ID)')}
        {renderInput('grade', 'Grade')}
        {renderSelect('employment_type', 'Employment Type', employmentTypes)}
      </Row>
      <Form.Item name="naming_series" hidden><Input /></Form.Item>
    </>
  );

  const JoiningTab = () => (
    <Row gutter={16}>
      {renderInput('job_applicant', 'Job Applicant (ID)')}
      {renderDate('offer_date', 'Offer Date')}
      {renderDate('confirmation_date', 'Confirmation Date')}
      {renderDate('contract_end_date', 'Contract End Date')}
      {renderInput('notice_number_of_days', 'Notice (days)', false, 'number')}
      {renderDate('date_of_retirement', 'Date of Retirement')}
    </Row>
  );

  const AddressTab = () => (
    <>
      <Title level={5}>Contact Information</Title>
      <Row gutter={16}>
        {renderInput('cell_number', 'Mobile Number')}
        {renderInput('personal_email', 'Personal Email Type')}
        {renderInput('company_email', 'Company Email')}
        {renderInput('prefered_contact_email', 'Preferred Contact Email')}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="unsubscribed" valuePropName="checked">
            <Checkbox>Unsubscribed</Checkbox>
          </Form.Item>
        </Col>
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Address</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="current_address" label="Current Address">
            <TextArea rows={3} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="permanent_address" label="Permanent Address">
            <TextArea rows={3} />
          </Form.Item>
        </Col>
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Emergency Contact</Title>
      <Row gutter={16}>
        {renderInput('emergency_contact_name', 'Emergency Contact Name')}
        {renderInput('emergency_phone_number', 'Emergency Phone')}
        {renderInput('relation', 'Relation')}
      </Row>
    </>
  );

  const AttendanceTab = () => (
    <>
      <Title level={5}>Attendance & Leave Settings</Title>
      <Row gutter={16}>
        {renderInput('attendance_device_id', 'Attendance Device ID (Biometric/RF)')}
        {renderInput('holiday_list', 'Holiday List')}
        {renderInput('default_shift', 'Default Shift')}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Approvers</Title>
      <Row gutter={16}>
        {renderInput('leave_approver', 'Leave Approver')}
        {renderInput('expense_approver', 'Expense Approver')}
        {renderInput('shift_request_approver', 'Shift Request Approver')}
      </Row>
    </>
  );

  const SalaryTab = () => (
    <>
      <Title level={5}>Payroll Settings</Title>
      <Row gutter={16}>
        {renderInput('ctc', 'CTC (Cost to Company)', false, 'number')}
        {renderInput('salary_currency', 'Salary Currency')}
        {renderInput('salary_mode', 'Salary Mode')}
        {renderInput('payroll_cost_center', 'Payroll Cost Center')}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Bank & Tax</Title>
      <Row gutter={16}>
        {renderInput('pan_number', 'PAN Number')}
        {renderInput('provident_fund_account', 'Provident Fund Account')}
        {renderInput('bank_name', 'Bank Name')}
        {renderInput('bank_ac_no', 'Bank Account No')}
        {renderInput('ifsc_code', 'IFSC Code')}
      </Row>
    </>
  );

  const PersonalTab = () => (
    <>
      <Title level={5}>Personal Details</Title>
      <Row gutter={16}>
        {renderSelect('marital_status', 'Marital Status', maritalStatuses)}
        {renderSelect('blood_group', 'Blood Group', bloodGroups)}
        {renderInput('family_background', 'Family Background (Details)')}
        {renderInput('health_details', 'Health Details')}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Health Insurance</Title>
      <Row gutter={16}>
        {renderInput('health_insurance_provider', 'Health Insurance Provider')}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Passport Info</Title>
      <Row gutter={16}>
        {renderInput('passport_number', 'Passport Number')}
        {renderDate('passport_issue_date', 'Date of Issue')}
        {renderDate('passport_expiry_date', 'Date of Expiry')}
        {renderInput('place_of_issue', 'Place of Issue')}
      </Row>
    </>
  );

  const ExitTab = () => (
    <>
      <Row gutter={16}>
        {renderDate('resignation_letter_date', 'Resignation Letter Date')}
        {renderDate('exit_interview_held_on', 'Exit Interview Held On')}
        {renderInput('leave_encashed', 'Leave Encashed')}
      </Row>
      <Row gutter={16}>
        {renderDate('relieving_date', 'Relieving Date')}
        {renderInput('new_workplace', 'New Workplace')}
      </Row>

      <Title level={5} style={{ marginTop: '20px' }}>Feedback</Title>
      <Row gutter={16}>
        {renderTextArea('reason_for_leaving', 'Reason for Leaving')}
        {renderTextArea('feedback', 'Feedback')}
      </Row>
    </>
  );


  // --- Main Render ---

  if (loading) {
    return <div className="loading-container"><Spin size="large" tip="Loading Employee Details..." /></div>;
  }

  return (
    <div className="add-employee-container-antd">
      {contextHolder}
      <div className="header-actions">
        <Title level={2}>{isEdit ? `Edit Employee: ${id}` : 'Add New Employee'}</Title>
        <div className="buttons">
          <Button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>Save</Button>
        </div>
      </div>

      <Card className="employee-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ status: 'Active', company: 'Preeshe Consultancy Services' }}
        >
          <Tabs defaultActiveKey="1" type="card">
            <TabPane tab="Overview" key="1">
              <OverviewTab />
            </TabPane>
            <TabPane tab="Joining" key="2">
              <JoiningTab />
            </TabPane>
            <TabPane tab="Address & Contacts" key="3">
              <AddressTab />
            </TabPane>
            <TabPane tab="Attendance & Leaves" key="4">
              <AttendanceTab />
            </TabPane>
            <TabPane tab="Salary" key="5">
              <SalaryTab />
            </TabPane>
            <TabPane tab="Personal" key="6">
              <PersonalTab />
            </TabPane>
            <TabPane tab="Exit" key="7">
              <ExitTab />
            </TabPane>
          </Tabs>
        </Form>
      </Card>
    </div>
  );
};

export default AddEmployee;