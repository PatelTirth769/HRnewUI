import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';
import dayjs from 'dayjs';

export default function EmployeeLeaveMaster() {
  const [org, setOrg] = useState('BOMBAIM');
  const [status, setStatus] = useState('CURRENT');
  const [type, setType] = useState('Privilege Leave');
  const [year, setYear] = useState(dayjs().year().toString());
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState({}); // Cache for employee details if needed

  // Fetch Leave Allocations
  useEffect(() => {
    fetchAllocations();
  }, [type, year]); // Refetch when filters change

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      // Build filters based on Year and Type if needed
      // For now, fetch all and filter client-side or add simple filters
      // Note: ERPNext Leave Allocation has 'from_date' and 'to_date', 'leave_type'

      const filters = [];
      if (type && type !== 'All') {
        // filters.push([`leave_type`, `=`, type]); // Uncomment if strict filtering needed
      }

      // Fetch fields
      const fields = JSON.stringify(["name", "employee", "employee_name", "leave_type", "total_leaves_allocated", "new_leaves_allocated", "from_date", "to_date"]);
      const res = await API.get(`/api/resource/Leave Allocation?fields=${fields}&limit_page_length=None`);

      if (res.data && res.data.data) {
        setAllocations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leave allocations:", error);
      notification.error({ message: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredRows = allocations.filter(row => {
    const matchesSearch = !searchText ||
      (row.employee_name && row.employee_name.toLowerCase().includes(searchText.toLowerCase())) ||
      (row.employee && row.employee.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = !type || type === 'All' || row.leave_type === type;
    // Simple year check based on from_date
    const matchesYear = !year || (row.from_date && row.from_date.includes(year));

    return matchesSearch && matchesType && matchesYear;
  });

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} EMPLOYEE LEAVE MASTER</nav>
      <div className="bg-white rounded-md border p-4">
        {/* Actions Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">New</button>
            <button className="px-3 py-2 border rounded">Bulk Upload Employee Leave Master</button>
            <button className="px-3 py-2 border rounded">Month End Process</button>
            <button className="px-3 py-2 border rounded">Year Beginning Process</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs"><span>No. of Records: {filteredRows.length}</span></div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={fetchAllocations}>🔄</button>
              <button className="px-3 py-2 bg-red-600 text-white rounded">⬇️</button>
            </div>
          </div>
        </div>

        {/* Filters Row 1 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Organization Name</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e) => setOrg(e.target.value)}>
              <option>All</option>
              <option>BOMBAIM</option>
            </select>
          </div>
          <div>
            <div className="text-sm">Status</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>CURRENT</option>
              <option>CLOSED</option>
            </select>
          </div>
          <div>
            <div className="text-sm">Type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="All">All</option>
              <option value="Privilege Leave">Privilege Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Leave Without Pay">Leave Without Pay</option>
            </select>
          </div>
          <div>
            <div className="text-sm">C Year</div>
            <input
              type="number"
              className="border rounded px-2 py-2 w-full text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <div className="text-sm">Search On</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e) => setSearchOn(e.target.value)}>
              <option>All</option>
              <option>Employee Name</option>
              <option>Ecode</option>
            </select>
          </div>
        </div>

        {/* Filters Row 2 */}
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Search Text</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search Name or ID..." />
          </div>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          </div>
          <div className="col-span-2"></div>
          <div className="flex items-end gap-2 justify-end">
            {/* Pagination placeholder */}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                <th className="px-3 py-2 text-left">ECODE</th>
                <th className="px-3 py-2 text-left">WORKING ORGANIZATION</th>
                <th className="px-3 py-2 text-left">Valid From</th>
                <th className="px-3 py-2 text-left">LEAVE TYPE</th>
                <th className="px-3 py-2 text-left">Allocated</th>
                <th className="px-3 py-2 text-left">Valid To</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-4">No Records Found</td></tr>
              ) : (
                filteredRows.map((r, i) => (
                  <tr key={r.name || i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2">{r.employee_name}</td>
                    <td className="px-3 py-2">{r.employee}</td>
                    <td className="px-3 py-2">{org}</td> {/* Static for now, or fetch from employee linked */}
                    <td className="px-3 py-2">{r.from_date}</td>
                    <td className="px-3 py-2">{r.leave_type}</td>
                    <td className="px-3 py-2">{r.total_leaves_allocated}</td>
                    <td className="px-3 py-2">{r.to_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">Showing {filteredRows.length} entries</div>
      </div>
    </div>
  );
}