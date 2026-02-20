import React, { useState, useEffect } from 'react';
import { notification, Table, Button } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function UploadMonthlyLeaveBalance() {
  const [company, setCompany] = useState('');
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
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
        API.get('/api/resource/Leave Type?fields=["name"]&limit_page_length=None'),
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

  const monthStart = dayjs(`${month}-01`).startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs(`${month}-01`).endOf('month').format('YYYY-MM-DD');
  const monthLabel = dayjs(`${month}-01`).format('MMM-YYYY');

  // Download template
  const handleDownloadTemplate = () => {
    const compEmps = employees.filter(e => !company || e.company === company);
    if (compEmps.length === 0) {
      notification.warning({ message: 'No employees found for selected company.' });
      return;
    }
    const ltNames = leaveTypes.map(lt => lt.name);
    const headers = ['Employee ID', 'Employee Name', 'Company', 'Department', ...ltNames];

    const rows = compEmps.map(emp => {
      const row = [emp.name, emp.employee_name, emp.company, emp.department || ''];
      ltNames.forEach(() => row.push(0));
      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([
      [`Monthly Leave Balance Upload - ${monthLabel}`],
      [`Period: ${dayjs(monthStart).format('DD-MMM-YYYY')} To ${dayjs(monthEnd).format('DD-MMM-YYYY')}`],
      ['Enter the number of leaves to credit for each leave type. Use positive values to credit, negative to debit.'],
      [],
      headers,
      ...rows
    ]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 4 ? 22 : 15 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Balance');
    XLSX.writeFile(wb, `MonthlyLeaveBalance_${monthLabel}_Template.xlsx`);
    notification.success({ message: 'Template downloaded!' });
  };

  // Parse file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Find header row
        let headerIdx = -1;
        for (let i = 0; i < allData.length; i++) {
          if (allData[i].includes('Employee ID')) { headerIdx = i; break; }
        }

        if (headerIdx < 0) {
          notification.error({ message: 'Could not find header row with "Employee ID" column.' });
          return;
        }

        const headers = allData[headerIdx];
        const dataRows = [];
        for (let i = headerIdx + 1; i < allData.length; i++) {
          if (!allData[i][0]) continue;
          const row = {};
          headers.forEach((h, idx) => { row[h] = allData[i][idx] || ''; });
          dataRows.push(row);
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
      notification.warning({ message: 'No data to upload.' });
      return;
    }
    setUploading(true);
    const results = { success: 0, failed: 0, errors: [] };
    const ltNames = leaveTypes.map(lt => lt.name);

    try {
      for (const row of previewData) {
        const empId = row['Employee ID'];
        if (!empId) continue;

        for (const lt of ltNames) {
          const leaves = parseFloat(row[lt]);
          if (!leaves || leaves === 0) continue;

          try {
            // Check for existing allocation in this month
            const existingRes = await API.get(
              `/api/resource/Leave Allocation?filters=[["employee","=","${empId}"],["leave_type","=","${lt}"],["from_date","=","${monthStart}"]]&fields=["name","new_leaves_allocated"]&limit_page_length=1`
            );

            if (existingRes.data.data && existingRes.data.data.length > 0) {
              // Update existing allocation
              const existing = existingRes.data.data[0];
              const newTotal = (parseFloat(existing.new_leaves_allocated) || 0) + leaves;
              await API.put(`/api/resource/Leave Allocation/${existing.name}`, {
                new_leaves_allocated: newTotal,
              });
            } else {
              // Create new allocation for this month
              await API.post('/api/resource/Leave Allocation', {
                employee: empId,
                leave_type: lt,
                from_date: monthStart,
                to_date: monthEnd,
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

      const logEntry = {
        key: Date.now(),
        time: dayjs().format('DD-MMM-YYYY HH:mm:ss'),
        file: selectedFile?.name || 'Unknown',
        month: monthLabel,
        total: previewData.length,
        success: results.success,
        failed: results.failed,
      };
      setUploadLog(prev => [logEntry, ...prev]);

      if (results.failed === 0) {
        notification.success({ message: `Upload complete! ${results.success} leave allocations processed.` });
      } else {
        notification.warning({
          message: `Upload completed with errors`,
          description: `Success: ${results.success}, Failed: ${results.failed}`,
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
      width: k === 'Employee ID' || k === 'Employee Name' ? 150 : k === 'Department' || k === 'Company' ? 140 : 110,
    }))
    : [];

  // Log columns
  const logCols = [
    { title: 'File', dataIndex: 'file', key: 'file', width: 250 },
    { title: 'Month', dataIndex: 'month', key: 'month', width: 100 },
    { title: 'Uploaded On', dataIndex: 'time', key: 'time', width: 180 },
    { title: 'Employees', dataIndex: 'total', key: 'total', width: 90, align: 'center' },
    { title: 'Success', dataIndex: 'success', key: 'success', width: 80, align: 'center', render: v => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
    { title: 'Failed', dataIndex: 'failed', key: 'failed', width: 80, align: 'center', render: v => <span style={{ color: v > 0 ? '#f5222d' : undefined, fontWeight: 600 }}>{v}</span> },
  ];

  return (
    <div className="p-4">
      <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} UPLOAD MONTHLY LEAVE BALANCE</nav>
      <div className="bg-white rounded-md border p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Upload Monthly Leave Balance</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Company *</label>
            <select className="border rounded px-2 py-2 w-full text-sm" value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">-- Select --</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Month</label>
            <input type="month" className="border rounded px-2 py-2 w-full text-sm"
              value={month} onChange={(e) => setMonth(e.target.value)} />
            <div className="text-xs text-blue-600 mt-1">
              Period: {dayjs(monthStart).format('DD-MMM-YYYY')} To {dayjs(monthEnd).format('DD-MMM-YYYY')}
            </div>
          </div>
        </div>

        {/* Template + Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Sample Template</label>
            <Button icon={<DownloadOutlined />} type="link" className="!text-orange-600 !px-0" onClick={handleDownloadTemplate}>
              Template to Upload Monthly Leave Balance
            </Button>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Upload File</label>
            <div className="flex items-center gap-2">
              <input type="file" accept=".xlsx,.xls,.csv" className="border rounded px-2 py-1.5 text-sm flex-1"
                onChange={handleFileChange} key={selectedFile ? 'has' : 'no'} />
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
            <li>Download the template, fill monthly leave credits per employee, then upload.</li>
            <li>Each leave type column should have the number of leaves to credit for that month.</li>
            <li>Use positive values to credit, negative to debit.</li>
            <li>If an allocation already exists for the month, the values will be added to the existing allocation.</li>
          </ol>
        </div>

        {/* Preview */}
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
            <Table columns={logCols} dataSource={uploadLog} rowKey="key" size="small" bordered pagination={false} />
          </div>
        )}
      </div>
    </div>
  );
}