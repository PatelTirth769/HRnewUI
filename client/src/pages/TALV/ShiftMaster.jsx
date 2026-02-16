import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, TimePicker, Select, notification, Spin, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

export default function ShiftMaster() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [holidayLists, setHolidayLists] = useState([]);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    fetchShifts();
    fetchHolidayLists();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/resource/Shift Type?fields=["name","start_time","end_time","holiday_list"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setShifts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
      notification.error({ message: "Failed to fetch Shift Types" });
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidayLists = async () => {
    try {
      const response = await api.get('/api/resource/Holiday List?fields=["name"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setHolidayLists(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching holiday lists:", error);
    }
  };

  const handleEdit = (record) => {
    setEditingShift(record);
    form.setFieldsValue({
      name: record.name,
      start_time: dayjs(record.start_time, 'HH:mm:ss'),
      end_time: dayjs(record.end_time, 'HH:mm:ss'),
      holiday_list: record.holiday_list
    });
    setModalVisible(true);
  };

  const handleDelete = (name) => {
    modal.confirm({
      title: 'Are you sure you want to delete this Shift Type?',
      icon: <ExclamationCircleOutlined />,
      content: `This action cannot be undone for "${name}".`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await api.delete(`/api/resource/Shift Type/${encodeURIComponent(name)}`);
          notification.success({ message: "Shift Type deleted successfully" });
          fetchShifts();
        } catch (error) {
          notification.error({ message: "Failed to delete Shift Type", description: error.message });
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss'),
        holiday_list: values.holiday_list
      };

      if (editingShift) {
        await api.put(`/api/resource/Shift Type/${encodeURIComponent(editingShift.name)}`, payload);
        notification.success({ message: "Shift Type updated successfully" });
      } else {
        await api.post('/api/resource/Shift Type', {
          name: values.name,
          ...payload
        });
        notification.success({ message: "Shift Type created successfully" });
      }

      setModalVisible(false);
      form.resetFields();
      setEditingShift(null);
      fetchShifts();
    } catch (error) {
      console.error("Error saving shift:", error);
      notification.error({
        message: "Failed to save Shift Type",
        description: error.response?.data?.exception || error.message
      });
    }
  };

  const columns = [
    { title: 'Shift Name', dataIndex: 'name', key: 'name' },
    { title: 'Start Time', dataIndex: 'start_time', key: 'start_time' },
    { title: 'End Time', dataIndex: 'end_time', key: 'end_time' },
    { title: 'Holiday List', dataIndex: 'holiday_list', key: 'holiday_list' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
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
          <nav className="text-xs text-gray-500 mb-1">HOME {'>'} MASTER {'>'} SHIFT MASTER</nav>
          <h1 className="text-2xl font-bold text-gray-800">Shift Master</h1>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingShift(null); form.resetFields(); setModalVisible(true); }}>
          New Shift
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? <div className="text-center p-10"><Spin /></div> : (
          <Table dataSource={shifts} columns={columns} rowKey="name" pagination={{ pageSize: 10 }} />
        )}
      </div>

      <Modal
        title={editingShift ? "Edit Shift Type" : "New Shift Type"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingShift && (
            <Form.Item name="name" label="Shift Name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Day Shift" />
            </Form.Item>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="start_time" label="Start Time" rules={[{ required: true }]}>
              <TimePicker className="w-full" format="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="end_time" label="End Time" rules={[{ required: true }]}>
              <TimePicker className="w-full" format="HH:mm:ss" />
            </Form.Item>
          </div>
          <Form.Item name="holiday_list" label="Holiday List">
            <Select placeholder="Select Holiday List" allowClear>
              {holidayLists.map(hl => (
                <Option key={hl.name} value={hl.name}>{hl.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingShift ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}