import React, { useState } from 'react';

const tabs = ['Pending To Submit','Submitted','Approved','Rejected','Request Cancelled','All'];

export default function HRViewLeavesOutdoor() {
  const [fromDate, setFromDate] = useState(new Date(Date.now()-30*24*3600*1000).toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [leaveType, setLeaveType] = useState('All');
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [reportDate, setReportDate] = useState('Application Date');
  const [format, setFormat] = useState('XLSX');
  const [tab, setTab] = useState('Submitted');

  const rows = [
    { sr:1, appDt:'03-Nov-25', ecode:8, name:'Radhika Agarwal', type:'PL', from:'24-Nov-25', to:'28-Nov-25', days:'5.0', dept:'Marketing', desg:'Marketing', loc:'Kolkata', reporting:'Jenny S.', status:'Submitted', approver:'Jenny S.', pm:'-', balance:'13.00' },
    { sr:2, appDt:'17-Nov-25', ecode:43, name:'Sarwar Hussain', type:'PL', from:'16-Jan-26', to:'23-Jan-26', days:'7.0', dept:'Stock', desg:'Stock B', loc:'Kolkata', reporting:'Rajesh', status:'Submitted', approver:'Rajesh', pm:'-', balance:'6.00' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} HR VIEW LEAVES & OUTDOOR</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">From Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">To Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">Leave Type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={leaveType} onChange={(e)=>setLeaveType(e.target.value)}>{['All','PL','MTL','WFH'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Search On</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['All','Employee Name','Ecode'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Search Text</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 items-center mb-3">
          <div className="col-span-3 flex items-center gap-4">
            <div className="text-sm">Report Date</div>
            {['Leave Date','Application Date','Approved Date'].map(d => (
              <label key={d} className="text-sm flex items-center gap-2"><input type="radio" checked={reportDate===d} onChange={()=>setReportDate(d)} /> {d}</label>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">Report Format:</div>
            {['XLSX','CSV'].map(f => (
              <label key={f} className="text-sm flex items-center gap-2"><input type="radio" checked={format===f} onChange={()=>setFormat(f)} /> {f}</label>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
            <div className="flex items-center gap-2 ml-4 text-sm">
              <span>Page</span>
              <button className="px-2 py-2 border rounded">←</button>
              <input className="border rounded px-2 py-2 w-16" defaultValue={1} />
              <span>out of 1</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {tabs.map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded ${tab===t? 'bg-orange-200 border text-gray-800':'border'}`}>{t}</button>
          ))}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm">Records Count: 9</span>
            <button className="px-3 py-2 bg-orange-500 text-white rounded">Bulk Approve</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">SR.</th>
                <th className="px-3 py-2 text-left">APP.DT.</th>
                <th className="px-3 py-2 text-left">ECODE</th>
                <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                <th className="px-3 py-2 text-left">LEAVE TYPE</th>
                <th className="px-3 py-2 text-left">FROM</th>
                <th className="px-3 py-2 text-left">TO</th>
                <th className="px-3 py-2 text-left">DAYS</th>
                <th className="px-3 py-2 text-left">DEPT</th>
                <th className="px-3 py-2 text-left">DESG</th>
                <th className="px-3 py-2 text-left">WORK LOCATION</th>
                <th className="px-3 py-2 text-left">REPORTING TO</th>
                <th className="px-3 py-2 text-left">STATUS</th>
                <th className="px-3 py-2 text-left">APPROVER</th>
                <th className="px-3 py-2 text-left">PARALLEL MANAGER</th>
                <th className="px-3 py-2 text-left">LEAVE BALANCE</th>
                <th className="px-3 py-2 text-left">S/E</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.sr} className="border-b">
                  <td className="px-3 py-2">{r.sr}</td>
                  <td className="px-3 py-2">{r.appDt}</td>
                  <td className="px-3 py-2">{r.ecode}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">{r.from}</td>
                  <td className="px-3 py-2">{r.to}</td>
                  <td className="px-3 py-2">{r.days}</td>
                  <td className="px-3 py-2">{r.dept}</td>
                  <td className="px-3 py-2">{r.desg}</td>
                  <td className="px-3 py-2">{r.loc}</td>
                  <td className="px-3 py-2">{r.reporting}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.approver}</td>
                  <td className="px-3 py-2">{r.pm}</td>
                  <td className="px-3 py-2">{r.balance}</td>
                  <td className="px-3 py-2"><input type="checkbox" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}