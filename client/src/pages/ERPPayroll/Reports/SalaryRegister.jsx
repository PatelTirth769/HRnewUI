import React, { useState, useEffect } from 'react';
import { Table, Dropdown, Menu, notification } from 'antd';
import { ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function SalaryRegister() {
    const [fromDate, setFromDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [currency, setCurrency] = useState('INR');
    const [employee, setEmployee] = useState('');
    const [company, setCompany] = useState('');
    const [status, setStatus] = useState('Submitted');

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState('0.001849');

    const [companies, setCompanies] = useState([]);

    useEffect(() => { fetchMasterData(); }, []);

    const fetchMasterData = async () => {
        try {
            const [compRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None')
            ]);
            if (compRes.data.data) {
                setCompanies(compRes.data.data.map(c => c.name));
                if (compRes.data.data.length > 0) setCompany(compRes.data.data[0].name);
            }
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    const handleGenerate = async () => {
        if (!company) return;
        setLoading(true);
        const startTime = performance.now();
        try {
            const filters = {
                from_date: fromDate,
                to_date: toDate,
                company: company,
                docstatus: status,
            };
            if (employee) filters.employee = employee;

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: "Salary Register",
                filters: filters
            });

            const reportData = res.data?.message || res.data || {};
            const reportColumns = reportData.columns || [];
            const reportResult = reportData.result || [];

            const tableCols = [{ title: 'Sr No', key: 'idx', width: 60, fixed: 'left', render: (_, __, idx) => idx + 1 }];

            reportColumns.forEach((col, i) => {
                let fieldname, label, fieldtype, colWidth;

                if (typeof col === 'string') {
                    // ERPNext sometimes returns columns as strings like "fieldname:fieldtype/options:width"
                    const parts = col.split(':');
                    fieldname = parts[0] || `col_${i}`;
                    label = fieldname.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    fieldtype = parts[1] ? parts[1].split('/')[0] : 'Data';
                    colWidth = parts[2] ? parseInt(parts[2]) : undefined;
                } else {
                    fieldname = col.fieldname || col.id || `col_${i}`;
                    label = col.label || col.name || fieldname;
                    fieldtype = col.fieldtype || 'Data';
                    colWidth = col.width;
                }

                const colDef = {
                    title: (
                        <div className="flex flex-col">
                            <span className="mb-1">{label}</span>
                            <div className="h-4 bg-[#f1f3f5] rounded w-full border border-gray-100"></div>
                        </div>
                    ),
                    dataIndex: fieldname,
                    key: fieldname,
                    ellipsis: true,
                };

                if (fieldtype === 'Currency' || fieldtype === 'Float' || fieldtype === 'Int') {
                    colDef.align = 'right';
                    colDef.width = 130;
                    colDef.render = (val) => {
                        const num = parseFloat(val) || 0;
                        if (label.includes('Net Pay') || label.includes('Gross')) {
                            return <span style={{ fontWeight: 600 }}>{num.toLocaleString('en-IN', { style: 'currency', currency: currency })}</span>;
                        }
                        if (num > 0 && (label.includes('Deduction') || label.includes('Tax'))) {
                            return <span style={{ color: '#f5222d' }}>{num.toLocaleString('en-IN', { style: 'currency', currency: currency })}</span>;
                        }
                        return num.toLocaleString('en-IN', { style: 'currency', currency: currency });
                    };
                }

                if (colWidth) {
                    colDef.width = colWidth;
                }

                tableCols.push(colDef);
            });

            setColumns(tableCols);

            const rows = reportResult.map((row, idx) => {
                let rowObj = { key: `row_${idx}` };
                if (Array.isArray(row)) {
                    reportColumns.forEach((col, i) => {
                        let fieldname;
                        if (typeof col === 'string') {
                            fieldname = col.split(':')[0] || `col_${i}`;
                        } else {
                            fieldname = col.fieldname || col.id || `col_${i}`;
                        }
                        rowObj[fieldname] = row[i];
                    });
                } else {
                    rowObj = { ...row, key: `row_${idx}` };
                }
                // Mark Total rows for bolding
                const slipId = rowObj.salary_slip_id || rowObj.salary_slip || '';
                const branch = rowObj.branch || rowObj.Branch || '';
                if (slipId.toString().toLowerCase().includes('total') || branch.toString().toLowerCase().includes('total')) {
                    rowObj.isTotal = true;
                }
                return rowObj;
            });
            setData(rows);

        } catch (error) {
            console.error("Error generating report:", error);
            setData([]);
        } finally {
            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    useEffect(() => {
        if (company) {
            handleGenerate();
        }
    }, [company]);

    const handleExport = () => {
        if (data.length === 0) { notification.warning({ message: "No data to export" }); return; }
        const exportRows = data.map(r => {
            const row = {};
            columns.forEach(c => {
                if (c.dataIndex && c.title !== 'Sr No') {
                    row[c.title] = r[c.dataIndex] ?? '';
                }
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Salary Register");
        XLSX.writeFile(wb, `Salary_Register_${fromDate}_to_${toDate}.xlsx`);
    };

    const actionMenu = (
        <Menu>
            <Menu.Item key="print">Print</Menu.Item>
            <Menu.Item key="pdf">PDF</Menu.Item>
            <Menu.Item key="export" onClick={handleExport}>Export</Menu.Item>
        </Menu>
    );

    const moreMenu = (
        <Menu>
            <Menu.Item key="create_card">Create Card</Menu.Item>
        </Menu>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '24px', background: '#f9fafb', overflow: 'hidden', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 m-0">Salary Register</h1>
                <div className="flex items-center space-x-2">
                    <Dropdown overlay={actionMenu} trigger={['click']}>
                        <button className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors cursor-pointer h-8">
                            <span>Actions</span>
                            <svg className="w-3 h-3 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </button>
                    </Dropdown>
                    <button onClick={handleGenerate} className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                        <ReloadOutlined className="text-[13px]" />
                    </button>
                    <Dropdown overlay={moreMenu} trigger={['click']}>
                        <button className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                            <MoreOutlined className="text-[13px]" />
                        </button>
                    </Dropdown>
                </div>
            </div>

            {/* Card container — everything scrolls INSIDE this bordered box */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                {/* Filters Row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ flexShrink: 0 }}>
                    <input type="date"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[130px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors cursor-pointer"
                        value={fromDate} onChange={(e) => setFromDate(e.target.value)} onBlur={handleGenerate} />

                    <input type="date"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[130px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors cursor-pointer"
                        value={toDate} onChange={(e) => setToDate(e.target.value)} onBlur={handleGenerate} />

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[80px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none"
                        value={currency} onChange={e => { setCurrency(e.target.value); handleGenerate(); }}>
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                    </select>

                    <input type="text" placeholder="Employee"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors placeholder-gray-400"
                        value={employee} onChange={e => setEmployee(e.target.value)} onBlur={handleGenerate} onKeyDown={e => e.key === 'Enter' && handleGenerate()} />

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[200px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={company} onChange={e => { setCompany(e.target.value); handleGenerate(); }}>
                        {companies.length > 0 ? companies.map(c => <option key={c} value={c}>{c}</option>) : <option value="">Preeshe Consultancy Ser...</option>}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[110px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none"
                        value={status} onChange={e => { setStatus(e.target.value); handleGenerate(); }}>
                        <option value="Submitted">Submitted</option>
                        <option value="Draft">Draft</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Table area — scroll container; width:0 + min-width:100% is the flex-child containment trick */}
                <div style={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%', position: 'relative' }}>
                    {loading && (
                        <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/50">
                            <div className="w-6 h-6 border-2 border-[#0e62ed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {data.length > 0 ? (
                        <Table
                            columns={columns}
                            dataSource={data}
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content' }}
                            className="react-erp-table"
                            rowClassName={(record) => record.isTotal ? 'erp-total-row' : ''}
                            locale={{ emptyText: ' ' }}
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
                    <span>Execution Time: {executionTime} sec</span>
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
                }
                .react-erp-table .ant-table-cell {
                    padding: 6px 12px !important;
                    border-bottom: 1px solid #f0f0f0;
                    color: #1f2937;
                    font-size: 13px;
                }
                .react-erp-table .ant-table-tbody > tr.ant-table-row:hover > td {
                    background-color: #fbfbfb !important;
                }
                .erp-total-row > td {
                    font-weight: 600 !important;
                    color: #111827 !important;
                }
                /* Force Ant Design table to scroll inside the card */
                .react-erp-table,
                .react-erp-table .ant-spin-nested-loading,
                .react-erp-table .ant-spin-container,
                .react-erp-table .ant-table,
                .react-erp-table .ant-table-container {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                .react-erp-table .ant-table-content {
                    overflow-x: auto !important;
                    overflow-y: visible !important;
                }
            `}} />
        </div>
    );
}
