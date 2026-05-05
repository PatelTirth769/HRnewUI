import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton, Empty, Button, Tabs, notification, Modal, Descriptions, Checkbox, Typography, Divider } from 'antd';
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
    DownloadOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import FeeReceiptTemplate from './FeeReceiptTemplate';

const { Title, Text } = Typography;

const GuardianDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [guardianData, setGuardianData] = useState(null);
    const [wards, setWards] = useState([]);
    const [activeWard, setActiveWard] = useState(null);
    const [wardProfile, setWardProfile] = useState(null);
    const [wardDetails, setWardDetails] = useState({
        attendance: 0,
        fees: 0,
        assessments: 0,
        programs: 0,
        feeRecords: [],
        attendanceList: [],
        assessmentList: []
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
    const fetchPaidTerms = async (studentId) => {
        try {
            const historyRes = await axios.get(`/local-api/payment/history/${encodeURIComponent(studentId)}`);
            if (historyRes.data.success && historyRes.data.data) {
                const paidMap = {};
                const verifiedHistory = [];
                historyRes.data.data.forEach(payment => {
                    // Only count verified/successful payments
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
                setPaidTerms(paidMap);
                setPaymentHistory(verifiedHistory);
                console.log('[Guardian] Paid terms loaded:', Object.keys(paidMap));
            }
        } catch (err) {
            console.warn('[Guardian] Could not fetch payment history:', err.message);
            // Non-critical: if Firebase history is unavailable, just show all as unpaid
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
                    fetchWardDetails(students[0].student);
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
            fetchPaidTerms(studentId);

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

            setWardDetails({
                attendance: attendancePct,
                attendanceList: attendanceList,
                fees: feeList.reduce((acc, f) => acc + (f.outstanding_amount || 0), 0),
                feeRecords: feeList,
                assessments: assessList.length,
                assessmentList: assessList,
                programs: enrollmentData.length,
                feeStructure: linkedFeeStructure,
                feeStructureDetails
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
                                systemCode: 'schooler'
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
            paymentMode: 'ONLINE PAYMENT',
            transactionNo: record.payment_id || 'N/A'
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
    const totalAcademicFees = wardDetails.feeStructureDetails?.total_amount || 0;
    const remainingPendingFees = Math.max(0, totalAcademicFees - totalPaidAmount);

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
                        <Statistic 
                            title="PENDING FEES" 
                            value={wardDetails.feeStructureDetails ? remainingPendingFees : wardDetails.fees} 
                            valueStyle={{ color: '#ff4d4f', fontWeight: 800 }} 
                            prefix={<WalletOutlined />} 
                            precision={2}
                            formatter={(value) => `₹${value.toLocaleString()}`}
                        />
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
                <Tabs.TabPane tab={<span><CalendarOutlined /> Recent Attendance</span>} key="1">
                    <Card className="rounded-2xl border-gray-100">
                        <Table 
                            dataSource={wardDetails.attendanceList}
                            pagination={false}
                            columns={[
                                { title: 'Date', dataIndex: 'date', key: 'date' },
                                { 
                                    title: 'Status', 
                                    dataIndex: 'status', 
                                    key: 'status',
                                    render: (s) => <Tag color={s === 'Present' ? 'green' : 'red'}>{s}</Tag>
                                }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><WalletOutlined /> Fee Details</span>} key="2">
                    <Card className="rounded-2xl border-gray-100">
                        {wardDetails.feeRecords && wardDetails.feeRecords.length > 0 ? (
                            <Table 
                                dataSource={wardDetails.feeRecords}
                                pagination={false}
                                columns={[
                                    { title: 'Fee ID', dataIndex: 'name', key: 'id', render: (id) => <span className="font-bold text-indigo-600">{id}</span> },
                                    { title: 'Due Date', dataIndex: 'due_date', key: 'due' },
                                    { title: 'Grand Total', dataIndex: 'total_amount', key: 'total', render: (val) => <span className="font-bold">₹{val.toLocaleString()}</span> },
                                    { 
                                        title: 'Outstanding', 
                                        dataIndex: 'outstanding_amount', 
                                        key: 'out', 
                                        render: (val) => (
                                            <span className={`font-bold ${val > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                ₹{val.toLocaleString()}
                                            </span>
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
                                                        <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-indigo-600'}`}>₹{v.toLocaleString()}</span>
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
                                            ₹{totalAcademicFees.toLocaleString()}
                                        </div>
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
                <Tabs.TabPane tab={<span><BookOutlined /> Academic Progress</span>} key="3">
                    <Card className="rounded-2xl border-gray-100">
                        <Table 
                            dataSource={wardDetails.assessments}
                            pagination={false}
                            columns={[
                                { title: 'Exam', dataIndex: 'assessment_plan', key: 'plan' },
                                { title: 'Score', key: 'score', render: (rec) => `${rec.total_score} / ${rec.maximum_score}` }
                            ]}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><WalletOutlined /> Fees Receipt Transaction</span>} key="4">
                    <Card className="rounded-2xl border-gray-100 shadow-sm">
                        <Table 
                            dataSource={paymentHistory}
                            rowKey="order_id"
                            pagination={{ pageSize: 10 }}
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
