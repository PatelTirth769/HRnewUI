import React, { useState, useEffect } from 'react';
import { notification, Table, Button, Checkbox, Select } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function EmployeeLeaveBalance() {
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
    const [company, setCompany] = useState('');
    const [department, setDepartment] = useState('');
    const [employee, setEmployee] = useState('');
    const [consolidate, setConsolidate] = useState(true);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);

    // Master data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => { fetchMasterData(); }, []);

    const fetchMasterData = async () => {
        try {
            const [compRes, deptRes, empRes] = await Promise.all([
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Department?fields=["name"]&limit_page_length=None'),
                API.get('/api/resource/Employee?fields=["name","employee_name"]&filters=[["status","=","Active"]]&limit_page_length=None')
            ]);
            if (compRes.data.data) {
                setCompanies(compRes.data.data.map(c => c.name));
                if (compRes.data.data.length > 0) setCompany(compRes.data.data[0].name);
            }
            if (deptRes.data.data) setDepartments(deptRes.data.data.map(d => d.name));
            if (empRes.data.data) setEmployees(empRes.data.data);
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    const handleGenerate = async () => {
        if (!company) {
            notification.warning({ message: "Please select a company" });
            return;
        }
        setLoading(true);
        try {
            // Use the ERPNext Script Report API
            const filters = {
                from_date: fromDate,
                to_date: toDate,
                company: company,
            };
            if (employee) filters.employee = employee;
            if (department) filters.department = department;

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: "Employee Leave Balance",
                filters: filters
            });

            const reportData = res.data.message || res.data;
            const reportColumns = reportData.columns || [];
            const reportResult = reportData.result || [];

            // Build table columns from report response
            const tableCols = [{ title: '#', key: 'idx', width: 45, fixed: 'left', render: (_, __, idx) => idx + 1 }];

            reportColumns.forEach((col, i) => {
                const fieldname = col.fieldname || col.id || `col_${i}`;
                const label = col.label || col.name || fieldname;
                const colDef = {
                    title: label,
                    dataIndex: fieldname,
                    key: fieldname,
                    ellipsis: true,
                };

                // Style numeric columns
                if (col.fieldtype === 'Float' || col.fieldtype === 'Int' ||
                    label.includes('Balance') || label.includes('Allocated') ||
                    label.includes('Taken') || label.includes('Expired')) {
                    colDef.align = 'center';
                    colDef.width = 130;
                    colDef.render = (val) => {
                        const num = parseFloat(val) || 0;
                        if (label.includes('Closing') || label.includes('Opening')) {
                            return <span style={{ fontWeight: 600, color: num > 0 ? '#52c41a' : num < 0 ? '#f5222d' : undefined }}>{num}</span>;
                        }
                        if (label.includes('Taken')) {
                            return <span style={{ color: num > 0 ? '#fa8c16' : undefined }}>{num}</span>;
                        }
                        if (label.includes('Expired')) {
                            return <span style={{ color: num > 0 ? '#f5222d' : undefined }}>{num}</span>;
                        }
                        return num;
                    };
                }

                // Style employee column
                if (fieldname === 'employee' || fieldname === 'employee_name') {
                    colDef.width = 140;
                }

                // Style leave type column
                if (fieldname === 'leave_type') {
                    colDef.width = 160;
                    colDef.render = (val) => val ? <strong>{val}</strong> : '';
                }

                tableCols.push(colDef);
            });

            setColumns(tableCols);

            // Process result rows
            if (consolidate && reportResult.length > 0) {
                // Group by leave type (like ERPNext screenshot)
                const grouped = {};
                const leaveTypeOrder = [];

                reportResult.forEach(row => {
                    // Handle both array and object formats
                    let rowObj = {};
                    if (Array.isArray(row)) {
                        reportColumns.forEach((col, i) => {
                            const fieldname = col.fieldname || col.id || `col_${i}`;
                            rowObj[fieldname] = row[i];
                        });
                    } else {
                        rowObj = { ...row };
                    }

                    const leaveType = rowObj.leave_type || 'Unknown';
                    if (!grouped[leaveType]) {
                        grouped[leaveType] = [];
                        leaveTypeOrder.push(leaveType);
                    }
                    grouped[leaveType].push(rowObj);
                });

                // Build final rows with leave type group headers
                const finalRows = [];
                let rowIdx = 0;
                leaveTypeOrder.forEach(lt => {
                    // Group header row
                    finalRows.push({
                        key: `group_${lt}`,
                        isGroupHeader: true,
                        leave_type: lt,
                        _groupLabel: `▼ ${lt}`,
                    });
                    // Data rows
                    grouped[lt].forEach(row => {
                        finalRows.push({ ...row, key: `row_${rowIdx++}` });
                    });
                });

                setData(finalRows);
            } else {
                // Non-consolidated: flat list
                const rows = reportResult.map((row, idx) => {
                    if (Array.isArray(row)) {
                        const rowObj = { key: `row_${idx}` };
                        reportColumns.forEach((col, i) => {
                            const fieldname = col.fieldname || col.id || `col_${i}`;
                            rowObj[fieldname] = row[i];
                        });
                        return rowObj;
                    }
                    return { ...row, key: `row_${idx}` };
                });
                setData(rows);
            }

            notification.success({ message: `Loaded ${reportResult.length} records` });

        } catch (error) {
            console.error("Error generating report:", error);
            const errMsg = error.response?.data?._server_messages || error.response?.data?.message || error.message;
            notification.error({ message: "Failed to generate report", description: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg) });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (data.length === 0) { notification.warning({ message: "No data to export" }); return; }
        const exportRows = data.filter(r => !r.isGroupHeader).map(r => {
            const row = {};
            columns.forEach(c => {
                if (c.dataIndex && c.title !== '#') {
                    row[c.title] = r[c.dataIndex] ?? '';
                }
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Balance");
        XLSX.writeFile(wb, `Employee_Leave_Balance_${fromDate}_to_${toDate}.xlsx`);
    };

    return (
        <div className="p-4">
            <nav className="text-xs text-gray-500 mb-3">HOME {'>'} TA & LV {'>'} EMPLOYEE LEAVE BALANCE</nav>
            <div className="bg-white rounded-md border p-4 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Employee Leave Balance</h2>

                {/* Filters - matching ERPNext layout */}
                <div className="flex flex-wrap items-end gap-3 mb-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">From Date</label>
                        <input type="date" className="border rounded px-2 py-1.5 text-sm w-40"
                            value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">To Date</label>
                        <input type="date" className="border rounded px-2 py-1.5 text-sm w-40"
                            value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Company</label>
                        <select className="border rounded px-2 py-1.5 text-sm w-56"
                            value={company} onChange={(e) => setCompany(e.target.value)}>
                            <option value="">-- Select --</option>
                            {companies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Department</label>
                        <select className="border rounded px-2 py-1.5 text-sm w-44"
                            value={department} onChange={(e) => setDepartment(e.target.value)}>
                            <option value="">All</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Employee</label>
                        <select className="border rounded px-2 py-1.5 text-sm w-44"
                            value={employee} onChange={(e) => setEmployee(e.target.value)}>
                            <option value="">All</option>
                            {employees.map(e => <option key={e.name} value={e.name}>{e.employee_name} ({e.name})</option>)}
                        </select>
                    </div>
                </div>

                {/* Consolidate checkbox + buttons */}
                <div className="flex items-center gap-4 mb-4 border-t pt-3">
                    <Checkbox checked={consolidate} onChange={(e) => setConsolidate(e.target.checked)}>
                        <span className="text-sm">Consolidate Leave Types</span>
                    </Checkbox>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleGenerate} loading={loading}
                        className="bg-green-600 hover:bg-green-700 border-none">Generate</Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>Export Excel</Button>
                </div>

                {/* Results Table */}
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="key"
                    size="small"
                    pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `Total ${t} records` }}
                    bordered
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: 'Select filters and click Generate to view leave balances.' }}
                    rowClassName={(r) => r.isGroupHeader ? 'bg-blue-50 font-bold' : ''}
                />
            </div>
        </div>
    );
}
