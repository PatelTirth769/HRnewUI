import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  { id: 1, positionCode: 'Admin', designationName: 'Administrator', requiredTalent: 'Management', departmentName: 'Admin Dept', assignedTo: 'John Doe', status: true, referenceNo: 'REF001' },
  { id: 2, positionCode: 'Dev', designationName: 'Developer', requiredTalent: 'Programming', departmentName: 'IT Dept', assignedTo: 'Jane Doe', status: false, referenceNo: 'REF002' },
  { id: 3, positionCode: 'HR', designationName: 'HR Manager', requiredTalent: 'Human Resources', departmentName: 'HR Dept', assignedTo: 'Jim Smith', status: true, referenceNo: 'REF003' },
  { id: 4, positionCode: 'QA', designationName: 'QA Engineer', requiredTalent: 'Testing', departmentName: 'QA Dept', assignedTo: 'Alice', status: true, referenceNo: 'REF004' },
  { id: 5, positionCode: 'OPS', designationName: 'Operations Lead', requiredTalent: 'Operations', departmentName: 'Ops Dept', assignedTo: 'Bob', status: true, referenceNo: 'REF005' },
  { id: 6, positionCode: 'FIN', designationName: 'Finance Analyst', requiredTalent: 'Finance', departmentName: 'Finance Dept', assignedTo: 'Carol', status: true, referenceNo: 'REF006' },
  { id: 7, positionCode: 'SAL', designationName: 'Sales Executive', requiredTalent: 'Sales', departmentName: 'Sales Dept', assignedTo: 'David', status: true, referenceNo: 'REF007' },
  { id: 8, positionCode: 'MKT', designationName: 'Marketing Lead', requiredTalent: 'Marketing', departmentName: 'Marketing Dept', assignedTo: 'Eve', status: true, referenceNo: 'REF008' },
  { id: 9, positionCode: 'SUP', designationName: 'Support Eng', requiredTalent: 'Support', departmentName: 'Support Dept', assignedTo: 'Frank', status: true, referenceNo: 'REF009' },
  { id: 10, positionCode: 'SEC', designationName: 'Security Eng', requiredTalent: 'Security', departmentName: 'Security Dept', assignedTo: 'Grace', status: true, referenceNo: 'REF010' },
  { id: 11, positionCode: 'NET', designationName: 'Network Eng', requiredTalent: 'Networking', departmentName: 'IT Dept', assignedTo: 'Hank', status: true, referenceNo: 'REF011' },
  { id: 12, positionCode: 'DS', designationName: 'Data Scientist', requiredTalent: 'Data', departmentName: 'Data Dept', assignedTo: 'Ivy', status: true, referenceNo: 'REF012' },
];

const searchColumns = [
  { key: 'positionCode', label: 'Position Code' },
  { key: 'designationName', label: 'Designation Name' },
  { key: 'requiredTalent', label: 'Required Talent' },
  { key: 'departmentName', label: 'Department Name' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'status', label: 'Status' },
  { key: 'referenceNo', label: 'Reference No' },
];

export default function TalentRegister() {
  const [rows, setRows] = useState(seed);
  const [searchCol, setSearchCol] = useState('positionCode');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const [editId, setEditId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    positionCode: '',
    designationName: '',
    requiredTalent: '',
    departmentName: '',
    assignedTo: '',
    status: true,
    referenceNo: '',
  });

  const onCreate = () => { setIsCreating(true); setEditId(null); setForm({ positionCode: '', designationName: '', requiredTalent: '', departmentName: '', assignedTo: '', status: true, referenceNo: '' }); };
  const onEdit = (r) => { setEditId(r.id); setIsCreating(false); setForm({ positionCode: r.positionCode, designationName: r.designationName, requiredTalent: r.requiredTalent, departmentName: r.departmentName, assignedTo: r.assignedTo, status: r.status, referenceNo: r.referenceNo }); };
  const onCancel = () => { setIsCreating(false); setEditId(null); setForm({ positionCode: '', designationName: '', requiredTalent: '', departmentName: '', assignedTo: '', status: true, referenceNo: '' }); };

  const save = () => {
    const f = {
      positionCode: (form.positionCode || '').trim(),
      designationName: (form.designationName || '').trim(),
      requiredTalent: (form.requiredTalent || '').trim(),
      departmentName: (form.departmentName || '').trim(),
      assignedTo: (form.assignedTo || '').trim(),
      status: !!form.status,
      referenceNo: (form.referenceNo || '').trim(),
    };
    if (!f.positionCode) return alert('Position Code आवश्यक है');
    if (!f.designationName) return alert('Designation Name आवश्यक है');
    if (editId) {
      setRows(rows.map(r => r.id === editId ? { ...r, ...f } : r));
    } else {
      const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, { id: nextId, ...f }]);
      setPage(Math.ceil((rows.length + 1) / perPage));
    }
    onCancel();
  };

  const remove = (id) => { if (!confirm('Delete करें?')) return; setRows(rows.filter(r => r.id !== id)); };
  const refresh = () => { setRows(seed); setSearchText(''); setSearchCol('positionCode'); setPage(1); };

  const filtered = useMemo(() => {
    if (!searchText) return rows;
    const q = searchText.toLowerCase();
    return rows.filter(r => {
      const val = r[searchCol];
      if (typeof val === 'boolean') return (val ? 'active' : 'inactive').includes(q);
      return (val || '').toString().toLowerCase().includes(q);
    });
  }, [rows, searchText, searchCol]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        {/* Header controls */}
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Talent Register</h1>
          <button onClick={onCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          <select className="text-sm border rounded px-2 py-2" value={searchCol} onChange={(e) => { setSearchCol(e.target.value); setPage(1); }}>
            {searchColumns.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
          </select>
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
          <button title="Search" className="px-2 py-2 border rounded text-sm" onClick={() => setPage(1)}>🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        {(isCreating || editId) && (
          <div className="p-4 border-b grid grid-cols-12 gap-3 text-sm">
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Position Code" value={form.positionCode} onChange={(e) => setForm({ ...form, positionCode: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-3" placeholder="Designation Name" value={form.designationName} onChange={(e) => setForm({ ...form, designationName: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Required Talent" value={form.requiredTalent} onChange={(e) => setForm({ ...form, requiredTalent: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Department Name" value={form.departmentName} onChange={(e) => setForm({ ...form, departmentName: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Assigned To" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
            <label className="flex items-center gap-2 border rounded px-2 py-2 col-span-1"><input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} /> Active</label>
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Reference No" value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} />
            <div className="col-span-12 flex justify-end gap-2">
              <button onClick={save} className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Save</button>
              <button onClick={onCancel} className="px-3 py-2 text-sm border rounded">Cancel</button>
            </div>
          </div>
        )}

        <div className="p-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-left">Position Code</th>
                <th className="p-2 text-left">Designation Name</th>
                <th className="p-2 text-left">Required Talent</th>
                <th className="p-2 text-left">Department Name</th>
                <th className="p-2 text-left">Assigned To</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Reference No</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.positionCode}</td>
                  <td className="p-2">{r.designationName}</td>
                  <td className="p-2">{r.requiredTalent}</td>
                  <td className="p-2">{r.departmentName}</td>
                  <td className="p-2">{r.assignedTo}</td>
                  <td className="p-2">{r.status ? 'Active' : 'Inactive'}</td>
                  <td className="p-2">{r.referenceNo}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button title="Edit" className="px-2 py-1 border rounded" onClick={() => onEdit(r)}>✎</button>
                      <button title="Delete" className="px-2 py-1 border rounded" onClick={() => remove(r.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={8}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t flex items-center justify-end gap-2 text-sm">
          <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◂</button>
          <span className="px-2 py-1 border rounded bg-white">{page}</span>
          <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▸</button>
        </div>
      </div>
    </div>
  );
}