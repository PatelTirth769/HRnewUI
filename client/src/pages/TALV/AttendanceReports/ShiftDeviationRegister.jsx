import React, { useState } from 'react';

export default function ShiftDeviationRegister() {
  const [company, setCompany] = useState('BOMBAIM');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [format, setFormat] = useState('hrs');
  const [otOnly, setOtOnly] = useState(false);
  const [criteria, setCriteria] = useState('>');
  const [minutes, setMinutes] = useState('');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE REPORTS {'>'} SHIFT DEVIATION REGISTER</nav>
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
            <div>
              <div className="text-sm">Employee</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)}>{['ALL','John','Jane'].map(v=> <option key={v}>{v}</option>)}</select>
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
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">ECode</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Time Duration Format</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={format==='hrs'} onChange={()=>setFormat('hrs')} /> In Hrs</label>
                <label className="flex items-center gap-2"><input type="radio" checked={format==='min'} onChange={()=>setFormat('min')} /> In Min</label>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={otOnly} onChange={()=>setOtOnly(!otOnly)} /> Employee with OT applicable only</label>
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked readOnly /> OT</div>
              <div>
                <div className="text-sm">OT Criteria</div>
                <select className="border rounded px-2 py-2 w-full text-sm" value={criteria} onChange={(e)=>setCriteria(e.target.value)}>{['>','>=','<','<='].map(v=> <option key={v}>{v}</option>)}</select>
              </div>
              <div>
                <div className="text-sm">minutes</div>
                <input className="border rounded px-2 py-2 w-full text-sm" value={minutes} onChange={(e)=>setMinutes(e.target.value)} />
              </div>
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