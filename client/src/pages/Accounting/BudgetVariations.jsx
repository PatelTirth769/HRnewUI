import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, notification } from 'antd';
import API from '../../services/api';

const PERIODICITY_OPTIONS = ['Yearly', 'Half-Yearly', 'Quarterly', 'Monthly'];
const BASIS_OPTIONS = ['Cost Center', 'Project'];

const BudgetVariations = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null); // null means no report run yet
    const [executionTime, setExecutionTime] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [fiscalYears, setFiscalYears] = useState([]);

    const [filters, setFilters] = useState({
        from_fiscal_year: '2025-2026',
        to_fiscal_year: '2025-2026',
        periodicity: 'Yearly',
        company: '',
        group_by: 'Cost Center',
        dimension_filter: '',
        show_cumulative: 0
    });

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [compRes, fyRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Fiscal Year?fields=["name"]&limit_page_length=None')
            ]);
            setCompanies((compRes.data.data || []).map(c => c.name));
            setFiscalYears((fyRes.data.data || []).map(f => f.name));
            
            if (compRes.data.data?.length > 0) {
                setFilters(prev => ({ ...prev, company: compRes.data.data[0].name }));
            }
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    };

    const fetchReport = async () => {
        if (!filters.company || !filters.from_fiscal_year) {
            notification.warning({ message: 'Filters Required', description: 'Company and Fiscal Year are mandatory.' });
            return;
        }

        const startTime = performance.now();
        setLoading(true);
        try {
            const response = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Budget Variance Report',
                filters: filters
            });
            
            setReportData(response.data.message || { result: [] });
            setExecutionTime(((performance.now() - startTime) / 1000).toFixed(6));
        } catch (err) {
            console.error('Error running report:', err);
            notification.error({ message: 'Report Failed', description: err.response?.data?._server_messages || err.message });
            setReportData({ result: [] });
        } finally {
            setLoading(false);
        }
    };

    const filterInputStyle = "w-full border border-gray-100 rounded-md px-3 py-1.5 text-[13px] bg-gray-50/50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm";
    const headerBtnStyle = "p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition shadow-sm flex items-center justify-center";

    return (
        <div className="p-6 bg-white min-h-screen font-sans">
            {/* Header matches Mockup */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Budget Variance Report</h1>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                        Actions <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button className={headerBtnStyle} onClick={fetchReport} title="Refresh">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button className={headerBtnStyle}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                </div>
            </div>

            {/* Filters Row 1 */}
            <div className="grid grid-cols-6 gap-3 mb-3">
                <select className={filterInputStyle} value={filters.from_fiscal_year} onChange={e => setFilters({ ...filters, from_fiscal_year: e.target.value })}>
                    {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                </select>
                <select className={filterInputStyle} value={filters.to_fiscal_year} onChange={e => setFilters({ ...filters, to_fiscal_year: e.target.value })}>
                    {fiscalYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                </select>
                <select className={filterInputStyle} value={filters.periodicity} onChange={e => setFilters({ ...filters, periodicity: e.target.value })}>
                    {PERIODICITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select className={filterInputStyle} value={filters.company} onChange={e => setFilters({ ...filters, company: e.target.value })}>
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className={filterInputStyle} value={filters.group_by} onChange={e => setFilters({ ...filters, group_by: e.target.value })}>
                    {BASIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input className={filterInputStyle} value={filters.dimension_filter} onChange={e => setFilters({ ...filters, dimension_filter: e.target.value })} placeholder="Dimension Filter" />
            </div>

            {/* Filters Row 2 */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="cum_chk" 
                        checked={!!filters.show_cumulative} 
                        onChange={e => setFilters({ ...filters, show_cumulative: e.target.checked ? 1 : 0 })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <label htmlFor="cum_chk" className="text-sm font-medium text-gray-700">Show Cumulative Amount</label>
                </div>
            </div>

            {/* Report Content area */}
            <div className="border border-gray-100 rounded-lg min-h-[400px] flex flex-col shadow-sm">
                {!reportData || reportData.result?.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-gray-400 font-medium italic">
                            {loading ? <Spin tip="Running Report..." /> : 'Nothing to show'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-[#F9FAFB] border-b text-gray-600 font-bold sticky top-0 z-10">
                                <tr>
                                    {(reportData.columns || []).map((col, idx) => (
                                        <th key={idx} className="px-4 py-3 uppercase tracking-tighter text-[11px] whitespace-nowrap">
                                            {typeof col === 'string' ? col : col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reportData.result.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                                        {(Array.isArray(row) ? row : Object.values(row)).map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-3 font-medium text-gray-800">
                                                {cell === null || cell === undefined ? '-' : 
                                                 typeof cell === 'number' ? cell.toLocaleString(undefined, { minimumFractionDigits: 2 }) : 
                                                 String(cell)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer matching Mockup */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                <div className="max-w-2xl leading-relaxed">
                    For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 & 10).
                </div>
                <div>
                    Execution Time: {executionTime} sec
                </div>
            </div>
        </div>
    );
};

export default BudgetVariations;
