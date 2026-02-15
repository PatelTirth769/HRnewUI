import React, { useRef, useState } from 'react';

export default function ImportInOutTime() {
  const [company, setCompany] = useState('BOMBAIM');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0,10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0,10));
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const downloadTemplate = () => alert('Template downloaded');

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TRANSACTIONS {'>'} IMPORT IN/OUT TIME</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <div className="text-sm">Company *</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>
              {['BOMBAIM','DELHI','KOLKATA'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm">From Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">To Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm">Template</div>
            <button className="text-orange-600 text-sm underline" onClick={downloadTemplate}>Download Template</button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm">Upload</div>
          <div className="flex gap-2">
            <input type="file" className="border rounded px-2 py-2 text-sm flex-1" onChange={(e)=>setFile(e.target.files?.[0]||null)} ref={inputRef} />
            <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
          </div>
          <div className="text-xs text-gray-600 mt-2">Please upload file in csv format.</div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Save</button>
          <button className="px-3 py-2 border rounded">Cancel</button>
        </div>

        <div className="mt-4 text-sm text-blue-700">Last Data Uploaded from 13-Oct-2025 to 21-Oct-2025</div>

        <div className="mt-4 text-xs text-blue-700 space-y-1">
          <div>Note:</div>
          <ul className="list-disc pl-6">
            <li>IN & OUT Time: put first IN & Last OUT.</li>
            <li>System marks final attendance based on total working hrs rule.</li>
            <li>Put 00:00 in IN & OUT in case of absent.</li>
            <li>Final attendance marked based on Leave/OD/EW or WO/PH status.</li>
            <li>Attendance will not get updated if Employee salary for selected period is published.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}