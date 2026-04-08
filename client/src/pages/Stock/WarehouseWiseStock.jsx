import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Table, Tooltip, message } from 'antd';
import { FiRefreshCw, FiMoreHorizontal, FiPlus, FiHeart, FiMessageSquare, FiChevronLeft, FiChevronRight, FiPrinter } from 'react-icons/fi';

const WarehouseWiseStock = () => {
    const [viewMode, setViewMode] = useState('report'); // Default to 'report' instead of 'config'
    
    // Config state
    const [isDisabled, setIsDisabled] = useState(false);
    const [isPrepared, setIsPrepared] = useState(true);
    const [addTotalRow, setAddTotalRow] = useState(false);
    
    // Report state
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [executionTime, setExecutionTime] = useState(null);
    const [filters, setFilters] = useState({
        company: 'Ketty Apparels',
        show_disabled: false
    });

    // Auto-fetch report data on mount
    useEffect(() => {
        if (viewMode === 'report') {
            fetchReportData();
        }
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        const startTime = performance.now();
        
        try {
            // Use reliable API resources directly instead of custom query report
            // 1. Fetch Warehouses matching company filter
            const whFilters = filters.company ? `&filters=[["company","=","${filters.company}"]]` : '';
            const whRes = await API.get(`/api/resource/Warehouse?limit_page_length=500&fields=["name","parent_warehouse","is_group","disabled","company"]${whFilters}`);
            let warehouses = whRes.data.data || [];
            
            if (!filters.show_disabled) {
                warehouses = warehouses.filter(w => !w.disabled);
            }

            // 2. Fetch Bin data for actual quantities
            const binRes = await API.get(`/api/resource/Bin?limit_page_length=2000&fields=["warehouse","actual_qty"]`);
            const bins = binRes.data.data || [];

            // Map Bin data to warehouses
            const qtyMap = {};
            bins.forEach(b => {
                qtyMap[b.warehouse] = (qtyMap[b.warehouse] || 0) + b.actual_qty;
            });

            // Build tree mapping
            const whMap = {};
            warehouses.forEach(w => {
                whMap[w.name] = { 
                    _key: w.name, 
                    warehouse: w.name, 
                    stock_balance: qtyMap[w.name] || 0,
                    is_group: w.is_group,
                    parent: w.parent_warehouse,
                    disabled: w.disabled,
                    children: [] 
                };
            });

            const rootNodes = [];
            warehouses.forEach(w => {
                const node = whMap[w.name];
                // Only attach to parent if parent exists in our filtered list
                if (node.parent && whMap[node.parent]) {
                    whMap[node.parent].children.push(node);
                } else {
                    rootNodes.push(node);
                }
            });

            // Calculate group totals bottom-up recursively
            const calculateTotals = (node) => {
                let total = node.stock_balance || 0;
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => {
                        total += calculateTotals(child);
                    });
                    node.stock_balance = total;
                } else {
                    delete node.children; // remove empty children array so expand icon disappears
                }
                return total;
            };

            rootNodes.forEach(root => calculateTotals(root));
            setRecords(rootNodes);

        } catch (error) {
            console.error('Failed to fetch stock balance report builder data.', error);
            message.error("Failed to load stock data");
            setRecords([]);
        } finally {
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    // Helper to turn ERPNext flat 'indent' array into tree
    const buildTreeFromIndent = (flatRows) => {
        const root = [];
        const path = [];
        flatRows.forEach((row, i) => {
            const node = { ...row, _key: row.name || i, children: [] };
            const lvl = row.indent || 0;
            if (lvl === 0) {
                root.push(node);
                path[0] = node;
            } else {
                path[lvl] = node;
                if (path[lvl - 1] && path[lvl - 1].children) {
                    path[lvl - 1].children.push(node);
                }
            }
        });
        
        // Remove empty children arrays
        const cleanup = (nodes) => {
            nodes.forEach(n => {
                if (n.children.length === 0) delete n.children;
                else cleanup(n.children);
            });
        };
        cleanup(root);
        return root;
    };

    const handleToggleDisable = () => {
        setIsDisabled(!isDisabled);
        message.success(`Report ${!isDisabled ? 'Disabled' : 'Enabled'} successfully`);
    };

    const handleShowReport = () => {
        setViewMode('report');
        fetchReportData();
    };

    const reportColumns = [
        { 
            title: 'Warehouse', 
            dataIndex: 'warehouse', 
            key: 'warehouse', 
            width: 300,
            render: (text, record) => <span className={record.is_group || record.children ? "font-medium" : ""}>{text}</span>
        },
        { 
            title: 'Stock Balance', 
            dataIndex: 'stock_balance', 
            key: 'stock_balance', 
            width: 150, 
            align: 'right',
            render: (val, record) => {
                // Determine the correct value from available keys since standard Frappe reports 
                // might return balance_qty, actual_qty, qty, etc. instead of stock_balance
                const bal = val ?? record.stock_balance ?? record.balance_qty ?? record.actual_qty ?? record.qty ?? record.balance ?? 0;
                const num = parseFloat(bal) || 0;
                return (
                    <span className={record.is_group || record.children ? "font-medium text-gray-800" : "text-gray-600"}>
                        {num.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </span>
                );
            }
        },
    ];

    if (filters.show_disabled) {
        reportColumns.push({
            title: 'Warehouse Disabled?',
            dataIndex: 'disabled',
            key: 'disabled',
            width: 150,
            render: val => <input type="checkbox" readOnly checked={!!val} className="accent-gray-400" />
        });
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            {viewMode === 'config' ? (
                // CONFIGURATION VIEW
                <div>
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                        <span>Report</span> <FiChevronRight size={12} /> <span>Warehouse Wise Stock Balance</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-3">
                            <FiMoreHorizontal size={18} className="text-gray-400 rotate-90" />
                            <h1 className="text-2xl font-bold">Warehouse Wise Stock Balance</h1>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isDisabled ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isDisabled ? 'Disabled' : 'Enabled'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleShowReport} className="px-4 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                                Show Report
                            </button>
                            <button onClick={handleToggleDisable} className="px-4 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                                {isDisabled ? 'Enable Report' : 'Disable Report'}
                            </button>
                            <div className="flex bg-gray-100 border border-gray-300 rounded overflow-hidden">
                                <button className="px-2 py-1.5 border-r border-gray-300 hover:bg-gray-200"><FiChevronLeft size={16} /></button>
                                <button className="px-2 py-1.5 hover:bg-gray-200"><FiChevronRight size={16} /></button>
                            </div>
                            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                <FiPrinter size={16} className="text-gray-600" />
                            </button>
                            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                <FiMoreHorizontal size={16} />
                            </button>
                            <button className="px-6 py-1.5 bg-gray-900 border border-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors">
                                Save
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-8">
                        {/* Main Form Area */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {/* Col 1 */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Ref DocType <span className="text-red-500">*</span></label>
                                        <input type="text" readOnly value="Stock Ledger Entry" className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 font-medium cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Reference Report</label>
                                        <input type="text" readOnly className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Is Standard <span className="text-red-500">*</span></label>
                                        <select className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 pointer-events-none appearance-none">
                                            <option>Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Module</label>
                                        <input type="text" readOnly value="Stock" className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 font-medium cursor-not-allowed" />
                                    </div>
                                </div>
                                {/* Col 2 */}
                                <div className="space-y-4">
                                    <div className="mb-6">
                                        <label className="block text-xs text-gray-500 mb-1">Report Type <span className="text-red-500">*</span></label>
                                        <select className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded px-3 py-2 text-sm text-gray-700 shadow-sm appearance-none outline-none">
                                            <option>Script Report</option>
                                            <option>Query Report</option>
                                            <option>Report Builder</option>
                                        </select>
                                    </div>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={addTotalRow} onChange={e => setAddTotalRow(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">Add Total Row</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={isDisabled} onChange={handleToggleDisable} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900">Disabled</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group pb-4">
                                        <input type="checkbox" checked={isPrepared} onChange={e => setIsPrepared(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-black" />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Prepared Report</span>
                                    </label>

                                    {isPrepared && (
                                        <div className="bg-white overflow-hidden transition-all duration-300">
                                            <label className="block text-xs text-gray-500 mb-1">Timeout (In Seconds)</label>
                                            <input type="number" defaultValue="0" className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 shadow-inner" />
                                            <p className="text-xs text-gray-500 mt-1">Specify a custom timeout, default timeout is 1500 seconds</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filters Tab block */}
                            <div className="mt-8 border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer">
                                    <span className="font-semibold text-sm">Filters</span>
                                    <FiChevronRight className="rotate-90 text-gray-400" />
                                </div>
                                <div className="p-4 bg-white">
                                    <span className="text-xs text-gray-500 mb-2 block">Filters</span>
                                    <div className="border border-gray-200 rounded min-h-[120px]">
                                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center text-xs text-gray-500 font-medium">
                                            <div className="w-8"><input type="checkbox" className="rounded" disabled /></div>
                                            <div className="w-12">No.</div>
                                            <div className="flex-1">Label <span className="text-red-400">*</span></div>
                                            <div className="flex-1">Fieldtype <span className="text-red-400">*</span></div>
                                            <div className="flex-1">Fieldname <span className="text-red-400">*</span></div>
                                            <div className="w-24">Mandatory</div>
                                            <div className="flex-1">Options</div>
                                            <div className="w-8 flex justify-center">⚙</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                                            <div className="w-8 h-10 border border-gray-300 rounded flex flex-col gap-1 items-center justify-center p-1 mb-2 opacity-50 relative">
                                                <div className="h-0.5 bg-gray-300 w-full" />
                                                <div className="h-0.5 bg-gray-300 w-full" />
                                            </div>
                                            <span className="text-xs font-medium">No Data</span>
                                        </div>
                                        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
                                            Add Row
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Columns section */}
                            <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span className="font-semibold text-sm">Columns</span>
                                    <FiChevronRight className="rotate-90 text-gray-400" />
                                </div>
                                <div className="p-4 bg-white">
                                    <span className="text-xs text-gray-500 mb-2 block">Columns</span>
                                    <div className="border border-gray-200 rounded min-h-[120px]">
                                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center text-xs text-gray-500 font-medium">
                                            <div className="w-8"><input type="checkbox" className="rounded" disabled /></div>
                                            <div className="w-12">No.</div>
                                            <div className="flex-1">Fieldname <span className="text-red-400">*</span></div>
                                            <div className="flex-1">Label <span className="text-red-400">*</span></div>
                                            <div className="flex-[1.5]">Fieldtype <span className="text-red-400">*</span></div>
                                            <div className="w-8 flex justify-center">⚙</div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                                            <div className="w-8 h-10 border border-gray-300 rounded flex flex-col gap-1 items-center justify-center p-1 mb-2 opacity-50 relative">
                                                <div className="h-0.5 bg-gray-300 w-full" />
                                                <div className="h-0.5 bg-gray-300 w-full" />
                                            </div>
                                            <span className="text-xs font-medium">No Data</span>
                                        </div>
                                        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
                                            Add Row
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Code section */}
                            <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span className="font-semibold text-sm">Client Code</span>
                                    <FiChevronRight className="rotate-90 text-gray-400" />
                                </div>
                                <div className="p-4 bg-white">
                                    <label className="block text-xs text-gray-500 mb-1">JSON</label>
                                    <div className="relative">
                                        <textarea readOnly defaultValue="{}" className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 min-h-[60px] cursor-text font-mono" />
                                        <div className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer scale-x-[-1]">📋</div>
                                    </div>
                                </div>
                            </div>

                            {/* Roles section */}
                            <div className="mt-4 border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span className="font-semibold text-sm flex items-center gap-2">Roles</span>
                                </div>
                                <div className="p-4 bg-white">
                                    <div className="border border-gray-200 rounded">
                                        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center text-xs text-gray-500 font-medium">
                                            <div className="w-8"><input type="checkbox" className="rounded" disabled /></div>
                                            <div className="w-12">No.</div>
                                            <div className="flex-1">Role</div>
                                            <div className="w-8 flex justify-center">⚙</div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            <div className="px-3 py-2 flex items-center text-xs text-gray-800 hover:bg-gray-50 cursor-pointer">
                                                <div className="w-8"><input type="checkbox" className="rounded accent-black border-gray-300" /></div>
                                                <div className="w-12 text-gray-500">1</div>
                                                <div className="flex-1">Stock User</div>
                                                <div className="w-8 flex justify-center text-gray-400 cursor-pointer hover:text-gray-700">✎</div>
                                            </div>
                                            <div className="px-3 py-2 flex items-center text-xs text-gray-800 hover:bg-gray-50 cursor-pointer">
                                                <div className="w-8"><input type="checkbox" className="rounded accent-black border-gray-300" /></div>
                                                <div className="w-12 text-gray-500">2</div>
                                                <div className="flex-1">Accounts Manager</div>
                                                <div className="w-8 flex justify-center text-gray-400 cursor-pointer hover:text-gray-700">✎</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
                                            Add Row
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // REPORT VIEW
                <div className="animate-fade-in text-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setViewMode('config')} className="p-1.5 hover:bg-gray-100 rounded mr-1 tooltip-container relative group">
                                <FiChevronLeft size={20} />
                                <span className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-1 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">Back to config</span>
                            </button>
                            <h1 className="text-xl font-bold">Warehouse Wise Stock Balance</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200 flex items-center gap-2 transition-colors">
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

                    <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-[#f8f9fa] flex items-center gap-5">
                            <input 
                                className="w-[200px] bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-400 transition-colors"
                                value={filters.company}
                                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="Company"
                            />
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={filters.show_disabled}
                                    onChange={(e) => setFilters(prev => ({ ...prev, show_disabled: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-800 accent-black"
                                />
                                <span className="text-sm font-medium text-gray-700">Show Disabled Warehouses</span>
                            </label>
                        </div>

                        <div className="flex-1 overflow-auto relative">
                            <Spin spinning={loading} className="absolute inset-0 z-10 bg-white/50" />
                            <Table
                                dataSource={records}
                                columns={reportColumns}
                                rowKey="_key"
                                pagination={false}
                                size="small"
                                className="border-t border-gray-100 custom-tree-table"
                                scroll={{ x: 'max-content' }}
                                expandable={{
                                    defaultExpandAllRows: true, // typical for ERNext tree reports
                                }}
                            />
                            {!loading && records.length > 0 && (
                                <div className="p-3 bg-white">
                                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-medium rounded transition-colors text-gray-700">
                                        Collapse All
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 bg-[#f8f9fa] flex justify-between items-center text-[11px] text-gray-500">
                            <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                            <span>Execution Time: {loading ? '...' : executionTime || '0.000000'} sec</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-tree-table .ant-table-thead > tr > th {
                    background: #f8f9fa !important;
                    color: #6b7280 !important;
                    font-size: 11px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 10px 16px !important;
                    border-bottom: 1px solid #f3f4f6 !important;
                }
                .custom-tree-table .ant-table-tbody > tr > td {
                    padding: 8px 16px !important;
                    font-size: 13px !important;
                    border-bottom: 1px solid #f9fafb !important;
                }
                .custom-tree-table .ant-table-tbody > tr:hover > td {
                    background: #f0f9ff !important;
                }
                /* Tweak tree expand icon */
                .ant-table-row-expand-icon {
                    margin-right: 8px !important;
                    margin-top: -2px !important;
                    color: #6b7280 !important;
                }
            `}</style>
        </div>
    );
};

export default WarehouseWiseStock;
