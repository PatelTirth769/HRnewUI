import React, { useState, useEffect } from 'react';
import { Table, notification, DatePicker, Button, Card, Statistic } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const ProgramWiseFeeCollection = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [dates, setDates] = useState([dayjs().subtract(1, 'month'), dayjs()]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const filters = {
                from_date: dates[0].format('YYYY-MM-DD'),
                to_date: dates[1].format('YYYY-MM-DD'),
            };

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Program wise Fee Collection',
                filters: filters
            });
            
            if (res.data.message) {
                const { result, columns: reportCols } = res.data.message;
                
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
            notification.error({ message: 'Failed to Fetch Report', description: serverMsg });
            setData([]);
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
                <h1 className="text-2xl font-bold text-gray-800">Program wise Fee Collection</h1>
                <Button type="default" onClick={() => fetchReport()} loading={loading}>Refresh</Button>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-gray-100">
                <div className="flex flex-wrap gap-6 items-end">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date Range</label>
                        <RangePicker 
                            className="block" 
                            value={dates} 
                            onChange={setDates} 
                            allowClear={false}
                        />
                    </div>
                    <Button type="primary" className="bg-blue-600 px-6 font-medium" onClick={() => fetchReport()}>Generate Report</Button>
                </div>
            </Card>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6">
                 <Card shadow="sm" className="border-l-4 border-l-blue-400">
                    <Statistic title="Projected" value={totals.total} precision={2} prefix="₹" />
                 </Card>
                 <Card shadow="sm" className="border-l-4 border-l-green-400">
                    <Statistic title="Collected" value={totals.paid} precision={2} prefix="₹" />
                 </Card>
                 <Card shadow="sm" className="border-l-4 border-l-red-400">
                    <Statistic title="Outstanding" value={totals.outstanding} precision={2} prefix="₹" />
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

export default ProgramWiseFeeCollection;
