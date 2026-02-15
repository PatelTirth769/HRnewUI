import React, { useState } from 'react';

export default function AttendanceRegister() {
  const [org, setOrg] = useState('ALL');
  const [dept, setDept] = useState('ALL');
  const [state, setState] = useState('ALL');
  const [workingOrg, setWorkingOrg] = useState('BOMBAIM');
  const [location, setLocation] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [entity, setEntity] = useState('ALL');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [otOnly, setOtOnly] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [latePolicy, setLatePolicy] = useState('By Policy');
  const [sortBy, setSortBy] = useState('Ecode');
  const [sortOrder, setSortOrder] = useState('Asc');
  const [layout, setLayout] = useState('horizontal');
  const [format, setFormat] = useState('xlsx');
  const [content, setContent] = useState({
    status: true,
    planned: false,
    policy: true,
    inout: false,
    hours: false,
    lateEarly: false,
    shift: false,
    deviation: false,
    workingFor: false,
    doj: false,
    doc: false,
    dol: false,
  });

  const toggle = k => setContent(prev => ({...prev, [k]: !prev[k]}));

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDANCE REPORTS {'>'} ATTENDANCE REGISTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Organisation</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e)=>setOrg(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">State</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={state} onChange={(e)=>setState(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">From Date</div>
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Employee Name</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)}>{['ALL','John','Jane'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={otOnly} onChange={()=>setOtOnly(!otOnly)} /> Employee with OT applicable only</label>
            </div>
            <div>
              <div className="text-sm">Late/Early/EW</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={latePolicy} onChange={(e)=>setLatePolicy(e.target.value)}>{['By Policy','Manual'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Upload Emp List</div>
              <input type="file" className="border rounded px-2 py-2 w-full text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={dept} onChange={(e)=>setDept(e.target.value)}>{['ALL','IT','HR','Finance'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Reporting To</div>
              <select className="border rounded px-2 py-2 w-full text-sm">{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">To Date</div>
              <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">ECode</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Sort By</div>
              <div className="grid grid-cols-2 gap-3">
                <select className="border rounded px-2 py-2 w-full text-sm" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>{['Ecode','Employee Name','Date'].map(v=> <option key={v}>{v}</option>)}</select>
                <div className="flex items-center gap-6 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" checked={sortOrder==='Asc'} onChange={()=>setSortOrder('Asc')} /> Asc.</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={sortOrder==='Desc'} onChange={()=>setSortOrder('Desc')} /> Desc.</label>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm">Template</div>
              <div className="text-xs text-gray-500">Download</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm">Working Organisation</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingOrg} onChange={(e)=>setWorkingOrg(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Shift</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={shift} onChange={(e)=>setShift(e.target.value)}>{['ALL','Morning','Evening','Night'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e)=>setEntity(e.target.value)}>{['ALL','A','B'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Status</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>{['ALL','Present','Absent'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-6 text-sm">
            <span>Layout</span>
            <label className="flex items-center gap-2"><input type="radio" checked={layout==='horizontal'} onChange={()=>setLayout('horizontal')} /> Horizontal</label>
            <label className="flex items-center gap-2"><input type="radio" checked={layout==='vertical'} onChange={()=>setLayout('vertical')} /> Vertical</label>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span>Report Format</span>
            <label className="flex items-center gap-2"><input type="radio" checked={format==='xlsx'} onChange={()=>setFormat('xlsx')} /> XLSX</label>
            <label className="flex items-center gap-2"><input type="radio" checked={format==='csv'} onChange={()=>setFormat('csv')} /> CSV</label>
            <label className="flex items-center gap-2"><input type="radio" checked={format==='pdf'} onChange={()=>setFormat('pdf')} /> PDF</label>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm mb-2">Content</div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            {Object.keys(content).map(k => (
              <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={content[k]} onChange={()=>toggle(k)} /> {k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</label>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ul className="list-decimal pl-6">
            <li>Status due to Policy/Punch is worked out using biometric punches.</li>
            <li>If EOD not executed, system does not mark attendance.</li>
            <li>Blank status indicates attendance pending.</li>
            <li>LWP means Planned Leave Without Pay, HDP means Planned Half Day Leave Without Pay.</li>
          </ul>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">Generate</button>
        </div>
      </div>
    </div>
  );
}