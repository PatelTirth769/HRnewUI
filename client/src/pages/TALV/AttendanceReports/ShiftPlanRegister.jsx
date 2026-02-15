import React, { useState } from 'react';

export default function ShiftPlanRegister() {
  const [company, setCompany] = useState('BOMBAIM');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [mode, setMode] = useState('time');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} SHIFT PLAN REGISTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Company</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)}>{['ALL','IT','HR'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working For</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Work Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
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
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={mode==='time'} onChange={()=>setMode('time')} /> Shift Time</label>
              <label className="flex items-center gap-2"><input type="radio" checked={mode==='name'} onChange={()=>setMode('name')} /> Shift Name</label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">View</button>
        </div>
      </div>
    </div>
  );
}