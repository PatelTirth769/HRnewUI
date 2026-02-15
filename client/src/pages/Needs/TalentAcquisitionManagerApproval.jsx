import React, { useMemo, useState } from 'react';

const perPage = 10;

const seed = [
  { id: 1, srNo: 1, reqNo: '13/10/2023', positionRequirement: 'Manager111', companyLocation: 'Mumbai', finalStatus: 'Approved', empCount: 0, referenceNo: 'REF001' },
  { id: 2, srNo: 2, reqNo: '13/10/2023', positionRequirement: 'Manager111', companyLocation: 'Mumbai', finalStatus: 'Approved', empCount: 0, referenceNo: 'REF002' },
];

export default function TalentAcquisitionManagerApproval() {
  const [rows, setRows] = useState(seed);
  const [referenceNo, setReferenceNo] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const onNew = () => alert('New Talent Acquisition');
  const onCreateGroup = () => alert('Create Group of similar talent requirement');
  const refresh = () => { setRows(seed); setReferenceNo(''); setSearchText(''); setPage(1); };

  const filtered = useMemo(() => {
    let r = rows;
    if (referenceNo) r = r.filter(x => (x.referenceNo || '').toLowerCase().includes(referenceNo.toLowerCase()));
    if (searchText) {
      const q = searchText.toLowerCase();
      r = r.filter(x => (
        (x.reqNo || '').toLowerCase().includes(q) ||
        (x.positionRequirement || '').toLowerCase().includes(q) ||
        (x.companyLocation || '').toLowerCase().includes(q) ||
        (x.finalStatus || '').toLowerCase().includes(q)
      ));
    }
    return r;
  }, [rows, referenceNo, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Talent Acquisition Manager Approval</h1>
          <input className="text-sm border rounded px-2 py-2" placeholder="Reference No" value={referenceNo} onChange={e => { setReferenceNo(e.target.value); setPage(1); }} />
          <input className="text-sm border rounded px-2 py-2 w-48" placeholder="Search Text" value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} />
          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onNew}>New</button>
          <button className="px-3 py-2 text-sm border rounded" onClick={onCreateGroup}>Create Group of similar talent requirement</button>
          <button title="Search" className="px-2 py-2 border rounded text-sm">🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2">SR.NO</th>
                  <th className="text-left px-3 py-2">REQ. NO</th>
                  <th className="text-left px-3 py-2">TALENT/POSITION REQUIREMENT</th>
                  <th className="text-left px-3 py-2">COMPANY LOCATION</th>
                  <th className="text-left px-3 py-2">FINAL STATUS</th>
                  <th className="text-left px-3 py-2">EMP COUNT</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.srNo}</td>
                    <td className="px-3 py-2">{r.reqNo}</td>
                    <td className="px-3 py-2">{r.positionRequirement}</td>
                    <td className="px-3 py-2">{r.companyLocation}</td>
                    <td className="px-3 py-2">{r.finalStatus}</td>
                    <td className="px-3 py-2">{r.empCount}</td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>No records</td>
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