import React, { useState } from 'react';

export default function UploadMonthlyLeaveBalance() {
  const [company, setCompany] = useState('BOMBAIM');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`;
  });

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} UPLOAD MONTHLY LEAVE BALANCE</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm">Company *</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM','DELHI'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Month</div>
            <div className="flex items-center gap-2">
              <input className="border rounded px-2 py-2 w-full text-sm" value={month} onChange={(e)=>setMonth(e.target.value)} />
              <button className="px-3 py-2 border rounded">📅</button>
            </div>
            <div className="text-xs text-blue-700 mt-1">01-{month.split('-')[0]}-{month.split('-')[1]} To 30-{month.split('-')[0]}-{month.split('-')[1]}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <div className="text-sm font-semibold">Sample Template</div>
            <button className="text-orange-600 text-sm underline">Template to Upload Monthly Leave Balance</button>
          </div>
          <div>
            <div className="text-sm">Upload</div>
            <div className="flex items-center gap-2">
              <input type="file" className="border rounded px-2 py-2 text-sm flex-1" />
              <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button className="px-4 py-2 bg-orange-500 text-white rounded">Upload</button>
          <button className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}