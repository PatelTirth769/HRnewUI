import React, { useState, useEffect, useRef } from 'react';
import { notification } from 'antd';
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
        const h = 300;
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold text-gray-900">Appraisal Overview</h1>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition" onClick={handleExport}>
                        Export
                    </button>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded border hover:bg-gray-200 transition flex items-center gap-1" onClick={fetchReport} disabled={loading}>
                        {loading ? '⟳ Loading...' : '⟳ Refresh'}
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[200px]"
                    value={company} onChange={(e) => setCompany(e.target.value)}>
                    <option value="">Company</option>
                    {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[160px]"
                    value={appraisalCycle} onChange={(e) => setAppraisalCycle(e.target.value)}>
                    <option value="">Appraisal Cycle</option>
                    {cycles.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[160px]"
                    value={employee} onChange={(e) => setEmployee(e.target.value)}>
                    <option value="">Employee</option>
                    {employees.map(e => <option key={e.name} value={e.name}>{e.name}: {e.employee_name}</option>)}
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[140px]"
                    value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="border border-gray-300 rounded px-3 py-2 text-sm bg-white min-w-[140px]"
                    value={designation} onChange={(e) => setDesignation(e.target.value)}>
                    <option value="">Designation</option>
                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {(appraisalCycle || employee || department || designation) && (
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => { setAppraisalCycle(''); setEmployee(''); setDepartment(''); setDesignation(''); }}>Clear Filters</button>
                )}
            </div>

            {/* Chart */}
            {chart && chart.data?.labels?.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
                    <canvas ref={canvasRef} />
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                        <svg className="animate-spin h-5 w-5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading report...
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-base mb-2">Nothing to show</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div>
                        <table className="w-full text-sm table-fixed">
                            <colgroup>
                                <col style={{ width: '30px' }} />
                                {columns.map((col, ci) => {
                                    const ft = col.fieldtype;
                                    if (ft === 'Float') return <col key={ci} style={{ width: '80px' }} />;
                                    if (ft === 'Int') return <col key={ci} style={{ width: '75px' }} />;
                                    if (col.fieldname === 'employee') return <col key={ci} style={{ width: '100px' }} />;
                                    if (col.fieldname === 'employee_name') return <col key={ci} />;
                                    if (col.fieldname === 'appraisal') return <col key={ci} style={{ width: '140px' }} />;
                                    return <col key={ci} />;
                                })}
                            </colgroup>
                            <thead>
                                {/* Header row */}
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-2 py-2 text-left text-[12px] font-medium text-gray-500"></th>
                                    {columns.map((col, ci) => {
                                        const isNum = col.fieldtype === 'Float' || col.fieldtype === 'Int';
                                        return (
                                            <th key={ci} className={`px-2 py-2 text-[12px] font-medium text-gray-500 ${isNum ? 'text-right' : 'text-left'} overflow-hidden text-ellipsis whitespace-nowrap`}>
                                                {col.label || col.fieldname}
                                            </th>
                                        );
                                    })}
                                </tr>
                                {/* Filter input row */}
                                <tr className="bg-white border-b">
                                    <td className="px-2 py-1"></td>
                                    {columns.map((col, ci) => (
                                        <td key={ci} className="px-2 py-1">
                                            <input type="text" className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-gray-50 focus:outline-none focus:border-blue-400" disabled />
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, ri) => (
                                    <tr key={ri} className="border-b hover:bg-blue-50/30">
                                        <td className="px-2 py-2 text-gray-400 text-[12px]">{ri + 1}</td>
                                        {columns.map((col, ci) => {
                                            const val = row[col.fieldname];
                                            const isFloat = col.fieldtype === 'Float';
                                            const isInt = col.fieldtype === 'Int';
                                            return (
                                                <td key={ci} className={`px-2 py-2 ${isFloat || isInt ? 'text-right' : 'text-left'} overflow-hidden text-ellipsis whitespace-nowrap`} title={val != null ? String(val) : ''}>
                                                    {isFloat ? formatScore(val) : (val ?? '')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!loading && data.length > 0 && (
                <div className="mt-3 flex justify-between text-xs text-gray-400">
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                    <span>Execution Time: {execTime || '0.000000'} sec</span>
                </div>
            )}
        </div>
    );
}
