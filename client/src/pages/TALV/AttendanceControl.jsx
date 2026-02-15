import React, { useState } from 'react';

export default function AttendanceControl() {
  const [org, setOrg] = useState('BOMBAIM');
  const [workingOrg, setWorkingOrg] = useState('ALL');
  const [employee, setEmployee] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [shift, setShift] = useState('ALL');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [leType, setLeType] = useState('Select');
  const [leOp, setLeOp] = useState('>');
  const [leMin, setLeMin] = useState('');
  const [entity, setEntity] = useState('ALL');
  const [entityData, setEntityData] = useState('');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} ATTENDANCE CONTROL</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Organization</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e)=>setOrg(e.target.value)}>{['BOMBAIM'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Select Date</div>
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={date} onChange={(e)=>setDate(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e)=>setEntity(e.target.value)}>{['ALL','Department','Location','Employee'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working Organization</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingOrg} onChange={(e)=>setWorkingOrg(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Late/Early/EW</div>
              <div className="flex items-center gap-2">
                <select className="border rounded px-2 py-2 text-sm" value={leType} onChange={(e)=>setLeType(e.target.value)}>{['Select','Late','Early','EW'].map(v=> <option key={v}>{v}</option>)}</select>
                <select className="border rounded px-2 py-2 text-sm" value={leOp} onChange={(e)=>setLeOp(e.target.value)}>{['>','>=','<','<='].map(v=> <option key={v}>{v}</option>)}</select>
                <input className="border rounded px-2 py-2 w-24 text-sm" value={leMin} onChange={(e)=>setLeMin(e.target.value)} placeholder="Min" />
              </div>
            </div>
            <div>
              <div className="text-sm">Entity Data</div>
              <textarea className="border rounded px-2 py-2 w-full text-sm h-9" value={entityData} onChange={(e)=>setEntityData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Employee</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Status</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>{['ALL','Present','Absent'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Ecode</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Shift</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={shift} onChange={(e)=>setShift(e.target.value)}>{['ALL','Day','Night'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Export Attendance</button>
          <button className="px-3 py-2 border rounded">View Policy</button>
          <button className="px-3 py-2 border rounded">Attendance Amendments</button>
          <button className="px-3 py-2 border rounded">Post Facto Shift Correction</button>
          <button className="px-3 py-2 border rounded">Logs</button>
          <div className="flex-1" />
          <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
          <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          <div className="flex items-center gap-2 ml-4 text-sm">
            <span>Page</span>
            <button className="px-2 py-2 border rounded">←</button>
            <input className="border rounded px-2 py-2 w-16" defaultValue={1} />
            <button className="px-2 py-2 border rounded">→</button>
            <button className="px-2 py-2 border rounded">ℹ️</button>
          </div>
        </div>
      </div>
    </div>
  );
}