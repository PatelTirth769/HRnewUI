import React, { useRef, useState } from 'react';
import { Button, Upload, message, Card, Progress, Typography, Alert, List, DatePicker, Select } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ImportAttendance() {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [company, setCompany] = useState('BOMBAIM');

  // Template generation state
  const [templateFromDate, setTemplateFromDate] = useState(dayjs());
  const [templateToDate, setTemplateToDate] = useState(dayjs());
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const generateTemplate = async () => {
    if (!templateFromDate || !templateToDate) {
      message.error("Please select both From and To dates for the template.");
      return;
    }

    setGeneratingTemplate(true);
    try {
      // 1. Fetch all active employees
      const response = await api.get(`/api/resource/Employee?fields=["name","employee_name","company","naming_series"]&filters=[["status","=","Active"]]&limit_page_length=0`);
      const employees = response.data.data;

      if (!employees || employees.length === 0) {
        message.warning("No active employees found to populate the template.");
        setGeneratingTemplate(false);
        return;
      }

      // 2. Prepare Data Rows
      const rows = [];

      // Header comments removed as per user request - moved to UI

      // Header Row
      const headers = ["ID", "Employee", "Employee Name", "Date", "Status", "Leave Type", "Company", "Naming Series"];
      rows.push(headers);

      // 3. Generate rows: For each day in range -> For each employee
      let currentDate = templateFromDate.clone();
      const endDate = templateToDate.clone();

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dateStr = currentDate.format('DD-MM-YYYY'); // Format as requested

        employees.forEach(emp => {
          rows.push([
            "", // ID (empty for new)
            emp.name,
            emp.employee_name,
            dateStr,
            "", // Status (empty for user to fill)
            "", // Leave Type
            emp.company,
            // Use default Attendance Naming Series, not Employee's series
            "HR-ATT-.YYYY.-"
          ]);
        });

        currentDate = currentDate.add(1, 'day');
      }

      // 4. Create Sheet
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Adjust column widths roughly
      ws['!cols'] = [
        { wch: 15 }, // ID
        { wch: 15 }, // Employee
        { wch: 25 }, // Name
        { wch: 12 }, // Date
        { wch: 15 }, // Status
        { wch: 15 }, // Leave Type
        { wch: 20 }, // Company
        { wch: 20 }  // Naming Series
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AttendanceTemplate");
      XLSX.writeFile(wb, `Attendance_Template_${templateFromDate.format('DD-MM')}_to_${templateToDate.format('DD-MM')}.xlsx`);

      message.success("Template generated successfully!");
    } catch (error) {
      console.error(error);
      message.error("Failed to generate template. check console.");
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const processFile = async () => {
    if (fileList.length === 0) {
      message.error("Please select a file first.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setLogs([]);

    const file = fileList[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // No need to skip rows anymore since notes are removed
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          message.error("File is empty or invalid format.");
          setUploading(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const total = jsonData.length;
        const newLogs = [];

        for (let i = 0; i < total; i++) {
          const row = jsonData[i];
          const rowNum = i + 2; // Excel row number (1-based, 1 header row)

          try {
            if (!row.Employee) {
              // Skip empty rows if any
              if (!row.Date && !row.Status) continue;
              throw new Error("Missing 'Employee' code");
            }

            // Parse Date
            let attendanceDate = row.Date;
            if (typeof row.Date === 'number') {
              attendanceDate = new Date(Math.round((row.Date - 25569) * 86400 * 1000)).toISOString().split('T')[0];
            } else if (typeof row.Date === 'string' && row.Date.includes('-')) {
              // Convert DD-MM-YYYY to YYYY-MM-DD for API
              const parts = row.Date.split('-');
              if (parts[2].length === 4) {
                attendanceDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }

            if (!attendanceDate || !dayjs(attendanceDate).isValid()) {
              throw new Error(`Invalid Date format: ${row.Date}`);
            }

            // If status is empty, skip or default?
            // ERPNext requires status. If empty, maybe assume Present or skip?
            // Let's skip if status is empty to allow user to only fill exceptions if they want,
            // BUT user asked to fill status. Let's error if empty.
            if (!row.Status) {
              // Actually, maybe just skip row if no status, so they don't have to delete rows?
              // No, typically 'Import' means 'Import this data'.
              // Let's default to Present if missing? Or throw error?
              // Screenshot says "Status should be one of these..."
              throw new Error("Status is required");
            }

            const payload = {
              employee: row.Employee,
              employee_name: row['Employee Name'],
              attendance_date: attendanceDate,
              status: row.Status,
              leave_type: row['Leave Type'] || null,
              company: row.Company || company,
              docstatus: 1, // Submit immediately
              naming_series: row['Naming Series'] || 'HR-ATT-.YYYY.-'
            };

            await api.post('/api/resource/Attendance', payload);

            successCount++;
            newLogs.push({ type: 'success', msg: `Row ${rowNum}: Marked ${row.Status} for ${row.Employee} on ${attendanceDate}` });
          } catch (error) {
            failCount++;
            const errMsg = error.response?.data?.exception || error.message;
            newLogs.push({ type: 'error', msg: `Row ${rowNum}: Failed - ${errMsg}` });
          }

          setProgress(Math.round(((i + 1) / total) * 100));
          if (i % 5 === 0) setLogs([...newLogs]);
        }

        setLogs(newLogs);
        message.success(`Import Complete. Success: ${successCount}, Failed: ${failCount}`);
      } catch (err) {
        console.error(err);
        message.error("Failed to parse file.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error(`${file.name} is not a valid Excel file`);
      }
      setFileList(isExcel ? [file] : []);
      return false;
    },
    fileList,
  };

  return (
    <div className="p-6">
      <Card title="Import Attendance" className="shadow-md">
        <div className="space-y-6">
          <Alert
            message="Instructions"
            description={
              <ul className="list-disc pl-4">
                <li>Select "From Date" and "To Date" to generate a template pre-filled with employees.</li>
                <li>Please do not change the template headings.</li>
                <li><strong>Status</strong> values: Present, Absent, On Leave, Half Day, Work From Home.</li>
                <li>If Status is "On Leave", <strong>Leave Type</strong> is MANDATORY.</li>
                <li>If you are overwriting existing attendance records, <strong>'ID'</strong> column is mandatory.</li>
                <li><strong>Date</strong> format: DD-MM-YYYY (default in template).</li>
              </ul>
            }
            type="info"
            showIcon
          />

          {/* Template Generation Section */}
          <div className="p-4 border rounded bg-gray-50">
            <Title level={5}>1. Download Template</Title>
            <div className="flex gap-4 items-end mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <DatePicker
                  value={templateFromDate}
                  onChange={setTemplateFromDate}
                  format="DD-MM-YYYY"
                  allowClear={false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <DatePicker
                  value={templateToDate}
                  onChange={setTemplateToDate}
                  format="DD-MM-YYYY"
                  allowClear={false}
                />
              </div>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={generateTemplate}
                loading={generatingTemplate}
                className="bg-white text-blue-600 border-blue-600 hover:text-blue-700 hover:border-blue-700"
              >
                Generate Template
              </Button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="p-4 border rounded bg-gray-50">
            <Title level={5}>2. Import Data</Title>
            <div className="flex gap-4 mt-2">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
              <Button
                type="primary"
                onClick={processFile}
                disabled={fileList.length === 0}
                loading={uploading}
                icon={<FileExcelOutlined />}
              >
                Start Import
              </Button>
            </div>
            {uploading && <Progress percent={progress} status="active" className="mt-2" />}
          </div>

          {logs.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto border rounded p-2 bg-white">
              <List
                size="small"
                dataSource={logs}
                renderItem={item => (
                  <List.Item className={item.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                    {item.msg}
                  </List.Item>
                )}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}