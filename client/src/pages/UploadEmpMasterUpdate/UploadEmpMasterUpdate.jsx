import React, { useState } from 'react';
import { Button, Upload, message, Card, Progress, Typography, Alert, List } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const { Title } = Typography;

const UploadEmpMasterUpdate = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);

  // Template Columns for Update
  // ID is mandatory to identify the record. Other fields are optional updates.
  const templateColumns = [
    "employee_id", "first_name", "last_name", "department", "designation",
    "status", "company_email", "cell_number", "grade", "branch"
  ];

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateColumns]);

    // Add dummy data
    XLSX.utils.sheet_add_aoa(ws, [[
      "HR-EMP-00001", "John", "Doe", "IT", "Senior Engineer",
      "Active", "john@example.com", "9876543210", "A", "Head Office"
    ]], { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "UpdateTemplate");
    XLSX.writeFile(wb, "Employee_Update_Template.xlsx");
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
          const rowNum = i + 2; // Excel row number

          try {
            if (!row.employee_id) {
              throw new Error("Missing 'employee_id'");
            }

            // Filter out empty fields so we don't overwrite existing data with blanks
            const payload = {};
            Object.keys(row).forEach(key => {
              if (key !== 'employee_id' && row[key] !== "") {
                const value = row[key];
                // Convert numbers to string to avoid backend "AttributeError: 'int' object has no attribute 'strip'"
                // This happens for fields like cell_number, grade, etc.
                payload[key] = (typeof value === 'number') ? String(value) : value;
              }
            });

            if (Object.keys(payload).length === 0) {
              throw new Error("No fields to update");
            }

            // API Update Call
            await api.put(`/api/resource/Employee/${row.employee_id}`, payload);

            successCount++;
            newLogs.push({ type: 'success', msg: `Row ${rowNum}: Updated ${row.employee_id}` });
          } catch (error) {
            failCount++;
            const errMsg = error.response?.data?.exception || error.message;
            newLogs.push({ type: 'error', msg: `Row ${rowNum}: Failed (${row.employee_id || 'Unknown'}) - ${errMsg}` });
          }

          setProgress(Math.round(((i + 1) / total) * 100));
          if (i % 5 === 0) setLogs([...newLogs]);
        }

        setLogs(newLogs);
        message.success(`Update Complete. Success: ${successCount}, Failed: ${failCount}`);
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
      <Card title="Bulk Employee Master Update" className="shadow-md">
        <div className="space-y-6">
          <Alert
            message="Instructions"
            description={
              <ul>
                <li>Download the template.</li>
                <li><strong>employee_id</strong> is MANDATORY (e.g., HR-EMP-00001).</li>
                <li>Only fill columns you want to update. Leave others blank.</li>
                <li>Supported Formats: .xlsx, .xls</li>
              </ul>
            }
            type="warning"
            showIcon
          />

          <div className="flex gap-4">
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
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
              Start Update
            </Button>
          </div>

          {uploading && <Progress percent={progress} status="active" />}

          {logs.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
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
};

export default UploadEmpMasterUpdate;