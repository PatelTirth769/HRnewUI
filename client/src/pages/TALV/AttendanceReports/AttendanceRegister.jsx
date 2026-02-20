import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import { notification, Table, Tag, Button, Checkbox } from 'antd';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function AttendanceRegister() {
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [employee, setEmployee] = useState('');
  const [status, setStatus] = useState('ALL');
  const [showLateOnly, setShowLateOnly] = useState(false);
  const [showEarlyOnly, setShowEarlyOnly] = useState(false);

  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    try {
      const [compRes, deptRes, shiftRes, empRes] = await Promise.all([
        API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Shift Type?fields=["name", "start_time", "end_time"]&limit_page_length=None'),
        API.get('/api/resource/Employee?fields=["name","employee_name","default_shift","company","department"]&filters=[["status","=","Active"]]&limit_page_length=None')
      ]);
      if (compRes.data.data) setCompanies(['ALL', ...compRes.data.data.map(c => c.name)]);
      if (deptRes.data.data) setDepartments(['ALL', ...deptRes.data.data.map(d => d.name)]);
      if (shiftRes.data.data) setShifts(shiftRes.data.data);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      notification.error({ message: "Failed to load dropdown data" });
    }
  };

  const getShiftTime = (shiftName) => {
    if (!shiftName || shiftName === '-') return '-';
    const name = (typeof shiftName === 'object') ? shiftName.name : shiftName;
    const s = shifts.find(item => item.name === name);
    if (!s) return '-';
    const start = s.start_time ? s.start_time.substring(0, 5) : '??';
    const end = s.end_time ? s.end_time.substring(0, 5) : '??';
    return `${start} - ${end}`;
  };

  // Generate all dates between from and to (inclusive)
  const getDateRange = (from, to) => {
    const dates = [];
    let current = dayjs(from);
    const end = dayjs(to);
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      dates.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }
    return dates;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. Filter employees based on Organization, Department, and Employee selection
      let filteredEmployees = [...employees];
      if (org !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.company === org);
      if (dept !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.department === dept);
      if (employee) filteredEmployees = filteredEmployees.filter(e => e.name === employee);

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Attendance records for the date range
      const attFilters = [
        ["attendance_date", ">=", fromDate],
        ["attendance_date", "<=", toDate]
      ];
      const attFields = JSON.stringify(["name", "employee", "employee_name", "attendance_date", "status", "shift", "in_time", "out_time", "late_entry", "early_exit"]);

      // 3. Fetch Checkins for the date range (same API as ShiftPunchRegister)
      const checkinFilters = [
        ["time", ">=", `${fromDate} 00:00:00`],
        ["time", "<=", `${toDate} 23:59:59`]
      ];
      const checkinFields = JSON.stringify(["employee", "time", "log_type"]);

      const [attRes, checkinRes] = await Promise.all([
        API.get(`/api/resource/Attendance?fields=${attFields}&filters=${JSON.stringify(attFilters)}&limit_page_length=None&order_by=attendance_date asc`),
        API.get(`/api/resource/Employee Checkin?fields=${checkinFields}&filters=${JSON.stringify(checkinFilters)}&order_by=time asc&limit_page_length=None`)
      ]);

      const attendanceRecords = attRes.data.data || [];
      const checkinRecords = checkinRes.data.data || [];

      // 4. Build attendance map: "empId_date" -> attendance record
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        const key = `${att.employee}_${att.attendance_date}`;
        attendanceMap[key] = att;
      });

      // 5. Build checkin map: "empId_date" -> sorted array of times
      const checkinMap = {};
      checkinRecords.forEach(ci => {
        if (!ci.time) return;
        const dateKey = dayjs(ci.time).format('YYYY-MM-DD');
        const key = `${ci.employee}_${dateKey}`;
        if (!checkinMap[key]) checkinMap[key] = [];
        checkinMap[key].push(ci.time);
      });

      // 6. Generate rows: every filtered employee × every date in range
      const dateRange = getDateRange(fromDate, toDate);
      let allRows = [];

      filteredEmployees.forEach(emp => {
        dateRange.forEach(dateStr => {
          const key = `${emp.name}_${dateStr}`;
          const att = attendanceMap[key];
          const punches = (checkinMap[key] || []).sort();

          // Determine In/Out from checkins
          let inTime = null;
          let outTime = null;
          if (punches.length > 0) {
            inTime = dayjs(punches[0]).format('HH:mm');
            if (punches.length > 1) {
              outTime = dayjs(punches[punches.length - 1]).format('HH:mm');
            }
          }

          // If attendance record has in_time/out_time, prefer checkin but fallback to attendance
          if (!inTime && att?.in_time) {
            inTime = att.in_time.length > 5 ? att.in_time.substring(0, 5) : att.in_time;
          }
          if (!outTime && att?.out_time) {
            outTime = att.out_time.length > 5 ? att.out_time.substring(0, 5) : att.out_time;
          }

          // Determine shift
          const displayShift = att?.shift || emp.default_shift || '-';

          // Determine status
          const displayStatus = att?.status || 'Not Marked';

          allRows.push({
            employee: emp.name,
            employee_name: emp.employee_name,
            attendance_date: dateStr,
            status: displayStatus,
            shift: displayShift,
            in_time: inTime,
            out_time: outTime,
            late_entry: att?.late_entry || 0,
            early_exit: att?.early_exit || 0,
            company: emp.company,
            department: emp.department,
            key: key
          });
        });
      });

      // 7. Apply remaining client-side filters
      if (shift !== 'ALL') {
        allRows = allRows.filter(r => r.shift === shift);
      }
      if (status !== 'ALL') {
        allRows = allRows.filter(r => r.status === status);
      }
      if (showLateOnly) {
        allRows = allRows.filter(r => r.late_entry === 1);
      }
      if (showEarlyOnly) {
        allRows = allRows.filter(r => r.early_exit === 1);
      }

      console.log(`Generated ${allRows.length} rows (${filteredEmployees.length} employees × ${dateRange.length} days)`);

      if (allRows.length > 0) {
        setData(allRows);
        notification.success({ message: `Generated ${allRows.length} records` });
      } else {
        setData([]);
        notification.info({ message: "No records found matching filters" });
      }

    } catch (error) {
      console.error("Error generating report:", error);
      notification.error({ message: "Failed to generate report" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) { notification.warning({ message: "No data to export" }); return; }
    const exportData = data.map(item => ({
      "Employee ID": item.employee,
      "Employee Name": item.employee_name,
      "Date": item.attendance_date,
      "Status": item.status,
      "Shift": item.shift,
      "Shift Time": getShiftTime(item.shift),
      "In Time": item.in_time || '-',
      "Out Time": item.out_time || '-',
      "Late Entry": item.late_entry ? 'Yes' : 'No',
      "Early Exit": item.early_exit ? 'Yes' : 'No',
      "Department": item.department,
      "Company": item.company
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Register");
    XLSX.writeFile(wb, `Attendance_Register_${fromDate}_to_${toDate}.xlsx`);
  };

  const columns = [
    { title: 'Date', dataIndex: 'attendance_date', key: 'date', width: 100, sorter: (a, b) => a.attendance_date.localeCompare(b.attendance_date) },
    {
      title: 'Employee', dataIndex: 'employee_name', key: 'emp', width: 180,
      render: (text, record) => <div><div className="font-medium">{text}</div><div className="text-xs text-gray-500">{record.employee}</div></div>
    },
    {
      title: 'Shift', dataIndex: 'shift', key: 'shift', width: 140,
      render: (text) => (<div><div className="font-medium text-gray-700">{text || '-'}</div><div className="text-xs text-gray-500">{getShiftTime(text)}</div></div>)
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (val) => {
        let color = 'default';
        if (val === 'Present') color = 'success';
        else if (val === 'Absent') color = 'error';
        else if (val === 'On Leave') color = 'warning';
        else if (val === 'Half Day') color = 'purple';
        return <Tag color={color}>{val}</Tag>;
      }
    },
    { title: 'In Time', dataIndex: 'in_time', key: 'in', width: 90, render: (val) => val || '-' },
    { title: 'Out Time', dataIndex: 'out_time', key: 'out', width: 90, render: (val) => val || '-' },
    {
      title: 'Late Entry', dataIndex: 'late_entry', key: 'late', width: 90, align: 'center',
      render: (val) => val ? <Tag color="orange">Yes</Tag> : <span className="text-gray-300">-</span>
    },
    {
      title: 'Early Exit', dataIndex: 'early_exit', key: 'early', width: 90, align: 'center',
      render: (val) => val ? <Tag color="magenta">Yes</Tag> : <span className="text-gray-300">-</span>
    },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDANCE REPORTS {'>'} ATTENDANCE REGISTER</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Organization</label>
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>
              {companies.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Department</label>
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={dept} onChange={(e) => setDept(e.target.value)}>
              {departments.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Shift</label>
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={shift} onChange={(e) => setShift(e.target.value)}>
              <option value="ALL">ALL</option>
              {shifts.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Status</label>
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {['ALL', 'Present', 'Absent', 'On Leave', 'Half Day', 'Not Marked'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">From Date</label>
            <input type="date" className="border rounded px-2 py-1.5 w-full text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">To Date</label>
            <input type="date" className="border rounded px-2 py-1.5 w-full text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Employee</label>
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={employee} onChange={(e) => setEmployee(e.target.value)}>
              <option value="">-- All Employees --</option>
              {employees.map(e => (<option key={e.name} value={e.name}>{e.employee_name} ({e.name})</option>))}
            </select>
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs font-semibold text-gray-600 block mb-2">Options</label>
            <div className="flex gap-4">
              <Checkbox checked={showLateOnly} onChange={(e) => setShowLateOnly(e.target.checked)}>Late Entry Only</Checkbox>
              <Checkbox checked={showEarlyOnly} onChange={(e) => setShowEarlyOnly(e.target.checked)}>Early Exit Only</Checkbox>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center border-t pt-4 mb-4">
          <div></div>
          <div className="flex gap-2">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerate} loading={loading} className="bg-orange-500 hover:bg-orange-600 border-none">Generate Report</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>Export Excel</Button>
          </div>
        </div>
        <Table columns={columns} dataSource={data} rowKey="key" size="small" pagination={{ pageSize: 20, showSizeChanger: true }} scroll={{ x: 1000 }} bordered loading={loading} locale={{ emptyText: 'No records found.' }} />
        <div className="mt-4 text-xs text-blue-700 bg-blue-50 p-2 rounded">
          <div className="font-semibold">Note:</div>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li>Report shows ALL employees for every day in the date range.</li>
            <li>In/Out times come from Employee Checkin records (biometric/device punches).</li>
            <li>"Not Marked" means no attendance record exists for that employee on that date.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}