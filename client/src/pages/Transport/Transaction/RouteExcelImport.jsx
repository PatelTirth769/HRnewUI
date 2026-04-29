import React, { useState } from 'react';
import { notification, Select, Upload, Button, Input } from 'antd';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { FiDownload, FiUploadCloud, FiFileText, FiCheckCircle, FiChevronRight, FiFolder } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// Firebase collection path
const ALLOCATIONS_PATH = 'schooler_system/transport_management/student_allocations';

export default function RouteExcelImport() {
    const [fileList, setFileList] = useState([]);
    const [importing, setImporting] = useState(false);
    const [criteria, setCriteria] = useState('Only route pending all student');

    const downloadTemplate = () => {
        const templateData = [
            {
                "Student ID": "STU/2026/001",
                "Student Name": "John Doe",
                "Admission No": "ADM101",
                "Route ID": "ROUTE_ID",
                "Stop ID": "STOP_ID",
                "Effective From": "2026-04-01",
                "Status": "Active"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Allocation Template");
        const wscols = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, "Route_Allocation_Template.xlsx");
        notification.success({ message: 'Template downloaded successfully!' });
    };

    const handleImport = async () => {
        if (fileList.length === 0) {
            notification.warning({ message: 'Please select an Excel file first' });
            return;
        }

        const file = fileList[0].originFileObj;
        const reader = new FileReader();
        setImporting(true);

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    notification.error({ message: 'Excel file is empty' });
                    setImporting(false);
                    return;
                }

                const batch = writeBatch(db);
                const colRef = collection(db, ALLOCATIONS_PATH);
                let count = 0;

                for (const row of jsonData) {
                    const studentId = row['Student ID'];
                    const routeId = row['Route ID'];
                    if (!studentId || !routeId) continue;

                    const docRef = doc(colRef);
                    batch.set(docRef, {
                        student_id: studentId,
                        student_name: row['Student Name'] || '',
                        admission_no: row['Admission No'] || '',
                        route_id: routeId,
                        stop_id: row['Stop ID'] || '',
                        effective_from: row['Effective From'] || dayjs().format('YYYY-MM-DD'),
                        status: row['Status'] || 'Active',
                        import_criteria: criteria,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        imported: true
                    });
                    count++;
                }

                if (count > 0) {
                    await batch.commit();
                    notification.success({ message: 'Import Successful', description: `Allocated routes to ${count} students.` });
                    setFileList([]);
                } else {
                    notification.warning({ message: 'No valid records found' });
                }
            } catch (err) {
                notification.error({ message: 'Import Failed' });
            } finally {
                setImporting(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Breadcrumbs & Title */}
            <div className="flex flex-col mb-8">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <FiFolder className="w-3 h-3" />
                    <span>Home</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span>Transport</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span className="text-blue-600">Allocate Route Excel</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Allocate Route Excel</h1>
            </div>

            {/* Main Action Bar (Matches User Screenshot Layout) */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="space-y-6">
                    {/* Criteria Selection Row */}
                    <div className="flex flex-col max-w-md">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                            Select Criteria <span className="text-red-500">*</span>
                        </label>
                        <Select
                            className="w-full h-11"
                            value={criteria}
                            onChange={setCriteria}
                            options={[
                                { value: 'Only route pending all student', label: 'Only route pending all student' },
                                { value: 'All Students', label: 'All Students (Override Existing)' }
                            ]}
                        />
                    </div>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* Action Row: Download | File | Import */}
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        {/* Download Column */}
                        <div className="flex-none">
                            <Button 
                                type="primary"
                                icon={<FiDownload />}
                                onClick={downloadTemplate}
                                className="h-11 px-8 rounded-xl bg-[#599eb8] hover:bg-[#4a8a9f] border-none font-bold text-sm"
                            >
                                Download
                            </Button>
                        </div>

                        {/* File Selection Column */}
                        <div className="flex-1 w-full">
                            <div className="flex gap-0">
                                <Input 
                                    className="h-11 rounded-l-xl bg-gray-50 font-medium text-gray-600 border-r-0" 
                                    value={fileList.length > 0 ? fileList[0].name : "Please select file"} 
                                    readOnly 
                                />
                                <Upload
                                    beforeUpload={(file) => { setFileList([file]); return false; }}
                                    fileList={fileList}
                                    showUploadList={false}
                                >
                                    <Button className="h-11 rounded-r-xl bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-700 font-bold px-6 flex items-center gap-2">
                                        <FiUploadCloud className="w-4 h-4" />
                                        Choose File
                                    </Button>
                                </Upload>
                            </div>
                        </div>

                        {/* Import Column */}
                        <div className="flex-none">
                            <Button 
                                type="primary"
                                icon={importing ? null : <FiCheckCircle />}
                                onClick={handleImport}
                                loading={importing}
                                disabled={fileList.length === 0}
                                className="h-11 px-10 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] border-none font-bold text-sm shadow-lg shadow-green-100"
                            >
                                Import Excel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Info */}
            <div className="mt-8 flex items-center gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-2">
                <span>Powered by : Microweb Solutions ®</span>
            </div>
        </div>
    );
}
