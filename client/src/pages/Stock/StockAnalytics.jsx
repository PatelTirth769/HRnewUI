import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification, Select, DatePicker, Table, Spin, Empty } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiDownload, FiFilter } from 'react-icons/fi';
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

/* ─── shared components ─── */
const FilterLabel = ({ label }) => (
    <span className="block text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</span>
);

export default function StockAnalytics() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        item_group: '',
        item_code: '',
        value_quantity: 'Value',
        brand: '',
        company: localStorage.getItem('company') || '',
        warehouse: '',
        from_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
        periodicity: 'Monthly'
    });

    const [masters, setMasters] = useState({
        item_groups: [],
        items: [],
        brands: [],
        companies: [],
        warehouses: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [igRes, itemRes, brandRes, compRes, whRes] = await Promise.all([
                API.get('/api/resource/Item Group?fields=["name"]&limit_page_length=500'),
                API.get('/api/resource/Item?fields=["name","item_name"]&limit_page_length=500'),
                API.get('/api/resource/Brand?fields=["name"]&limit_page_length=200'),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Warehouse?fields=["name"]&limit_page_length=200')
            ]);
            setMasters({
                item_groups: igRes.data?.data || [],
                items: itemRes.data?.data || [],
                brands: brandRes.data?.data || [],
                companies: compRes.data?.data || [],
                warehouses: whRes.data?.data || []
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
                    report_name: 'Stock Analytics',
                    filters: JSON.stringify(filters)
                }
            });
            
            const results = res.data?.message?.result || [];
            const colDef = res.data?.message?.columns || [];
            
            // Transform columns for Ant Design Table
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
                    align: typeof results[0]?.[key] === 'number' ? 'right' : 'left'
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
                .report-date .ant-picker { border: 1px solid #F3F4F6 !important; background: #FFF9F9 !important; height: 38px !important; border-radius: 6px !important; width: 100%; border-color: #F87171 !important; }
                .report-input-red { border: 1px solid #F87171 !important; background: #FFF9F9 !important; border-radius: 6px !important; padding: 0 12px !important; height: 38px !important; width: 100%; font-size: 13px; outline: none; }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Stock Analytics</h1>
                <div className="flex gap-2">
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
                    {/* Filter Bar Row 1 */}
                    <div className="grid grid-cols-6 gap-4 mb-4">
                        <div>
                            <FilterLabel label="Item Group" />
                            <Select
                                className="w-full report-select"
                                placeholder="All Groups"
                                allowClear
                                showSearch
                                value={filters.item_group || undefined}
                                onChange={v => handleFilterChange('item_group', v)}
                                options={masters.item_groups.map(g => ({ value: g.name, label: g.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Item" />
                            <Select
                                className="w-full report-select"
                                placeholder="All Items"
                                allowClear
                                showSearch
                                value={filters.item_code || undefined}
                                onChange={v => handleFilterChange('item_code', v)}
                                options={masters.items.map(i => ({ value: i.name, label: i.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Value/Quantity" />
                            <Select
                                className="w-full report-select font-bold text-gray-900"
                                value={filters.value_quantity}
                                onChange={v => handleFilterChange('value_quantity', v)}
                                options={[{value:'Value',label:'Value'},{value:'Quantity',label:'Quantity'}]}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Brand" />
                            <Select
                                className="w-full report-select"
                                placeholder="All Brands"
                                allowClear
                                showSearch
                                value={filters.brand || undefined}
                                onChange={v => handleFilterChange('brand', v)}
                                options={masters.brands.map(b => ({ value: b.name, label: b.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Company" />
                            <Select
                                className="w-full report-select border border-red-400 rounded-md"
                                value={filters.company}
                                onChange={v => handleFilterChange('company', v)}
                                options={masters.companies.map(c => ({ value: c.name, label: c.name }))}
                            />
                        </div>
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
                    </div>

                    {/* Filter Bar Row 2 */}
                    <div className="grid grid-cols-6 gap-4 border-t border-gray-50 pt-4">
                        <div>
                            <FilterLabel label="From Date" />
                            <DatePicker 
                                className="report-date" 
                                value={filters.from_date ? dayjs(filters.from_date) : null} 
                                onChange={(d) => handleFilterChange('from_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                        <div>
                            <FilterLabel label="To Date" />
                            <DatePicker 
                                className="report-date" 
                                value={filters.to_date ? dayjs(filters.to_date) : null} 
                                onChange={(d) => handleFilterChange('to_date', d?.format('YYYY-MM-DD'))} 
                            />
                        </div>
                        <div>
                            <FilterLabel label="Periodicity" />
                            <Select
                                className="w-full report-select font-bold"
                                value={filters.periodicity}
                                onChange={v => handleFilterChange('periodicity', v)}
                                options={[{value:'Daily',label:'Daily'},{value:'Weekly',label:'Weekly'},{value:'Monthly',label:'Monthly'},{value:'Yearly',label:'Yearly'}]}
                            />
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="min-h-[400px] bg-[#fbfcfd] border-t border-gray-100 flex flex-col items-center justify-center p-8 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Running Analytics...</span>
                        </div>
                    ) : reportData.length > 0 ? (
                        <div className="w-full overflow-x-auto">
                            <Table 
                                columns={columns} 
                                dataSource={reportData} 
                                size="small" 
                                pagination={false}
                                rowKey={(record, idx) => idx}
                                className="custom-report-table"
                            />
                        </div>
                    ) : (
                        <Empty 
                            description={<span className="text-gray-400 text-[15px] font-medium">Please set filters and click refresh</span>} 
                            image={<FiFilter size={48} className="text-gray-100 mb-2" />}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-gray-50 flex justify-between items-center text-[12px] text-gray-400">
                    <p>For comparison, use {'>'}5, {'<'}10 or =324. For ranges, use 5:10 (for values between 5 & 10).</p>
                    <p className="font-mono">Execution Time: {executionTime} sec</p>
                </div>
            </div>
        </div>
    );
}
