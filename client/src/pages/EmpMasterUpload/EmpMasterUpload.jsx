import React, { useState } from 'react';
import { Button, Upload, Table, message, Card, Progress, Typography, Alert, List } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EmpMasterUpload = () => {
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);

    // Template Columns
    const templateColumns = [
        "first_name", "middle_name", "last_name", "gender", "date_of_birth", "date_of_joining",
        "company", "department", "designation", "employment_type", "status",
        "personal_email", "company_email", "cell_number", "current_address", "permanent_address"
    ];

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([templateColumns]);

        // Add some dummy data for guidance
        XLSX.utils.sheet_add_aoa(ws, [[
            "John", "D", "Doe", "Male", "1990-01-01", "2024-01-01",
            "BOMBAIM", "IT", "Software Engineer", "Full-time", "Active",
            "john.doe@example.com", "john.doe@company.com", "9876543210", "123 Main St", "123 Main St"
        ]], { origin: -1 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "EmployeeTemplate");
        XLSX.writeFile(wb, "Employee_Master_Template.xlsx");
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
                    const rowNum = i + 2; // Excel row number (1-header)

                    try {
                        // Basic Validation
                        if (!row.first_name || !row.company || !row.date_of_joining) {
                            throw new Error("Missing mandatory fields (First Name, Company, DOJ)");
                        }

                        // Convert dates if they are Excel serial numbers
                        // Simple check if it looks like a number, otherwise assume string YYYY-MM-DD
                        // Note: This is simplified. Robust implementations need better date parsing.
                        const formatDate = (val) => {
                            if (!val) return null;
                            if (typeof val === 'number') {
                                // Excel date to JS Date
                                return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                            }
                            return val; // Assume YYYY-MM-DD string
                        };

                        const payload = {
                            first_name: row.first_name,
                            middle_name: row.middle_name,
                            last_name: row.last_name,
                            gender: row.gender,
                            date_of_birth: formatDate(row.date_of_birth),
                            date_of_joining: formatDate(row.date_of_joining),
                            company: row.company,
                            department: row.department,
                            designation: row.designation,
                            employment_type: row.employment_type || 'Full-time',
                            status: row.status || 'Active',
                            personal_email: row.personal_email,
                            company_email: row.company_email,
                            cell_number: row.cell_number,
                            current_address: row.current_address,
                            permanent_address: row.permanent_address,
                            doctype: "Employee"
                        };

                        // API Call
                        await api.post('/api/resource/Employee', payload);

                        successCount++;
                        newLogs.push({ type: 'success', msg: `Row ${rowNum}: Created ${row.first_name} ${row.last_name}` });
                    } catch (error) {
                        failCount++;
                        const errMsg = error.response?.data?.exception || error.message;
                        newLogs.push({ type: 'error', msg: `Row ${rowNum}: Failed - ${errMsg}` });
                    }

                    // Update Progress
                    setProgress(Math.round(((i + 1) / total) * 100));
                    // Update logs every 5 rows to avoid too many re-renders
                    if (i % 5 === 0) setLogs([...newLogs]);
                }

                setLogs(newLogs); // Final logs
                message.success(`Upload Complete. Success: ${successCount}, Failed: ${failCount}`);
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
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                message.error(`${file.name} is not a valid Excel file`);
            }
            setFileList(isExcel ? [file] : []);
            return false; // Prevent auto upload
        },
        fileList,
    };

    return (
        <div className="p-6">
            <Card title="Bulk Employee Master Upload" className="shadow-md">
                <div className="space-y-6">
                    <Alert
                        message="Instructions"
                        description={
                            <ul>
                                <li>Download the template file.</li>
                                <li>Fill in the employee details. Dates should be YYYY-MM-DD.</li>
                                <li>Mandatory: First Name, Company, Date of Joining.</li>
                                <li>Supported Formats: .xlsx, .xls</li>
                                <li>Do not modify the header row.</li>
                            </ul>
                        }
                        type="info"
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
                            Start Upload
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

export default EmpMasterUpload;
