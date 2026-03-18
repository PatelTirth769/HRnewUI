import React, { useState, useEffect } from 'react';
import { Table, Button, notification } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../../services/api';

export default function ESSSalarySlipListView({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [slips, setSlips] = useState([]);

    useEffect(() => {
        if (employeeData?.name) {
            fetchSalarySlips();
        }
    }, [employeeData]);

    const fetchSalarySlips = async () => {
        setLoading(true);
        try {
            const filters = [["employee", "=", employeeData.name]];
            // Sort by start_date descending
            const res = await API.get('/api/resource/Salary Slip', {
                params: {
                    fields: '["name", "start_date", "end_date", "net_pay", "status", "payment_days"]',
                    filters: JSON.stringify(filters),
                    limit_page_length: 50,
                    order_by: 'start_date desc'
                }
            });
            setSlips(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch salary slips:", error);
            notification.error({ message: "Failed to load salary slips." });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = (slipName) => {
        // ERPNext standard PDF download URL
        const pdfUrl = `/api/method/frappe.utils.print_format.download_pdf?doctype=Salary%20Slip&name=${slipName}&format=Standard&no_letterhead=0`;
        window.open(pdfUrl, '_blank');
    };

    const handlePrint = (slipName) => {
        // Simple print view
        const printUrl = `/printview?doctype=Salary%20Slip&name=${slipName}&format=Standard`;
        window.open(printUrl, '_blank');
    };

    const columns = [
        {
            title: 'Slip ID',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-medium text-blue-600">{text}</span>
        },
        {
            title: 'From Date',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date) => dayjs(date).format('DD MMM YYYY')
        },
        {
            title: 'To Date',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (date) => dayjs(date).format('DD MMM YYYY')
        },
        {
            title: 'Net Pay',
            dataIndex: 'net_pay',
            key: 'net_pay',
            align: 'right',
            render: (amount) => amount ? amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let colorClass = 'bg-gray-100 text-gray-800';
                if (status === 'Submitted') colorClass = 'bg-blue-100 text-blue-800';
                if (status === 'Draft') colorClass = 'bg-yellow-100 text-yellow-800';
                if (status === 'Cancelled') colorClass = 'bg-red-100 text-red-800';
                return <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>{status}</span>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <div className="flex justify-center gap-2">
                    <Button 
                        type="text" 
                        icon={<PrinterOutlined className="text-gray-500 hover:text-orange-500" />} 
                        onClick={() => handlePrint(record.name)}
                        title="Print"
                    />
                    <Button 
                        type="text" 
                        icon={<DownloadOutlined className="text-gray-500 hover:text-green-500" />} 
                        onClick={() => handleDownloadPDF(record.name)}
                        title="Download PDF"
                    />
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-800 m-0">My Salary Slips</h2>
                <Button type="primary" onClick={fetchSalarySlips} className="bg-orange-500 hover:bg-orange-600 border-none">
                    Refresh
                </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden min-h-[400px]">
                <Table 
                    columns={columns}
                    dataSource={slips}
                    rowKey="name"
                    loading={loading}
                    pagination={{ pageSize: 12 }}
                    size="middle"
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .ant-table-thead > tr > th { background: #f9fafb !important; font-size: 12px; color: #4b5563; font-weight: 600; }
                .ant-table-cell { font-size: 13px; }
            `}} />
        </div>
    );
}
