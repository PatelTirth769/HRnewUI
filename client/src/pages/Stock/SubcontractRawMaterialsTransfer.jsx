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

export default function SubcontractRawMaterialsTransfer() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        subcontracting_order: '',
        supplier: '',
        from_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD')
    });

    const [masters, setMasters] = useState({
        subcontracting_orders: [],
        suppliers: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [soRes, supplierRes] = await Promise.all([
                API.get('/api/resource/Subcontracting Order?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Supplier?fields=["name","supplier_name"]&limit_page_length=200')
            ]);
            setMasters({
                subcontracting_orders: soRes.data?.data || [],
                suppliers: supplierRes.data?.data || []
            });
        } catch (err) {
            console.error('Failed to fetch masters:', err);
        }
    };

    const runReport = async () => {
        if (!filters.supplier) {
            notification.warning({ message: 'Filter Required', description: 'Please select a Supplier to view raw materials pending transfer.' });
            return;
        }

        setLoading(true);
        const startTime = performance.now();
        try {
            const res = await API.get('/api/method/frappe.desk.query_report.run', {
                params: {
                    report_name: 'Subcontracted Raw Materials To Be Transferred',
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
                .mandatory-filter .ant-select-selector { border: 1px solid #FECACA !important; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                    Subcontracted Raw Materials To Be...
                </h1>
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
                    <div className="grid grid-cols-4 gap-4 max-w-[1100px]">
                        <div>
                            <Select
                                className={`w-full report-select`}
                                placeholder="Subcontracting Order"
                                allowClear
                                showSearch
                                value={filters.subcontracting_order || undefined}
                                onChange={v => handleFilterChange('subcontracting_order', v)}
                                options={masters.subcontracting_orders.map(so => ({ value: so.name, label: so.name }))}
                            />
                        </div>
                        <div>
                            <Select
                                className={`w-full report-select mandatory-filter`}
                                placeholder="Supplier"
                                allowClear
                                showSearch
                                value={filters.supplier || undefined}
                                onChange={v => handleFilterChange('supplier', v)}
                                options={masters.suppliers.map(s => ({ value: s.name, label: s.name }))}
                            />
                        </div>
                        <div>
                            <DatePicker 
                                className="report-date" 
                                value={dayjs(filters.from_date)} 
                                onChange={d => handleFilterChange('from_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                        <div>
                            <DatePicker 
                                className="report-date" 
                                value={dayjs(filters.to_date)} 
                                onChange={d => handleFilterChange('to_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px] bg-[#fbfcfd] border-t border-gray-100 flex flex-col items-center justify-center p-8 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Analyzing Transfers...</span>
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
                        <div className="text-center">
                            <span className="text-gray-400 text-[15px] font-medium">Please set filters</span>
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
