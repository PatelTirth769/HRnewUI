import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Select, DatePicker, Table, Spin, Empty, Checkbox } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiFilter } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import dayjs from 'dayjs';

const parseServerMessage = (err) => {
    const serverMsg = err?.response?.data?._server_messages;
    if (!serverMsg) return err?.message || 'Request failed';
    try {
        const parsed = JSON.parse(serverMsg);
        return typeof parsed?.[0] === 'string' ? parsed[0] : 'Request failed';
    } catch {
        return err?.message || 'Request failed';
    }
};

const FilterLabel = ({ label }) => (
    <span className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</span>
);

export default function PurchaseOrderAnalysis() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        company: localStorage.getItem('company') || '',
        from_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
        project: '',
        purchase_order: '',
        status: '',
        group_by_po: 0
    });

    const [masters, setMasters] = useState({
        companies: [],
        purchase_orders: [],
        projects: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [compRes, poRes, projRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Purchase Order?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Project?fields=["name"]&limit_page_length=200')
            ]);
            setMasters({
                companies: compRes.data?.data || [],
                purchase_orders: poRes.data?.data || [],
                projects: projRes.data?.data || []
            });
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const runReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const res = await API.get('/api/method/frappe.desk.query_report.run', {
                params: {
                    report_name: 'Purchase Order Analysis',
                    filters: JSON.stringify(filters)
                }
            });
            
            const results = res.data?.message?.result || [];
            const colDef = res.data?.message?.columns || [];
            
            const antCols = colDef.map(c => {
                let key = c.fieldname || c.label;
                return {
                    title: c.label,
                    dataIndex: key,
                    key: key,
                    render: (val) => {
                        if (typeof val === 'number') return val.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                        return val;
                    },
                    align: typeof (results[1]?.[key] || results[0]?.[key]) === 'number' ? 'right' : 'left'
                };
            });

            // Calculate chart data from the dataset
            const billed = results.reduce((sum, r) => sum + (parseFloat(r.billed_amount || r['Billed Amount']) || 0), 0);
            const toBill = results.reduce((sum, r) => sum + (parseFloat(r.amount_to_bill || r['Amount to Bill']) || 0), 0);
            
            setChartData([
                { name: 'Amount to Bill', value: toBill, color: '#E599B2' },
                { name: 'Billed Amount', value: billed, color: '#5478C4' }
            ]);

            setColumns(antCols);
            setReportData(results);
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
        } catch (err) {
            notification.error({ message: 'Report Execution Failed', description: parseServerMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, val) => {
        setFilters(p => ({ ...p, [key]: val }));
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto text-gray-800">
            <style>{`
                .report-select .ant-select-selector { border: none !important; background: #F3F4F6 !important; padding: 0 12px !important; height: 38px !important; border-radius: 6px !important; display: flex !important; align-items: center !important; }
                .report-date .ant-picker { border: none !important; background: #F3F4F6 !important; height: 38px !important; border-radius: 6px !important; width: 100%; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Purchase Order Analysis</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 border border-gray-200 rounded text-[13px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        Actions <FiMoreHorizontal />
                    </button>
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-gray-500" onClick={runReport} disabled={loading}>
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    </button>
                    <button className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors text-gray-500">
                        <FiMoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                <div className="p-6">
                    <div className="grid grid-cols-6 gap-4 mb-4">
                        <div className="col-span-1">
                            <Select
                                className="w-full report-select border border-red-50 rounded"
                                value={filters.company}
                                onChange={v => handleFilterChange('company', v)}
                                options={masters.companies.map(c => ({ value: c.name, label: c.name }))}
                            />
                        </div>
                        <div>
                            <DatePicker className="report-date" value={dayjs(filters.from_date)} onChange={d => handleFilterChange('from_date', d?.format('YYYY-MM-DD'))} />
                        </div>
                        <div>
                            <DatePicker className="report-date" value={dayjs(filters.to_date)} onChange={d => handleFilterChange('to_date', d?.format('YYYY-MM-DD'))} />
                        </div>
                        <div>
                            <Select
                                className="w-full report-select"
                                placeholder="Project"
                                allowClear
                                showSearch
                                value={filters.project || undefined}
                                onChange={v => handleFilterChange('project', v)}
                                options={masters.projects.map(p => ({ value: p.name, label: p.name }))}
                            />
                        </div>
                        <div>
                            <Select
                                className="w-full report-select"
                                placeholder="Purchase Order"
                                allowClear
                                showSearch
                                value={filters.purchase_order || undefined}
                                onChange={v => handleFilterChange('purchase_order', v)}
                                options={masters.purchase_orders.map(o => ({ value: o.name, label: o.name }))}
                            />
                        </div>
                        <div>
                            <Select
                                className="w-full report-select"
                                placeholder="Status"
                                allowClear
                                value={filters.status || undefined}
                                onChange={v => handleFilterChange('status', v)}
                                options={[{value:'To Bill',label:'To Bill'},{value:'To Receive',label:'To Receive'},{value:'Completed',label:'Completed'}]}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox checked={!!filters.group_by_po} onChange={e => handleFilterChange('group_by_po', e.target.checked ? 1 : 0)} />
                        <span className="text-[12px] text-gray-500 font-medium">Group by Purchase Order</span>
                    </div>
                </div>

                <div className="min-h-[500px] bg-[#fbfcfd] border-t border-gray-100 p-8 flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Analyzing Purchase Orders...</span>
                        </div>
                    ) : reportData.length > 0 ? (
                        <>
                            {/* Chart Area */}
                            <div className="flex justify-center mb-10 h-[280px] w-full items-center gap-20">
                                <div className="h-full w-[280px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={0}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={450}
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-4">
                                    {chartData.map((d, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }}></div>
                                            <div>
                                                <p className="text-[14px] font-bold text-gray-700">{d.name}</p>
                                                <p className="text-[12px] text-gray-400 font-mono tracking-tighter">
                                                    {d.value.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Table Area */}
                            <div className="w-full overflow-x-auto">
                                <Table 
                                    columns={columns} 
                                    dataSource={reportData} 
                                size="small" 
                                    pagination={false}
                                    rowKey={(record, idx) => idx}
                                    summary={(pageData) => {
                                        let totals = {};
                                        columns.forEach(col => {
                                            if (['Qty', 'Received Qty', 'Pending Qty', 'Billed Amount', 'Qty to Bill'].includes(col.title)) {
                                                totals[col.key] = pageData.reduce((acc, curr) => acc + (parseFloat(curr[col.key]) || 0), 0);
                                            }
                                        });
                                        return (
                                            <Table.Summary fixed>
                                                <Table.Summary.Row className="bg-gray-50 font-bold">
                                                    <Table.Summary.Cell index={0} colSpan={1}>Total</Table.Summary.Cell>
                                                    {columns.slice(1).map((col, i) => (
                                                        <Table.Summary.Cell index={i+1} key={i}>
                                                            {totals[col.key] !== undefined ? totals[col.key].toLocaleString('en-IN', { minimumFractionDigits: 3 }) : ''}
                                                        </Table.Summary.Cell>
                                                    ))}
                                                </Table.Summary.Row>
                                            </Table.Summary>
                                        );
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Empty 
                                description={<span className="text-gray-400 text-[15px] font-medium">Nothing to show</span>} 
                                image={<FiFilter size={48} className="text-gray-100 mb-2" />}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-50 flex justify-between items-center text-[12px] text-gray-400">
                    <p>For comparison, use {'>'}5, {'<'}10 or =324. For ranges, use 5:10 (for values between 5 & 10).</p>
                    <p className="font-mono">Execution Time: {executionTime} sec</p>
                </div>
            </div>
        </div>
    );
}
