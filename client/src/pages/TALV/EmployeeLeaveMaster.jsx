import React, { useState } from 'react';

export default function EmployeeLeaveMaster() {
  const [org, setOrg] = useState('BOMBAIM');
  const [status, setStatus] = useState('CURRENT');
  const [type, setType] = useState('Privilege Leave');
  const [year, setYear] = useState('2025');
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');

  const rows = Array.from({length: 10}).map((_,i)=>({
    name: `Employee ${i+1}`,
    ecode: 100+i,
    org: 'BOMBAIM',
    opDate: '01-Sep-25',
    leaveType: 'PL',
    opening: (10+i%5).toFixed(2),
    balance: (8+i%5).toFixed(2),
    doj: '01-Jan-23'
  }));

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} EMPLOYEE LEAVE MASTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">New</button>
            <button className="px-3 py-2 border rounded">Bulk Upload Employee Leave Master</button>
            <button className="px-3 py-2 border rounded">Month End Process</button>
            <button className="px-3 py-2 border rounded">Year Beginning Process</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs"><span>No. of Records: 41</span></div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
              <button className="px-3 py-2 bg-red-600 text-white rounded">⬇️</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Organization Name</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={org} onChange={(e)=>setOrg(e.target.value)}>{['BOMBAIM'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Status</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>{['CURRENT','CLOSED'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={type} onChange={(e)=>setType(e.target.value)}>{['Privilege Leave','Festive Leave','Compensatory Off'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">C Year</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={year} onChange={(e)=>setYear(e.target.value)}>{['2025','2024'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Search On</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['All','Employee Name','Ecode'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-3">
          <div>
            <div className="text-sm">Search Text</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          </div>
          <div className="col-span-2"></div>
          <div className="flex items-end gap-2 justify-end">
            <div className="text-sm">Page</div>
            <input className="border rounded px-2 py-2 w-16 text-sm" defaultValue={1} />
            <div className="text-xs">out of 1</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">EMPLOYEE NAME</th>
                <th className="px-3 py-2 text-left">ECODE</th>
                <th className="px-3 py-2 text-left">WORKING ORGANIZATION</th>
                <th className="px-3 py-2 text-left">OP BAL DATE</th>
                <th className="px-3 py-2 text-left">LEAVE TYPE</th>
                <th className="px-3 py-2 text-left">OPENING BAL</th>
                <th className="px-3 py-2 text-left">BALANCE</th>
                <th className="px-3 py-2 text-left">DOJ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.ecode}</td>
                  <td className="px-3 py-2">{r.org}</td>
                  <td className="px-3 py-2">{r.opDate}</td>
                  <td className="px-3 py-2">{r.leaveType}</td>
                  <td className="px-3 py-2">{r.opening}</td>
                  <td className="px-3 py-2">{r.balance}</td>
                  <td className="px-3 py-2">{r.doj}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">1 to 25 of 41 entries</div>
      </div>
    </div>
  );
}