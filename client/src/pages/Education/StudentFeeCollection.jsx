import React, { useState, useEffect } from 'react';
import { Table, notification, Select, Button, Space, Card, Statistic } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const StudentFeeCollection = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [filters, setFilters] = useState({
        academic_year: '',
        program: '',
        student_group: '',
    });

    const [dropdowns, setDropdowns] = useState({
        academicYears: [],
        programs: [],
        studentGroups: [],
    });

    useEffect(() => {
        fetchDropdowns();
        fetchReport();
    }, []);

    const fetchDropdowns = async () => {
        try {
            const safeGet = (url) => API.get(url).catch(err => ({ data: { data: [] } }));
            const [yRes, pRes, gRes] = await Promise.all([
                safeGet('/api/resource/Academic Year?limit_page_length=None'),
                safeGet('/api/resource/Program?limit_page_length=None'),
                safeGet('/api/resource/Student Group?limit_page_length=None'),
            ]);
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                studentGroups: gRes.data.data?.map(d => d.name) || [],
            });
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Use POST for query_report.run as filters can be complex
            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Student Fee Collection',
                filters: filters
            });
            
            if (res.data.message) {
                const { result, columns: reportCols } = res.data.message;
                
                // Map columns to Ant Design table columns
                const mappedCols = (reportCols || []).map(col => {
                    const label = typeof col === 'string' ? col : col.label;
                    const fieldname = typeof col === 'string' ? col : col.fieldname;
                    
                    return {
                        title: label,
                        dataIndex: fieldname,
                        key: fieldname,
                        render: (text) => {
                           if (typeof text === 'number' && !fieldname.toLowerCase().includes('year')) {
                               return text.toLocaleString(undefined, { minimumFractionDigits: 2 });
                           }
                           return text || '-';
                        },
                        sorter: (a, b) => {
                            if (typeof a[fieldname] === 'number') return a[fieldname] - b[fieldname];
                            return (a[fieldname] || '').toString().localeCompare((b[fieldname] || '').toString());
                        }
                    };
                });

                setColumns(mappedCols);
                setData(result || []);
            }
        } catch (err) {
            console.error('Report Error:', err);
            const serverMsg = err.response?.data?._server_messages || err.message;
            notification.error({ message: 'Failed to Fetch Live Data', description: serverMsg });
            setData([]); // Clear data if fetch fails
        } finally {
            setLoading(false);
        }
    };

    const totals = data.reduce((acc, curr) => ({
        total: acc.total + (parseFloat(curr.total_amount || curr.grand_total || 0)),
        paid: acc.paid + (parseFloat(curr.paid_amount || 0)),
        outstanding: acc.outstanding + (parseFloat(curr.outstanding || curr.outstanding_amount || 0))
    }), { total: 0, paid: 0, outstanding: 0 });

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-800">Student Fee Collection Report</h1>
                <Button type="default" onClick={() => fetchReport()} loading={loading}>Refresh</Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-gray-100">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Academic Year</label>
                        <Select 
                            className="w-48 block" 
                            placeholder="Select" 
                            value={filters.academic_year} 
                            onChange={v => setFilters(p => ({ ...p, academic_year: v }))}
                        >
                            <Option value="">All Years</Option>
                            {dropdowns.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Program</label>
                        <Select 
                            className="w-64 block" 
                            placeholder="Select" 
                            value={filters.program} 
                            onChange={v => setFilters(p => ({ ...p, program: v }))}
                        >
                            <Option value="">All Programs</Option>
                            {dropdowns.programs.map(p => <Option key={p} value={p}>{p}</Option>)}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student Group</label>
                        <Select 
                            className="w-56 block" 
                            placeholder="Select" 
                            value={filters.student_group} 
                            onChange={v => setFilters(p => ({ ...p, student_group: v }))}
                        >
                            <Option value="">All Groups</Option>
                            {dropdowns.studentGroups.map(g => <Option key={g} value={g}>{g}</Option>)}
                        </Select>
                    </div>
                    <Button type="primary" className="bg-blue-600 px-6 font-medium" onClick={() => fetchReport()}>Apply Filters</Button>
                </div>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6">
                 <Card shadow="sm" className="border-l-4 border-l-blue-500">
                    <Statistic title="Total Fees Projected" value={totals.total} precision={2} prefix="₹" />
                 </Card>
                 <Card shadow="sm" className="border-l-4 border-l-green-500">
                    <Statistic title="Total Fees Collected" value={totals.paid} precision={2} prefix="₹" />
                 </Card>
                 <Card shadow="sm" className="border-l-4 border-l-red-500">
                    <Statistic title="Oustanding Balance" value={totals.outstanding} precision={2} prefix="₹" />
                 </Card>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={data} 
                    loading={loading}
                    rowKey={(r, i) => r.name || i}
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    scroll={{ x: 'max-content' }}
                    className="report-table"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .report-table .ant-table-thead > tr > th { 
                    background: #f8fafc !important; 
                    font-size: 11px; 
                    color: #64748b; 
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .report-table .ant-table-row { font-size: 13px; }
            `}} />
        </div>
    );
};

export default StudentFeeCollection;
