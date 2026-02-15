import React, { useState } from 'react';

export default function AbscondingReport() {
  const [company, setCompany] = useState('BOMBAIM');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [employee, setEmployee] = useState('');
  const [days, setDays] = useState('3');
  const [sortBy, setSortBy] = useState('ECode');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} REPORTS {'>'} ATTENDENCE REPORTS {'>'} ABSCONDING REPORT</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Company</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm">From Date</div>
                <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
              </div>
              <div>
                <div className="text-sm">To Date</div>
                <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="text-sm">No.of Days Continuous Absent {'>='}</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={days} onChange={(e)=>setDays(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working For</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Work Location</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Employee Name</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Sort By</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={sortBy==='ECode'} onChange={()=>setSortBy('ECode')} /> ECode</label>
                <label className="flex items-center gap-2"><input type="radio" checked={sortBy==='From Date'} onChange={()=>setSortBy('From Date')} /> From Date</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-blue-700">Note: This report helps HR to see employees who are continuously absent for more than x working days, as per filters and period.</div>

        <div className="mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">Generate</button>
        </div>
      </div>
    </div>
  );
}