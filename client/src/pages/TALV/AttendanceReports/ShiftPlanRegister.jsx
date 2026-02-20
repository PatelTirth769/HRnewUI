import React, { useState, useEffect } from 'react';
import { notification, Button, Spin } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function ShiftPlanRegister() {
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [mode, setMode] = useState('name'); // 'name' or 'time'
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState(['ALL']);
  const [departments, setDepartments] = useState(['ALL']);
  const [shiftTypes, setShiftTypes] = useState([]); // {name, start_time, end_time}
  const [employees, setEmployees] = useState([]);

  // Report data: array of { employee, employee_name, company, department, dates: { 'YYYY-MM-DD': shiftName } }
  const [reportData, setReportData] = useState([]);
  const [dateColumns, setDateColumns] = useState([]);

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

  // Get shift time string from shift name
  const getShiftTime = (shiftName) => {
    if (!shiftName || shiftName === '-') return '-';
    const s = shiftTypes.find(item => item.name === shiftName);
    if (!s) return shiftName;
    const start = s.start_time ? s.start_time.substring(0, 5) : '??';
    const end = s.end_time ? s.end_time.substring(0, 5) : '??';
    return `${start}-${end}`;
  };

  // Generate date range
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

      if (filteredEmployees.length === 0) {
        notification.warning({ message: "No employees match the selected filters" });
        setReportData([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Shift Assignments for the date range
      const saFilters = [
        ["start_date", "<=", toDate],
        ["docstatus", "=", 1]
      ];
      const saFields = JSON.stringify(["employee", "shift_type", "start_date", "end_date"]);
      const saRes = await API.get(`/api/resource/Shift Assignment?fields=${saFields}&filters=${JSON.stringify(saFilters)}&limit_page_length=None&order_by=start_date asc`);

      const assignments = saRes.data.data || [];
      console.log(`Fetched ${assignments.length} Shift Assignments`);

      // 3. Build assignment map: employee -> [{shift_type, start_date, end_date}]
      const assignmentMap = {};
      assignments.forEach(sa => {
        const emp = sa.employee;
        if (!assignmentMap[emp]) assignmentMap[emp] = [];
        assignmentMap[emp].push({
          shift: sa.shift_type,
          start: sa.start_date,
          end: sa.end_date
        });
      });

      // 4. Generate date columns
      const dates = getDateRange(fromDate, toDate);
      setDateColumns(dates);

      // 5. Build report rows
      const rows = filteredEmployees.map(emp => {
        const empAssignments = assignmentMap[emp.name] || [];
        const dateShifts = {};

        dates.forEach(dateStr => {
          // Find assignment covering this date
          const match = empAssignments.find(a => {
            const start = a.start;
            const end = a.end || '9999-12-31'; // If no end_date, treat as ongoing
            return dateStr >= start && dateStr <= end;
          });

          if (match) {
            dateShifts[dateStr] = match.shift;
          } else {
            // Fallback to employee's default shift
            dateShifts[dateStr] = emp.default_shift || '-';
          }
        });

        return {
          employee: emp.name,
          employee_name: emp.employee_name,
          company: emp.company,
          department: emp.department,
          default_shift: emp.default_shift || '-',
          dates: dateShifts
        };
      });

      // 6. Apply shift filter: only show employees who have the selected shift on any day
      let filteredRows = rows;
      if (shiftFilter !== 'ALL') {
        filteredRows = rows.filter(row =>
          Object.values(row.dates).some(s => s === shiftFilter)
        );
      }

      setReportData(filteredRows);
      notification.success({ message: `Generated shift plan for ${filteredRows.length} employees across ${dates.length} days` });

    } catch (error) {
      console.error("Error generating shift plan:", error);
      notification.error({ message: "Failed to generate report" });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (reportData.length === 0) { notification.warning({ message: "No data to export" }); return; }
    const exportRows = reportData.map(row => {
      const base = {
        "Employee ID": row.employee,
        "Employee Name": row.employee_name,
        "Department": row.department,
        "Default Shift": row.default_shift
      };
      dateColumns.forEach(d => {
        const shiftVal = row.dates[d] || '-';
        const label = dayjs(d).format('DD-MMM');
        base[label] = mode === 'time' ? getShiftTime(shiftVal) : shiftVal;
      });
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shift Plan");
    XLSX.writeFile(wb, `Shift_Plan_Register_${fromDate}_to_${toDate}.xlsx`);
  };

  // Get short shift label for display
  const getCellText = (shiftName) => {
    if (!shiftName || shiftName === '-') return '-';
    if (mode === 'time') return getShiftTime(shiftName);
    // Abbreviate long names
    return shiftName.length > 8 ? shiftName.substring(0, 8) + '..' : shiftName;
  };

  // Color coding for shifts
  const getShiftColor = (shiftName) => {
    if (!shiftName || shiftName === '-') return '#f3f4f6';
    const colors = ['#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#e9d5ff', '#cffafe', '#fed7aa'];
    const idx = shiftTypes.findIndex(s => s.name === shiftName);
    return idx >= 0 ? colors[idx % colors.length] : '#e5e7eb';
  };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDANCE REPORTS {'>'} SHIFT PLAN REGISTER</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Company</label>
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
            <select className="border rounded px-2 py-1.5 w-full text-sm" value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
              <option value="ALL">ALL</option>
              {shiftTypes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600">Display</label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={mode === 'name'} onChange={() => setMode('name')} /> Shift Name
              </label>
              <label className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={mode === 'time'} onChange={() => setMode('time')} /> Shift Time
              </label>
            </div>
          </div>
          <div className="space-y-1 flex items-end gap-2">
            <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerate} loading={loading} className="bg-orange-500 hover:bg-orange-600 border-none">View</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={reportData.length === 0}>Export</Button>
          </div>
        </div>

        {/* Grid Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Spin size="large" /></div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 bg-gray-100 px-2 py-2 text-left font-semibold border-r min-w-[60px]">#</th>
                  <th className="sticky left-[60px] z-10 bg-gray-100 px-2 py-2 text-left font-semibold border-r min-w-[160px]">Employee</th>
                  <th className="sticky left-[220px] z-10 bg-gray-100 px-2 py-2 text-left font-semibold border-r min-w-[100px]">Department</th>
                  {dateColumns.map(d => {
                    const day = dayjs(d);
                    const isSun = day.day() === 0;
                    return (
                      <th key={d} className={`px-1 py-2 text-center font-semibold border-r min-w-[65px] ${isSun ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}>
                        <div>{day.format('DD')}</div>
                        <div className="text-[10px] font-normal">{day.format('ddd')}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={row.employee} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="sticky left-0 z-10 bg-inherit px-2 py-1.5 border-r text-gray-500">{idx + 1}</td>
                    <td className="sticky left-[60px] z-10 bg-inherit px-2 py-1.5 border-r">
                      <div className="font-medium text-gray-800">{row.employee_name}</div>
                      <div className="text-[10px] text-gray-400">{row.employee}</div>
                    </td>
                    <td className="sticky left-[220px] z-10 bg-inherit px-2 py-1.5 border-r text-gray-600">{row.department || '-'}</td>
                    {dateColumns.map(d => {
                      const shiftVal = row.dates[d] || '-';
                      const isSun = dayjs(d).day() === 0;
                      return (
                        <td
                          key={d}
                          className={`px-1 py-1.5 text-center border-r ${isSun ? 'bg-red-50/50' : ''}`}
                          style={{ backgroundColor: shiftVal !== '-' && !isSun ? getShiftColor(shiftVal) : undefined }}
                          title={`${row.employee_name} | ${dayjs(d).format('DD-MMM-YYYY')} | ${shiftVal} (${getShiftTime(shiftVal)})`}
                        >
                          <span className="text-[11px] font-medium">{getCellText(shiftVal)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">Select filters and click <b>View</b> to generate the shift plan register.</div>
        )}

        {/* Legend */}
        {reportData.length > 0 && shiftTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="font-semibold text-gray-600">Legend:</span>
            {shiftTypes.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: getShiftColor(s.name) }}></span>
                {s.name} ({s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)})
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-200"></span>
              Sunday
            </span>
          </div>
        )}

        <div className="mt-3 text-xs text-blue-700 bg-blue-50 p-2 rounded">
          <b>Note:</b> Shift assignments are fetched from ERPNext. If no assignment exists for a date, the employee's default shift is shown.
        </div>
      </div>
    </div>
  );
}