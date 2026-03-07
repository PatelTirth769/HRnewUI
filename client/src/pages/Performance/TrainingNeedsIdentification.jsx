import React, { useState, useEffect } from 'react';
import { notification, Table } from 'antd';
import * as XLSX from 'xlsx';
import API from '../../services/api';

const TrainingNeedsIdentification = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [execTime, setExecTime] = useState(null);

    // Filters
    const [company, setCompany] = useState('');
    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Master data
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    // ─── FETCH MASTERS ───────────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [compRes, deptRes, desigRes] = await Promise.all([
                    API.get('/api/resource/Company?fields=["name"]&limit_page_length=None'),
                    API.get('/api/resource/Department?fields=["name"]&limit_page_length=None&order_by=name asc'),
                    API.get('/api/resource/Designation?fields=["name"]&limit_page_length=None&order_by=name asc'),
                ]);
                setCompanies((compRes.data?.data || []).map(c => c.name));
                setDepartments((deptRes.data?.data || []).map(d => d.name));
                setDesignations((desigRes.data?.data || []).map(d => d.name));

                const firstCompany = compRes.data?.data?.[0]?.name || '';
                if (firstCompany) setCompany(firstCompany);
            } catch (err) { console.error('Masters fetch error:', err); }
        };
        fetchMasters();
    }, []);

    // ─── FETCH DATA ──────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        const startTime = performance.now();
        try {
            const filters = [['status', '=', 'Active']];
            if (company) filters.push(['company', '=', company]);
            if (department) filters.push(['department', '=', department]);
            if (designation) filters.push(['designation', '=', designation]);

            const params = new URLSearchParams({
                fields: JSON.stringify(['name', 'employee_name', 'department', 'designation', 'branch', 'company']),
                filters: JSON.stringify(filters),
                limit_page_length: 'None',
                order_by: 'employee_name asc',
            });

            const res = await API.get(`/api/resource/Employee?${params.toString()}`);
            setData(res.data?.data || []);
            const elapsed = ((performance.now() - startTime) / 1000).toFixed(6);
            setExecTime(elapsed);
        } catch (err) {
            console.error('Fetch error:', err);
            notification.error({ message: 'Failed to load employee data' });
        } finally { setLoading(false); }
    };

    // Auto-fetch when company changes
    useEffect(() => {
        if (company) fetchData();
    }, [company]);

    // ─── FILTERED DATA ───────────────────────────────────────────
    const filteredData = data.filter(emp => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (emp.employee_name || '').toLowerCase().includes(s)
            || (emp.name || '').toLowerCase().includes(s)
            || (emp.branch || '').toLowerCase().includes(s);
    });

    // ─── EXPORT EXCEL ────────────────────────────────────────────
    const handleExport = () => {
        if (!filteredData.length) { notification.warning({ message: 'No data to export' }); return; }
        const exportData = filteredData.map((emp, i) => ({
            'Sl. #': i + 1,
            'Employee ID': emp.name,
            'Employee Name': emp.employee_name || '',
            'Department': emp.department || '',
            'Designation': emp.designation || '',
            'Location': emp.branch || '',
            'Behavioural & Attitudinal Training': '',
            'Skills Development & Functional Related Training': '',
            'Awareness Training': '',
            'Remarks': ''
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        ws['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 25 }, { wch: 30 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Training Needs');
        XLSX.writeFile(wb, `Training_Needs_Identification_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // ─── ANTD TABLE COLUMNS ──────────────────────────────────────
    const antdColumns = [
        {
            title: 'Sr No',
            dataIndex: 'sr_no',
            key: 'sr_no',
            width: 60,
            render: (text, record, index) => index + 1,
        },
        { title: 'Employee ID', dataIndex: 'name', key: 'name', width: 140, ellipsis: true },
        { title: 'Employee Name', dataIndex: 'employee_name', key: 'employee_name', width: 200, ellipsis: true },
        { title: 'Department', dataIndex: 'department', key: 'department', width: 200, ellipsis: true },
        { title: 'Designation', dataIndex: 'designation', key: 'designation', width: 180, ellipsis: true },
        { title: 'Location', dataIndex: 'branch', key: 'branch', width: 160, ellipsis: true },
        { title: 'Behavioural & Attitudinal Training', dataIndex: '_behavioural', key: '_behavioural', width: 250, render: () => '' },
        { title: 'Skills Development & Functional Training', dataIndex: '_skills', key: '_skills', width: 280, render: () => '' },
        { title: 'Awareness Training', dataIndex: '_awareness', key: '_awareness', width: 200, render: () => '' },
        { title: 'Remarks', dataIndex: '_remarks', key: '_remarks', width: 200, render: () => '' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '24px', background: '#f9fafb', overflow: 'hidden', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 m-0">Training Needs Identification</h1>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-white border border-gray-300 shadow-sm text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors cursor-pointer h-8" onClick={handleExport}>
                        <span>Export</span>
                    </button>
                    <button onClick={fetchData} className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-sm text-gray-700 rounded hover:bg-gray-50 transition-colors cursor-pointer" disabled={loading}>
                        <svg className="w-[13px] h-[13px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    </button>
                </div>
            </div>

            {/* Card container */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                {/* Filters Row */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-wrap" style={{ flexShrink: 0 }}>
                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[200px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={company} onChange={(e) => setCompany(e.target.value)}>
                        <option value="">Company</option>
                        {companies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[140px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={department} onChange={(e) => setDepartment(e.target.value)}>
                        <option value="">Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[140px] h-[26px] hover:bg-[#e4e6ea] transition-colors cursor-pointer appearance-none truncate"
                        value={designation} onChange={(e) => setDesignation(e.target.value)}>
                        <option value="">Designation</option>
                        {designations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <input type="text" placeholder="Search employee..."
                        className="bg-[#f0f1f3] border-none rounded px-3 py-[3px] text-[13px] text-gray-700 outline-none w-[180px] h-[26px] hover:bg-[#e4e6ea] focus:ring-1 focus:ring-gray-300 transition-colors placeholder-gray-400"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

                    {(department || designation || searchTerm) && (
                        <button className="text-xs text-blue-600 hover:underline px-2" onClick={() => { setDepartment(''); setDesignation(''); setSearchTerm(''); }}>Clear Filters</button>
                    )}
                </div>

                {/* Table area */}
                <div style={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%', position: 'relative' }}>
                    {loading && (
                        <div className="absolute inset-0 flex justify-center items-center z-10 bg-white/50">
                            <div className="w-6 h-6 border-2 border-[#0e62ed] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {filteredData.length > 0 ? (
                        <Table
                            columns={antdColumns}
                            dataSource={filteredData}
                            pagination={false}
                            size="small"
                            scroll={{ x: 'max-content', y: 'calc(100vh - 200px)' }}
                            className="react-erp-table"
                            rowKey={(record) => record.name}
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

                {/* Footer */}
                <div className="px-3 py-2 border-t border-gray-100 text-[#8D99A6] text-[11px] flex justify-between items-center bg-white" style={{ flexShrink: 0 }}>
                    <span>{filteredData.length} employee{filteredData.length !== 1 ? 's' : ''} found. Export to Excel to fill training details.</span>
                    <span>Execution Time: {execTime || '0.000'} sec</span>
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
                    white-space: nowrap !important;
                }
                .react-erp-table .ant-table-cell {
                    padding: 6px 12px !important;
                    border-bottom: 1px solid #f0f0f0;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    max-width: 0;
                    font-size: 12px;
                    color: #374151;
                }
                .react-erp-table .ant-table-tbody > tr:hover > td {
                    background-color: #f9fafb !important;
                }
                `
            }} />
        </div>
    );
};

export default TrainingNeedsIdentification;
