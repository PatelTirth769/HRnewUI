import React, { useState } from 'react';

export default function OTSummary() {
  const [company, setCompany] = useState('BOMBAIM');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [otType, setOtType] = useState('approved');
  const [fromMonth, setFromMonth] = useState(new Date().toISOString().slice(0,7));
  const [toMonth, setToMonth] = useState(new Date().toISOString().slice(0,7));
  const [reportType, setReportType] = useState('summary');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">REPORTS {'>'} ATTENDENCE REPORTS {'>'} OT SUMMARY</nav>
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
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">OT Type</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={otType==='approved'} onChange={()=>setOtType('approved')} /> Approved OT</label>
                <label className="flex items-center gap-2"><input type="radio" checked={otType==='system'} onChange={()=>setOtType('system')} /> System OT</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm">From Month</div>
                <input type="month" className="border rounded px-2 py-2 w-full text-sm" value={fromMonth} onChange={(e)=>setFromMonth(e.target.value)} />
              </div>
              <div>
                <div className="text-sm">To Month</div>
                <input type="month" className="border rounded px-2 py-2 w-full text-sm" value={toMonth} onChange={(e)=>setToMonth(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="text-sm">Report Type</div>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={reportType==='summary'} onChange={()=>setReportType('summary')} /> OT Summary Report</label>
                <label className="flex items-center gap-2"><input type="radio" checked={reportType==='daily'} onChange={()=>setReportType('daily')} /> OT Daily BreakUp Report</label>
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