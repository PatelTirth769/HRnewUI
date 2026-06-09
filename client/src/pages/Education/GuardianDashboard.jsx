import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton, Empty, Button, Tabs, notification, Modal, Descriptions, Checkbox, Typography, Divider, Calendar, Badge } from 'antd';
import { 
    UserOutlined, 
    CalendarOutlined, 
    DollarOutlined, 
    BookOutlined, 
    TeamOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    RightOutlined,
    LockOutlined,
    SmileOutlined,
    FileTextOutlined,
    WalletOutlined,
    SyncOutlined,
    LoadingOutlined,
    InfoCircleOutlined,
    CreditCardOutlined,
    DownloadOutlined,
    TableOutlined,
    LinkOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import FeeReceiptTemplate from './FeeReceiptTemplate';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { generateAdmissionReceipt } from '../Enquiry/AdmissionFeeReceipt';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const GuardianDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [guardianData, setGuardianData] = useState(null);
    const [wards, setWards] = useState([]);
    const [activeWard, setActiveWard] = useState(null);
    const [wardProfile, setWardProfile] = useState(null);
    const [selectedDayFilter, setSelectedDayFilter] = useState('');
    const [wardDetails, setWardDetails] = useState({
        attendance: 0,
        fees: 0,
        assessments: 0,
        programs: 0,
        feeRecords: [],
        attendanceList: [],
        assessmentList: [],
        assessmentList: [],
        studentGroups: [],
        classTeacher: '',
        homework: [],
        classwork: [],
        fullSchedule: []
    });

    // Payment Modal State
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [paidTerms, setPaidTerms] = useState({}); // { "Term Fee - Q1": { payment_id, paid_at, amount, ... } }
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Receipt Download State
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const receiptRef = useRef(null);

    const userEmail = localStorage.getItem('user');

    useEffect(() => {
        fetchGuardianData();
    }, []);

    // Fetch paid terms from Firebase when ward changes
    const fetchPaidTerms = async (studentId, profile) => {
        try {
            const [historyRes, admHistoryRes] = await Promise.allSettled([
                axios.get(`/local-api/payment/history/${encodeURIComponent(studentId)}`),
                axios.get('/local-api/admission-payment/history-all')
            ]);
            
            const paidMap = {};
            const verifiedHistory = [];

            if (historyRes.status === 'fulfilled' && historyRes.value.data?.success && historyRes.value.data?.data) {
                historyRes.value.data.data.forEach(payment => {
                    if (payment.status === 'verified' && payment.fees_category) {
                        verifiedHistory.push(payment);
                        paidMap[payment.fees_category] = {
                            payment_id: payment.payment_id,
                            order_id: payment.order_id,
                            amount: payment.amount,
                            paid_at: payment.verified_at || payment.created_at,
                            status: 'paid'
                        };
                    }
                });
            }

            if (admHistoryRes.status === 'fulfilled' && admHistoryRes.value.data?.success && admHistoryRes.value.data?.data) {
                const cleanStudentName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim().toLowerCase();
                const cleanEmail = (profile?.student_email_id || userEmail).trim().toLowerCase();

                admHistoryRes.value.data.data.forEach(admPay => {
                    if (admPay.status === 'verified') {
                        const payStudentName = (admPay.student_name || '').trim().toLowerCase();
                        const payParentEmail = (admPay.parent_email || '').trim().toLowerCase();
                        
                        if (
                            (payParentEmail && payParentEmail === cleanEmail) ||
                            (payStudentName && cleanStudentName && payStudentName.includes(cleanStudentName)) ||
                            (admPay.admission_no && admPay.admission_no === studentId)
                        ) {
                            const categoryLabel = admPay.fee_name || admPay.fee_type || 'Admission Fee';
                            const mappedRecord = {
                                ...admPay,
                                fees_category: categoryLabel,
                                payment_id: admPay.receipt_no || admPay.payment_id || admPay.order_id,
                                amount: admPay.amount,
                                verified_at: admPay.verified_at || admPay.receipt_date || admPay.created_at
                            };
                            if (!verifiedHistory.some(h => h.payment_id === mappedRecord.payment_id)) {
                                verifiedHistory.push(mappedRecord);
                            }
                        }
                    }
                });
            }

            setPaidTerms(paidMap);
            setPaymentHistory(verifiedHistory);
            console.log('[Guardian] Complete Paid terms loaded:', Object.keys(paidMap));
        } catch (err) {
            console.warn('[Guardian] Could not fetch payment history:', err.message);
        }
    };

    const fetchGuardianData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Guardian Profile
            const guardRes = await API.get(`/api/resource/Guardian?filters=[["email_address","=","${userEmail}"]]&fields=["name","guardian_name","mobile_number"]`);
            
            if (guardRes.data.data && guardRes.data.data.length > 0) {
                const guardian = guardRes.data.data[0];
                // Get FULL guardian doc for child table of students
                const fullGuard = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardian.name)}`);
                setGuardianData(fullGuard.data.data);

                const students = fullGuard.data.data.students || [];
                setWards(students);

                if (students.length > 0) {
                    const savedWard = localStorage.getItem('guardian_active_ward');
                    if (savedWard && students.some(s => s.student === savedWard)) {
                        fetchWardDetails(savedWard);
                    } else {
                        fetchWardDetails(students[0].student);
                    }
                }
            }
        } catch (err) {
            console.error('Guardian Dashboard Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWardDetails = async (studentId) => {
        setActiveWard(studentId);
        try {
            // Fetch Full Student Profile
            const profileRes = await API.get(`/api/resource/Student/${encodeURIComponent(studentId)}`);
            const wardProf = profileRes.data.data;
            setWardProfile(wardProf);

            // Fetch paid terms from Firebase in parallel with ERP data
            fetchPaidTerms(studentId, wardProf);

            // Parallel Data Fetch with Individual Error Handling & 417 recovery
            const [attRes, feeRes, assessRes, enrRes] = await Promise.allSettled([
                API.get('/api/resource/Student Attendance', { params: { filters: JSON.stringify([["student", "=", studentId]]), limit_page_length: 1000 } }),
                API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), fields: JSON.stringify(["name", "due_date", "outstanding_amount", "total_amount"]) } })
                    .catch(err => {
                        if (err.response?.status === 417) return API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), fields: JSON.stringify(["name", "outstanding_amount"]) } });
                        throw err;
                    }),
                API.get('/api/resource/Assessment Result', { params: { filters: JSON.stringify([["student", "=", studentId]]) } }),
                API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program", "fee_structure"]) } })
                    .catch(err => {
                        if (err.response?.status === 417) return API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program"]) } });
                        throw err;
                    })
            ]);

            const attendanceList = attRes.status === 'fulfilled' ? (attRes.value.data?.data || []) : [];
            const feeList = feeRes.status === 'fulfilled' ? (feeRes.value.data?.data || []) : [];
            const assessList = assessRes.status === 'fulfilled' ? (assessRes.value.data?.data || []) : [];
            const enrollmentData = enrRes.status === 'fulfilled' ? (enrRes.value.data?.data || []) : [];

            const presentDays = attendanceList.filter(a => a.status === 'Present').length;
            const attendancePct = attendanceList.length > 0 ? Math.round((presentDays / attendanceList.length) * 100) : 0;

            // 4. Resolve Fee Structure (3-Stage Logic)
            let linkedFeeStructure = (enrollmentData.length > 0 && enrollmentData[0].fee_structure) 
                ? enrollmentData[0].fee_structure 
                : (wardProf.fee_structure || null);

            const programToSearch = (enrollmentData.length > 0 && enrollmentData[0].program) 
                ? enrollmentData[0].program 
                : (wardProf.program || null);

            if (!linkedFeeStructure && programToSearch) {
                try {
                    const fsRes = await API.get('/api/resource/Fee Structure', {
                        params: { filters: JSON.stringify([["program", "=", programToSearch]]), fields: JSON.stringify(["name"]) }
                    });
                    if (fsRes.data?.data?.length > 0) {
                        linkedFeeStructure = fsRes.data.data[0].name;
                    } else {
                        try {
                            const fsExact = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(programToSearch)}`);
                            if (fsExact.data?.data) linkedFeeStructure = fsExact.data.data.name;
                        } catch (e) {}
                    }
                } catch (e) {}
            }

            let feeStructureDetails = null;
            if (linkedFeeStructure) {
                try {
                    const fsFull = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(linkedFeeStructure)}`);
                    feeStructureDetails = fsFull.data?.data;
                } catch (e) { console.error('[Guardian] FS details fetch failed:', e); }
            }

            // Resolve Student Group & Class Teacher
            let studentGroups = [];
            if (enrollmentData.length > 0) {
                try {
                    const enrollmentName = enrollmentData[0].name;
                    const fullEnrRes = await API.get(`/api/resource/Program Enrollment/${encodeURIComponent(enrollmentName)}`);
                    const enrDoc = fullEnrRes.data?.data || {};
                    const fallbackGroup = enrDoc.student_group || enrDoc.student_batch_name || enrDoc.student_batch;
                    if (fallbackGroup) {
                        studentGroups.push(fallbackGroup);
                    } else if (wardProf?.student_group || wardProf?.student_batch) {
                        studentGroups.push(wardProf.student_group || wardProf.student_batch);
                    }
                } catch (e) {
                    console.error('Error fetching program enrollment details:', e.message);
                }
            } else {
                if (wardProf?.student_group || wardProf?.student_batch) {
                    studentGroups.push(wardProf.student_group || wardProf.student_batch);
                }
            }

            try {
                const sgRes = await API.get('/api/resource/Student Group', {
                    params: {
                        limit_page_length: 100,
                        filters: JSON.stringify([["Student Group Student", "student", "=", studentId]]),
                        fields: '["name"]'
                    }
                });
                if (sgRes.data?.data && sgRes.data.data.length > 0) {
                    const groups = sgRes.data.data.map(g => g.name);
                    studentGroups.push(...groups);
                }
            } catch (e) {
                console.error('Error direct Student Group query:', e.message);
            }

            studentGroups = [...new Set(studentGroups)];

            let classTeacherName = '';
            if (studentGroups.length > 0) {
                try {
                    const sgDocRes = await API.get(`/api/resource/Student Group/${encodeURIComponent(studentGroups[0])}`);
                    const sgDoc = sgDocRes.data?.data;
                    if (sgDoc && sgDoc.custom_class_teacher) {
                        classTeacherName = sgDoc.custom_class_teacher;
                        try {
                            const instRes = await API.get(`/api/resource/Instructor/${encodeURIComponent(sgDoc.custom_class_teacher)}`);
                            if (instRes.data?.data?.instructor_name) {
                                classTeacherName = instRes.data.data.instructor_name;
                            }
                        } catch (e) {
                            console.warn('[GuardianDashboard] Failed to fetch Instructor details:', e.message);
                        }
                    }
                } catch (e) {
                    console.warn('[GuardianDashboard] Failed to fetch Student Group details:', e.message);
                }
            }

            let fullSchedule = [];
            if (studentGroups.length > 0) {
                try {
                    const fullSchRes = await API.get('/api/resource/Course Schedule', {
                        params: {
                            filters: JSON.stringify([["student_group", "in", studentGroups]]),
                            fields: JSON.stringify(["name", "course", "from_time", "to_time", "room", "instructor", "schedule_date", "title", "custom_day"]),
                            order_by: 'schedule_date asc, from_time asc',
                            limit_page_length: 100
                        }
                    });
                    fullSchedule = fullSchRes.data?.data || [];
                } catch (e) {
                    console.warn('[GuardianDashboard] Failed to fetch Full Schedule:', e.message);
                }
            }

            // Fetch Homework and Classwork from Firestore
            let homework = [];
            let classwork = [];
            try {
                const HOMEWORK_PATH = 'schooler_system/homework_management/assignments';
                const hQuery = query(collection(db, HOMEWORK_PATH), orderBy('dueDate', 'asc'));
                const hSnapshot = await getDocs(hQuery);
                const allHomework = hSnapshot.docs.map(docSnapshot => ({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                }));

                const CLASSWORK_PATH = 'schooler_system/classwork_management/assignments';
                const cQuery = query(collection(db, CLASSWORK_PATH), orderBy('classworkDate', 'desc'));
                const cSnapshot = await getDocs(cQuery);
                const allClasswork = cSnapshot.docs.map(docSnapshot => ({
                    id: docSnapshot.id,
                    ...docSnapshot.data()
                }));

                const studentProgram = wardProf?.program;
                
                homework = allHomework.filter(item => {
                    const matchesProgram = !item.program || item.program === studentProgram;
                    const matchesGroup = !item.studentGroup || studentGroups.includes(item.studentGroup);
                    return matchesProgram && matchesGroup;
                });

                classwork = allClasswork.filter(item => {
                    const matchesProgram = !item.program || item.program === studentProgram;
                    const matchesGroup = !item.studentGroup || studentGroups.includes(item.studentGroup);
                    return matchesProgram && matchesGroup;
                });
            } catch (err) {
                console.error('Error fetching work for guardian dashboard:', err);
            }

            // Fetch Discounts and Apply
            let studentDiscountsMap = {};
            let feeDiscountsMap = {};
            try {
                if (studentId) {
                    const sdSnaps = await getDocs(collection(db, 'schooler', 'data', 'student_discounts'));
                    sdSnaps.forEach(doc => {
                        const data = doc.data();
                        if (data.student_id === studentId) {
                            if (!studentDiscountsMap[data.student_id]) studentDiscountsMap[data.student_id] = [];
                            studentDiscountsMap[data.student_id].push(data);
                        }
                    });

                    const fdSnaps = await getDocs(collection(db, 'schooler', 'data', 'fees_discounts'));
                    fdSnaps.forEach(doc => { feeDiscountsMap[doc.id] = doc.data(); });
                }
            } catch (err) {
                console.warn('Error fetching discounts:', err.message);
            }

            // Apply Discounts to feeRecords
            feeList.forEach(fee => {
                let originalTotal = parseFloat(fee.total_amount) || parseFloat(fee.outstanding_amount) || 0;
                let discountAmount = 0;
                if (feeStructureDetails) {
                    const termComp = feeStructureDetails.components?.find(c => c.fees_category === fee.academic_term || c.name === fee.academic_term);
                    if (termComp) {
                        const originalTermAmount = parseFloat(termComp.amount) || 0;
                        if (fee.total_amount < originalTermAmount) {
                            discountAmount = originalTermAmount - fee.total_amount;
                            originalTotal = originalTermAmount;
                        } else if (studentDiscountsMap[studentId]) {
                            const activeDiscount = studentDiscountsMap[studentId][0];
                            if (activeDiscount && feeDiscountsMap[activeDiscount.discount_id]) {
                                if (!activeDiscount.terms || activeDiscount.terms.length === 0 || activeDiscount.terms.includes(fee.academic_term)) {
                                    const fd = feeDiscountsMap[activeDiscount.discount_id];
                                    if (fd.percentage > 0) {
                                        discountAmount = (originalTermAmount * fd.percentage) / 100;
                                        fee.total_amount = originalTermAmount - discountAmount;
                                        if (fee.outstanding_amount > 0) fee.outstanding_amount = fee.total_amount;
                                        originalTotal = originalTermAmount;
                                        fee.discount_name = fd.name;
                                    }
                                }
                            }
                        }
                    }
                }
                fee.original_fee = originalTotal;
                fee.discount_amount = discountAmount;
            });

            // Apply Discounts to feeStructureDetails (Simulated fees)
            let globalDiscountName = '';
            if (feeStructureDetails && feeStructureDetails.components) {
                feeStructureDetails.components.forEach(comp => {
                    let originalTotal = parseFloat(comp.amount) || 0;
                    let discountAmount = 0;
                    if (studentDiscountsMap[studentId]) {
                        const activeDiscount = studentDiscountsMap[studentId][0];
                        if (activeDiscount && feeDiscountsMap[activeDiscount.discount_id]) {
                            const compTerm = comp.fees_category || comp.name;
                            if (!activeDiscount.terms || activeDiscount.terms.length === 0 || activeDiscount.terms.includes(compTerm)) {
                                const fd = feeDiscountsMap[activeDiscount.discount_id];
                                if (fd.percentage > 0) {
                                    discountAmount = (originalTotal * fd.percentage) / 100;
                                    comp.amount = originalTotal - discountAmount;
                                    comp.discount_name = fd.name;
                                    globalDiscountName = fd.name;
                                }
                            }
                        }
                    }
                    comp.original_fee = originalTotal;
                    comp.discount_amount = discountAmount;
                });
            }

            setWardDetails({
                attendance: attendancePct,
                attendanceList: attendanceList,
                fees: feeList.reduce((acc, f) => acc + (f.outstanding_amount || 0), 0),
                feeRecords: feeList,
                assessments: assessList.length,
                assessmentList: assessList,
                programs: enrollmentData.length,
                feeStructure: linkedFeeStructure,
                feeStructureDetails,
                studentGroups,
                classTeacher: classTeacherName,
                homework,
                classwork,
                fullSchedule
            });
        } catch (e) {
            console.error("Error fetching ward details", e);
        }
    };

    const handlePayNow = (feeItem) => {
        // Prevent paying already paid terms
        const category = feeItem.fees_category || feeItem.name;
        if (paidTerms[category]) {
            notification.info({ 
                message: 'Already Paid', 
                description: `${category} was already paid on ${new Date(paidTerms[category].paid_at).toLocaleDateString()}.` 
            });
            return;
        }
        setSelectedFee(feeItem);
        setTermsAccepted(false);
        setIsPaymentModalVisible(true);
    };

    const processPayment = async () => {
        if (!termsAccepted) {
            notification.warning({ message: 'Action Required', description: 'Please accept the Terms & Conditions to proceed.' });
            return;
        }

        setPaymentProcessing(true);

        try {
            const amount = selectedFee.amount || selectedFee.outstanding_amount || 0;
            const feesCategory = selectedFee.fees_category || selectedFee.name;
            const payload = {
                student_id: activeWard,
                student_name: wardProfile?.student_name || wardProfile?.name,
                guardian_email: userEmail,
                fee_structure: wardDetails.feeStructure,
                fees_category: feesCategory,
                amount: amount,
                systemCode: 'schooler'
            };

            notification.info({ message: 'Initiating Payment', description: 'Connecting to secure gateway...', key: 'pay_init', duration: 3 });

            // 1. Create order on local backend
            const res = await axios.post('/local-api/payment/create-order', payload);
            
            if (res.data.success) {
                notification.destroy('pay_init');
                
                const options = {
                    key: res.data.key_id,
                    amount: res.data.amount,
                    currency: "INR",
                    name: "Schooler Fee Payment",
                    description: `${feesCategory} - ${payload.student_name}`,
                    image: "/vite.svg",
                    order_id: res.data.order_id,
                    handler: async function (response) {
                        // 2. Verify payment on success
                        try {
                            notification.info({ 
                                message: '🔒 Verifying Transaction...', 
                                description: 'Please wait while we verify your payment with the bank.', 
                                key: 'verify_pay',
                                duration: 0 
                            });
                            
                            const verifyRes = await axios.post('/local-api/payment/verify-payment', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                student_id: payload.student_id,
                                student_name: payload.student_name,
                                guardian_email: payload.guardian_email,
                                amount: payload.amount,
                                fees_category: feesCategory,
                                fee_structure: payload.fee_structure,
                                systemCode: 'schooler',
                                original_fee: selectedFee.original_fee || 0,
                                discount_amount: selectedFee.discount_amount || 0,
                                discount_name: selectedFee.discount_name || '',
                                discount_percentage: selectedFee.discount_percentage || 0
                            });

                            if (verifyRes.data.success) {
                                // IMMEDIATELY update paid terms in state
                                setPaidTerms(prev => ({
                                    ...prev,
                                    [feesCategory]: {
                                        payment_id: response.razorpay_payment_id,
                                        order_id: response.razorpay_order_id,
                                        amount: payload.amount,
                                        paid_at: new Date().toISOString(),
                                        status: 'paid'
                                    }
                                }));

                                // Close modal first
                                setIsPaymentModalVisible(false);
                                setPaymentProcessing(false);

                                // Show prominent success notification
                                notification.success({ 
                                    message: '✅ Payment Successful!', 
                                    description: (
                                        <div>
                                            <p style={{ margin: '4px 0', fontWeight: 600 }}>₹{amount.toLocaleString()} paid for {feesCategory}</p>
                                            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                                                Payment ID: {response.razorpay_payment_id}
                                            </p>
                                            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
                                                Student: {payload.student_name}
                                            </p>
                                            <p style={{ margin: '4px 0', fontSize: '11px', color: '#52c41a', fontWeight: 700 }}>
                                                ✓ Verified & Recorded in System
                                            </p>
                                        </div>
                                    ),
                                    key: 'verify_pay',
                                    duration: 8,
                                    placement: 'topRight'
                                });

                                // Refresh ward data in background
                                fetchWardDetails(activeWard);
                            } else {
                                setPaymentProcessing(false);
                                notification.error({ 
                                    message: 'Verification Failed', 
                                    description: verifyRes.data.message || 'Payment was recorded but verification failed. Please contact school admin.', 
                                    key: 'verify_pay',
                                    duration: 10
                                });
                            }
                        } catch (err) {
                            console.error('Verification Error:', err);
                            setPaymentProcessing(false);
                            notification.warning({ 
                                message: '⚠️ Verification Pending', 
                                description: 'Payment succeeded but we couldn\'t verify it instantly. Please do NOT pay again. Your payment will be auto-verified within 10 minutes.', 
                                key: 'verify_pay',
                                duration: 15 
                            });
                        }
                    },
                    prefill: {
                        name: guardianData.guardian_name,
                        email: userEmail,
                        contact: guardianData.mobile_number || ""
                    },
                    notes: {
                        student_id: activeWard,
                        fee_structure: wardDetails.feeStructure,
                        fees_category: feesCategory
                    },
                    theme: { color: "#4F46E5" },
                    modal: {
                        ondismiss: function() {
                            setPaymentProcessing(false);
                            notification.info({ message: 'Payment Cancelled', description: 'The payment window was closed. No amount was charged.' });
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (resp) {
                    setPaymentProcessing(false);
                    notification.error({
                        message: 'Payment Failed',
                        description: resp.error?.description || 'The payment could not be processed. Please try again.',
                        duration: 8
                    });
                });
                rzp.open();
            } else {
                setPaymentProcessing(false);
                notification.error({ message: 'Order Creation Failed', description: res.data.message || 'Could not create payment order.' });
            }
        } catch (err) {
            console.error('Payment Initialization Error:', err);
            setPaymentProcessing(false);
            const errMsg = err.response?.data?.message || err.message;
            notification.error({ 
                message: 'Payment Gateway Error', 
                description: `Could not initiate payment: ${errMsg}` 
            });
        }
    };

    const handleDownloadReceipt = (record) => {
        // Intercept admission or registration fee payments to render identical PDF layout as Enquiry module
        const isAdmissionStream = record.fee_type || record.fee_name || record.receipt_no?.includes('ADM-');
        if (isAdmissionStream) {
            const activeGuardian = guardianData?.guardian_name || '';
            generateAdmissionReceipt({
                receipt_no: record.receipt_no || record.payment_id || record.order_id || 'N/A',
                student_name: record.student_name || wardProfile?.student_name || `${wardProfile?.first_name || ''} ${wardProfile?.last_name || ''}`.trim(),
                registration_no: record.registration_no || '',
                admission_no: record.admission_no || wardProfile?.name || '',
                program: record.program || wardProfile?.program || '',
                academic_year: record.academic_year || '2026-2027',
                fee_type: record.fee_type || 'Admission',
                fee_name: record.fee_name || record.fees_category || 'Admission Fee',
                amount: record.amount,
                payment_mode: record.payment_mode || 'ONLINE',
                payment_id: record.payment_id || record.order_id || '',
                receipt_date: record.verified_at || record.receipt_date || record.created_at || new Date().toISOString(),
                parent_name: record.parent_name || activeGuardian || '',
                parent_mobile: record.parent_mobile || wardProfile?.mobile_number || ''
            });
            return;
        }

        // Construct receipt data
        const dateObj = new Date(record.verified_at || record.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-US');
        
        const receiptData = {
            enrollmentNo: wardProfile?.name,
            studentName: record.student_name || wardProfile?.student_name,
            courseName: wardProfile?.program,
            semester: record.fees_category || 'N/A',
            admissionQuota: 'GENERAL',
            receiptDate: formattedDate,
            receiptNo: record.payment_id || record.order_id,
            amount: record.amount,
            feeName: record.fees_category,
            paymentMode: record.payment_mode ? `${record.payment_mode} PAYMENT` : 'ONLINE PAYMENT',
            transactionNo: record.payment_id || 'N/A',
            original_fee: record.original_fee || 0,
            discount_amount: record.discount_amount || 0,
            discount_name: record.discount_name || '',
            discount_percentage: record.discount_percentage || 0
        };

        setSelectedReceipt(receiptData);

        // Wait for React to render the hidden component, then generate PDF
        setTimeout(() => {
            if (receiptRef.current) {
                const opt = {
                    margin:       0.3,
                    filename:     `Receipt_${receiptData.receiptNo}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { 
                        scale: 2, 
                        useCORS: true,
                        windowWidth: 700,
                        width: 700
                    },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(receiptRef.current).save().then(() => {
                    notification.success({ message: 'Receipt Downloaded Successfully' });
                    setSelectedReceipt(null);
                });
            }
        }, 500);
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <Skeleton active avatar paragraph={{ rows: 4 }} />
                <Row gutter={[24, 24]}>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                    <Col span={8}><Skeleton.Button active block size="large" /></Col>
                </Row>
            </div>
        );
    }

    if (!guardianData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 m-8">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <LockOutlined className="text-3xl text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Guardian Profile Not Found</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    Your account is recognized as a <b>Guardian</b>, but we couldn't find your record in ERPNext. 
                    Please ensure a Guardian record exists with your email: <br/>
                    <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block font-bold text-blue-600">{userEmail}</code>
                </p>
                <Button type="primary" onClick={fetchGuardianData}>Retry Connection</Button>
            </div>
        );
    }

    const totalPaidAmount = Object.values(paidTerms).reduce((sum, term) => sum + (term.amount || 0), 0);
    const originalAcademicFees = wardDetails.feeStructureDetails?.total_amount || 0;
    const totalAcademicFees = wardDetails.feeStructureDetails?.components?.reduce((sum, c) => sum + (c.amount || 0), 0) || originalAcademicFees;
    const remainingPendingFees = Math.max(0, totalAcademicFees - totalPaidAmount);
    const originalRemainingPendingFees = Math.max(0, originalAcademicFees - totalPaidAmount);
    
    let totalDiscount = 0;
    let activeDiscountName = '';
    
    if (wardDetails.feeStructureDetails) {
        totalDiscount = originalRemainingPendingFees - remainingPendingFees;
        if (wardDetails.feeStructureDetails.components) {
           const compWithDiscount = wardDetails.feeStructureDetails.components.find(c => c.discount_amount > 0);
           if (compWithDiscount && compWithDiscount.discount_name) activeDiscountName = compWithDiscount.discount_name;
        }
    } 
    
    if (wardDetails.feeRecords && wardDetails.feeRecords.length > 0) {
        const originalPending = wardDetails.feeRecords.reduce((sum, f) => sum + (f.original_fee || f.outstanding_amount || 0), 0);
        if (!wardDetails.feeStructureDetails) {
            totalDiscount = originalPending - wardDetails.fees;
        }
        if (!activeDiscountName) {
            const recWithDiscount = wardDetails.feeRecords.find(f => f.discount_amount > 0);
            if (recWithDiscount && recWithDiscount.discount_name) {
                activeDiscountName = recWithDiscount.discount_name;
            }
        }
    }

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Avatar size={72} icon={<UserOutlined />} className="bg-indigo-600 shadow-xl" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Welcome, {guardianData.guardian_name}!
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-gray-500">
                            <SmileOutlined className="text-indigo-500" /> 
                            <span>Monitoring {wards.length} Ward(s)</span>
                            <span className="text-gray-300">|</span>
                            <span>{guardianData.name}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button icon={<SyncOutlined />} onClick={fetchGuardianData} shape="round">Sync Data</Button>
                </div>
            </div>

            {/* Wards Selector */}
            {wards.length > 0 ? (
                <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                    {wards.map(w => (
                        <div 
                            key={w.student}
                            onClick={() => fetchWardDetails(w.student)}
                            className={`cursor-pointer px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 whitespace-nowrap ${
                                activeWard === w.student 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-300'
                            }`}
                        >
                            <UserOutlined />
                            <span className="font-bold">{w.student_name || w.student}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-8 flex items-center gap-3 text-orange-700">
                    <ClockCircleOutlined />
                    <span>No students are currently linked to your guardian profile in ERPNext. Please contact the school administration to link your children to your account.</span>
                </div>
            )}

            {/* Ward Quick Stats Cards - Matched with Student Dashboard */}
            <Row gutter={[20, 20]} className="mb-10">
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <Statistic 
                            title="ATTENDANCE" 
                            value={wardDetails.attendance} 
                            suffix="%" 
                            valueStyle={{ color: '#52c41a', fontWeight: 800 }} 
                            prefix={<CalendarOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <Statistic 
                            title="PROGRAMS" 
                            value={wardDetails.programs} 
                            valueStyle={{ color: '#1890ff', fontWeight: 800 }} 
                            prefix={<BookOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <Statistic 
                            title="ASSESSMENTS" 
                            value={wardDetails.assessments} 
                            valueStyle={{ color: '#faad14', fontWeight: 800 }} 
                            prefix={<FileTextOutlined />} 
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div className="flex flex-col">
                            <Statistic 
                                title="PENDING FEES" 
                                value={wardDetails.feeStructureDetails ? remainingPendingFees : wardDetails.fees} 
                                valueStyle={{ color: '#ff4d4f', fontWeight: 800 }} 
                                prefix={<WalletOutlined />} 
                                precision={2}
                                formatter={(value) => `₹${value.toLocaleString()}`}
                            />
                            {totalDiscount > 0 && (
                                <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                                    <span style={{ textDecoration: 'line-through' }}>₹{(wardDetails.feeStructureDetails ? originalRemainingPendingFees : (wardDetails.fees + totalDiscount)).toLocaleString()}</span>
                                    <span style={{ marginLeft: 6, color: '#a855f7', fontWeight: 'bold', background: '#f3e8ff', padding: '2px 6px', borderRadius: 4 }}>
                                        -₹{totalDiscount.toLocaleString()} Off {activeDiscountName ? `(${activeDiscountName})` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Guardian Profile Card */}
            <Card 
                title={<div className="flex items-center gap-2"><UserOutlined className="text-indigo-500"/> <span className="font-bold">Guardian Profile</span></div>}
                className="mb-6 rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-gradient-to-r from-indigo-50/30 to-transparent"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 p-2">
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Guardian ID</span>
                        <span className="font-bold text-gray-800">{guardianData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Full Name</span>
                        <span className="font-bold text-gray-800">{guardianData.guardian_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Mobile Number</span>
                        <span className="font-bold text-gray-800">{guardianData.mobile_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                        <span className="text-gray-400 font-medium">Email Address</span>
                        <span className="font-bold text-indigo-600">{guardianData.email_address || userEmail}</span>
                    </div>
                </div>
            </Card>

            {/* Student Profile Card */}
            {wardProfile && (
                <Card 
                    title={<div className="flex items-center gap-2"><TeamOutlined className="text-indigo-500"/> <span className="font-bold">Student Profile (Ward)</span></div>}
                    className="mb-10 rounded-2xl border-gray-100 shadow-sm overflow-hidden"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 p-2">
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Student ID</span>
                            <span className="font-bold text-gray-800">{wardProfile.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Joining Date</span>
                            <span className="font-bold text-gray-800">{wardProfile.joining_date || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Program</span>
                            <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                                {wardProfile.program || 'General'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Gender</span>
                            <span className="font-bold text-gray-800">{wardProfile.gender || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Email</span>
                            <span className="font-bold text-indigo-600">{wardProfile.student_email_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Mobile</span>
                            <span className="font-bold text-gray-800">{wardProfile.mobile_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Student Group</span>
                            <span className="font-bold text-gray-800">
                                {wardDetails.studentGroups && wardDetails.studentGroups.length > 0 ? (
                                    wardDetails.studentGroups.map(group => <Tag color="cyan" key={group} className="m-0 mr-1">{group}</Tag>)
                                ) : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Class Teacher</span>
                            <span className="font-bold text-indigo-600 flex items-center gap-1">
                                <UserOutlined /> {wardDetails.classTeacher || 'Not Assigned'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Status</span>
                            <span className="flex items-center gap-1.5 font-bold text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Main Content */}
            <Tabs defaultActiveKey="1" className="guardian-tabs">
                <Tabs.TabPane tab={<span><BookOutlined /> Work</span>} key="1">
                    <Card 
                        bordered={false} 
                        style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        bodyStyle={{ padding: '12px 24px 24px 24px' }}
                    >
                        <Tabs defaultActiveKey="homework" type="line" size="middle">
                            <Tabs.TabPane tab={<span>Homework ({wardDetails.homework?.length || 0})</span>} key="homework">
                                <List
                                    dataSource={wardDetails.homework}
                                    locale={{ emptyText: <Empty description="No homework assignments found for this student." /> }}
                                    renderItem={item => {
                                        const isOverdue = dayjs(item.dueDate).isBefore(dayjs(), 'day') && item.status !== 'Completed';
                                        return (
                                            <List.Item
                                                style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                                                extra={
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                        <Tag color={
                                                            item.status === 'Completed' ? 'green' :
                                                            item.status === 'Closed' ? 'default' :
                                                            isOverdue ? 'red' : 'blue'
                                                        } style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
                                                            {item.status === 'Assigned' && isOverdue ? 'Overdue' : item.status || 'Assigned'}
                                                        </Tag>
                                                        {item.estimatedMinutes && (
                                                            <span style={{ fontSize: '11px', color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <ClockCircleOutlined /> {item.estimatedMinutes} mins
                                                            </span>
                                                        )}
                                                    </div>
                                                }
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>
                                                                {item.title}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <Tag color="blue" style={{ fontSize: '11px', fontWeight: 500 }}>
                                                                    Subject (Course): {item.subject || 'N/A'}
                                                                </Tag>
                                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    Assigned By: <b style={{ color: '#374151' }}>{item.assignedBy || 'Instructor'}</b>
                                                                </span>
                                                                <span style={{ fontSize: '12px', color: isOverdue ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                                                    Due: {dayjs(item.dueDate).format('DD MMM YYYY')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    }
                                                    description={
                                                        <div style={{ marginTop: '10px' }}>
                                                            <p style={{ color: '#4b5563', fontSize: '13px', whiteSpace: 'pre-line', margin: 0 }}>
                                                                {item.description || 'No detailed instructions provided.'}
                                                            </p>
                                                            {item.attachmentUrl && (
                                                                <Button
                                                                    type="link"
                                                                    icon={<LinkOutlined />}
                                                                    href={item.attachmentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ padding: 0, marginTop: '8px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                                >
                                                                    Reference Link / Attachment
                                                                </Button>
                                                            )}
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                />
                            </Tabs.TabPane>
                            
                            <Tabs.TabPane tab={<span>Classwork ({wardDetails.classwork?.length || 0})</span>} key="classwork">
                                <List
                                    dataSource={wardDetails.classwork}
                                    locale={{ emptyText: <Empty description="No classwork assignments found for this student." /> }}
                                    renderItem={item => {
                                        const isOverdue = dayjs(item.classworkDate).isBefore(dayjs(), 'day') && item.status !== 'Completed';
                                        return (
                                            <List.Item
                                                style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                                                extra={
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                        <Tag color={
                                                            item.status === 'Completed' ? 'green' :
                                                            item.status === 'Closed' ? 'default' :
                                                            isOverdue ? 'red' : 'blue'
                                                        } style={{ fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
                                                            {item.status === 'Assigned' && isOverdue ? 'Overdue' : item.status || 'Assigned'}
                                                        </Tag>
                                                        {item.estimatedMinutes && (
                                                            <span style={{ fontSize: '11px', color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <ClockCircleOutlined /> {item.estimatedMinutes} mins
                                                            </span>
                                                        )}
                                                    </div>
                                                }
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1f2937' }}>
                                                                {item.title}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <Tag color="purple" style={{ fontSize: '11px', fontWeight: 500 }}>
                                                                    Subject (Course): {item.subject || 'N/A'}
                                                                </Tag>
                                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    Assigned By: <b style={{ color: '#374151' }}>{item.assignedBy || 'Instructor'}</b>
                                                                </span>
                                                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                                                                    Class Date: {dayjs(item.classworkDate).format('DD MMM YYYY')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    }
                                                    description={
                                                        <div style={{ marginTop: '10px' }}>
                                                            <p style={{ color: '#4b5563', fontSize: '13px', whiteSpace: 'pre-line', margin: 0 }}>
                                                                {item.description || 'No detailed instructions provided.'}
                                                            </p>
                                                            {item.attachmentUrl && (
                                                                <Button
                                                                    type="link"
                                                                    icon={<LinkOutlined />}
                                                                    href={item.attachmentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ padding: 0, marginTop: '8px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                                                >
                                                                    Reference Link / Attachment
                                                                </Button>
                                                            )}
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<span><TableOutlined /> Time Table</span>} key="2">
                    <Card 
                        bordered={false} 
                        style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>Weekly Time Table</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', color: '#595959', fontWeight: 500 }}>Filter by Day:</span>
                                    <select 
                                        style={{ 
                                            padding: '6px 12px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #d9d9d9', 
                                            fontSize: '14px', 
                                            fontWeight: 500,
                                            outline: 'none',
                                            cursor: 'pointer',
                                            minWidth: '140px',
                                            background: '#fff'
                                        }}
                                        value={selectedDayFilter}
                                        onChange={(e) => setSelectedDayFilter(e.target.value)}
                                    >
                                        <option value="">All Days</option>
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select>
                                </div>
                            </div>
                        }
                    >
                        <Table 
                            dataSource={(wardDetails.fullSchedule || []).filter(item => !selectedDayFilter || item.custom_day === selectedDayFilter)}
                            rowKey="name"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { title: 'ID', dataIndex: 'name', key: 'id', width: 120, ellipsis: true },
                                { 
                                    title: 'Title', 
                                    key: 'title_display',
                                    render: (rec) => rec.title || rec.course 
                                },
                                { title: 'Instructor', dataIndex: 'instructor', key: 'instructor' },
                                { 
                                    title: 'Day', 
                                    dataIndex: 'custom_day', 
                                    key: 'day',
                                    render: (text) => text ? <Tag color="blue" style={{ fontWeight: 'bold' }}>{text}</Tag> : '-'
                                },
                                { 
                                    title: 'Date', 
                                    dataIndex: 'schedule_date', 
                                    key: 'date',
                                    sorter: (a, b) => new Date(a.schedule_date) - new Date(b.schedule_date)
                                },
                                { title: 'From Time', dataIndex: 'from_time', key: 'from' },
                                { title: 'To Time', dataIndex: 'to_time', key: 'to' },
                                { title: 'Room', dataIndex: 'room', key: 'room' }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<span><CalendarOutlined /> Attendance</span>} key="3">
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Calendar 
                            cellRender={(current, info) => {
                                if (info.type !== 'date' || !wardDetails.attendanceList) return info.originNode;
                                
                                const dateStr = current.format('YYYY-MM-DD');
                                const atts = wardDetails.attendanceList.filter(a => a.date === dateStr);
                                
                                return (
                                    <div className="events" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px' }}>
                                        {atts.map((att, index) => {
                                            const type = att.status === 'Present' ? 'success' : att.status === 'Absent' ? 'error' : 'warning';
                                            return <Badge key={index} status={type} text={<span style={{ fontSize: '10px' }}>{att.status}</span>} />;
                                        })}
                                    </div>
                                );
                            }}
                        />
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<span><WalletOutlined /> Fee Details</span>} key="4">
                    <Card className="rounded-2xl border-gray-100">
                        {wardDetails.feeRecords && wardDetails.feeRecords.length > 0 ? (
                            <Table 
                                dataSource={wardDetails.feeRecords}
                                pagination={false}
                                scroll={{ x: 'max-content' }}
                                columns={[
                                    { title: 'Fee ID', dataIndex: 'name', key: 'id', render: (id) => <span className="font-bold text-indigo-600">{id}</span> },
                                    { title: 'Due Date', dataIndex: 'due_date', key: 'due' },
                                    { title: 'Grand Total', dataIndex: 'total_amount', key: 'total', render: (val) => <span className="font-bold">₹{val.toLocaleString()}</span> },
                                    { 
                                        title: 'Outstanding', 
                                        dataIndex: 'outstanding_amount', 
                                        key: 'out', 
                                        render: (val, record) => (
                                            <div className="flex flex-col">
                                                {record.discount_amount > 0 && (
                                                    <span className="text-[10px] line-through text-gray-400">₹{record.original_fee?.toLocaleString()}</span>
                                                )}
                                                <span className={`font-bold ${val > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    ₹{val.toLocaleString()}
                                                </span>
                                                {record.discount_amount > 0 && (
                                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded-sm w-fit mt-0.5">-₹{record.discount_amount.toLocaleString()} Off {record.discount_name ? `(${record.discount_name})` : ''}</span>
                                                )}
                                            </div>
                                        ) 
                                    },
                                    {
                                        title: 'Status',
                                        key: 'status',
                                        render: (rec) => {
                                            const isPaid = rec.outstanding_amount === 0;
                                            return <Tag color={isPaid ? 'green' : 'red'}>{isPaid ? 'Paid' : 'Unpaid'}</Tag>
                                        }
                                    },
                                    {
                                        title: 'Action',
                                        key: 'action',
                                        render: (rec) => (
                                            <div className="flex gap-2">
                                                <Button type="link" size="small" className="font-bold" onClick={() => window.open(`/education/fees/${rec.name}`, '_blank')}>
                                                    View
                                                </Button>
                                                <Button 
                                                    type="primary" 
                                                    size="small" 
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold h-7 px-3 rounded-lg border-none"
                                                    onClick={() => handlePayNow(rec)}
                                                >
                                                    PAY NOW
                                                </Button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        ) : wardDetails.feeStructureDetails ? (
                            <div className="p-0">
                                <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-lg mb-4 flex flex-col gap-1 mx-4 mt-4">
                                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                                        <ClockCircleOutlined /> Scheduled Fee Structure: <span className="px-1.5 py-0.5 bg-amber-100 rounded font-black">{wardDetails.feeStructure}</span>
                                    </div>
                                    <div className="text-amber-700 text-[10px]">
                                        No invoices generated yet. Showing components for <b>{activeWard}</b>.
                                    </div>
                                </div>

                                <Table 
                                    dataSource={wardDetails.feeStructureDetails.components}
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 'max-content' }}
                                    rowKey={(record) => record.fees_category || record.idx}
                                    columns={[
                                        { 
                                            title: 'Fees Category', 
                                            dataIndex: 'fees_category', 
                                            key: 'cat', 
                                            render: (t) => {
                                                let dueDate = "";
                                                if (t.includes("Q1")) dueDate = "Payable by 10th March";
                                                else if (t.includes("Q2")) dueDate = "Payable by 10th June";
                                                else if (t.includes("Q3")) dueDate = "Payable by 10th Sep";
                                                else if (t.includes("Q4")) dueDate = "Payable by 10th Dec";
                                                
                                                const isPaid = !!paidTerms[t];
                                                
                                                return (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-700">{t}</span>
                                                        {isPaid ? (
                                                            <span className="text-[10px] text-green-600 font-bold">
                                                                ✓ Paid on {new Date(paidTerms[t].paid_at).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            dueDate && <span className="text-[10px] text-gray-400 font-medium">{dueDate}</span>
                                                        )}
                                                    </div>
                                                );
                                            } 
                                        },
                                        { 
                                            title: 'Amount', 
                                            dataIndex: 'amount', 
                                            key: 'amt', 
                                            align: 'right', 
                                            render: (v, record) => {
                                                const category = record.fees_category;
                                                const isPaid = !!paidTerms[category];
                                                
                                                return (
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="flex flex-col items-end">
                                                            {record.discount_amount > 0 && (
                                                                <span className="text-[10px] line-through text-gray-400">₹{record.original_fee?.toLocaleString()}</span>
                                                            )}
                                                            <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-indigo-600'}`}>₹{v.toLocaleString()}</span>
                                                            {record.discount_amount > 0 && (
                                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded-sm w-fit mt-0.5">-₹{record.discount_amount.toLocaleString()} Off {record.discount_name ? `(${record.discount_name})` : ''}</span>
                                                            )}
                                                        </div>
                                                        {isPaid ? (
                                                            <>
                                                                <Tag color="green" className="text-[10px] font-bold rounded-md uppercase m-0 border-none px-2 py-0">
                                                                    <CheckCircleOutlined className="mr-1" />Paid
                                                                </Tag>
                                                                <Button 
                                                                    type="default" 
                                                                    size="small" 
                                                                    disabled
                                                                    className="text-[10px] font-bold h-7 px-3 rounded-lg border-green-200 text-green-600 bg-green-50"
                                                                >
                                                                    <CheckCircleOutlined /> PAID
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Tag color="red" className="text-[10px] font-bold rounded-md uppercase m-0 border-none px-2 py-0">Unpaid</Tag>
                                                                <Button 
                                                                    type="primary" 
                                                                    size="small" 
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold h-7 px-3 rounded-lg border-none"
                                                                    onClick={() => handlePayNow(record)}
                                                                >
                                                                    PAY NOW
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        }
                                    ]}
                                />
                                
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center px-6 pb-6 bg-indigo-50/20 rounded-b-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Grand Total</span>
                                        <span className="text-sm font-black text-gray-700">TOTAL ACADEMIC FEES</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-xl font-black text-gray-500 line-through decoration-gray-400">
                                            ₹{originalAcademicFees.toLocaleString()}
                                        </div>
                                        {totalDiscount > 0 && (
                                            <div className="text-sm text-purple-600 font-bold mt-1 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded">
                                                - ₹{totalDiscount.toLocaleString()} Total Discount
                                            </div>
                                        )}
                                        {totalPaidAmount > 0 && (
                                            <div className="text-sm text-green-600 font-bold mt-1 flex items-center gap-1">
                                                <CheckCircleOutlined /> - ₹{totalPaidAmount.toLocaleString()} Paid
                                            </div>
                                        )}
                                        <div className="text-2xl font-black text-indigo-600 mt-2 border-t border-indigo-200/50 pt-2 min-w-[120px] text-right">
                                            ₹{remainingPendingFees.toLocaleString()}
                                            <span className="text-[10px] block text-gray-500 font-bold mt-0.5">REMAINING DUE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Empty description="No pending fees or defined fee structure found for this student." />
                        )}
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><WalletOutlined /> Fees Receipt Transaction</span>} key="5">
                    <Card className="rounded-2xl border-gray-100 shadow-sm">
                        <Table 
                            dataSource={paymentHistory}
                            rowKey="order_id"
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { 
                                    title: 'Academic Year', 
                                    key: 'year', 
                                    render: () => {
                                        const y = new Date().getFullYear();
                                        return `${y}-${y+1}`;
                                    }
                                },
                                { title: 'Semester', dataIndex: 'fees_category', key: 'semester' },
                                { 
                                    title: 'Receipt Date', 
                                    key: 'date',
                                    render: (rec) => {
                                        const d = new Date(rec.verified_at || rec.created_at);
                                        return (
                                            <div>
                                                <div className="font-semibold text-gray-800">{d.toLocaleDateString('en-GB')}</div>
                                                <div className="text-xs text-gray-400">{d.toLocaleTimeString('en-US')}</div>
                                            </div>
                                        );
                                    }
                                },
                                { title: 'Receipt No', dataIndex: 'payment_id', key: 'receipt_no', render: text => text || 'N/A' },
                                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: text => `₹ ${text?.toLocaleString()}` },
                                { title: 'Payment Type', key: 'type', render: () => 'ONLINE PAYMENT' },
                                { 
                                    title: 'Download', 
                                    key: 'download',
                                    align: 'center',
                                    render: (_, record) => (
                                        <Button 
                                            type="text" 
                                            icon={<DownloadOutlined className="text-xl text-blue-600" />} 
                                            onClick={() => handleDownloadReceipt(record)}
                                        />
                                    )
                                }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><BookOutlined /> Academic Progress</span>} key="6">
                    <Card className="rounded-2xl border-gray-100">
                        <Table 
                            dataSource={wardDetails.assessments}
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            columns={[
                                { title: 'Exam', dataIndex: 'assessment_plan', key: 'plan' },
                                { title: 'Score', key: 'score', render: (rec) => `${rec.total_score} / ${rec.maximum_score}` }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
            </Tabs>

            {/* Hidden Receipt Component for PDF Generation - Hidden off-screen to allow proper rendering */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '700px' }}>
                <FeeReceiptTemplate 
                    ref={receiptRef} 
                    receiptData={selectedReceipt} 
                />
            </div>

            {/* Professional Payment Modal */}
            <Modal
                title={null}
                open={isPaymentModalVisible}
                onCancel={() => { setIsPaymentModalVisible(false); setPaymentProcessing(false); }}
                footer={null}
                width={800}
                centered
                styles={{ body: { padding: 0, borderRadius: '24px', overflow: 'hidden' } }}
            >
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center px-8">
                    <div className="flex items-center gap-3">
                        <CreditCardOutlined className="text-xl opacity-80" />
                        <h2 className="text-lg font-black m-0 text-white uppercase tracking-widest">Fee Checkout</h2>
                    </div>
                    <div className="cursor-pointer hover:opacity-70" onClick={() => setIsPaymentModalVisible(false)}>
                        <RightOutlined rotate={-45} className="text-xl" />
                    </div>
                </div>

                <div className="p-6">
                    {wardProfile && selectedFee && (
                        <>
                            {/* Student & Guardian Info Header */}
                            <div className="flex items-center justify-between mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <Avatar size={48} icon={<UserOutlined />} className="bg-indigo-600 shadow-sm" />
                                    <div>
                                        <h4 className="text-lg font-black text-gray-800 m-0 leading-tight">{wardProfile.student_name || wardProfile.name}</h4>
                                        <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">{wardProfile.program || 'General Program'}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-tighter">Guardian</span>
                                    <span className="text-sm font-bold text-gray-700">{guardianData.guardian_name}</span>
                                </div>
                            </div>

                            {/* Detail Grid */}
                            <div className="grid grid-cols-3 gap-x-6 gap-y-3 mb-4 px-2">
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Student ID</span>
                                    <span className="text-sm font-bold text-gray-800">{wardProfile.name}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Academic Session</span>
                                    <span className="text-sm font-bold text-gray-800">2026 - 2027</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Fee Structure</span>
                                    <span className="text-sm font-bold text-gray-800">{wardDetails.feeStructure || 'Standard'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Term / Category</span>
                                    <Tag color="indigo" className="m-0 font-bold border-none bg-indigo-100 text-indigo-700 text-[11px]">{selectedFee.fees_category || selectedFee.name}</Tag>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Email Address</span>
                                    <span className="text-xs font-bold text-gray-700 truncate block">{wardProfile.student_email_id || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Mobile Number</span>
                                    <span className="text-sm font-bold text-gray-800">{wardProfile.student_mobile_number || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Address Row */}
                            <div className="mb-6 px-2 py-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                                <InfoCircleOutlined className="text-indigo-400 mt-1" />
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase block tracking-tighter">Billing Address</span>
                                    <span className="text-xs font-bold text-gray-700">
                                        {wardProfile.address_line1 || 'N/A'} {wardProfile.address_line2 || ''}, {wardProfile.city}, {wardProfile.state} - {wardProfile.pincode}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Footer Bar */}
                            <div className="flex items-center justify-between gap-6 border-t pt-6">
                                <div className="flex-1">
                                    <Checkbox 
                                        checked={termsAccepted} 
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="text-[11px] text-gray-500 font-medium leading-tight"
                                    >
                                        I confirm that all details are correct. I agree to the <span className="text-indigo-600 underline">Terms</span>.
                                    </Checkbox>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 font-black uppercase block leading-none mb-1">Payable Amount</span>
                                        <span className="text-3xl font-black text-indigo-600 leading-none">₹{(selectedFee.amount || selectedFee.outstanding_amount || 0).toLocaleString()}</span>
                                    </div>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        loading={paymentProcessing}
                                        className={`h-14 px-8 rounded-xl text-md font-black shadow-lg border-none transition-all ${termsAccepted && !paymentProcessing ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]' : 'bg-gray-200'}`}
                                        onClick={processPayment}
                                        disabled={!termsAccepted || paymentProcessing}
                                    >
                                        {paymentProcessing ? 'PROCESSING...' : 'CONFIRM & PAY'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <style>{`
                .guardian-tabs .ant-tabs-nav::before {
                    border-bottom: 2px solid #F3F4F6;
                }
                .guardian-tabs .ant-tabs-tab {
                    font-weight: 700;
                    font-size: 14px;
                    padding: 12px 24px;
                    color: #9CA3AF;
                }
                .guardian-tabs .ant-tabs-tab-active {
                    color: #4F46E5 !important;
                }
                .guardian-tabs .ant-tabs-ink-bar {
                    background: #4F46E5;
                    height: 3px;
                }
            `}</style>
        </div>
    );
};

export default GuardianDashboard;
