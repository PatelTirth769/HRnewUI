import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import { notification, Modal, Form, Input, Select, DatePicker, Checkbox, Button, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ShiftPunchRegister() {
  const [company, setCompany] = useState('ALL');
  const [companyList, setCompanyList] = useState(['ALL']);
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [department, setDepartment] = useState('');
  const [departmentList, setDepartmentList] = useState([]);
  const [shift, setShift] = useState('ALL');
  const [entity, setEntity] = useState('--ALL--');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [employee, setEmployee] = useState('');
  const [ecode, setEcode] = useState('');
  const [punches, setPunches] = useState('punched');
  const [layout, setLayout] = useState('vertical');
  const [format, setFormat] = useState('xlsx');
  const [mode, setMode] = useState('all');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]); // List for dropdown

  useEffect(() => {
    fetchCompanies();
    fetchDepartments();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
      if (response.data && response.data.data) {
        const companies = response.data.data.map(c => c.name);
        setCompanyList(['ALL', ...companies]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      notification.error({ message: "Failed to fetch companies" });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await API.get('/api/resource/Department?fields=["name"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setDepartmentList(response.data.data.map(d => d.name));
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const response = await API.get('/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&limit_page_length=None');
      if (response.data && response.data.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees list:", error);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    // Default values
    form.setFieldsValue({
      time: dayjs(),
      log_type: 'IN',
      skip_auto_attendance: 0
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee: record.employee,
      employee_name: record.employee_name,
      log_type: record.log_type,
      time: dayjs(record.time),
      device_id: record.device_id,
      skip_auto_attendance: record.skip_auto_attendance, // Ensure this field exists in fetch
      latitude: record.latitude, // Ensure this field exists in fetch
      longitude: record.longitude // Ensure this field exists in fetch
    });
    setModalVisible(true);
  };

  const handleDelete = async (name) => {
    try {
      await API.delete(`/api/resource/Employee Checkin/${encodeURIComponent(name)}`);
      notification.success({ message: "Checkin deleted successfully" });
      handleGenerate(); // Refresh list
    } catch (error) {
      console.error("Error deleting checkin:", error);
      notification.error({ message: "Failed to delete checkin" });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        time: values.time.format('YYYY-MM-DD HH:mm:ss'),
        employee_name: employees.find(e => e.name === values.employee)?.employee_name
      };

      if (editingRecord) {
        await API.put(`/api/resource/Employee Checkin/${encodeURIComponent(editingRecord.name)}`, payload);
        notification.success({ message: "Checkin updated successfully" });
      } else {
        await API.post('/api/resource/Employee Checkin', payload);
        notification.success({ message: "Checkin created successfully" });
      }

      setModalVisible(false);
      handleGenerate(); // Refresh list
    } catch (error) {
      console.error("Error saving checkin:", error);
      notification.error({
        message: "Failed to save checkin",
        description: error.response?.data?.exception || error.message
      });
    }
  };

  const fetchGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        form.setFieldsValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        notification.success({ message: "Location fetched successfully" });
      }, (error) => {
        notification.error({ message: "Error fetching location", description: error.message });
      });
    } else {
      notification.error({ message: "Geolocation not supported" });
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Construct Date Range Filters
      const from = `${fromDate} 00:00:00`;
      const to = `${toDate} 23:59:59`;

      const filters = [
        ["time", ">=", from],
        ["time", "<=", to]
      ];

      // Filter by Employee
      if (employee && employee !== 'ALL') {
        filters.push(["employee", "=", employee]);
      }

      // Filter by Company or Department (requires fetching matching Employee IDs first)
      if ((company && company !== 'ALL') || department) {
        setLoading(true);
        const empFilters = [];
        if (company && company !== 'ALL') empFilters.push(["company", "=", company]);
        if (department) empFilters.push(["department", "like", `%${department}%`]);

        // Fetch matching employees
        try {
          const empRes = await API.get(`/api/resource/Employee?fields=["name"]&filters=${JSON.stringify(empFilters)}&limit_page_length=None`);
          if (empRes.data && empRes.data.data && empRes.data.data.length > 0) {
            const empIds = empRes.data.data.map(e => e.name);
            filters.push(["employee", "in", empIds]);
          } else {
            notification.warning({ message: "No employees match the selected Company/Department" });
            setData([]);
            setLoading(false);
            return;
          }
        } catch (empErr) {
          console.error("Error filtering employees:", empErr);
          notification.error({ message: "Failed to validate employee filters" });
          setLoading(false);
          return;
        }
      }

      const filterString = JSON.stringify(filters);
      const fields = JSON.stringify(["name", "employee", "employee_name", "log_type", "time", "device_id", "latitude", "longitude", "skip_auto_attendance"]);

      const res = await API.get(`/api/resource/Employee Checkin?fields=${fields}&filters=${filterString}&order_by=time desc&limit_page_length=None`);

      if (res.data && res.data.data) {
        setData(res.data.data);
        notification.success({ message: `Fetched ${res.data.data.length} records` });
      } else {
        setData([]);
        notification.info({ message: 'No records found' });
      }
    } catch (error) {
      console.error("Failed to fetch punches:", error);
      notification.error({ message: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      notification.warning({ message: 'No data to export' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      "Employee ID": item.employee,
      "Employee Name": item.employee_name,
      "Time": item.time,
      "Log Type": item.log_type,
      "Device": item.device_id || 'Manual'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Punch Register");
    XLSX.writeFile(workbook, "Shift_Punch_Register.xlsx");
  };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDANCE REPORTS {'>'} SHIFT PUNCH REGISTER</nav>
      <div className="bg-white rounded-md border p-4">
        {/* Filters Section (Collapsed by default logic can be added, currently keeping open) */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Company</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e) => setCompany(e.target.value)}>
                {companyList.map(v => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">All</option>
                {departmentList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {/* ... other filters checks ... */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm">From Date</div>
                <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <div className="text-sm">To Date</div>
                <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </div>
          {/* Keeping right side simplified for brevity in verification */}
          <div className="space-y-3">
            <div>
              <div className="text-sm">Employee Name</div>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="Select Employee"
                optionFilterProp="children"
                value={employee || undefined} // Handle empty state
                onChange={(val) => setEmployee(val)}
                allowClear
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={[
                  { value: 'ALL', label: 'All' },
                  ...employees.map(e => ({ value: e.name, label: `${e.employee_name} (${e.name})` }))
                ]}
              />
            </div>
            <div>
              <div className="text-sm">Report Format</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} /> XLSX</label>
                <label className="flex items-center gap-2"><input type="radio" checked={format === 'csv'} onChange={() => setFormat('csv')} /> CSV</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
            {data.length > 0 && (
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleExport}>
                Export to Excel
              </button>
            )}
          </div>
          <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Checkin
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div className="mt-6 overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-3 py-2 text-left">Employee ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Time</th>
                <th className="px-3 py-2 text-left">Log Type</th>
                <th className="px-3 py-2 text-left">Device</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500">No records found. Click Generate.</td></tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{row.employee}</td>
                    <td className="px-3 py-2 font-medium">{row.employee_name}</td>
                    <td className="px-3 py-2">{row.time}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${row.log_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {row.log_type}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.device_id || 'Manual'}</td>
                    <td className="px-3 py-2">
                      <Space>
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(row)} />
                        <Popconfirm title="Are you sure delete this record?" onConfirm={() => handleDelete(row.name)}>
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
      </div>

      <Modal
        title={editingRecord ? "Edit Checkin" : "Add Checkin"}
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
                  if (emp) form.setFieldsValue({ employee_name: emp.employee_name });
                }}
              >
                {employees.map(e => <Select.Option key={e.name} value={e.name}>{e.employee_name} ({e.name})</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <DatePicker showTime className="w-full" format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Form.Item name="employee_name" label="Employee Name">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="log_type" label="Log Type" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="IN">IN</Select.Option>
                <Select.Option value="OUT">OUT</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="device_id" label="Device ID / Location Name">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="skip_auto_attendance" valuePropName="checked">
            <Checkbox>Skip Auto Attendance</Checkbox>
          </Form.Item>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Location</h4>
              <Button onClick={fetchGeolocation} icon={<ReloadOutlined />}>Fetch Geolocation</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="latitude" label="Latitude">
                <Input readOnly />
              </Form.Item>
              <Form.Item name="longitude" label="Longitude">
                <Input readOnly />
              </Form.Item>
            </div>
            {/* Simple Map Placeholder */}
            {/* Note: Embedding a real interactive map (Leaflet/Google) requires more setup/keys. 
                For now, showing a static placeholder or link if coordinates exist is safer. */}
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