import React, { useState } from 'react';
import { notification, Select, Button, Input, Upload, Tabs } from 'antd';
import { FiDownload, FiUploadCloud, FiChevronRight, FiFileText, FiCheckCircle, FiInfo } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const { TabPane } = Tabs;

export default function TransportFeeImport() {
    const [downloadForm, setDownloadForm] = useState({
        criteria: 'All Students',
        feeComponent: 'Transport Fee',
        sorting: 'Point Wise (A to Z)'
    });
    const [fileList, setFileList] = useState([]);
    const [importing, setImporting] = useState(false);

    const handleDownload = () => {
        const dummyData = [
            { "Student ID": "STU001", "Student Name": "John Doe", "Route": "Route A", "Stop": "Stop 1", "Amount": 1500 },
            { "Student ID": "STU002", "Student Name": "Jane Smith", "Route": "Route B", "Stop": "Stop 5", "Amount": 1200 }
        ];

        const worksheet = XLSX.utils.json_to_sheet(dummyData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Template");
        XLSX.writeFile(workbook, `Transport_Fee_Template_${downloadForm.feeComponent}.xlsx`);
        notification.success({ message: 'Template downloaded successfully!' });
    };

    const handleImport = () => {
        if (fileList.length === 0) {
            notification.warning({ message: 'Please select an Excel file first' });
            return;
        }
        setImporting(true);
        setTimeout(() => {
            notification.success({ message: 'Import Success', description: 'Student fees have been updated successfully.' });
            setImporting(false);
            setFileList([]);
        }, 2000);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen pb-40">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    <span>Home</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span>Transport</span>
                    <FiChevronRight className="w-3 h-3" />
                    <span className="text-blue-600 font-black">Transport Fee Import</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Transport Fee Import</h1>
                <p className="text-gray-500 font-medium mt-2 leading-relaxed">Bulk update student transportation fees using a pre-populated Excel template.</p>
            </div>

            {/* Main Tabs Area */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/[0.02] overflow-hidden">
                <Tabs defaultActiveKey="1" className="premium-tabs">
                    <TabPane tab={<span className="flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-[11px]"><FiDownload /> Download Excel</span>} key="1">
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                        Select Criteria <span className="text-red-500">*</span>
                                    </label>
                                    <Select 
                                        className="w-full h-12" 
                                        value={downloadForm.criteria}
                                        onChange={val => setDownloadForm({...downloadForm, criteria: val})}
                                    >
                                        <Select.Option value="All Students">All Students</Select.Option>
                                        <Select.Option value="Route Wise">Route Wise</Select.Option>
                                        <Select.Option value="Point Wise">Point Wise</Select.Option>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                        Fee Component <span className="text-red-500">*</span>
                                    </label>
                                    <Select 
                                        className="w-full h-12" 
                                        value={downloadForm.feeComponent}
                                        onChange={val => setDownloadForm({...downloadForm, feeComponent: val})}
                                    >
                                        <Select.Option value="Transport Fee">Transport Fee</Select.Option>
                                        <Select.Option value="Bus Maintenance">Bus Maintenance</Select.Option>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                        Sorting By <span className="text-red-500">*</span>
                                    </label>
                                    <Select 
                                        className="w-full h-12" 
                                        value={downloadForm.sorting}
                                        onChange={val => setDownloadForm({...downloadForm, sorting: val})}
                                    >
                                        <Select.Option value="Point Wise (A to Z)">Point Wise (A to Z)</Select.Option>
                                        <Select.Option value="Route Wise (A to Z)">Route Wise (A to Z)</Select.Option>
                                        <Select.Option value="Admission No">Admission No</Select.Option>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-50 mt-4">
                                <Button 
                                    type="primary" 
                                    onClick={handleDownload}
                                    className="h-12 px-10 bg-[#599eb8] hover:bg-[#4a8a9f] border-none rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-100"
                                >
                                    <FiDownload /> Download
                                </Button>
                                <Button className="h-12 px-8 rounded-xl font-bold border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 transition-all">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane tab={<span className="flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-[11px]"><FiUploadCloud /> Upload Excel</span>} key="2">
                        <div className="p-10 space-y-10">
                            <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[2rem] p-16 text-center hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer group">
                                <Upload
                                    beforeUpload={(file) => { setFileList([file]); return false; }}
                                    fileList={fileList}
                                    showUploadList={false}
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <FiUploadCloud className="w-10 h-10 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 mb-1">Click to select or drag file here</h3>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Supports .XLSX and .CSV formats</p>
                                        </div>
                                        {fileList.length > 0 && (
                                            <div className="mt-4 px-6 py-2 bg-green-50 text-green-600 rounded-full font-bold text-xs flex items-center gap-2 border border-green-100">
                                                <FiFileText /> {fileList[0].name}
                                            </div>
                                        )}
                                    </div>
                                </Upload>
                            </div>

                            <div className="flex justify-center">
                                <Button 
                                    type="primary"
                                    onClick={handleImport}
                                    loading={importing}
                                    disabled={fileList.length === 0}
                                    className="h-14 px-16 bg-[#4CAF50] hover:bg-[#43A047] border-none rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-green-200 transition-all active:scale-95"
                                >
                                    {importing ? 'Processing Data...' : 'Import Fees'}
                                </Button>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </div>

            {/* Info Section */}
            <div className="mt-10 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-6 relative overflow-hidden">
                <FiInfo className="text-blue-500 w-10 h-10 shrink-0 mt-1 opacity-50" />
                <div className="relative z-10">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-2">Import Instructions</h4>
                    <ul className="text-xs text-blue-800 font-medium space-y-2 opacity-80 list-disc pl-4">
                        <li>Always download the fresh template before importing to ensure you have the latest student list.</li>
                        <li>Do not modify the "Student ID" column as it is used for mapping.</li>
                        <li>Ensure the fee amounts are numeric values only.</li>
                    </ul>
                </div>
            </div>

            <div className="mt-12 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                Powered by : Microweb Solutions ®
            </div>
        </div>
    );
}
