import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function RunPayroll() {
  const [month, setMonth] = useState('');
  const [company, setCompany] = useState('Company 1');
  const [department, setDepartment] = useState('');
  const [workingFor, setWorkingFor] = useState('');
  const [location, setLocation] = useState('');
  const [empName, setEmpName] = useState('');
  const [ecode, setEcode] = useState('');
  const [uploadOT, setUploadOT] = useState(false);
  const [active, setActive] = useState('computeOT');
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;

  const companies = ['BOMBAIM','Company 1','Company 2'];
  const workingFors = ['ALL','Self','Client'];

  const downloadCSV = (name, headers) => {
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ActionBtn = ({ children }) => (
    <button className="px-3 py-2 text-sm border rounded">{children}</button>
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-2">
            {[
              {key:'computeOT',label:'1 Compute OT'},
              {key:'paidDays',label:'2 Compute Paid Days'},
              {key:'salaryGen',label:'3 Salary Generation'},
              {key:'tds',label:'4 TDS Generation'},
            ].map(i=> (
              <button key={i.key} className={`w-full px-3 py-2 text-sm rounded text-left border ${active===i.key?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive(i.key)}>{i.label}</button>
            ))}
          </div>
        </div>
        <div className="col-span-9">
          <div className="p-6 rounded border bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Compute OT</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Month:</span>
                <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
              </div>
              <div></div>
              <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
                {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
              </select>
              <input className="text-sm border rounded px-2 py-2" placeholder="Department" value={department} onChange={(e)=>setDepartment(e.target.value)} />
              <select className="text-sm border rounded px-2 py-2 select-arrow" value={workingFor} onChange={(e)=>setWorkingFor(e.target.value)}>
                <option value="">Working For</option>
                {workingFors.map(w=> (<option key={w} value={w}>{w}</option>))}
              </select>
              <input className="text-sm border rounded px-2 py-2" placeholder="Working Location" value={location} onChange={(e)=>setLocation(e.target.value)} />
              <input className="text-sm border rounded px-2 py-2" placeholder="Employee Name" value={empName} onChange={(e)=>setEmpName(e.target.value)} />
              <input className="text-sm border rounded px-2 py-2" placeholder="ECode" value={ecode} onChange={(e)=>setEcode(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={uploadOT} onChange={(e)=>setUploadOT(e.target.checked)} /> Upload OT hours
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">New</button>
              <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">Cancel</button>
              <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">Compute</button>
              <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">Upload OT Hrs</button>
              <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('overtime_upload_template.csv',['Ecode','Month','OTHours'])}>Template</button>
            </div>

            <div className="mt-8 border-t pt-4">
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Month</span>
                  <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Company</span>
                  <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
                    {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-sm mb-1">Search On</div>
                  <select className="text-sm border rounded px-2 py-2 w-full select-arrow"><option>All</option></select>
                </div>
                <div>
                  <div className="text-sm mb-1">Search Text</div>
                  <input className="text-sm border rounded px-2 py-2 w-full" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Pg</span>
                  <input className="text-sm border rounded px-2 py-2 w-16" />
                  <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">➔</button>
                  <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">🔎</button>
                  <button className="px-3 py-2 text-sm border rounded">Logs</button>
                  <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">XLSX</button>
                </div>
              </div>
              <div className="text-xs text-blue-700">Note : 1) Rows with green color indicates that salary for selected month is publish and you can not edit record</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}