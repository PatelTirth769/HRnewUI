import React, { useRef, useState } from 'react';

export default function ImportAttendance() {
  const [company, setCompany] = useState('BOMBAIM');
  const [department, setDepartment] = useState('ALL');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [type, setType] = useState('direct');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [withDummy, setWithDummy] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const generateTemplate = () => alert('Template generated');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} CAPTURE ATTENDANCE {'>'} IMPORT ATTENDANCE</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm">Company</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>
              {['BOMBAIM','DELHI','KOLKATA'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm">Department</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)}>
              {['ALL','IT','HR','Finance'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm">Working For</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>
              {['ALL','Self','Client'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm">Location</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>
              {['ALL','HQ','Branch'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="text-sm mb-2">Attendance Type :</div>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={type==='direct'} onChange={()=>setType('direct')} /> Direct Attendance</label>
              <label className="flex items-center gap-2"><input type="radio" checked={type==='datewise'} onChange={()=>setType('datewise')} /> Datewise Attendance</label>
              <label className="flex items-center gap-2"><input type="radio" checked={type==='wo'} onChange={()=>setType('wo')} /> Upload WO</label>
              <label className="flex items-center gap-2"><input type="radio" checked={type==='cof'} onChange={()=>setType('cof')} /> Upload COF</label>
            </div>
          </div>
          <div>
            <div className="text-sm">From Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">To Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 items-end">
          <div>
            <div className="text-sm">Template :</div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={!withDummy} onChange={()=>setWithDummy(false)} /> Without Status</label>
              <label className="flex items-center gap-2"><input type="radio" checked={withDummy} onChange={()=>setWithDummy(true)} /> With Dummy Status</label>
              <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded" onClick={generateTemplate}>Generate Template</button>
            </div>
          </div>
          <div>
            <div className="text-sm">Upload Template</div>
            <div className="flex gap-2">
              <input type="file" className="border rounded px-2 py-2 text-sm flex-1" onChange={(e)=>setFile(e.target.files?.[0]||null)} ref={inputRef} />
              <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
            </div>
            <div className="text-xs text-gray-600 mt-2">Please upload file in csv format.</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Save</button>
          <button className="px-3 py-2 border rounded">Cancel</button>
        </div>

        <div className="mt-6 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ul className="list-disc pl-6">
            <li>Direct Attendance: bulk update final attendance status.</li>
            <li>Attendance will not get updated if Employee salary for selected period is published.</li>
            <li>Above filter will be used only for generating the template.</li>
            <li>List of valid attendance status and its description.</li>
          </ul>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2 text-left">DESCRIPTION</th>
                <th className="px-3 py-2 text-left">STATUS</th>
                <th className="px-3 py-2 text-left">DESCRIPTION</th>
                <th className="px-3 py-2 text-left">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Present','PR','Casual Leave','CL'],
                ['Outdoor Duty','OD','HPL','HPL-HOD'],
                ['Without Status','WOD','HSL','HSL-HOD'],
                ['Half Day Present','HDP','COF','COF'],
              ].map((r,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{r[0]}</td>
                  <td className="px-3 py-2">{r[1]}</td>
                  <td className="px-3 py-2">{r[2]}</td>
                  <td className="px-3 py-2">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}