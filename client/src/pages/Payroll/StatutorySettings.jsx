import React from 'react';
import { useParams } from 'react-router-dom';

export default function StatutorySettings() {
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
  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <div className="text-sm text-gray-800 mb-2">{label}</div>
          <div className="text-xs text-gray-500 mb-2">Master</div>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 text-sm rounded text-left border bg-blue-50 border-blue-200 text-blue-700">1 PT Master</button>
          </div>
        </div>
        <div className="col-span-9">
          <div className="p-6 rounded border bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">PT Master</h2>
              <button className="px-3 py-2 text-sm bg-green-600 text-white rounded">Verify</button>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded">Add</button>
              <button className="px-3 py-2 text-sm border rounded" onClick={()=>downloadCSV('pt_master_template.csv',['City','SlabFrom','SlabTo','Rate'])}>Template</button>
              <button className="px-3 py-2 text-sm border rounded">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}