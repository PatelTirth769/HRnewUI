import React, { useState } from 'react';

export default function ShiftPlanningUpload() {
  const [company, setCompany] = useState('BOMBAIM');
  const [department, setDepartment] = useState('ALL');
  const [employee, setEmployee] = useState('ALL');
  const [ecode, setEcode] = useState('');
  const [entity, setEntity] = useState('ALL');
  const [entityData, setEntityData] = useState('');
  const [workingFor, setWorkingFor] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date(Date.now()+30*24*3600*1000).toISOString().slice(0,10));
  const files = [
    { name:'UploadShiftPlanning (3).csv', log:'01-Nov-2025', from:'01-Nov-2025', to:'30-Nov-2025', insertedOn:'28-Oct-2025 17:57:42', by:'admin' },
    { name:'KOLK.csv', log:'01-Nov-2025', from:'30-Nov-2025', to:'30-Nov-2025', insertedOn:'28-Oct-2025 17:56:04', by:'admin' },
    { name:'GE NOV.csv', log:'01-Nov-2025', from:'30-Nov-2025', to:'30-Nov-2025', insertedOn:'28-Oct-2025 17:41:44', by:'admin' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} SHIFT PLANNING UPLOAD</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm">Company *</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Employee</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={employee} onChange={(e)=>setEmployee(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Entity</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={entity} onChange={(e)=>setEntity(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Entity Data</div>
              <input className="border rounded px-2 py-2 w-full text-sm" value={entityData} onChange={(e)=>setEntityData(e.target.value)} />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm">Department</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={department} onChange={(e)=>setDepartment(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Working For</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>{['ALL','Self','Client'].map(v=> <option key={v}>{v}</option>)}</select>
            </div>
            <div>
              <div className="text-sm">Location</div>
              <select className="border rounded px-2 py-2 w-full text-sm" value={location} onChange={(e)=>setLocation(e.target.value)}>{['ALL','HQ','Branch'].map(v=> <option key={v}>{v}</option>)}</select>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm">Ecode</div>
                <input className="border rounded px-2 py-2 w-full text-sm" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border rounded p-4">
          <div className="text-lg font-semibold text-gray-800 mb-2">Upload Shift Planning</div>
          <div className="flex items-center gap-2 mb-3">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">Generate Template For Upload</button>
            <button className="px-3 py-2 border rounded">Without shift Generate Template Upload</button>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" className="border rounded px-2 py-2 text-sm" />
            <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
            <button className="text-orange-600">Shift Master View</button>
          </div>
        </div>

        <div className="mt-4 border rounded p-4">
          <div className="text-lg font-semibold text-gray-800 mb-2">Export Shift Plan</div>
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2"><input type="checkbox" /> <span>Department</span></div>
            <div className="flex items-center gap-2"><input type="checkbox" /> <span>Working Location</span></div>
            <button className="px-3 py-2 bg-orange-600 text-white rounded">Export Existing Shift Plan 🧾</button>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">Upload</button>
            <button className="px-3 py-2 border rounded">Cancel</button>
          </div>
        </div>

        <div className="mt-4 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ol className="list-decimal pl-6">
            <li>Shift plan allows valid entry of leave types. If such entry concern leave will be marked only if approved leave request is found in the system.</li>
            <li>If shifts not define in the shift planning for current date then the system will consider previous day's shift defined in shift plan.</li>
            <li>If user plans PH (i.e Holiday) in shift plan then if that day is not defined in Holiday master then even if Shift Plan says PH system will check previous day shift planning.</li>
          </ol>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">UPLOADED FILE</th>
                <th className="px-3 py-2 text-left">LOG</th>
                <th className="px-3 py-2 text-left">FROM DATE</th>
                <th className="px-3 py-2 text-left">TO DATE</th>
                <th className="px-3 py-2 text-left">INSERTED ON</th>
                <th className="px-3 py-2 text-left">INSERTED BY</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2 text-gray-800">{f.name}</td>
                  <td className="px-3 py-2 text-gray-800">Log</td>
                  <td className="px-3 py-2">{f.from}</td>
                  <td className="px-3 py-2">{f.to}</td>
                  <td className="px-3 py-2">{f.insertedOn}</td>
                  <td className="px-3 py-2">{f.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-600 mt-2">1 to 4 of 4 entries</div>
        </div>
      </div>
    </div>
  );
}