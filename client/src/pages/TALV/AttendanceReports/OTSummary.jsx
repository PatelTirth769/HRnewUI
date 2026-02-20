import React, { useState, useEffect } from 'react';
import { notification, Table, Tag, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function OTSummary() {
  // Filters matching the screenshot
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [otType, setOtType] = useState('system'); // 'approved' or 'system'
  const [fromMonth, setFromMonth] = useState(dayjs().format('YYYY-MM'));
  const [toMonth, setToMonth] = useState(dayjs().format('YYYY-MM'));
  const [reportType, setReportType] = useState('summary'); // 'summary' or 'daily'
  const [loading, setLoading] = useState(false);

  // Master data
  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [shiftTypes, setShiftTypes] = useState([]);
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
      if (shiftRes.data.data) setShiftTypes(shiftRes.data.data);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      notification.error({ message: "Failed to load dropdown data" });
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
  };

  const formatHrs = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    const h = Math.floor(Math.abs(minutes) / 60);
    const m = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${h}:${m.toString().padStart(2, '0')}`;
  };

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
      // Convert months to date range
      const startDate = dayjs(fromMonth + '-01').format('YYYY-MM-DD');
      const endDate = dayjs(toMonth + '-01').endOf('month').format('YYYY-MM-DD');

      // 1. Filter employees
      let filteredEmployees = [...employees];
      if (org !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.company === org);
      if (dept !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.department === dept);

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Shift Assignments and Employee Checkins
      const [saRes, ciRes] = await Promise.all([
        API.get(`/api/resource/Shift Assignment?fields=${JSON.stringify(["employee", "shift_type", "start_date", "end_date"])}&filters=${JSON.stringify([["start_date", "<=", endDate], ["docstatus", "=", 1]])}&limit_page_length=None`),
        API.get(`/api/resource/Employee Checkin?fields=${JSON.stringify(["employee", "time", "log_type"])}&filters=${JSON.stringify([["time", ">=", `${startDate} 00:00:00`], ["time", "<=", `${endDate} 23:59:59`]])}&order_by=time asc&limit_page_length=None`)
      ]);

      const assignments = saRes.data.data || [];
      const checkins = ciRes.data.data || [];

      // Build maps
      const assignmentMap = {};
      assignments.forEach(sa => {
        if (!assignmentMap[sa.employee]) assignmentMap[sa.employee] = [];
        assignmentMap[sa.employee].push({ shift: sa.shift_type, start: sa.start_date, end: sa.end_date });
      });

      const checkinMap = {};
      checkins.forEach(ci => {
        if (!ci.time) return;
        const dateKey = dayjs(ci.time).format('YYYY-MM-DD');
        const key = `${ci.employee}_${dateKey}`;
        if (!checkinMap[key]) checkinMap[key] = [];
        checkinMap[key].push(ci.time);
      });

      const dateRange = getDateRange(startDate, endDate);

      if (reportType === 'daily') {
        // Daily BreakUp Report - one row per employee per day
        let allRows = [];

        filteredEmployees.forEach(emp => {
          const empAssignments = assignmentMap[emp.name] || [];

          dateRange.forEach(dateStr => {
            const key = `${emp.name}_${dateStr}`;
            const punches = (checkinMap[key] || []).sort();
            if (punches.length === 0) return;

            const matchedAssignment = empAssignments.find(a => {
              const end = a.end || '9999-12-31';
              return dateStr >= a.start && dateStr <= end;
            });
            const shiftName = matchedAssignment?.shift || emp.default_shift || '-';
            const shiftInfo = shiftTypes.find(s => s.name === shiftName);

            let expectedMin = 0;
            if (shiftInfo) {
              const shiftMin = timeToMinutes(shiftInfo.end_time) - timeToMinutes(shiftInfo.start_time);
              expectedMin = shiftMin < 0 ? shiftMin + 1440 : shiftMin;
            }

            const inTime = dayjs(punches[0]);
            const outTime = punches.length > 1 ? dayjs(punches[punches.length - 1]) : null;
            const workedMin = outTime ? outTime.diff(inTime, 'minute') : 0;
            const otMin = workedMin > expectedMin ? workedMin - expectedMin : 0;

            allRows.push({
              key: `${emp.name}_${dateStr}`,
              employee: emp.name,
              employee_name: emp.employee_name,
              department: emp.department || '-',
              company: emp.company || '-',
              shift: shiftName,
              date: dateStr,
              in_time: inTime.format('HH:mm'),
              out_time: outTime ? outTime.format('HH:mm') : '-',
              shift_min: expectedMin,
              worked_min: workedMin,
              ot_min: otMin,
            });
          });
        });

        allRows.sort((a, b) => a.date.localeCompare(b.date) || a.employee.localeCompare(b.employee));
        setData(allRows);
        notification.success({ message: `Found ${allRows.length} daily records` });

      } else {
        // Summary Report - one row per employee, totals for the period
        let allRows = [];

        filteredEmployees.forEach(emp => {
          const empAssignments = assignmentMap[emp.name] || [];
          let totalShiftMin = 0;
          let totalWorkedMin = 0;
          let totalOtMin = 0;
          let dayCount = 0;
          let otDays = 0;

          dateRange.forEach(dateStr => {
            const key = `${emp.name}_${dateStr}`;
            const punches = (checkinMap[key] || []).sort();
            if (punches.length === 0) return;

            const matchedAssignment = empAssignments.find(a => {
              const end = a.end || '9999-12-31';
              return dateStr >= a.start && dateStr <= end;
            });
            const shiftName = matchedAssignment?.shift || emp.default_shift || '-';
            const shiftInfo = shiftTypes.find(s => s.name === shiftName);

            let expectedMin = 0;
            if (shiftInfo) {
              const shiftMin = timeToMinutes(shiftInfo.end_time) - timeToMinutes(shiftInfo.start_time);
              expectedMin = shiftMin < 0 ? shiftMin + 1440 : shiftMin;
            }

            const inTime = dayjs(punches[0]);
            const outTime = punches.length > 1 ? dayjs(punches[punches.length - 1]) : null;
            const workedMin = outTime ? outTime.diff(inTime, 'minute') : 0;
            const otMin = workedMin > expectedMin ? workedMin - expectedMin : 0;

            totalShiftMin += expectedMin;
            totalWorkedMin += workedMin;
            totalOtMin += otMin;
            dayCount++;
            if (otMin > 0) otDays++;
          });

          if (dayCount > 0) {
            allRows.push({
              key: emp.name,
              employee: emp.name,
              employee_name: emp.employee_name,
              department: emp.department || '-',
              company: emp.company || '-',
              shift: emp.default_shift || '-',
              working_days: dayCount,
              ot_days: otDays,
              total_shift_min: totalShiftMin,
              total_worked_min: totalWorkedMin,
              total_ot_min: totalOtMin,
              avg_ot_min: otDays > 0 ? Math.round(totalOtMin / otDays) : 0,
            });
          }
        });

        allRows.sort((a, b) => b.total_ot_min - a.total_ot_min);
        setData(allRows);
        notification.success({ message: `Found ${allRows.length} employee records` });
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
    if (reportType === 'daily') {
      exportRows = data.map(r => ({
        "Employee ID": r.employee,
        "Employee Name": r.employee_name,
        "Department": r.department,
        "Date": r.date,
        "Shift": r.shift,
        "In Time": r.in_time,
        "Out Time": r.out_time,
        "Shift Hrs": formatHrs(r.shift_min),
        "Worked Hrs": formatHrs(r.worked_min),
        "OT Hrs": formatHrs(r.ot_min),
      }));
    } else {
      exportRows = data.map(r => ({
        "Employee ID": r.employee,
        "Employee Name": r.employee_name,
        "Department": r.department,
        "Shift": r.shift,
        "Working Days": r.working_days,
        "OT Days": r.ot_days,
        "Total Shift Hrs": formatHrs(r.total_shift_min),
        "Total Worked Hrs": formatHrs(r.total_worked_min),
        "Total OT Hrs": formatHrs(r.total_ot_min),
        "Avg OT/Day": formatHrs(r.avg_ot_min),
      }));
    }
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OT Summary");
    XLSX.writeFile(wb, `OT_Summary_${fromMonth}_to_${toMonth}.xlsx`);
  };

  // Dynamic columns based on report type
  const summaryColumns = [
    { title: '#', key: 'idx', width: 45, render: (_, __, idx) => idx + 1 },
    {
      title: 'Employee', key: 'emp', width: 180,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Dept', dataIndex: 'department', key: 'dept', width: 100, ellipsis: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 100, ellipsis: true },
    { title: 'Working Days', dataIndex: 'working_days', key: 'wdays', width: 80, align: 'center' },
    {
      title: 'OT Days', dataIndex: 'ot_days', key: 'otdays', width: 70, align: 'center',
      render: (val) => val > 0 ? <Tag color="orange">{val}</Tag> : '0'
    },
    { title: 'Shift Hrs', key: 'shrs', width: 80, align: 'center', render: (_, r) => formatHrs(r.total_shift_min) },
    { title: 'Worked Hrs', key: 'whrs', width: 85, align: 'center', render: (_, r) => formatHrs(r.total_worked_min) },
    {
      title: 'Total OT', key: 'ot', width: 80, align: 'center',
      sorter: (a, b) => a.total_ot_min - b.total_ot_min,
      render: (_, r) => r.total_ot_min > 0 ? <Tag color="blue">{formatHrs(r.total_ot_min)}</Tag> : '-'
    },
    { title: 'Avg OT/Day', key: 'avgot', width: 85, align: 'center', render: (_, r) => r.avg_ot_min > 0 ? formatHrs(r.avg_ot_min) : '-' },
  ];

  const dailyColumns = [
    { title: '#', key: 'idx', width: 45, render: (_, __, idx) => idx + 1 },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 90, sorter: (a, b) => a.date.localeCompare(b.date) },
    {
      title: 'Employee', key: 'emp', width: 170,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Dept', dataIndex: 'department', key: 'dept', width: 90, ellipsis: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 90, ellipsis: true },
    {
      title: 'In', dataIndex: 'in_time', key: 'in', width: 55, align: 'center',
      render: (val) => <span className="text-green-700">{val}</span>
    },
    {
      title: 'Out', dataIndex: 'out_time', key: 'out', width: 55, align: 'center',
      render: (val) => val !== '-' ? <span className="text-blue-700">{val}</span> : '-'
    },
    { title: 'Shift Hrs', key: 'shrs', width: 70, align: 'center', render: (_, r) => formatHrs(r.shift_min) },
    { title: 'Worked', key: 'worked', width: 65, align: 'center', render: (_, r) => formatHrs(r.worked_min) },
    {
      title: 'OT', key: 'ot', width: 65, align: 'center',
      render: (_, r) => r.ot_min > 0 ? <Tag color="blue">{formatHrs(r.ot_min)}</Tag> : '-'
    },
  ];

  const columns = reportType === 'daily' ? dailyColumns : summaryColumns;

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} OT SUMMARY</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters - 3 column layout matching screenshot */}
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
          </div>

          {/* Column 2 - empty to match screenshot spacing */}
          <div className="space-y-3">
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">OT Type</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={otType === 'approved'} onChange={() => setOtType('approved')} /> Approved OT
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={otType === 'system'} onChange={() => setOtType('system')} /> System OT
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">From Month</label>
                <input type="month" className="border rounded px-2 py-1.5 w-full text-sm" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">To Month</label>
                <input type="month" className="border rounded px-2 py-1.5 w-full text-sm" value={toMonth} onChange={(e) => setToMonth(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Report Type</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportType === 'summary'} onChange={() => setReportType('summary')} /> OT Summary Report
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportType === 'daily'} onChange={() => setReportType('daily')} /> OT Daily BreakUp Report
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
          pagination={{ pageSize: 20, showSizeChanger: true }}
          bordered
          loading={loading}
          locale={{ emptyText: 'Select filters and click Generate to view OT summary.' }}
        />
      </div>
    </div>
  );
}