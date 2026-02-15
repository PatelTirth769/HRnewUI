import React, { useState } from 'react';

export default function MobileAppLinking() {
  const [status, setStatus] = useState('Current');
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');

  const rows = [
    { sr:1, ecode:1, name:'Saba Khatoon', mac:'android_701291d59e4c337c', mobileReg:'True', appType:'1', geo:'Lat-Long', location:'Kolkata Good earth', doj:'01-Feb-25', insertedBy:'admin', insertedOn:'05-Nov-25 10:07', updatedBy:'', updatedOn:'' },
    { sr:2, ecode:8, name:'Ekta Shah', mac:'ios_DSCF8A16-8A9-0416F-9582-A0424341F355', mobileReg:'True', appType:'1', geo:'NA', location:'Kolkata_Backend', doj:'03-Jun-14', insertedBy:'admin', insertedOn:'28-Aug-25 09:45', updatedBy:'', updatedOn:'' },
    { sr:3, ecode:13, name:'Vedika Murarka', mac:'android_ad427290f61a790c', mobileReg:'True', appType:'1', geo:'NA', location:'Kolkata_Backend', doj:'02-Apr-18', insertedBy:'admin', insertedOn:'25-Jul-25 17:04', updatedBy:'admin', updatedOn:'17-Sep-25 12:43' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} MOBILE APP LINKING</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="flex items-center gap-2 mb-3">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">New</button>
          <button className="px-3 py-2 border rounded">Bulk Upload</button>
          <button className="px-3 py-2 border rounded">Branch Mapping - Bulk Update</button>
        </div>

        <div className="grid grid-cols-4 gap-3 items-end mb-3">
          <div>
            <div className="text-sm">Employee Status :</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>{['Current','Inactive'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Search On :</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['All','Emp Name','Ecode'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Search Text :</div>
            <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
          </div>
        </div>

        <div className="text-xs text-gray-700 space-y-1 mb-2">
          <div>Note: 1) Mobile Register 'True' means mobile number is mapped to employee.</div>
          <div>2) If MAC Address exist for employee then it means employee has done punching through mobile app.</div>
          <div>3) App Type (1): No login + no photo, App Type (2): Login + no photo, App Type (3): No login + with Photo, App Type (4): Login + With Photo</div>
        </div>
        <div className="text-sm mb-2">Total Registered Employee : 14   Max employee Registration Limit : 0   Employees with active geofence without branch mapping : 0   Employee Count : 13</div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">SR.</th>
                <th className="px-3 py-2 text-left">EMP CODE</th>
                <th className="px-3 py-2 text-left">EMP NAME</th>
                <th className="px-3 py-2 text-left">MAC ADDRESS</th>
                <th className="px-3 py-2 text-left">MOBILE REG</th>
                <th className="px-3 py-2 text-left">APP TYPE</th>
                <th className="px-3 py-2 text-left">GEO CRITERIA</th>
                <th className="px-3 py-2 text-left">WORK LOCATION</th>
                <th className="px-3 py-2 text-left">DOJ</th>
                <th className="px-3 py-2 text-left">INSERTED BY</th>
                <th className="px-3 py-2 text-left">INSERTED ON</th>
                <th className="px-3 py-2 text-left">UPDATED BY</th>
                <th className="px-3 py-2 text-left">UPDATED ON</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r)=> (
                <tr key={r.sr} className="border-b">
                  <td className="px-3 py-2">{r.sr}</td>
                  <td className="px-3 py-2">{r.ecode}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.mac}</td>
                  <td className="px-3 py-2">{r.mobileReg}</td>
                  <td className="px-3 py-2">{r.appType}</td>
                  <td className="px-3 py-2">{r.geo}</td>
                  <td className="px-3 py-2">{r.location}</td>
                  <td className="px-3 py-2">{r.doj}</td>
                  <td className="px-3 py-2">{r.insertedBy}</td>
                  <td className="px-3 py-2">{r.insertedOn}</td>
                  <td className="px-3 py-2">{r.updatedBy}</td>
                  <td className="px-3 py-2">{r.updatedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}