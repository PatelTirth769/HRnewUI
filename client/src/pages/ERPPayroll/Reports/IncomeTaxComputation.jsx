import React, { useState, useEffect } from 'react';
import { Table, Dropdown, Menu, notification } from 'antd';
import { ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import API from '../../../services/api';
import * as XLSX from 'xlsx';

export default function IncomeTaxComputation() {
    const [company, setCompany] = useState('');
    const [payrollPeriod, setPayrollPeriod] = useState('');
    const [employee, setEmployee] = useState('');
    const [department, setDepartment] = useState('');
    const [considerTaxExemption, setConsiderTaxExemption] = useState(false);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState('0.000000');

    const [companies, setCompanies] = useState([]);
    const [payrollPeriods, setPayrollPeriods] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => { fetchMasterData(); }, []);

    const fetchMasterData = async () => {
        try {
            const [compRes, ppRes, deptRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Payroll Period?fields=["name","company"]&limit_page_length=None'),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
            ]);
            if (compRes.data.data) {
                setCompanies(compRes.data.data.map(c => c.name));
                if (compRes.data.data.length > 0) setCompany(compRes.data.data[0].name);
            }
            if (ppRes.data.data) {
                setPayrollPeriods(ppRes.data.data.map(p => p.name));
            }
            if (deptRes.data.data) {
                setDepartments(deptRes.data.data.map(d => d.name));
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
                company: company,
            };
            if (payrollPeriod) filters.payroll_period = payrollPeriod;
            if (employee) filters.employee = employee;
            if (department) filters.department = department;
            if (considerTaxExemption) filters.consider_tax_exemption_declaration = 1;

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: "Income Tax Computation",
                filters: filters
            });

            const reportData = res.data?.message || res.data || {};
            const reportColumns = reportData.columns || [];
            const reportResult = reportData.result || [];

            // Build table columns dynamically
            const tableCols = [];

            reportColumns.forEach((col, i) => {
                let fieldname, label, fieldtype, colWidth;

                if (typeof col === 'string') {
                    const parts = col.split(':');
                    fieldname = parts[0] || `col_${i}`;
                    label = fieldname.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    fieldtype = parts[1] ? parts[1].split('/')[0] : 'Data';
                    colWidth = parts[2] ? parseInt(parts[2]) : undefined;
                } else {
                    fieldname = col.fieldname !== undefined ? col.fieldname : (col.id !== undefined ? col.id : `col_${i}`);
                    label = col.label !== undefined ? col.label : (col.name !== undefined ? col.name : fieldname);
                    fieldtype = col.fieldtype || 'Data';
                    colWidth = col.width;
                }

                const safeFieldname = fieldname === "" ? `empty_col_${i}` : fieldname;

                const colDef = {
                    title: (
                        <div className="flex flex-col">
                            <span className="mb-1">{label === "" || label === " " ? <>&nbsp;</> : label}</span>
                            <div className="h-4 bg-[#f1f3f5] rounded w-full border border-gray-100"></div>
                        </div>
                    ),
                    dataIndex: safeFieldname,
                    key: safeFieldname,
                    ellipsis: true,
                };

                if (fieldtype === 'Currency' || fieldtype === 'Float' || fieldtype === 'Int') {
                    colDef.align = 'right';
                    colDef.width = 140;
                    colDef.render = (val, record) => {
                        const num = parseFloat(val) || 0;
                        const formatted = num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                        return <span style={{ fontWeight: record.isTotal ? 600 : 400 }}>{formatted}</span>;
                    };
                }

                if (colWidth) {
                    colDef.width = colWidth;
                }

                tableCols.push(colDef);
            });

            setColumns(tableCols);

            // Build data rows
            const rows = reportResult.map((row, idx) => {
                let rowObj = { key: `row_${idx}` };

                if (Array.isArray(row)) {
                    reportColumns.forEach((col, i) => {
                        let fieldname;
                        if (typeof col === 'string') {
                            fieldname = col.split(':')[0] || `col_${i}`;
                        } else {
                            fieldname = col.fieldname !== undefined ? col.fieldname : (col.id !== undefined ? col.id : `col_${i}`);
                        }
                        const safeFieldname = fieldname === "" ? `empty_col_${i}` : fieldname;
                        rowObj[safeFieldname] = row[i];
                    });
                } else {
                    rowObj = { ...row, key: `row_${idx}` };
                    reportColumns.forEach((col, i) => {
                        let fieldname;
                        if (typeof col === 'string') {
                            fieldname = col.split(':')[0] || `col_${i}`;
                        } else {
                            fieldname = col.fieldname !== undefined ? col.fieldname : (col.id !== undefined ? col.id : `col_${i}`);
                        }
                        if (fieldname === "") {
                            rowObj[`empty_col_${i}`] = row[""];
                        }
                    });
                    if ("" in rowObj) delete rowObj[""];
                }

                // Mark Total rows
                const empName = rowObj.employee_name || rowObj.Employee_Name || '';
                const emp = rowObj.employee || rowObj.Employee || '';
                if (
                    empName.toString().toLowerCase().includes('total') ||
                    emp.toString().toLowerCase().includes('total')
                ) {
                    rowObj.isTotal = true;
                }

                return rowObj;
            });

            setData(rows);

        } catch (error) {
            console.error("Error generating report:", error);
            const errMsg = error.response?.data?._server_messages || error.response?.data?.message || error.message;
            notification.error({ message: "Failed to generate report", description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
            setData([]);
        } finally {
            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    useEffect(() => {
        if (company) handleGenerate();
    }, [company]);

    const handleExport = () => {
        if (data.length === 0) { notification.warning({ message: "No data to export" }); return; }
        const exportRows = data.map(r => {
            const row = {};
            columns.forEach(c => {
                if (c.dataIndex) {
                    const titleStr = c.title?.props?.children?.[0]?.props?.children || c.dataIndex;
                    row[titleStr] = r[c.dataIndex] ?? '';
                }
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Income Tax Computation");
        XLSX.writeFile(wb, `Income_Tax_Computation.xlsx`);
    };

    const moreMenu = (
        <Menu>
            <Menu.Item key="set_chart">Set Chart</Menu.Item>
            <Menu.Item key="export" onClick={handleExport}>Export</Menu.Item>
            <Menu.Item key="create_card">Create Card</Menu.Item>
        </Menu>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f3f4f6] relative font-sans p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-[1.35rem] font-bold text-gray-900 m-0 truncate">Income Tax Computation</h1>
                <div className="flex items-center space-x-2 shrink-0">
                    <button onClick={handleGenerate} className="flex items-center justify-center w-8 h-8 bg-[#f0f1f3] shadow-sm text-gray-700 rounded hover:bg-[#e4e6ea] transition-colors cursor-pointer border-none">
                        <ReloadOutlined className="text-[13px]" />
                    </button>
                    <Dropdown overlay={moreMenu} trigger={['click']}>
                        <button className="flex items-center justify-center w-8 h-8 bg-[#f0f1f3] shadow-sm text-gray-700 rounded hover:bg-[#e4e6ea] transition-colors cursor-pointer border-none">
                            <MoreOutlined className="text-[13px]" />
                        </button>
                    </Dropdown>
                </div>
            </div>

            {/* Container */}
            <div className="border border-gray-200 rounded-md flex flex-col bg-white flex-1 shadow-sm overflow-hidden min-h-0">

                {/* Filters Row - matching ERPNext: Company | Payroll Period | Employee | Department | Consider Tax Exemption Declaration */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap shrink-0">
                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[200px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={company} onChange={e => setCompany(e.target.value)}>
                        {companies.length > 0 ? companies.map(c => <option key={c} value={c}>{c}</option>) : <option value="">Select Company...</option>}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={payrollPeriod} onChange={e => { setPayrollPeriod(e.target.value); setTimeout(handleGenerate, 100); }}>
                        <option value="">Payroll Period</option>
                        {payrollPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <input type="text" placeholder="Employee"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors placeholder-gray-400"
                        value={employee} onChange={e => setEmployee(e.target.value)} onBlur={handleGenerate} onKeyDown={e => e.key === 'Enter' && handleGenerate()} />

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[160px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={department} onChange={e => { setDepartment(e.target.value); setTimeout(handleGenerate, 100); }}>
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <label className="flex items-center gap-1.5 text-[13px] text-gray-600 cursor-pointer select-none ml-1">
                        <input type="checkbox"
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                            checked={considerTaxExemption}
                            onChange={e => { setConsiderTaxExemption(e.target.checked); setTimeout(handleGenerate, 100); }} />
                        <span>Consider Tax Exemption Declaration</span>
                    </label>
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full bg-white relative overflow-auto">
                    {loading && (
                        <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/50">
                            <div className="w-6 h-6 border-2 border-[#0e62ed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {data.length > 0 ? (
                        <div className="w-full h-full p-2">
                            <Table
                                columns={columns}
                                dataSource={data}
                                pagination={false}
                                size="small"
                                scroll={{ x: 'max-content' }}
                                className="w-full border-none react-erp-table"
                                rowClassName={(record) => record.isTotal ? 'erp-total-row' : ''}
                                locale={{ emptyText: ' ' }}
                            />
                        </div>
                    ) : (
                        !loading && (
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-gray-400 pb-12 bg-white">
                                <span className="text-[13px] text-blue-400 font-normal">Please set filters</span>
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-gray-100 text-[#8D99A6] text-[11px] flex justify-between items-center bg-white rounded-b-md w-full shrink-0">
                    <span>For comparison, use &gt;5, &lt;10 or =324. For ranges, use 5:10 (for values between 5 &amp; 10).</span>
                    <span>Execution Time: {executionTime} sec</span>
                </div>
            </div>
            {/* Custom table styles */}
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
            `}} />
        </div>
    );
}
