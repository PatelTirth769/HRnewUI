import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';

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

  useEffect(() => {
    fetchData();
  }, [date, status, employee]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch All Active Employees
      // Optimize: fetch only needed fields
      const empRes = await API.get(`/api/resource/Employee?fields=["name","employee_name","company","department"]&filters=[["status","=","Active"]]&limit_page_length=5000`);
      const employees = empRes.data.data || [];

      // 2. Fetch Attendance for Selected Date
      // We only need records for this specific DATE to map to employees
      const attFilters = [["attendance_date", "=", date]];
      const attFilterString = JSON.stringify(attFilters);
      const attFields = JSON.stringify(["name", "employee", "status", "shift", "in_time", "out_time", "company"]);

      const attRes = await API.get(`/api/resource/Attendance?fields=${attFields}&filters=${attFilterString}&limit_page_length=5000`);
      const attendanceRecords = attRes.data.data || [];

      // 3. Merge Data
      // Map attendance by Employee ID for quick lookup
      const attendanceMap = {};
      attendanceRecords.forEach(att => {
        attendanceMap[att.employee] = att;
      });

      // Build Table Data
      const mergedData = employees.map(emp => {
        const record = attendanceMap[emp.name];
        return {
          employee: emp.name,
          employee_name: emp.employee_name,
          attendance_date: date,
          status: record ? record.status : 'Not Marked', // Default to Not Marked
          shift: record ? record.shift : '-',
          in_time: record ? record.in_time : '-',
          out_time: record ? record.out_time : '-',
          company: emp.company, // Use Employee's company
          department: emp.department
        };
      });

      // 4. Client-side Filtering for Status/Employee (since we fetched ALL first)
      const filteredData = mergedData.filter(row => {
        let pass = true;
        if (status && status !== 'ALL') {
          pass = pass && row.status === status;
        }
        if (employee && employee !== 'ALL') {
          // If filtering by specific employee
          // pass = pass && row.employee === employee;
        }
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

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE CONTROL</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Organization</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>{['BOMBAIM'].map(v => <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>{['ALL'].map(v => <option key={v}>{v}</option>)}</select>
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

        <div className="mt-3 flex items-center gap-2 mb-4">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Export Attendance</button>
          <button className="px-3 py-2 border rounded">View Policy</button>
          <button className="px-3 py-2 border rounded">Attendance Amendments</button>
          <button className="px-3 py-2 border rounded">Post Facto Shift Correction</button>
          <button className="px-3 py-2 border rounded">Logs</button>
          <div className="flex-1" />
          <button className="px-3 py-2 bg-orange-500 text-white rounded" onClick={fetchData}>🔎</button>
          <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border-b">
                <th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Shift</th>
                <th className="px-3 py-2 text-left">In Time</th>
                <th className="px-3 py-2 text-left">Out Time</th>
                <th className="px-3 py-2 text-left">Company</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center p-4">Loading...</td></tr>
              ) : attendanceData.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-4">No Employees Found</td></tr>
              ) : (
                attendanceData.map((row, index) => (
                  <tr key={row.employee || index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{row.employee}</td>
                    <td className="px-3 py-2 font-medium">{row.employee_name}</td>
                    <td className="px-3 py-2">{row.attendance_date}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${row.status === 'Present' ? 'bg-green-100 text-green-800' :
                        row.status === 'Absent' ? 'bg-red-100 text-red-800' :
                          row.status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                            row.status === 'Not Marked' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">{row.shift}</td>
                    <td className="px-3 py-2">{row.in_time}</td>
                    <td className="px-3 py-2">{row.out_time}</td>
                    <td className="px-3 py-2">{row.company}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Showing {attendanceData.length} records
        </div>
      </div>
    </div>
  );
}