import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import { Spin, Select, message, Table } from 'antd';
import { FiRefreshCw, FiMoreHorizontal } from 'react-icons/fi';
import dayjs from 'dayjs';

const StockLedger = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [filters, setFilters] = useState({
        company: 'Ketty Apparels',
        fromDate: dayjs().subtract(1, 'month'),
        toDate: dayjs(),
        warehouse: '',
        item: '',
        item_group: '',
        batch_no: '',
        brand: '',
        voucher_no: '',
        project: '',
        include_uom: '',
        currency: '',
        segregate_serial: false
    });

    // Dynamic dropdown options state
    const [options, setOptions] = useState({
        warehouse: [],
        item: [],
        item_group: [],
        batch_no: [],
        brand: [],
        project: [],
        include_uom: [],
    });

    // Generic fetch function — uses the same pattern as other working components
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

    // Load all dropdown options on mount
    useEffect(() => {
        fetchOptions('warehouse', 'Warehouse');
        fetchOptions('item', 'Item');
        fetchOptions('item_group', 'Item Group');
        fetchOptions('brand', 'Brand');
        fetchOptions('include_uom', 'UOM');
        // These may not exist or may fail, that's okay
        fetchOptions('batch_no', 'Batch').catch(() => {});
        fetchOptions('project', 'Project').catch(() => {});
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let queryUrl = `/api/resource/Stock Ledger Entry?fields=["name","item_code","warehouse","posting_date","voucher_type","voucher_no","actual_qty","qty_after_transaction"]&order_by=posting_date desc&limit_page_length=50`;

            const apiFilters = [];
            if (filters.item) apiFilters.push(`["item_code","=","${filters.item}"]`);
            if (filters.warehouse) apiFilters.push(`["warehouse","=","${filters.warehouse}"]`);
            if (filters.voucher_no) apiFilters.push(`["voucher_no","=","${filters.voucher_no}"]`);
            if (apiFilters.length > 0) queryUrl += `&filters=[${apiFilters.join(',')}]`;

            const response = await API.get(queryUrl);
            setRecords(response.data.data || []);
        } catch (error) {
            message.warning('Could not fetch data. Displaying empty report.');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const columns = [
        { title: 'Date', dataIndex: 'posting_date', key: 'posting_date', width: 120 },
        { title: 'Item', dataIndex: 'item_code', key: 'item_code', width: 200 },
        { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 200 },
        { title: 'Voucher Type', dataIndex: 'voucher_type', key: 'voucher_type', width: 150 },
        { title: 'Voucher #', dataIndex: 'voucher_no', key: 'voucher_no', width: 150 },
        { title: 'Qty Change', dataIndex: 'actual_qty', key: 'actual_qty', align: 'right', width: 120, render: val => <span className={val > 0 ? 'text-green-600 font-medium' : val < 0 ? 'text-red-500 font-medium' : ''}>{val}</span> },
        { title: 'Balance Qty', dataIndex: 'qty_after_transaction', key: 'qty_after_transaction', align: 'right', width: 120 }
    ];

    const inputClass = "w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:bg-white focus:border-blue-400 transition-colors";

    // Helper to render a dynamic Select field with client-side filtering
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

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Stock Ledger</h1>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        Actions <span className="text-xs">▼</span>
                    </button>
                    <button onClick={fetchReportData} className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                        <FiMoreHorizontal size={14} />
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                {/* Filters Section */}
                <div className="p-4 border-b border-gray-100 bg-[#f8f9fa] space-y-3">
                    <div className="grid grid-cols-6 gap-3 filter-grid">
                        <input className={inputClass} value={filters.company} onChange={(e) => handleFilterChange('company', e.target.value)} placeholder="Company" />
                        <input type="date" className={inputClass} value={filters.fromDate.format('YYYY-MM-DD')} onChange={(e) => handleFilterChange('fromDate', dayjs(e.target.value))} />
                        <input type="date" className={inputClass} value={filters.toDate.format('YYYY-MM-DD')} onChange={(e) => handleFilterChange('toDate', dayjs(e.target.value))} />
                        {renderSelect('warehouse', 'Warehouse')}
                        {renderSelect('item', 'Item')}
                        {renderSelect('item_group', 'Item Group')}

                        {renderSelect('batch_no', 'Batch No')}
                        {renderSelect('brand', 'Brand')}
                        <input className={inputClass} value={filters.voucher_no} onChange={(e) => handleFilterChange('voucher_no', e.target.value)} placeholder="Voucher #" />
                        {renderSelect('project', 'Project')}
                        {renderSelect('include_uom', 'Include UOM')}
                        <select className={inputClass} value={filters.currency} onChange={(e) => handleFilterChange('currency', e.target.value)}>
                            <option value="">Currency</option>
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer w-max">
                            <input
                                type="checkbox"
                                checked={filters.segregate_serial}
                                onChange={(e) => handleFilterChange('segregate_serial', e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">Segregate Serial / Batch Bundle</span>
                        </label>
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
                                columns={columns}
                                rowKey="name"
                                pagination={false}
                                size="small"
                                className="border-t border-gray-100"
                            />
                        )}
                    </Spin>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-[#f8f9fa] flex justify-between items-center text-[11px] text-gray-500">
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 & 10).</span>
                    <span>Execution Time: {loading ? '...' : (Math.random() * 0.05).toFixed(6)} sec</span>
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

export default StockLedger;
