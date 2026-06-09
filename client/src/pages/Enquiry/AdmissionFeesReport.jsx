import React, { useState, useEffect, useMemo } from 'react';
import { Table, notification, Select, DatePicker, Button, Tooltip, Input, Card, Statistic, Tag } from 'antd';
import axios from 'axios';
import { db } from '../../config/firebase';
import { FiDownload, FiSearch, FiRefreshCw, FiFilter, FiDollarSign, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { generateAdmissionReceipt } from './AdmissionFeeReceipt';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const AdmissionFeesReport = () => {
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    
    // Filters
    const [filters, setFilters] = useState({
        program: 'All',
        feeType: 'All',
        paymentMode: 'All',
        status: 'All',
        dateRange: null,
        searchText: ''
    });

    // Unique values for dropdowns
    const [programs, setPrograms] = useState([]);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/local-api/admission-payment/history-all');
            if (res.data?.success) {
                const data = res.data.data || [];
                const progSet = new Set();
                
                data.forEach(item => {
                    if (item.program) progSet.add(item.program);
                });
                
                setPayments(data);
                setPrograms(Array.from(progSet).filter(Boolean));
            } else {
                throw new Error(res.data?.message || 'Failed to fetch');
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            notification.error({ message: 'Error', description: 'Failed to load admission fee payments' });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = (record) => {
        generateAdmissionReceipt({
            receipt_no: record.receipt_no,
            student_name: record.student_name,
            registration_no: record.registration_no,
            admission_no: record.admission_no,
            program: record.program,
            academic_year: record.academic_year,
            fee_type: record.fee_type,
            fee_name: record.fee_name,
            amount: record.amount,
            payment_mode: record.payment_mode,
            payment_id: record.payment_id || record.order_id,
            receipt_date: record.receipt_date || record.created_at || new Date().toISOString(),
            parent_name: record.parent_name,
            parent_mobile: record.parent_mobile,
        });
    };

    const filteredData = useMemo(() => {
        return payments.filter(item => {
            // ONLY SHOW PAID RECORDS (exclude unpaid/created/pending)
            const itemStatus = (item.status || '').toLowerCase();
            if (itemStatus !== 'verified' && itemStatus !== 'paid' && itemStatus !== 'success') {
                return false;
            }

            // Program filter
            if (filters.program !== 'All' && item.program !== filters.program) return false;
            // Fee Type filter
            if (filters.feeType !== 'All' && item.fee_type !== filters.feeType) return false;
            // Mode filter
            if (filters.paymentMode !== 'All' && (item.payment_mode || '').toUpperCase() !== filters.paymentMode.toUpperCase()) return false;
            // Status filter
            if (filters.status !== 'All' && itemStatus !== filters.status.toLowerCase()) return false;
            
            // Date filter
            if (filters.dateRange && filters.dateRange.length === 2 && item.created_at) {
                const itemDate = dayjs(item.created_at);
                const startDate = filters.dateRange[0].startOf('day');
                const endDate = filters.dateRange[1].endOf('day');
                if (!itemDate.isBetween(startDate, endDate, null, '[]')) return false;
            }

            // Search text
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                const matchName = (item.student_name || '').toLowerCase().includes(searchLower);
                const matchReg = (item.registration_no || '').toLowerCase().includes(searchLower);
                const matchAdm = (item.admission_no || '').toLowerCase().includes(searchLower);
                const matchRec = (item.receipt_no || '').toLowerCase().includes(searchLower);
                if (!matchName && !matchReg && !matchAdm && !matchRec) return false;
            }

            return true;
        });
    }, [payments, filters]);

    // Stats
    const stats = useMemo(() => {
        let totalAmount = 0;
        let successfulCount = 0;
        filteredData.forEach(item => {
            const itemStatus = (item.status || '').toLowerCase();
            if (itemStatus === 'verified' || itemStatus === 'paid' || itemStatus === 'success') {
                totalAmount += Number(item.amount) || 0;
                successfulCount++;
            }
        });
        return {
            totalCount: filteredData.length,
            successfulCount,
            totalAmount
        };
    }, [filteredData]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (ts) => ts ? dayjs(ts).format('DD MMM YYYY, hh:mm A') : 'N/A',
            width: 150,
            sorter: (a, b) => dayjs(b.created_at || 0).valueOf() - dayjs(a.created_at || 0).valueOf()
        },
        {
            title: 'Receipt No',
            dataIndex: 'receipt_no',
            key: 'receipt_no',
            render: (text) => <span className="font-semibold text-blue-600">{text || 'N/A'}</span>,
            width: 130
        },
        {
            title: 'Student Details',
            key: 'student',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{record.student_name || 'N/A'}</span>
                    <span className="text-xs text-gray-500">Reg: {record.registration_no || 'N/A'}</span>
                    {record.admission_no && <span className="text-xs text-green-600">Adm: {record.admission_no}</span>}
                </div>
            )
        },
        {
            title: 'Program / Year',
            key: 'program',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-sm">{record.program || 'N/A'}</span>
                    <span className="text-xs text-gray-400">{record.academic_year || 'N/A'}</span>
                </div>
            )
        },
        {
            title: 'Fee Details',
            key: 'feeDetails',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-sm">{record.fee_name || 'N/A'}</span>
                    <Tag color={record.fee_type === 'Registration' ? 'blue' : 'purple'} className="mt-1 w-max">
                        {record.fee_type || 'N/A'}
                    </Tag>
                </div>
            )
        },
        {
            title: 'Payment Mode',
            key: 'paymentMode',
            render: (_, record) => {
                const mode = (record.payment_mode || '').toUpperCase();
                let color = 'default';
                if (mode === 'ONLINE') color = 'cyan';
                else if (mode === 'CASH') color = 'green';
                else if (mode === 'CHEQUE') color = 'orange';
                return <Tag color={color}>{mode || 'N/A'}</Tag>;
            }
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            render: (amt) => <span className="font-bold text-gray-800">₹{Number(amt || 0).toLocaleString()}</span>,
            sorter: (a, b) => Number(a.amount || 0) - Number(b.amount || 0)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status) => (
                <Tag color={status === 'verified' ? 'success' : status === 'created' ? 'processing' : 'warning'} className="uppercase">
                    {status === 'verified' ? 'SUCCESS' : status || 'PENDING'}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                record.status === 'verified' ? (
                    <Tooltip title="Download Receipt">
                        <Button 
                            type="text" 
                            icon={<FiDownload className="text-blue-600" />} 
                            onClick={() => handleDownloadReceipt(record)}
                            className="bg-blue-50 hover:bg-blue-100"
                        />
                    </Tooltip>
                ) : null
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        Admission Fees Report
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track and manage all registration and admission fee payments</p>
                </div>
                <Button 
                    icon={<FiRefreshCw className={loading ? 'animate-spin' : ''} />} 
                    onClick={fetchPayments}
                    type="primary"
                    className="bg-gray-800 hover:bg-gray-900"
                >
                    Refresh Data
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                    <Statistic 
                        title={<span className="text-blue-800 font-semibold flex items-center gap-2"><FiUsers /> Total Transactions</span>}
                        value={stats.totalCount} 
                        valueStyle={{ color: '#1e40af', fontWeight: '900' }}
                    />
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
                    <Statistic 
                        title={<span className="text-green-800 font-semibold flex items-center gap-2"><FiCheckCircle /> Successful Payments</span>}
                        value={stats.successfulCount} 
                        valueStyle={{ color: '#166534', fontWeight: '900' }}
                    />
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-purple-50 to-fuchsia-50">
                    <Statistic 
                        title={<span className="text-purple-800 font-semibold flex items-center gap-2"><FiDollarSign /> Total Revenue Collected</span>}
                        value={stats.totalAmount} 
                        prefix="₹"
                        valueStyle={{ color: '#6b21a8', fontWeight: '900' }}
                    />
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
                    <FiFilter /> <span>Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-2">
                        <Input 
                            placeholder="Search Student, Reg No, Receipt..." 
                            prefix={<FiSearch className="text-gray-400" />}
                            value={filters.searchText}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                            className="rounded-lg"
                        />
                    </div>
                    <div>
                        <Select
                            value={filters.program}
                            onChange={(v) => setFilters(prev => ({ ...prev, program: v }))}
                            className="w-full"
                            placeholder="Program"
                        >
                            <Select.Option value="All">All Programs</Select.Option>
                            {programs.map(p => <Select.Option key={p} value={p}>{p}</Select.Option>)}
                        </Select>
                    </div>
                    <div>
                        <Select
                            value={filters.feeType}
                            onChange={(v) => setFilters(prev => ({ ...prev, feeType: v }))}
                            className="w-full"
                        >
                            <Select.Option value="All">All Fee Types</Select.Option>
                            <Select.Option value="Registration">Registration</Select.Option>
                            <Select.Option value="Admission">Admission</Select.Option>
                        </Select>
                    </div>
                    <div>
                        <Select
                            value={filters.paymentMode}
                            onChange={(v) => setFilters(prev => ({ ...prev, paymentMode: v }))}
                            className="w-full"
                        >
                            <Select.Option value="All">All Modes</Select.Option>
                            <Select.Option value="ONLINE">Online</Select.Option>
                            <Select.Option value="CASH">Cash</Select.Option>
                            <Select.Option value="CHEQUE">Cheque</Select.Option>
                        </Select>
                    </div>
                    <div className="lg:col-span-1">
                        <RangePicker 
                            className="w-full"
                            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    rowKey={(record) => record.order_id || record.payment_id || Math.random().toString()}
                    loading={loading}
                    pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} payments` }}
                    className="custom-table"
                    rowClassName={(record) => record.status !== 'verified' ? 'bg-red-50/30' : ''}
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                }
                .custom-table .ant-table-tbody > tr:hover > td {
                    background: #f1f5f9 !important;
                }
            `}} />
        </div>
    );
};

export default AdmissionFeesReport;
