import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, DatePicker, notification, Spin, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ShiftPlanningUpload() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  // Filters (keeping simplistic for now, can be wired up later)
  const [company, setCompany] = useState('BOMBAIM');

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
    fetchShiftTypes();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/resource/Shift Assignment?fields=["name","employee","employee_name","shift_type","start_date","end_date","status"]&order_by=start_date desc&limit_page_length=None');
      if (response.data && response.data.data) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      notification.error({ message: "Failed to fetch Shift Assignments" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&limit_page_length=None');
      if (response.data && response.data.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchShiftTypes = async () => {
    try {
      const response = await api.get('/api/resource/Shift Type?fields=["name"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setShiftTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching shift types:", error);
    }
  };

  const handleEdit = (record) => {
    setEditingAssignment(record);
    form.setFieldsValue({
      employee: record.employee,
      shift_type: record.shift_type,
      start_date: dayjs(record.start_date),
      end_date: record.end_date ? dayjs(record.end_date) : null,
      status: record.status // Set status
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        employee: values.employee,
        shift_type: values.shift_type,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
        status: values.status // Use form status
      };

      if (editingAssignment) {
        await api.put(`/api/resource/Shift Assignment/${encodeURIComponent(editingAssignment.name)}`, payload);
        notification.success({ message: "Shift Assignment updated successfully" });
      } else {
        await api.post('/api/resource/Shift Assignment', payload);
        notification.success({ message: "Shift Assignment created successfully" });
      }

      setModalVisible(false);
      form.resetFields();
      setEditingAssignment(null);
      fetchAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
      notification.error({
        message: "Failed to save assignment",
        description: error.response?.data?.exception || error.message
      });
    }
  };

  const handleDelete = (name) => {
    modal.confirm({
      title: 'Are you sure you want to delete this assignment?',
      icon: <ExclamationCircleOutlined />,
      content: `This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await api.delete(`/api/resource/Shift Assignment/${encodeURIComponent(name)}`);
          notification.success({ message: "Assignment deleted successfully" });
          fetchAssignments();
        } catch (error) {
          notification.error({ message: "Failed to delete assignment" });
        }
      },
    });
  };

  const columns = [
    { title: 'Employee', dataIndex: 'employee_name', key: 'employee_name', render: (text, record) => `${text} (${record.employee})` },
    { title: 'Shift Type', dataIndex: 'shift_type', key: 'shift_type' },
    { title: 'Start Date', dataIndex: 'start_date', key: 'start_date' },
    { title: 'End Date', dataIndex: 'end_date', key: 'end_date' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.name)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {contextHolder}
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} SHIFT PLANNING</nav>

      <div className="bg-white rounded-md border p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Shift Assignments</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingAssignment(null); form.resetFields(); setModalVisible(true); }}>
            New Assignment
          </Button>
        </div>

        {/* Keep existing summary/filter UI if needed, or simplify */}
        {/* For now, just the table of real data */}

        {loading ? <div className="text-center p-10"><Spin /></div> : (
          <Table dataSource={assignments} columns={columns} rowKey="name" pagination={{ pageSize: 10 }} />
        )}
      </div>

      <Modal
        title={editingAssignment ? "Edit Shift Assignment" : "New Shift Assignment"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="employee" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select Employee" showSearch optionFilterProp="children" disabled={!!editingAssignment}>
              {employees.map(emp => (
                <Option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="shift_type" label="Shift Type" rules={[{ required: true }]}>
            <Select placeholder="Select Shift Type">
              {shiftTypes.map(st => (
                <Option key={st.name} value={st.name}>{st.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active" rules={[{ required: true }]}>
            <Select placeholder="Select Status">
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="start_date" label="Start Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="end_date" label="End Date">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingAssignment ? "Update Assignment" : "Assign Shift"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}