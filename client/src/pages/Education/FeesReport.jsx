import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Statistic, Row, Col, Tag, Button, Select, Space, Input, DatePicker, notification, Spin, Tooltip, Dropdown } from 'antd';
import { 
  SearchOutlined, SyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, FilterOutlined, ClearOutlined, DownloadOutlined,
  UserOutlined, BookOutlined, CalendarOutlined, WalletOutlined,
  FileExcelOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const FeesReport = () => {
    const [loading, setLoading] = useState(false);
    const [allData, setAllData] = useState([]);
    const [filters, setFilters] = useState({
        academic_year: '2026-27',
        program: '',
        board: '',
        term: '',
        status: '',
        payment_mode: '',
        student_search: '',
        date_range: null,
    });
    const [dropdowns, setDropdowns] = useState({
        academicYears: [],
        programs: [],
        terms: [],
    });
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => { fetchInitialData(); }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [yRes, pRes, tRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Program?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Term?limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
                terms: tRes.data.data?.map(d => d.name) || [],
            });
            await fetchData();
        } catch (err) {
            console.error('Initial Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Firebase payments (only students who initiated/completed payment)
            const payRes = await axios.get('/local-api/payment/history-all');
            const paymentList = payRes.data.success ? payRes.data.data : [];

            // 2. Fetch ALL Fees records from ERPNext (invoices for ALL students)
            let erpFeesList = [];
            try {
                const feesRes = await API.get('/api/resource/Fees', {
                    params: {
                        fields: JSON.stringify(["name", "student", "student_name", "program", "fee_structure", "grand_total", "outstanding_amount", "posting_date", "academic_term", "academic_year"]),
                        limit_page_length: 'None',
                        order_by: 'creation desc'
                    }
                });
                erpFeesList = feesRes.data?.data || [];
            } catch (e) {
                console.warn('[FeesReport] Could not fetch ERP Fees:', e.message);
                // Fallback: try with fewer fields
                try {
                    const feesRes2 = await API.get('/api/resource/Fees', {
                        params: {
                            fields: JSON.stringify(["name", "student", "student_name", "program", "grand_total", "outstanding_amount", "posting_date"]),
                            limit_page_length: 'None'
                        }
                    });
                    erpFeesList = feesRes2.data?.data || [];
                } catch (e2) { console.warn('[FeesReport] Fees fallback also failed:', e2.message); }
            }

            // 3. Fetch ALL Fee Structures (to get program-level term components)
            let allFeeStructures = [];
            try {
                const fsListRes = await API.get('/api/resource/Fee Structure', {
                    params: {
                        fields: JSON.stringify(["name", "program", "total_amount", "company"]),
                        limit_page_length: 'None'
                    }
                });
                allFeeStructures = fsListRes.data?.data || [];
            } catch (e) { console.warn('[FeesReport] Could not fetch Fee Structures list:', e.message); }

            // Fetch full details for each Fee Structure (to get term components)
            const structureDetails = {};
            await Promise.all(
                allFeeStructures.map(async (fs) => {
                    try {
                        const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(fs.name)}`);
                        if (res.data?.data) structureDetails[fs.name] = res.data.data;
                    } catch { /* skip */ }
                })
            );

            // 4. Fetch ALL students
            let allStudents = [];
            try {
                const stuRes = await API.get('/api/resource/Student', {
                    params: {
                        fields: JSON.stringify(["name", "student_name", "program", "enabled", "custom_board"]),
                        filters: JSON.stringify([["enabled", "=", 1]]),
                        limit_page_length: 'None'
                    }
                });
                allStudents = stuRes.data?.data || [];
            } catch (e) { console.warn('[FeesReport] Could not fetch students:', e.message); }

            // 5. Fetch ALL Program Enrollments (this is the real student-program link)
            let enrollments = [];
            try {
                const enrRes = await API.get('/api/resource/Program Enrollment', {
                    params: {
                        fields: JSON.stringify(["name", "student", "student_name", "program", "academic_year", "enrollment_date"]),
                        limit_page_length: 'None'
                    }
                });
                enrollments = enrRes.data?.data || [];
            } catch (e) { console.warn('[FeesReport] Could not fetch enrollments:', e.message); }

            // Build a map: student_id -> { student_name, program }
            // Priority: Program Enrollment > Student.program
            const studentInfoMap = {};
            allStudents.forEach(s => {
                studentInfoMap[s.name] = { student_name: s.student_name || s.name, program: s.program || '', board: s.custom_board || '' };
            });
            // Override with Program Enrollment data (authoritative)
            enrollments.forEach(e => {
                if (e.student && e.program) {
                    if (!studentInfoMap[e.student]) {
                        studentInfoMap[e.student] = { student_name: e.student_name || e.student, program: e.program, board: '' };
                    } else {
                        studentInfoMap[e.student].program = e.program;
                        if (e.student_name) studentInfoMap[e.student].student_name = e.student_name;
                    }
                }
            });
            // Also add enrolled students that may be missing from student list
            enrollments.forEach(e => {
                if (e.student && !allStudents.find(s => s.name === e.student)) {
                    allStudents.push({ name: e.student, student_name: e.student_name || e.student, program: e.program, enabled: 1 });
                }
            });

            // Build Firebase payment lookup: key = student_id + term
            const firebasePayments = {};
            paymentList.forEach(p => {
                const termName = p.fees_category || '-';
                const key = `${p.student_id}_${termName}`;
                if (!firebasePayments[key]) firebasePayments[key] = [];
                firebasePayments[key].push(p);
            });

            // 5. Build the merged records from ERP Fees (primary source)
            const groupedRecords = {};

            // Process ERP Fees records first (these are authoritative fee invoices)
            erpFeesList.forEach(fee => {
                const studentId = fee.student;
                const studentName = fee.student_name || studentInfoMap[studentId]?.student_name || 'Unknown';
                const program = fee.program || studentInfoMap[studentId]?.program || '-';
                const board = studentInfoMap[studentId]?.board || '-';
                const termName = fee.academic_term || fee.name;
                const key = `${studentId}_${termName}`;
                const totalFee = parseFloat(fee.grand_total) || 0;
                const outstanding = parseFloat(fee.outstanding_amount) || 0;
                const paidAmount = totalFee - outstanding;

                // Check Firebase for payment details
                const fbPayments = firebasePayments[key] || [];
                const verifiedPayment = fbPayments.find(p => p.status === 'verified');

                let status = 'UNPAID';
                let paidDate = null;
                let receiptNo = '-';

                if (outstanding <= 0 || verifiedPayment) {
                    status = 'PAID';
                    paidDate = verifiedPayment?.verified_at || verifiedPayment?.receipt_date || fee.posting_date;
                    receiptNo = verifiedPayment?.payment_id || verifiedPayment?.receipt_no || '-';
                } else if (paidAmount > 0 && outstanding > 0) {
                    status = 'PARTIAL';
                }

                // Find fee structure name
                const feeStructureName = fee.fee_structure || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program && (!board || board === '-' || structureDetails[k]?.company === board)) || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program) || '-';

                if (!groupedRecords[key] || status === 'PAID') {
                    groupedRecords[key] = {
                        key: key,
                        fee_id: fee.name,
                        student_id: studentId,
                        student_name: studentName,
                        program: program,
                        board: board,
                        fee_structure: feeStructureName,
                        academic_term: termName,
                        academic_year: fee.academic_year || '-',
                        total_fee: totalFee,
                        paid_amount: paidAmount > 0 ? paidAmount : (verifiedPayment ? parseFloat(verifiedPayment.amount) || 0 : 0),
                        outstanding: outstanding,
                        status: status,
                        paid_date: paidDate,
                        payment_mode: verifiedPayment?.payment_mode || '-',
                        receipt_no: receiptNo,
                    };
                }
            });

            // Also process Firebase-only payments (students who paid via website but may not have ERP Fees record)
            paymentList.forEach(p => {
                const termName = p.fees_category || '-';
                const key = `${p.student_id}_${termName}`;

                if (groupedRecords[key]) return; // Already from ERP

                const fsName = p.fee_structure || '';
                const programName = structureDetails[fsName]?.program || studentInfoMap[p.student_id]?.program || '-';
                const paidAmt = parseFloat(p.amount) || 0;

                let currentStatus = 'PENDING';
                if (p.status === 'verified') currentStatus = 'PAID';
                else if (p.status === 'failed') currentStatus = 'FAILED';

                const paidDate = p.verified_at || p.receipt_date || (currentStatus === 'PAID' ? p.created_at : null);

                groupedRecords[key] = {
                    key: p.payment_id || p.order_id || key,
                    fee_id: p.order_id || 'manual',
                    student_id: p.student_id,
                    student_name: p.student_name || studentInfoMap[p.student_id]?.student_name || 'Unknown',
                    program: programName,
                    board: studentInfoMap[p.student_id]?.board || '-',
                    fee_structure: fsName,
                    academic_term: termName,
                    academic_year: '-',
                    total_fee: paidAmt,
                    paid_amount: currentStatus === 'PAID' ? paidAmt : 0,
                    outstanding: currentStatus === 'PAID' ? 0 : paidAmt,
                    status: currentStatus,
                    paid_date: currentStatus === 'PAID' ? paidDate : null,
                    payment_mode: p.payment_mode || 'ONLINE',
                    receipt_no: p.receipt_no || p.payment_id || '-',
                };
            });

            // Generate rows from Student + Fee Structure components for students with NO Fees/Payment records
            allStudents.forEach(student => {
                const studentId = student.name;
                const studentName = studentInfoMap[studentId]?.student_name || student.student_name || studentId;
                const program = studentInfoMap[studentId]?.program || student.program || '';
                const board = studentInfoMap[studentId]?.board || student.custom_board || '-';
                const fsName = Object.keys(structureDetails).find(k => structureDetails[k]?.program === program && (!board || board === '-' || structureDetails[k]?.company === board)) || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program);

                // If student has a fee structure with components, generate term-wise rows
                if (fsName && structureDetails[fsName]) {
                    const fsData = structureDetails[fsName];
                    const components = fsData.components || [];

                    components.forEach(comp => {
                        const termName = comp.fees_category || comp.name || '-';
                        const key = `${studentId}_${termName}`;

                        if (groupedRecords[key]) return; // Already has a record

                        const termAmount = parseFloat(comp.amount) || 0;

                        // Check Firebase for this student+term
                        const fbPayments = firebasePayments[key] || [];
                        const verifiedPayment = fbPayments.find(p => p.status === 'verified');

                        let status = 'UNPAID';
                        let paidDate = null;
                        let paidAmount = 0;
                        let receiptNo = '-';

                        if (verifiedPayment) {
                            status = 'PAID';
                            paidAmount = parseFloat(verifiedPayment.amount) || termAmount;
                            paidDate = verifiedPayment.verified_at || verifiedPayment.receipt_date || verifiedPayment.created_at;
                            receiptNo = verifiedPayment.payment_id || verifiedPayment.receipt_no || '-';
                        }

                        groupedRecords[key] = {
                            key: key,
                            fee_id: '-',
                            student_id: studentId,
                            student_name: studentName,
                            program: program || '-',
                            board: board,
                            fee_structure: fsName,
                            academic_term: termName,
                            academic_year: '-',
                            total_fee: termAmount,
                            paid_amount: paidAmount,
                            outstanding: status === 'PAID' ? 0 : termAmount,
                            status: status,
                            paid_date: paidDate,
                            payment_mode: verifiedPayment?.payment_mode || '-',
                            receipt_no: receiptNo,
                        };
                    });
                } else {
                    // Student has no fee structure — still show them with a single row
                    const key = `${studentId}_-`;
                    if (!groupedRecords[key]) {
                        groupedRecords[key] = {
                            key: key,
                            fee_id: '-',
                            student_id: studentId,
                            student_name: studentName,
                            program: program || 'Not Assigned',
                            board: board,
                            fee_structure: '-',
                            academic_term: '-',
                            academic_year: '-',
                            total_fee: 0,
                            paid_amount: 0,
                            outstanding: 0,
                            status: 'UNPAID',
                            paid_date: null,
                            payment_mode: '-',
                            receipt_no: '-',
                        };
                    }
                }
            });

            const mergedData = Object.values(groupedRecords);
            mergedData.sort((a, b) => (a.student_name || '').localeCompare(b.student_name || '') || (a.academic_term || '').localeCompare(b.academic_term || ''));
            setAllData(mergedData);
            console.log(`[FeesReport] Total records: ${mergedData.length} (ERP Fees: ${erpFeesList.length}, Firebase: ${paymentList.length}, Students: ${allStudents.length}, Enrollments: ${enrollments.length}, Fee Structures: ${Object.keys(structureDetails).length})`);
        } catch (err) {
            console.error('[FeesReport] Fetch Data Error:', err);
            notification.error({ message: 'Data Fetch Error', description: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    // Derived filtered data
    const filteredData = useMemo(() => {
        let data = [...allData];
        if (filters.student_search) {
            const q = filters.student_search.toLowerCase();
            data = data.filter(s => s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
        }
        if (filters.program) data = data.filter(s => s.program === filters.program);
        if (filters.board) data = data.filter(s => s.board === filters.board);
        if (filters.term) data = data.filter(s => s.academic_term === filters.term);
        if (filters.status === 'PAID') data = data.filter(s => s.status === 'PAID');
        else if (filters.status === 'UNPAID') data = data.filter(s => s.status !== 'PAID');
        if (filters.payment_mode) {
            if (filters.payment_mode === 'ONLINE') {
                data = data.filter(s => s.status === 'PAID' && (s.payment_mode || '').toUpperCase().includes('ONLINE'));
            } else if (filters.payment_mode === 'OFFLINE') {
                data = data.filter(s => s.status === 'PAID' && (s.payment_mode || '').toUpperCase() !== '-' && !(s.payment_mode || '').toUpperCase().includes('ONLINE'));
            }
        }
        if (filters.date_range && filters.date_range[0] && filters.date_range[1]) {
            const start = filters.date_range[0].startOf('day');
            const end = filters.date_range[1].endOf('day');
            data = data.filter(s => {
                if (!s.paid_date) return false;
                const d = dayjs(s.paid_date);
                return d.isAfter(start) && d.isBefore(end);
            });
        }
        return data;
    }, [allData, filters]);

    const stats = useMemo(() => ({
        totalProjected: filteredData.reduce((s, r) => s + r.total_fee, 0),
        totalCollected: filteredData.reduce((s, r) => s + r.paid_amount, 0),
        totalOutstanding: filteredData.reduce((s, r) => s + r.outstanding, 0),
        paidCount: filteredData.filter(r => r.status === 'PAID').length,
        unpaidCount: filteredData.filter(r => r.status !== 'PAID').length,
        totalRecords: filteredData.length,
    }), [filteredData]);

    const clearAllFilters = () => setFilters({ academic_year: '2026-27', program: '', board: '', term: '', status: '', payment_mode: '', student_search: '', date_range: null });

    const activeFilterCount = [filters.program, filters.board, filters.term, filters.status, filters.payment_mode, filters.student_search, filters.date_range].filter(Boolean).length;

    const exportCSV = () => {
        const headers = ['Student Name', 'Student ID', 'Program', 'Board', 'Fee Structure', 'Term', 'Total Fee', 'Paid Amount', 'Outstanding', 'Status', 'Paid Date', 'Receipt No', 'Payment Mode'];
        const rows = filteredData.map(r => [
            r.student_name, r.student_id, r.program, r.board, r.fee_structure, r.academic_term,
            r.total_fee, r.paid_amount, r.outstanding, r.status,
            r.paid_date ? dayjs(r.paid_date).format('DD-MM-YYYY HH:mm') : '-',
            r.receipt_no, r.payment_mode
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `fees_report_${dayjs().format('YYYY-MM-DD')}.csv`; a.click();
        URL.revokeObjectURL(url);
        notification.success({ message: 'Export Complete', description: `${filteredData.length} records exported.` });
    };

    const columns = [
        {
            title: 'STUDENT', key: 'student', ellipsis: true,
            render: (_, r) => (
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.student_name}</div>
                    <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>{r.student_id}</div>
                </div>
            ),
            sorter: (a, b) => (a.student_name || '').localeCompare(b.student_name || ''),
        },
        {
            title: 'PROGRAM & BOARD', key: 'program_info', ellipsis: true,
            render: (_, r) => (
                <div style={{ minWidth: 0 }}>
                    <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>{r.program}</Tag>
                    {r.board && r.board !== '-' && <Tag color="geekblue" style={{ margin: '0 0 0 4px', fontWeight: 600 }}>{r.board}</Tag>}
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.fee_structure}</div>
                </div>
            ),
        },
        {
            title: 'TERM', dataIndex: 'academic_term', key: 'academic_term', ellipsis: true,
            render: t => <span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>{t}</span>,
            sorter: (a, b) => (a.academic_term || '').localeCompare(b.academic_term || ''),
        },
        {
            title: 'TOTAL FEE', dataIndex: 'total_fee', key: 'total_fee', align: 'right',
            render: v => <span style={{ fontWeight: 600, color: '#64748b', fontSize: 13 }}>₹{v.toLocaleString()}</span>,
            sorter: (a, b) => a.total_fee - b.total_fee,
        },
        {
            title: 'PAID', dataIndex: 'paid_amount', key: 'paid_amount', align: 'right',
            render: v => <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>₹{v.toLocaleString()}</span>,
            sorter: (a, b) => a.paid_amount - b.paid_amount,
        },
        {
            title: 'DUE', dataIndex: 'outstanding', key: 'outstanding', align: 'right',
            render: v => <span style={{ fontWeight: 700, color: v > 0 ? '#dc2626' : '#94a3b8', fontSize: 13 }}>₹{v.toLocaleString()}</span>,
            sorter: (a, b) => a.outstanding - b.outstanding,
        },
        {
            title: 'PAID DATE', key: 'paid_date', ellipsis: true,
            render: (_, r) => r.paid_date
                ? <span style={{ fontSize: 12, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>{dayjs(r.paid_date).format('DD MMM YYYY')}</span>
                : <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>,
            sorter: (a, b) => (a.paid_date || '').localeCompare(b.paid_date || ''),
        },
        {
            title: 'STATUS', dataIndex: 'status', key: 'status', align: 'center',
            render: (status) => {
                const cfg = {
                    PAID: { color: 'success', icon: <CheckCircleOutlined /> },
                    PENDING: { color: 'warning', icon: <ClockCircleOutlined /> },
                    FAILED: { color: 'error', icon: <ExclamationCircleOutlined /> },
                };
                const c = cfg[status] || cfg.PENDING;
                return <Tag icon={c.icon} color={c.color} style={{ fontWeight: 700, borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{status}</Tag>;
            },
        }
    ];

    // Unique terms extracted from data for filter dropdown
    const dataTerms = useMemo(() => {
        const terms = new Set();
        allData.forEach(r => { if (r.academic_term && r.academic_term !== '-') terms.add(r.academic_term); });
        return Array.from(terms).sort();
    }, [allData]);

    const dataBoards = useMemo(() => {
        const boards = new Set();
        allData.forEach(r => { if (r.board && r.board !== '-') boards.add(r.board); });
        return Array.from(boards).sort();
    }, [allData]);

    const dataPrograms = useMemo(() => {
        const progs = new Set();
        allData.forEach(r => { if (r.program && r.program !== '-') progs.add(r.program); });
        return Array.from(progs).sort();
    }, [allData]);

    const dataStudents = useMemo(() => {
        let source = allData;
        if (filters.program) source = source.filter(r => r.program === filters.program);
        if (filters.board) source = source.filter(r => r.board === filters.board);
        
        const map = new Map();
        source.forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, r.student_name); });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [allData, filters.program, filters.board]);

    return (
        <div style={{ padding: '32px', maxWidth: 1700, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Comprehensive Fees Report</h1>
                    <p style={{ color: '#94a3b8', margin: '6px 0 0', fontSize: 14 }}>Student-wise & term-wise fee analysis with payment tracking</p>
                </div>
                <Space size={12}>
                    <Button icon={<DownloadOutlined />} onClick={exportCSV} shape="round" style={{ fontWeight: 600 }} disabled={filteredData.length === 0}>
                        Export CSV
                    </Button>
                    <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading} shape="round" type="primary" style={{ fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none' }}>
                        Sync ERP & Website
                    </Button>
                </Space>
            </div>

            {/* Filters Panel */}
            <Card
                style={{ borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: showFilters ? 24 : 16 } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FilterOutlined style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>Filters</span>
                        {activeFilterCount > 0 && <Tag color="blue" style={{ borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{activeFilterCount} active</Tag>}
                    </div>
                }
                extra={
                    <Space>
                        {activeFilterCount > 0 && <Button size="small" icon={<ClearOutlined />} onClick={clearAllFilters} type="link" danger style={{ fontWeight: 600 }}>Clear All</Button>}
                        <Button size="small" type="text" icon={showFilters ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowFilters(v => !v)} />
                    </Space>
                }
            >
                {showFilters && (
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={5}>
                            <label style={labelStyle}>Student</label>
                            <Select
                                showSearch
                                allowClear
                                style={{ width: '100%' }}
                                placeholder="Search student..."
                                value={filters.student_search || undefined}
                                onChange={v => setFilters(p => ({ ...p, student_search: v || '' }))}
                                filterOption={(input, option) =>
                                    (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase()) ||
                                    (option?.value || '').toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {dataStudents.map(([id, name]) => (
                                    <Option key={id} value={name}>{name} ({id})</Option>
                                ))}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                            <label style={labelStyle}>Program (Class)</label>
                            <Select style={{ width: '100%' }} placeholder="All Programs" allowClear value={filters.program || undefined} onChange={v => setFilters(p => ({ ...p, program: v || '', student_search: '' }))}>
                                {(dropdowns.programs.length > 0 ? dropdowns.programs : dataPrograms).map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                            <label style={labelStyle}>Board</label>
                            <Select style={{ width: '100%' }} placeholder="All Boards" allowClear value={filters.board || undefined} onChange={v => setFilters(p => ({ ...p, board: v || '', student_search: '' }))}>
                                {dataBoards.map(b => <Option key={b} value={b}>{b}</Option>)}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={3}>
                            <label style={labelStyle}>Term</label>
                            <Select style={{ width: '100%' }} placeholder="All Terms" allowClear value={filters.term || undefined} onChange={v => setFilters(p => ({ ...p, term: v || '' }))}>
                                {(dropdowns.terms.length > 0 ? dropdowns.terms : dataTerms).map(t => <Option key={t} value={t}>{t}</Option>)}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={3}>
                            <label style={labelStyle}>Payment Status</label>
                            <Select style={{ width: '100%' }} placeholder="All" allowClear value={filters.status || undefined} onChange={v => setFilters(p => ({ ...p, status: v || '' }))}>
                                <Option value="PAID"><Tag color="success" style={{ margin: 0 }}>Paid</Tag></Option>
                                <Option value="UNPAID"><Tag color="error" style={{ margin: 0 }}>Unpaid</Tag></Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                            <label style={labelStyle}>Fees Type</label>
                            <Select style={{ width: '100%' }} placeholder="All Types" allowClear value={filters.payment_mode || undefined} onChange={v => setFilters(p => ({ ...p, payment_mode: v || '' }))}>
                                <Option value="ONLINE"><Tag color="blue" style={{ margin: 0 }}>Online</Tag></Option>
                                <Option value="OFFLINE"><Tag color="orange" style={{ margin: 0 }}>Offline (Cash)</Tag></Option>
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={5}>
                            <label style={labelStyle}>Paid Date Range</label>
                            <RangePicker style={{ width: '100%' }} value={filters.date_range} onChange={v => setFilters(p => ({ ...p, date_range: v }))} format="DD-MM-YYYY" />
                        </Col>
                    </Row>
                )}
            </Card>

            {/* Stats Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', boxShadow: '0 2px 8px rgba(59,130,246,0.08)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Records</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e40af' }}>{stats.totalRecords}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Paid</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d' }}>{stats.paidCount}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #fef2f2, #fecaca)', boxShadow: '0 2px 8px rgba(220,38,38,0.08)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Unpaid</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#b91c1c' }}>{stats.unpaidCount}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Total Projected</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#334155' }}>₹{stats.totalProjected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)', boxShadow: '0 2px 8px rgba(22,163,74,0.1)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Collected</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>₹{stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8} lg={4}>
                    <Card style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #fef2f2, #fca5a5)', boxShadow: '0 2px 8px rgba(220,38,38,0.1)' }} styles={{ body: { padding: '18px 20px' } }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Outstanding</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c' }}>₹{stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </Card>
                </Col>
            </Row>

            {/* Report Table */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>
                        Showing {filteredData.length} of {allData.length} records
                    </span>
                </div>
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    rowKey={(r) => r.key || `${r.student_id}_${r.academic_term}`}
                    pagination={{ pageSize: 25, showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}

                    className="fees-report-table"
                    size="middle"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .fees-report-table .ant-table { table-layout: fixed !important; }
                .fees-report-table .ant-table-thead > tr > th { 
                    background: #f8fafc !important; font-size: 10px; color: #94a3b8;
                    text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800;
                    padding: 12px 12px !important; border-bottom: 2px solid #e2e8f0;
                    white-space: nowrap;
                }
                .fees-report-table .ant-table-row { font-size: 13px; transition: all 0.15s; }
                .fees-report-table .ant-table-cell { padding: 12px 12px !important; }
                .fees-report-table .ant-table-row:hover .ant-table-cell { background: #f8fafc !important; }
                .fees-report-table .ant-table-row:nth-child(even) .ant-table-cell { background: #fafbfc; }
                .fees-report-table .ant-table-row:nth-child(even):hover .ant-table-cell { background: #f1f5f9 !important; }
                .fees-report-table .ant-table-content { overflow: hidden !important; }
            `}} />
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 };

export default FeesReport;
