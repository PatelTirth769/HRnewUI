import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PostPayroll() {
  const [active, setActive] = useState('stop');
  const [company, setCompany] = useState('Company 1');
  const [empStatus, setEmpStatus] = useState('All');
  const [status, setStatus] = useState('Stopped');
  const [month, setMonth] = useState('');
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;

  const companies = ['Company 1','Company 2','Company 3'];
  const empStatuses = ['All','Active','Inactive'];

  const downloadCSV = (name, headers) => {
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-2">
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='stop'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('stop')}>1 Salary Stop</button>
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='lock'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('lock')}>2 Lock Salary</button>
            <button className={`w-full px-3 py-2 text-sm rounded text-left border ${active==='delete'?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive('delete')}>3 Delete Salary</button>
          </div>
        </div>
        <div className="col-span-9">
          <div className="p-6 rounded border bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Salary Stop</h2>
              <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">Save & Next</button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded">New</button>
              <button className="px-3 py-2 text-sm border rounded">Bulk Upload</button>
              <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('salary_stop_bulk_template.csv',['Ecode','Month','Status'])}>Template</button>
              <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
                {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
              </select>
              <select className="text-sm border rounded px-2 py-2 select-arrow" value={empStatus} onChange={(e)=>setEmpStatus(e.target.value)}>
                {empStatuses.map(s=> (<option key={s} value={s}>{s}</option>))}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="st" checked={status==='Stopped'} onChange={()=>setStatus('Stopped')} /> Stopped</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="st" checked={status==='Released'} onChange={()=>setStatus('Released')} /> Released</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="st" checked={status==='Both'} onChange={()=>setStatus('Both')} /> Both</label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Month:</span>
                <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 text-sm border rounded">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}