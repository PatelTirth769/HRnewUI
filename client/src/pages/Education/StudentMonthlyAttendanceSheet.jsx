import React, { useState, useEffect, useRef } from 'react';
import { Table, Dropdown, Menu, notification, Spin } from 'antd';
import { ReloadOutlined, MoreOutlined, DownloadOutlined } from '@ant-design/icons';
import API from '../../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StudentMonthlyAttendanceSheet() {
    const [loading, setLoading] = useState(false);
    const [studentGroups, setStudentGroups] = useState([]);
    const [reportData, setReportData] = useState({ columns: [], result: [] });
    const [executionTime, setExecutionTime] = useState('0.000000');
    
    const tableRef = useRef(null);

    // Filters
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [studentGroup, setStudentGroup] = useState('');
    const [selectedBoard, setSelectedBoard] = useState('All');
    const [boards, setBoards] = useState([]);
    const [studentBoardMap, setStudentBoardMap] = useState({});
    const [masterStudentGroups, setMasterStudentGroups] = useState([]);

    const months = [
        { label: 'January', value: '1' }, { label: 'February', value: '2' }, { label: 'March', value: '3' },
        { label: 'April', value: '4' }, { label: 'May', value: '5' }, { label: 'June', value: '6' },
        { label: 'July', value: '7' }, { label: 'August', value: '8' }, { label: 'September', value: '9' },
        { label: 'October', value: '10' }, { label: 'November', value: '11' }, { label: 'December', value: '12' }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

    useEffect(() => {
        fetchStudentGroups();
    }, []);

    const fetchStudentGroups = async () => {
        try {
            const [sgRes, cRes, sRes] = await Promise.all([
                API.get('/api/resource/Student Group?fields=["name","custom_board"]&limit_page_length=None'),
                API.get('/api/resource/Company?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student?fields=["name","student_name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            
            const sgData = sgRes.data.data || [];
            setMasterStudentGroups(sgData);
            setStudentGroups(sgData.map(d => d.name));
            
            const boardMap = {};
            const studentBoards = new Set();
            sRes.data.data?.forEach(s => {
                boardMap[s.name] = s.custom_board || '';
                if (s.student_name) boardMap[s.student_name] = s.custom_board || ''; // fallback if report only returns name
                if (s.custom_board) studentBoards.add(s.custom_board);
            });
            setStudentBoardMap(boardMap);
            
            const companyBoards = cRes.data.data?.map(c => c.name) || [];
            setBoards([...new Set([...companyBoards, ...Array.from(studentBoards)])].sort());
            
        } catch (err) {
            console.error('Error fetching student groups:', err);
        }
    };

    useEffect(() => {
        let filteredSg = masterStudentGroups;
        if (selectedBoard !== 'All') {
            filteredSg = filteredSg.filter(sg => sg.custom_board === selectedBoard);
        }
        setStudentGroups(filteredSg.map(sg => sg.name));
        
        // If current studentGroup is no longer in the list, clear it
        if (studentGroup && !filteredSg.find(sg => sg.name === studentGroup)) {
            setStudentGroup('');
            setReportData({ columns: [], result: [] });
        }
    }, [selectedBoard, masterStudentGroups]);

    useEffect(() => {
        if (!studentGroup) {
            setReportData({ columns: [], result: [] });
        }
    }, [studentGroup]);

    const handleGenerate = async () => {
        if (!studentGroup) return;
        setLoading(true);
        const startTime = performance.now();
        try {
            const response = await API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Student Monthly Attendance Sheet',
                filters: {
                    month: month,
                    year: year,
                    student_group: studentGroup
                }
            });

            const { columns, result } = response.data.message || { columns: [], result: [] };
            
            const tableCols = columns.map(col => {
                const colKey = typeof col === 'string' ? col : col.fieldname || col.label;
                let label = typeof col === 'string' ? col : col.label;
                
                return {
                    title: (
                        <div className="flex flex-col">
                            <span className="mb-1">{label}</span>
                            <div className="h-4 bg-[#f1f3f5] rounded w-full border border-gray-100"></div>
                        </div>
                    ),
                    _label: label,
                    dataIndex: colKey,
                    key: colKey,
                    width: colKey === 'student_name' ? 220 : 60,
                    fixed: colKey === 'student_name' ? 'left' : undefined,
                    align: colKey === 'student_name' ? 'left' : 'center',
                    render: (text) => {
                        if (text === 'P') return <span style={{ color: '#52c41a', fontWeight: 600 }}>P</span>;
                        if (text === 'A') return <span style={{ color: '#f5222d', fontWeight: 600 }}>A</span>;
                        if (text === 'L') return <span style={{ color: '#faad14', fontWeight: 600 }}>L</span>;
                        if (text === 'HD') return <span style={{ color: '#fa8c16', fontWeight: 600 }}>H</span>;
                        return <span className="text-gray-600">{text}</span>;
                    }
                };
            });
            
            // Inject Board Column
            const studentColIndex = tableCols.findIndex(c => c.key === 'student' || c.key === 'student_name');
            const insertIndex = studentColIndex >= 0 ? studentColIndex + 1 : 1;
            tableCols.splice(insertIndex, 0, {
                title: (
                    <div className="flex flex-col">
                        <span className="mb-1">Board</span>
                        <div className="h-4 bg-[#f1f3f5] rounded w-full border border-gray-100"></div>
                    </div>
                ),
                _label: 'Board',
                dataIndex: 'custom_board',
                key: 'custom_board',
                width: 100,
                fixed: 'left',
                render: (text) => text ? <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border border-indigo-100">{text}</span> : '-'
            });
            
            const groupObj = masterStudentGroups.find(g => g.name === studentGroup);
            const groupBoard = groupObj ? groupObj.custom_board : '';

            let finalData = result?.map((r, i) => ({ 
                ...r, 
                key: i,
                custom_board: studentBoardMap[r.student] || studentBoardMap[r.student_name] || groupBoard || ''
            })) || [];

            setReportData({ 
                columns: tableCols, 
                result: finalData 
            });
        } catch (err) {
            console.error('Error fetching report:', err);
            notification.error({ message: 'Report Error', description: err.response?.data?._server_messages || err.message });
            setReportData({ columns: [], result: [] });
        } finally {
            const endTime = performance.now();
            setExecutionTime(((endTime - startTime) / 1000).toFixed(6));
            setLoading(false);
        }
    };

    const handleExport = () => {
        const filteredData = reportData.result.filter(r => selectedBoard === 'All' || r.custom_board === selectedBoard);
        if (filteredData.length === 0) {
            notification.warning({ message: 'No Data', description: 'There is no data to export.' });
            return;
        }

        const exportData = filteredData.map(row => {
            const exportedRow = {};
            reportData.columns.forEach(col => {
                exportedRow[col._label || col.key] = row[col.dataIndex];
            });
            return exportedRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Attendance");
        XLSX.writeFile(wb, `Student_Monthly_Attendance_${month}_${year}.xlsx`);
    };

    const handleTableWiseDownload = () => {
        const filteredData = reportData.result.filter(r => selectedBoard === 'All' || r.custom_board === selectedBoard);
        if (filteredData.length === 0) {
            notification.warning({ message: 'No Data', description: 'There is no data to export to PDF.' });
            return;
        }

        const doc = new jsPDF('landscape');
        doc.setFontSize(14);
        doc.text(`Student Monthly Attendance Sheet - ${month}/${year}`, 14, 15);
        if (studentGroup) {
            doc.setFontSize(10);
            doc.text(`Group: ${studentGroup} | Board: ${selectedBoard}`, 14, 22);
        }

        const headers = reportData.columns.map(col => col._label || col.key);
        const data = filteredData.map(row => {
            return reportData.columns.map(col => {
                const val = row[col.dataIndex];
                return val !== undefined && val !== null ? String(val) : '';
            });
        });

        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 28,
            styles: { fontSize: 7, cellPadding: 1 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            didParseCell: function(data) {
                // Color code the attendance status if it's in the body
                if (data.section === 'body') {
                    const text = data.cell.raw;
                    if (text === 'P') data.cell.styles.textColor = [40, 167, 69]; // Green
                    if (text === 'A') data.cell.styles.textColor = [220, 53, 69]; // Red
                    if (text === 'L') data.cell.styles.textColor = [255, 193, 7]; // Yellow
                    if (text === 'HD') data.cell.styles.textColor = [253, 126, 20]; // Orange
                }
            }
        });

        doc.save(`Table_Wise_Attendance_${month}_${year}.pdf`);
        notification.success({ message: 'Table Wise Attendance Downloaded Successfully' });
    };

    const actionMenuItems = [
        { key: 'print', label: 'Print' },
        { key: 'pdf', label: 'PDF' },
        { key: 'export', label: 'Export' },
        { key: 'table_wise', label: 'Table Wise Attendance', icon: <DownloadOutlined /> }
    ];

    const handleActionClick = ({ key }) => {
        if (key === 'export') handleExport();
        if (key === 'table_wise') handleTableWiseDownload();
    };

    const moreMenuItems = [
        { key: 'create_card', label: 'Create Card' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '24px', background: '#f9fafb', overflow: 'hidden', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 m-0">Student Monthly Attendance Sheet</h1>
                <div className="flex items-center space-x-2">
                    <Dropdown menu={{ items: actionMenuItems, onClick: handleActionClick }} trigger={['click']}>
                        <button className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors cursor-pointer h-8">
                            <span>Actions</span>
                            <svg className="w-3 h-3 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                        </button>
                    </Dropdown>
                    <button onClick={handleGenerate} className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                        <ReloadOutlined className="text-[13px]" />
                    </button>
                    <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                        <button className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer">
                            < MoreOutlined className="text-[13px]" />
                        </button>
                    </Dropdown>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }} ref={tableRef}>
                
                {/* Filters Row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ flexShrink: 0 }}>
                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[120px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none"
                        value={month} onChange={e => { setMonth(e.target.value); if(studentGroup) handleGenerate(); }}>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[90px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none"
                        value={year} onChange={e => { setYear(e.target.value); if(studentGroup) handleGenerate(); }}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[220px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={studentGroup} onChange={e => { setStudentGroup(e.target.value); }}>
                        <option value="">Select Student Group...</option>
                        {studentGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                    </select>
                    
                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[150px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={selectedBoard} onChange={e => setSelectedBoard(e.target.value)}>
                        <option value="All">All Boards</option>
                        {boards.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <button 
                        className="bg-gray-900 text-white px-4 py-[3px] rounded text-[12px] font-bold hover:bg-gray-800 transition shadow-sm h-[26px] flex items-center"
                        onClick={handleGenerate}
                        disabled={loading || !studentGroup}
                    >
                        Apply Filters
                    </button>
                </div>

                {/* Table container */}
                <div style={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%', position: 'relative' }}>
                    {loading && (
                        <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/50">
                            <div className="w-6 h-6 border-2 border-[#0e62ed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {reportData.result.filter(r => selectedBoard === 'All' || r.custom_board === selectedBoard).length > 0 ? (
                        <Table
                            columns={reportData.columns}
                            dataSource={reportData.result.filter(r => selectedBoard === 'All' || r.custom_board === selectedBoard)}
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
                                <span className="text-[13px] text-gray-500 font-medium">{studentGroup ? 'No records found' : 'Select a Student Group to view report'}</span>
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-gray-100 text-[#8D99A6] text-[11px] flex justify-between items-center bg-white" style={{ flexShrink: 0 }}>
                    <span>Report shows attendance status (P=Present, A=Absent, L=Leave, H=Half Day) for the selected group and month.</span>
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
                /* Scrollbar styling for better ERP feel */
                .react-erp-table .ant-table-content::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .react-erp-table .ant-table-content::-webkit-scrollbar-thumb {
                    background: #dfe2e5;
                    border-radius: 4px;
                }
            `}} />
        </div>
    );
}
