import React, { useState, useEffect } from 'react';
import { Table, Card, Statistic, Row, Col, Tag, Button, Select, Space, Tooltip, notification, Spin } from 'antd';
import { 
  SearchOutlined, 
  SyncOutlined, 
  WalletOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';

const { Option } = Select;

const FeesReport = () => {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        academic_year: '2026-27',
        program: '',
    });
    const [dropdowns, setDropdowns] = useState({
        academicYears: [],
        programs: [],
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch Dropdowns
            const [yRes, pRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Program?limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pRes.data.data?.map(d => d.name) || [],
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
        console.log('[FeesReport] Fetching explicit transactions from fee_payments...');
        try {
            // 1. Fetch Global Payment History from Firebase
            const payRes = await axios.get('/local-api/payment/history-all');
            const paymentList = payRes.data.success ? payRes.data.data : [];
            console.log(`[FeesReport] Fetched ${paymentList.length} payment records from Firebase.`);
            
            // 2. Find unique Fee Structures from Firebase Payments to get Program Names
            const uniqueStructures = new Set();
            paymentList.forEach(p => { if (p.fee_structure) uniqueStructures.add(p.fee_structure); });

            // 3. Fetch Details for these Fee Structures
            const structureDetails = {};
            await Promise.all(
                Array.from(uniqueStructures).map(async (fsName) => {
                    try {
                        const res = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(fsName)}`);
                        if (res.data && res.data.data) {
                            structureDetails[fsName] = res.data.data;
                        }
                    } catch (e) {
                        console.warn(`Could not fetch details for Fee Structure: ${fsName}`);
                    }
                })
            );

            // 4. Map directly over Firebase Payments with Deduplication by Student + Term
            const groupedRecords = {};

            paymentList.forEach(p => {
                const termName = p.fees_category || '-';
                const key = `${p.student_id}_${termName}`;
                
                const fsName = p.fee_structure || termName;
                const programName = structureDetails[fsName]?.program || '-';
                
                const paidAmt = parseFloat(p.amount) || 0;
                
                let currentStatus = 'PENDING';
                if (p.status === 'verified') currentStatus = 'PAID';
                else if (p.status === 'failed') currentStatus = 'FAILED';

                if (!groupedRecords[key]) {
                    groupedRecords[key] = {
                        key: p.payment_id || p.order_id || key,
                        fee_id: p.order_id || 'manual',
                        student_id: p.student_id,
                        student_name: p.student_name || 'Unknown',
                        program: programName,
                        fee_structure: fsName,
                        academic_term: termName,
                        academic_year: '-',
                        total_fee: paidAmt,
                        paid_amount: currentStatus === 'PAID' ? paidAmt : 0,
                        outstanding: currentStatus === 'PAID' ? 0 : paidAmt,
                        status: currentStatus
                    };
                } else {
                    // If a duplicate exists, prioritize the 'PAID' record
                    if (currentStatus === 'PAID') {
                        groupedRecords[key].status = 'PAID';
                        groupedRecords[key].paid_amount = Math.max(groupedRecords[key].paid_amount, paidAmt);
                        groupedRecords[key].total_fee = Math.max(groupedRecords[key].total_fee, paidAmt);
                        groupedRecords[key].outstanding = 0;
                    } else if (groupedRecords[key].status !== 'PAID') {
                        // If neither is paid, just keep updating amounts (fallback)
                        groupedRecords[key].total_fee = Math.max(groupedRecords[key].total_fee, paidAmt);
                        groupedRecords[key].outstanding = Math.max(groupedRecords[key].outstanding, paidAmt);
                    }
                }
            });

            const mergedData = Object.values(groupedRecords);

            // Sort by student name, then by term
            mergedData.sort((a, b) => {
                if (a.student_name !== b.student_name) {
                    return (a.student_name || '').localeCompare(b.student_name || '');
                }
                return (a.academic_term || '').localeCompare(b.academic_term || '');
            });

            setStudents(mergedData);
            applyLocalFilters(mergedData);
        } catch (err) {
            console.error('[FeesReport] Fetch Data Error:', err);
            const errMsg = err.response?.data?.message || err.message;
            notification.error({ 
                message: 'Data Fetch Error', 
                description: `Failed to fetch fees data: ${errMsg}` 
            });
        } finally {
            setLoading(false);
        }
    };

    const applyLocalFilters = (dataToFilter) => {
        let filtered = dataToFilter || students;
        if (filters.program) {
            filtered = filtered.filter(s => s.program === filters.program);
        }
        if (filters.academic_year) {
            filtered = filtered.filter(s => s.academic_year === filters.academic_year || s.academic_year === '-');
        }
        setFilteredData(filtered);
    };

    useEffect(() => {
        applyLocalFilters();
    }, [filters.program, filters.academic_year]);

    const columns = [
        {
            title: 'STUDENT',
            key: 'student',
            width: 200,
            render: (_, r) => (
                <div>
                    <div className="font-bold text-gray-800">{r.student_name}</div>
                    <div className="text-xs text-blue-600 font-bold">{r.student_id}</div>
                </div>
            ),
            sorter: (a, b) => (a.student_name || '').localeCompare(b.student_name || ''),
        },
        {
            title: 'PROGRAM & STRUCTURE',
            key: 'program_info',
            render: (_, r) => (
                <div className="space-y-1">
                    <Tag color="cyan" className="m-0">{r.program}</Tag>
                    <div className="text-xs text-gray-500 font-medium">{r.fee_structure}</div>
                </div>
            ),
        },
        {
            title: 'TERM',
            dataIndex: 'academic_term',
            key: 'academic_term',
            render: (text) => <span className="font-medium text-gray-600">{text}</span>,
        },
        {
            title: 'TOTAL FEE',
            dataIndex: 'total_fee',
            key: 'total_fee',
            render: (val) => <span className="font-medium text-gray-500">₹{val.toLocaleString()}</span>,
            sorter: (a, b) => a.total_fee - b.total_fee,
        },
        {
            title: 'PAID',
            dataIndex: 'paid_amount',
            key: 'paid_amount',
            render: (val) => <span className="font-bold text-green-600">₹{val.toLocaleString()}</span>,
            sorter: (a, b) => a.paid_amount - b.paid_amount,
        },
        {
            title: 'OUTSTANDING',
            dataIndex: 'outstanding',
            key: 'outstanding',
            render: (val) => <span className={`font-bold ${val > 0 ? 'text-red-500' : 'text-gray-400'}`}>₹{val.toLocaleString()}</span>,
            sorter: (a, b) => a.outstanding - b.outstanding,
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                let icon = <ClockCircleOutlined />;
                if (status === 'PAID') { color = 'success'; icon = <CheckCircleOutlined />; }
                if (status === 'PARTIALLY PAID') { color = 'warning'; icon = <ExclamationCircleOutlined />; }
                if (status === 'UNPAID') { color = 'error'; icon = <ClockCircleOutlined />; }
                return <Tag icon={icon} color={color} className="font-bold rounded-full px-3">{status}</Tag>;
            }
        }
    ];

    const stats = {
        totalProjected: filteredData.reduce((sum, s) => sum + s.total_fee, 0),
        totalCollected: filteredData.reduce((sum, s) => sum + s.paid_amount, 0),
        totalOutstanding: filteredData.reduce((sum, s) => sum + s.outstanding, 0),
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Comprehensive Fees Report</h1>
                    <p className="text-gray-500 mt-1 italic">Term-wise fee structure analysis synchronized with real-time website payments</p>
                </div>
                <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading} shape="round" type="primary">Sync ERP & Website</Button>
            </div>

            {/* Filters Bar */}
            <Card className="rounded-2xl border-none shadow-sm bg-white" styles={{ body: { padding: '24px' } }}>
                <Row gutter={24} align="bottom">
                    <Col xs={24} md={6}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Year</label>
                            <Select 
                                className="w-full" 
                                value={filters.academic_year} 
                                onChange={v => setFilters(p => ({ ...p, academic_year: v }))}
                            >
                                {dropdowns.academicYears.map(y => <Option key={y} value={y}>{y}</Option>)}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} md={8}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program Filter</label>
                            <Select 
                                className="w-full" 
                                placeholder="All Programs"
                                allowClear
                                value={filters.program} 
                                onChange={v => setFilters(p => ({ ...p, program: v || '' }))}
                            >
                                {dropdowns.programs.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </div>
                    </Col>
                    <Col xs={24} md={4}>
                        <Button type="primary" block className="h-10 font-bold rounded-lg" onClick={fetchData}>APPLY FILTERS</Button>
                    </Col>
                </Row>
            </Card>

            {/* Stats Overview */}
            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="rounded-2xl border-none shadow-sm h-full">
                        <Statistic 
                            title={<span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total Fees Projected</span>}
                            value={stats.totalProjected} 
                            precision={2} 
                            valueStyle={{ color: '#64748b', fontWeight: 800, fontSize: '28px' }}
                            prefix={<span className="text-xl mr-1 opacity-50">₹</span>}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="rounded-2xl border-none shadow-sm h-full border-b-4 border-b-green-500">
                        <Statistic 
                            title={<span className="text-green-500 font-bold text-xs uppercase tracking-widest">Total Fees Collected</span>}
                            value={stats.totalCollected} 
                            precision={2} 
                            valueStyle={{ color: '#16a34a', fontWeight: 800, fontSize: '28px' }}
                            prefix={<span className="text-xl mr-1 opacity-50">₹</span>}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="rounded-2xl border-none shadow-sm h-full border-b-4 border-b-red-500">
                        <Statistic 
                            title={<span className="text-red-500 font-bold text-xs uppercase tracking-widest">Outstanding Balance</span>}
                            value={stats.totalOutstanding} 
                            precision={2} 
                            valueStyle={{ color: '#dc2626', fontWeight: 800, fontSize: '28px' }}
                            prefix={<span className="text-xl mr-1 opacity-50">₹</span>}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Report Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    rowKey="student_id"
                    pagination={{ pageSize: 20, showSizeChanger: true }}
                    className="report-sync-table"
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .report-sync-table .ant-table-thead > tr > th { 
                    background: #f8fafc !important; 
                    font-size: 10px; 
                    color: #94a3b8; 
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    font-weight: 800;
                    padding: 16px 24px;
                    border-bottom: 2px solid #f1f5f9;
                }
                .report-sync-table .ant-table-row { font-size: 14px; }
                .report-sync-table .ant-table-cell { padding: 18px 24px !important; }
                .report-sync-table .ant-table-row:hover .ant-table-cell { background: #f8fafc !important; }
            `}} />
        </div>
    );
};

export default FeesReport;
