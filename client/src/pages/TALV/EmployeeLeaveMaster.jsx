import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Modal, Form, Input, Select, DatePicker, Checkbox, Button, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function EmployeeLeaveMaster() {
  const [org, setOrg] = useState('BOMBAIM');
  const [status, setStatus] = useState('CURRENT');
  const [type, setType] = useState('Privilege Leave');
  const [year, setYear] = useState(dayjs().year().toString());
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [companies, setCompanies] = useState(['BOMBAIM']);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Fetch Leave Allocations and Metadata
  useEffect(() => {
    fetchAllocations();
    fetchMetadata();
  }, [type, year]);

  const fetchMetadata = async () => {
    try {
      // Fetch Employees
      const empRes = await API.get('/api/resource/Employee?fields=["name","employee_name","company"]&filters=[["status","=","Active"]]&limit_page_length=None');
      if (empRes.data && empRes.data.data) {
        setEmployees(empRes.data.data);
      }

      // Fetch Leave Types
      const ltRes = await API.get('/api/resource/Leave Type?fields=["name"]&limit_page_length=None');
      if (ltRes.data && ltRes.data.data) {
        setLeaveTypes(ltRes.data.data.map(l => l.name));
      }

      // Fetch Companies
      const compRes = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
      if (compRes.data && compRes.data.data) {
        setCompanies(compRes.data.data.map(c => c.name));
      }

    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      // Build filters based on Year and Type if needed
      // For now, fetch all and filter client-side or add simple filters
      // Note: ERPNext Leave Allocation has 'from_date' and 'to_date', 'leave_type'

      const filters = [];
      if (type && type !== 'All') {
        // filters.push([`leave_type`, `=`, type]); // Uncomment if strict filtering needed
      }

      // Fetch fields
      const fields = JSON.stringify(["name", "employee", "employee_name", "leave_type", "total_leaves_allocated", "new_leaves_allocated", "from_date", "to_date"]);
      const res = await API.get(`/api/resource/Leave Allocation?fields=${fields}&limit_page_length=None`);

      if (res.data && res.data.data) {
        setAllocations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leave allocations:", error);
      notification.error({ message: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    // Default dates (e.g., current year)
    form.setFieldsValue({
      from_date: dayjs().startOf('year'),
      to_date: dayjs().endOf('year'),
      carry_forward: 0,
      new_leaves_allocated: 0,
      total_leaves_allocated: 0
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee: record.employee,
      employee_name: record.employee_name,
      leave_type: record.leave_type,
      from_date: dayjs(record.from_date),
      to_date: dayjs(record.to_date),
      new_leaves_allocated: record.new_leaves_allocated,
      total_leaves_allocated: record.total_leaves_allocated,
      // Note: Check API response for carry_forward or add if needed in fetch fields
      // carry_forward: record.carry_forward 
    });
    setModalVisible(true);
  };

  const handleDelete = async (name) => {
    try {
      await API.delete(`/api/resource/Leave Allocation/${encodeURIComponent(name)}`);
      notification.success({ message: "Allocation deleted successfully" });
      fetchAllocations();
    } catch (error) {
      console.error("Error deleting allocation:", error);
      notification.error({ message: "Failed to delete allocation" });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        from_date: values.from_date.format('YYYY-MM-DD'),
        to_date: values.to_date.format('YYYY-MM-DD'),
        // Auto-populate helper fields if needed by standard API, though typically these are read-only in backend
        employee_name: employees.find(e => e.name === values.employee)?.employee_name
      };

      // Calculate total if simple logic, otherwise let backend handle it
      // For now, sending what user input

      if (editingRecord) {
        await API.put(`/api/resource/Leave Allocation/${encodeURIComponent(editingRecord.name)}`, payload);
        notification.success({ message: "Allocation updated successfully" });
      } else {
        await API.post('/api/resource/Leave Allocation', payload);
        notification.success({ message: "Allocation created successfully" });
      }
      setModalVisible(false);
      fetchAllocations();
    } catch (error) {
      console.error("Error saving allocation:", error);
      notification.error({ message: "Failed to save allocation", description: error.response?.data?.exception || error.message });
    }
  };

  // Filter logic
  const filteredRows = allocations.filter(row => {
    const matchesSearch = !searchText ||
      (row.employee_name && row.employee_name.toLowerCase().includes(searchText.toLowerCase())) ||
      (row.employee && row.employee.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = !type || type === 'All' || row.leave_type === type;
    // Simple year check based on from_date
    const matchesYear = !year || (row.from_date && row.from_date.includes(year));

    return matchesSearch && matchesType && matchesYear;
  });

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} EMPLOYEE LEAVE MASTER</nav>
      <div className="bg-white rounded-md border p-4">
        {/* Actions Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              New Allocation
            </Button>
            <button className="px-3 py-2 border rounded">Bulk Upload Employee Leave Master</button>
            <button className="px-3 py-2 border rounded">Month End Process</button>
            <button className="px-3 py-2 border rounded">Year Beginning Process</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs"><span>No. of Records: {filteredRows.length}</span></div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={fetchAllocations}>🔄</button>
              <button className="px-3 py-2 bg-red-600 text-white rounded">⬇️</button>
            </div>
          </div>
        </div>

        {/* Filters Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Organization Name</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>
              <option value="All">All</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm">Status</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>CURRENT</option>
              <option>CLOSED</option>
            </select>
          </div>
          <div>
            <div className="text-sm">Type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="All">All</option>
              {leaveTypes.map(lt => <option key={lt} value={lt}>{lt}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm">C Year</div>
            <input
              type="number"
              className="border rounded px-2 py-2 w-full text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm">Search On</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e) => setSearchOn(e.target.value)}>
              <option>All</option>
              <option>Employee Name</option>
              <option>Ecode</option>
            </select>
          </div>
        </div>

        {/* Filters Row 2 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Search Text</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search Name or ID..." />
          </div>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          </div>
          <div className="col-span-2"></div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                <th className="px-3 py-2 text-left">ECODE</th>
                <th className="px-3 py-2 text-left">WORKING ORGANIZATION</th>
                <th className="px-3 py-2 text-left">Valid From</th>
                <th className="px-3 py-2 text-left">LEAVE TYPE</th>
                <th className="px-3 py-2 text-left">Allocated</th>
                <th className="px-3 py-2 text-left">Valid To</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center p-4">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-4">No Records Found</td></tr>
              ) : (
                filteredRows.map((r, i) => (
                  <tr key={r.name || i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{r.employee_name}</td>
                    <td className="px-3 py-2">{r.employee}</td>
                    <td className="px-3 py-2">{org}</td>
                    <td className="px-3 py-2">{r.from_date}</td>
                    <td className="px-3 py-2">{r.leave_type}</td>
                    <td className="px-3 py-2">{r.total_leaves_allocated}</td>
                    <td className="px-3 py-2">{r.to_date}</td>
                    <td className="px-3 py-2">
                      <Space>
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(r)} />
                        <Popconfirm title="Delete this allocation?" onConfirm={() => handleDelete(r.name)}>
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">Showing {filteredRows.length} entries</div>
      </div>

      <Modal
        title={editingRecord ? "Edit Leave Allocation" : "New Leave Allocation"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="employee" label="Employee" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Select Employee"
                optionFilterProp="children"
                onChange={(val) => {
                  const emp = employees.find(e => e.name === val);
                  if (emp) {
                    form.setFieldsValue({
                      employee_name: emp.employee_name,
                      // company: emp.company // If needed
                    });
                  }
                }}
              >
                {employees.map(e => <Select.Option key={e.name} value={e.name}>{e.employee_name} ({e.name})</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true }]}>
              <Select placeholder="Select Leave Type">
                {leaveTypes.map(lt => <Select.Option key={lt} value={lt}>{lt}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="employee_name" label="Employee Name">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
            <Form.Item name="company" label="Company" initialValue="Preeshe Consultancy Services">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="from_date" label="From Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="to_date" label="To Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-3">Allocation</h4>
            <Form.Item name="new_leaves_allocated" label="New Leaves Allocated" rules={[{ required: true }]}>
              <Input type="number" step="0.5" onChange={(e) => {
                // Simple calculation to update Total if needed, though backend often handles this
                // const val = parseFloat(e.target.value) || 0;
                // form.setFieldsValue({ total_leaves_allocated: val }); 
              }} />
            </Form.Item>
            <Form.Item name="carry_forward" valuePropName="checked">
              <Checkbox>Add unused leaves from previous allocations</Checkbox>
            </Form.Item>
            <Form.Item name="total_leaves_allocated" label="Total Leaves Allocated">
              <Input type="number" step="0.5" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}