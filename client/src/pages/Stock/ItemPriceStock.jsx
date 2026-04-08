import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message, Table, Tooltip } from 'antd';
import { FiRefreshCw, FiMoreHorizontal } from 'react-icons/fi';

const ItemPriceStock = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);

    const [filters, setFilters] = useState({
        item_code: '',
    });

    const [options, setOptions] = useState({
        item_code: [],
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
        fetchOptions('item_code', 'Item');
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const reportFilters = {};
            if (filters.item_code) reportFilters.item = filters.item_code;

            const queryUrl = `/api/method/frappe.desk.query_report.run?report_name=Item Price Stock&filters=${encodeURIComponent(JSON.stringify(reportFilters))}`;
            
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
                            if (col.fieldtype === 'Currency' || fieldname.includes('rate')) {
                                return (
                                    <span className={num < 0 ? 'text-red-500 font-medium' : 'font-medium'}>
                                        ₹ {num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                );
                            }
                            return (
                                <span className={num < 0 ? 'text-red-500 font-medium' : 'font-medium'}>
                                    {num.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
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
            console.error('Item Price Stock API failed, attempting fallback...', error);
            try {
                // Fetch Prices
                let priceUrl = `/api/resource/Item Price?fields=["item_code","price_list","price_list_rate","buying","selling"]&limit_page_length=500`;
                if (filters.item_code) priceUrl += `&filters=[["item_code","=","${filters.item_code}"]]`;
                const priceRes = await API.get(priceUrl);
                const prices = priceRes.data.data || [];

                // Fetch Stock using Bin
                let binUrl = `/api/resource/Bin?fields=["item_code","warehouse","actual_qty"]&limit_page_length=500`;
                if (filters.item_code) binUrl += `&filters=[["item_code","=","${filters.item_code}"]]`;
                const binRes = await API.get(binUrl);
                const bins = binRes.data.data || [];

                const combinedMap = new Map();
                
                prices.forEach(p => {
                    const key = p.item_code;
                    if (!combinedMap.has(key)) combinedMap.set(key, { 
                        item_code: p.item_code, 
                        item_name: p.item_code, // fallback without extra api call
                        brand: '', 
                        warehouse: '', 
                        stock_available: 0, 
                        buying_price_list: '', 
                        buying_rate: 0, 
                        selling_price_list: '', 
                        selling_rate: 0 
                    });
                    const row = combinedMap.get(key);
                    if (p.buying) {
                        row.buying_price_list = p.price_list;
                        row.buying_rate = p.price_list_rate;
                    }
                    if (p.selling) {
                        row.selling_price_list = p.price_list;
                        row.selling_rate = p.price_list_rate;
                    }
                });

                bins.forEach(b => {
                    const key = b.item_code;
                    if (!combinedMap.has(key)) combinedMap.set(key, { 
                        item_code: b.item_code, 
                        item_name: b.item_code, 
                        brand: '', 
                        warehouse: b.warehouse, 
                        stock_available: b.actual_qty, 
                        buying_price_list: '', 
                        buying_rate: 0, 
                        selling_price_list: '', 
                        selling_rate: 0 
                    });
                    else {
                        const row = combinedMap.get(key);
                        row.warehouse = b.warehouse;
                        row.stock_available = b.actual_qty;
                    }
                });

                setRecords(Array.from(combinedMap.values()).map((r, i) => ({ ...r, _key: i })));
                setReportColumns(getDefaultColumns());
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
        { title: 'Item Code', dataIndex: 'item_code', width: 140 },
        { title: 'Item Name', dataIndex: 'item_name', width: 160 },
        { title: 'Brand', dataIndex: 'brand', width: 120 },
        { title: 'Warehouse', dataIndex: 'warehouse', width: 150 },
        { 
            title: 'Stock Available', dataIndex: 'stock_available', align: 'right', width: 120,
            render: val => val != null ? <span className="font-medium">{parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span> : '–'
        },
        { title: 'Buying Price List', dataIndex: 'buying_price_list', width: 150 },
        { 
            title: 'Buying Rate', dataIndex: 'buying_rate', align: 'right', width: 120,
            render: val => val != null ? <span>₹ {parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> : '–'
        },
        { title: 'Selling Price List', dataIndex: 'selling_price_list', width: 150 },
        { 
            title: 'Selling Rate', dataIndex: 'selling_rate', align: 'right', width: 120,
            render: val => val != null ? <span>₹ {parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> : '–'
        },
    ];

    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const renderSelect = (key, placeholder) => (
        <Select
            showSearch
            allowClear
            placeholder={placeholder}
            className="w-[200px] custom-filter-select"
            value={filters[key] || undefined}
            onChange={(val) => handleFilterChange(key, val || '')}
            options={options[key]}
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            notFoundContent={<span className="text-gray-400 text-xs p-2 block">No results</span>}
        />
    );

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Item Price Stock</h1>
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
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa] flex items-center gap-3">
                    {renderSelect('item_code', 'Item')}
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

export default ItemPriceStock;
