import React, { useMemo, useState } from 'react';

const seed = [
  { id: 1, cvStatus: 'New CV', statusDesc: 'New CV', precedingStatus: 'New CV', active: true, systemGenerated: false },
  { id: 2, cvStatus: 'CV Rejected', statusDesc: 'CV Rejected', precedingStatus: 'New CV', active: true, systemGenerated: false },
  { id: 3, cvStatus: 'Interview Round 1', statusDesc: 'Interview Round 1', precedingStatus: 'New CV', active: true, systemGenerated: false },
  { id: 4, cvStatus: 'Rejected After Round 1', statusDesc: 'Rejected After Round 1', precedingStatus: 'Interview Round 1', active: true, systemGenerated: false },
  { id: 5, cvStatus: 'Makes an Offer', statusDesc: 'Makes an Offer', precedingStatus: 'Interview Round 1', active: true, systemGenerated: false },
  { id: 6, cvStatus: 'Interview Round 2', statusDesc: 'Interview Round 2', precedingStatus: 'Interview Round 1', active: true, systemGenerated: false },
  { id: 7, cvStatus: 'Rejected After Round 2', statusDesc: 'Rejected After Round 2', precedingStatus: 'Interview Round 2', active: true, systemGenerated: false },
  { id: 8, cvStatus: 'Interview Round 3', statusDesc: 'Interview Round 3', precedingStatus: 'Interview Round 2', active: true, systemGenerated: false },
  { id: 9, cvStatus: 'Rejected After Round 3', statusDesc: 'Rejected After Round 3', precedingStatus: 'Interview Round 3', active: true, systemGenerated: false },
  { id: 10, cvStatus: 'Interview Round 4', statusDesc: 'Interview Round 4', precedingStatus: 'Interview Round 4', active: true, systemGenerated: false },
];

const perPage = 10;

export default function CVStatus() {
  const [rows, setRows] = useState(seed);
  const [searchCol, setSearchCol] = useState('cvStatus');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ cvStatus: '', statusDesc: '', precedingStatus: '', active: true, systemGenerated: false });

  const onCreate = () => { setIsCreating(true); setEditId(null); setForm({ cvStatus: '', statusDesc: '', precedingStatus: '', active: true, systemGenerated: false }); };
  const onEdit = (r) => { setEditId(r.id); setIsCreating(false); setForm({ cvStatus: r.cvStatus, statusDesc: r.statusDesc, precedingStatus: r.precedingStatus, active: r.active, systemGenerated: r.systemGenerated }); };
  const onCancel = () => { setIsCreating(false); setEditId(null); setForm({ cvStatus: '', statusDesc: '', precedingStatus: '', active: true, systemGenerated: false }); };

  const save = () => {
    const f = { ...form, cvStatus: form.cvStatus.trim(), statusDesc: form.statusDesc.trim(), precedingStatus: form.precedingStatus.trim() };
    if (!f.cvStatus || !f.statusDesc) return alert('CV Status और Status Desc आवश्यक हैं');
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
  const refresh = () => { setRows(seed); setSearchText(''); setSearchCol('cvStatus'); setPage(1); };

  const filtered = useMemo(() => {
    if (!searchText) return rows;
    const q = searchText.toLowerCase();
    return rows.filter(r => {
      const val = r[searchCol];
      if (typeof val === 'boolean') return (val ? 'true' : 'false').includes(q);
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
          <h1 className="text-lg font-semibold text-gray-800 flex-1">CV Status</h1>
          <button onClick={onCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          <select className="text-sm border rounded px-2 py-2" value={searchCol} onChange={(e) => { setSearchCol(e.target.value); setPage(1); }}>
            <option value="cvStatus">CV Status</option>
            <option value="statusDesc">Status Desc</option>
            <option value="precedingStatus">Preceding Status</option>
            <option value="active">Active</option>
            <option value="systemGenerated">System Generated</option>
          </select>
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
          <button title="Search" className="px-2 py-2 border rounded text-sm" onClick={() => setPage(1)}>🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        {(isCreating || editId) && (
          <div className="p-4 border-b grid grid-cols-6 gap-3 text-sm">
            <input className="border rounded px-2 py-2" placeholder="CV Status" value={form.cvStatus} onChange={(e) => setForm({ ...form, cvStatus: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Status Desc" value={form.statusDesc} onChange={(e) => setForm({ ...form, statusDesc: e.target.value })} />
            <input className="border rounded px-2 py-2" placeholder="Preceding Status" value={form.precedingStatus} onChange={(e) => setForm({ ...form, precedingStatus: e.target.value })} />
            <label className="flex items-center gap-2 border rounded px-2 py-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <label className="flex items-center gap-2 border rounded px-2 py-2"><input type="checkbox" checked={form.systemGenerated} onChange={(e) => setForm({ ...form, systemGenerated: e.target.checked })} /> System Generated</label>
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
                <th className="p-2 text-left">CV STATUS</th>
                <th className="p-2 text-left">STATUS DESC</th>
                <th className="p-2 text-left">PRECEDING STATUS</th>
                <th className="p-2 text-left">ACTIVE</th>
                <th className="p-2 text-left">SYSTEM GENERATED</th>
                <th className="p-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{(page - 1) * perPage + idx + 1}</td>
                  <td className="p-2">{r.cvStatus}</td>
                  <td className="p-2">{r.statusDesc}</td>
                  <td className="p-2">{r.precedingStatus}</td>
                  <td className="p-2">{r.active ? 'True' : 'False'}</td>
                  <td className="p-2">{r.systemGenerated ? 'True' : 'False'}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button title="Edit" className="px-2 py-1 border rounded" onClick={() => onEdit(r)}>✎</button>
                      <button title="Delete" className="px-2 py-1 border rounded" onClick={() => remove(r.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={7}>No data</td></tr>
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