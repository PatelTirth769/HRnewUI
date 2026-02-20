import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Table, Modal, Form, Input, Select, DatePicker, Checkbox, Button, Space, Popconfirm, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function AttendanceControl() {
  const [org, setOrg] = useState('BOMBAIM');
  const [workingOrg, setWorkingOrg] = useState('ALL');
  const [employee, setEmployee] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [shift, setShift] = useState('ALL');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [leType, setLeType] = useState('Select');
  const [leOp, setLeOp] = useState('>');
  const [leMin, setLeMin] = useState('');
  const [entity, setEntity] = useState('ALL');
  const [entityData, setEntityData] = useState('');

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesList, setEmployeesList] = useState([]);
  const [companies, setCompanies] = useState(['BOMBAIM']);
  const [departments, setDepartments] = useState(['ALL']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchData();
  }, [date, status, employee]);

  const fetchMetadata = async () => {
    try {
      const compRes = await API.get('/api/resource/Company?fields=["name"]&limit_page_length=None');
      if (compRes.data && compRes.data.data) {
        setCompanies(compRes.data.data.map(c => c.name));
      }
      const deptRes = await API.get('/api/resource/Department?fields=["name"]&limit_page_length=None');
      if (deptRes.data && deptRes.data.data) {
        setDepartments(deptRes.data.data.map(d => d.name));
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch All Active Employees
      // Optimize: fetch only needed fields
      const empRes = await API.get(`/api/resource/Employee?fields=["name","employee_name","company","department"]&filters=[["status","=","Active"]]&limit_page_length=5000`);
      const employees = empRes.data.data || [];
      setEmployeesList(employees);

      // 2. Fetch Attendance and Checkins for Selected Date
      const fromDate = `${date} 00:00:00`;
      const toDate = `${date} 23:59:59`;

      const attFilters = [["attendance_date", "=", date]];
      const attPromise = API.get(`/api/resource/Attendance?fields=["name", "employee", "status", "shift", "in_time", "out_time", "company", "late_entry", "early_exit"]&filters=${JSON.stringify(attFilters)}&limit_page_length=5000`);

      const checkinFilters = [["time", ">=", fromDate], ["time", "<=", toDate]];
      const checkinPromise = API.get(`/api/resource/Employee Checkin?fields=["employee", "time", "log_type"]&filters=${JSON.stringify(checkinFilters)}&limit_page_length=5000&order_by=time asc`);

      const [attRes, checkinRes] = await Promise.all([attPromise, checkinPromise]);

      const attendanceRecords = attRes.data.data || [];
      const checkinRecords = checkinRes.data.data || [];

      // 3. Process Data
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        attendanceMap[att.employee] = att;
      });

      // Group Checkins by Employee to find First In / Last Out
      const checkinMap = {};
      checkinRecords.forEach(ci => {
        if (!checkinMap[ci.employee]) {
          checkinMap[ci.employee] = { in: null, out: null, logs: [] };
        }
        checkinMap[ci.employee].logs.push(ci.time);
      });

      // Calculate Min/Max times
      Object.keys(checkinMap).forEach(empId => {
        const times = checkinMap[empId].logs.sort();
        if (times.length > 0) {
          // Simple logic: First record is In, Last record is Out
          // Format: "YYYY-MM-DD HH:mm:ss" -> extract HH:mm:ss
          checkinMap[empId].in = times[0].split(' ')[1];
          checkinMap[empId].out = times.length > 1 ? times[times.length - 1].split(' ')[1] : null;
        }
      });

      // Build Table Data
      const mergedData = employees.map(emp => {
        const record = attendanceMap[emp.name];
        const punchData = checkinMap[emp.name] || { in: '-', out: '-' };

        return {
          key: record ? record.name : emp.name,
          name: record ? record.name : null,
          employee: emp.name,
          employee_name: emp.employee_name,
          attendance_date: date,
          status: record ? record.status : 'Not Marked',
          shift: record ? record.shift : '-',
          // Prefer Checkin times, fall back to Attendance Record times, then '-'
          in_time: punchData.in || (record ? record.in_time : '-'),
          out_time: punchData.out || (record ? record.out_time : '-'),
          company: emp.company,
          department: emp.department,
          late_entry: record?.late_entry || 0,
          early_exit: record?.early_exit || 0
        };
      });

      // 4. Client-side Filtering
      const filteredData = mergedData.filter(row => {
        let pass = true;
        if (status && status !== 'ALL') {
          pass = pass && row.status === status;
        }
        // ... other filters ...
        return pass;
      });

      setAttendanceData(filteredData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
      notification.error({ message: 'Failed to load attendance data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      attendance_date: dayjs(date),
      status: 'Present',
      late_entry: false,
      early_exit: false
    });
    setModalVisible(true);
  };

  const handleMarkAttendance = (employeeRec) => {
    // Helper to open modal pre-filled for a specific employee (e.g. from row action)
    setEditingRecord({ ...employeeRec, isNew: !employeeRec.name }); // isNew if no attendance doc exists
    form.setFieldsValue({
      employee: employeeRec.employee,
      employee_name: employeeRec.employee_name,
      attendance_date: dayjs(employeeRec.attendance_date),
      company: employeeRec.company,
      department: employeeRec.department,
      status: employeeRec.status === 'Not Marked' ? 'Present' : employeeRec.status,
      late_entry: !!employeeRec.late_entry,
      early_exit: !!employeeRec.early_exit
    });
    setModalVisible(true);
  };

  const handleDelete = async (name) => {
    if (!name) return; // Cannot delete if not marked
    try {
      await API.delete(`/api/resource/Attendance/${encodeURIComponent(name)}`);
      notification.success({ message: "Attendance record deleted" });
      fetchData();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      notification.error({ message: "Failed to delete attendance" });
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
        late_entry: values.late_entry ? 1 : 0,
        early_exit: values.early_exit ? 1 : 0,
        docstatus: 1 // Submit directly if allowed
      };

      // Auto-populate helper fields if needed
      const emp = employeesList.find(e => e.name === values.employee);
      if (emp) {
        payload.employee_name = emp.employee_name;
        payload.company = emp.company;
        payload.department = emp.department;
      }

      if (editingRecord && editingRecord.name) {
        await API.put(`/api/resource/Attendance/${encodeURIComponent(editingRecord.name)}`, payload);
        notification.success({ message: "Attendance updated successfully" });
      } else {
        await API.post('/api/resource/Attendance', payload);
        notification.success({ message: "Attendance marked successfully" });
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error("Error saving attendance:", error);
      notification.error({ message: "Failed to save attendance", description: error.response?.data?.exception || error.message });
    }
  };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE CONTROL</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Organization</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>
                <option value="BOMBAIM">BOMBAIM</option> {/* Default or keep as first option if needed */}
                {companies.filter(c => c !== 'BOMBAIM').map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="ALL">ALL</option>
                {departments.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="text-sm">Select Date</div>
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e) => setEntity(e.target.value)}>{['ALL', 'Department', 'Location', 'Employee'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working Organization</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingOrg} onChange={(e) => setWorkingOrg(e.target.value)}>{['ALL', 'Self', 'Client'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e) => setLocation(e.target.value)}>{['ALL', 'HQ', 'Branch'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Late/Early/EW</div>
              <div className="flex items-center gap-2">
                <select className="border rounded px-2 py-2 text-sm" value={leType} onChange={(e) => setLeType(e.target.value)}>{['Select', 'Late', 'Early', 'EW'].map(v => <option key={v}>{v}</option>)}</select>
                <select className="border rounded px-2 py-2 text-sm" value={leOp} onChange={(e) => setLeOp(e.target.value)}>{['>', '>=', '<', '<='].map(v => <option key={v}>{v}</option>)}</select>
                <input className="border rounded px-2 py-2 w-24 text-sm" value={leMin} onChange={(e) => setLeMin(e.target.value)} placeholder="Min" />
              </div>
            </div>
            <div>
              <div className="text-sm">Entity Data</div>
              <textarea className="border rounded px-2 py-2 w-full text-sm h-9" value={entityData} onChange={(e) => setEntityData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Employee</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e) => setEmployee(e.target.value)}>{['ALL'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Status</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>{['ALL', 'Present', 'Absent', 'On Leave'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Ecode</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e) => setEcode(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Shift</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={shift} onChange={(e) => setShift(e.target.value)}>{['ALL', 'Day', 'Night'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
          </div>
        </div>

        {/* Actions & Table */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Mark Attendance</Button>
            {/* Other buttons... */}
            <button className="px-3 py-2 bg-orange-500 text-white rounded">Export Attendance</button>
          </div>
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
          </div>
        </div>

        <Table
          dataSource={attendanceData}
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="small"
          bordered
          columns={[
            { title: 'Employee', dataIndex: 'employee', key: 'employee', sorter: (a, b) => a.employee.localeCompare(b.employee) },
            { title: 'Name', dataIndex: 'employee_name', key: 'name' },
            { title: 'Date', dataIndex: 'attendance_date', key: 'date' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (text) => {
                let color = 'default';
                if (text === 'Present') color = 'success';
                else if (text === 'Absent') color = 'error';
                else if (text === 'On Leave') color = 'warning';
                else if (text === 'Not Marked') color = 'default';
                return <Tag color={color}>{text}</Tag>;
              }
            },
            { title: 'Shift', dataIndex: 'shift', key: 'shift' },
            { title: 'In Time', dataIndex: 'in_time', key: 'in_time' },
            { title: 'Out Time', dataIndex: 'out_time', key: 'out_time' },
            { title: 'Company', dataIndex: 'company', key: 'company' },
            {
              title: 'Action',
              key: 'action',
              render: (_, record) => (
                <Space>
                  {record.status === 'Not Marked' ? (
                    <Button type="dashed" size="small" onClick={() => handleMarkAttendance(record)}>Mark</Button>
                  ) : (
                    <>
                      <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleMarkAttendance(record)} />
                      </Tooltip>
                      <Popconfirm title="Delete this record?" onConfirm={() => handleDelete(record.name)}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </>
                  )}
                </Space>
              )
            }
          ]}
        />
      </div>

      <Modal
        title={editingRecord?.name ? "Edit Attendance" : "Mark Attendance"}
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
                  const emp = employeesList.find(e => e.name === val);
                  if (emp) {
                    form.setFieldsValue({
                      employee_name: emp.employee_name,
                      company: emp.company,
                      department: emp.department
                    });
                  }
                }}
              >
                {employeesList.map(emp => (
                  <Select.Option key={emp.name} value={emp.name}>{emp.employee_name} ({emp.name})</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="attendance_date" label="Attendance Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="employee_name" label="Employee Name">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
            <Form.Item name="company" label="Company">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                {['Present', 'Absent', 'On Leave', 'Half Day', 'Work From Home'].map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input readOnly className="bg-gray-50" />
            </Form.Item>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-3">Details</h4>
            <Space>
              <Form.Item name="late_entry" valuePropName="checked">
                <Checkbox>Late Entry</Checkbox>
              </Form.Item>
              <Form.Item name="early_exit" valuePropName="checked">
                <Checkbox>Early Exit</Checkbox>
              </Form.Item>
            </Space>
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