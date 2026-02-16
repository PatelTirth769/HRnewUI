import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';

export default function AttendanceDashboard() {
  const [company, setCompany] = useState('BOMBAIM');
  const [department, setDepartment] = useState('ALL');
  const [grade, setGrade] = useState('ALL');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCheckins();
  }, [date]);

  const fetchCheckins = async () => {
    setLoading(true);
    try {
      // Filter by Date Range (Safer than 'like' for DateTime)
      const fromDate = `${date} 00:00:00`;
      const toDate = `${date} 23:59:59`;

      const filters = [
        ["time", ">=", fromDate],
        ["time", "<=", toDate]
      ];
      const filterString = JSON.stringify(filters);
      const fields = JSON.stringify(["name", "employee", "employee_name", "log_type", "time", "device_id"]);

      const res = await API.get(`/api/resource/Employee Checkin?fields=${fields}&filters=${filterString}&order_by=time desc&limit_page_length=50`);

      if (res.data && res.data.data) {
        setCheckins(res.data.data);
      } else {
        setCheckins([]);
      }
    } catch (error) {
      console.error("Failed to fetch checkins:", error);
      // notification.error({ message: 'Failed to fetch checkins' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE DASHBOARD</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Attendance</h2>
          <div className="flex items-center gap-3 text-sm">
            <span>Choose Date</span>
            <input type="date" className="border rounded px-2 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="px-3 py-2 bg-orange-500 text-white rounded" onClick={fetchCheckins}>Search</button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3 mb-3">
          <div>
            <div className="text-sm">Company</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e) => setCompany(e.target.value)}>{['BOMBAIM', 'DELHI'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Department</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e) => setDepartment(e.target.value)}>{['ALL', 'IT', 'HR', 'Finance'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Grade</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={grade} onChange={(e) => setGrade(e.target.value)}>{['ALL', 'A', 'B', 'C'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Working For</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e) => setWorkingFor(e.target.value)}>{['ALL', 'Self', 'Client'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Working Location</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e) => setLocation(e.target.value)}>{['ALL', 'HQ', 'Branch'].map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 bg-orange-500 text-white rounded">APPLY</button>
          </div>
        </div>

        <div className="bg-orange-500 text-white px-4 py-2 rounded">&nbsp;</div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="col-span-1">
            <div className="border rounded">
              <div className="bg-orange-100 px-3 py-2 text-sm">Attendance Detail</div>
              <div className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>For Date</span>
                  <span className="px-2 py-1 bg-orange-50 border rounded">{new Date(date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 border rounded p-3 text-sm">Non Compliance Cases</div>
          </div>
          <div className="col-span-3">
            <div className="border rounded h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 text-sm border-b sticky top-0 bg-white">
                <div className="font-semibold">Employee Checkins ({checkins.length})</div>
                <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded" onClick={fetchCheckins}>Refresh</button>
              </div>

              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : checkins.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No Checkins Found</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map((row, index) => (
                      <tr key={row.name || index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">{row.time.split(' ')[1]}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.employee_name}</div>
                          <div className="text-xs text-gray-500">{row.employee}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${row.log_type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {row.log_type}
                          </span>
                        </td>
                        <td className="px-3 py-2">{row.device_id || 'Manual'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div></div>
              <div></div>
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">Reports</div>
                <div className="space-y-2 text-sm">
                  {['Punch Register', 'Attendance Register', 'Leave Balance', 'Leave Ledger', 'Roaster', 'OT Report', 'Cuckoo App Registration'].map((r) => (
                    <div key={r} className="text-gray-800">{r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}