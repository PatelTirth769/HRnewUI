import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { notification } from 'antd';

const SelectField = ({ label, value, options, onChange }) => (
    <div>
        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label}</label>
        <select className="w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 hover:border-gray-300 transition-colors"
            value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value=""></option>
            {options.map((o, i) => <option key={i} value={o}>{o}</option>)}
        </select>
    </div>
);

const AssetActivityReport = () => {
    const [companies, setCompanies] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [columns, setColumns] = useState([]);

    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const [filters, setFilters] = useState({
        company: '',
        asset: '',
        from_date: oneMonthAgo.toISOString().split('T')[0],
        to_date: today.toISOString().split('T')[0]
    });

    useEffect(() => { fetchMasters(); }, []);

    const fetchMasters = async () => {
        try {
            const [cR, aR] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Asset?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            const companyList = (cR.data.data || []).map(d => d.name);
            setCompanies(companyList);
            setAssets((aR.data.data || []).map(d => d.name));
            if (companyList.length === 1) setFilters(f => ({ ...f, company: companyList[0] }));
        } catch (err) { console.error(err); }
    };

    const runReport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ report_name: 'Asset Activity' });
            const filterObj = {};
            if (filters.company) filterObj.company = filters.company;
            if (filters.asset) filterObj.asset = filters.asset;
            if (filters.from_date) filterObj.from_date = filters.from_date;
            if (filters.to_date) filterObj.to_date = filters.to_date;
            params.set('filters', JSON.stringify(filterObj));

            const res = await API.get(`/api/method/frappe.desk.query_report.run?${params.toString()}`);
            const data = res.data.message || res.data;
            setColumns(data.columns || []);
            setReportData(data.result || []);
        } catch (err) {
            console.error('Report error', err);
            notification.error({ message: 'Failed to run report' });
        } finally { setLoading(false); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Asset Activity Report</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-gray-500">Actions</span>
                    <button onClick={runReport} className="p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors" title="Refresh">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <SelectField label="Company" value={filters.company} options={companies} onChange={(v) => setFilters({ ...filters, company: v })} />
                    <SelectField label="Asset" value={filters.asset} options={assets} onChange={(v) => setFilters({ ...filters, asset: v })} />
                    <div>
                        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">From Date</label>
                        <input type="date" className="w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 hover:border-gray-300 transition-colors"
                            value={filters.from_date} onChange={(e) => setFilters({ ...filters, from_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-[13px] font-medium text-gray-600 mb-1.5">To Date</label>
                        <input type="date" className="w-full border border-gray-100 rounded bg-[#fcfcfc] px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400 hover:border-gray-300 transition-colors"
                            value={filters.to_date} onChange={(e) => setFilters({ ...filters, to_date: e.target.value })} />
                    </div>
                    <div>
                        <button onClick={runReport} disabled={loading}
                            className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors">
                            {loading ? 'Running...' : 'Run Report'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[350px]">
                    {reportData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="text-gray-300 mb-2"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></div>
                            <p className="text-gray-400 text-base">Nothing to show</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F8FAFC] text-gray-500 border-b border-gray-100 text-[12px] sticky top-0 z-10">
                                <tr>
                                    {columns.map((col, i) => (
                                        <th key={i} className="px-4 py-3 font-medium">{col.label || col.fieldname || col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-[13px]">
                                {reportData.map((row, ri) => (
                                    <tr key={ri} className="hover:bg-gray-50/80 transition-colors">
                                        {columns.map((col, ci) => {
                                            const fieldname = col.fieldname || col;
                                            const val = Array.isArray(row) ? row[ci] : row[fieldname];
                                            return <td key={ci} className="px-4 py-2.5 text-gray-700">{val ?? ''}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetActivityReport;
