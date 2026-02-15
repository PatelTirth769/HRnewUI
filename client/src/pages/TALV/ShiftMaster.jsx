import React, { useState } from 'react';

export default function ShiftMaster() {
  const [company, setCompany] = useState('BOMBAIM');
  const [searchOn, setSearchOn] = useState('All');
  const [searchText, setSearchText] = useState('');

  const rows = Array.from({length: 19}).map((_,i)=>({
    sr:i+1, name:`Shift ${i===0?'Day':i}`, in:'09:30', breakOut:'18:30', breakIn:'18:00', out:'19:00', buffer:'60', hours:'09:00', cycle:'07:30 to Next day 07:29', active:'True', count: Math.floor(Math.random()*8)+1
  }));

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} MASTER {'>'} SHIFT MASTER</nav>
      <div className="bg-white rounded-md border p-4">
        <div className="grid grid-cols-5 gap-3 items-end mb-3">
          <button className="px-3 py-2 bg-orange-500 text-white rounded">New ➕</button>
          <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e)=>setCompany(e.target.value)}>{['BOMBAIM'].map(v=> <option key={v}>{v}</option>)}</select>
          <select className="border rounded px-2 py-2 w-full text-sm" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['All','Shift Name'].map(v=> <option key={v}>{v}</option>)}</select>
          <input className="border rounded px-2 py-2 w-full text-sm" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 bg-orange-500 text-white rounded">🔎</button>
            <button className="px-3 py-2 bg-green-600 text-white rounded">🧾</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-orange-100 border">
                <th className="px-3 py-2 text-left">SR.NO</th>
                <th className="px-3 py-2 text-left">SHIFT NAME</th>
                <th className="px-3 py-2 text-left">IN TIME</th>
                <th className="px-3 py-2 text-left">BREAK OUT TIME</th>
                <th className="px-3 py-2 text-left">BREAK IN TIME</th>
                <th className="px-3 py-2 text-left">OUT TIME</th>
                <th className="px-3 py-2 text-left">BUFFER</th>
                <th className="px-3 py-2 text-left">SHIFT HOURS</th>
                <th className="px-3 py-2 text-left">24 HRS CYCLE</th>
                <th className="px-3 py-2 text-left">ACTIVE</th>
                <th className="px-3 py-2 text-left">EMPLOYEE COUNT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.sr} className="border-b">
                  <td className="px-3 py-2">{r.sr}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.in}</td>
                  <td className="px-3 py-2">{r.breakOut}</td>
                  <td className="px-3 py-2">{r.breakIn}</td>
                  <td className="px-3 py-2">{r.out}</td>
                  <td className="px-3 py-2">{r.buffer}</td>
                  <td className="px-3 py-2">{r.hours}</td>
                  <td className="px-3 py-2">{r.cycle}</td>
                  <td className="px-3 py-2">{r.active}</td>
                  <td className="px-3 py-2">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-600">1 to 19 of 19 entries</div>
      </div>
    </div>
  );
}