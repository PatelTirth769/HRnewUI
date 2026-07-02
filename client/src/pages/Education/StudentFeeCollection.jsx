import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table, Card, Statistic, Row, Col, Tag, Button, Select, Space, Input, DatePicker, notification, Spin, Tooltip, Dropdown, Modal, Form, InputNumber } from 'antd';
import { 
  SearchOutlined, SyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, FilterOutlined, ClearOutlined, DownloadOutlined,
  UserOutlined, BookOutlined, CalendarOutlined, WalletOutlined,
  FileExcelOutlined, EyeOutlined, EyeInvisibleOutlined, PlusCircleOutlined,
  CreditCardOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';
import dayjs from 'dayjs';
import html2pdf from 'html2pdf.js';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import FeeReceiptTemplate from './FeeReceiptTemplate';
import { useUserRole } from '../../hooks/useUserRole';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';

const { Option } = Select;
const { RangePicker } = DatePicker;

const StudentFeeCollection = () => {
    const { isCoordinator } = useUserRole();
    const coordinatorScope = useCoordinatorScope();
    
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

    // Payment collection modal states
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentDate, setPaymentDate] = useState(dayjs());
    const [manualReceiptRef, setManualReceiptRef] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [discountCategories, setDiscountCategories] = useState([]);
    const [selectedDiscountId, setSelectedDiscountId] = useState(null);

    // Multi-payment selection states
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isMultiPayment, setIsMultiPayment] = useState(false);

    // Handlers for selection and modal
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const receiptRef = useRef(null);

    // Receipt download logic
    const handleDownloadReceipt = (record) => {
        const dateObj = new Date(record.paid_date || record.receipt_date || new Date());
        const formattedDate = dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-US');
        
        const previous_payments = (record.receipts || []).filter(r => new Date(r.created_at || r.verified_at || 0).getTime() < dateObj.getTime() - 1000).map(r => ({
            amount: parseFloat(r.amount) || 0,
            date: new Date(r.created_at || r.verified_at || 0).toLocaleDateString('en-GB'),
            receipt_no: r.receipt_no || r.payment_id || '-'
        }));

        const totalPreviousPaid = previous_payments.reduce((sum, p) => sum + p.amount, 0);
        const originalFee = record.original_fee || record.total_fee || 0;
        const discountAmount = record.discount_amount || 0;
        const termAmountToPay = Math.max(0, originalFee - discountAmount);
        const currentReceiptAmount = parseFloat(record.paid_amount || record.amount) || 0;
        const dynamicOutstanding = Math.max(0, termAmountToPay - totalPreviousPaid - currentReceiptAmount);

        const receiptData = {
            enrollmentNo: record.student_id,
            studentName: record.student_name,
            courseName: record.program,
            semester: record.academic_term || 'N/A',
            receiptDate: formattedDate,
            receiptNo: record.receipt_no || record.payment_id || record.order_id || 'N/A',
            amount: record.paid_amount || record.amount || 0,
            feeName: record.academic_term || 'TUITION FEES',
            paymentMode: (record.payment_mode || 'CASH') + ' PAYMENT',
            transactionNo: record.receipt_no || record.payment_id || 'N/A',
            original_fee: originalFee,
            discount_amount: discountAmount,
            discount_name: record.discount_name || '',
            discount_percentage: record.discount_percentage || 0,
            studentGroup: record.student_group || record.section || '',
            boardName: record.board || '',
            outstanding: dynamicOutstanding,
            previous_payments: previous_payments
        };

        setSelectedReceipt(receiptData);

        setTimeout(() => {
            if (receiptRef.current) {
                console.log('Starting PDF generation for receipt:', receiptData.receiptNo);
                const safeFileName = `Receipt_${String(receiptData.receiptNo).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
                const opt = {
                    margin: 0.3,
                    filename: safeFileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, windowWidth: 700, width: 700 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };

                try {
                    html2pdf().from(receiptRef.current).set(opt).save().then(() => {
                        notification.success({ message: `Receipt Downloaded Successfully` });
                        setSelectedReceipt(null);
                    }).catch(err => {
                        console.error('PDF download promise error:', err);
                        notification.error({ message: 'PDF Error', description: err.message || 'Failed to generate PDF' });
                        setSelectedReceipt(null);
                    });
                } catch (err) {
                    console.error('PDF generation synchronous error:', err);
                    notification.error({ message: 'Generation Error', description: err.message || 'Failed to start PDF' });
                    setSelectedReceipt(null);
                }
            } else {
                console.error('Print area element is null. Cannot download receipt.');
                notification.error({ message: 'Error', description: 'Receipt template is not ready. Try again.' });
                setSelectedReceipt(null);
            }
        }, 500);
    };

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        fetchInitialData();
    }, [isCoordinator, coordinatorScope.loading]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [yRes, pRes, tRes] = await Promise.all([
                API.get('/api/resource/Academic Year?limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Term?limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            let pData = pRes.data.data?.map(d => ({ value: d.name, label: d.name, custom_board: d.custom_board })) || [];
            if (isCoordinator && !coordinatorScope.loading) {
                pData = pData.filter(p => coordinatorScope.programs.includes(p.value) || coordinatorScope.boards.includes(p.custom_board));
            }
            setDropdowns({
                academicYears: yRes.data.data?.map(d => d.name) || [],
                programs: pData,
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
        setSelectedRowKeys([]);
        setSelectedRows([]);
        setIsMultiPayment(false);
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
                console.warn('[Offline Collection] Could not fetch ERP Fees:', e.message);
                try {
                    const feesRes2 = await API.get('/api/resource/Fees', {
                        params: {
                            fields: JSON.stringify(["name", "student", "student_name", "program", "grand_total", "outstanding_amount", "posting_date"]),
                            limit_page_length: 'None'
                        }
                    });
                    erpFeesList = feesRes2.data?.data || [];
                } catch (e2) { console.warn('[Offline Collection] Fees fallback also failed:', e2.message); }
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
            } catch (e) { console.warn('[Offline Collection] Could not fetch Fee Structures list:', e.message); }

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
            } catch { console.warn('[Offline Collection] Could not fetch students'); }

            // 5. Fetch ALL Program Enrollments
            let enrollments = [];
            try {
                const enrRes = await API.get('/api/resource/Program Enrollment', {
                    params: {
                        fields: JSON.stringify(["name", "student", "student_name", "program", "academic_year", "enrollment_date"]),
                        limit_page_length: 'None'
                    }
                });
                enrollments = enrRes.data?.data || [];
            } catch (e) { console.warn('[Offline Collection] Could not fetch enrollments:', e.message); }

            const studentInfoMap = {};
            allStudents.forEach(s => {
                studentInfoMap[s.name] = { student_name: s.student_name || s.name, program: s.program || '', board: s.custom_board || '' };
            });
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
            enrollments.forEach(e => {
                if (e.student && !allStudents.find(s => s.name === e.student)) {
                    allStudents.push({ name: e.student, student_name: e.student_name || e.student, program: e.program, enabled: 1 });
                }
            });

            // Build Firebase payment lookup: key = student_id + term
            const firebasePayments = {};
            paymentList.forEach(p => {
                if (p.status === 'created' || p.status === 'failed') return;
                const termName = p.fees_category || '-';
                const key = `${p.student_id}_${termName}`;
                if (!firebasePayments[key]) firebasePayments[key] = [];
                firebasePayments[key].push(p);
            });

            let studentDiscountsMap = {};
            let feeDiscountsMap = {};
            try {
                // Fetch from 'schooler_system' as that's the main system collection
                const sysCode = 'schooler_system';
                const sdSnaps = await getDocs(collection(db, sysCode, 'data', 'student_discounts'));
                sdSnaps.forEach(doc => {
                    const data = doc.data();
                    if (!studentDiscountsMap[data.student_id]) studentDiscountsMap[data.student_id] = [];
                    studentDiscountsMap[data.student_id].push(data);
                });

                const fdSnaps = await getDocs(collection(db, sysCode, 'data', 'fees_discounts'));
                const cats = [];
                fdSnaps.forEach(doc => { 
                    feeDiscountsMap[doc.id] = doc.data(); 
                    cats.push({ id: doc.id, ...doc.data() });
                });
                setDiscountCategories(cats);
                
                // Fallback fetch from 'schooler' removed as data is migrated
                
                console.log('[Discount Debug] Loaded studentDiscountsMap:', studentDiscountsMap);
                console.log('[Discount Debug] Loaded feeDiscountsMap:', feeDiscountsMap);
            } catch(e) { console.warn('Could not fetch discounts', e.message); }

            // 5. Build the merged records
            const groupedRecords = {};

            // Process ERP Fees records
            erpFeesList.forEach(fee => {
                const studentId = fee.student;
                const studentName = fee.student_name || studentInfoMap[studentId]?.student_name || 'Unknown';
                const program = fee.program || studentInfoMap[studentId]?.program || '-';
                const board = studentInfoMap[studentId]?.board || '-';
                const termName = fee.academic_term || fee.name;
                const key = `${studentId}_${termName}`;
                let totalFee = parseFloat(fee.grand_total) || 0;
                let outstanding = parseFloat(fee.outstanding_amount) || 0;
                const paidAmount = totalFee - outstanding;

                const feeStructureName = fee.fee_structure || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program && (!board || board === '-' || structureDetails[k]?.company === board)) || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program) || '-';

                let originalTotal = totalFee;
                let discountAmount = 0;
                let discountName = '';
                let discountPercentage = 0;
                if (structureDetails[feeStructureName]) {
                    const fsData = structureDetails[feeStructureName];
                    const components = fsData.components || [];
                    const termComp = components.find(c => c.fees_category === termName || c.name === termName);
                    if (termComp) {
                        const originalTermAmount = parseFloat(termComp.amount) || 0;
                        if (totalFee < originalTermAmount) {
                            discountAmount = originalTermAmount - totalFee;
                            originalTotal = originalTermAmount;
                        }
                    }
                }

                if (discountAmount === 0 && studentDiscountsMap[studentId]) {
                    const activeDiscount = studentDiscountsMap[studentId][0]; // just grab the first assigned discount
                    if (activeDiscount) {
                        let fd = feeDiscountsMap[activeDiscount.discount_id];
                        if (!fd) fd = Object.values(feeDiscountsMap).find(d => d.name === activeDiscount.discount_id || d.name === activeDiscount.discount_name);
                        
                        if (fd) {
                            // Robust terms check
                            const terms = Array.isArray(activeDiscount.terms) ? activeDiscount.terms : (activeDiscount.terms ? [activeDiscount.terms] : []);
                            if (terms.length === 0 || terms.includes('All Terms') || terms.includes(termName)) {
                                const pct = parseFloat(fd.percentage) || 0;
                                if (pct > 0) {
                                    discountPercentage = pct;
                                    discountAmount = (originalTotal * pct) / 100;
                                    totalFee = originalTotal - discountAmount;
                                    discountName = fd.name;
                                    if (outstanding > 0) {
                                        outstanding = totalFee - paidAmount;
                                    }
                                }
                            }
                        }
                    }
                }

                const fbPayments = firebasePayments[key] || [];
                const verifiedPayments = fbPayments.filter(p => ['verified', 'partial', 'successful', 'captured'].includes(p.status)).sort((a, b) => new Date(b.created_at || b.verified_at || 0) - new Date(a.created_at || a.verified_at || 0));
                
                const lastPayment = verifiedPayments.length > 0 ? verifiedPayments[0] : null;
                
                if (lastPayment && lastPayment.discount_amount !== undefined && parseFloat(lastPayment.discount_amount) > 0) {
                    discountAmount = parseFloat(lastPayment.discount_amount);
                    discountName = lastPayment.discount_name || 'Discount';
                    discountPercentage = lastPayment.discount_percentage || 0;
                    totalFee = originalTotal - discountAmount;
                    if (outstanding > 0) {
                        outstanding = totalFee - paidAmount;
                    }
                }

                const totalFbPaid = verifiedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

                let actualPaidAmount = paidAmount;
                let actualOutstanding = outstanding;
                if (totalFbPaid > actualPaidAmount) {
                    actualPaidAmount = totalFbPaid;
                    actualOutstanding = Math.max(0, totalFee - actualPaidAmount);
                }

                let status = 'UNPAID';
                let paidDate = null;
                let receiptNo = '-';


                if (actualOutstanding <= 0) {
                    status = 'PAID';
                    paidDate = lastPayment?.verified_at || lastPayment?.receipt_date || fee.posting_date;
                    receiptNo = lastPayment?.payment_id || lastPayment?.receipt_no || '-';
                } else if (actualPaidAmount > 0 && actualOutstanding > 0) {
                    status = 'PARTIAL';
                    paidDate = lastPayment?.verified_at || lastPayment?.receipt_date || null;
                    receiptNo = lastPayment?.payment_id || lastPayment?.receipt_no || '-';
                }

                if (!groupedRecords[key] || status === 'PAID' || status === 'PARTIAL') {
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
                        original_fee: originalTotal,
                        discount_amount: discountAmount,
                        discount_name: discountName,
                        discount_percentage: discountPercentage,
                        paid_amount: actualPaidAmount,
                        outstanding: actualOutstanding,
                        status: status,
                        paid_date: paidDate,
                        payment_mode: lastPayment?.payment_mode || '-',
                        receipt_no: receiptNo,
                        receipts: verifiedPayments
                    };
                }
            });

            // Process Firebase-only payments
            Object.keys(firebasePayments).forEach(key => {
                if (groupedRecords[key]) return;

                const fbPayments = firebasePayments[key];
                const verifiedPayments = fbPayments.filter(p => ['verified', 'partial', 'successful', 'captured'].includes(p.status)).sort((a, b) => new Date(b.created_at || b.verified_at || 0) - new Date(a.created_at || a.verified_at || 0));
                const totalFbPaid = verifiedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                
                const p = fbPayments[0]; // representative record
                const fsName = p.fee_structure || '';
                const programName = structureDetails[fsName]?.program || studentInfoMap[p.student_id]?.program || '-';
                
                let originalFee = p.original_fee || parseFloat(p.amount) || 0;
                let paidAmt = totalFbPaid;
                
                const lastPayment = verifiedPayments.length > 0 ? verifiedPayments[0] : null;
                const paidDate = lastPayment?.verified_at || lastPayment?.receipt_date || null;
                
                let discountAmount = 0;
                let discountName = '';
                let discountPercentage = 0;
                let totalFee = originalFee;

                if (lastPayment && lastPayment.discount_amount !== undefined && parseFloat(lastPayment.discount_amount) > 0) {
                    discountAmount = parseFloat(lastPayment.discount_amount);
                    discountName = lastPayment.discount_name || 'Discount';
                    discountPercentage = lastPayment.discount_percentage || 0;
                    totalFee = originalFee - discountAmount;
                }

                let currentStatus = 'PENDING';
                if (paidAmt >= totalFee) currentStatus = 'PAID';
                else if (paidAmt > 0) currentStatus = 'PARTIAL';

                groupedRecords[key] = {
                    key: p.payment_id || p.order_id || key,
                    fee_id: p.order_id || 'manual',
                    student_id: p.student_id,
                    student_name: p.student_name || studentInfoMap[p.student_id]?.student_name || 'Unknown',
                    program: programName,
                    board: studentInfoMap[p.student_id]?.board || '-',
                    fee_structure: fsName,
                    academic_term: p.fees_category || '-',
                    academic_year: '-',
                    total_fee: Math.max(totalFee, paidAmt),
                    original_fee: originalFee,
                    discount_amount: discountAmount || p.discount_amount || 0,
                    discount_name: discountName || p.discount_name || '',
                    discount_percentage: discountPercentage || p.discount_percentage || 0,
                    paid_amount: paidAmt,
                    outstanding: Math.max(0, totalFee - paidAmt),
                    status: currentStatus,
                    paid_date: paidDate,
                    payment_mode: lastPayment?.payment_mode || p.payment_mode || 'ONLINE',
                    receipt_no: lastPayment?.receipt_no || lastPayment?.payment_id || p.receipt_no || p.payment_id || '-',
                    receipts: verifiedPayments
                };
            });

            allStudents.forEach(student => {
                const studentId = student.name;
                const studentName = studentInfoMap[studentId]?.student_name || student.student_name || studentId;
                const program = studentInfoMap[studentId]?.program || student.program || '';
                const board = studentInfoMap[studentId]?.board || student.custom_board || '-';
                const fsName = Object.keys(structureDetails).find(k => structureDetails[k]?.program === program && (!board || board === '-' || structureDetails[k]?.company === board)) || Object.keys(structureDetails).find(k => structureDetails[k]?.program === program);

                if (fsName && structureDetails[fsName]) {
                    const fsData = structureDetails[fsName];
                    const components = fsData.components || [];

                    components.forEach(comp => {
                        const termName = comp.fees_category || comp.name || '-';
                        const key = `${studentId}_${termName}`;

                        if (groupedRecords[key]) return;

                        let termAmount = parseFloat(comp.amount) || 0;
                        let originalTotal = termAmount;
                        let discountAmount = 0;
                        let discountName = '';
                        let discountPercentage = 0;
                        if (studentDiscountsMap[studentId]) {
                            const activeDiscount = studentDiscountsMap[studentId][0]; 
                            if (activeDiscount) {
                                let fd = feeDiscountsMap[activeDiscount.discount_id];
                                if (!fd) fd = Object.values(feeDiscountsMap).find(d => d.name === activeDiscount.discount_id || d.name === activeDiscount.discount_name);
                                
                                if (fd) {
                                    const terms = Array.isArray(activeDiscount.terms) ? activeDiscount.terms : (activeDiscount.terms ? [activeDiscount.terms] : []);
                                    if (terms.length === 0 || terms.includes('All Terms') || terms.includes(termName)) {
                                        const pct = parseFloat(fd.percentage) || 0;
                                        if (pct > 0) {
                                            discountPercentage = pct;
                                            discountAmount = (originalTotal * pct) / 100;
                                            termAmount = originalTotal - discountAmount;
                                            discountName = fd.name;
                                        }
                                    }
                                }
                            }
                        }

                        const fbPayments = firebasePayments[key] || [];
                        const verifiedPayments = fbPayments.filter(p => ['verified', 'partial', 'successful', 'captured'].includes(p.status)).sort((a, b) => new Date(b.created_at || b.verified_at || 0) - new Date(a.created_at || a.verified_at || 0));
                        const totalFbPaid = verifiedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

                        let actualPaidAmount = totalFbPaid;
                        let actualOutstanding = Math.max(0, termAmount - actualPaidAmount);

                        let status = 'UNPAID';
                        let paidDate = null;
                        let receiptNo = '-';
                        const lastPayment = verifiedPayments.length > 0 ? verifiedPayments[0] : null;

                        if (actualOutstanding <= 0) {
                            status = 'PAID';
                            paidDate = lastPayment?.verified_at || lastPayment?.receipt_date || lastPayment?.created_at;
                            receiptNo = lastPayment?.payment_id || lastPayment?.receipt_no || '-';
                        } else if (actualPaidAmount > 0) {
                            status = 'PARTIAL';
                            paidDate = lastPayment?.verified_at || lastPayment?.receipt_date || lastPayment?.created_at;
                            receiptNo = lastPayment?.payment_id || lastPayment?.receipt_no || '-';
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
                            original_fee: originalTotal,
                            discount_amount: discountAmount,
                            discount_name: discountName,
                            discount_percentage: discountPercentage,
                            paid_amount: actualPaidAmount,
                            outstanding: actualOutstanding,
                            status: status,
                            paid_date: paidDate,
                            payment_mode: lastPayment?.payment_mode || '-',
                            receipt_no: receiptNo,
                            receipts: verifiedPayments
                        };
                    });
                } else {
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
        } catch (err) {
            console.error('[Offline Collection] Fetch Data Error:', err);
            notification.error({ message: 'Data Fetch Error', description: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        let data = [...allData];
        if (isCoordinator && !coordinatorScope.loading) {
            data = data.filter(s => coordinatorScope.programs.includes(s.program) || coordinatorScope.boards.includes(s.board));
        }
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
    }, [allData, filters, isCoordinator, coordinatorScope]);

    const stats = useMemo(() => ({
        totalProjected: filteredData.reduce((s, r) => s + (r.original_fee || r.total_fee || 0), 0),
        totalCollected: filteredData.reduce((s, r) => {
            if (r.status === 'PAID') return s + (r.original_fee || r.total_fee || r.paid_amount || 0);
            return s + (r.paid_amount || 0);
        }, 0),
        totalOutstanding: filteredData.reduce((s, r) => {
            // If unpaid, outstanding is the original fee
            // If paid, outstanding is 0 (the discount accounts for the difference)
            if (r.status === 'PAID') return s;
            return s + (r.original_fee || r.outstanding || r.total_fee || 0);
        }, 0),
        paidCount: filteredData.filter(r => r.status === 'PAID').length,
        unpaidCount: filteredData.filter(r => r.status !== 'PAID').length,
        totalRecords: filteredData.length,
    }), [filteredData]);

    const clearAllFilters = () => setFilters({ academic_year: '2026-27', program: '', board: '', term: '', status: '', payment_mode: '', student_search: '', date_range: null });

    const activeFilterCount = [filters.program, filters.board, filters.term, filters.status, filters.payment_mode, filters.student_search, filters.date_range].filter(Boolean).length;

    const [manualDiscountAmount, setManualDiscountAmount] = useState(0);

    const closePaymentModal = () => {
        setIsPaymentModalVisible(false);
        setSelectedRow(null);
        setSelectedRows([]);
        setPaymentAmount(0);
        setPaymentMode('CASH');
        setPaymentDate(dayjs());
        setSelectedDiscountId(null);
        setManualReceiptRef('');
        setManualDiscountAmount(0);
        setIsMultiPayment(false);
    };

    const handleCollectFee = (row) => {
        setIsMultiPayment(false);
        setSelectedRow(row);
        setPaymentAmount(row.outstanding);
        setPaymentMode('CASH');
        setPaymentDate(dayjs());
        setManualReceiptRef('');
        setManualDiscountAmount(0);
        setSelectedDiscountId(null);
        setPaymentModalVisible(true);
    };

    const recalculatePaymentAmount = (catId, manualAmt) => {
        const baseOutstanding = isMultiPayment 
            ? selectedRows.reduce((sum, r) => sum + r.outstanding, 0)
            : (selectedRow.outstanding);
            
        let newAmount = baseOutstanding;

        if (catId) {
            const originalAmount = isMultiPayment 
                ? selectedRows.reduce((sum, r) => sum + (r.original_fee || r.total_fee || r.outstanding), 0)
                : (selectedRow.original_fee || selectedRow.total_fee || selectedRow.outstanding);
            const discount = discountCategories.find(d => d.id === catId);
            if (discount) {
                const pct = parseFloat(discount.percentage) || 0;
                newAmount -= (originalAmount * pct) / 100;
            }
        }
        
        if (manualAmt > 0) {
            newAmount -= manualAmt;
        }

        setPaymentAmount(Math.max(0, newAmount));
    };

    const handleDiscountSelect = (val) => {
        setSelectedDiscountId(val);
        recalculatePaymentAmount(val, manualDiscountAmount);
    };

    const handleManualDiscountChange = (val) => {
        const amt = val || 0;
        setManualDiscountAmount(amt);
        recalculatePaymentAmount(selectedDiscountId, amt);
    };

    const handleCollectSelected = () => {
        if (selectedRows.length === 0) return;
        setIsMultiPayment(true);
        setSelectedRow(selectedRows[0]);
        
        const totalOutstanding = selectedRows.reduce((sum, r) => sum + r.outstanding, 0);
        setPaymentAmount(totalOutstanding);
        
        setPaymentMode('CASH');
        setPaymentDate(dayjs());
        setManualReceiptRef('');
        setManualDiscountAmount(0);
        setSelectedDiscountId(null);
        setPaymentModalVisible(true);
    };

    const handleCancelModal = () => {
        setPaymentModalVisible(false);
        setIsMultiPayment(false);
    };

    // Post to backend
    const handleConfirmPayment = async () => {
        setProcessingPayment(true);
        try {
            const finalReceiptDate = paymentDate ? paymentDate.toISOString() : new Date().toISOString();
            
            if (isMultiPayment) {
                // Multi-payment logic: process selected rows sequentially by distributing paymentAmount
                const discountToApply = selectedDiscountId ? discountCategories.find(d => d.id === selectedDiscountId) : null;
                const finalDiscountPct = discountToApply ? (parseFloat(discountToApply.percentage) || 0) : 0;
                
                let remainingAmount = paymentAmount;
                let remainingManualDiscount = manualDiscountAmount || 0;
                let successCount = 0;
                const sortedRows = [...selectedRows].sort((a,b) => (a.academic_term||'').localeCompare(b.academic_term||''));

                for (const row of sortedRows) {
                    if (remainingAmount <= 0) break; // Fully distributed
                    
                    try {
                        let finalDiscountAmount = row.discount_amount || 0;
                        let finalDiscountName = row.discount_name || '';
                        let rowDiscountPct = row.discount_percentage || 0;
                        let finalOriginalFee = row.original_fee || row.total_fee || row.outstanding || 0;

                        if (discountToApply) {
                            rowDiscountPct = finalDiscountPct;
                            finalDiscountAmount = (finalOriginalFee * rowDiscountPct) / 100;
                            finalDiscountName = discountToApply.name;
                        }
                        
                        if (manualDiscountAmount > 0 && remainingManualDiscount > 0) {
                            const availableForThisRow = Math.min(finalOriginalFee - finalDiscountAmount, remainingManualDiscount);
                            if (availableForThisRow > 0) {
                                finalDiscountAmount += availableForThisRow;
                                finalDiscountName = finalDiscountName ? `${finalDiscountName} & Manual Discount` : 'Manual Discount';
                                remainingManualDiscount -= availableForThisRow;
                            }
                        }
                        
                        // Calculate exact outstanding for this term after any new discount
                        const alreadyPaid = finalOriginalFee - (row.discount_amount || 0) - row.outstanding;
                        const termAmountToPay = Math.max(0, finalOriginalFee - finalDiscountAmount - alreadyPaid);

                        const allocatedAmount = Math.min(termAmountToPay, remainingAmount);
                        if (allocatedAmount <= 0) continue;

                        const res = await axios.post('/local-api/payment/record-offline-payment', {
                            student_id: row.student_id,
                            student_name: row.student_name,
                            fee_structure: row.fee_structure,
                            fees_category: row.academic_term,
                            amount: allocatedAmount, // Pay the allocated chunk
                            payment_mode: paymentMode,
                            receipt_date: finalReceiptDate,
                            manual_receipt_no: manualReceiptRef,
                            fee_id: row.fee_id,
                            systemCode: 'schooler_system',
                            original_fee: finalOriginalFee,
                            discount_amount: finalDiscountAmount,
                            discount_name: finalDiscountName,
                            discount_percentage: rowDiscountPct
                        }, { withCredentials: true });

                        if (res.data.success) {
                            remainingAmount -= allocatedAmount;
                            successCount++;
                            notification.success({ 
                                message: `Payment Recorded: ${row.academic_term}`, 
                                description: `Receipt ${res.data.receipt_no} for ₹${allocatedAmount.toLocaleString()} generated.` 
                            });

                            // Add to receipt download queue
                            const mockRecord = {
                                student_id: row.student_id,
                                student_name: row.student_name,
                                program: row.program,
                                academic_term: row.academic_term,
                                receipt_no: res.data.receipt_no,
                                payment_id: res.data.payment_id,
                                paid_amount: allocatedAmount,
                                outstanding: Math.max(0, termAmountToPay - allocatedAmount),
                                payment_mode: paymentMode,
                                paid_date: finalReceiptDate,
                                original_fee: finalOriginalFee,
                                discount_amount: finalDiscountAmount,
                                discount_name: finalDiscountName,
                                discount_percentage: rowDiscountPct,
                                receipts: row.receipts
                            };
                            handleDownloadReceipt(mockRecord);
                        }
                    } catch (err) {
                        console.error(`Error paying for term ${row.academic_term}:`, err);
                        notification.error({
                            message: `Payment Error (${row.academic_term})`,
                            description: err.response?.data?.message || err.message
                        });
                    }
                }

                if (successCount > 0) {
                    setPaymentModalVisible(false);
                    // Clear row selection
                    setSelectedRowKeys([]);
                    setSelectedRows([]);
                    setIsMultiPayment(false);
                    // Refresh data
                    await fetchData();
                }
            } else {
                // Single payment logic
                if (paymentAmount <= 0) {
                    notification.error({ message: 'Validation Error', description: 'Payment amount must be greater than 0.' });
                    setProcessingPayment(false);
                    return;
                }
                if (paymentAmount > selectedRow.outstanding) {
                    notification.error({ message: 'Validation Error', description: `Payment amount cannot exceed the outstanding balance of ₹${selectedRow.outstanding.toLocaleString()}.` });
                    setProcessingPayment(false);
                    return;
                }

                const discountToApply = selectedDiscountId ? discountCategories.find(d => d.id === selectedDiscountId) : null;
                let finalDiscountAmount = selectedRow.discount_amount || 0;
                let finalDiscountName = selectedRow.discount_name || '';
                let finalDiscountPct = selectedRow.discount_percentage || 0;
                let finalOriginalFee = selectedRow.original_fee || selectedRow.total_fee || 0;

                if (discountToApply) {
                    finalDiscountPct = parseFloat(discountToApply.percentage) || 0;
                    finalDiscountAmount = (finalOriginalFee * finalDiscountPct) / 100;
                    finalDiscountName = discountToApply.name;
                }

                if (manualDiscountAmount > 0) {
                    finalDiscountAmount += manualDiscountAmount;
                    finalDiscountName = finalDiscountName ? `${finalDiscountName} & Manual Discount` : 'Manual Discount';
                }

                const alreadyPaid = finalOriginalFee - (selectedRow.discount_amount || 0) - selectedRow.outstanding;
                const termAmountToPay = Math.max(0, finalOriginalFee - finalDiscountAmount - alreadyPaid);

                const res = await axios.post('/local-api/payment/record-offline-payment', {
                    student_id: selectedRow.student_id,
                    student_name: selectedRow.student_name,
                    fee_structure: selectedRow.fee_structure,
                    fees_category: selectedRow.academic_term,
                    amount: paymentAmount,
                    payment_mode: paymentMode,
                    receipt_date: finalReceiptDate,
                    manual_receipt_no: manualReceiptRef,
                    fee_id: selectedRow.fee_id,
                    systemCode: 'schooler_system',
                    original_fee: finalOriginalFee,
                    discount_amount: finalDiscountAmount,
                    discount_name: finalDiscountName,
                    discount_percentage: finalDiscountPct
                }, { withCredentials: true });

                if (res.data.success) {
                    notification.success({ 
                        message: 'Payment Recorded!', 
                        description: `Sequential Receipt ${res.data.receipt_no} generated and sync: ${res.data.erp_sync}.` 
                    });
                    
                    setPaymentModalVisible(false);

                    // Add to receipt download queue
                    const mockRecord = {
                        student_id: selectedRow.student_id,
                        student_name: selectedRow.student_name,
                        program: selectedRow.program,
                        academic_term: selectedRow.academic_term,
                        receipt_no: res.data.receipt_no,
                        payment_id: res.data.payment_id,
                        paid_amount: paymentAmount,
                        outstanding: Math.max(0, termAmountToPay - paymentAmount),
                        payment_mode: paymentMode,
                        paid_date: finalReceiptDate,
                        original_fee: finalOriginalFee,
                        discount_amount: finalDiscountAmount,
                        discount_name: finalDiscountName,
                        discount_percentage: finalDiscountPct,
                        receipts: selectedRow.receipts
                    };
                    handleDownloadReceipt(mockRecord);

                    // Refresh data
                    await fetchData();
                }
            }
        } catch (err) {
            console.error('Offline payment err:', err);
            notification.error({ 
                message: 'Payment Record Error', 
                description: err.response?.data?.message || err.message 
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys, rows) => {
            const validRows = (rows || []).filter(r => r && r.status !== 'PAID' && r.total_fee > 0);
            const validKeys = validRows.map(r => r.key || `${r.student_id}_${r.academic_term}`);
            setSelectedRowKeys(validKeys);
            setSelectedRows(validRows);
        },
        getCheckboxProps: (record) => {
            const isPaidOrNoFee = record.status === 'PAID' || record.total_fee <= 0;
            const hasSelectedOtherStudent = selectedRows.length > 0 && selectedRows[0].student_id !== record.student_id;
            return {
                disabled: isPaidOrNoFee || hasSelectedOtherStudent,
                name: record.student_name,
            };
        },
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
            render: (v, r) => (
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {r.discount_amount > 0 && (
                        <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 11, marginBottom: '-2px' }}>
                            ₹{r.original_fee?.toLocaleString()}
                        </div>
                    )}
                    <span style={{ fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                        ₹{v?.toLocaleString()}
                    </span>
                    {r.discount_amount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#7e22ce', backgroundColor: '#faf5ff', padding: '0 4px', borderRadius: 2, marginTop: 2 }}>
                            -₹{r.discount_amount.toLocaleString()} Off {r.discount_name ? `(${r.discount_name})` : ''}
                        </span>
                    )}
                </div>
            ),
            sorter: (a, b) => a.total_fee - b.total_fee,
        },
        {
            title: 'PAID', dataIndex: 'paid_amount', key: 'paid_amount', align: 'right',
            render: (v, r) => <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 13 }}>₹{(r.status === 'PAID' ? (r.original_fee || r.total_fee || v) : v).toLocaleString()}</span>,
            sorter: (a, b) => a.paid_amount - b.paid_amount,
        },
        {
            title: 'DUE', dataIndex: 'outstanding', key: 'outstanding', align: 'right',
            render: (v, r) => {
                const actualDue = r.status === 'PAID' ? 0 : r.outstanding;
                return <span style={{ fontWeight: 700, color: actualDue > 0 ? '#dc2626' : '#94a3b8', fontSize: 13 }}>₹{actualDue.toLocaleString()}</span>;
            },
            sorter: (a, b) => {
                const dueA = a.status === 'PAID' ? 0 : a.outstanding;
                const dueB = b.status === 'PAID' ? 0 : b.outstanding;
                return dueA - dueB;
            },
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
                    PARTIAL: { color: 'processing', icon: <ClockCircleOutlined /> },
                    UNPAID: { color: 'error', icon: <ExclamationCircleOutlined /> },
                };
                const c = cfg[status] || cfg.UNPAID;
                return <Tag icon={c.icon} color={c.color} style={{ fontWeight: 700, borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{status}</Tag>;
            },
        },
        {
            title: 'ACTION', key: 'action', align: 'center', width: 140,
            render: (_, r) => {
                const hasReceipts = r.receipts && r.receipts.length > 0;
                
                let receiptAction = null;
                if (hasReceipts) {
                    if (r.receipts.length === 1) {
                        receiptAction = (
                            <Button 
                                type="text" 
                                icon={<DownloadOutlined style={{ color: '#3b82f6', fontSize: 16 }} />} 
                                onClick={() => handleDownloadReceipt({...r, ...r.receipts[0], paid_amount: r.receipts[0].amount, receipt_no: r.receipts[0].receipt_no || r.receipts[0].payment_id, paid_date: r.receipts[0].created_at || r.receipts[0].verified_at})} 
                                title="Download Receipt"
                            />
                        );
                    } else {
                        receiptAction = (
                            <Dropdown
                                menu={{
                                    items: r.receipts.map((rec, idx) => ({
                                        key: String(idx),
                                        label: `₹${parseFloat(rec.amount).toLocaleString()} (${dayjs(rec.created_at || rec.verified_at).format('DD MMM')})`,
                                        onClick: () => handleDownloadReceipt({...r, ...rec, paid_amount: rec.amount, receipt_no: rec.receipt_no || rec.payment_id, paid_date: rec.created_at || rec.verified_at})
                                    }))
                                }}
                                trigger={['click']}
                            >
                                <Button type="text" icon={<DownloadOutlined style={{ color: '#3b82f6', fontSize: 16 }} />} title="Download Receipts" />
                            </Dropdown>
                        );
                    }
                } else if (r.status === 'PAID' && r.paid_amount > 0) {
                    receiptAction = (
                        <Button 
                            type="text" 
                            icon={<DownloadOutlined style={{ color: '#3b82f6', fontSize: 16 }} />} 
                            onClick={() => handleDownloadReceipt(r)} 
                            title="Download Receipt"
                        />
                    );
                }

                const collectAction = r.status !== 'PAID' && r.total_fee > 0 ? (
                    <Button 
                        type="primary" 
                        size="small" 
                        onClick={() => handleCollectFee(r)}
                        style={{ 
                            background: 'linear-gradient(135deg, #10b981, #059669)', 
                            border: 'none', 
                            fontWeight: 700, 
                            borderRadius: 6,
                            marginLeft: receiptAction ? 8 : 0
                        }}
                    >
                        Collect
                    </Button>
                ) : null;

                if (!receiptAction && !collectAction) return <span style={{ color: '#cbd5e1' }}>—</span>;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {receiptAction}
                        {collectAction}
                    </div>
                );
            }
        }
    ];

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
        allData.forEach(r => { 
            if (filters.board && r.board !== filters.board) return;
            if (r.program && r.program !== '-') progs.add(r.program); 
        });
        return Array.from(progs).sort();
    }, [allData, filters.board]);

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
            {/* Hidden Receipt for PDF Generation */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '700px' }}>
                <FeeReceiptTemplate 
                    ref={receiptRef} 
                    receiptData={selectedReceipt} 
                />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Offline Fee Collection</h1>
                    <p style={{ color: '#94a3b8', margin: '6px 0 0', fontSize: 14 }}>Collect student term fees offline (Cash / Cheque) with sequential receipt printing</p>
                </div>
                <Space size={12}>
                    <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading} shape="round" type="primary" style={{ fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                        Refresh Data
                    </Button>
                </Space>
            </div>

            {/* Filters Panel */}
            <Card
                style={{ borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: showFilters ? 24 : 16 } }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FilterOutlined style={{ color: '#10b981' }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#334155' }}>Filters</span>
                        {activeFilterCount > 0 && <Tag color="green" style={{ borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{activeFilterCount} active</Tag>}
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
                        <Col xs={24} sm={12} lg={4}>
                            <label style={labelStyle}>Board</label>
                            <Select style={{ width: '100%' }} placeholder="All Boards" allowClear value={filters.board || undefined} onChange={v => setFilters(p => ({ ...p, board: v || '', program: '', student_search: '' }))}>
                                {dataBoards.map(b => <Option key={b} value={b}>{b}</Option>)}
                            </Select>
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                            <label style={labelStyle}>Program (Class)</label>
                            <Select style={{ width: '100%' }} placeholder="All Programs" allowClear value={filters.program || undefined} onChange={v => setFilters(p => ({ ...p, program: v || '', student_search: '' }))}>
                                {(dropdowns.programs.length > 0 ? dropdowns.programs.filter(p => !filters.board || p.custom_board === filters.board) : dataPrograms).map(p => {
                                    const val = typeof p === 'string' ? p : p.value;
                                    const label = typeof p === 'string' ? p : p.label;
                                    return <Option key={val} value={val}>{label}</Option>;
                                })}
                            </Select>
                        </Col>
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

            {/* Table Panel */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#334155', fontSize: 14 }}>
                        Showing {filteredData.length} of {allData.length} records
                    </span>
                    {selectedRows.length > 0 && (
                        <Button 
                            type="primary" 
                            onClick={handleCollectSelected}
                            style={{ 
                                background: 'linear-gradient(135deg, #10b981, #059669)', 
                                border: 'none', 
                                fontWeight: 700, 
                                borderRadius: 8 
                            }}
                        >
                            Collect Selected ({selectedRows.length} Term{selectedRows.length > 1 ? 's' : ''} - ₹{selectedRows.reduce((sum, r) => sum + r.outstanding, 0).toLocaleString()})
                        </Button>
                    )}
                </div>
                <Table 
                    rowSelection={rowSelection}
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    rowKey={(r) => r.key || `${r.student_id}_${r.academic_term}`}
                    pagination={{ pageSize: 25, showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
                    className="fees-report-table"
                    size="middle"
                />
            </div>

            {/* Payment Checkout Modal */}
            <Modal
                title={null}
                visible={paymentModalVisible}
                onCancel={handleCancelModal}
                footer={null}
                width={700}
                centered
                styles={{ body: { padding: 0, borderRadius: '24px', overflow: 'hidden' } }}
            >
                <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CreditCardOutlined style={{ fontSize: '22px' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Record Cash Payment</h2>
                </div>

                <div style={{ padding: '24px' }}>
                    {selectedRow && (
                        <>
                            {/* Student Profile Info banner */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Avatar size={48} icon={<UserOutlined />} style={{ background: '#10b981', color: 'white' }} />
                                    <div>
                                        <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1f2937', margin: 0 }}>{selectedRow.student_name}</h4>
                                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>{selectedRow.program}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>Student ID</span>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>{selectedRow.student_id}</span>
                                </div>
                            </div>

                            {/* Detail Fields grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={modalLabelStyle}>Fee Structure</label>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>
                                        {isMultiPayment ? selectedRows[0]?.fee_structure : selectedRow.fee_structure || 'Standard'}
                                    </span>
                                </div>
                                <div>
                                    <label style={modalLabelStyle}>Term / Installment</label>
                                    {isMultiPayment ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {selectedRows.map(r => (
                                                <Tag key={r.academic_term} color="green" style={{ margin: 0, fontWeight: 'bold', border: 'none', background: '#dcfce7', color: '#15803d' }}>
                                                    {r.academic_term} (₹{r.outstanding})
                                                </Tag>
                                            ))}
                                        </div>
                                    ) : (
                                        <Tag color="green" style={{ margin: 0, fontWeight: 'bold', border: 'none', background: '#dcfce7', color: '#15803d' }}>{selectedRow.academic_term}</Tag>
                                    )}
                                </div>
                                <div>
                                    <label style={modalLabelStyle}>ERP Fees ID</label>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>
                                        {isMultiPayment 
                                            ? selectedRows.map(r => r.fee_id !== '-' ? r.fee_id : 'Pre-billed').join(', ') 
                                            : (selectedRow.fee_id !== '-' ? selectedRow.fee_id : 'Pre-billed Structure')}
                                    </span>
                                </div>
                                <div>
                                    <label style={modalLabelStyle}>Amount to Pay</label>
                                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626' }}>
                                        ₹{isMultiPayment 
                                            ? selectedRows.reduce((sum, r) => sum + r.outstanding, 0).toLocaleString() 
                                            : selectedRow.outstanding.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {!isMultiPayment && selectedRow.discount_amount > 0 && (
                                <div style={{ background: '#f3e8ff', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#7e22ce', marginBottom: 4 }}>DISCOUNT APPLIED</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7' }}>{selectedRow.discount_name} (-{selectedRow.discount_percentage}%)</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>Original: ₹{selectedRow.original_fee.toLocaleString()}</div>
                                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#7e22ce' }}>-₹{selectedRow.discount_amount.toLocaleString()} Off</div>
                                    </div>
                                </div>
                            )}

                            {/* Form Input fields */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Payment Amount (₹) *</label>
                                        <InputNumber 
                                            style={{ width: '100%' }} 
                                            value={paymentAmount} 
                                            onChange={v => setPaymentAmount(v || 0)} 
                                            min={1} 
                                            max={isMultiPayment ? selectedRows.reduce((sum, r) => sum + r.outstanding, 0) : selectedRow.outstanding}
                                            precision={2}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Payment Mode *</label>
                                        <Select style={{ width: '100%' }} value={paymentMode} onChange={setPaymentMode}>
                                            <Option value="CASH">Cash</Option>
                                            <Option value="CHEQUE">Cheque</Option>
                                            <Option value="BANK_TRANSFER">Bank Transfer</Option>
                                            <Option value="ONLINE">Online</Option>
                                        </Select>
                                    </Col>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Payment Date *</label>
                                        <DatePicker 
                                            style={{ width: '100%' }} 
                                            value={paymentDate} 
                                            onChange={v => setPaymentDate(v)} 
                                            format="DD-MM-YYYY"
                                            allowClear={false}
                                        />
                                    </Col>
                                </Row>
                                <Row style={{ marginTop: '16px' }} gutter={16}>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Manual Receipt Ref (Optional)</label>
                                        <Input 
                                            placeholder="Enter cash memo..."
                                            value={manualReceiptRef}
                                            onChange={e => setManualReceiptRef(e.target.value)}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Apply Discount (Optional)</label>
                                        <Select
                                            style={{ width: '100%' }}
                                            placeholder="Select Category"
                                            allowClear
                                            value={selectedDiscountId}
                                            onChange={handleDiscountSelect}
                                        >
                                            {discountCategories.map(d => (
                                                <Option key={d.id} value={d.id}>{d.name} ({d.percentage}%)</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={8}>
                                        <label style={modalInputLabelStyle}>Manual Discount (₹)</label>
                                        <InputNumber 
                                            style={{ width: '100%' }} 
                                            value={manualDiscountAmount} 
                                            onChange={handleManualDiscountChange} 
                                            min={0}
                                            precision={2}
                                            placeholder="Enter flat amount..."
                                        />
                                    </Col>
                                </Row>
                            </div>

                            {/* Checkout Footer buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                <Button onClick={handleCancelModal} size="large" style={{ borderRadius: '8px', fontWeight: 600 }}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    loading={processingPayment} 
                                    onClick={handleConfirmPayment}
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', fontWeight: 700, paddingLeft: '28px', paddingRight: '28px' }}
                                >
                                    Confirm Collection
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

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

// Antd Avatar fallback styling wrapper since we didn't import Avatar directly
const Avatar = ({ size, icon, style, ...props }) => (
    <div style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: '20px',
        ...style 
    }} {...props}>
        {icon}
    </div>
);

const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 };
const modalLabelStyle = { display: 'block', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 };
const modalInputLabelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 6 };

export default StudentFeeCollection;
