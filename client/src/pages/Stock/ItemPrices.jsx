import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Select, Table, Spin, Empty } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiFilter } from 'react-icons/fi';

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

export default function ItemPrices() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        enabled_items_only: 'Enabled Items only'
    });

    useEffect(() => {
        runReport();
    }, []);

    const runReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const res = await API.get('/api/method/frappe.desk.query_report.run', {
                params: {
                    report_name: 'Item Prices',
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
                    render: (val, record) => {
                        if (typeof val === 'number') {
                            const isCurrency = c.label.toLowerCase().includes('price') || c.label.toLowerCase().includes('last') || c.label.toLowerCase().includes('valuation');
                            return isCurrency ? `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : val;
                        }
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
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Item Prices</h1>
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
                    <div className="grid grid-cols-4 gap-4 max-w-[800px]">
                        <div>
                            <Select
                                className="w-full report-select border border-gray-100 rounded"
                                value={filters.enabled_items_only}
                                onChange={v => handleFilterChange('enabled_items_only', v)}
                                options={[
                                    { value: 'Enabled Items only', label: 'Enabled Items only' },
                                    { value: 'Disabled Items only', label: 'Disabled Items only' },
                                    { value: 'All Items', label: 'All Items' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px] border-t border-gray-100 flex flex-col items-center justify-center p-0 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Fetching Item Prices...</span>
                        </div>
                    ) : reportData.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                            <Table 
                                columns={columns} 
                                dataSource={reportData} 
                                size="small" 
                                pagination={false}
                                rowKey={(record, idx) => idx}
                                className="custom-price-table"
                            />
                        </div>
                    ) : (
                        <div className="p-8"><Empty 
                            description={<span className="text-gray-400 text-[15px] font-medium">Nothing to show</span>} 
                            image={<FiFilter size={48} className="text-gray-100 mb-2" />}
                        /></div>
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
