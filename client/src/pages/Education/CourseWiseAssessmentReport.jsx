import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Space, Card, Breadcrumb, Tag } from 'antd';
import { ReloadOutlined, FilterOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import API from '../../services/api';

const { Option } = Select;

const CourseWiseAssessmentReport = () => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    // Filter states
    const [filters, setFilters] = useState({
        academic_year: '',
        academic_term: '',
        course: '',
        student_group: '',
        assessment_group: '',
    });

    // Master data for filters
    const [masters, setMasters] = useState({
        academicYears: [],
        academicTerms: [],
        courses: [],
        studentGroups: [],
        assessmentGroups: [],
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [ayRes, atRes, cRes, sgRes, agRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None'),
                API.get('/api/resource/Academic Term?limit_page_length=None'),
                API.get('/api/resource/Course?limit_page_length=None'),
                API.get('/api/resource/Student Group?limit_page_length=None'),
                API.get('/api/resource/Assessment Group?limit_page_length=None'),
            ]);
            setMasters({
                academicYears: ayRes.data.data?.map(d => d.name) || [],
                academicTerms: atRes.data.data?.map(d => d.name) || [],
                courses: cRes.data.data?.map(d => d.name) || [],
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
                    report_name: 'Course wise Assessment Report',
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
            academic_term: '',
            course: '',
            student_group: '',
            assessment_group: '',
        });
        setReportData([]);
    };

    return (
        <div className="p-6 bg-[#f8f9fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Course wise Assessment Report</h1>
                    <Breadcrumb className="text-xs text-gray-500 mt-1">
                        <Breadcrumb.Item>Education</Breadcrumb.Item>
                        <Breadcrumb.Item>Reports</Breadcrumb.Item>
                        <Breadcrumb.Item className="font-semibold text-gray-700">Course wise Assessment Report</Breadcrumb.Item>
                    </Breadcrumb>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading}>Refresh</Button>
                    <Button icon={<DownloadOutlined />}>Export</Button>
                    <Button icon={<PrinterOutlined />}>Print</Button>
                </Space>
            </div>

            {/* Filter Section */}
            <Card className="mb-6 shadow-sm border-0" bodyStyle={{ padding: '16px' }}>
                <div className="grid grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Academic Year</label>
                        <Select className="w-full" placeholder="Select Year" value={filters.academic_year} onChange={v => handleFilterChange('academic_year', v)} allowClear>
                            {masters.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Academic Term</label>
                        <Select className="w-full" placeholder="Select Term" value={filters.academic_term} onChange={v => handleFilterChange('academic_term', v)} allowClear>
                            {masters.academicTerms.map(t => <Option key={t} value={t}>{t}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Course</label>
                        <Select className="w-full border-red-200" placeholder="Select Course" value={filters.course} onChange={v => handleFilterChange('course', v)} allowClear>
                            {masters.courses.map(c => <Option key={c} value={c}>{c}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Student Group</label>
                        <Select className="w-full" placeholder="Select Group" value={filters.student_group} onChange={v => handleFilterChange('student_group', v)} allowClear>
                            {masters.studentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Assessment Group</label>
                        <Select className="w-full border-red-200" placeholder="Select Group" value={filters.assessment_group} onChange={v => handleFilterChange('assessment_group', v)} allowClear>
                            {masters.assessmentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
                        <Button type="primary" icon={<FilterOutlined />} onClick={fetchReport} className="bg-blue-600 font-semibold shadow-md">Apply Filters</Button>
                        <Button onClick={clearFilters} type="text" className="text-gray-400 hover:text-red-500 font-bold text-[11px] uppercase tracking-widest">Clear All</Button>
                    </div>
                    {reportData.length > 0 && <Tag color="blue" className="rounded-full px-3 py-0.5 font-bold">{reportData.length} Records Found</Tag>}
                </div>
            </Card>

            {/* Table Section */}
            <Card className="shadow-md border-0 overflow-hidden" bodyStyle={{ padding: 0 }}>
                <Table 
                    loading={loading}
                    dataSource={reportData}
                    columns={reportColumns}
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    rowKey={(record, index) => index}
                    className="report-table"
                    locale={{ emptyText: <div className="py-24 text-gray-400 italic">Please set filters and apply to view assessment data</div> }}
                    rowClassName="hover:bg-blue-50/30 transition-colors pointer-cursor"
                />
                {reportData.length > 0 && (
                    <div className="bg-gray-50 px-6 py-2 border-t text-[10px] text-gray-400 flex justify-end font-mono">
                        Execution Time: {executionTime}s
                    </div>
                )}
            </Card>

            <style jsx="true">{`
                .report-table .ant-table-thead > tr > th {
                    background: #f8faff;
                    color: #4b5563;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.025em;
                }
                .report-table .ant-table-tbody > tr > td {
                    font-size: 13px;
                    color: #374151;
                    padding: 12px 16px;
                }
            `}</style>
        </div>
    );
};

export default CourseWiseAssessmentReport;
