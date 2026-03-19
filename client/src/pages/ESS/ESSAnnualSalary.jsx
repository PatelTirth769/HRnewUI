import React, { useState, useEffect } from 'react';
import { Table, notification } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSAnnualSalary({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [fromDate, setFromDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

    useEffect(() => {
        if (employeeData?.name) {
            handleGenerate();
        }
    }, [employeeData, fromDate, toDate]);

    const handleGenerate = async () => {
        if (!employeeData?.name) return;
        setLoading(true);
        try {
            const filters = [
                ["employee", "=", employeeData.name],
                ["start_date", ">=", fromDate],
                ["end_date", "<=", toDate],
                ["status", "!=", "Cancelled"]
            ];

            const res = await API.get('/api/resource/Salary Slip', {
                params: {
                    fields: '["name", "start_date", "end_date", "gross_pay", "total_deduction", "net_pay", "status"]',
                    filters: JSON.stringify(filters),
                    limit_page_length: 100,
                    order_by: 'start_date desc'
                }
            });

            const slips = res.data?.data || [];
            
            const tableCols = [
                {
                    title: 'Slip ID',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => <span className="font-medium text-blue-600">{text}</span>
                },
                {
                    title: 'From Date',
                    dataIndex: 'start_date',
                    key: 'start_date',
                    render: (date) => dayjs(date).format('DD MMM YYYY')
                },
                {
                    title: 'To Date',
                    dataIndex: 'end_date',
                    key: 'end_date',
                    render: (date) => dayjs(date).format('DD MMM YYYY')
                },
                {
                    title: 'Gross Pay',
                    dataIndex: 'gross_pay',
                    key: 'gross_pay',
                    align: 'right',
                    render: (val) => (val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                },
                {
                    title: 'Deductions',
                    dataIndex: 'total_deduction',
                    key: 'total_deduction',
                    align: 'right',
                    render: (val) => (val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                },
                {
                    title: 'Net Pay',
                    dataIndex: 'net_pay',
                    key: 'net_pay',
                    align: 'right',
                    render: (val) => (val || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                },
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                        let colorClass = 'bg-gray-100 text-gray-800';
                        if (status === 'Submitted') colorClass = 'bg-blue-100 text-blue-800';
                        if (status === 'Draft') colorClass = 'bg-yellow-100 text-yellow-800';
                        return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colorClass}`}>{status}</span>;
                    }
                }
            ];

            setColumns(tableCols);
            setData(slips.map((s, idx) => ({ ...s, key: s.name || idx })));
            
        } catch (error) {
            console.error(error);
            notification.error({ message: "Failed to load annual salary records" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Annual Salary</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">From:</span>
                        <input type="date" className="border rounded px-2 py-1 text-sm outline-none bg-gray-50 focus:ring-1 ring-orange-400" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">To:</span>
                        <input type="date" className="border rounded px-2 py-1 text-sm outline-none bg-gray-50 focus:ring-1 ring-orange-400" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    className="ess-salary-table"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-salary-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }
                .ess-salary-table .ant-table-cell { font-size: 13px; border-bottom: 1px solid #f3f4f6 !important; }
                .ess-salary-table .ant-table-row:hover .ant-table-cell { background: #fffcf9 !important; }
            `}} />
        </div>
    );
}
