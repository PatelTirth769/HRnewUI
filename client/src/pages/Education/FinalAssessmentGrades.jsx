import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Space, Card, Breadcrumb, Tag } from 'antd';
import { ReloadOutlined, FilterOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Option } = Select;

const FinalAssessmentGrades = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    // Filter states
    const [filters, setFilters] = useState({
        academic_year: '',
        student_group: '',
        assessment_group: '',
    });

    // Master data for filters
    const [masters, setMasters] = useState({
        academicYears: [],
        studentGroups: [],
        assessmentGroups: [],
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [ayRes, sgRes, agRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Student Group?limit_page_length=None'),
                API.get('/api/resource/Assessment Group?limit_page_length=None'),
            ]);
            setMasters({
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                studentGroups: sgRes.data.data?.map(d => d.name) || [],
                assessmentGroups: agRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching masters:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const res = await API.get('/api/method/frappe.desk.query_report.run', {
                params: {
                    report_name: 'Final Assessment Grades',
                    filters: JSON.stringify(filters)
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
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(2));
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            academic_year: '',
            student_group: '',
            assessment_group: '',
        });
        setReportData([]);
    };

    return (
        <div className="p-6 bg-[#f8f9fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Final Assessment Grades</h1>
                    <Breadcrumb className="text-xs text-gray-500 mt-1">
                        <Breadcrumb.Item>Education</Breadcrumb.Item>
                        <Breadcrumb.Item>Reports</Breadcrumb.Item>
                        <Breadcrumb.Item className="font-semibold text-gray-700">Final Assessment Grades</Breadcrumb.Item>
                    </Breadcrumb>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading}>Refresh</Button>
                    <Button icon={<DownloadOutlined />}>Export</Button>
                    <Button icon={<PrinterOutlined />}>Print</Button>
                </Space>
            </div>

            {/* Filter Section */}
            <Card className="mb-6 shadow-sm border-0" bodyStyle={{ padding: '24px' }}>
                <div className="grid grid-cols-3 gap-8 items-end max-w-5xl">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Academic Year</label>
                        <Select className="w-full" placeholder="Select Year" value={filters.academic_year} onChange={v => handleFilterChange('academic_year', v)} allowClear size="middle">
                            {masters.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Student Group</label>
                        <Select className="w-full" placeholder="Select Group" value={filters.student_group} onChange={v => handleFilterChange('student_group', v)} allowClear size="middle">
                            {masters.studentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Assessment Group</label>
                        <Select className="w-full border-red-200" placeholder="Select Group" value={filters.assessment_group} onChange={v => handleFilterChange('assessment_group', v)} allowClear size="middle">
                            {masters.assessmentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-50">
                    <div className="flex gap-3">
                        <Button type="primary" icon={<FilterOutlined />} onClick={fetchReport} className="bg-gray-900 font-bold shadow-md px-8 border-0 hover:bg-gray-800 h-10">Apply Filters</Button>
                        <Button onClick={clearFilters} type="text" className="text-gray-400 hover:text-red-500 font-bold text-[11px] uppercase tracking-widest px-4">Clear All</Button>
                    </div>
                    {reportData.length > 0 && <Tag color="indigo" className="rounded-full px-4 py-1 font-bold border-0 shadow-sm">{reportData.length} Records Calculated</Tag>}
                </div>
            </Card>

            {/* Table Section */}
            <Card className="shadow-lg border-0 overflow-hidden rounded-xl" bodyStyle={{ padding: 0 }}>
                <Table 
                    loading={loading}
                    dataSource={reportData}
                    columns={reportColumns}
                    pagination={{ pageSize: 25, showSizeChanger: true }}
                    rowKey={(record, index) => index}
                    className="premium-report-table"
                    locale={{ emptyText: <div className="py-32 text-gray-400 italic font-medium flex flex-col items-center gap-4">
                        <FilterOutlined className="text-4xl text-gray-200" />
                        <span>Filter by Academic Year and Assessment Group to load grades</span>
                    </div> }}
                    rowClassName="hover:bg-blue-50/20 transition-all pointer-cursor border-b last:border-0"
                />
                {reportData.length > 0 && (
                    <div className="bg-gray-50 px-8 py-3 border-t text-[11px] text-gray-400 flex justify-end font-mono tracking-tighter italic">
                        SYNCED WITH ERPNEXT IN {executionTime}s
                    </div>
                )}
            </Card>

            <style jsx="true">{`
                .premium-report-table .ant-table-thead > tr > th {
                    background: #ffffff;
                    color: #111827;
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.05em;
                    padding: 16px 24px;
                    border-bottom: 2px solid #f3f4f6;
                }
                .premium-report-table .ant-table-tbody > tr > td {
                    font-size: 13px;
                    color: #4b5563;
                    padding: 14px 24px;
                }
                .premium-report-table .ant-table-tbody > tr:nth-child(even) {
                    background-color: #fafbfc;
                }
            `}</style>
        </div>
    );
};

export default FinalAssessmentGrades;
