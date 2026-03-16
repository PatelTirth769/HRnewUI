import React, { useState, useEffect } from 'react';
import { Table, notification } from 'antd';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function ESSAnnualSalary({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [fromDate, setFromDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

    useEffect(() => {
        if (employeeData?.name) {
            handleGenerate();
        }
    }, [employeeData, fromDate, toDate]);

    const handleGenerate = async () => {
        if (!employeeData?.name || !employeeData?.company) return;
        setLoading(true);
        try {
            const filters = {
                from_date: fromDate,
                to_date: toDate,
                company: employeeData.company,
                employee: employeeData.name,
                docstatus: "Submitted",
            };

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: "Salary Register",
                filters: filters
            });

            const reportData = res.data?.message || {};
            const reportColumns = reportData.columns || [];
            const reportResult = reportData.result || [];

            const tableCols = reportColumns.map((col, i) => {
                let fieldname, label, fieldtype;
                if (typeof col === 'string') {
                    const parts = col.split(':');
                    fieldname = parts[0] || `col_${i}`;
                    label = fieldname.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    fieldtype = parts[1] ? parts[1].split('/')[0] : 'Data';
                } else {
                    fieldname = col.fieldname || col.id || `col_${i}`;
                    label = col.label || col.name || fieldname;
                    fieldtype = col.fieldtype || 'Data';
                }

                const colDef = {
                    title: label,
                    dataIndex: fieldname,
                    key: fieldname,
                    ellipsis: true,
                };

                if (['Currency', 'Float', 'Int'].includes(fieldtype)) {
                    colDef.align = 'right';
                    colDef.render = (val) => {
                        const num = parseFloat(val) || 0;
                        return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                    };
                }
                return colDef;
            });

            setColumns(tableCols);

            const rows = reportResult.map((row, idx) => {
                let rowObj = { key: idx };
                if (Array.isArray(row)) {
                    reportColumns.forEach((col, i) => {
                        let fname = typeof col === 'string' ? col.split(':')[0] : (col.fieldname || col.id);
                        rowObj[fname || `col_${i}`] = row[i];
                    });
                } else {
                    rowObj = { ...row, key: idx };
                }
                return rowObj;
            });

            setData(rows);
        } catch (error) {
            console.error(error);
            notification.error({ message: "Failed to generate annual salary report" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Annual Salary</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From:</span>
                        <input type="date" className="border rounded px-2 py-1 text-sm outline-none bg-gray-50" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To:</span>
                        <input type="date" className="border rounded px-2 py-1 text-sm outline-none bg-gray-50" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    className="ess-salary-table"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-salary-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-salary-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
