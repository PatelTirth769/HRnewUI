import React, { useState } from 'react';

export default function ShiftPunchRegister() {
  const [company, setCompany] = useState('ALL');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [department, setDepartment] = useState('');
  const [shift, setShift] = useState('ALL');
  const [entity, setEntity] = useState('--ALL--');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [punches, setPunches] = useState('punched');
  const [layout, setLayout] = useState('vertical');
  const [format, setFormat] = useState('xlsx');
  const [mode, setMode] = useState('all');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDANCE REPORTS {'>'} SHIFT PUNCH REGISTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Company</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>
                {['ALL','BOMBAIM','DELHI'].map(v=> (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Department</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Shift</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={shift} onChange={(e)=>setShift(e.target.value)}>
                {['ALL','Morning','Evening','Night'].map(v=> (<option key={v}>{v}</option>))}
              </select>
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
              <div className="text-sm">Employee Name</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)}>
                {['ALL','John','Jane'].map(v=> (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Punches</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={punches==='punched'} onChange={()=>setPunches('punched')} /> Punched</label>
                <label className="flex items-center gap-2"><input type="radio" checked={punches==='all'} onChange={()=>setPunches('all')} /> All</label>
                <label className="flex items-center gap-2"><input type="radio" checked={punches==='not'} onChange={()=>setPunches('not')} /> Not Punched</label>
              </div>
            </div>
            <div>
              <div className="text-sm">Layout</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={layout==='horizontal'} onChange={()=>setLayout('horizontal')} /> Horizontal</label>
                <label className="flex items-center gap-2"><input type="radio" checked={layout==='vertical'} onChange={()=>setLayout('vertical')} /> Vertical</label>
              </div>
            </div>
            <div>
              <div className="text-sm">Report Format</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={format==='xlsx'} onChange={()=>setFormat('xlsx')} /> XLSX</label>
                <label className="flex items-center gap-2"><input type="radio" checked={format==='csv'} onChange={()=>setFormat('csv')} /> CSV</label>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Working For</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>
                {['ALL','Self','Client'].map(v=> (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>
                {['ALL','HQ','Branch'].map(v=> (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e)=>setEntity(e.target.value)}>
                {['--ALL--','Entity A','Entity B'].map(v=> (<option key={v}>{v}</option>))}
              </select>
            </div>
            <div>
              <div className="text-sm">Time Period</div>
              <div className="flex items-center gap-2">
                <input placeholder="__:__" className="border rounded px-2 py-2 text-sm w-24" value={timeStart} onChange={(e)=>setTimeStart(e.target.value)} />
                <span>-</span>
                <input placeholder="__:__" className="border rounded px-2 py-2 text-sm w-24" value={timeEnd} onChange={(e)=>setTimeEnd(e.target.value)} />
                <span className="text-xs text-gray-500">(hh:mm 24 hr format)</span>
              </div>
            </div>
            <div>
              <div className="text-sm">ECode</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Punches Mode</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='all'} onChange={()=>setMode('all')} /> All</label>
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='firstlast'} onChange={()=>setMode('firstlast')} /> Only First & Last</label>
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='terminal'} onChange={()=>setMode('terminal')} /> Terminal</label>
                <label className="flex items-center gap-2"><input type="radio" checked={mode==='mobile'} onChange={()=>setMode('mobile')} /> Mobile</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ul className="list-decimal pl-6">
            <li>Time Period filter ignored if date range more than one day.</li>
            <li>Post ESS cut-off, punches transferred via bulk sync stored but not considered for EOD.</li>
          </ul>
        </div>

        <div className="mt-4">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">Generate</button>
        </div>
      </div>
    </div>
  );
}