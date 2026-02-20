import React, { useState, useEffect } from 'react';
import { notification, Table, Tag, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function AbscondingReport() {
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [employeeName, setEmployeeName] = useState('');
  const [days, setDays] = useState('3');
  const [sortBy, setSortBy] = useState('ECode');
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [employees, setEmployees] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    try {
      const [compRes, deptRes, empRes] = await Promise.all([
        API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Employee?fields=["name","employee_name","default_shift","company","department","date_of_joining"]&filters=[["status","=","Active"]]&limit_page_length=None')
      ]);
      if (compRes.data.data) setCompanies(['ALL', ...compRes.data.data.map(c => c.name)]);
      if (deptRes.data.data) setDepartments(['ALL', ...deptRes.data.data.map(d => d.name)]);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
      notification.error({ message: "Failed to load dropdown data" });
    }
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
      const threshold = parseInt(days) || 3;

      // 1. Filter employees
      let filteredEmployees = [...employees];
      if (org !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.company === org);
      if (dept !== 'ALL') filteredEmployees = filteredEmployees.filter(e => e.department === dept);
      if (employeeName.trim()) {
        const search = employeeName.trim().toLowerCase();
        filteredEmployees = filteredEmployees.filter(e =>
          e.employee_name?.toLowerCase().includes(search) || e.name.toLowerCase().includes(search)
        );
      }

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Attendance AND Employee Checkin records
      const [attRes, ciRes] = await Promise.all([
        API.get(`/api/resource/Attendance?fields=${JSON.stringify(["employee", "attendance_date", "status"])}&filters=${JSON.stringify([["attendance_date", ">=", fromDate], ["attendance_date", "<=", toDate]])}&limit_page_length=None`),
        API.get(`/api/resource/Employee Checkin?fields=${JSON.stringify(["employee", "time"])}&filters=${JSON.stringify([["time", ">=", `${fromDate} 00:00:00`], ["time", "<=", `${toDate} 23:59:59`]])}&limit_page_length=None`)
      ]);
      const attendanceRecords = attRes.data.data || [];
      const checkinRecords = ciRes.data.data || [];

      // 3. Build maps
      // Attendance map: "emp_date" -> status
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        attendanceMap[`${att.employee}_${att.attendance_date}`] = att.status;
      });

      // Checkin map: "emp_date" -> true (has punch)
      const checkinMap = {};
      checkinRecords.forEach(ci => {
        if (!ci.time) return;
        const dateKey = dayjs(ci.time).format('YYYY-MM-DD');
        checkinMap[`${ci.employee}_${dateKey}`] = true;
      });

      // 4. For each employee, find continuous absent streaks
      // Logic:
      //   - Attendance "Present" / "Half Day" / "On Leave" -> NOT absent
      //   - Has punch in Employee Checkin -> NOT absent (even without attendance record)
      //   - Attendance "Absent" AND no punch -> ABSENT
      //   - No attendance record AND no punch -> ABSENT (Not Marked = absent)
      const dateRange = getDateRange(fromDate, toDate);
      const abscondingRows = [];

      filteredEmployees.forEach(emp => {
        let streakStart = null;
        let streakCount = 0;

        const flushStreak = () => {
          if (streakCount >= threshold) {
            abscondingRows.push({
              key: `${emp.name}_${streakStart}`,
              employee: emp.name,
              employee_name: emp.employee_name,
              department: emp.department || '-',
              company: emp.company || '-',
              absent_from: streakStart,
              absent_to: dayjs(streakStart).add(streakCount - 1, 'day').format('YYYY-MM-DD'),
              total_days: streakCount,
              date_of_joining: emp.date_of_joining || '-',
            });
          }
          streakStart = null;
          streakCount = 0;
        };

        dateRange.forEach(dateStr => {
          const key = `${emp.name}_${dateStr}`;
          const status = attendanceMap[key];
          const hasPunch = checkinMap[key];
          const isSunday = dayjs(dateStr).day() === 0;

          // Skip Sundays (don't break streak, don't count)
          if (isSunday) return;

          // If employee has a punch -> they came to work -> NOT absent
          if (hasPunch) { flushStreak(); return; }

          // If attendance is Present / Half Day / On Leave -> NOT absent
          if (status && status !== 'Absent') { flushStreak(); return; }

          // Otherwise: Absent (status = "Absent") or Not Marked (no record, no punch)
          if (!streakStart) streakStart = dateStr;
          streakCount++;
        });

        // Final flush for streak ending at the last date
        flushStreak();
      });

      // 5. Sort
      if (sortBy === 'ECode') {
        abscondingRows.sort((a, b) => a.employee.localeCompare(b.employee));
      } else {
        abscondingRows.sort((a, b) => a.absent_from.localeCompare(b.absent_from));
      }

      setData(abscondingRows);
      if (abscondingRows.length > 0) {
        notification.success({ message: `Found ${abscondingRows.length} absconding records` });
      } else {
        notification.info({ message: `No employees found with ${threshold}+ continuous absent days` });
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
      "Company": r.company,
      "Absent From": r.absent_from,
      "Absent To": r.absent_to,
      "Total Days": r.total_days,
      "Date of Joining": r.date_of_joining,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absconding Report");
    XLSX.writeFile(wb, `Absconding_Report_${fromDate}_to_${toDate}.xlsx`);
  };

  const columns = [
    { title: '#', key: 'idx', width: 50, render: (_, __, idx) => idx + 1 },
    {
      title: 'Employee', key: 'emp', width: 200,
      render: (_, r) => <div><div className="font-medium">{r.employee_name}</div><div className="text-xs text-gray-400">{r.employee}</div></div>
    },
    { title: 'Department', dataIndex: 'department', key: 'dept', width: 120 },
    { title: 'Company', dataIndex: 'company', key: 'comp', width: 120 },
    {
      title: 'Absent From', dataIndex: 'absent_from', key: 'from', width: 110,
      sorter: (a, b) => a.absent_from.localeCompare(b.absent_from),
      render: (val) => <span className="text-red-600 font-medium">{val}</span>
    },
    {
      title: 'Absent To', dataIndex: 'absent_to', key: 'to', width: 110,
      render: (val) => <span className="text-red-600 font-medium">{val}</span>
    },
    {
      title: 'Total Days', dataIndex: 'total_days', key: 'days', width: 90, align: 'center',
      sorter: (a, b) => a.total_days - b.total_days,
      render: (val) => <Tag color="red">{val} days</Tag>
    },
    { title: 'DOJ', dataIndex: 'date_of_joining', key: 'doj', width: 100 },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} REPORTS {'>'} ATTENDANCE REPORTS {'>'} ABSCONDING REPORT</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters - 2 column layout matching screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">

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
            <div>
              <label className="text-xs font-semibold text-gray-600">No.of Days Continuous Absent {'>='}</label>
              <input type="number" className="border rounded px-2 py-1.5 w-full text-sm" value={days} onChange={(e) => setDays(e.target.value)} min="1" />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Employee Name</label>
              <input type="text" className="border rounded px-2 py-1.5 w-full text-sm" placeholder="Search by name or code..." value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Sort By</label>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={sortBy === 'ECode'} onChange={() => setSortBy('ECode')} /> ECode
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" checked={sortBy === 'From Date'} onChange={() => setSortBy('From Date')} /> From Date
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="text-xs text-blue-700 mb-3">
          Note: This report helps HR to see employees who are continuously absent for more than x working days, as per filters and period.
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
          locale={{ emptyText: 'Select filters and click Generate to find absconding employees.' }}
        />
      </div>
    </div>
  );
}