import React, { useEffect, useMemo, useState } from 'react';
import ReportTable from '../../components/report/ReportTable.jsx';
import EmployeeReportExport from '../../components/report/EmployeeReportExport.jsx';

const EmployeeReportView = () => {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${Config.baseUrl}/api/actions/meta?table=Employee`);
        const j = await r.json();
        if (j && j.fields) setFields(j.fields);
      } catch (e) { }
    };
    load();
  }, []);

  const addCol = (c) => {
    if (!selected.includes(c)) setSelected([...selected, c]);
  };
  const removeCol = (c) => setSelected(selected.filter((s) => s !== c));

  const [reportOpen, setReportOpen] = useState(false);
  const generate = async () => {
    setReportOpen(true);
  };

  const columns = useMemo(() => selected.map((s) => ({ title: s, dataIndex: s, key: s })), [selected]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xl font-semibold">Employee Report Generator</div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={generate}>Generate Report</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-soft">
          <div className="text-sm mb-2">Employee Tree</div>
          <div className="border rounded">
            <div className="px-3 py-2 text-sm">Employee Details</div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {fields.map((f) => (
                <button key={f} className="px-2 py-1 text-xs border rounded" onClick={() => addCol(f)}>+ {f}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-soft">
          <div className="text-sm mb-2">Details</div>
          {selected.length === 0 ? (
            <div className="text-gray-400 text-sm py-16 text-center">Select a node to view details</div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {selected.map((s) => (
                  <span key={s} className="px-2 py-1 bg-gray-100 border rounded text-xs flex items-center gap-2">{s}<button className="text-red-600" onClick={() => removeCol(s)}>×</button></span>
                ))}
              </div>
              <ReportTable data={rows} columns={columns} loading={loading} />
            </div>
          )}
        </div>
      </div>
      <EmployeeReportExport reportOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
};

export default EmployeeReportView;
