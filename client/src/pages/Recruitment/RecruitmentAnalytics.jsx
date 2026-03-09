import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

export default function RecruitmentAnalytics() {
    const [loading, setLoading] = useState(false);

    // Filters
    const [companies, setCompanies] = useState([]);

    const [filters, setFilters] = useState({
        company: '',
        on_date: new Date().toISOString().split('T')[0]
    });

    // Report Data
    const [columns, setColumns] = useState([]);
    const [data, setData] = useState([]);
    const [collapsedRows, setCollapsedRows] = useState(new Set());

    // ─── FETCH INITIAL DATA ──────────────────────────────────────────
    const fetchMasters = async () => {
        try {
            const res = await API.get('/api/resource/Company?limit_page_length=None&fields=["name"]');
            const comps = res.data?.data || [];
            setCompanies(comps);

            if (comps.length > 0) {
                const defComp = comps[0].name;
                setFilters(prev => ({ ...prev, company: defComp }));
                // Trigger report fetch once company is set
                fetchReport(defComp, filters.on_date);
            }
        } catch (err) {
            console.error('Failed to load companies', err);
        }
    };

    useEffect(() => {
        fetchMasters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── FETCH REPORT ────────────────────────────────────────────────
    const fetchReport = async (company = filters.company, onDate = filters.on_date) => {
        if (!company) return;
        setLoading(true);
        try {
            const payload = {
                report_name: 'Recruitment Analytics',
                filters: {
                    company: company,
                    on_date: onDate
                }
            };
            const res = await API.post('/api/method/frappe.desk.query_report.run', payload);
            if (res.data?.message) {
                // Determine Columns
                let cols = [];
                if (Array.isArray(res.data.message.columns)) {
                    cols = res.data.message.columns.map(c =>
                        typeof c === 'string' ? { label: c, fieldname: c } : c
                    );
                }

                // Keep the raw rows
                setColumns(cols);
                setData(res.data.message.result || []);

                // Initially collapse nothing (expand all)
                setCollapsedRows(new Set());
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Report fetch failed:', err);
            notification.error({ message: 'Failed to load report data' });
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchReport();
    };

    // ─── TREE LOGIC ─────────────────────────────────────────────────
    // A row is considered a parent if the NEXT row has a strictly greater indent value.
    const isParentRow = (index) => {
        const row = data[index];
        const nextRow = data[index + 1];
        if (!row || !nextRow) return false;

        const currentIndent = row.indent || 0;
        const nextIndent = nextRow.indent || 0;
        return nextIndent > currentIndent;
    };

    // Does this row belong to an ancestor that is currently collapsed?
    const isRowHiddenByCollapse = (index) => {
        const row = data[index];
        const rowIndent = row.indent || 0;
        if (rowIndent === 0) return false;

        // Traverse upwards to find if any parent is collapsed
        for (let i = index - 1; i >= 0; i--) {
            const parentRow = data[i];
            const parentIndent = parentRow.indent || 0;
            if (parentIndent < rowIndent) {
                if (collapsedRows.has(i)) return true;
                // If this immediate parent is NOT collapsed, check its parent
                // (Optimization: we only care if an absolute ancestor is collapsed, 
                // but checking all parents above it monotonically handles it)
            }
        }
        return false;
    };

    const toggleCollapse = (index) => {
        setCollapsedRows(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const collapseAll = () => {
        const allParents = new Set();
        data.forEach((row, i) => {
            if (isParentRow(i)) {
                allParents.add(i);
            }
        });
        setCollapsedRows(allParents);
    };

    const expandAll = () => {
        setCollapsedRows(new Set());
    };

    // ─── FORMATTERS ───────────────────────────────────────────────
    // Sometimes rows contain completely empty nulls, format them as blank space
    const getCellValue = (row, col) => {
        if (!row || !col) return '';
        const fieldname = col.fieldname;
        const val = row[fieldname];
        if (val === null || val === undefined) return '';
        return String(val);
    };

    // ═══════════════════════════════════════════════════════════════
    // ─── VIEW ─────────────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col font-sans">
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Recruitment Analytics</h1>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-600 font-medium text-[13px] rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={() => { }} title="Actions">
                        Actions
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button className="px-3 py-1.5 bg-white text-gray-600 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" onClick={handleRefresh}>
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button className="px-3 py-1.5 bg-white text-gray-600 text-sm rounded border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                </div>
            </div>

            {/* ── Main Container ── */}
            <div className="bg-white rounded-md border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden min-h-0">

                {/* Filters */}
                <div className="flex items-center gap-3 p-4 flex-shrink-0 border-b border-gray-100 bg-[#fbfcfd]">
                    <div className="min-w-[200px]">
                        <select
                            className="w-full bg-[#f4f5f6] border border-transparent rounded px-3 py-1.5 text-[13px] 
                                       text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-colors"
                            value={filters.company}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, company: e.target.value }));
                                fetchReport(e.target.value, filters.on_date);
                            }}
                        >
                            {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="min-w-[140px]">
                        <input
                            type="date"
                            className="w-full bg-[#f4f5f6] border border-transparent rounded px-3 py-1.5 text-[13px] 
                                       text-gray-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-colors"
                            value={filters.on_date}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, on_date: e.target.value }));
                                fetchReport(filters.company, e.target.value);
                            }}
                        />
                    </div>
                </div>

                {/* Grid Wrapper */}
                <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-left border-collapse min-w-max text-[13px]">
                        <thead className="bg-[#f4f5f6] sticky top-0 z-10 border-b border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">
                            <tr>
                                <th className="px-3 py-2 w-10 text-center text-gray-400 font-normal">
                                    <div className="w-4 h-4 bg-gray-200 rounded-sm mx-auto opacity-50"></div>
                                </th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-4 py-2 text-gray-600 font-medium whitespace-nowrap border-l border-gray-200 first:border-l-0">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="text-center py-16 text-gray-400">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="text-center py-16 text-gray-400">No data found</td>
                                </tr>
                            ) : (
                                data.map((row, i) => {
                                    if (isRowHiddenByCollapse(i)) return null;

                                    const indent = row.indent || 0;
                                    const isParent = isParentRow(i);
                                    const isCollapsed = collapsedRows.has(i);

                                    // Use first column for indent visualization
                                    const firstCol = columns[0];
                                    const firstVal = getCellValue(row, firstCol);
                                    const isBold = isParent || indent === 0;

                                    return (
                                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${indent === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                                            <td className="px-3 py-2 text-center text-gray-400 font-medium text-[12px] align-top">{i + 1}</td>

                                            {/* Column 0 - contains Indent formatting */}
                                            {columns.length > 0 && (
                                                <td className="px-4 py-2 border-l border-gray-200 align-top">
                                                    <div className="flex items-center" style={{ paddingLeft: `${indent * 20}px` }}>
                                                        {isParent ? (
                                                            <button
                                                                className="w-5 h-5 inline-flex items-center justify-center mr-1 text-gray-500 hover:bg-gray-200 rounded transition-colors focus:outline-none disabled:opacity-50"
                                                                onClick={() => toggleCollapse(i)}
                                                            >
                                                                {isCollapsed ? (
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                                ) : (
                                                                    <svg className="w-3.5 h-3.5 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="w-5 mr-1 inline-block"></span> // Placeholder
                                                        )}
                                                        <span className={`${isBold ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                            {firstVal}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}

                                            {/* Remaining Columns */}
                                            {columns.slice(1).map((col, cIdx) => (
                                                <td key={cIdx + 1} className={`px-4 py-2 border-l border-gray-200 align-top ${isBold ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                    {getCellValue(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="bg-[#fbfcfd] border-t border-gray-200 p-3 flex justify-between items-center flex-shrink-0 text-xs text-gray-500">
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 font-medium text-gray-700 transition" onClick={collapseAll}>Collapse All</button>
                        <button className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 font-medium text-gray-700 transition" onClick={expandAll}>Expand All</button>
                    </div>
                    <div>
                        For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 & 10).
                    </div>
                </div>
            </div>
        </div>
    );
}
