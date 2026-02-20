import React, { useState, useEffect } from 'react';
import { notification, Table, Tag, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function HeadcountOccupancyReport() {
  // All original filters kept as-is
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [asOnDate, setAsOnDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [asOnTime, setAsOnTime] = useState(dayjs().format('HH:mm'));
  const [reportType, setReportType] = useState('register');

  const [loading, setLoading] = useState(false);

  // Master data
  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [shifts, setShifts] = useState(['ALL']);
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    try {
      const [compRes, deptRes, shiftRes, empRes] = await Promise.all([
        API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Shift Type?fields=["name","start_time","end_time"]&limit_page_length=None'),
        API.get('/api/resource/Employee?fields=["name","employee_name","default_shift","company","department"]&filters=[["status","=","Active"]]&limit_page_length=None')
      ]);
      if (compRes.data.data) setCompanies(['ALL', ...compRes.data.data.map(c => c.name)]);
      if (deptRes.data.data) setDepartments(['ALL', ...deptRes.data.data.map(d => d.name)]);
      if (shiftRes.data.data) setShifts(['ALL', ...shiftRes.data.data.map(s => s.name)]);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      notification.error({ message: "Failed to load dropdown data" });
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const cutoffDateTime = `${asOnDate} ${asOnTime}:00`;

      // 1. Filter employees
      let filteredEmployees = [...employees];
      if (org !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.company === org);
      if (dept !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.department === dept);
      if (shift !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.default_shift === shift);

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Attendance and Employee Checkins for the date
      const [attRes, ciRes] = await Promise.all([
        API.get(`/api/resource/Attendance?fields=${JSON.stringify(["employee", "attendance_date", "status", "shift"])}&filters=${JSON.stringify([["attendance_date", "=", asOnDate]])}&limit_page_length=None`),
        API.get(`/api/resource/Employee Checkin?fields=${JSON.stringify(["employee", "time", "log_type"])}&filters=${JSON.stringify([["time", ">=", `${asOnDate} 00:00:00`], ["time", "<=", cutoffDateTime]])}&order_by=time asc&limit_page_length=None`)
      ]);

      const attendanceRecords = attRes.data.data || [];
      const checkinRecords = ciRes.data.data || [];

      // 3. Build maps
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        attendanceMap[att.employee] = att;
      });

      const checkinMap = {};
      checkinRecords.forEach(ci => {
        if (!ci.time) return;
        if (!checkinMap[ci.employee]) checkinMap[ci.employee] = [];
        checkinMap[ci.employee].push({ time: ci.time, log_type: ci.log_type });
      });

      // 4. Determine status for each employee
      if (reportType === 'register') {
        const rows = [];

        filteredEmployees.forEach(emp => {
          const att = attendanceMap[emp.name];
          const punches = checkinMap[emp.name] || [];
          const firstPunch = punches.length > 0 ? punches[0] : null;

          let status = 'Not Marked';
          let inTime = '-';
          let outTime = '-';
          let isInside = false;

          if (punches.length > 0) {
            inTime = dayjs(firstPunch.time).format('HH:mm');
            if (punches.length > 1) {
              outTime = dayjs(punches[punches.length - 1].time).format('HH:mm');
            }
            if (punches.length % 2 === 1) {
              isInside = true;
              status = 'Present (In)';
              outTime = '-';
            } else {
              isInside = false;
              status = 'Present (Out)';
            }
          } else if (att) {
            status = att.status;
          }

          rows.push({
            key: emp.name,
            employee: emp.name,
            employee_name: emp.employee_name,
            department: emp.department || '-',
            company: emp.company || '-',
            shift: emp.default_shift || '-',
            in_time: inTime,
            out_time: outTime,
            status: status,
            is_inside: isInside,
            punch_count: punches.length,
          });
        });

        rows.sort((a, b) => {
          if (a.is_inside && !b.is_inside) return -1;
          if (!a.is_inside && b.is_inside) return 1;
          return a.employee.localeCompare(b.employee);
        });

        setData(rows);
        const insideCount = rows.filter(r => r.is_inside).length;
        notification.success({ message: `${insideCount} employees currently inside out of ${rows.length} total` });

      } else {
        // Head Count Summary - aggregate by department
        const deptSummary = {};

        filteredEmployees.forEach(emp => {
          const deptName = emp.department || 'Unknown';
          if (!deptSummary[deptName]) {
            deptSummary[deptName] = { total: 0, present: 0, absent: 0, not_marked: 0, on_leave: 0, half_day: 0 };
          }
          deptSummary[deptName].total++;

          const att = attendanceMap[emp.name];
          const punches = checkinMap[emp.name] || [];

          if (punches.length > 0) {
            deptSummary[deptName].present++;
          } else if (att) {
            if (att.status === 'Present') deptSummary[deptName].present++;
            else if (att.status === 'Half Day') deptSummary[deptName].half_day++;
            else if (att.status === 'Absent') deptSummary[deptName].absent++;
            else if (att.status === 'On Leave') deptSummary[deptName].on_leave++;
            else deptSummary[deptName].not_marked++;
          } else {
            deptSummary[deptName].not_marked++;
          }
        });

        const summaryRows = Object.entries(deptSummary).map(([deptName, s]) => ({
          key: deptName,
          department: deptName,
          total: s.total,
          present: s.present,
          half_day: s.half_day,
          absent: s.absent,
          on_leave: s.on_leave,
          not_marked: s.not_marked,
          occupancy: s.total > 0 ? Math.round(((s.present + s.half_day) / s.total) * 100) : 0,
          isTotal: false,
        }));

        summaryRows.sort((a, b) => a.department.localeCompare(b.department));

        // Add total row
        const totals = summaryRows.reduce((acc, r) => ({
          total: acc.total + r.total,
          present: acc.present + r.present,
          half_day: acc.half_day + r.half_day,
          absent: acc.absent + r.absent,
          on_leave: acc.on_leave + r.on_leave,
          not_marked: acc.not_marked + r.not_marked,
        }), { total: 0, present: 0, half_day: 0, absent: 0, on_leave: 0, not_marked: 0 });

        summaryRows.push({
          key: '__total',
          department: 'TOTAL',
          ...totals,
          occupancy: totals.total > 0 ? Math.round(((totals.present + totals.half_day) / totals.total) * 100) : 0,
          isTotal: true,
        });

        setData(summaryRows);
        notification.success({ message: `${totals.present} present, ${totals.absent} absent, ${totals.not_marked} not marked out of ${totals.total} employees` });
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
    let exportRows;
    if (reportType === 'register') {
      exportRows = data.map(r => ({
        "Employee ID": r.employee,
        "Employee Name": r.employee_name,
        "Department": r.department,
        "Shift": r.shift,
        "In Time": r.in_time,
        "Out Time": r.out_time,
        "Status": r.status,
        "Inside": r.is_inside ? 'Yes' : 'No',
        "Punches": r.punch_count,
      }));
    } else {
      exportRows = data.map(r => ({
        "Department": r.department,
        "Total Employees": r.total,
        "Present": r.present,
        "Half Day": r.half_day,
        "Absent": r.absent,
        "On Leave": r.on_leave,
        "Not Marked": r.not_marked,
        "Occupancy %": r.occupancy + '%',
      }));
    }
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Headcount");
    XLSX.writeFile(wb, `Headcount_${asOnDate}_${asOnTime.replace(':', '')}.xlsx`);
  };

  // Register columns
  const registerColumns = [
    { title: '#', key: 'idx', width: 45, render: (_, __, idx) => idx + 1 },
    {
      title: 'Employee', key: 'emp', width: 180,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Dept', dataIndex: 'department', key: 'dept', width: 100, ellipsis: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 90, ellipsis: true },
    {
      title: 'In Time', dataIndex: 'in_time', key: 'in', width: 70, align: 'center',
      render: (val) => val !== '-' ? <span className="text-green-700 font-medium">{val}</span> : '-'
    },
    {
      title: 'Out Time', dataIndex: 'out_time', key: 'out', width: 70, align: 'center',
      render: (val) => val !== '-' ? <span className="text-blue-700 font-medium">{val}</span> : '-'
    },
    { title: 'Punches', dataIndex: 'punch_count', key: 'punches', width: 65, align: 'center' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: (val, r) => {
        if (r.is_inside) return <Tag color="green">🟢 Inside</Tag>;
        if (val === 'Present (Out)') return <Tag color="blue">Left</Tag>;
        if (val === 'Absent') return <Tag color="red">Absent</Tag>;
        if (val === 'On Leave') return <Tag color="orange">On Leave</Tag>;
        return <Tag color="default">Not Marked</Tag>;
      }
    },
  ];

  // Summary columns - clean rendering
  const summaryColumns = [
    {
      title: 'Department', dataIndex: 'department', key: 'dept', width: 180,
      render: (val, r) => r.isTotal ? <strong>{val}</strong> : val
    },
    {
      title: 'Total Emp', dataIndex: 'total', key: 'total', width: 80, align: 'center',
      render: (val, r) => r.isTotal ? <strong>{val}</strong> : val
    },
    {
      title: 'Present', dataIndex: 'present', key: 'present', width: 80, align: 'center',
      render: (val, r) => <span style={{ color: val > 0 ? '#52c41a' : undefined, fontWeight: r.isTotal || val > 0 ? 600 : 400 }}>{val}</span>
    },
    {
      title: 'Half Day', dataIndex: 'half_day', key: 'hd', width: 75, align: 'center',
      render: (val, r) => r.isTotal ? <strong>{val}</strong> : val
    },
    {
      title: 'Absent', dataIndex: 'absent', key: 'absent', width: 70, align: 'center',
      render: (val, r) => <span style={{ color: val > 0 ? '#f5222d' : undefined, fontWeight: r.isTotal || val > 0 ? 600 : 400 }}>{val}</span>
    },
    {
      title: 'On Leave', dataIndex: 'on_leave', key: 'leave', width: 75, align: 'center',
      render: (val, r) => <span style={{ color: val > 0 ? '#fa8c16' : undefined, fontWeight: r.isTotal ? 600 : 400 }}>{val}</span>
    },
    {
      title: 'Not Marked', dataIndex: 'not_marked', key: 'nm', width: 85, align: 'center',
      render: (val, r) => <span style={{ color: val > 0 ? '#8c8c8c' : undefined, fontWeight: r.isTotal ? 600 : 400 }}>{val}</span>
    },
    {
      title: 'Occupancy %', dataIndex: 'occupancy', key: 'occ', width: 100, align: 'center',
      render: (val) => {
        const color = val >= 80 ? '#52c41a' : val >= 50 ? '#fa8c16' : '#f5222d';
        return <strong style={{ color }}>{val}%</strong>;
      }
    },
  ];

  const columns = reportType === 'register' ? registerColumns : summaryColumns;

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} HEADCOUNT\OCCUPANCY REPORT</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters - 3 column layout matching original */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 mb-4">

          {/* Column 1 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Company</label>
              <select className="border rounded px-2 py-1.5 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>
                {companies.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Department</label>
              <select className="border rounded px-2 py-1.5 w-full text-sm" value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Shift</label>
              <select className="border rounded px-2 py-1.5 w-full text-sm" value={shift} onChange={(e) => setShift(e.target.value)}>
                {shifts.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">As On</label>
              <div className="flex items-center gap-2">
                <input type="date" className="border rounded px-2 py-1.5 text-sm flex-1" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} />
                <input type="time" className="border rounded px-2 py-1.5 text-sm w-28" value={asOnTime} onChange={(e) => setAsOnTime(e.target.value)} />
              </div>
              <span className="text-xs text-gray-400">(24 hr format)</span>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Report Type</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportType === 'register'} onChange={() => setReportType('register')} /> Head Count Register
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportType === 'summary'} onChange={() => setReportType('summary')} /> Head Count Summary
                </label>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4 border-t pt-3">
          <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerate} loading={loading} className="bg-green-600 hover:bg-green-700 border-none">Generate</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>Export Excel</Button>
        </div>

        {/* Results Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="key"
          size="small"
          pagination={reportType === 'summary' ? false : { pageSize: 20, showSizeChanger: true }}
          bordered
          loading={loading}
          locale={{ emptyText: 'Select filters and click Generate to view headcount/occupancy.' }}
          rowClassName={(r) => r.isTotal ? 'bg-gray-100 font-bold' : ''}
        />
      </div>
    </div>
  );
}