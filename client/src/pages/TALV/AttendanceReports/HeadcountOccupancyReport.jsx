import React, { useState } from 'react';

export default function HeadcountOccupancyReport() {
  const [company, setCompany] = useState('BOMBAIM');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().slice(0,10));
  const [asOnTime, setAsOnTime] = useState('18:12');
  const [terminal, setTerminal] = useState('ALL');
  const [reportType, setReportType] = useState('register');
  const [entity, setEntity] = useState('ALL');
  const [layout, setLayout] = useState('vertical');
  const [format, setFormat] = useState('onscreen');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDENCE REPORTS {'>'} HEADCOUNT\OCCUPANCY REPORT</nav>
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
              <div className="text-sm">Shift</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={shift} onChange={(e)=>setShift(e.target.value)}>{['ALL','Morning','Evening','Night'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working For</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">As On</div>
              <div className="flex items-center gap-2">
                <input type="date" className="border rounded px-2 py-2 text-sm" value={asOnDate} onChange={(e)=>setAsOnDate(e.target.value)} />
                <input placeholder="hh:mm" className="border rounded px-2 py-2 text-sm w-24" value={asOnTime} onChange={(e)=>setAsOnTime(e.target.value)} />
                <span className="text-xs text-gray-500">(hh:mm 24 hr format)</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Terminal</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={terminal} onChange={(e)=>setTerminal(e.target.value)}>{['ALL','Terminal A','Terminal B'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Report Type</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={reportType==='register'} onChange={()=>setReportType('register')} /> Head Count Register</label>
                <label className="flex items-center gap-2"><input type="radio" checked={reportType==='summary'} onChange={()=>setReportType('summary')} /> Head Count Summary</label>
              </div>
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e)=>setEntity(e.target.value)}>{['ALL','A','B'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Layout</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={layout==='vertical'} onChange={()=>setLayout('vertical')} /> Vertical</label>
                <label className="flex items-center gap-2"><input type="radio" checked={layout==='horizontal'} onChange={()=>setLayout('horizontal')} /> Horizontal</label>
              </div>
            </div>
            <div>
              <div className="text-sm">Report Format</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={format==='xls'} onChange={()=>setFormat('xls')} /> XLS</label>
                <label className="flex items-center gap-2"><input type="radio" checked={format==='csv'} onChange={()=>setFormat('csv')} /> CSV</label>
                <label className="flex items-center gap-2"><input type="radio" checked={format==='onscreen'} onChange={()=>setFormat('onscreen')} /> OnScreen</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">Generate</button>
        </div>
      </div>
    </div>
  );
}