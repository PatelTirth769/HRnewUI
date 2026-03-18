import React, { useState, useEffect } from 'react';
import { Table, notification, Button, DatePicker } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../../services/api';

const { RangePicker } = DatePicker;

export default function ESSGenericReport({ employeeData, reportName }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [dates, setDates] = useState([dayjs().startOf('year'), dayjs()]);

    useEffect(() => {
        if (employeeData?.name && reportName) {
            handleGenerate();
        }
    }, [employeeData, reportName]);

    const handleGenerate = async () => {
        if (!employeeData?.name || !employeeData?.company || !reportName) return;
        setLoading(true);
        try {
            const filters = {
                from_date: dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '',
                to_date: dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '',
                company: employeeData.company,
                employee: employeeData.name,
                docstatus: "Submitted", // Often reports require this
            };

            const res = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: reportName,
                filters: filters
            });

            const reportData = res.data?.message || {};
            const reportColumns = reportData.columns || [];
            const reportResult = reportData.result || [];

            if (reportColumns.length === 0) {
                 notification.warning({ message: "No columns configured for this report." });
                 setColumns([]);
                 setData([]);
                 return;
            }

            const tableCols = reportColumns.map((col, i) => {
                let fieldname, label, fieldtype, width;
                if (typeof col === 'string') {
                    const parts = col.split(':');
                    fieldname = parts[0] || `col_${i}`;
                    label = fieldname.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    fieldtype = parts[1] ? parts[1].split('/')[0] : 'Data';
                    width = parts[1] && parts[1].includes('/') ? parseInt(parts[1].split('/')[1]) : 150;
                } else {
                    fieldname = col.fieldname || col.id || `col_${i}`;
                    label = col.label || col.name || fieldname;
                    fieldtype = col.fieldtype || 'Data';
                    width = col.width || 150;
                }

                const colDef = {
                    title: label,
                    dataIndex: fieldname,
                    key: fieldname,
                    width: width,
                    ellipsis: true,
                };

                if (['Currency', 'Float', 'Int'].includes(fieldtype)) {
                    colDef.align = 'right';
                    colDef.render = (val) => {
                        const num = parseFloat(val) || 0;
                        if (['Currency'].includes(fieldtype)) {
                             return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                        }
                        return num.toString();
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
            console.error("Failed to generate report:", error);
            // Some reports might not exist or user might not have permission, suppress big error bounds.
            notification.warning({ message: `Report "${reportName}" not found or no permission.` });
            setColumns([]);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!data.length) return;
        
        // Use visible column headers
        const headers = columns.map(c => c.title).join(',');
        
        // Map rows based on dataIndex
        const csvRows = data.map(row => {
            return columns.map(c => {
                let val = row[c.dataIndex] || '';
                // Quote val if it contains comma
                if (typeof val === 'string' && val.includes(',')) {
                    val = `"${val}"`;
                }
                return val;
            }).join(',');
        });
        
        const csvContent = [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportName}_${dayjs().format('YYYY-MM-DD')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg border gap-4">
                <h2 className="text-lg font-semibold text-gray-800 m-0">{reportName}</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <RangePicker 
                        allowClear={false}
                        value={dates} 
                        onChange={(d) => setDates(d)} 
                        format="DD MMM YYYY"
                    />
                    <Button type="primary" onClick={handleGenerate} className="bg-orange-500 hover:bg-orange-600 border-none">
                        Generate
                    </Button>
                    <Button 
                        icon={<DownloadOutlined />} 
                        onClick={handleExportCSV} 
                        disabled={!data || data.length === 0}
                    >
                        Export
                    </Button>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={data}
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    className="ess-generic-table"
                    locale={{ emptyText: 'No data retrieved for this report' }}
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ess-generic-table .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 11px; color: #6b7280; font-weight: 600; }
                .ess-generic-table .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
