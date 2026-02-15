import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PreparePayroll() {
  const [company, setCompany] = useState('Company 1');
  const [mode, setMode] = useState('master');
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const [active, setActive] = useState('salary');
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;

  const companies = ['Company 1','Company 2','Company 3'];

  const onTemplate = () => {
    const csv = ['Emp Code','Basic','HRA','DA','Other'].join(',');
    navigator.clipboard.writeText(csv).catch(()=>{});
    alert('Template copied');
  };

  const downloadCSV = (name, headers) => {
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const Section = ({ title, children }) => (
    <div className="p-6 rounded border bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );

  const SalaryUpload = () => (
    <Section title="Upload Salary Master">
      <div className="flex items-center gap-3 mb-4">
        <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
          {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" checked={mode==='master'} onChange={()=>setMode('master')} /> Bulk upload salary master
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" checked={mode==='heads'} onChange={()=>setMode('heads')} /> Bulk update single head amount
        </label>
      </div>

      <div className="border-2 border-dashed rounded-md p-12 text-center bg-gray-50" onClick={()=>inputRef.current?.click()}>
        <input type="file" className="hidden" ref={inputRef} onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <div className="text-4xl text-blue-500">⬆️</div>
        <div className="mt-2 text-sm text-gray-600">{file ? file.name : 'Upload File'}</div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded" onClick={()=>downloadCSV('salary_master_template.csv',['Emp Code','Basic','HRA','DA','Other'])}>Generate Template</button>
        <button className="px-3 py-2 text-sm border rounded" onClick={()=>setFile(null)}>Cancel</button>
        <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">Upload</button>
      </div>

      <div className="mt-6">
        <div className="text-xs text-blue-700 space-y-1">
          <div>1) HeadName should match as per SalaryHead master.</div>
          <div>2) Enter monthly values for Gross Heads.</div>
          <div>3) Upload csv or xls file format.</div>
          <div>4) Use semicolon to separate PF Contribution Heads in template.</div>
          <div>5) In bulk upload template, CTC Change Category should be Appointment/Confirmation/Increment/Promotion/Restructure/Transfer/Grade Change/Re-Designation/Demotion/Market Correction.</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-orange-50">
                <th className="text-left px-3 py-2">Uploaded File</th>
                <th className="text-left px-3 py-2">Log</th>
                <th className="text-left px-3 py-2">Uploaded On</th>
              </tr>
            </thead>
            <tbody>
              {[
                {file:'UploadSalaryTemplate.xls', log:'Log', date:'23-Aug-2025 11:32:48'},
                {file:'Bombaim ctc structure.csv', log:'Log', date:'31-Jul-2025 18:41:09'},
                {file:'new ctc bom jul.xls', log:'Log', date:'30-Jul-2025 20:50:29'},
              ].map((r,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{r.file}</td>
                  <td className="px-3 py-2">{r.log}</td>
                  <td className="px-3 py-2">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );

  const VariableUpload = () => {
    const [uploadType, setUploadType] = useState('Earnings');
    const [month, setMonth] = useState('');
    const [varFile, setVarFile] = useState(null);
    return (
      <Section title="Upload Variable Earnings/Deductions">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div></div>
          <div className="flex items-center gap-6 text-sm">
            {["Earnings","Deductions","ArrearDays","Leave Encashment Days","Extra Days"].map(t=>(
              <label key={t} className="flex items-center gap-2"><input type="radio" name="varType" checked={uploadType===t} onChange={()=>setUploadType(t)} /> {t}</label>
            ))}
          </div>
        </div>
        <div className="mb-3 text-sm">
          <span className="text-gray-700">Download Template :</span>
          <button className="ml-2 text-blue-600" onClick={()=>downloadCSV('variable_earnings_template.csv',['Ecode','HeadName','Amount','Month'])}>Monthly Other Salary Earnings Template</button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Salary Month :</span>
            <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
          <div></div>
          <div className="flex items-center gap-3">
            <input type="file" className="text-sm" onChange={(e)=>setVarFile(e.target.files?.[0]||null)} />
            <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
          </div>
        </div>
        <div className="text-xs text-blue-700 space-y-1 mb-4">
          <div>1) Ensure all required data for selected month is available.</div>
          <div>2) HeadName should match as per Earning Head master.</div>
          <div>3) The Earning Head Type should be Variable.</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!varFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setVarFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const LoanAdvances = () => {
    const [empStatus, setEmpStatus] = useState('CURRENT');
    const [searchOn, setSearchOn] = useState('All');
    const [searchText, setSearchText] = useState('');
    return (
      <Section title="Loan/Advance Entry">
        <div className="flex items-center gap-3 mb-3">
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">New</button>
          <div className="text-sm">Emp Status</div>
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={empStatus} onChange={(e)=>setEmpStatus(e.target.value)}>{['CURRENT','LEFT'].map(v=> <option key={v}>{v}</option>)}</select>
          <div className="text-sm">Search</div>
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['All','Employee Name','Ecode'].map(v=> <option key={v}>{v}</option>)}</select>
          <div className="text-sm">Search Text</div>
          <input className="text-sm border rounded px-2 py-2 w-64" value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">🔎</button>
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">XLSX</button>
        </div>
      </Section>
    );
  };

  const Investments = () => {
    const [regime, setRegime] = useState('old');
    const [investType, setInvestType] = useState('employee');
    const [invFile, setInvFile] = useState(null);
    return (
      <Section title="Upload Investment">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="reg" checked={regime==='old'} onChange={()=>setRegime('old')} /> Old Tax regime</label>
            <label className="flex items-center gap-2"><input type="radio" name="reg" checked={regime==='new'} onChange={()=>setRegime('new')} /> New Tax regime 2020</label>
          </div>
          <div className="text-sm">
            <span className="text-gray-700">Template :</span>
            <button className="ml-2 text-blue-600" onClick={()=>downloadCSV('investment_upload_template.csv',['Ecode','Section','Amount','FY','Type'])}>Sample Template</button>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="inv" checked={investType==='employee'} onChange={()=>setInvestType('employee')} /> Employee Declaration</label>
            <label className="flex items-center gap-2"><input type="radio" name="inv" checked={investType==='finance'} onChange={()=>setInvestType('finance')} /> Checked By Finance</label>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setInvFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="text-xs text-blue-700 mb-4">1) File format should be .xls 2) 80EEA can be entered in 80EE column.</div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!invFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setInvFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const Claims = () => {
    const [month, setMonth] = useState('');
    const [cFile, setCFile] = useState(null);
    return (
      <Section title="Upload Claims">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm">Month :</span>
            <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setCFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('claims_upload_template.csv',['Ecode','HeadName','ClaimDate','Amount'])}>Download Template</button>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!cFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setCFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const ClaimsReimbLTA = () => {
    const [fy, setFy] = useState('2025-2026');
    const [claimOpt, setClaimOpt] = useState('Reimbursement');
    const [fileR, setFileR] = useState(null);
    return (
      <Section title="Upload Claims - Reimbursement/L.T.A">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-sm">
            <span className="text-gray-700">Template :</span>
            <button className="ml-2 text-blue-600" onClick={()=>downloadCSV('claims_reimb_lta_template.csv',['Ecode','HeadName','FromDate','ToDate','Amount','FY','Type'])}>Sample Template</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">FY</span>
            <select className="text-sm border rounded px-2 py-2 select-arrow" value={fy} onChange={(e)=>setFy(e.target.value)}>{['2024-2025','2025-2026'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-6 text-sm mb-4">
          <label className="flex items-center gap-2"><input type="radio" name="claimOpt" checked={claimOpt==='Reimbursement'} onChange={()=>setClaimOpt('Reimbursement')} /> Reimbursement</label>
          <label className="flex items-center gap-2"><input type="radio" name="claimOpt" checked={claimOpt==='LTA'} onChange={()=>setClaimOpt('LTA')} /> L.T.A.</label>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setFileR(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="text-xs text-blue-700 space-y-1 mb-4">
          <div>1) Valid reimbursement headnames listed below.</div>
          <div>2) Claim date range should be in selected financial year.</div>
          <div>3) Different dates in same FY will be added to accepted amount.</div>
          <div>4) To overwrite accepted amount, use same claim date in system.</div>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-orange-50">
                <th className="text-left px-3 py-2">Reimbursement Headname</th>
              </tr>
            </thead>
            <tbody>
              {['Medical'].map((h,i)=> (
                <tr key={i} className="border-b"><td className="px-3 py-2">{h}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!fileR}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setFileR(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const PerquisitesUpload = () => {
    const [fy, setFy] = useState('2025-2026');
    const [pFile2, setPFile2] = useState(null);
    return (
      <Section title="Upload Perquisites">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-sm">
            <span className="text-gray-700">Template</span>
            <button className="ml-2 text-blue-600" onClick={()=>downloadCSV('perquisites_upload_template.csv',['Ecode','HeadName','Amount','FY'])}>Sample Template</button>
          </div>
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <select className="text-sm border rounded px-2 py-2" value={fy} onChange={(e)=>setFy(e.target.value)}>{['2024-2025','2025-2026'].map(v=> <option key={v}>{v}</option>)}</select>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setPFile2(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="text-xs text-blue-700 mb-4">
          1) If uploaded file contains same head multiple times, amounts are merged. 2) Existing entry for same head gets overwritten.
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!pFile2}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setPFile2(null)}>Cancel</button>
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">Export</button>
        </div>
      </Section>
    );
  };

  const DumpSalaryUpload = () => {
    const [dFile, setDFile] = useState(null);
    return (
      <Section title="Upload Dump Salary">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div></div>
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded" onClick={()=>downloadCSV('dump_salary_template.csv',['Ecode','Month','Basic','HRA','DA','Other'])}>Generate Template</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setDFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="text-xs text-blue-700 mb-4">Please run the TDS for Post Salary Upload utility for left employees from Bulk Uploads menu.</div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!dFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setDFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const DeleteSalaryUpload = () => {
    const [month, setMonth] = useState('');
    const [empType, setEmpType] = useState('select');
    const [delFile, setDelFile] = useState(null);
    return (
      <Section title="Upload Delete Salary">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-sm mb-1">Company</div>
            <select className="text-sm border rounded px-2 py-2 w-full select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
              {['Company 1','Company 2','Company 3'].map(c=> (<option key={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <div className="text-sm mb-1">Activities</div>
            <select className="text-sm border rounded px-2 py-2 w-full select-arrow" defaultValue="Delete Salary"><option>Delete Salary</option></select>
          </div>
          <div>
            <div className="text-sm mb-1">Salary Month</div>
            <input type="month" className="text-sm border rounded px-2 py-2 w-full" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">Employee Type</div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="empType" checked={empType==='all'} onChange={()=>setEmpType('all')} /> All Employee</label>
              <label className="flex items-center gap-2"><input type="radio" name="empType" checked={empType==='select'} onChange={()=>setEmpType('select')} /> Select Employee</label>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setDelFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <button className="px-3 py-2 text-sm bg-red-600 text-white rounded" disabled={!delFile}>Delete</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setDelFile(null)}>Cancel</button>
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded" onClick={()=>downloadCSV('delete_salary_template.csv',['Ecode','Month'])}>Generate Template</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-orange-50">
                <th className="text-left px-3 py-2">UPLOADED FILE</th>
                <th className="text-left px-3 py-2">LOG</th>
                <th className="text-left px-3 py-2">UPLOADED ON</th>
              </tr>
            </thead>
            <tbody>
              {[
                {file:'DeleteSalary81690.xls', log:'Log', date:'26-Oct-2025 22:31:02'},
                {file:'delete salary Oct 25.xls', log:'Log', date:'26-Oct-2025 22:18:18'},
                {file:'DeleteSalary.xls', log:'Log', date:'24-Oct-2025 15:02:31'},
              ].map((r,i)=> (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{r.file}</td>
                  <td className="px-3 py-2">{r.log}</td>
                  <td className="px-3 py-2">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    );
  };

  const SalaryStopBulk = () => {
    const [empStatus, setEmpStatus] = useState('CURRENT');
    const [searchOn, setSearchOn] = useState('Ecode');
    const [searchBy, setSearchBy] = useState('');
    const [pg, setPg] = useState('');
    const [status, setStatus] = useState('Stopped');
    const [month, setMonth] = useState('');
    return (
      <Section title="Set Salary Stop">
        <div className="flex items-center gap-3 mb-4">
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">New</button>
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">BulkUpload</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
            <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {['ALL','Company 1','Company 2','Company 3'].map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
            <select className="text-sm border rounded px-2 py-2 select-arrow" value={empStatus} onChange={(e)=>setEmpStatus(e.target.value)}>{['CURRENT','LEFT'].map(v=> <option key={v}>{v}</option>)}</select>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="st" checked={status==='Stopped'} onChange={()=>setStatus('Stopped')} /> Stopped</label>
            <label className="flex items-center gap-2"><input type="radio" name="st" checked={status==='Released'} onChange={()=>setStatus('Released')} /> Released</label>
            <label className="flex items-center gap-2"><input type="radio" name="st" checked={status==='Both'} onChange={()=>setStatus('Both')} /> Both</label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Month</span>
            <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Search On</span>
            <select className="text-sm border rounded px-2 py-2 select-arrow" value={searchOn} onChange={(e)=>setSearchOn(e.target.value)}>{['Ecode','Name'].map(v=> <option key={v}>{v}</option>)}</select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Search By</span>
            <input className="text-sm border rounded px-2 py-2" value={searchBy} onChange={(e)=>setSearchBy(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Pg.</span>
            <input className="text-sm border rounded px-2 py-2 w-16" value={pg} onChange={(e)=>setPg(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">🔎</button>
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">📊</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('salary_stop_bulk_template.csv',['Ecode','Month','Status'])}>Template</button>
        </div>
      </Section>
    );
  };

  const Perks = () => {
    const [month, setMonth] = useState('');
    const [pFile, setPFile] = useState(null);
    return (
      <Section title="Upload Perks">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm">Month :</span>
            <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setPFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!pFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setPFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  const OvertimeUpload = () => {
    const [month, setMonth] = useState('');
    const [oFile, setOFile] = useState(null);
    return (
      <Section title="Upload Overtime">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={(e)=>setCompany(e.target.value)}>
            {companies.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm">Month :</span>
            <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e)=>setMonth(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <input type="file" onChange={(e)=>setOFile(e.target.files?.[0]||null)} />
          <button className="px-3 py-2 text-sm bg-orange-500 text-white rounded">⬇️</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('overtime_upload_template.csv',['Ecode','Month','OTHours'])}>Download Template</button>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded" disabled={!oFile}>Upload</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={()=>setOFile(null)}>Cancel</button>
        </div>
      </Section>
    );
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-2">
            {[
              {key:'salary',label:'1 Salary Master Upload'},
              {key:'variable',label:'2 Variable Payment'},
              {key:'loan',label:'3 Loan Advances'},
              {key:'investments',label:'4 Investments'},
              {key:'claims',label:'5 Claims'},
              {key:'perks',label:'5 Perks'},
              {key:'ot',label:'5 Overtime Upload'},
              {key:'claimsReimbLTA',label:'6 Claims Reimbursement/LTA'},
              {key:'perquisites',label:'7 Perquisites Upload'},
              {key:'dumpSalary',label:'8 Dump Salary Upload'},
              {key:'salaryStopBulk',label:'9 Salary Stop Bulk Upload'},
              {key:'deleteSalary',label:'10 Delete Salary Upload'},
            ].map(i=> (
              <button key={i.key} className={`w-full px-3 py-2 text-sm rounded text-left border ${active===i.key?'bg-blue-50 border-blue-200 text-blue-700':'bg-white'}`} onClick={()=>setActive(i.key)}>{i.label}</button>
            ))}
          </div>
        </div>
        <div className="col-span-9">
          {active==='salary' && <SalaryUpload />}
          {active==='variable' && <VariableUpload />}
          {active==='loan' && <LoanAdvances />}
          {active==='investments' && <Investments />}
          {active==='claims' && <Claims />}
          {active==='perks' && <Perks />}
          {active==='ot' && <OvertimeUpload />}
          {active==='claimsReimbLTA' && <ClaimsReimbLTA />}
          {active==='perquisites' && <PerquisitesUpload />}
          {active==='dumpSalary' && <DumpSalaryUpload />}
          {active==='salaryStopBulk' && <SalaryStopBulk />}
          {active==='deleteSalary' && <DeleteSalaryUpload />}
        </div>
      </div>
    </div>
  );
}