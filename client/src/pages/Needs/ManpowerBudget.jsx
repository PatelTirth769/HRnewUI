import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  // Page 1 (10 rows)
  { id: 1, positionCode: 'Administration', positionDescription: 'Administration', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 2, positionCode: 'ADMS', positionDescription: 'ADMS', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 3, positionCode: 'BPS Operations Voice', positionDescription: 'BPS Operations-Voice', parentPositionCode: 'Voice Process', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 4, positionCode: 'BPS OperationsNon Voice', positionDescription: 'BPS Operations-Non Voice', parentPositionCode: 'Non Voice Business Unit', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 5, positionCode: 'Consolidation Audit', positionDescription: 'Consolidation & Audit', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 6, positionCode: 'Global BPS Delivery', positionDescription: 'Global BPS Delivery', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 7, positionCode: 'GRC', positionDescription: 'GRC', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 8, positionCode: 'Human Resources', positionDescription: 'Human Resources', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 9, positionCode: 'Next Gen Business', positionDescription: 'Next Gen Business', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 10, positionCode: 'Professional Services', positionDescription: 'Professional Services', parentPositionCode: 'BPS Director', budgetedStrength: 50, effectiveFrom: '2022-11-01', active: true },
  // Page 2 (2 rows)
  { id: 11, positionCode: 'Sales', positionDescription: 'Sales', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
  { id: 12, positionCode: 'Transition Support', positionDescription: 'Transition & Support', parentPositionCode: 'BPS Director', budgetedStrength: 100, effectiveFrom: '2022-11-01', active: true },
];

const companies = ['ITCONS e-Solution Ltd', 'Demo Company'];
const statuses = ['All', 'Active', 'Inactive'];

export default function ManpowerBudget() {
  const [rows, setRows] = useState(seed);
  const [company, setCompany] = useState(companies[0]);
  const [month, setMonth] = useState('2022-11');
  const [status, setStatus] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const [editId, setEditId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    positionCode: '',
    positionDescription: '',
    parentPositionCode: '',
    budgetedStrength: 0,
    effectiveFrom: '2022-11-01',
    active: true,
  });

  const onCreate = () => { setIsCreating(true); setEditId(null); setForm({ positionCode: '', positionDescription: '', parentPositionCode: '', budgetedStrength: 0, effectiveFrom: `${month}-01`, active: true }); };
  const onEdit = (r) => { setEditId(r.id); setIsCreating(false); setForm({ positionCode: r.positionCode, positionDescription: r.positionDescription, parentPositionCode: r.parentPositionCode, budgetedStrength: r.budgetedStrength, effectiveFrom: r.effectiveFrom, active: r.active }); };
  const onCancel = () => { setIsCreating(false); setEditId(null); setForm({ positionCode: '', positionDescription: '', parentPositionCode: '', budgetedStrength: 0, effectiveFrom: `${month}-01`, active: true }); };

  const save = () => {
    const f = {
      positionCode: (form.positionCode || '').trim(),
      positionDescription: (form.positionDescription || '').trim(),
      parentPositionCode: (form.parentPositionCode || '').trim(),
      budgetedStrength: Number(form.budgetedStrength || 0),
      effectiveFrom: form.effectiveFrom || `${month}-01`,
      active: !!form.active,
    };
    if (!f.positionCode) return alert('Position Code आवश्यक है');
    if (!f.positionDescription) return alert('Position Description आवश्यक है');
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
  const toggleActive = (id) => { setRows(rows.map(r => r.id === id ? { ...r, active: !r.active } : r)); };
  const refresh = () => { setRows(seed); setCompany(companies[0]); setMonth('2022-11'); setStatus('All'); setSearchText(''); setPage(1); };

  const filtered = useMemo(() => {
    let r = rows;
    // Status filter
    if (status !== 'All') r = r.filter(x => (status === 'Active' ? x.active : !x.active));
    // Month filter (by effectiveFrom month)
    if (month) r = r.filter(x => (x.effectiveFrom || '').slice(0, 7) === month);
    // Search text across key columns
    if (searchText) {
      const q = searchText.toLowerCase();
      r = r.filter(x => (
        (x.positionCode || '').toLowerCase().includes(q) ||
        (x.positionDescription || '').toLowerCase().includes(q) ||
        (x.parentPositionCode || '').toLowerCase().includes(q)
      ));
    }
    return r;
  }, [rows, status, month, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        {/* Header controls */}
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Manpower Budget</h1>
          <button onClick={onCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">+ New</button>
          <select className="text-sm border rounded px-2 py-2" value={company} onChange={(e) => setCompany(e.target.value)}>
            {companies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <input type="month" className="text-sm border rounded px-2 py-2" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} />
          <select className="text-sm border rounded px-2 py-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {statuses.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <input className="text-sm border rounded px-2 py-2 w-52" placeholder="Search Text" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <button title="Search" className="px-2 py-2 border rounded text-sm" onClick={() => setPage(1)}>🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        {(isCreating || editId) && (
          <div className="p-4 border-b grid grid-cols-12 gap-3 text-sm">
            <input className="border rounded px-2 py-2 col-span-3" placeholder="Position Code" value={form.positionCode} onChange={(e) => setForm({ ...form, positionCode: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-3" placeholder="Position Description" value={form.positionDescription} onChange={(e) => setForm({ ...form, positionDescription: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-3" placeholder="Parent Position Code" value={form.parentPositionCode} onChange={(e) => setForm({ ...form, parentPositionCode: e.target.value })} />
            <input type="number" className="border rounded px-2 py-2 col-span-2" placeholder="Budgeted Strength" value={form.budgetedStrength} onChange={(e) => setForm({ ...form, budgetedStrength: e.target.value })} />
            <input type="date" className="border rounded px-2 py-2 col-span-3" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
            <label className="flex items-center gap-2 border rounded px-2 py-2 col-span-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
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
                <th className="p-2 text-left">SR.NO</th>
                <th className="p-2 text-left">POSITION CODE</th>
                <th className="p-2 text-left">POSITION DESCRIPTION</th>
                <th className="p-2 text-left">PARENT POSITION CODE</th>
                <th className="p-2 text-left">BUDGETED STRENGTH</th>
                <th className="p-2 text-left">EFFECTIVE FROM</th>
                <th className="p-2 text-left">ACT</th>
                <th className="p-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, idx) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{(page - 1) * perPage + idx + 1}</td>
                  <td className="p-2">{r.positionCode}</td>
                  <td className="p-2">{r.positionDescription}</td>
                  <td className="p-2">{r.parentPositionCode}</td>
                  <td className="p-2">{r.budgetedStrength}</td>
                  <td className="p-2">{new Date(r.effectiveFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-2"><button className={`px-2 py-1 border rounded ${r.active ? 'bg-green-50' : 'bg-red-50'}`} onClick={() => toggleActive(r.id)}>{r.active ? '✓' : '✗'}</button></td>
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