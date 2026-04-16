import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Select, DatePicker, Table, Spin, Empty } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiFilter } from 'react-icons/fi';
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

export default function BatchWiseBalanceHistory() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        company: localStorage.getItem('company') || '',
        from_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
        item_code: '',
        warehouse_type: '',
        warehouse: '',
        batch_no: ''
    });

    const [masters, setMasters] = useState({
        companies: [],
        items: [],
        warehouses: [],
        warehouse_types: [],
        batches: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [compRes, itemRes, whRes, wtRes, batchRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Item?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Warehouse?fields=["name","warehouse_type"]&limit_page_length=200'),
                API.get('/api/resource/Warehouse Type?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Batch?fields=["name"]&limit_page_length=200')
            ]);
            setMasters({
                companies: compRes.data?.data || [],
                items: itemRes.data?.data || [],
                warehouses: whRes.data?.data || [],
                warehouse_types: wtRes.data?.data || [],
                batches: batchRes.data?.data || []
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
                    report_name: 'Batch-Wise Balance History',
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
                .report-select .ant-select-selector { border: none !important; background: #F9FAFB !important; padding: 0 12px !important; height: 38px !important; border-radius: 6px !important; display: flex !important; align-items: center !important; }
                .report-date .ant-picker { border: none !important; background: #F9FAFB !important; height: 38px !important; border-radius: 6px !important; width: 100%; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Batch-Wise Balance History</h1>
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-6">
                    <div className="grid grid-cols-5 gap-4 mb-4">
                        <div>
                            <FilterLabel label="Company" />
                            <Select
                                className="w-full report-select border border-red-50 rounded"
                                value={filters.company}
                                onChange={v => handleFilterChange('company', v)}
                                options={masters.companies.map(c => ({ value: c.name, label: c.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="From Date" />
                            <DatePicker 
                                className="report-date" 
                                value={dayjs(filters.from_date)} 
                                onChange={d => handleFilterChange('from_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                        <div>
                            <FilterLabel label="To Date" />
                            <DatePicker 
                                className="report-date" 
                                value={dayjs(filters.to_date)} 
                                onChange={d => handleFilterChange('to_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                        <div>
                            <FilterLabel label="Item Code" />
                            <Select
                                className="w-full report-select"
                                placeholder="Select Item"
                                allowClear
                                showSearch
                                value={filters.item_code || undefined}
                                onChange={v => handleFilterChange('item_code', v)}
                                options={masters.items.map(i => ({ value: i.name, label: i.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Warehouse Type" />
                            <Select
                                className="w-full report-select"
                                placeholder="All Types"
                                allowClear
                                value={filters.warehouse_type || undefined}
                                onChange={v => handleFilterChange('warehouse_type', v)}
                                options={masters.warehouse_types.map(t => ({ value: t.name, label: t.name }))}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-50">
                        <div>
                            <FilterLabel label="Warehouse" />
                            <Select
                                className="w-full report-select"
                                placeholder="All Warehouses"
                                allowClear
                                showSearch
                                value={filters.warehouse || undefined}
                                onChange={v => handleFilterChange('warehouse', v)}
                                options={masters.warehouses.map(w => ({ value: w.name, label: w.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Batch No" />
                            <Select
                                className="w-full report-select"
                                placeholder="Batch No"
                                allowClear
                                showSearch
                                value={filters.batch_no || undefined}
                                onChange={v => handleFilterChange('batch_no', v)}
                                options={masters.batches.map(b => ({ value: b.name, label: b.name }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px] bg-[#fbfcfd] border-t border-gray-100 flex flex-col items-center justify-center p-8 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Fetching Batch History...</span>
                        </div>
                    ) : reportData.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                            <Table 
                                columns={columns} 
                                dataSource={reportData} 
                                size="small" 
                                pagination={false}
                                rowKey={(record, idx) => idx}
                            />
                        </div>
                    ) : (
                        <Empty 
                            description={<span className="text-gray-400 text-[15px] font-medium">Nothing to show</span>} 
                            image={<FiFilter size={48} className="text-gray-100 mb-2" />}
                        />
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
