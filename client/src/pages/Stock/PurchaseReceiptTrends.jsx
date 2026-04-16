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

export default function PurchaseReceiptTrends() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState(0);

    const [filters, setFilters] = useState({
        company: localStorage.getItem('company') || '',
        periodicity: 'Monthly',
        fiscal_year: '2026-2027',
        based_on: 'Posting Date',
        item: '',
        group_by: 'Item Group'
    });

    const [masters, setMasters] = useState({
        companies: [],
        fiscal_years: [],
        items: []
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [compRes, fyRes, itemRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Fiscal Year?fields=["name"]&limit_page_length=50'),
                API.get('/api/resource/Item?fields=["name"]&limit_page_length=500')
            ]);
            setMasters({
                companies: compRes.data?.data || [],
                fiscal_years: fyRes.data?.data || [],
                items: itemRes.data?.data || []
            });
            if (!filters.fiscal_year && fyRes.data?.data?.[0]) {
                setFilters(p => ({ ...p, fiscal_year: fyRes.data.data[0].name }));
            }
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
                    report_name: 'Purchase Receipt Trends',
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
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">Purchase Receipt Trends</h1>
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
                    <div className="grid grid-cols-6 gap-4">
                        <div>
                            <FilterLabel label="Company" />
                            <Select
                                className="w-full report-select"
                                value={filters.company}
                                onChange={v => handleFilterChange('company', v)}
                                options={masters.companies.map(c => ({ value: c.name, label: c.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Periodicity" />
                            <Select
                                className="w-full report-select font-bold text-gray-900"
                                value={filters.periodicity}
                                onChange={v => handleFilterChange('periodicity', v)}
                                options={[{value:'Daily',label:'Daily'},{value:'Weekly',label:'Weekly'},{value:'Monthly',label:'Monthly'},{value:'Yearly',label:'Yearly'}]}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Fiscal Year" />
                            <Select
                                className="w-full report-select"
                                showSearch
                                value={filters.fiscal_year}
                                onChange={v => handleFilterChange('fiscal_year', v)}
                                options={masters.fiscal_years.map(f => ({ value: f.name, label: f.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Based On" />
                            <Select
                                className="w-full report-select"
                                value={filters.based_on}
                                onChange={v => handleFilterChange('based_on', v)}
                                options={[{value:'Item',label:'Item'},{value:'Item Group',label:'Item Group'},{value:'Supplier',label:'Supplier'},{value:'Supplier Group',label:'Supplier Group'},{value:'Project',label:'Project'},{value:'Posting Date',label:'Posting Date'}]}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Item" />
                            <Select
                                className="w-full report-select"
                                showSearch
                                allowClear
                                placeholder="Select Item"
                                value={filters.item || undefined}
                                onChange={v => handleFilterChange('item', v)}
                                options={masters.items.map(i => ({ value: i.name, label: i.name }))}
                            />
                        </div>
                        <div>
                            <FilterLabel label="Group By" />
                            <Select
                                className="w-full report-select"
                                value={filters.group_by}
                                onChange={v => handleFilterChange('group_by', v)}
                                options={[{value:'',label:'None'},{value:'Item',label:'Item'},{value:'Item Group',label:'Item Group'},{value:'Supplier',label:'Supplier'},{value:'Supplier Group',label:'Supplier Group'}]}
                            />
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px] bg-[#fbfcfd] border-t border-gray-100 flex flex-col items-center justify-center p-8 relative">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Spin size="large" />
                            <span className="text-sm text-gray-400 font-medium">Analyzing Purchase Trends...</span>
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
                        <Empty 
                            description={<span className="text-gray-400 text-[15px] font-medium">Nothing to show</span>} 
                            image={<FiFilter size={48} className="text-gray-100 mb-2" />}
                        />
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
