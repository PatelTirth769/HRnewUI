import React, { useState } from 'react';

export default function AttendanceDashboard() {
  const [company, setCompany] = useState('BOMBAIM');
  const [department, setDepartment] = useState('ALL');
  const [grade, setGrade] = useState('ALL');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE DASHBOARD</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Attendance</h2>
          <div className="flex items-center gap-3 text-sm">
            <span>Choose Date</span>
            <input type="date" className="border rounded px-2 py-2" value={date} onChange={(e)=>setDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3 mb-3">
          <div>
            <div className="text-sm">Company</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Department</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)}>{['ALL','IT','HR','Finance'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Grade</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={grade} onChange={(e)=>setGrade(e.target.value)}>{['ALL','A','B','C'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Working For</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Working Location</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
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
                  <span className="px-2 py-1 bg-orange-50 border rounded">{new Date(date).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 border rounded p-3 text-sm">Non Compliance Cases</div>
          </div>
          <div className="col-span-3">
            <div className="border rounded">
              <div className="flex items-center justify-between px-3 py-2 text-sm border-b">
                <div>Time Punches {new Date(date).toLocaleDateString('en-GB')}</div>
                <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded">On premise</button>
              </div>
              <div className="h-56"></div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div></div>
              <div></div>
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">Reports</div>
                <div className="space-y-2 text-sm">
                  {['Punch Register','Attendance Register','Leave Balance','Leave Ledger','Roaster','OT Report','Cuckoo App Registration'].map((r)=> (
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