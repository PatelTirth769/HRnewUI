import React, { useMemo, useRef, useState } from 'react';

const perPage = 10;

const seed = [
  { id: 1, positionCode: 'P001', sourceBy: 'LinkedIn', candidateName: 'John Doe', cvAgeing: '5 days', cvStatus: 'Reviewed', referenceNo: 'R001' },
  { id: 2, positionCode: 'P002', sourceBy: 'Indeed', candidateName: 'Jane Smith', cvAgeing: '10 days', cvStatus: 'Pending', referenceNo: 'R002' },
  { id: 3, positionCode: 'P003', sourceBy: 'Monster', candidateName: 'Sam Wilson', cvAgeing: '3 days', cvStatus: 'Approved', referenceNo: 'R003' },
];

const searchColumns = [
  { key: 'positionCode', label: 'Position Code' },
  { key: 'sourceBy', label: 'Source By' },
  { key: 'candidateName', label: 'Candidate Name' },
  { key: 'cvAgeing', label: 'CV Ageing' },
  { key: 'cvStatus', label: 'CV Status' },
  { key: 'referenceNo', label: 'Reference No' },
];

export default function ManageCV() {
  const [rows, setRows] = useState(seed);
  const [searchCol, setSearchCol] = useState('positionCode');
  const [searchText, setSearchText] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [exportAllRound, setExportAllRound] = useState(false);
  const [page, setPage] = useState(1);

  const [editId, setEditId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    positionCode: '',
    sourceBy: '',
    candidateName: '',
    cvAgeing: '',
    cvStatus: '',
    referenceNo: '',
  });

  const fileInputRef = useRef(null);

  const onCreate = () => { setIsCreating(true); setEditId(null); setForm({ positionCode: '', sourceBy: '', candidateName: '', cvAgeing: '', cvStatus: '', referenceNo: '' }); };
  const onEdit = (r) => { setEditId(r.id); setIsCreating(false); setForm({ positionCode: r.positionCode, sourceBy: r.sourceBy, candidateName: r.candidateName, cvAgeing: r.cvAgeing, cvStatus: r.cvStatus, referenceNo: r.referenceNo }); };
  const onCancel = () => { setIsCreating(false); setEditId(null); setForm({ positionCode: '', sourceBy: '', candidateName: '', cvAgeing: '', cvStatus: '', referenceNo: '' }); };

  const save = () => {
    const f = {
      positionCode: (form.positionCode || '').trim(),
      sourceBy: (form.sourceBy || '').trim(),
      candidateName: (form.candidateName || '').trim(),
      cvAgeing: (form.cvAgeing || '').trim(),
      cvStatus: (form.cvStatus || '').trim(),
      referenceNo: (form.referenceNo || '').trim(),
    };
    if (!f.positionCode) return alert('Position Code आवश्यक है');
    if (!f.candidateName) return alert('Candidate Name आवश्यक है');
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
  const refresh = () => { setRows(seed); setSearchText(''); setSearchCol('positionCode'); setPositionFilter('All'); setPage(1); };

  // Bulk upload (CSV): columns in order
  const onBulkUpload = () => fileInputRef.current?.click();
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const newRows = lines.map((line) => {
      const [positionCode, sourceBy, candidateName, cvAgeing, cvStatus, referenceNo] = line.split(',').map(s => s?.trim());
      return { positionCode, sourceBy, candidateName, cvAgeing, cvStatus, referenceNo };
    }).filter(r => r.positionCode && r.candidateName);
    if (newRows.length) {
      let nextId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      setRows([...rows, ...newRows.map(r => ({ id: nextId++, ...r }))]);
      setPage(Math.ceil((rows.length + newRows.length) / perPage));
    }
    e.target.value = '';
  };

  const positions = useMemo(() => ['All', ...Array.from(new Set(rows.map(r => r.positionCode)))], [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (positionFilter !== 'All') r = r.filter(x => x.positionCode === positionFilter);
    if (searchText) {
      const q = searchText.toLowerCase();
      r = r.filter(x => {
        const val = x[searchCol];
        return (val || '').toString().toLowerCase().includes(q);
      });
    }
    return r;
  }, [rows, positionFilter, searchText, searchCol]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <input type="file" ref={fileInputRef} accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      <div className="bg-white border rounded-md">
        {/* Header controls */}
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Manage CV</h1>
          <button onClick={onCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          <button onClick={onBulkUpload} className="px-3 py-2 text-sm border rounded">Bulk CV Upload</button>
          <button title="Search" className="px-2 py-2 border rounded text-sm">🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={exportAllRound} onChange={(e) => setExportAllRound(e.target.checked)} />
            Export with all Round
          </label>
        </div>

        {/* Filters line (two dropdowns + two search inputs to mirror screenshot) */}
        <div className="px-4 py-3 border-b grid grid-cols-12 gap-3 text-sm">
          <select className="border rounded px-2 py-2 col-span-2" value={searchCol} onChange={(e) => { setSearchCol(e.target.value); setPage(1); }}>
            {searchColumns.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
          </select>
          <input className="border rounded px-2 py-2 col-span-3" placeholder="Search Text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
          <select className="border rounded px-2 py-2 col-span-2" value={positionFilter} onChange={(e) => { setPositionFilter(e.target.value); setPage(1); }}>
            {positions.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
          <input className="border rounded px-2 py-2 col-span-3" placeholder="Search Text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} />
        </div>

        {(isCreating || editId) && (
          <div className="p-4 border-b grid grid-cols-12 gap-3 text-sm">
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Position Code" value={form.positionCode} onChange={(e) => setForm({ ...form, positionCode: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Source By" value={form.sourceBy} onChange={(e) => setForm({ ...form, sourceBy: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-3" placeholder="Candidate Name" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="CV Ageing" value={form.cvAgeing} onChange={(e) => setForm({ ...form, cvAgeing: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="CV Status" value={form.cvStatus} onChange={(e) => setForm({ ...form, cvStatus: e.target.value })} />
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
                <th className="p-2 text-left">Source By</th>
                <th className="p-2 text-left">Candidate Name</th>
                <th className="p-2 text-left">CV Ageing</th>
                <th className="p-2 text-left">CV Status</th>
                <th className="p-2 text-left">Reference No</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.positionCode}</td>
                  <td className="p-2">{r.sourceBy}</td>
                  <td className="p-2">{r.candidateName}</td>
                  <td className="p-2">{r.cvAgeing}</td>
                  <td className="p-2">{r.cvStatus}</td>
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