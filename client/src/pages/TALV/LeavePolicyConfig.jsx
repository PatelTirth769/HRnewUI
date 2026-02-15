import React, { useState } from 'react';

export default function LeavePolicyConfig() {
  const [company, setCompany] = useState('ALL');
  const [leaveType, setLeaveType] = useState('ALL');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  const rows = [
    { sr: 1, company: 'BOMBAIM', type: 'Privilege Leave', policy: 'PL', effective: 'Oct-2025' },
    { sr: 2, company: 'BOMBAIM', type: 'Maternity Leave', policy: 'MTL', effective: 'Jul-2025' },
    { sr: 3, company: 'BOMBAIM', type: 'Festive Leave', policy: 'FL', effective: 'Oct-2025' },
    { sr: 4, company: 'BOMBAIM', type: 'Compensatory Off', policy: 'COMOFF', effective: 'Oct-2025' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} MASTER {'>'} LEAVE POLICY CONFIG</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-5 gap-3 items-end mb-3">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">New ➕</button>
          <div>
            <div className="text-sm">Company Name</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['ALL','BOMBAIM'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Leave type</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={leaveType} onChange={(e)=>setLeaveType(e.target.value)}>{['ALL','Privilege Leave','Maternity Leave','Festive Leave','Compensatory Off'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Effective From</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={effectiveFrom} onChange={(e)=>setEffectiveFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          </div>
        </div>

        <div className="text-xs text-blue-700 mb-2">Note: Policy displayed in pink color indicates that policy not mapped to any Grade and Location.</div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">SR.NO</th>
                <th className="px-3 py-2 text-left">COMPANYNAME</th>
                <th className="px-3 py-2 text-left">LEAVETYPE</th>
                <th className="px-3 py-2 text-left">POLICY</th>
                <th className="px-3 py-2 text-left">EFFECTIVEFROM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.sr} className="border-b">
                  <td className="px-3 py-2">{r.sr}</td>
                  <td className="px-3 py-2">{r.company}</td>
                  <td className="px-3 py-2">{r.type}</td>
                  <td className="px-3 py-2">{r.policy}</td>
                  <td className="px-3 py-2">{r.effective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}