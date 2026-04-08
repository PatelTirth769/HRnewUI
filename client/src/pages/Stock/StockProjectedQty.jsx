import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message, Table } from 'antd';
import { FiRefreshCw, FiMoreHorizontal } from 'react-icons/fi';

const StockProjectedQty = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [totals, setTotals] = useState(null);
    const [reportColumns, setReportColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);

    const [filters, setFilters] = useState({
        company: 'Ketty Apparels',
        warehouse: '',
        item_code: '',
        item_group: '',
        brand: '',
        include_uom: '',
    });

    // Dynamic dropdown options
    const [options, setOptions] = useState({
        warehouse: [],
        item_code: [],
        item_group: [],
        brand: [],
        include_uom: [],
    });

    // Generic fetch for dropdown options
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
        fetchOptions('item_group', 'Item Group');
        fetchOptions('brand', 'Brand').catch(() => {});
        fetchOptions('include_uom', 'UOM');
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            // Build filters for the query_report API
            const reportFilters = { company: filters.company || 'Ketty Apparels' };
            if (filters.warehouse) reportFilters.warehouse = filters.warehouse;
            if (filters.item_code) reportFilters.item_code = filters.item_code;
            if (filters.item_group) reportFilters.item_group = filters.item_group;
            if (filters.brand) reportFilters.brand = filters.brand;
            if (filters.include_uom) reportFilters.include_uom = filters.include_uom;

            const queryUrl = `/api/method/frappe.desk.query_report.run?report_name=Stock Projected Qty&filters=${encodeURIComponent(JSON.stringify(reportFilters))}`;
            const response = await API.get(queryUrl);
            const reportData = response.data.message || response.data;

            // Build columns from report response
            if (reportData.columns && reportData.columns.length > 0) {
                const cols = reportData.columns.map((col, idx) => {
                    const fieldname = col.fieldname || col.id || `col_${idx}`;
                    const colDef = {
                        title: col.label || col.name || fieldname,
                        dataIndex: fieldname,
                        key: fieldname,
                        width: col.width || 130,
                        ellipsis: true,
                    };
                    if (col.fieldtype === 'Float' || col.fieldtype === 'Currency' || col.fieldtype === 'Int') {
                        colDef.align = 'right';
                        colDef.render = (val) => {
                            if (val === undefined || val === null) return '–';
                            const num = parseFloat(val);
                            if (isNaN(num)) return val;
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

            // Map result rows & separate totals
            if (reportData.result && reportData.result.length > 0) {
                const columns = reportData.columns || [];
                let totalRow = null;
                const rows = [];

                reportData.result.forEach((row, idx) => {
                    if (row && (row._isTotals || row.bold)) {
                        // This is the totals row
                        if (Array.isArray(row)) {
                            const obj = {};
                            columns.forEach((col, cIdx) => { obj[col.fieldname || col.id || `col_${cIdx}`] = row[cIdx]; });
                            totalRow = obj;
                        } else {
                            totalRow = row;
                        }
                    } else if (Array.isArray(row)) {
                        const obj = { _key: idx };
                        columns.forEach((col, cIdx) => { obj[col.fieldname || col.id || `col_${cIdx}`] = row[cIdx]; });
                        rows.push(obj);
                    } else if (row) {
                        rows.push({ ...row, _key: row.name || idx });
                    }
                });

                setRecords(rows);
                setTotals(totalRow);
            } else {
                setRecords([]);
                setTotals(null);
            }
        } catch (error) {
            console.error('Stock Projected Qty report error:', error);
            // Fallback: fetch from Bin resource
            try {
                let binUrl = `/api/resource/Bin?fields=["item_code","warehouse","actual_qty","planned_qty","reserved_qty","projected_qty","ordered_qty","indented_qty","stock_uom"]&limit_page_length=100&order_by=item_code asc`;
                const apiFilters = [];
                if (filters.item_code) apiFilters.push(`["item_code","=","${filters.item_code}"]`);
                if (filters.warehouse) apiFilters.push(`["warehouse","=","${filters.warehouse}"]`);
                if (apiFilters.length > 0) binUrl += `&filters=[${apiFilters.join(',')}]`;

                const binResponse = await API.get(binUrl);
                const binData = binResponse.data.data || [];

                // Enrich with item details
                const enrichedRows = await Promise.all(
                    binData.map(async (bin, i) => {
                        let itemName = '', description = '', itemGroup = '', brand = '';
                        try {
                            const itemRes = await API.get(`/api/resource/Item/${encodeURIComponent(bin.item_code)}?fields=["item_name","description","item_group","brand"]`);
                            const item = itemRes.data.data || {};
                            itemName = item.item_name || '';
                            description = item.description || '';
                            itemGroup = item.item_group || '';
                            brand = item.brand || '';
                        } catch (_) {}

                        return {
                            _key: bin.name || i,
                            item_code: bin.item_code,
                            item_name: itemName,
                            description: description,
                            item_group: itemGroup,
                            brand: brand,
                            warehouse: bin.warehouse,
                            uom: bin.stock_uom || '',
                            actual_qty: bin.actual_qty || 0,
                            planned_qty: bin.planned_qty || 0,
                            requested_qty: bin.indented_qty || 0,
                            ordered_qty: bin.ordered_qty || 0,
                            reserved_qty: bin.reserved_qty || 0,
                            projected_qty: bin.projected_qty || 0,
                        };
                    })
                );

                setRecords(enrichedRows);
                setReportColumns(getDefaultColumns());

                // Calculate totals
                if (enrichedRows.length > 0) {
                    const tot = {
                        actual_qty: 0, planned_qty: 0, requested_qty: 0,
                        ordered_qty: 0, reserved_qty: 0, projected_qty: 0,
                    };
                    enrichedRows.forEach(r => {
                        tot.actual_qty += parseFloat(r.actual_qty) || 0;
                        tot.planned_qty += parseFloat(r.planned_qty) || 0;
                        tot.requested_qty += parseFloat(r.requested_qty) || 0;
                        tot.ordered_qty += parseFloat(r.ordered_qty) || 0;
                        tot.reserved_qty += parseFloat(r.reserved_qty) || 0;
                        tot.projected_qty += parseFloat(r.projected_qty) || 0;
                    });
                    setTotals(tot);
                }
            } catch (fallbackError) {
                message.warning('Could not fetch projected qty data. Displaying empty report.');
                setRecords([]);
                setReportColumns(getDefaultColumns());
                setTotals(null);
            }
        } finally {
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    const getDefaultColumns = () => [
        {
            title: 'Item Code', dataIndex: 'item_code', key: 'item_code', width: 140, fixed: 'left',
            render: val => <span className="text-blue-600 font-medium hover:underline cursor-pointer">{val || '–'}</span>,
        },
        { title: 'Item Name', dataIndex: 'item_name', key: 'item_name', width: 150, ellipsis: true },
        { title: 'Description', dataIndex: 'description', key: 'description', width: 180, ellipsis: true,
            render: val => {
                if (!val) return '–';
                // Strip HTML tags from description
                const text = val.replace(/<[^>]*>/g, '');
                return <span title={text}>{text}</span>;
            }
        },
        { title: 'Item Group', dataIndex: 'item_group', key: 'item_group', width: 130 },
        { title: 'Brand', dataIndex: 'brand', key: 'brand', width: 100 },
        {
            title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 160,
            render: val => <span className="text-blue-600">{val || '–'}</span>,
        },
        { title: 'UOM', dataIndex: 'uom', key: 'uom', width: 70, align: 'center' },
        {
            title: 'Actual Qty', dataIndex: 'actual_qty', key: 'actual_qty', width: 110, align: 'right',
            render: val => renderQtyCell(val),
        },
        {
            title: 'Planned Qty', dataIndex: 'planned_qty', key: 'planned_qty', width: 120, align: 'right',
            render: val => renderQtyCell(val),
        },
        {
            title: 'Requested Qty', dataIndex: 'requested_qty', key: 'requested_qty', width: 130, align: 'right',
            render: val => renderQtyCell(val),
        },
        {
            title: 'Ordered Qty', dataIndex: 'ordered_qty', key: 'ordered_qty', width: 120, align: 'right',
            render: val => renderQtyCell(val),
        },
        {
            title: 'Reserved Qty', dataIndex: 'reserved_qty', key: 'reserved_qty', width: 120, align: 'right',
            render: val => renderQtyCell(val),
        },
        {
            title: 'Projected Qty', dataIndex: 'projected_qty', key: 'projected_qty', width: 130, align: 'right',
            render: val => {
                if (val === undefined || val === null) return '–';
                const num = parseFloat(val);
                if (isNaN(num)) return val;
                return (
                    <span className={`font-semibold ${num < 0 ? 'text-red-500' : num > 0 ? 'text-emerald-600' : ''}`}>
                        {num.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </span>
                );
            },
        },
    ];

    const renderQtyCell = (val) => {
        if (val === undefined || val === null) return '–';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return (
            <span className={`font-medium ${num < 0 ? 'text-red-500' : ''}`}>
                {num.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </span>
        );
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

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

    // Build totals row for footer
    const buildTotalsColumns = () => {
        if (!totals) return null;
        const cols = reportColumns.length > 0 ? reportColumns : getDefaultColumns();
        return cols.map(col => {
            const val = totals[col.dataIndex];
            if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
                return parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            }
            if (col.dataIndex === 'item_code' || col.dataIndex === 'item_name') return col.dataIndex === 'item_code' ? 'Total' : '';
            return '';
        });
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Stock Projected Qty</h1>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-colors">
                        Actions <span className="text-xs">▼</span>
                    </button>
                    <button onClick={fetchReportData} className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
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
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa]">
                    <div className="grid grid-cols-6 gap-3 filter-grid">
                        <input
                            className={inputClass}
                            value={filters.company}
                            onChange={(e) => handleFilterChange('company', e.target.value)}
                            placeholder="Company"
                        />
                        {renderSelect('warehouse', 'Warehouse')}
                        {renderSelect('item_code', 'Item')}
                        {renderSelect('item_group', 'Item Group')}
                        {renderSelect('brand', 'Brand')}
                        {renderSelect('include_uom', 'Include UOM')}
                    </div>
                </div>

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
                                summary={() => {
                                    if (!totals) return null;
                                    const cols = reportColumns.length > 0 ? reportColumns : getDefaultColumns();
                                    return (
                                        <Table.Summary fixed>
                                            <Table.Summary.Row className="totals-row">
                                                {cols.map((col, idx) => {
                                                    const val = totals[col.dataIndex];
                                                    let content = '';

                                                    if (col.dataIndex === 'item_code' || col.dataIndex === 'item_name') {
                                                        content = col.dataIndex === 'item_code' ? (
                                                            <span className="font-bold text-gray-800">Total</span>
                                                        ) : '';
                                                    } else if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
                                                        content = (
                                                            <span className="font-bold text-gray-800">
                                                                {parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <Table.Summary.Cell
                                                            key={col.key}
                                                            index={idx}
                                                            align={col.align || 'left'}
                                                        >
                                                            {content}
                                                        </Table.Summary.Cell>
                                                    );
                                                })}
                                            </Table.Summary.Row>
                                        </Table.Summary>
                                    );
                                }}
                            />
                        )}
                    </Spin>
                </div>

                {/* Footer */}
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
                .totals-row td {
                    background: #f8f9fa !important;
                    border-top: 2px solid #e5e7eb !important;
                    padding: 8px 16px !important;
                    font-size: 13px !important;
                }
                .ant-table-summary {
                    background: #f8f9fa !important;
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

export default StockProjectedQty;
