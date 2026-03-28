import React, { useState, useEffect } from 'react';
import { Table, Dropdown, Menu, notification } from 'antd';
import { ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

export default function AbsentStudentReport() {
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [executionTime, setExecutionTime] = useState('0.000000');

    useEffect(() => {
        handleGenerate();
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const response = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Absent Student Report',
                filters: { date: date }
            });

            const { columns: reportCols, result: reportResult } = response.data.message || { columns: [], result: [] };
            
            const tableCols = reportCols.map((col, i) => {
                const colKey = typeof col === 'string' ? col : col.fieldname || col.label;
                let label = typeof col === 'string' ? col : col.label;
                
                return {
                    title: (
                        <div className="flex flex-col">
                            <span className="mb-1">{label}</span>
                            <div className="h-4 bg-[#f1f3f5] rounded w-full border border-gray-100"></div>
                        </div>
                    ),
                    dataIndex: colKey,
                    key: colKey,
                    sorter: (a, b) => (a[colKey] || '').localeCompare(b[colKey] || ''),
                    render: (text) => <span className={colKey === 'student' ? 'font-semibold text-gray-900' : 'text-gray-600'}>{text}</span>
                };
            });

            setColumns(tableCols);
            setData(reportResult?.map((r, i) => ({ ...r, key: i })) || []);
        } catch (err) {
            console.error('Error fetching absent report:', err);
            notification.error({ message: 'Error', description: 'Failed to fetch absent student data.' });
            setData([]);
        } finally {
            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    const actionMenu = (
        <Menu>
            <Menu.Item key="print">Print</Menu.Item>
            <Menu.Item key="pdf">PDF</Menu.Item>
            <Menu.Item key="export">Export</Menu.Item>
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
                <h1 className="text-2xl font-bold text-gray-900 m-0">Absent Student Report</h1>
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

            {/* Document Card Container */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                
                {/* Filters Row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ flexShrink: 0 }}>
                    <input type="date"
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[150px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors cursor-pointer"
                        value={date} onChange={(e) => { setDate(e.target.value); }} onBlur={handleGenerate} />
                    
                    <button 
                        className="bg-gray-900 text-white px-4 py-[3px] rounded text-[12px] font-bold hover:bg-gray-800 transition shadow-sm h-[26px] flex items-center ml-2"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        Apply Filter
                    </button>
                </div>

                {/* Table Container */}
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
                            scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
                            className="react-erp-table"
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
                                <span className="text-[13px] text-gray-500 font-medium">No absent records for this date</span>
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-gray-100 text-[#8D99A6] text-[11px] flex justify-between items-center bg-white" style={{ flexShrink: 0 }}>
                    <span>Daily list of students who were not present for scheduled classes.</span>
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
            `}} />
        </div>
    );
}
