import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function SalaryHeads() {
  const [active, setActive] = useState('earning');
  const [company, setCompany] = useState('Select a Company');
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;

  const downloadCSV = (name, headers) => {
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const Section = ({ title }) => (
    <div className="p-6 rounded border bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">Save & Next</button>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded">New</button>
        <button className="px-3 py-2 text-sm border rounded">Bulk Upload</button>
        <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('salary_heads_template.csv',['HeadName','HeadType','Category'])}>Template</button>
        <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
          <option>Select a Company</option>
          <option>Company 1</option>
          <option>Company 2</option>
        </select>
        <button className="px-3 py-2 text-sm border rounded">Reset</button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-2">
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='earning'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('earning')}>1 Earning Head Master</button>
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='deduction'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('deduction')}>2 Deduction Head Master</button>
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='challan'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('challan')}>3 Challan Master</button>
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='external'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('external')}>4 External Deduction</button>
          </div>
        </div>
        <div className="col-span-9">
          {active==='earning' && <Section title="Earning Head Master" />}
          {active==='deduction' && <Section title="Deduction Head Master" />}
          {active==='challan' && <Section title="Challan Master" />}
          {active==='external' && <Section title="External Deduction" />}
        </div>
      </div>
    </div>
  );
}