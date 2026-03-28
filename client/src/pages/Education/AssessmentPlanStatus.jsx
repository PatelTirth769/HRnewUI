import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Space, Card, Breadcrumb, DatePicker, Tag } from 'antd';
import { ReloadOutlined, FilterOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../../services/api';

const { Option } = Select;

const AssessmentPlanStatus = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    // Filter states
    const [filters, setFilters] = useState({
        assessment_group: '',
        schedule_upto: null,
    });

    // Master data for filters
    const [assessmentGroups, setAssessmentGroups] = useState([]);

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const res = await API.get('/api/resource/Assessment Group?limit_page_length=None');
            setAssessmentGroups(res.data.data?.map(d => d.name) || []);
        } catch (err) {
            console.error('Error fetching assessment groups:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const queryFilters = {
                ...filters,
                schedule_upto: filters.schedule_upto ? filters.schedule_upto.format('YYYY-MM-DD') : undefined
            };

            const res = await API.get('/api/method/frappe.desk.query_report.run', {
                params: {
                    report_name: 'Assessment Plan Status',
                    filters: JSON.stringify(queryFilters)
                }
            });

            if (res.data.message) {
                const { result, columns } = res.data.message;
                setReportData(result || []);
                
                // Format columns for Ant Design Table
                const formattedColumns = (columns || []).map(col => ({
                    title: typeof col === 'string' ? col : col.label,
                    dataIndex: typeof col === 'string' ? col : col.fieldname,
                    key: typeof col === 'string' ? col : col.fieldname,
                    render: (text) => {
                        if (typeof text === 'number') return text.toLocaleString();
                        return text || '-';
                    },
                    sorter: (a, b) => {
                        const field = typeof col === 'string' ? col : col.fieldname;
                        return (a[field] > b[field]) ? 1 : -1;
                    }
                }));
                setReportColumns(formattedColumns);
            }
        } catch (err) {
            console.error('Error running report:', err);
        } finally {
            setLoading(false);
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            assessment_group: '',
            schedule_upto: null,
        });
        setReportData([]);
    };

    return (
        <div className="p-6 bg-[#f8f9fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Assessment Plan Status</h1>
                    <Breadcrumb className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                        <Breadcrumb.Item>Education</Breadcrumb.Item>
                        <Breadcrumb.Item>Reports</Breadcrumb.Item>
                        <Breadcrumb.Item className="font-bold text-gray-900">Assessment Plan Status</Breadcrumb.Item>
                    </Breadcrumb>
                </div>
                <Space size="middle">
                    <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading} className="rounded-lg">Refresh</Button>
                    <Button icon={<DownloadOutlined />} className="rounded-lg">Export</Button>
                    <Button icon={<PrinterOutlined />} className="rounded-lg">Print</Button>
                </Space>
            </div>

            {/* Filter Section */}
            <Card className="mb-6 shadow-sm border-0 border-l-4 border-l-blue-500" bodyStyle={{ padding: '24px' }}>
                <div className="flex flex-wrap gap-8 items-end">
                    <div className="w-80">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Assessment Group</label>
                        <Select className="w-full" placeholder="Select Group" value={filters.assessment_group} onChange={v => handleFilterChange('assessment_group', v)} allowClear size="large">
                            {assessmentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                    <div className="w-64">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Scheduled Upto</label>
                        <DatePicker 
                            className="w-full" 
                            value={filters.schedule_upto} 
                            onChange={v => handleFilterChange('schedule_upto', v)} 
                            size="large"
                            placeholder="Select Date"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button type="primary" icon={<FilterOutlined />} onClick={fetchReport} className="bg-blue-600 font-bold shadow-lg px-8 border-0 hover:bg-blue-700 h-10 rounded-lg">Apply filters</Button>
                        <Button onClick={clearFilters} type="text" className="text-gray-400 hover:text-red-500 font-bold text-[11px] uppercase tracking-widest px-4 h-10">Clear All</Button>
                    </div>
                </div>
            </Card>

            {/* Hint Section */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="text-[11px] text-gray-400 italic">
                    For comparison, use {'>'}5, {'<'}10 or =324. For ranges, use 5:10 (for values between 5 & 10).
                </div>
                {reportData.length > 0 && (
                    <Tag color="blue" className="rounded-md px-3 font-bold border-0 shadow-sm">
                        {reportData.length} Assessment Plans Found
                    </Tag>
                )}
            </div>

            {/* Table Section */}
            <Card className="shadow-xl border-0 overflow-hidden rounded-2xl" bodyStyle={{ padding: 0 }}>
                <Table 
                    loading={loading}
                    dataSource={reportData}
                    columns={reportColumns}
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    rowKey={(record, index) => index}
                    className="assessment-status-table"
                    locale={{ emptyText: <div className="py-40 text-center flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-inner">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                        <span className="text-gray-400 font-medium tracking-wide">Nothing to show. Select filter criteria to begin.</span>
                    </div> }}
                    rowClassName={(record, index) => `hover:bg-blue-50/20 transition-all pointer-cursor ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                />
                {reportData.length > 0 && (
                    <div className="bg-white px-8 py-3 border-t text-[10px] text-gray-300 flex justify-end font-mono tracking-widest uppercase">
                        Execution Time: {executionTime} sec
                    </div>
                )}
            </Card>

            <style jsx="true">{`
                .assessment-status-table .ant-table-thead > tr > th {
                    background: #fbfcfe;
                    color: #6b7280;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.075em;
                    padding: 16px 24px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .assessment-status-table .ant-table-tbody > tr > td {
                    font-size: 13px;
                    color: #374151;
                    padding: 14px 24px;
                    border-bottom: 1px solid #f9fafb;
                }
                .ant-btn-primary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};

export default AssessmentPlanStatus;
