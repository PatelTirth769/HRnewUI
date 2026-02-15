import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  { id: 1, srNo: 1, reqDate: '13/10/2023', positionRequirement: 'Manager', companyLocation: 'Mumbai', finalStatus: 'Pending' },
  { id: 2, srNo: 2, reqDate: '14/10/2023', positionRequirement: 'Developer', companyLocation: 'Delhi', finalStatus: 'Approved' },
];

const statuses = ['Pending', 'Approved', 'Rejected'];

export default function TalentAcquisitionApproval() {
  const [rows, setRows] = useState(seed);
  const [statusFilter, setStatusFilter] = useState('All');
  const [positionRequirement, setPositionRequirement] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const refresh = () => { setRows(seed); setStatusFilter('All'); setPositionRequirement(''); setSearchText(''); setPage(1); };

  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0 };
    rows.forEach(r => { if (c[r.finalStatus] !== undefined) c[r.finalStatus]++; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (statusFilter !== 'All') r = r.filter(x => x.finalStatus === statusFilter);
    if (positionRequirement) r = r.filter(x => (x.positionRequirement || '').toLowerCase().includes(positionRequirement.toLowerCase()));
    if (searchText) {
      const q = searchText.toLowerCase();
      r = r.filter(x => (
        (x.reqDate || '').toLowerCase().includes(q) ||
        (x.companyLocation || '').toLowerCase().includes(q)
      ));
    }
    return r;
  }, [rows, statusFilter, positionRequirement, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Talent Acquisition Approval</h1>
          <select className="text-sm border rounded px-2 py-2" value={positionRequirement} onChange={e => { setPositionRequirement(e.target.value); setPage(1); }}>
            <option value="">Position Requirement</option>
            {Array.from(new Set(rows.map(r => r.positionRequirement))).map(pr => (<option key={pr} value={pr}>{pr}</option>))}
          </select>
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} />
          <button title="Search" className="px-2 py-2 border rounded text-sm">🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        <div className="px-4 pt-3 flex gap-2 flex-wrap">
          <button className={`px-3 py-1 text-sm border rounded ${statusFilter==='Pending'?'bg-yellow-50 border-yellow-300':'bg-white'}`} onClick={() => { setStatusFilter('Pending'); setPage(1); }}>Pending Approval ({counts.Pending})</button>
          <button className={`px-3 py-1 text-sm border rounded ${statusFilter==='Approved'?'bg-green-50 border-green-300':'bg-white'}`} onClick={() => { setStatusFilter('Approved'); setPage(1); }}>Approved ({counts.Approved})</button>
          <button className={`px-3 py-1 text-sm border rounded ${statusFilter==='Rejected'?'bg-red-50 border-red-300':'bg-white'}`} onClick={() => { setStatusFilter('Rejected'); setPage(1); }}>Rejected ({counts.Rejected})</button>
          <button className={`px-3 py-1 text-sm border rounded ${statusFilter==='All'?'bg-gray-50 border-gray-300':'bg-white'}`} onClick={() => { setStatusFilter('All'); setPage(1); }}>All (0)</button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2">SR.NO</th>
                  <th className="text-left px-3 py-2">REQ. DATE</th>
                  <th className="text-left px-3 py-2">POSITION REQUIREMENT</th>
                  <th className="text-left px-3 py-2">COMPANY LOCATION</th>
                  <th className="text-left px-3 py-2">FINAL STATUS</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.srNo}</td>
                    <td className="px-3 py-2">{r.reqDate}</td>
                    <td className="px-3 py-2">{r.positionRequirement}</td>
                    <td className="px-3 py-2">{r.companyLocation}</td>
                    <td className="px-3 py-2">{r.finalStatus}</td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No records</td>
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