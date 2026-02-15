import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function UploadPayrollMaster() {
  const [company, setCompany] = useState('Company 1');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { country } = useParams();
  const map = { india: 'India', nepal: 'Nepal', bangladesh: 'Bangladesh', srilanka: 'Sri Lanka' };
  const label = `${map[(country||'india').toLowerCase()]||'India'} Payroll`;

  const companies = ['Company 1', 'Company 2', 'Company 3'];

  const onTemplate = () => {
    const headers = ['Emp Code','Emp Name','Department','Designation','Pay Group','CTC','Effective From'];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'payroll_master_upload_template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const onUpload = () => {
    if (!file) return alert('Please select a file');
    alert(`Uploading ${file.name} to ${company}`);
  };

  const onCancel = () => { setFile(null); };

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">{label} / Upload</h1>
          <select className="text-sm border rounded px-2 py-2 select-arrow" value={company} onChange={e => setCompany(e.target.value)}>
            {companies.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <button className="px-3 py-2 text-sm border rounded" onClick={onTemplate}>Template</button>
        </div>

        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-md p-12 text-center ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input type="file" accept=".csv,.xlsx" ref={inputRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            <div className="text-4xl text-blue-500">⬆️</div>
            <div className="mt-2 text-sm text-gray-600">{file ? file.name : 'Drag & drop file here or click to select'}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onUpload}>Upload</button>
            <button className="px-4 py-2 border rounded" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}