import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  { id: 1, trNo: 'TR001', raisedBy: 'John Doe', positionCode: 'P001', initiationDate: '2023-01-01' },
  { id: 2, trNo: 'TR002', raisedBy: 'Jane Smith', positionCode: 'P002', initiationDate: '2023-02-15' },
  { id: 3, trNo: 'TR003', raisedBy: 'Alex Lee', positionCode: 'P003', initiationDate: '2023-03-20' },
];

export default function TRTracker() {
  const [rows, setRows] = useState(seed);
  const [raisedBy, setRaisedBy] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const refresh = () => { setRows(seed); setRaisedBy('All'); setSearchText(''); setPage(1); };
  const exportCopy = () => {
    const csv = ['TR No.,TR Raised By,Position Code,Initiation Date']
      .concat(rows.map(r => `${r.trNo},${r.raisedBy},${r.positionCode},${r.initiationDate}`))
      .join('\n');
    navigator.clipboard.writeText(csv).catch(() => {});
    alert('Copied table data to clipboard');
  };

  const raisedByOptions = useMemo(() => ['All', ...Array.from(new Set(rows.map(r => r.raisedBy)))], [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (raisedBy !== 'All') r = r.filter(x => x.raisedBy === raisedBy);
    if (searchText) {
      const q = searchText.toLowerCase();
      r = r.filter(x => (
        (x.trNo || '').toLowerCase().includes(q) ||
        (x.raisedBy || '').toLowerCase().includes(q) ||
        (x.positionCode || '').toLowerCase().includes(q) ||
        (x.initiationDate || '').toLowerCase().includes(q)
      ));
    }
    return r;
  }, [rows, raisedBy, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">TR Tracker</h1>
          <select className="text-sm border rounded px-2 py-2" value={raisedBy} onChange={e => { setRaisedBy(e.target.value); setPage(1); }}>
            {raisedByOptions.map(o => (<option key={o} value={o}>{o}</option>))}
          </select>
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} />
          <button title="Search" className="px-2 py-2 border rounded text-sm">🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
          <button title="Copy" className="px-2 py-2 border rounded text-sm" onClick={exportCopy}>📋</button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2">TR No.</th>
                  <th className="text-left px-3 py-2">TR Raised By</th>
                  <th className="text-left px-3 py-2">Position Code</th>
                  <th className="text-left px-3 py-2">Initiation Date</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.trNo}</td>
                    <td className="px-3 py-2">{r.raisedBy}</td>
                    <td className="px-3 py-2">{r.positionCode}</td>
                    <td className="px-3 py-2">{r.initiationDate}</td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>No records</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <span className="text-sm px-2 py-1 border rounded">{page}</span>
            <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}