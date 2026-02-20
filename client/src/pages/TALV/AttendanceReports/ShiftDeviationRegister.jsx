import React, { useState, useEffect } from 'react';
import { notification, Table, Tag, Button, Checkbox, Spin } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function ShiftDeviationRegister() {
  // Filters matching the screenshot exactly
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');

  const [fromDate, setFromDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [timeFormat, setTimeFormat] = useState('hrs'); // 'hrs' or 'min'
  const [otApplicableOnly, setOtApplicableOnly] = useState(false);
  const [otEnabled, setOtEnabled] = useState(true);
  const [otCriteria, setOtCriteria] = useState('>');
  const [otMinutes, setOtMinutes] = useState('');
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

  // Parse time string "HH:mm:ss" to total minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
  };

  // Format minutes to display string
  const formatDuration = (totalMinutes) => {
    if (totalMinutes === null || totalMinutes === undefined) return '-';
    const absMin = Math.abs(totalMinutes);
    const sign = totalMinutes < 0 ? '-' : '';
    if (timeFormat === 'min') return `${sign}${absMin} min`;
    const h = Math.floor(absMin / 60);
    const m = absMin % 60;
    return `${sign}${h}:${m.toString().padStart(2, '0')}`;
  };

  // Get shift hours from shift type
  const getShiftInfo = (shiftName) => {
    if (!shiftName || shiftName === '-') return null;
    return shiftTypes.find(s => s.name === shiftName) || null;
  };

  // Generate all dates between from and to
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
      if (employee !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.name === employee);
      if (ecode.trim()) filteredEmployees = filteredEmployees.filter(e => e.name.toLowerCase().includes(ecode.trim().toLowerCase()));

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Shift Assignments, Attendance, and Checkins
      const [saRes, attRes, ciRes] = await Promise.all([
        API.get(`/api/resource/Shift Assignment?fields=${JSON.stringify(["employee", "shift_type", "start_date", "end_date"])}&filters=${JSON.stringify([["start_date", "<=", toDate], ["docstatus", "=", 1]])}&limit_page_length=None`),
        API.get(`/api/resource/Attendance?fields=${JSON.stringify(["employee", "attendance_date", "status", "shift", "in_time", "out_time", "late_entry", "early_exit"])}&filters=${JSON.stringify([["attendance_date", ">=", fromDate], ["attendance_date", "<=", toDate]])}&limit_page_length=None`),
        API.get(`/api/resource/Employee Checkin?fields=${JSON.stringify(["employee", "time", "log_type"])}&filters=${JSON.stringify([["time", ">=", `${fromDate} 00:00:00`], ["time", "<=", `${toDate} 23:59:59`]])}&order_by=time asc&limit_page_length=None`)
      ]);

      const assignments = saRes.data.data || [];
      const attendanceRecords = attRes.data.data || [];
      const checkinRecords = ciRes.data.data || [];

      // 3. Build maps
      // Assignment map: employee -> [{shift_type, start_date, end_date}]
      const assignmentMap = {};
      assignments.forEach(sa => {
        if (!assignmentMap[sa.employee]) assignmentMap[sa.employee] = [];
        assignmentMap[sa.employee].push({ shift: sa.shift_type, start: sa.start_date, end: sa.end_date });
      });

      // Attendance map: "emp_date" -> record
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        attendanceMap[`${att.employee}_${att.attendance_date}`] = att;
      });

      // Checkin map: "emp_date" -> sorted times
      const checkinMap = {};
      checkinRecords.forEach(ci => {
        if (!ci.time) return;
        const dateKey = dayjs(ci.time).format('YYYY-MM-DD');
        const key = `${ci.employee}_${dateKey}`;
        if (!checkinMap[key]) checkinMap[key] = [];
        checkinMap[key].push(ci.time);
      });

      // 4. Generate rows
      const dateRange = getDateRange(fromDate, toDate);
      let allRows = [];

      filteredEmployees.forEach(emp => {
        const empAssignments = assignmentMap[emp.name] || [];

        dateRange.forEach(dateStr => {
          const key = `${emp.name}_${dateStr}`;
          const att = attendanceMap[key];
          const punches = (checkinMap[key] || []).sort();

          // Determine assigned shift
          const matchedAssignment = empAssignments.find(a => {
            const end = a.end || '9999-12-31';
            return dateStr >= a.start && dateStr <= end;
          });
          const shiftName = matchedAssignment?.shift || att?.shift || emp.default_shift || '-';
          const shiftInfo = getShiftInfo(shiftName);

          // Expected shift times
          const shiftStart = shiftInfo?.start_time || null;
          const shiftEnd = shiftInfo?.end_time || null;
          const shiftMinutes = (shiftStart && shiftEnd) ? timeToMinutes(shiftEnd) - timeToMinutes(shiftStart) : null;
          // Handle overnight shifts
          const expectedMinutes = shiftMinutes && shiftMinutes < 0 ? shiftMinutes + 1440 : shiftMinutes;

          // Actual in/out times from checkins
          let actualIn = null;
          let actualOut = null;
          if (punches.length > 0) {
            actualIn = dayjs(punches[0]);
            if (punches.length > 1) actualOut = dayjs(punches[punches.length - 1]);
          }

          // Calculate worked minutes
          let workedMinutes = null;
          if (actualIn && actualOut) {
            workedMinutes = actualOut.diff(actualIn, 'minute');
          }

          // Calculate deviation
          let deviationMinutes = null;
          if (workedMinutes !== null && expectedMinutes !== null) {
            deviationMinutes = workedMinutes - expectedMinutes;
          }

          // Calculate OT (only positive deviation counts as OT)
          const otMinutesVal = (deviationMinutes !== null && deviationMinutes > 0) ? deviationMinutes : 0;

          // Late entry: actual in > shift start
          let lateMinutes = 0;
          if (actualIn && shiftStart) {
            const expectedInMin = timeToMinutes(shiftStart);
            const actualInMin = actualIn.hour() * 60 + actualIn.minute();
            if (actualInMin > expectedInMin) lateMinutes = actualInMin - expectedInMin;
          }

          // Early exit: actual out < shift end
          let earlyMinutes = 0;
          if (actualOut && shiftEnd) {
            const expectedOutMin = timeToMinutes(shiftEnd);
            const actualOutMin = actualOut.hour() * 60 + actualOut.minute();
            if (actualOutMin < expectedOutMin) earlyMinutes = expectedOutMin - actualOutMin;
          }

          allRows.push({
            key: key,
            employee: emp.name,
            employee_name: emp.employee_name,
            department: emp.department || '-',
            company: emp.company || '-',
            date: dateStr,
            shift: shiftName,
            shift_start: shiftStart ? shiftStart.substring(0, 5) : '-',
            shift_end: shiftEnd ? shiftEnd.substring(0, 5) : '-',
            expected_minutes: expectedMinutes,
            in_time: actualIn ? actualIn.format('HH:mm') : '-',
            out_time: actualOut ? actualOut.format('HH:mm') : '-',
            worked_minutes: workedMinutes,
            deviation_minutes: deviationMinutes,
            ot_minutes: otMinutesVal,
            late_minutes: lateMinutes,
            early_minutes: earlyMinutes,
          });
        });
      });

      // 5. Apply OT filters
      if (otEnabled && otMinutes.trim()) {
        const threshold = parseInt(otMinutes.trim());
        if (!isNaN(threshold)) {
          allRows = allRows.filter(r => {
            const val = r.ot_minutes;
            if (otCriteria === '>') return val > threshold;
            if (otCriteria === '<') return val < threshold;
            if (otCriteria === '>=') return val >= threshold;
            if (otCriteria === '<=') return val <= threshold;
            if (otCriteria === '=') return val === threshold;
            return true;
          });
        }
      }

      // Filter only rows where there's actual deviation (non-zero worked time)
      if (otApplicableOnly) {
        allRows = allRows.filter(r => r.ot_minutes > 0);
      }

      setData(allRows);
      if (allRows.length > 0) {
        notification.success({ message: `Found ${allRows.length} records` });
      } else {
        notification.info({ message: "No deviation records found for selected filters" });
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
    const exportRows = data.map(r => ({
      "Employee ID": r.employee,
      "Employee Name": r.employee_name,
      "Department": r.department,
      "Date": r.date,
      "Shift": r.shift,
      "Shift Start": r.shift_start,
      "Shift End": r.shift_end,
      "Shift Hrs": formatDuration(r.expected_minutes),
      "In Time": r.in_time,
      "Out Time": r.out_time,
      "Worked": formatDuration(r.worked_minutes),
      "Deviation": formatDuration(r.deviation_minutes),
      "OT": formatDuration(r.ot_minutes),
      "Late Entry": formatDuration(r.late_minutes),
      "Early Exit": formatDuration(r.early_minutes),
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shift Deviation");
    XLSX.writeFile(wb, `Shift_Deviation_${fromDate}_to_${toDate}.xlsx`);
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 90, sorter: (a, b) => a.date.localeCompare(b.date) },
    {
      title: 'Employee', key: 'emp', width: 150,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Dept', dataIndex: 'department', key: 'dept', width: 90, ellipsis: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', width: 90, ellipsis: true },
    { title: 'Shift Start', dataIndex: 'shift_start', key: 'sstart', width: 70, align: 'center' },
    { title: 'Shift End', dataIndex: 'shift_end', key: 'send', width: 70, align: 'center' },
    { title: 'Shift Hrs', key: 'shrs', width: 65, align: 'center', render: (_, r) => formatDuration(r.expected_minutes) },
    {
      title: 'In', dataIndex: 'in_time', key: 'in', width: 55, align: 'center',
      render: (val) => val !== '-' ? <span className="text-green-700 font-medium">{val}</span> : '-'
    },
    {
      title: 'Out', dataIndex: 'out_time', key: 'out', width: 55, align: 'center',
      render: (val) => val !== '-' ? <span className="text-blue-700 font-medium">{val}</span> : '-'
    },
    { title: 'Worked', key: 'worked', width: 60, align: 'center', render: (_, r) => formatDuration(r.worked_minutes) },
    {
      title: 'Dev.', key: 'dev', width: 65, align: 'center',
      render: (_, r) => {
        if (r.deviation_minutes === null) return '-';
        const color = r.deviation_minutes > 0 ? 'text-green-600' : r.deviation_minutes < 0 ? 'text-red-600' : 'text-gray-500';
        const prefix = r.deviation_minutes > 0 ? '+' : '';
        return <span className={`font-medium ${color}`}>{prefix}{formatDuration(r.deviation_minutes)}</span>;
      }
    },
    {
      title: 'OT', key: 'ot', width: 55, align: 'center',
      render: (_, r) => r.ot_minutes > 0 ? <Tag color="blue">{formatDuration(r.ot_minutes)}</Tag> : '-'
    },
    {
      title: 'Late', key: 'late', width: 60, align: 'center',
      render: (_, r) => r.late_minutes > 0 ? <Tag color="orange">{formatDuration(r.late_minutes)}</Tag> : '-'
    },
    {
      title: 'Early', key: 'early', width: 60, align: 'center',
      render: (_, r) => r.early_minutes > 0 ? <Tag color="magenta">{formatDuration(r.early_minutes)}</Tag> : '-'
    },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} SHIFT DEVIATION REGISTER</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters - matching screenshot layout: 3 columns */}
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
              <label className="text-xs font-semibold text-gray-600">Employee</label>
              <select className="border rounded px-2 py-1.5 w-full text-sm" value={employee} onChange={(e) => setEmployee(e.target.value)}>
                <option value="ALL">ALL</option>
                {employees.map(e => <option key={e.name} value={e.name}>{e.employee_name} ({e.name})</option>)}
              </select>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
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

          {/* Column 3 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">ECode</label>
              <input type="text" className="border rounded px-2 py-1.5 w-full text-sm" placeholder="Search by employee code..." value={ecode} onChange={(e) => setEcode(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Time Duration Format</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={timeFormat === 'hrs'} onChange={() => setTimeFormat('hrs')} /> In Hrs
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={timeFormat === 'min'} onChange={() => setTimeFormat('min')} /> In Min
                </label>
              </div>
            </div>
            <div>
              <Checkbox checked={otApplicableOnly} onChange={(e) => setOtApplicableOnly(e.target.checked)}>
                <span className="text-sm">Employee with OT applicable only</span>
              </Checkbox>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox checked={otEnabled} onChange={(e) => setOtEnabled(e.target.checked)}>
                <span className="text-sm">OT</span>
              </Checkbox>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">OT Criteria</span>
                <select className="border rounded px-1 py-1 text-sm w-16" value={otCriteria} onChange={(e) => setOtCriteria(e.target.value)} disabled={!otEnabled}>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="=">=</option>
                </select>
                <input type="number" className="border rounded px-2 py-1 text-sm w-20" placeholder="minutes" value={otMinutes} onChange={(e) => setOtMinutes(e.target.value)} disabled={!otEnabled} />
                <span className="text-xs text-gray-500">minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4 border-t pt-3">
          <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerate} loading={loading} className="bg-green-600 hover:bg-green-700 border-none">View</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>Export Excel</Button>
        </div>

        {/* Results Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="key"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ y: 500 }}
          bordered
          loading={loading}
          locale={{ emptyText: 'Select filters and click View to generate the deviation report.' }}
        />

        {/* Info Note */}
        <div className="mt-3 text-xs text-blue-700 bg-blue-50 p-2 rounded">
          <b>Note:</b>
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            <li><b>Deviation</b> = Worked Hours − Shift Hours. Positive = overtime, Negative = shortfall.</li>
            <li><b>Late Entry</b> = Minutes after shift start. <b>Early Exit</b> = Minutes before shift end.</li>
            <li>In/Out times are from Employee Checkin (biometric/device) records.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}