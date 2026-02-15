import React, { useRef, useState } from 'react';

export default function BiometricUpload() {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const templateCopy = () => {
    const sample = 'EmpCode,Date,In,Out';
    navigator.clipboard.writeText(sample).catch(()=>{});
    alert('Sample File headers copied');
  };

  const uploads = [
    { file: 'TA_17Nov25_18Nov2025060000.txt', log: 'Log', on: '18-Nov-2025 06:00:00', by: 'BioAuto', type: 'BioAuto', contains: '17-Nov-2025' }
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TRANSACTIONS {'>'} BIOMETRIC UPLOAD</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <div className="text-sm text-gray-700">Template</div>
            <button className="text-blue-600 text-sm underline" onClick={templateCopy}>Sample File</button>
            <div className="mt-2 text-xs text-blue-700">Last Attendance Uploaded for {new Date(date).toLocaleDateString('en-GB')}</div>
          </div>
          <div>
            <div className="text-sm text-gray-700">Attendance Date</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={date} onChange={(e)=>setDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-700">Upload</div>
            <div className="flex gap-2">
              <input type="file" className="border rounded px-2 py-2 text-sm flex-1" onChange={(e)=>setFile(e.target.files?.[0]||null)} ref={inputRef} />
              <button className="px-3 py-2 bg-orange-500 text-white rounded">⬆️</button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">Save</button>
          <button className="px-3 py-2 border rounded">Cancel</button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">UPLOADED FILE</th>
                <th className="px-3 py-2 text-left">LOG</th>
                <th className="px-3 py-2 text-left">UPLOADED ON</th>
                <th className="px-3 py-2 text-left">UPLOADED BY</th>
                <th className="px-3 py-2 text-left">TYPE</th>
                <th className="px-3 py-2 text-left">CONTAINS LATE PUNCHES FOR</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2 text-blue-700 underline cursor-pointer">{u.file}</td>
                  <td className="px-3 py-2 text-blue-700 underline cursor-pointer">{u.log}</td>
                  <td className="px-3 py-2">{u.on}</td>
                  <td className="px-3 py-2">{u.by}</td>
                  <td className="px-3 py-2">{u.type}</td>
                  <td className="px-3 py-2">{u.contains}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">1 to 1 of entries</div>
      </div>
    </div>
  );
}