import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message, Table, Tooltip } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiDownload, FiAlertCircle } from 'react-icons/fi';
import dayjs from 'dayjs';

const StockBalance = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [lastGenerated, setLastGenerated] = useState(null);
    const [executionTime, setExecutionTime] = useState(null);

    const [filters, setFilters] = useState({
        company: 'Ketty Apparels',
        from_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
        item_group: '',
        item_code: '',
        warehouse: '',
        warehouse_type: '',
        currency: '',
        include_uom: '',
        show_variant_attributes: false,
        show_stock_ageing_data: false,
        ignore_closing_balance: false,
        include_zero_stock: false,
        show_dimension_wise_stock: false,
    });

    // Dynamic dropdown options state
    const [options, setOptions] = useState({
        item_group: [],
        item_code: [],
        warehouse: [],
        warehouse_type: [],
        include_uom: [],
    });

    // Generic fetch function for dropdown options
    const fetchOptions = useCallback(async (key, doctype, labelField) => {
        try {
            const fields = labelField ? `["name","${labelField}"]` : '["name"]';
            const response = await API.get(`/api/resource/${doctype}?fields=${fields}&limit_page_length=500`);
            const opts = (response.data.data || []).map(d => ({
                label: labelField ? `${d.name}${d[labelField] ? ' - ' + d[labelField] : ''}` : d.name,
                value: d.name,
            }));
            setOptions(prev => ({ ...prev, [key]: opts }));
        } catch (error) {
            console.error(`Failed to fetch ${doctype}`, error);
            setOptions(prev => ({ ...prev, [key]: [] }));
        }
    }, []);

    // Load all dropdown options on mount
    useEffect(() => {
        fetchOptions('item_group', 'Item Group');
        fetchOptions('item_code', 'Item');
        fetchOptions('warehouse', 'Warehouse');
        fetchOptions('include_uom', 'UOM');
        // Warehouse Type may not exist, handle gracefully
        fetchOptions('warehouse_type', 'Warehouse Type').catch(() => {
            setOptions(prev => ({
                ...prev,
                warehouse_type: [
                    { label: 'Transit', value: 'Transit' },
                    { label: 'Normal', value: 'Normal' },
                ],
            }));
        });
        fetchReportData();
    }, []);

    // Fetch the Stock Balance report via query_report API
    const fetchReportData = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            // Build filters object for the query_report API
            const reportFilters = {
                company: filters.company || 'Ketty Apparels',
                from_date: filters.from_date,
                to_date: filters.to_date,
            };

            if (filters.item_group) reportFilters.item_group = filters.item_group;
            if (filters.item_code) reportFilters.item_code = filters.item_code;
            if (filters.warehouse) reportFilters.warehouse = filters.warehouse;
            if (filters.warehouse_type) reportFilters.warehouse_type = filters.warehouse_type;
            if (filters.include_uom) reportFilters.include_uom = filters.include_uom;
            if (filters.show_variant_attributes) reportFilters.show_variant_attributes = 1;
            if (filters.show_stock_ageing_data) reportFilters.show_stock_ageing_data = 1;
            if (filters.ignore_closing_balance) reportFilters.ignore_closing_balance = 1;
            if (filters.include_zero_stock) reportFilters.include_zero_stock = 1;

            const queryUrl = `/api/method/frappe.desk.query_report.run?report_name=Stock Balance&filters=${encodeURIComponent(JSON.stringify(reportFilters))}`;

            const response = await API.get(queryUrl);
            const reportData = response.data.message || response.data;

            // Build dynamic columns from the report response
            if (reportData.columns && reportData.columns.length > 0) {
                const cols = reportData.columns.map((col, idx) => {
                    const fieldname = col.fieldname || col.id || `col_${idx}`;
                    const colDef = {
                        title: col.label || col.name || fieldname,
                        dataIndex: fieldname,
                        key: fieldname,
                        width: col.width || 140,
                        ellipsis: true,
                    };

                    // Numeric alignment
                    if (col.fieldtype === 'Float' || col.fieldtype === 'Currency' || col.fieldtype === 'Int') {
                        colDef.align = 'right';
                        colDef.render = (val) => {
                            if (val === undefined || val === null) return '–';
                            const num = parseFloat(val);
                            if (isNaN(num)) return val;
                            if (col.fieldtype === 'Currency') {
                                return (
                                    <span className={num < 0 ? 'text-red-500 font-medium' : 'font-medium'}>
                                        {num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                );
                            }
                            return (
                                <span className={num < 0 ? 'text-red-500 font-medium' : num > 0 ? 'text-emerald-600 font-medium' : ''}>
                                    {num.toLocaleString('en-IN', { minimumFractionDigits: col.fieldtype === 'Float' ? 3 : 0 })}
                                </span>
                            );
                        };
                    }

                    // Link-type columns
                    if (col.fieldtype === 'Link') {
                        colDef.render = (val) => (
                            <span className="text-blue-600 hover:underline cursor-pointer">{val || '–'}</span>
                        );
                    }

                    return colDef;
                });
                setReportColumns(cols);
            } else {
                // Fallback columns if report doesn't return column definitions
                setReportColumns(getDefaultColumns());
            }

            // Map result rows
            if (reportData.result && reportData.result.length > 0) {
                const columns = reportData.columns || [];
                const rows = reportData.result
                    .filter(row => row && !row._isTotals)
                    .map((row, idx) => {
                        if (Array.isArray(row)) {
                            // Array-format rows: map by column index
                            const obj = { _key: idx };
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

            setLastGenerated(new Date());
        } catch (error) {
            console.error('Stock Balance report error:', error);
            // Fallback: fetch from Bin resource as alternative data source
            try {
                const binResponse = await API.get(
                    `/api/resource/Bin?fields=["item_code","warehouse","actual_qty","planned_qty","reserved_qty","projected_qty","valuation_rate","stock_value"]&limit_page_length=100&order_by=item_code asc`
                );
                const binData = binResponse.data.data || [];
                setRecords(binData.map((d, i) => ({ ...d, _key: d.name || i })));
                setReportColumns(getDefaultColumns());
            } catch (fallbackError) {
                message.warning('Could not fetch stock balance data. Displaying empty report.');
                setRecords([]);
                setReportColumns(getDefaultColumns());
            }
        } finally {
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(4));
            setLoading(false);
        }
    };

    const getDefaultColumns = () => [
        { title: 'Item', dataIndex: 'item_code', key: 'item_code', width: 180, render: val => <span className="text-blue-600 font-medium">{val || '–'}</span> },
        { title: 'Item Name', dataIndex: 'item_name', key: 'item_name', width: 200, ellipsis: true },
        { title: 'Item Group', dataIndex: 'item_group', key: 'item_group', width: 150 },
        { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 200, render: val => <span className="text-blue-600">{val || '–'}</span> },
        { title: 'Stock UOM', dataIndex: 'stock_uom', key: 'stock_uom', width: 90, align: 'center' },
        {
            title: 'Opening Qty', dataIndex: 'opening_qty', key: 'opening_qty', width: 120, align: 'right',
            render: val => <span className="font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3 }) : '–'}</span>
        },
        {
            title: 'Opening Value', dataIndex: 'opening_val', key: 'opening_val', width: 140, align: 'right',
            render: val => <span className="font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '–'}</span>
        },
        {
            title: 'In Qty', dataIndex: 'in_qty', key: 'in_qty', width: 100, align: 'right',
            render: val => <span className="text-emerald-600 font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3 }) : '–'}</span>
        },
        {
            title: 'In Value', dataIndex: 'in_val', key: 'in_val', width: 120, align: 'right',
            render: val => <span className="text-emerald-600 font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '–'}</span>
        },
        {
            title: 'Out Qty', dataIndex: 'out_qty', key: 'out_qty', width: 100, align: 'right',
            render: val => <span className="text-red-500 font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3 }) : '–'}</span>
        },
        {
            title: 'Out Value', dataIndex: 'out_val', key: 'out_val', width: 120, align: 'right',
            render: val => <span className="text-red-500 font-medium">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '–'}</span>
        },
        {
            title: 'Balance Qty', dataIndex: 'bal_qty', key: 'bal_qty', width: 120, align: 'right',
            render: val => {
                if (val == null) return '–';
                const num = parseFloat(val);
                return <span className={`font-semibold ${num < 0 ? 'text-red-500' : num > 0 ? 'text-emerald-600' : ''}`}>{num.toLocaleString('en-IN', { minimumFractionDigits: 3 })}</span>;
            }
        },
        {
            title: 'Balance Value', dataIndex: 'bal_val', key: 'bal_val', width: 140, align: 'right',
            render: val => <span className="font-semibold">{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '–'}</span>
        },
        {
            title: 'Valuation Rate', dataIndex: 'val_rate', key: 'val_rate', width: 130, align: 'right',
            render: val => <span>{val != null ? parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '–'}</span>
        },
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const inputClass = "w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-400 transition-colors";

    // Helper to render a dynamic Select field
    const renderSelect = (key, placeholder) => (
        <Select
            showSearch
            allowClear
            placeholder={placeholder}
            className="w-full custom-filter-select"
            value={filters[key] || undefined}
            onChange={(val) => handleFilterChange(key, val || '')}
            options={options[key]}
            filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={<span className="text-gray-400 text-xs p-2 block">No results</span>}
            popupRender={(menu) => (
                <div>
                    {menu}
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                        <span className="text-[11px] text-gray-400">Filters applied for <b>Company</b> = {filters.company}</span>
                    </div>
                </div>
            )}
        />
    );

    // Render checkbox filter
    const renderCheckbox = (key, label) => (
        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <input
                type="checkbox"
                checked={filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 accent-blue-600"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );

    const timeSinceGenerated = () => {
        if (!lastGenerated) return '';
        const diffMs = new Date() - lastGenerated;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        const diffHrs = Math.floor(diffMin / 60);
        return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Stock Balance</h1>
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
                    <button className="px-4 py-1.5 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors">
                        Generate New Report
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                {/* Filters Section */}
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa] space-y-3">
                    {/* Row 1: Main filters */}
                    <div className="grid grid-cols-6 gap-3 filter-grid">
                        <input
                            className={inputClass}
                            value={filters.company}
                            onChange={(e) => handleFilterChange('company', e.target.value)}
                            placeholder="Company"
                        />
                        <input
                            type="date"
                            className={inputClass}
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                        />
                        <input
                            type="date"
                            className={inputClass}
                            value={filters.to_date}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                        />
                        {renderSelect('item_group', 'Item Group')}
                        {renderSelect('item_code', 'Item')}
                        {renderSelect('warehouse', 'Warehouse')}
                    </div>

                    {/* Row 2: Secondary filters */}
                    <div className="grid grid-cols-6 gap-3 filter-grid">
                        {renderSelect('warehouse_type', 'Warehouse Type')}
                        <select
                            className={inputClass}
                            value={filters.currency}
                            onChange={(e) => handleFilterChange('currency', e.target.value)}
                        >
                            <option value="">Currency</option>
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                        {renderSelect('include_uom', 'Include UOM')}
                        <div className="flex items-center">
                            {renderCheckbox('show_variant_attributes', 'Show Variant Attributes')}
                        </div>
                        <div className="flex items-center">
                            {renderCheckbox('show_stock_ageing_data', 'Show Stock Ageing Data')}
                        </div>
                        <div className="flex items-center">
                            {renderCheckbox('ignore_closing_balance', 'Ignore Closing Balance')}
                        </div>
                    </div>

                    {/* Row 3: Remaining checkboxes */}
                    <div className="flex items-center gap-6 pt-1">
                        {renderCheckbox('include_zero_stock', 'Include Zero Stock Items')}
                        {renderCheckbox('show_dimension_wise_stock', 'Show Dimension Wise Stock')}
                    </div>
                </div>

                {/* Generated status banner */}
                {lastGenerated && (
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        <span className="text-[13px] text-gray-600">
                            This report was generated <strong>{timeSinceGenerated()}</strong>.
                            To get the updated report, click on Rebuild.{' '}
                            <span className="text-blue-600 hover:underline cursor-pointer">See all past reports.</span>
                        </span>
                    </div>
                )}

                {/* Data Section */}
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
                                columns={reportColumns.length > 0 ? reportColumns : getDefaultColumns()}
                                rowKey="_key"
                                pagination={false}
                                size="small"
                                className="border-t border-gray-100"
                                scroll={{ x: 'max-content' }}
                            />
                        )}
                    </Spin>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-[#f8f9fa] flex justify-between items-center text-[11px] text-gray-500">
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                    <span>Execution Time: {loading ? '...' : executionTime || '0.0000'} sec</span>
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

export default StockBalance;
