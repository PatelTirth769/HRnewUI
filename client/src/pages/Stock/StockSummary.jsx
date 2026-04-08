import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message } from 'antd';
import { FiFilter, FiChevronDown, FiChevronUp, FiPackage, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const StockSummary = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [sortField, setSortField] = useState('projected_qty');
    const [sortOrder, setSortOrder] = useState('desc');

    const [filters, setFilters] = useState({
        warehouse: '',
        item_code: '',
        item_group: '',
    });

    // Dynamic dropdown options
    const [options, setOptions] = useState({
        warehouse: [],
        item_code: [],
        item_group: [],
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
        fetchStockData();
    }, []);

    const fetchStockData = async () => {
        setLoading(true);
        try {
            // Primary: try Bin resource for current stock snapshot
            let binUrl = `/api/resource/Bin?fields=["name","item_code","warehouse","actual_qty","planned_qty","reserved_qty","ordered_qty","indented_qty","projected_qty","stock_uom","valuation_rate","stock_value"]&limit_page_length=200&order_by=${sortField} ${sortOrder}`;

            const apiFilters = [];
            if (filters.item_code) apiFilters.push(`["item_code","=","${filters.item_code}"]`);
            if (filters.warehouse) apiFilters.push(`["warehouse","=","${filters.warehouse}"]`);
            if (apiFilters.length > 0) binUrl += `&filters=[${apiFilters.join(',')}]`;

            const binResponse = await API.get(binUrl);
            const binData = binResponse.data.data || [];

            // Enrich with item details (item_name, item_group, image)
            const enrichedRows = await Promise.all(
                binData.map(async (bin, i) => {
                    let itemName = bin.item_code;
                    let itemGroup = '';
                    let image = '';
                    let description = '';
                    try {
                        const itemRes = await API.get(`/api/resource/Item/${encodeURIComponent(bin.item_code)}?fields=["item_name","item_group","image","description"]`);
                        const item = itemRes.data.data || {};
                        itemName = item.item_name || bin.item_code;
                        itemGroup = item.item_group || '';
                        image = item.image || '';
                        description = item.description || '';
                    } catch (_) {}

                    return {
                        _key: bin.name || i,
                        item_code: bin.item_code,
                        item_name: itemName,
                        item_group: itemGroup,
                        image: image,
                        description: description,
                        warehouse: bin.warehouse,
                        stock_uom: bin.stock_uom || '',
                        actual_qty: parseFloat(bin.actual_qty) || 0,
                        planned_qty: parseFloat(bin.planned_qty) || 0,
                        reserved_qty: parseFloat(bin.reserved_qty) || 0,
                        ordered_qty: parseFloat(bin.ordered_qty) || 0,
                        indented_qty: parseFloat(bin.indented_qty) || 0,
                        projected_qty: parseFloat(bin.projected_qty) || 0,
                        valuation_rate: parseFloat(bin.valuation_rate) || 0,
                        stock_value: parseFloat(bin.stock_value) || 0,
                    };
                })
            );

            // Filter by item_group client-side if specified (since Bin doesn't have item_group)
            let filtered = enrichedRows;
            if (filters.item_group) {
                filtered = enrichedRows.filter(r => r.item_group === filters.item_group);
            }

            // Sort
            filtered.sort((a, b) => {
                const aVal = a[sortField] || 0;
                const bVal = b[sortField] || 0;
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });

            setRecords(filtered);
        } catch (error) {
            console.error('Stock Summary error:', error);
            message.warning('Could not fetch stock data.');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters change
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStockData();
        }, 400);
        return () => clearTimeout(timeout);
    }, [filters.warehouse, filters.item_code, filters.item_group, sortField, sortOrder]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const renderSelect = (key, placeholder) => (
        <Select
            showSearch
            allowClear
            placeholder={placeholder}
            className="w-full custom-summary-select"
            value={filters[key] || undefined}
            onChange={(val) => handleFilterChange(key, val || '')}
            options={options[key]}
            filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={<span className="text-gray-400 text-xs p-2 block">No results</span>}
        />
    );

    const formatQty = (val) => {
        if (val === undefined || val === null) return '0.000';
        return parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '₹ 0.00';
        return '₹ ' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const sortButtons = [
        { field: 'projected_qty', label: 'Projected qty' },
        { field: 'actual_qty', label: 'Actual qty' },
        { field: 'reserved_qty', label: 'Reserved qty' },
        { field: 'ordered_qty', label: 'Ordered qty' },
    ];

    return (
        <div className="p-6 max-w-[1100px] mx-auto pb-24 text-gray-800">
            {/* Header */}
            <h1 className="text-xl font-bold mb-5">Stock Summary</h1>

            {/* Filters Row */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa]">
                    <div className="flex items-center gap-3">
                        <div className="w-[180px]">
                            {renderSelect('warehouse', 'Warehouse')}
                        </div>
                        <div className="w-[180px]">
                            {renderSelect('item_code', 'Item')}
                        </div>
                        <div className="w-[180px]">
                            {renderSelect('item_group', 'Item Group')}
                        </div>

                        {/* Sort Buttons */}
                        <div className="flex items-center gap-2 ml-2">
                            {sortButtons.map(btn => (
                                <button
                                    key={btn.field}
                                    onClick={() => toggleSort(btn.field)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-all ${
                                        sortField === btn.field
                                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <FiFilter size={12} />
                                    {btn.label}
                                    {sortField === btn.field && (
                                        sortOrder === 'desc' ? <FiArrowDown size={12} /> : <FiArrowUp size={12} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    <Spin spinning={loading}>
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                                <FiPackage size={36} className="mb-3 opacity-40" />
                                <span className="text-sm font-medium text-gray-500">No Stock Available Currently</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {records.map((row, idx) => (
                                    <div
                                        key={row._key}
                                        className="px-5 py-4 hover:bg-blue-50/40 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between">
                                            {/* Left: Item Info */}
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                {/* Item Avatar */}
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                                                    {row.image ? (
                                                        <img src={row.image} alt={row.item_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FiPackage size={18} className="text-gray-400" />
                                                    )}
                                                </div>

                                                {/* Item Details */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                                            {row.item_name}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-mono">
                                                            {row.item_code}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        {row.item_group && (
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                                {row.item_group}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400">
                                                            {row.warehouse}
                                                        </span>
                                                        {row.stock_uom && (
                                                            <span className="text-gray-400">
                                                                UOM: {row.stock_uom}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Qty Cards */}
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <QtyCard
                                                    label="Actual"
                                                    value={row.actual_qty}
                                                    highlight={sortField === 'actual_qty'}
                                                />
                                                <QtyCard
                                                    label="Reserved"
                                                    value={row.reserved_qty}
                                                    highlight={sortField === 'reserved_qty'}
                                                    negative
                                                />
                                                <QtyCard
                                                    label="Ordered"
                                                    value={row.ordered_qty}
                                                    highlight={sortField === 'ordered_qty'}
                                                />
                                                <QtyCard
                                                    label="Planned"
                                                    value={row.planned_qty}
                                                    highlight={false}
                                                />
                                                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                                                <QtyCard
                                                    label="Projected"
                                                    value={row.projected_qty}
                                                    highlight={sortField === 'projected_qty'}
                                                    bold
                                                />
                                                <div className="text-right min-w-[90px]">
                                                    <div className="text-[10px] uppercase text-gray-400 tracking-wide mb-0.5">Value</div>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {formatCurrency(row.stock_value)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Spin>
                </div>
            </div>

            <style>{`
                .custom-summary-select .ant-select-selector {
                    height: 33.6px !important;
                    padding: 0 11px !important;
                    background-color: #f9fafb !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.375rem !important;
                    display: flex !important;
                    align-items: center !important;
                    font-size: 0.875rem !important;
                }
                .custom-summary-select .ant-select-selector:hover {
                    border-color: #60a5fa !important;
                }
                .custom-summary-select.ant-select-focused .ant-select-selector {
                    border-color: #60a5fa !important;
                    background-color: #ffffff !important;
                    box-shadow: none !important;
                }
                .custom-summary-select .ant-select-selection-placeholder {
                    color: #9ca3af !important;
                    font-size: 0.875rem !important;
                }
            `}</style>
        </div>
    );
};

// Qty display card sub-component
const QtyCard = ({ label, value, highlight, bold, negative }) => {
    const num = parseFloat(value) || 0;
    const isNeg = num < 0;
    const isPos = num > 0;

    let colorClass = 'text-gray-700';
    if (isNeg) colorClass = 'text-red-500';
    else if (negative && isPos) colorClass = 'text-amber-600';
    else if (isPos && bold) colorClass = num > 0 ? 'text-emerald-600' : 'text-gray-700';

    return (
        <div className={`text-right min-w-[70px] ${highlight ? 'opacity-100' : 'opacity-75'}`}>
            <div className="text-[10px] uppercase text-gray-400 tracking-wide mb-0.5">{label}</div>
            <div className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${colorClass}`}>
                {num.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </div>
        </div>
    );
};

export default StockSummary;
