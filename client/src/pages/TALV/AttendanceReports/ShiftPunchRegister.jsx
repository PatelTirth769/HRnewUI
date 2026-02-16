import React, { useState } from 'react';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import { notification } from 'antd';

export default function ShiftPunchRegister() {
  const [company, setCompany] = useState('ALL');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [department, setDepartment] = useState('');
  const [shift, setShift] = useState('ALL');
  const [entity, setEntity] = useState('--ALL--');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [punches, setPunches] = useState('punched');
  const [layout, setLayout] = useState('vertical');
  const [format, setFormat] = useState('xlsx');
  const [mode, setMode] = useState('all');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

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

      const filterString = JSON.stringify(filters);
      const fields = JSON.stringify(["name", "employee", "employee_name", "log_type", "time", "device_id"]);

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
                {['ALL', 'BOMBAIM', 'DELHI'].map(v => (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e) => setDepartment(e.target.value)} />
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
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e) => setEmployee(e.target.value)}>
                {['ALL'].map(v => (<option key={v}>{v}</option>))}
              </select>
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

        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
          {data.length > 0 && (
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleExport}>
              Export to Excel
            </button>
          )}
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
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-4 text-center text-gray-500">No records found. Click Generate.</td></tr>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}