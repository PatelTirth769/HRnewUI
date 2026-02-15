import React, { useState } from 'react';

export default function UploadOpeningLeaveBalance() {
  const [uploadType, setUploadType] = useState('opening');
  const [company, setCompany] = useState('BOMBAIM');
  const files = [
    { name: 'LeaveBalance_140ct25115153.xls', log: '24-Oct-2025 18:01:57', by: 'admin' },
    { name: 'UploadLeaveBalanceTemplate.xls', log: '14-Oct-2025 11:45:58', by: 'admin' },
    { name: 'LeaveBalance_03Oct25121319.xls', log: '03-Oct-2025 12:14:19', by: 'admin' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} BULK UPLOAD {'>'} UPLOAD LEAVE BALANCE</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm">Upload</div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={uploadType==='adjust'} onChange={()=>setUploadType('adjust')} /> Leave Adjustments</label>
              <label className="flex items-center gap-2"><input type="radio" checked={uploadType==='opening'} onChange={()=>setUploadType('opening')} /> Opening Leave Balance</label>
              <label className="flex items-center gap-2"><input type="radio" checked={uploadType==='encash'} onChange={()=>setUploadType('encash')} /> Leave Encashment</label>
            </div>
            <div className="mt-3">
              <div className="text-sm">Upload</div>
              <div className="flex gap-2">
                <input type="file" className="border rounded px-2 py-2 text-sm flex-1" />
                <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm">Sample Template</div>
            <button className="text-orange-600 text-sm underline">Template for Upload Opening Leave Balance</button>
          </div>
          <div>
            <div className="text-sm">Company *</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Upload</button>
          <button className="px-3 py-2 border rounded">Cancel</button>
        </div>

        <div className="mt-4 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ul className="list-decimal pl-6">
            <li>In upload template Opening Bal Date enter date in one of these formats 'dd-mmm-yyyy', 'dd mmm yyyy', 'dd-mmmm-yyy', 'd mmmm yyyy', 'dd-mm-yy'.</li>
            <li>Comp-Off leave cannot be Uploaded/Adjusted, as Comp-Off is directly linked to Extra Working.</li>
          </ul>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">UPLOADED FILE</th>
                <th className="px-3 py-2 text-left">LOG</th>
                <th className="px-3 py-2 text-left">UPLOADED ON</th>
                <th className="px-3 py-2 text-left">UPLOADED BY</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2 text-gray-800">{f.name}</td>
                  <td className="px-3 py-2 text-gray-800">Log</td>
                  <td className="px-3 py-2">{f.log}</td>
                  <td className="px-3 py-2">{f.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-gray-600 mt-2">1 to 23 of 23 entries</div>
        </div>
      </div>
    </div>
  );
}