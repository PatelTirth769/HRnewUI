import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message, Table, Tooltip } from 'antd';
import { FiRefreshCw, FiMoreHorizontal } from 'react-icons/fi';
import dayjs from 'dayjs';

const StockAgeing = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);

    const [filters, setFilters] = useState({
        company: 'Ketty Apparels',
        date: dayjs().format('YYYY-MM-DD'),
        warehouse_type: '',
        warehouse: '',
        item_code: '',
        brand: '',
        range: '30, 60, 90',
        show_warehouse_wise_stock: false,
    });

    const [options, setOptions] = useState({
        warehouse_type: [],
        warehouse: [],
        item_code: [],
        brand: [],
    });

    const fetchOptions = useCallback(async (key, doctype) => {
        try {
            const response = await API.get(`/api/resource/${doctype}?fields=["name"]&limit_page_length=500`);
            const opts = (response.data.data || []).map(d => ({ label: d.name, value: d.name }));
            setOptions(prev => ({ ...prev, [key]: opts }));
        } catch (error) {
            console.error(`Failed to fetch ${doctype}`, error);
            setOptions(prev => ({ ...prev, [key]: [] }));
        }
    }, []);

    useEffect(() => {
        fetchOptions('warehouse', 'Warehouse');
        fetchOptions('item_code', 'Item');
        fetchOptions('brand', 'Brand').catch(() => {});
        // Mock warehouse types if not available
        fetchOptions('warehouse_type', 'Warehouse Type').catch(() => {
            setOptions(prev => ({
                ...prev,
                warehouse_type: [
                    { label: 'Transit', value: 'Transit' },
                    { label: 'Normal', value: 'Normal' }
                ]
            }));
        });
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const reportFilters = {
                company: filters.company || 'Ketty Apparels',
                date: filters.date,
                range: filters.range || '30, 60, 90'
            };
            
            if (filters.warehouse) reportFilters.warehouse = filters.warehouse;
            if (filters.warehouse_type) reportFilters.warehouse_type = filters.warehouse_type;
            if (filters.item_code) reportFilters.item_code = filters.item_code;
            if (filters.brand) reportFilters.brand = filters.brand;
            if (filters.show_warehouse_wise_stock) reportFilters.show_warehouse_wise_stock = 1;

            const queryUrl = `/api/method/frappe.desk.query_report.run?report_name=Stock Ageing&filters=${encodeURIComponent(JSON.stringify(reportFilters))}`;
            
            const response = await API.get(queryUrl);
            const reportData = response.data.message || response.data;

            if (reportData.columns && reportData.columns.length > 0) {
                const cols = reportData.columns.map((col, idx) => {
                    const fieldname = col.fieldname || col.id || `col_${idx}`;
                    const colDef = {
                        title: col.label || col.name || fieldname,
                        dataIndex: fieldname,
                        key: fieldname,
                        width: col.width || 120,
                        ellipsis: true,
                    };

                    if (['Float', 'Currency', 'Int'].includes(col.fieldtype)) {
                        colDef.align = 'right';
                        colDef.render = (val) => {
                            if (val === undefined || val === null) return '–';
                            const num = parseFloat(val);
                            if (isNaN(num)) return val;
                            return (
                                <span className={num < 0 ? 'text-red-500 font-medium' : 'font-medium'}>
                                    {num.toLocaleString('en-IN', { minimumFractionDigits: col.fieldtype === 'Currency' ? 2 : 3 })}
                                </span>
                            );
                        };
                    }
                    if (col.fieldtype === 'Link') {
                        colDef.render = (val) => <span className="text-blue-600 hover:underline cursor-pointer">{val || '–'}</span>;
                    }
                    return colDef;
                });
                setReportColumns(cols);
            } else {
                setReportColumns(getDefaultColumns());
            }

            if (reportData.result && reportData.result.length > 0) {
                const columns = reportData.columns || [];
                const rows = reportData.result
                    .filter(row => row && !row._isTotals)
                    .map((row, idx) => {
                        if (Array.isArray(row)) {
                            const obj = { _key: `row-${idx}` };
                            columns.forEach((col, cIdx) => {
                                obj[col.fieldname || col.id || `col_${cIdx}`] = row[cIdx];
                            });
                            return obj;
                        }
                        return { ...row, _key: row.name || idx };
                    });
                setRecords(rows);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error('Stock Ageing report API failed, falling back:', error);
            try {
                // Fallback to reading raw bin snapshot data
                const binRes = await API.get(`/api/resource/Bin?fields=["item_code","warehouse","actual_qty","stock_value"]&limit_page_length=50`);
                const items = binRes.data.data || [];
                setRecords(items.map((it, i) => ({
                    _key: it.name || (it.item_code + i),
                    item_code: it.item_code,
                    warehouse: it.warehouse,
                    qty: it.actual_qty,
                    stock_value: it.stock_value,
                })));
                setReportColumns([
                    { title: 'Item Code', dataIndex: 'item_code', width: 150 },
                    { title: 'Warehouse', dataIndex: 'warehouse', width: 150 },
                    { title: 'Qty', dataIndex: 'qty', align: 'right', width: 100 },
                    { title: 'Stock Value', dataIndex: 'stock_value', align: 'right', width: 120 }
                ]);
            } catch (err) {
                setRecords([]);
                setReportColumns(getDefaultColumns());
            }
        } finally {
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    const getDefaultColumns = () => [
        { title: 'Item Code', dataIndex: 'item_code', width: 150 },
        { title: 'Item Name', dataIndex: 'item_name', width: 200 },
        { title: 'Brand', dataIndex: 'brand', width: 120 },
        { title: 'Warehouse', dataIndex: 'warehouse', width: 150 },
        { title: 'Range 1', dataIndex: 'range1', align: 'right', width: 100 },
        { title: 'Range 2', dataIndex: 'range2', align: 'right', width: 100 },
        { title: 'Range 3', dataIndex: 'range3', align: 'right', width: 100 },
        { title: 'Total Qty', dataIndex: 'total_qty', align: 'right', width: 100 },
        { title: 'Total Value', dataIndex: 'total_value', align: 'right', width: 120 },
    ];

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const inputClass = "w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-400 transition-colors";

    const renderSelect = (key, placeholder) => (
        <Select
            showSearch
            allowClear
            placeholder={placeholder}
            className="w-full custom-filter-select"
            value={filters[key] || undefined}
            onChange={(val) => handleFilterChange(key, val || '')}
            options={options[key]}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            notFoundContent={<span className="text-gray-400 text-xs p-2 block">No results</span>}
            popupRender={menu => (
                <div>
                    {menu}
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                        <span className="text-[11px] text-gray-400">Filters applied for <b>Company</b> = {filters.company}</span>
                    </div>
                </div>
            )}
        />
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Stock Ageing</h1>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        Actions <span className="text-xs">▼</span>
                    </button>
                    <Tooltip title="Refresh Report">
                        <button onClick={fetchReportData} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </Tooltip>
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <FiMoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa] space-y-3">
                    <div className="grid grid-cols-6 gap-3 filter-grid">
                        <input className={inputClass} value={filters.company} onChange={(e) => handleFilterChange('company', e.target.value)} placeholder="Company" />
                        <input type="date" className={inputClass} value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} />
                        {renderSelect('warehouse_type', 'Warehouse Type')}
                        {renderSelect('warehouse', 'Warehouse')}
                        {renderSelect('item_code', 'Item')}
                        {renderSelect('brand', 'Brand')}
                    </div>
                    <div className="grid grid-cols-6 gap-3 filter-grid items-center">
                        <input className={inputClass} value={filters.range} onChange={(e) => handleFilterChange('range', e.target.value)} placeholder="30, 60, 90" />
                        <label className="flex items-center gap-2 cursor-pointer w-max pl-2">
                            <input
                                type="checkbox"
                                checked={filters.show_warehouse_wise_stock}
                                onChange={(e) => handleFilterChange('show_warehouse_wise_stock', e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700 leading-tight">Show Warehouse-wise<br/>Stock</span>
                        </label>
                    </div>
                </div>

                <div className="p-0 min-h-[400px]">
                    <Spin spinning={loading}>
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                                <svg className="w-12 h-12 mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="text-sm font-medium">Nothing to show</span>
                            </div>
                        ) : (
                            <Table
                                dataSource={records}
                                columns={reportColumns}
                                rowKey="_key"
                                pagination={false}
                                size="small"
                                className="border-t border-gray-100"
                                scroll={{ x: 'max-content' }}
                            />
                        )}
                    </Spin>
                </div>

                <div className="p-3 border-t border-gray-100 bg-[#f8f9fa] flex justify-between items-center text-[11px] text-gray-500">
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                    <span>Execution Time: {loading ? '...' : executionTime || '0.000000'} sec</span>
                </div>
            </div>

            <style>{`
                .ant-table-thead > tr > th {
                    background: #f8f9fa !important;
                    color: #6b7280 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 8px 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }
                .ant-table-tbody > tr > td {
                    padding: 8px 16px !important;
                    font-size: 13px !important;
                    border-bottom: 1px solid #f9fafb !important;
                }
                .ant-table-tbody > tr:hover > td {
                    background: #f0f9ff !important;
                }
                .custom-filter-select .ant-select-selector {
                    height: 33.6px !important;
                    padding: 0 11px !important;
                    background-color: #f9fafb !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.375rem !important;
                    display: flex !important;
                    align-items: center !important;
                    font-size: 0.875rem !important;
                }
                .custom-filter-select .ant-select-selector:hover {
                    border-color: #60a5fa !important;
                }
                .custom-filter-select.ant-select-focused .ant-select-selector {
                    border-color: #60a5fa !important;
                    background-color: #ffffff !important;
                    box-shadow: none !important;
                }
                .custom-filter-select .ant-select-selection-placeholder {
                    color: #9ca3af !important;
                    font-size: 0.875rem !important;
                }
            `}</style>
        </div>
    );
};

export default StockAgeing;
