import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, notification, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

export default function LeavePolicyConfig() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Fetch Policies and Leave Types
  useEffect(() => {
    fetchPolicies();
    fetchLeaveTypes();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/resource/Leave Policy?fields=["name","title"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setPolicies(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
      notification.error({ message: "Failed to fetch Leave Policies" });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get('/api/resource/Leave Type?fields=["name"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setLeaveTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const handleEdit = async (policyName) => {
    try {
      const response = await api.get(`/api/resource/Leave Policy/${encodeURIComponent(policyName)}`);
      if (response.data && response.data.data) {
        const data = response.data.data;
        setEditingPolicy(data);
        form.setFieldsValue({
          name: data.name,
          title: data.title,
          details: data.leave_policy_details || []
        });
        setModalVisible(true);
      }
    } catch (error) {
      notification.error({ message: "Failed to fetch policy details" });
    }
  };

  const handleDelete = (policyName) => {
    modal.confirm({
      title: 'Are you sure you want to delete this policy?',
      icon: <ExclamationCircleOutlined />,
      content: `This action cannot be undone for "${policyName}".`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await api.delete(`/api/resource/Leave Policy/${encodeURIComponent(policyName)}`);
          notification.success({ message: "Policy deleted successfully" });
          fetchPolicies();
        } catch (error) {
          notification.error({ message: "Failed to delete policy", description: error.message });
        }
      },
    });
  };

  const handleFinish = async (values) => {
    try {
      const payload = {
        title: values.title,
        leave_policy_details: values.details
      };

      if (editingPolicy) {
        await api.put(`/api/resource/Leave Policy/${encodeURIComponent(editingPolicy.name)}`, payload);
        notification.success({ message: "Policy updated successfully" });
      } else {
        // Include name for new creation if mapped, otherwise rely on naming series
        // Usually Leave Policy name is manually set or auto-generated. Let's assume title is used or manual name.
        // Simplified: Use title as name trigger? Or let backend handle it.
        // If name is manual, we need a field. Let's start with payload containing `leave_policy_details`.
        // Usually we need `name` field for new policy if not auto-named.
        await api.post('/api/resource/Leave Policy', {
          name: values.name, // If manual
          ...payload
        });
        notification.success({ message: "Policy created successfully" });
      }
      setModalVisible(false);
      fetchPolicies();
      form.resetFields();
    } catch (error) {
      console.error(error);
      notification.error({ message: "Operation failed", description: error.response?.data?.exception });
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record.name)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.name)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {contextHolder}
      <div className="flex justify-between items-center mb-6">
        <div>
          <nav className="text-xs text-gray-500 mb-1">HOME {'>'} MASTER {'>'} LEAVE POLICY CONFIG</nav>
          <h1 className="text-2xl font-bold text-gray-800">Leave Policies</h1>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingPolicy(null); form.resetFields(); setModalVisible(true); }}>
          New Policy
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? <div className="text-center p-10"><Spin /></div> : (
          <Table dataSource={policies} columns={columns} rowKey="name" pagination={{ pageSize: 10 }} />
        )}
      </div>

      <Modal
        title={editingPolicy ? "Edit Leave Policy" : "New Leave Policy"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {!editingPolicy && (
            <Form.Item name="name" label="Policy Name (ID)" rules={[{ required: true }]}>
              <Input placeholder="e.g. LP-2025-GEN" />
            </Form.Item>
          )}
          <Form.Item name="title" label="Title">
            <Input placeholder="e.g. General Policy 2025" />
          </Form.Item>

          <Form.List name="details">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-4 items-end mb-4 border p-3 rounded bg-gray-50">
                    <Form.Item
                      {...restField}
                      name={[name, 'leave_type']}
                      label="Leave Type"
                      rules={[{ required: true }]}
                      className="mb-0 w-1/2"
                    >
                      <Select placeholder="Select Leave Type">
                        {leaveTypes.map(lt => <Option key={lt.name} value={lt.name}>{lt.name}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'annual_allocation']}
                      label="Annual Allocation"
                      rules={[{ required: true }]}
                      className="mb-0 w-1/4"
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Leave Allocation
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}