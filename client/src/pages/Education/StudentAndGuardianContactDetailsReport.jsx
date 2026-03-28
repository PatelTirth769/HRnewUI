import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Select, Button, notification, Typography, Spin, Empty } from 'antd';
import { ReloadOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const StudentAndGuardianContactDetailsReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingMasters, setFetchingMasters] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        academic_year: '',
        program: '',
        student_batch_name: ''
    });

    const [masters, setMasters] = useState({
        academicYears: [],
        programs: [],
        batches: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        setFetchingMasters(true);
        try {
            const [ayRes, prgRes, batchRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Program?limit_page_length=None'),
                API.get('/api/resource/Student Batch Name?limit_page_length=None')
            ]);
            setMasters({
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                programs: prgRes.data.data?.map(d => d.name) || [],
                batches: batchRes.data.data?.map(d => d.name) || []
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        } finally {
            setFetchingMasters(false);
        }
    };

    const runReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const reportFilters = {};
            if (filters.academic_year) reportFilters.academic_year = filters.academic_year;
            if (filters.program) reportFilters.program = filters.program;
            if (filters.student_batch_name) reportFilters.student_batch_name = filters.student_batch_name;

            const res = await API.get(`/api/method/frappe.desk.query_report.run?report_name=Student and Guardian Contact Details&filters=${JSON.stringify(reportFilters)}`);
            
            if (res.data.message) {
                const { result, columns: reportCols } = res.data.message;
                
                // Format columns for Ant Design
                const formattedCols = reportCols.map(col => ({
                    title: col.label,
                    dataIndex: col.fieldname,
                    key: col.fieldname,
                    width: col.width || 150,
                    render: (text) => <span className="text-gray-700 text-[13px]">{text || '-'}</span>
                }));
                
                setColumns(formattedCols);
                setReportData(result || []);
            }
            
            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(6));
        } catch (err) {
            console.error('Error running report:', err);
            notification.error({ message: 'Report Failed', description: 'Could not fetch report data.' });
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5";

    return (
        <div className="p-6 max-w-7xl mx-auto pb-40">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Go Back">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Student and Guardian Contact Deta...</h2>
                </div>
                <div className="flex gap-2">
                    <Button icon={<ReloadOutlined />} onClick={runReport} loading={loading} />
                    <Button icon={<MoreOutlined />} />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
                <div className="p-4 grid grid-cols-3 gap-6 border-b border-gray-50 bg-[#fcfcfc]">
                    <div>
                        <Select 
                            className="w-full erp-report-select" 
                            placeholder="Academic Year"
                            showSearch
                            allowClear
                            value={filters.academic_year || undefined}
                            onChange={v => setFilters({...filters, academic_year: v})}
                        >
                            {masters.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <Select 
                            className="w-full erp-report-select" 
                            placeholder="Program"
                            showSearch
                            allowClear
                            value={filters.program || undefined}
                            onChange={v => setFilters({...filters, program: v})}
                        >
                            {masters.programs.map(p => <Option key={p} value={p}>{p}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <Select 
                            className="w-full erp-report-select" 
                            placeholder="Batch Name"
                            showSearch
                            allowClear
                            value={filters.student_batch_name || undefined}
                            onChange={v => setFilters({...filters, student_batch_name: v})}
                        >
                            {masters.batches.map(b => <Option key={b} value={b}>{b}</Option>)}
                        </Select>
                    </div>
                </div>

                {/* Report Content */}
                <div className="min-h-[400px] relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                            <Spin size="large" />
                        </div>
                    ) : null}

                    {reportData.length > 0 ? (
                        <Table 
                            columns={columns}
                            dataSource={reportData}
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content', y: 500 }}
                            className="erp-report-table"
                            rowKey={(record, index) => index}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                            <Text className="text-gray-400 font-medium text-lg">Please set filters</Text>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <Text className="text-[11px] text-gray-500">For comparison, use {`>5, <10 or =324`}. For ranges, use {`5:10`} (for values between 5 & 10).</Text>
                    <Text className="text-[11px] text-gray-500">Execution Time: {executionTime} sec</Text>
                </div>
            </div>

            <style jsx="true">{`
                .erp-report-select .ant-select-selector {
                    border-radius: 8px !important;
                    border: 1px solid #e5e7eb !important;
                    height: 36px !important;
                    padding: 0 12px !important;
                    background: white !important;
                    display: flex;
                    align-items: center;
                }
                .erp-report-table .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #6b7280;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 10px 16px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .erp-report-table .ant-table-tbody > tr > td {
                    padding: 10px 16px;
                    border-bottom: 1px solid #f3f4f6;
                }
            `}</style>
        </div>
    );
};

export default StudentAndGuardianContactDetailsReport;
