import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  // Page 1
  { id: 1, name: 'Recruitment', category: 'VENDOR_TYPE', status: true },
  { id: 2, name: 'Consultant', category: 'VENDOR_TYPE', status: true },
  { id: 3, name: 'HR Consultant', category: 'VENDOR_TYPE', status: true },
  { id: 4, name: 'Quality', category: 'RATING', status: true },
  { id: 5, name: 'Speed', category: 'RATING', status: true },
  { id: 6, name: 'Overall', category: 'RATING', status: true },
  { id: 7, name: 'Technical', category: 'SKILL_TYPE', status: true },
  { id: 8, name: 'Soft', category: 'SKILL_TYPE', status: true },
  { id: 9, name: 'Management', category: 'SKILL_TYPE', status: true },
  { id: 10, name: 'Functional', category: 'SKILL_TYPE', status: true },
  // Page 2
  { id: 11, name: 'Newspaper', category: 'SOURCE', status: true },
  { id: 12, name: 'Advertisement', category: 'SOURCE', status: true },
  { id: 13, name: 'Job Portal', category: 'SOURCE', status: true },
  { id: 14, name: 'Open', category: 'POSITION_STATUS', status: true },
  { id: 15, name: 'Closed', category: 'POSITION_STATUS', status: true },
  { id: 16, name: 'On Hold', category: 'POSITION_STATUS', status: true },
  { id: 17, name: 'Cancelled', category: 'POSITION_STATUS', status: true },
  { id: 18, name: 'testing1', category: 'RATING', status: true },
  { id: 19, name: 'mobile1', category: 'Select Category..', status: true },
  { id: 20, name: 'testring', category: 'Select Category..', status: true },
  // Page 3
  { id: 21, name: 'Nilesh Waingankar', category: 'RATING', status: true },
  { id: 22, name: 'mobile1', category: 'RATING', status: true },
  { id: 23, name: 'Required', category: 'AppraisalEntry_Training_MgrRecommendation', status: true },
  { id: 24, name: 'Not required', category: 'AppraisalEntry_Training_MgrRecommendation', status: true },
  { id: 25, name: 'T & M', category: 'billing_type', status: true },
  { id: 26, name: 'Milestone', category: 'billing_type', status: true },
  { id: 27, name: 'Other', category: 'billing_type', status: true },
  { id: 28, name: 'Needed', category: 'PMS_TRAINING_STATUS', status: true },
  { id: 29, name: 'Knowledge', category: 'TRAINING CATEGORY', status: true },
  { id: 30, name: 'Skills', category: 'TRAINING CATEGORY', status: true },
];

const categoryOptions = [
  'VENDOR_TYPE',
  'RATING',
  'SKILL_TYPE',
  'SOURCE',
  'POSITION_STATUS',
  'billing_type',
  'PMS_TRAINING_STATUS',
  'TRAINING CATEGORY',
  'Select Category..',
];

export default function Miscellaneous() {
  const [rows, setRows] = useState(seed);
  const [searchCol, setSearchCol] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const [editId, setEditId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', status: true });

  const onCreate = () => { setIsCreating(true); setEditId(null); setForm({ name: '', category: '', status: true }); };
  const onEdit = (r) => { setEditId(r.id); setIsCreating(false); setForm({ name: r.name, category: r.category, status: r.status }); };
  const onCancel = () => { setIsCreating(false); setEditId(null); setForm({ name: '', category: '', status: true }); };

  const save = () => {
    const f = { name: (form.name || '').trim(), category: (form.category || '').trim(), status: !!form.status };
    if (!f.name) return alert('Name आवश्यक है');
    if (editId) {
      setRows(rows.map(r => r.id === editId ? { ...r, ...f } : r));
    } else {
      const nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, { id: nextId, ...f }]);
      setPage(Math.ceil((rows.length + 1) / perPage));
    }
    onCancel();
  };

  const remove = (id) => { if (!confirm('हटाएँ?')) return; setRows(rows.filter(r => r.id !== id)); };
  const refresh = () => { setRows(seed); setSearchText(''); setSearchCol('name'); setPage(1); };

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
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Miscellaneous</h1>
          <button onClick={onCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          <select className="text-sm border rounded px-2 py-2" value={searchCol} onChange={(e) => { setSearchCol(e.target.value); setPage(1); }}>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="status">Status</option>
          </select>
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
          <button title="Search" className="px-2 py-2 border rounded text-sm" onClick={() => setPage(1)}>🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        {(isCreating || editId) && (
          <div className="p-4 border-b grid grid-cols-6 gap-3 text-sm">
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="border rounded px-2 py-2 col-span-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select Category..</option>
              {categoryOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <label className="flex items-center gap-2 border rounded px-2 py-2"><input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} /> Active</label>
            <div className="col-span-6 flex justify-end gap-2">
              <button onClick={save} className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Save</button>
              <button onClick={onCancel} className="px-3 py-2 text-sm border rounded">Cancel</button>
            </div>
          </div>
        )}

        <div className="p-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-left">SR. NO.</th>
                <th className="p-2 text-left">NAME</th>
                <th className="p-2 text-left">CATEGORY</th>
                <th className="p-2 text-left">STATUS</th>
                <th className="p-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{(page - 1) * perPage + idx + 1}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.category}</td>
                  <td className="p-2">{r.status ? 'Active' : 'Inactive'}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button title="Edit" className="px-2 py-1 border rounded" onClick={() => onEdit(r)}>✎</button>
                      <button title="Delete" className="px-2 py-1 border rounded" onClick={() => remove(r.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={5}>No data</td></tr>
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