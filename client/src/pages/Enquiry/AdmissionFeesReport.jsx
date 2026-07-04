import React, { useState, useEffect, useMemo } from 'react';
import { Table, notification, Select, DatePicker, Button, Tooltip, Input, Card, Statistic, Tag, Popconfirm, Dropdown } from 'antd';
import axios from 'axios';
import API from '../../services/api';
import { db } from '../../config/firebase';
import { FiDownload, FiSearch, FiRefreshCw, FiFilter, FiDollarSign, FiUsers, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
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
        board: 'All',
        feeType: 'All',
        paymentMode: 'All',
        status: 'All',
        dateRange: null,
        searchText: ''
    });

    // Unique values for dropdowns
    const [programs, setPrograms] = useState([]);
    const [boards, setBoards] = useState([]);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const [res, studentRes] = await Promise.all([
                axios.get('/local-api/admission-payment/history-all'),
                API.get('/api/resource/Student?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } }))
            ]);
            
            if (res.data?.success) {
                const data = res.data.data || [];
                const studentMap = {};
                (studentRes.data.data || []).forEach(s => {
                    studentMap[s.name] = s.custom_board;
                });

                const progSet = new Set();
                const boardSet = new Set();
                
                data.forEach(item => {
                    item.board = item.board || studentMap[item.student_id] || '';
                    if (item.program) progSet.add(item.program);
                    if (item.board) boardSet.add(item.board);
                });
                
                setPayments(data);
                setPrograms(Array.from(progSet).filter(Boolean));
                setBoards(Array.from(boardSet).filter(Boolean));
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

    
    const handleDeleteReceipt = async (record) => {
        try {
            const paymentId = record.order_id || record.payment_id;
            if (!paymentId) {
                notification.error({ message: 'Error', description: 'Invalid Payment ID' });
                return;
            }

            const res = await axios.delete(`/local-api/admission-payment/receipt/${paymentId}`);
            if (res.data?.success) {
                notification.success({ message: 'Success', description: 'Receipt deleted successfully' });
                fetchPayments(); // Refresh list
            } else {
                throw new Error(res.data?.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Delete error:', error);
            notification.error({ message: 'Error', description: error.response?.data?.message || error.message || 'Failed to delete receipt' });
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
            board_name: record.board || '',
            manual_receipt_ref: record.manual_receipt_ref || '',
            remarks: record.remarks || '',
        });
    };

    const filteredData = useMemo(() => {
        const filtered = payments.filter(item => {
            // ONLY SHOW PAID RECORDS (exclude unpaid/created/pending)
            const itemStatus = (item.status || '').toLowerCase();
            if (itemStatus !== 'verified' && itemStatus !== 'paid' && itemStatus !== 'success') {
                return false;
            }

            // Program filter
            if (filters.program !== 'All' && item.program !== filters.program) return false;
            // Board filter
            if (filters.board !== 'All' && item.board !== filters.board) return false;
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
        
        // Group by registration_no so we show one row per student
        const grouped = {};
        filtered.forEach(item => {
            const regNo = item.registration_no || item.order_id; // Fallback if no reg no
            if (!grouped[regNo]) {
                grouped[regNo] = { ...item, receipts: [] };
                grouped[regNo].amount = 0; // we will sum it up
            }
            grouped[regNo].receipts.push(item);
            grouped[regNo].amount += Number(item.amount) || 0;
            // Use the latest receipt's date for sorting
            if (new Date(item.created_at) > new Date(grouped[regNo].created_at)) {
                grouped[regNo].created_at = item.created_at;
                grouped[regNo].receipt_no = item.receipt_no;
            }
        });
        
        // Sort grouped array by created_at of latest receipt (descending)
        return Object.values(grouped).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }, [payments, filters]);

    // Stats
    const stats = useMemo(() => {
        let totalAmount = 0;
        let successfulCount = 0;
        let partialCount = 0;
        filteredData.forEach(item => {
            const itemStatus = (item.status || '').toLowerCase();
            if (itemStatus === 'verified' || itemStatus === 'paid' || itemStatus === 'success') {
                totalAmount += Number(item.amount) || 0;
                successfulCount++;
                if (Number(item.pending_due || 0) > 0) partialCount++;
            }
        });
        return {
            totalCount: filteredData.length,
            successfulCount,
            partialCount,
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
            render: (text, record) => (
                <div className="flex flex-col gap-1">
                    {record.receipts?.length > 1 ? (
                        <Tag color="blue" className="w-max">{record.receipts.length} Payments</Tag>
                    ) : (
                        <span className="font-semibold text-blue-600">{text || 'N/A'}</span>
                    )}
                </div>
            ),
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
                <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-700">{record.program || 'N/A'}</span>
                    {record.board && (
                        <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-0.5 w-max">
                            {record.board}
                        </span>
                    )}
                    <span className="text-xs text-gray-400 mt-0.5">{record.academic_year || 'N/A'}</span>
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
                const receipts = record.receipts || [record];
                const modes = [...new Set(receipts.map(r => (r.payment_mode || '').toUpperCase()))];
                return (
                    <div className="flex flex-col gap-1 items-start">
                        {modes.map(m => {
                            let color = 'default';
                            if (m === 'ONLINE') color = 'cyan';
                            else if (m === 'CASH') color = 'green';
                            else if (m === 'CHEQUE') color = 'orange';
                            return <Tag color={color} key={m}>{m || 'N/A'}</Tag>;
                        })}
                    </div>
                );
            }
        },
        {
            title: 'Amount Details',
            key: 'amountDetails',
            align: 'right',
            render: (_, record) => (
                <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-black text-gray-900 border-b border-gray-200 pb-1 w-full text-right">
                        Paid: <span className="text-green-700">₹{Number(record.amount || 0).toLocaleString()}</span>
                    </span>
                    <div className="flex flex-col text-xs mt-1 w-full text-right text-gray-500">
                        <span>Total Fee: ₹{Number(record.total_fee || record.amount || 0).toLocaleString()}</span>
                        <span>Total Paid: ₹{Number(record.total_paid_so_far || record.amount || 0).toLocaleString()}</span>
                        <span className={record.pending_due > 0 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
                            Pending: ₹{Number(record.pending_due || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            ),
            sorter: (a, b) => Number(a.amount || 0) - Number(b.amount || 0)
        },,
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status, record) => {
                const isPartial = Number(record.pending_due || 0) > 0 && (status === 'verified' || status === 'paid' || status === 'success');
                if (isPartial) {
                    return (
                        <div className="flex flex-col items-center gap-1">
                            <Tag color="orange" className="uppercase font-bold">⚠️ PARTIAL</Tag>
                            <span className="text-[10px] text-orange-600 font-bold">Due: ₹{Number(record.pending_due).toLocaleString()}</span>
                        </div>
                    );
                }
                return (
                    <Tag color={status === 'verified' ? 'success' : status === 'created' ? 'processing' : 'warning'} className="uppercase">
                        {status === 'verified' ? 'SUCCESS' : status || 'PENDING'}
                    </Tag>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                record.status === 'verified' || record.status === 'paid' || record.status === 'success' ? (
                    <div className="flex gap-2 justify-center">
                        {record.receipts?.length > 1 ? (
                            <Dropdown
                                menu={{
                                    items: record.receipts.map((r, idx) => ({
                                        key: idx,
                                        label: `Receipt ${idx + 1} (${dayjs(r.created_at).format('DD MMM, hh:mm A')})`,
                                        onClick: () => handleDownloadReceipt(r)
                                    }))
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                            >
                                <Button 
                                    type="text" 
                                    icon={<FiDownload className="text-blue-600" />} 
                                    className="bg-blue-50 hover:bg-blue-100"
                                />
                            </Dropdown>
                        ) : (
                            <Tooltip title="Download Receipt">
                                <Button 
                                    type="text" 
                                    icon={<FiDownload className="text-blue-600" />} 
                                    onClick={() => handleDownloadReceipt(record.receipts?.[0] || record)}
                                    className="bg-blue-50 hover:bg-blue-100"
                                />
                            </Tooltip>
                        )}
                        <Popconfirm
                            title={record.receipts?.length > 1 ? "Delete All Payments?" : "Delete this payment?"}
                            description={record.receipts?.length > 1 ? "This will completely remove ALL receipts for this student." : "This will completely remove the payment and receipt, marking the student as unpaid."}
                            onConfirm={async () => {
                                const receipts = record.receipts || [record];
                                for (const r of receipts) {
                                    await handleDeleteReceipt(r);
                                }
                            }}
                            okText="Yes, Delete"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Delete Receipt">
                                <Button 
                                    type="text" 
                                    danger
                                    icon={<FiTrash2 />} 
                                    className="bg-red-50 hover:bg-red-100"
                                />
                            </Tooltip>
                        </Popconfirm>
                    </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
                    <Statistic 
                        title={<span className="text-orange-700 font-semibold flex items-center gap-2">⚠️ Partial Payments</span>}
                        value={stats.partialCount} 
                        valueStyle={{ color: '#c2410c', fontWeight: '900' }}
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
                            value={filters.board}
                            onChange={(v) => setFilters(prev => ({ ...prev, board: v }))}
                            className="w-full"
                            placeholder="Board"
                        >
                            <Select.Option value="All">All Boards</Select.Option>
                            {boards.map(b => <Select.Option key={b} value={b}>{b}</Select.Option>)}
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
                    rowClassName={(record) => {
                        const isPartial = Number(record.pending_due || 0) > 0 && record.status === 'verified';
                        if (isPartial) return 'bg-orange-50/40';
                        if (record.status !== 'verified') return 'bg-red-50/30';
                        return '';
                    }}
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
