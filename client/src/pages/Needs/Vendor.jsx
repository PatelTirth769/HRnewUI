import React, { useMemo, useState } from 'react';

const initialVendors = [
  {
    id: 1,
    code: '001',
    name: 'Hiring consultant\nName',
    type: 'Recruitment',
    city: 'Rajasthan',
    contact: 'Ram',
    phone: '1234567890',
    email: 'vaibhav@diyhr.in',
  },
  {
    id: 2,
    code: '002',
    name: 'Consultant A',
    type: 'Consulting',
    city: 'Delhi',
    contact: 'Anita S',
    phone: '9876543210',
    email: 'anita@consultanta.com',
  },
  {
    id: 3,
    code: '003',
    name: 'Big Basket',
    type: 'Grocery',
    city: 'Gandhinagar',
    contact: 'Ram',
    phone: '8440970365',
    email: 'ramchandrakumawat365@gmail.com',
  },
];

const perPage = 10;

export default function Vendor() {
  const [vendors, setVendors] = useState(initialVendors);
  const [search, setSearch] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', type: '', city: '', contact: '', phone: '', email: '' });

  const codes = useMemo(() => Array.from(new Set(vendors.map(v => v.code))), [vendors]);

  const filtered = useMemo(() => {
    let rows = vendors;
    if (filterCode) rows = rows.filter(r => r.code === filterCode);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.contact.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [vendors, filterCode, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => setForm({ code: '', name: '', type: '', city: '', contact: '', phone: '', email: '' });

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
    setEditingId(null);
  };

  const startEdit = (row) => {
    setForm({ code: row.code, name: row.name, type: row.type, city: row.city, contact: row.contact, phone: row.phone, email: row.email });
    setEditingId(row.id);
    setIsCreating(false);
  };

  const cancelEditCreate = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const save = () => {
    const trimmed = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, (v || '').toString().trim()]));
    if (!trimmed.code || !trimmed.name) return alert('Code और Name आवश्यक हैं');
    if (editingId) {
      setVendors(vendors.map(v => v.id === editingId ? { ...v, ...trimmed } : v));
    } else {
      const nextId = (vendors.reduce((m, v) => Math.max(m, v.id), 0) + 1);
      setVendors([...vendors, { id: nextId, ...trimmed }]);
    }
    cancelEditCreate();
  };

  const remove = (id) => {
    if (!confirm('इस vendor को हटाएँ?')) return;
    setVendors(vendors.filter(v => v.id !== id));
  };

  const refresh = () => {
    // Minimal refresh: reset to initial data
    setVendors(initialVendors);
    setSearch('');
    setFilterCode('');
    setPage(1);
  };

  return (
    <div className="p-4">
      <div className="bg-white border rounded-md">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800 flex-1">Vendor</h1>
          <button onClick={startCreate} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
          <select
            className="text-sm border rounded px-2 py-2"
            value={filterCode}
            onChange={(e) => { setFilterCode(e.target.value); setPage(1); }}
          >
            <option value="">Vendor Code</option>
            {codes.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <input
            className="text-sm border rounded px-2 py-2 w-48"
            placeholder="Search Text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <button title="Search" className="px-2 py-2 border rounded text-sm" onClick={() => setPage(1)}>🔎</button>
          <button title="Refresh" className="px-2 py-2 border rounded text-sm" onClick={refresh}>🔄</button>
        </div>

        {/* Create / Edit form */}
        {(isCreating || editingId) && (
          <div className="p-4 border-b grid grid-cols-7 gap-3 text-sm">
            <input className="border rounded px-2 py-2" placeholder="Vendor Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border rounded px-2 py-2" placeholder="Vendor Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <input className="border rounded px-2 py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input className="border rounded px-2 py-2" placeholder="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input className="border rounded px-2 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="border rounded px-2 py-2 col-span-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <div className="col-span-7 flex justify-end gap-2">
              <button onClick={save} className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Save</button>
              <button onClick={cancelEditCreate} className="px-3 py-2 text-sm border rounded">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-2 text-left">SR. NO.</th>
                <th className="p-2 text-left">VENDOR CODE</th>
                <th className="p-2 text-left">VENDOR NAME</th>
                <th className="p-2 text-left">VENDOR TYPE</th>
                <th className="p-2 text-left">CITY</th>
                <th className="p-2 text-left">CONTACT PERSON</th>
                <th className="p-2 text-left">PHONE</th>
                <th className="p-2 text-left">EMAIL</th>
                <th className="p-2 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2">{(page - 1) * perPage + idx + 1}</td>
                  <td className="p-2 text-blue-600 font-medium">{row.code}</td>
                  <td className="p-2 whitespace-pre-line">{row.name}</td>
                  <td className="p-2">{row.type}</td>
                  <td className="p-2">{row.city}</td>
                  <td className="p-2">{row.contact}</td>
                  <td className="p-2">{row.phone}</td>
                  <td className="p-2">{row.email}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button title="Edit" className="px-2 py-1 border rounded" onClick={() => startEdit(row)}>✎</button>
                      <button title="Delete" className="px-2 py-1 border rounded" onClick={() => remove(row.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td className="p-4 text-center text-gray-500" colSpan={9}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t flex items-center justify-end gap-2 text-sm">
          <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◂</button>
          <span className="px-2 py-1 border rounded bg-white">{page}</span>
          <button className="px-2 py-1 border rounded" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▸</button>
        </div>
      </div>
    </div>
  );
}