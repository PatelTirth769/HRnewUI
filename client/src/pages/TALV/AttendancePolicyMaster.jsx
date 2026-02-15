import React, { useState } from 'react';

export default function AttendancePolicyMaster() {
  const [policyName, setPolicyName] = useState('ALL');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  const data = [
    { id: 1, name: 'Attd_Policy', lc: '0.00', eg: '0.00', interval: '0.00', leaveDeduct: '0.00', paidDeduct: '0.00', hwo: '0.00', absent: '1.00', halfDay: '2 - 2', present: '3.00', otApplicability: '0.00', effective: 'Apr-2021' },
    { id: 2, name: 'AttPol_Frontend', lc: '10.00', eg: '0.00', interval: '1.00', leaveDeduct: '0.00', paidDeduct: '0.50', hwo: '0.00', absent: '1.00', halfDay: '2 - 2', present: '3.00', otApplicability: '0.00', effective: 'Jul-2025' },
    { id: 3, name: 'AttPol_Backend', lc: '30.00', eg: '0.00', interval: '1.00', leaveDeduct: '0.00', paidDeduct: '0.50', hwo: '0.00', absent: '1.00', halfDay: '2 - 2', present: '3.00', otApplicability: '0.00', effective: 'Jul-2025' },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} ORG SET UP {'>'} ATTENDANCE POLICY MASTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-4 gap-3 items-end mb-3">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">New ➕</button>
          <div>
            <div className="text-sm">Policy Name</div>
            <select className="border rounded px-2 py-2 w-full text-sm" value={policyName} onChange={(e)=>setPolicyName(e.target.value)}>{['ALL'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div>
            <div className="text-sm">Effective From</div>
            <input type="date" className="border rounded px-2 py-2 w-full text-sm" value={effectiveFrom} onChange={(e)=>setEffectiveFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
            <button className="px-3 py-2 bg-orange-600 text-white rounded">ℹ️</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">POLICY ID</th>
                <th className="px-3 py-2 text-left">POLICY NAME</th>
                <th className="px-3 py-2 text-left">LATE COME GRACE PERIOD (MINUTE)</th>
                <th className="px-3 py-2 text-left">EARLY GO GRACE PERIOD (MINUTE)</th>
                <th className="px-3 py-2 text-left">LC/EG COUNT INTERVAL (NUMBER)</th>
                <th className="px-3 py-2 text-left">LEAVE BALANCE DEDUCTION (DAYS)</th>
                <th className="px-3 py-2 text-left">PAID DAYS DEDUCTION (DAYS)</th>
                <th className="px-3 py-2 text-left">HALF WO PERIOD (MINUTE)</th>
                <th className="px-3 py-2 text-left">ABSENT/LWP PERIOD {'<'} (MINUTE)</th>
                <th className="px-3 py-2 text-left">HALF DAY PERIOD (MINUTE)</th>
                <th className="px-3 py-2 text-left">PRESENT PERIOD {'>'} (MINUTE)</th>
                <th className="px-3 py-2 text-left">OT APPLICABILITY (SHIFT HRS + GRACE) (MINUTE)</th>
                <th className="px-3 py-2 text-left">EFFECTIVE FROM</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.lc}</td>
                  <td className="px-3 py-2">{row.eg}</td>
                  <td className="px-3 py-2">{row.interval}</td>
                  <td className="px-3 py-2">{row.leaveDeduct}</td>
                  <td className="px-3 py-2">{row.paidDeduct}</td>
                  <td className="px-3 py-2">{row.hwo}</td>
                  <td className="px-3 py-2">{row.absent}</td>
                  <td className="px-3 py-2">{row.halfDay}</td>
                  <td className="px-3 py-2">{row.present}</td>
                  <td className="px-3 py-2">{row.otApplicability}</td>
                  <td className="px-3 py-2">{row.effective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">1 to 3 of 3 entries</div>
      </div>
    </div>
  );
}