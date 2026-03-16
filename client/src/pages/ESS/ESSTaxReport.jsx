import React, { useState, useEffect } from 'react';
import { Table, notification } from 'antd';
import API from '../../services/api';

export default function ESSTaxReport({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [payrollPeriod, setPayrollPeriod] = useState('');
    const [payrollPeriods, setPayrollPeriods] = useState([]);

    useEffect(() => {
        fetchPeriods();
    }, []);

    useEffect(() => {
        if (employeeData?.name) {
            handleGenerate();
        }
    }, [employeeData, payrollPeriod]);

    const fetchPeriods = async () => {
        try {
            const res = await API.get('/api/resource/Payroll Period?fields=["name"]&limit_page_length=None');
            setPayrollPeriods((res.data.data || []).map(p => p.name));
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = async () => {
        if (!employeeData?.name || !employeeData?.company) return;
        setLoading(true);
        try {
            const filters = {
                company: employeeData.company,
                employee: employeeData.name,
                consider_tax_exemption_declaration: 1
            };
            if (payrollPeriod) filters.payroll_period = payrollPeriod;

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: "Income Tax Computation",
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
            notification.error({ message: "Failed to generate tax report" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">My Tax Report (Computation)</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Payroll Period:</span>
                    <select 
                        className="border rounded px-2 py-1 text-sm outline-none bg-gray-50"
                        value={payrollPeriod}
                        onChange={e => setPayrollPeriod(e.target.value)}
                    >
                        <option value="">Current Period</option>
                        {payrollPeriods.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
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
                    className="ess-tax-table"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-tax-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 12px; }
                .ess-tax-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
