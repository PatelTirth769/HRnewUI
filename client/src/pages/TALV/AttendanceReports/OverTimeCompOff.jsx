import React, { useState, useEffect } from 'react';
import { notification, Table, Tag, Button, Checkbox } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function OverTimeCompOff() {
  // Filters matching the original UI
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [monthwise, setMonthwise] = useState(false);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [compute, setCompute] = useState('ot');
  const [reportOn, setReportOn] = useState('policy');
  const [otOnly, setOtOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Master data
  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [shifts, setShifts] = useState(['ALL']);
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
      if (shiftRes.data.data) {
        setShiftTypes(shiftRes.data.data);
        setShifts(['ALL', ...shiftRes.data.data.map(s => s.name)]);
      }
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

      // 2. Fetch data
      const [saRes, ciRes] = await Promise.all([
        API.get(`/api/resource/Shift Assignment?fields=${JSON.stringify(["employee", "shift_type", "start_date", "end_date"])}&filters=${JSON.stringify([["start_date", "<=", toDate], ["docstatus", "=", 1]])}&limit_page_length=None`),
        API.get(`/api/resource/Employee Checkin?fields=${JSON.stringify(["employee", "time", "log_type"])}&filters=${JSON.stringify([["time", ">=", `${fromDate} 00:00:00`], ["time", "<=", `${toDate} 23:59:59`]])}&order_by=time asc&limit_page_length=None`)
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

      const dateRange = getDateRange(fromDate, toDate);

      if (monthwise) {
        // Monthwise summary: group by employee + month
        const monthMap = {};

        filteredEmployees.forEach(emp => {
          const empAssignments = assignmentMap[emp.name] || [];

          dateRange.forEach(dateStr => {
            const key = `${emp.name}_${dateStr}`;
            const punches = (checkinMap[key] || []).sort();
            if (punches.length < 2) return;

            const matchedAssignment = empAssignments.find(a => {
              const end = a.end || '9999-12-31';
              return dateStr >= a.start && dateStr <= end;
            });
            const shiftName = matchedAssignment?.shift || emp.default_shift || '-';
            const shiftInfo = shiftTypes.find(s => s.name === shiftName);
            if (!shiftInfo) return;

            const shiftMin = timeToMinutes(shiftInfo.end_time) - timeToMinutes(shiftInfo.start_time);
            const expectedMin = shiftMin < 0 ? shiftMin + 1440 : shiftMin;

            const inTime = dayjs(punches[0]);
            const outTime = dayjs(punches[punches.length - 1]);
            const workedMin = outTime.diff(inTime, 'minute');
            const otMin = workedMin > expectedMin ? workedMin - expectedMin : 0;

            const monthKey = dayjs(dateStr).format('YYYY-MM');
            const mKey = `${emp.name}_${monthKey}`;

            if (!monthMap[mKey]) {
              monthMap[mKey] = {
                key: mKey,
                employee: emp.name,
                employee_name: emp.employee_name,
                department: emp.department || '-',
                company: emp.company || '-',
                shift: shiftName,
                month: monthKey,
                total_days: 0,
                total_shift_min: 0,
                total_worked_min: 0,
                total_ot_min: 0,
              };
            }
            monthMap[mKey].total_days++;
            monthMap[mKey].total_shift_min += expectedMin;
            monthMap[mKey].total_worked_min += workedMin;
            monthMap[mKey].total_ot_min += otMin;
          });
        });

        let rows = Object.values(monthMap);
        if (otOnly) rows = rows.filter(r => r.total_ot_min > 0);
        rows.sort((a, b) => a.employee.localeCompare(b.employee) || a.month.localeCompare(b.month));
        setData(rows);
      } else {
        // Daily detailed view
        let allRows = [];

        filteredEmployees.forEach(emp => {
          const empAssignments = assignmentMap[emp.name] || [];
          let totalShiftMin = 0;
          let totalWorkedMin = 0;
          let totalOtMin = 0;
          let dayCount = 0;

          dateRange.forEach(dateStr => {
            const key = `${emp.name}_${dateStr}`;
            const punches = (checkinMap[key] || []).sort();
            if (punches.length < 2) return;

            const matchedAssignment = empAssignments.find(a => {
              const end = a.end || '9999-12-31';
              return dateStr >= a.start && dateStr <= end;
            });
            const shiftName = matchedAssignment?.shift || emp.default_shift || '-';
            const shiftInfo = shiftTypes.find(s => s.name === shiftName);
            if (!shiftInfo) return;

            const shiftMin = timeToMinutes(shiftInfo.end_time) - timeToMinutes(shiftInfo.start_time);
            const expectedMin = shiftMin < 0 ? shiftMin + 1440 : shiftMin;

            const inTime = dayjs(punches[0]);
            const outTime = dayjs(punches[punches.length - 1]);
            const workedMin = outTime.diff(inTime, 'minute');
            const otMin = workedMin > expectedMin ? workedMin - expectedMin : 0;

            totalShiftMin += expectedMin;
            totalWorkedMin += workedMin;
            totalOtMin += otMin;
            dayCount++;
          });

          if (dayCount > 0) {
            allRows.push({
              key: emp.name,
              employee: emp.name,
              employee_name: emp.employee_name,
              department: emp.department || '-',
              company: emp.company || '-',
              shift: emp.default_shift || '-',
              total_days: dayCount,
              total_shift_min: totalShiftMin,
              total_worked_min: totalWorkedMin,
              total_ot_min: totalOtMin,
              compoff_days: totalOtMin > 0 ? Math.floor(totalOtMin / (totalShiftMin / dayCount)) : 0,
            });
          }
        });

        if (otOnly) allRows = allRows.filter(r => r.total_ot_min > 0);
        allRows.sort((a, b) => a.employee.localeCompare(b.employee));
        setData(allRows);
      }

      notification.success({ message: `Found ${data.length || 0} records` });

    } catch (error) {
      console.error("Error generating report:", error);
      notification.error({ message: "Failed to generate report" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) { notification.warning({ message: "No data to export" }); return; }
    const exportRows = data.map(r => ({
      "Employee ID": r.employee,
      "Employee Name": r.employee_name,
      "Department": r.department,
      "Shift": r.shift,
      ...(monthwise ? { "Month": r.month } : {}),
      "Working Days": r.total_days,
      "Shift Hrs": formatHrs(r.total_shift_min),
      "Worked Hrs": formatHrs(r.total_worked_min),
      "OT Hrs": formatHrs(r.total_ot_min),
      ...(!monthwise ? { "Comp-Off Days": r.compoff_days } : {}),
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OT Report");
    XLSX.writeFile(wb, `OT_CompOff_${fromDate}_to_${toDate}.xlsx`);
  };

  const columns = [
    { title: '#', key: 'idx', width: 45, render: (_, __, idx) => idx + 1 },
    {
      title: 'Employee', key: 'emp', width: 180,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Dept', dataIndex: 'department', key: 'dept', width: 100, ellipsis: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 100, ellipsis: true },
    ...(monthwise ? [{ title: 'Month', dataIndex: 'month', key: 'month', width: 90 }] : []),
    { title: 'Days', dataIndex: 'total_days', key: 'days', width: 55, align: 'center' },
    { title: 'Shift Hrs', key: 'shrs', width: 80, align: 'center', render: (_, r) => formatHrs(r.total_shift_min) },
    { title: 'Worked Hrs', key: 'whrs', width: 85, align: 'center', render: (_, r) => formatHrs(r.total_worked_min) },
    {
      title: 'OT Hrs', key: 'ot', width: 80, align: 'center',
      sorter: (a, b) => a.total_ot_min - b.total_ot_min,
      render: (_, r) => r.total_ot_min > 0 ? <Tag color="blue">{formatHrs(r.total_ot_min)}</Tag> : '-'
    },
    ...(!monthwise ? [{
      title: 'Comp-Off', key: 'compoff', width: 75, align: 'center',
      render: (_, r) => r.compoff_days > 0 ? <Tag color="green">{r.compoff_days} days</Tag> : '-'
    }] : []),
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} OVER TIME / COMP-OFF</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters - 3 column layout */}
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
            <Checkbox checked={monthwise} onChange={(e) => setMonthwise(e.target.checked)}>
              <span className="text-sm">Monthwise OT</span>
            </Checkbox>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">From Date</label>
                <input type="date" className="border rounded px-2 py-1.5 w-full text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">To Date</label>
                <input type="date" className="border rounded px-2 py-1.5 w-full text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Report based on</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportOn === 'policy'} onChange={() => setReportOn('policy')} /> Company Policy
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={reportOn === 'compliance'} onChange={() => setReportOn('compliance')} /> Compliance
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Compute Hrs Based On</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={compute === 'ot'} onChange={() => setCompute('ot')} /> OT
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={compute === 'wh'} onChange={() => setCompute('wh')} /> Working Hours
                </label>
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <Checkbox checked={otOnly} onChange={(e) => setOtOnly(e.target.checked)}>
              <span className="text-sm">Emp with OT applicable only</span>
            </Checkbox>
          </div>
        </div>

        {/* Notes */}
        <div className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded">
          <div className="font-semibold">Note:</div>
          <ol className="list-decimal pl-5 mt-1 space-y-0.5">
            <li>On OT option, output shows records with Working Hrs greater than Shift Hrs plus Grace Period.</li>
            <li>On Working Hours option, OT hrs computed using working hrs vs standard hrs.</li>
          </ol>
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
          locale={{ emptyText: 'Select filters and click Generate to view OT/Comp-Off report.' }}
        />
      </div>
    </div>
  );
}
