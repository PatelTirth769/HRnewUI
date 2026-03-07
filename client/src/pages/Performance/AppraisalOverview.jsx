import React, { useState, useEffect, useRef } from 'react';
import { notification, Table, Tooltip } from 'antd';
import API from '../../services/api';

const REPORT_API = '/api/method/frappe.desk.query_report.run';

export default function AppraisalOverview() {
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [chart, setChart] = useState(null);
    const [loading, setLoading] = useState(false);
    const [execTime, setExecTime] = useState(null);
    const canvasRef = useRef(null);

    // Filters
    const [company, setCompany] = useState('');
    const [appraisalCycle, setAppraisalCycle] = useState('');
    const [employee, setEmployee] = useState('');
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');

    // Master data for dropdowns
    const [companies, setCompanies] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    // ─── FETCH MASTERS ───────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [compRes, cycleRes, empRes, deptRes, desigRes] = await Promise.all([
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                    API.get('/api/resource/Appraisal Cycle?fields=["name"]&limit_page_length=None&order_by=modified desc'),
                    API.get('/api/resource/Employee?fields=["name","employee_name"]&limit_page_length=None&order_by=employee_name asc'),
                    API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                ]);
                setCompanies((compRes.data?.data || []).map(c => c.name));
                setCycles((cycleRes.data?.data || []).map(c => c.name));
                setEmployees(empRes.data?.data || []);
                setDepartments((deptRes.data?.data || []).map(d => d.name));
                setDesignations((desigRes.data?.data || []).map(d => d.name));

                // Auto-set first company
                const firstCompany = compRes.data?.data?.[0]?.name || '';
                if (firstCompany) setCompany(firstCompany);
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH REPORT ────────────────────────────────────────────
    const fetchReport = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const filters = {};
            if (company) filters.company = company;
            if (appraisalCycle) filters.appraisal_cycle = appraisalCycle;
            if (employee) filters.employee = employee;
            if (department) filters.department = department;
            if (designation) filters.designation = designation;

            const params = new URLSearchParams({
                report_name: 'Appraisal Overview',
                filters: JSON.stringify(filters),
            });
            const res = await API.get(`${REPORT_API}?${params.toString()}`);
            const msg = res.data?.message || {};

            setColumns(msg.columns || []);
            setData(msg.result || []);
            setChart(msg.chart || null);

            const elapsed = ((performance.now() - startTime) / 1000).toFixed(6);
            setExecTime(elapsed);
        } catch (err) {
            console.error('Report fetch error:', err);
            notification.error({ message: 'Failed to load report' });
        } finally { setLoading(false); }
    };

    // Auto-fetch when company is set
    useEffect(() => {
        if (company) fetchReport();
    }, [company]);

    // ─── DRAW CHART ──────────────────────────────────────────────
    useEffect(() => {
        if (!chart || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const labels = chart.data?.labels || [];
        const datasets = chart.data?.datasets || [];
        if (!labels.length || !datasets.length) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.parentElement.clientWidth;
        const h = 200;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const colors = ['#FC7070', '#5B8FF9', '#5AD8A6', '#BFBFBF'];
        const padding = { top: 30, right: 30, bottom: 60, left: 50 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Find max value
        let maxVal = 5;
        datasets.forEach(ds => { ds.values.forEach(v => { if (v > maxVal) maxVal = v; }); });
        maxVal = Math.ceil(maxVal);

        // Y-axis grid
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 0.5;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding.top + chartH - (i / ySteps) * chartH;
            const val = ((i / ySteps) * maxVal).toFixed(0);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
            ctx.fillText(val, padding.left - 8, y + 4);
        }

        // Bars
        const groupW = chartW / labels.length;
        const barW = Math.min(28, (groupW - 20) / datasets.length);
        const groupPad = (groupW - barW * datasets.length) / 2;

        labels.forEach((label, li) => {
            datasets.forEach((ds, di) => {
                const val = ds.values[li] || 0;
                const barH = (val / maxVal) * chartH;
                const x = padding.left + li * groupW + groupPad + di * barW;
                const y = padding.top + chartH - barH;

                ctx.fillStyle = colors[di % colors.length];
                ctx.fillRect(x, y, barW - 2, barH);
            });

            // X label
            ctx.fillStyle = '#6B7280';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            const labelX = padding.left + li * groupW + groupW / 2;
            const truncLabel = label.length > 18 ? label.slice(0, 16) + '...' : label;
            ctx.fillText(truncLabel, labelX, h - padding.bottom + 20);
        });

        // Legend
        const legendY = h - 15;
        let legendX = padding.left;
        const legendNames = datasets.map(d => d.name);
        ctx.font = '11px Inter, system-ui, sans-serif';
        legendNames.forEach((name, i) => {
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(legendX, legendY - 8, 12, 12);
            ctx.fillStyle = '#374151';
            ctx.textAlign = 'left';
            ctx.fillText(name, legendX + 16, legendY + 2);
            legendX += ctx.measureText(name).width + 36;
        });
    }, [chart]);

    // ─── EXPORT EXCEL ────────────────────────────────────────────
    const handleExport = () => {
        if (!data.length) { notification.warning({ message: 'No data to export' }); return; }
        const headers = columns.map(c => c.label || c.fieldname);
        const rows = data.map(row => columns.map(c => row[c.fieldname] ?? ''));
        let csv = headers.join(',') + '\n';
        rows.forEach(r => { csv += r.map(v => `"${v}"`).join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Appraisal_Overview_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatScore = (val) => {
        if (val === null || val === undefined || val === '') return '';
        return parseFloat(val).toFixed(3);
    };

    const antdColumns = [
        {
            title: 'Sr No',
            dataIndex: 'sr_no',
            key: 'sr_no',
            width: 60,
            render: (text, record, index) => <span className="text-gray-500 text-[12px]">{index + 1}</span>,
        },
        ...columns.map((col, idx) => {
            const isNum = col.fieldtype === 'Float' || col.fieldtype === 'Int';
            let colWidth = 160;
            if (isNum) colWidth = 120;
            else if (col.fieldname === 'employee_name') colWidth = 200;
            else if (col.fieldname === 'employee') colWidth = 140;
            else if (col.fieldname === 'department') colWidth = 200;
            else if (col.fieldname === 'designation') colWidth = 180;
            else if (col.fieldname === 'appraisal') colWidth = 200;
            else if (col.fieldname === 'appraisal_cycle') colWidth = 160;

            return {
                title: col.label || col.fieldname,
                dataIndex: col.fieldname,
                key: col.fieldname,
                width: colWidth,
                align: isNum ? 'right' : 'left',
                ellipsis: true,
                ...(isNum ? { render: (text) => formatScore(text) } : {}),
            };
        })
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '24px', background: '#f9fafb', overflow: 'hidden', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 m-0">Appraisal Overview</h1>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors cursor-pointer h-8" onClick={handleExport}>
                        <span>Export</span>
                    </button>
                    <button onClick={fetchReport} className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer" disabled={loading}>
                        <svg className="w-[13px] h-[13px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
            </div>

            {/* Card container — everything scrolls INSIDE this bordered box */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                {/* Filters Row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ flexShrink: 0 }}>
                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[200px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={company} onChange={(e) => setCompany(e.target.value)}>
                        <option value="">Company</option>
                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={appraisalCycle} onChange={(e) => setAppraisalCycle(e.target.value)}>
                        <option value="">Appraisal Cycle</option>
                        {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <input type="text" placeholder="Employee"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors placeholder-gray-400"
                        value={employee} onChange={(e) => setEmployee(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchReport()} />

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[140px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={department} onChange={(e) => setDepartment(e.target.value)}>
                        <option value="">Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[140px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={designation} onChange={(e) => setDesignation(e.target.value)}>
                        <option value="">Designation</option>
                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    {(appraisalCycle || employee || department || designation) && (
                        <button className="text-xs text-blue-600 hover:underline px-2" onClick={() => { setAppraisalCycle(''); setEmployee(''); setDepartment(''); setDesignation(''); }}>Clear Filters</button>
                    )}
                </div>

                {/* Chart — inside the card, below filters */}
                {chart && chart.data?.labels?.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-center" style={{ flexShrink: 0 }}>
                        <div style={{ width: '80%' }}>
                            <canvas ref={canvasRef} />
                        </div>
                    </div>
                )}

                {/* Table area — scroll container */}
                <div style={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%', position: 'relative' }}>
                    {loading && (
                        <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/50">
                            <div className="w-6 h-6 border-2 border-[#0e62ed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {data.length > 0 ? (
                        <Table
                            columns={antdColumns}
                            dataSource={data}
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }}
                            className="react-erp-table"
                            rowKey={(record, idx) => idx}
                        />
                    ) : (
                        !loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af', paddingBottom: '48px' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-90">
                                    <path d="M6 8V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"></path>
                                    <rect x="3" y="9" width="12" height="13" rx="2" ry="2"></rect>
                                    <rect x="5" y="12" width="2" height="2"></rect>
                                    <line x1="9" y1="13" x2="13" y2="13"></line>
                                    <rect x="5" y="16" width="2" height="2"></rect>
                                    <line x1="9" y1="17" x2="13" y2="17"></line>
                                </svg>
                                <span className="text-[13px] text-gray-500 font-medium">Nothing to show</span>
                            </div>
                        )
                    )}
                </div>

                {/* Footer pinned to bottom of card */}
                <div className="px-3 py-2 border-t border-gray-100 text-[#8D99A6] text-[11px] flex justify-between items-center bg-white" style={{ flexShrink: 0 }}>
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                    <span>Execution Time: {execTime || '0.000'} sec</span>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .react-erp-table .ant-table-thead > tr > th {
                    background-color: #f7f7f7 !important;
                    color: #525252 !important;
                    font-weight: 500 !important;
                    border-bottom: 2px solid #e5e7eb !important;
                    padding: 8px 12px !important;
                    white-space: nowrap !important;
                }
                .react-erp-table .ant-table-cell {
                    padding: 6px 12px !important;
                    border-bottom: 1px solid #f0f0f0;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    max-width: 0;
                    font-size: 12px;
                    color: #374151;
                }
                .react-erp-table .ant-table-tbody > tr:hover > td {
                    background-color: #f9fafb !important;
                }
                .react-erp-table .ant-table-cell-fix-left,
                .react-erp-table td.ant-table-cell-fix-left {
                    background: #fff !important;
                    position: sticky !important;
                    z-index: 2 !important;
                }
                .react-erp-table .ant-table-thead th.ant-table-cell-fix-left {
                    background: #f7f7f7 !important;
                    position: sticky !important;
                    z-index: 3 !important;
                }
                .react-erp-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left {
                    background: #f9fafb !important;
                }
                .react-erp-table .ant-table-cell-fix-left-last::after {
                    box-shadow: inset 10px 0 8px -8px rgba(0,0,0,0.1) !important;
                    position: absolute !important;
                    top: 0 !important;
                    right: -1px !important;
                    bottom: -1px !important;
                    width: 20px !important;
                    content: "" !important;
                    pointer-events: none !important;
                }
                `
            }} />
        </div>
    );
}
