import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import dayjs from 'dayjs';
import { notification, Spin, Modal, Form, Select, Input, DatePicker, Button, Popconfirm, Tooltip, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { TextArea } = Input;



export default function HRViewLeavesOutdoor() {
  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [leaveType, setLeaveType] = useState('All');
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [reportDate, setReportDate] = useState('Application Date');
  const [format, setFormat] = useState('XLSX');
  const [status, setStatus] = useState('All');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
    fetchLeaveTypes();
  }, [fromDate, toDate, status, reportDate]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/resource/Employee?fields=["name","employee_name","company"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setEmployees(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
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

  const fetchLeaves = async () => {
    setLoading(true);
    try {

      // Determine date field based on Report Date selection
      let dateField = 'posting_date'; // Default: Application Date
      if (reportDate === 'Leave Date') dateField = 'from_date';
      // if (reportDate === 'Approved Date') dateField = 'modified'; // Approximation

      let filters = [
        [dateField, '>=', fromDate],
        [dateField, '<=', toDate]
      ];

      if (status !== 'All') {
        filters.push(['status', '=', status]);
      }

      const fields = JSON.stringify(["*"]);
      const filterString = JSON.stringify(filters);

      const response = await api.get(`/api/resource/Leave Application?fields=${fields}&filters=${filterString}&limit_page_length=None&order_by=${dateField} desc`);

      if (response.data && response.data.data) {
        setLeaves(response.data.data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      notification.error({ message: "Failed to fetch leaves" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLeave(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    form.setFieldsValue({
      employee: leave.employee,
      leave_type: leave.leave_type,
      from_date: dayjs(leave.from_date),
      to_date: dayjs(leave.to_date),
      reason: leave.description,
      status: leave.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (name) => {
    try {
      await api.delete(`/api/resource/Leave Application/${name}`);
      message.success('Leave Application deleted successfully');
      fetchLeaves();
    } catch (error) {
      console.error("Error deleting leave:", error);
      message.error('Failed to delete leave application');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const employeeData = employees.find(e => e.name === values.employee);

      // Base payload
      const payload = {
        leave_type: values.leave_type,
        from_date: values.from_date.format('YYYY-MM-DD'),
        to_date: values.to_date.format('YYYY-MM-DD'),
        description: values.reason,
        status: values.status || "Open",
      };

      if (editingLeave) {
        // Update: Exclude employee as it cannot be changed usually
        console.log("--- DEBUG: UPDATING LEAVE ---");
        console.log("Leave ID:", editingLeave.name);
        console.log("Payload:", payload);

        const res = await api.put(`/api/resource/Leave Application/${editingLeave.name}`, payload);
        console.log("Update Response:", res);

        message.success('Leave Application updated successfully');
      } else {
        // Create: Include employee and company
        payload.employee = values.employee;
        payload.employee_name = employeeData?.employee_name;
        payload.company = employeeData?.company || "BOMBAIM";
        payload.posting_date = dayjs().format('YYYY-MM-DD');
        payload.docstatus = (values.status === "Submitted" || values.status === "Approved") ? 1 : 0;

        console.log("Creating Leave:", payload);
        await api.post('/api/resource/Leave Application', payload);
        message.success('Leave Application created successfully');
      }
      setIsModalOpen(false);
      fetchLeaves();
    } catch (error) {
      console.error("Error saving leave:", error);
      // Log full error data for debugging
      if (error.response && error.response.data) {
        console.error("Server Error Details:", error.response.data);
        const serverMsg = JSON.stringify(error.response.data);
        message.error(`Failed to save: ${error.response.data.exception || 'Check console details'}`);
      } else {
        message.error('Failed to save leave application.');
      }
    }
  };

  const handleStatusChange = async (name, newStatus) => {
    try {
      console.log(`--- DEBUG: STATUS CHANGE ---`);
      console.log(`Updating ${name} to status: ${newStatus}`);
      const payload = { status: newStatus };
      console.log("Payload:", payload);

      const res = await api.put(`/api/resource/Leave Application/${name}`, payload);
      console.log("Status Update Response:", res);

      message.success(`Status updated to ${newStatus}`);
      fetchLeaves();
    } catch (error) {
      console.error("Error updating status:", error);
      if (error.response) {
        console.error("Response Status:", error.response.status);
        console.error("Response Data:", error.response.data);
      }
      if (error.response && error.response.data) {
        message.error(`Failed to update status: ${error.response.data.exception || JSON.stringify(error.response.data)}`);
      } else {
        message.error('Failed to update status');
      }
    }
  };

  // Export Function
  const handleExport = () => {
    if (filteredLeaves.length === 0) {
      message.warning("No records to export.");
      return;
    }

    const dataToExport = filteredLeaves.map((leave, index) => ({
      "Sr. No": index + 1,
      "Application Date": leave.posting_date,
      "Employee Code": leave.employee,
      "Employee Name": leave.employee_name,
      "Leave Type": leave.leave_type,
      "From Date": leave.from_date,
      "To Date": leave.to_date,
      "Total Days": leave.total_leave_days,
      "Department": leave.department,
      "Designation": leave.designation,
      "Status": leave.status,
      "Approver": leave.leave_approver
    }));

    if (format === 'XLSX') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leaves");
      XLSX.writeFile(workbook, `Leave_Report_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    } else {
      // Simple CSV export
      const headers = Object.keys(dataToExport[0]).join(",");
      const rows = dataToExport.map(row => Object.values(row).map(val => `"${val || ''}"`).join(",")).join("\n");
      const csvContent = headers + "\n" + rows;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `Leave_Report_${dayjs().format('YYYY-MM-DD')}.csv`);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter existing data by Leave Type and Search Text on the client side for speed/simplicity
  const filteredLeaves = leaves.filter(leave => {
    if (leaveType !== 'All' && leave.leave_type !== leaveType) return false;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      if (searchOn === 'Employee Name' && !leave.employee_name.toLowerCase().includes(lowerSearch)) return false;
      if (searchOn === 'Ecode' && !leave.employee.toLowerCase().includes(lowerSearch)) return false;
      if (searchOn === 'All' && !leave.employee_name.toLowerCase().includes(lowerSearch) && !leave.employee.toLowerCase().includes(lowerSearch)) return false;
    }
    return true;
  });

  // Pagination Logic
  const totalRecords = filteredLeaves.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} HR VIEW LEAVES & OUTDOOR</nav>
      <div className="bg-white rounded-md border p-4">
        {/* Top Controls */}
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-lg font-semibold">Leave Applications</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New Leave Application</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
          <div>
            <div className="text-sm">From Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">To Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">Leave Type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option>All</option>
              {leaveTypes.map(lt => <option key={lt.name} value={lt.name}>{lt.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm">Search On</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e) => setSearchOn(e.target.value)}>{['All', 'Employee Name', 'Ecode'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Status</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <div className="text-sm">Search Text</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center bg-gray-50 p-3 rounded mb-3 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Report Date:</span>
              {['Leave Date', 'Application Date'].map(d => (
                <label key={d} className="text-xs flex items-center gap-1 cursor-pointer"><input type="radio" checked={reportDate === d} onChange={() => setReportDate(d)} /> {d}</label>
              ))}
            </div>
            <div className="h-4 border-l border-gray-300 mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Format:</span>
              {['XLSX', 'CSV'].map(f => (
                <label key={f} className="text-xs flex items-center gap-1 cursor-pointer"><input type="radio" checked={format === f} onChange={() => setFormat(f)} /> {f}</label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip title="Search">
              <button className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={fetchLeaves}>
                🔎
              </button>
            </Tooltip>
            <Tooltip title="Download Report">
              <button className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded hover:bg-green-600 transition" onClick={handleExport}>
                🧾
              </button>
            </Tooltip>

            <div className="flex items-center gap-2 text-sm bg-white border px-2 py-1 rounded">
              <button
                className="hover:bg-gray-100 rounded px-1 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >←</button>
              <span>Page {totalPages === 0 ? 0 : currentPage} of {totalPages}</span>
              <button
                className="hover:bg-gray-100 rounded px-1 disabled:opacity-50"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(currentPage + 1)}
              >→</button>
            </div>

            <div className="h-4 border-l border-gray-300 mx-1"></div>

            <span className="text-xs text-gray-500">Count: {filteredLeaves.length}</span>
            <Button type="primary" size="small" className="bg-orange-500 border-none hover:bg-orange-600">Bulk Approve</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? <div className="text-center p-10"><Spin /></div> : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-orange-100 border">
                  <th className="px-3 py-2 text-left">SR.</th>
                  <th className="px-3 py-2 text-left">APP.DT.</th>
                  <th className="px-3 py-2 text-left">ECODE</th>
                  <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                  <th className="px-3 py-2 text-left">LEAVE TYPE</th>
                  <th className="px-3 py-2 text-left">FROM</th>
                  <th className="px-3 py-2 text-left">TO</th>
                  <th className="px-3 py-2 text-left">DAYS</th>
                  <th className="px-3 py-2 text-left">DEPT</th>
                  <th className="px-3 py-2 text-left">DESG</th>
                  <th className="px-3 py-2 text-left">STATUS</th>
                  <th className="px-3 py-2 text-left">APPROVER</th>
                  <th className="px-3 py-2 text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((leave, index) => (
                  <tr key={leave.name} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{dayjs(leave.posting_date).format('DD-MMM-YY')}</td>
                    <td className="px-3 py-2">{leave.employee}</td>
                    <td className="px-3 py-2">{leave.employee_name}</td>
                    <td className="px-3 py-2">{leave.leave_type}</td>
                    <td className="px-3 py-2">{dayjs(leave.from_date).format('DD-MMM-YY')}</td>
                    <td className="px-3 py-2">{dayjs(leave.to_date).format('DD-MMM-YY')}</td>
                    <td className="px-3 py-2">{leave.total_leave_days}</td>
                    <td className="px-3 py-2">{leave.department}</td>
                    <td className="px-3 py-2">{leave.designation}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={leave.status}
                        size="small"
                        onChange={(val) => handleStatusChange(leave.name, val)}
                        className={`w-28 ${leave.status === 'Approved' ? 'text-green-600' :
                          leave.status === 'Rejected' ? 'text-red-600' :
                            'text-orange-600'
                          }`}
                        variant="borderless"
                      >
                        <Option value="Open">Open</Option>
                        <Option value="Approved">Approved</Option>
                        <Option value="Rejected">Rejected</Option>
                        <Option value="Cancelled">Cancelled</Option>
                      </Select>
                    </td>
                    <td className="px-3 py-2">{leave.leave_approver || '-'}</td>
                    <td className="px-3 py-2">
                      <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(leave)} />
                      </Tooltip>
                      <Popconfirm title="Delete this leave?" onConfirm={() => handleDelete(leave.name)}>
                        <Tooltip title="Delete">
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Tooltip>
                      </Popconfirm>
                    </td>
                  </tr>
                ))}
                {paginatedLeaves.length === 0 && (
                  <tr>
                    <td colSpan="13" className="text-center py-4 text-gray-500">No leave applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editingLeave ? "Edit Leave Application" : "New Leave Application"}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="employee" label="Employee" rules={[{ required: true, message: 'Please select an employee!' }]}>
              <Select showSearch optionFilterProp="children" filterOption={(input, option) =>
                (option?.children[0]?.toLowerCase() || '').includes(input.toLowerCase()) ||
                (option?.children[1]?.toLowerCase() || '').includes(input.toLowerCase())
              }>
                {employees.map(e => <Option key={e.name} value={e.name}>{e.employee_name} ({e.name})</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="leave_type" label="Leave Type" rules={[{ required: true, message: 'Please select a leave type!' }]}>
              <Select>{leaveTypes.map(lt => <Option key={lt.name} value={lt.name}>{lt.name}</Option>)}</Select>
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="from_date" label="From Date" rules={[{ required: true, message: 'Please select a start date!' }]}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="to_date" label="To Date" rules={[{ required: true, message: 'Please select an end date!' }]}>
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
            </div>
            {editingLeave && (
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="Open">Open</Option>
                  <Option value="Approved">Approved</Option>
                  <Option value="Rejected">Rejected</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item name="reason" label="Reason">
              <TextArea rows={3} />
            </Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save</Button>
            </div>
          </Form>
        </Modal>

      </div>
    </div>
  );
}