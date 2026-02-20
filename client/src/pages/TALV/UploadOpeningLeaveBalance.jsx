import React, { useState, useEffect } from 'react';
import { notification, Table, Button, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function UploadOpeningLeaveBalance() {
  const [uploadType, setUploadType] = useState('opening');
  const [company, setCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [uploadLog, setUploadLog] = useState([]);

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    try {
      const [compRes, ltRes, empRes] = await Promise.all([
        API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
        API.get('/api/resource/Leave Type?fields=["name","max_leaves_allowed","is_carry_forward"]&limit_page_length=None'),
        API.get('/api/resource/Employee?fields=["name","employee_name","company","department"]&filters=[["status","=","Active"]]&limit_page_length=None')
      ]);
      if (compRes.data.data) {
        setCompanies(compRes.data.data.map(c => c.name));
        if (compRes.data.data.length > 0) setCompany(compRes.data.data[0].name);
      }
      if (ltRes.data.data) setLeaveTypes(ltRes.data.data);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const compEmps = employees.filter(e => !company || e.company === company);
    if (compEmps.length === 0) {
      notification.warning({ message: 'No employees found for selected company.' });
      return;
    }
    const ltNames = leaveTypes.map(lt => lt.name);

    if (uploadType === 'opening') {
      // Opening Leave Balance template
      const headers = ['Employee ID', 'Employee Name', 'Company', 'Opening Bal Date', ...ltNames];
      const rows = compEmps.map(emp => {
        const row = [emp.name, emp.employee_name, emp.company, dayjs().startOf('year').format('DD-MMM-YYYY')];
        ltNames.forEach(() => row.push(0));
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([
        ['Upload Opening Leave Balance Template'],
        ['Fill in the leave balance for each employee. Do not modify Employee ID or Company columns.'],
        ['Opening Bal Date: Enter the date from which the balance is effective (e.g., 01-Apr-2026).'],
        [],
        headers,
        ...rows
      ]);
      ws['!cols'] = headers.map((_, i) => ({ wch: i < 4 ? 20 : 15 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Opening Balance');
      XLSX.writeFile(wb, `OpeningLeaveBalance_Template_${dayjs().format('DDMMMYYHHmmss')}.xlsx`);
    } else if (uploadType === 'adjust') {
      // Leave Adjustment template
      const headers = ['Employee ID', 'Employee Name', 'Company', 'Leave Type', 'Adjustment (+/-)', 'From Date', 'To Date', 'Reason'];
      const rows = compEmps.slice(0, 3).map(emp => [emp.name, emp.employee_name, emp.company, ltNames[0] || '', 0, dayjs().format('DD-MMM-YYYY'), dayjs().format('DD-MMM-YYYY'), '']);
      const ws = XLSX.utils.aoa_to_sheet([
        ['Leave Adjustment Template'],
        ['Use positive values to credit leaves, negative values to debit.'],
        [],
        headers,
        ...rows
      ]);
      ws['!cols'] = headers.map(() => ({ wch: 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Adjustments');
      XLSX.writeFile(wb, `LeaveAdjustment_Template_${dayjs().format('DDMMMYYHHmmss')}.xlsx`);
    } else {
      // Leave Encashment template
      const headers = ['Employee ID', 'Employee Name', 'Company', 'Leave Type', 'Encashment Days', 'Encashment Date'];
      const rows = compEmps.slice(0, 3).map(emp => [emp.name, emp.employee_name, emp.company, ltNames[0] || '', 0, dayjs().format('DD-MMM-YYYY')]);
      const ws = XLSX.utils.aoa_to_sheet([
        ['Leave Encashment Template'],
        ['Enter the number of days to encash for each employee.'],
        [],
        headers,
        ...rows
      ]);
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Encashment');
      XLSX.writeFile(wb, `LeaveEncashment_Template_${dayjs().format('DDMMMYYHHmmss')}.xlsx`);
    }
    notification.success({ message: 'Template downloaded successfully!' });
  };

  // Parse uploaded file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });

        // Skip instruction rows (find the header row)
        let dataRows = jsonData;
        if (jsonData.length > 0 && jsonData[0]['Employee ID'] === undefined) {
          // Try to find the actual data start
          const allData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          let headerIdx = -1;
          for (let i = 0; i < allData.length; i++) {
            if (allData[i].includes('Employee ID')) {
              headerIdx = i;
              break;
            }
          }
          if (headerIdx >= 0) {
            const headers = allData[headerIdx];
            dataRows = [];
            for (let i = headerIdx + 1; i < allData.length; i++) {
              if (!allData[i][0]) continue;
              const row = {};
              headers.forEach((h, idx) => { row[h] = allData[i][idx] || ''; });
              dataRows.push(row);
            }
          }
        }

        setPreviewData(dataRows.map((r, i) => ({ ...r, key: i })));
        notification.info({ message: `Parsed ${dataRows.length} rows from file` });
      } catch (err) {
        notification.error({ message: 'Failed to parse file', description: err.message });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Upload to ERPNext
  const handleUpload = async () => {
    if (previewData.length === 0) {
      notification.warning({ message: 'No data to upload. Please select and parse a file first.' });
      return;
    }
    setUploading(true);
    const results = { success: 0, failed: 0, errors: [] };
    const ltNames = leaveTypes.map(lt => lt.name);
    const logEntry = {
      time: dayjs().format('DD-MMM-YYYY HH:mm:ss'),
      type: uploadType,
      file: selectedFile?.name || 'Unknown',
      total: previewData.length,
      success: 0,
      failed: 0,
    };

    try {
      if (uploadType === 'opening') {
        // Opening Balance: Create Leave Allocation for each employee + leave type
        for (const row of previewData) {
          const empId = row['Employee ID'];
          if (!empId) continue;

          // Parse the opening date
          let openingDate = dayjs().startOf('year').format('YYYY-MM-DD');
          if (row['Opening Bal Date']) {
            const parsed = dayjs(row['Opening Bal Date']);
            if (parsed.isValid()) openingDate = parsed.format('YYYY-MM-DD');
          }

          for (const lt of ltNames) {
            const leaves = parseFloat(row[lt]);
            if (!leaves || leaves === 0) continue;

            try {
              // Check if allocation already exists
              const existingRes = await API.get(`/api/resource/Leave Allocation?filters=[["employee","=","${empId}"],["leave_type","=","${lt}"],["from_date","=","${openingDate}"]]&fields=["name"]&limit_page_length=1`);

              if (existingRes.data.data && existingRes.data.data.length > 0) {
                // Update existing
                await API.put(`/api/resource/Leave Allocation/${existingRes.data.data[0].name}`, {
                  new_leaves_allocated: leaves,
                });
              } else {
                // Create new
                const toDate = dayjs(openingDate).endOf('year').format('YYYY-MM-DD');
                await API.post('/api/resource/Leave Allocation', {
                  employee: empId,
                  leave_type: lt,
                  from_date: openingDate,
                  to_date: toDate,
                  new_leaves_allocated: leaves,
                  docstatus: 1,
                });
              }
              results.success++;
            } catch (err) {
              results.failed++;
              const errMsg = err.response?.data?._server_messages || err.response?.data?.message || err.message;
              results.errors.push(`${empId} - ${lt}: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`);
            }
          }
        }
      } else if (uploadType === 'adjust') {
        // Leave Adjustments
        for (const row of previewData) {
          const empId = row['Employee ID'];
          const lt = row['Leave Type'];
          const adj = parseFloat(row['Adjustment (+/-)']);
          if (!empId || !lt || !adj) continue;

          let fromDate = dayjs().format('YYYY-MM-DD');
          let toDate = dayjs().endOf('year').format('YYYY-MM-DD');
          if (row['From Date']) {
            const p = dayjs(row['From Date']);
            if (p.isValid()) fromDate = p.format('YYYY-MM-DD');
          }
          if (row['To Date']) {
            const p = dayjs(row['To Date']);
            if (p.isValid()) toDate = p.format('YYYY-MM-DD');
          }

          try {
            await API.post('/api/resource/Leave Allocation', {
              employee: empId,
              leave_type: lt,
              from_date: fromDate,
              to_date: toDate,
              new_leaves_allocated: adj,
              docstatus: 1,
            });
            results.success++;
          } catch (err) {
            results.failed++;
            const errMsg = err.response?.data?._server_messages || err.message;
            results.errors.push(`${empId} - ${lt}: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`);
          }
        }
      } else {
        // Leave Encashment
        for (const row of previewData) {
          const empId = row['Employee ID'];
          const lt = row['Leave Type'];
          const days = parseFloat(row['Encashment Days']);
          if (!empId || !lt || !days) continue;

          let encashDate = dayjs().format('YYYY-MM-DD');
          if (row['Encashment Date']) {
            const p = dayjs(row['Encashment Date']);
            if (p.isValid()) encashDate = p.format('YYYY-MM-DD');
          }

          try {
            await API.post('/api/resource/Leave Encashment', {
              employee: empId,
              leave_type: lt,
              encashment_date: encashDate,
              encashable_days: days,
              docstatus: 1,
            });
            results.success++;
          } catch (err) {
            results.failed++;
            const errMsg = err.response?.data?._server_messages || err.message;
            results.errors.push(`${empId} - ${lt}: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`);
          }
        }
      }

      logEntry.success = results.success;
      logEntry.failed = results.failed;
      setUploadLog(prev => [logEntry, ...prev]);

      if (results.failed === 0) {
        notification.success({ message: `Upload complete! ${results.success} records processed successfully.` });
      } else {
        notification.warning({
          message: `Upload completed with errors`,
          description: `Success: ${results.success}, Failed: ${results.failed}. Check console for details.`,
          duration: 8,
        });
        console.warn('Upload errors:', results.errors);
      }
      setPreviewData([]);
      setSelectedFile(null);
    } catch (err) {
      notification.error({ message: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Preview columns
  const previewCols = previewData.length > 0
    ? Object.keys(previewData[0]).filter(k => k !== 'key').map(k => ({
      title: k, dataIndex: k, key: k, ellipsis: true,
      width: k === 'Employee ID' || k === 'Employee Name' ? 150 : 120,
    }))
    : [];

  // Upload log columns
  const logCols = [
    { title: 'File', dataIndex: 'file', key: 'file', width: 250 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: v => v === 'opening' ? 'Opening Balance' : v === 'adjust' ? 'Adjustment' : 'Encashment' },
    { title: 'Uploaded On', dataIndex: 'time', key: 'time', width: 180 },
    { title: 'Total Rows', dataIndex: 'total', key: 'total', width: 90, align: 'center' },
    { title: 'Success', dataIndex: 'success', key: 'success', width: 80, align: 'center', render: v => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
    { title: 'Failed', dataIndex: 'failed', key: 'failed', width: 80, align: 'center', render: v => <span style={{ color: v > 0 ? '#f5222d' : undefined, fontWeight: 600 }}>{v}</span> },
  ];

  const typeLabels = { opening: 'Opening Leave Balance', adjust: 'Leave Adjustments', encash: 'Leave Encashment' };

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} UPLOAD LEAVE BALANCE</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Upload Leave Balance</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Upload Type</label>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={uploadType === 'adjust'} onChange={() => setUploadType('adjust')} /> Leave Adjustments
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={uploadType === 'opening'} onChange={() => setUploadType('opening')} /> Opening Leave Balance
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={uploadType === 'encash'} onChange={() => setUploadType('encash')} /> Leave Encashment
              </label>
            </div>
          </div>

          {/* Company + Template */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Company *</label>
            <select className="border rounded px-2 py-2 w-full text-sm mb-3" value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">-- Select --</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className="text-xs font-semibold text-gray-600 block mb-1">Sample Template</label>
            <Button icon={<DownloadOutlined />} type="link" className="!text-orange-600 !px-0" onClick={handleDownloadTemplate}>
              Template for {typeLabels[uploadType]}
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Upload File</label>
            <div className="flex items-center gap-2">
              <input type="file" accept=".xlsx,.xls,.csv" className="border rounded px-2 py-1.5 text-sm flex-1"
                onChange={handleFileChange} key={selectedFile ? 'has-file' : 'no-file'} />
            </div>
            {selectedFile && (
              <div className="text-xs text-green-600 mt-1">✓ {selectedFile.name} ({previewData.length} rows parsed)</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 border-t pt-3">
          <Button type="primary" icon={<UploadOutlined />} onClick={handleUpload} loading={uploading}
            disabled={previewData.length === 0} className="bg-orange-500 hover:bg-orange-600 border-none">
            Upload {previewData.length > 0 ? `(${previewData.length} rows)` : ''}
          </Button>
          <Button onClick={() => { setSelectedFile(null); setPreviewData([]); }}>Cancel</Button>
        </div>

        {/* Notes */}
        <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded p-2">
          <strong>Notes:</strong>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Download the template first, fill in leave balances, then upload the file.</li>
            <li>Opening Bal Date: enter date in formats like 'dd-mmm-yyyy' (e.g., 01-Apr-2026).</li>
            <li>For Opening Balance: each leave type column should have the number of leaves to allocate.</li>
            <li>For Adjustments: use positive values to credit, negative to debit.</li>
            <li>Comp-Off leave cannot be uploaded — it is linked to Extra Working.</li>
          </ol>
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Preview ({previewData.length} rows)</h3>
            <Table columns={previewCols} dataSource={previewData} rowKey="key" size="small"
              bordered pagination={{ pageSize: 10 }} scroll={{ x: 'max-content' }} />
          </div>
        )}

        {/* Upload Log */}
        {uploadLog.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Upload History (This Session)</h3>
            <Table columns={logCols} dataSource={uploadLog.map((l, i) => ({ ...l, key: i }))} rowKey="key"
              size="small" bordered pagination={false} />
          </div>
        )}
      </div>
    </div>
  );
}