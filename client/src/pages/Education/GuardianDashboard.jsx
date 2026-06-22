import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, List, Avatar, Skeleton, Empty, Button, Tabs, notification, Modal, Descriptions, Checkbox, Typography, Divider, Calendar, Badge, Alert } from 'antd';
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
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
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
        studentGroups: [],
        classTeacher: '',
        homework: [],
        classwork: [],
        fullSchedule: [],
        timetablePhoto: null,
        announcements: [],
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

    const [enableOnlineFeePayment, setEnableOnlineFeePayment] = useState(false);

    useEffect(() => {
        const fetchFeeSetting = async () => {
            try {
                const docRef = doc(db, 'schooler_system', 'dashboard_settings');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEnableOnlineFeePayment(docSnap.data().ENABLE_ONLINE_FEE_PAYMENT === true);
                }
            } catch (err) {
                console.warn('Failed to fetch dashboard settings:', err);
            }
        };
        fetchFeeSetting();
    }, []);

    // Leave Application CRUD States
    const [leavesList, setLeavesList] = useState([]);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [savingLeave, setSavingLeave] = useState(false);
    const [leaveView, setLeaveView] = useState('list'); // 'list' or 'form'
    const [leaveEditing, setLeaveEditing] = useState(null);
    const [leaveForm, setLeaveForm] = useState({
        student: '',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        attendance_based_on: 'Student Group',
        student_group: '',
        mark_as_present: 0,
        reason: '',
    });

    const fetchStudentLeaves = async (studentId) => {
        if (!studentId) return;
        setLeavesLoading(true);
        try {
            const url = `/api/resource/Student Leave Application?filters=[["student","=","${studentId}"]]&fields=["name","student","from_date","to_date","mark_as_present","student_group","reason","attendance_based_on","docstatus"]&limit_page_length=None&order_by=from_date desc`;
            const response = await API.get(url);
            setLeavesList(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching student leave applications:', err);
        } finally {
            setLeavesLoading(false);
        }
    };

    const handleSaveLeave = async () => {
        if (!leaveForm.from_date || !leaveForm.to_date || !leaveForm.student_group) {
            notification.warning({ message: 'Missing Fields', description: 'Student Group, From Date, and To Date are required.' });
            return;
        }

        setSavingLeave(true);
        try {
            const payload = {
                ...leaveForm,
                student: activeWard,
            };

            if (leaveEditing) {
                await API.put(`/api/resource/Student Leave Application/${encodeURIComponent(leaveEditing)}`, payload);
                notification.success({ message: 'Success', description: 'Draft updated successfully.' });
            } else {
                await API.post('/api/resource/Student Leave Application', { ...payload, docstatus: 0 });
                notification.success({ message: 'Success', description: 'Draft created successfully.' });
            }
            setLeaveView('list');
            setLeaveEditing(null);
            await fetchStudentLeaves(activeWard);
        } catch (err) {
            console.error('Save leave error:', err);
            notification.error({ message: 'Save Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSavingLeave(false);
        }
    };

    const handleSubmitLeave = async (name) => {
        const idToSubmit = name || leaveEditing;
        if (!idToSubmit) return;
        if (!window.confirm(`Are you sure you want to submit leave application ${idToSubmit}? Once submitted, it cannot be modified.`)) return;

        setSavingLeave(true);
        try {
            await API.put(`/api/resource/Student Leave Application/${encodeURIComponent(idToSubmit)}`, { docstatus: 1 });
            notification.success({ message: 'Success', description: 'Leave application submitted successfully.' });
            setLeaveView('list');
            setLeaveEditing(null);
            await fetchStudentLeaves(activeWard);
        } catch (err) {
            console.error('Submit leave error:', err);
            notification.error({ message: 'Submit Failed', description: err.response?.data?._server_messages || err.message });
        } finally {
            setSavingLeave(false);
        }
    };

    const handleDeleteLeave = async (name) => {
        if (!window.confirm('Are you sure you want to delete this leave application?')) return;
        try {
            await API.delete(`/api/resource/Student Leave Application/${encodeURIComponent(name)}`);
            notification.success({ message: 'Success', description: 'Deleted successfully.' });
            await fetchStudentLeaves(activeWard);
        } catch (err) {
            console.error('Delete leave error:', err);
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

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
            let guardian = null;
            const savedGuardianId = localStorage.getItem('guardian_profile_id');
            const loginInput = localStorage.getItem('login_input') || userEmail;

            if (savedGuardianId) {
                try {
                    const fullGuard = await API.get(`/api/resource/Guardian/${encodeURIComponent(savedGuardianId)}`);
                    if (fullGuard.data?.data) {
                        guardian = fullGuard.data.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch by saved guardian ID:', e.message);
                }
            }

            if (!guardian) {
                const guardRes = await API.get(`/api/resource/Guardian?or_filters=[["email_address","=","${userEmail}"],["mobile_number","=","${userEmail}"],["email_address","=","${loginInput}"],["mobile_number","=","${loginInput}"]]&fields=["name"]`);
                
                if (guardRes.data?.data && guardRes.data.data.length > 0) {
                    const guardianId = guardRes.data.data[0].name;
                    localStorage.setItem('guardian_profile_id', guardianId);
                    const fullGuard = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardianId)}`);
                    guardian = fullGuard.data.data;
                }
            }
            
            if (guardian) {
                setGuardianData(guardian);

                const students = guardian.students || [];
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

            // Parallel Data Fetch with Individual Error Handling
            const [attRes, feeRes, assessRes, enrRes, leaveRes] = await Promise.allSettled([
                API.get('/api/resource/Student Attendance', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "date", "status", "student", "student_name", "student_group"]), limit_page_length: 1000 } }),
                API.get('/api/resource/Fees', { params: { filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), fields: JSON.stringify(["name", "due_date", "outstanding_amount"]) } }),
                API.get('/api/resource/Assessment Result', { params: { filters: JSON.stringify([["student", "=", studentId]]) } }),
                API.get('/api/resource/Program Enrollment', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "program"]) } }),
                API.get('/api/resource/Student Leave Application', {
                    params: {
                        filters: JSON.stringify([["student", "=", studentId], ["docstatus", "=", 1]]),
                        fields: JSON.stringify(["name", "student", "from_date", "to_date", "mark_as_present"])
                    }
                })
            ]);

            const attendanceList = attRes.status === 'fulfilled' ? (attRes.value.data?.data || []) : [];
            const feeList = feeRes.status === 'fulfilled' ? (feeRes.value.data?.data || []) : [];
            const assessList = assessRes.status === 'fulfilled' ? (assessRes.value.data?.data || []) : [];
            const enrollmentData = enrRes.status === 'fulfilled' ? (enrRes.value.data?.data || []) : [];
            const leavesList = leaveRes.status === 'fulfilled' ? (leaveRes.value.data?.data || []) : [];

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
                    let filters = [["program", "=", programToSearch]];
                    if (wardProf.custom_board) {
                        filters.push(["company", "=", wardProf.custom_board]);
                    }

                    const fsRes = await API.get('/api/resource/Fee Structure', {
                        params: { filters: JSON.stringify(filters), fields: JSON.stringify(["name"]) }
                    });
                    if (fsRes.data?.data?.length > 0) {
                        linkedFeeStructure = fsRes.data.data[0].name;
                    } else if (wardProf.custom_board) {
                        const fsResFallback = await API.get('/api/resource/Fee Structure', {
                            params: { filters: JSON.stringify([["program", "=", programToSearch]]), fields: JSON.stringify(["name"]) }
                        });
                        if (fsResFallback.data?.data?.length > 0) {
                            linkedFeeStructure = fsResFallback.data.data[0].name;
                        }
                    }

                    if (!linkedFeeStructure) {
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
                    const sdSnaps = await getDocs(collection(db, 'schooler_system', 'data', 'student_discounts'));
                    sdSnaps.forEach(doc => {
                        const data = doc.data();
                        if (childIds.includes(data.student_id)) {
                            if (!studentDiscountsMap[data.student_id]) studentDiscountsMap[data.student_id] = [];
                            studentDiscountsMap[data.student_id].push(data);
                        }
                    });

                    const fdSnaps = await getDocs(collection(db, 'schooler_system', 'data', 'fees_discounts'));
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

            let timetablePhotoData = null;
            if (studentGroups && studentGroups.length > 0) {
                try {
                    for (const group of studentGroups) {
                        const docRef = doc(db, 'schooler_system', 'course_scheduling', 'timetables', group);
                        const snap = await getDoc(docRef);
                        if (snap.exists()) {
                            timetablePhotoData = snap.data();
                            break;
                        }
                    }
                } catch (e) {
                    console.warn('[GuardianDashboard] Failed to fetch timetable photo:', e.message);
                }
            }

            setWardDetails({
                attendance: attendancePct,
                attendanceList: attendanceList,
                leavesList: leavesList,
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
                fullSchedule,
                timetablePhoto: timetablePhotoData,
                announcements: [],  // will be populated below
            });

            // Fetch Announcements from Firestore and filter for this ward
            try {
                const annRef = collection(db, 'schooler_system/announcements/records');
                const annSnap = await getDocs(annRef);
                const allAnn = annSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => {
                        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                        return tb - ta;
                    });
                const wardProgram = wardProf?.program || '';
                const wardBoard   = wardProf?.custom_board || '';
                console.log('[GuardianDashboard] Ward program:', wardProgram, '| Ward board:', wardBoard, '| Student Groups:', studentGroups);
                console.log('[GuardianDashboard] All announcements:', allAnn.length, allAnn.map(a => `${a.targetType}:${a.targetValue}`));
                const filteredAnn = allAnn.filter(ann => {
                    if (ann.targetType === 'All') return true;
                    if (ann.targetType === 'Program'      && ann.targetValue === wardProgram) return true;
                    if (ann.targetType === 'Board'        && ann.targetValue === wardBoard)   return true;
                    if (ann.targetType === 'StudentGroup' && studentGroups.includes(ann.targetValue)) return true;
                    if (ann.targetType === 'Student') {
                        if (Array.isArray(ann.targetValue)) {
                            return ann.targetValue.includes(wardProf?.name);
                        }
                        return ann.targetValue === wardProf?.name;
                    }
                    return false;
                });
                console.log('[GuardianDashboard] Filtered announcements:', filteredAnn.length);
                setWardDetails(prev => ({ ...prev, announcements: filteredAnn }));
            } catch (annErr) {
                console.error('[GuardianDashboard] Could not fetch announcements:', annErr);
            }

            // Fetch leave applications separately via state
            await fetchStudentLeaves(studentId);
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
                receipt_date: record.receipt_date || record.verified_at || record.created_at || new Date().toISOString(),
                parent_name: record.parent_name || activeGuardian || '',
                parent_mobile: record.parent_mobile || wardProfile?.mobile_number || ''
            });
            return;
        }

        // Construct receipt data
        const dateObj = new Date(record.receipt_date || record.verified_at || record.created_at);
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
    
    let originalAcademicFees = 0;
    let remainingPendingFees = 0;
    let originalRemainingPendingFees = 0;
    
    if (wardDetails.feeStructureDetails && wardDetails.feeStructureDetails.components) {
        wardDetails.feeStructureDetails.components.forEach(comp => {
            const cat = comp.fees_category || comp.name;
            originalAcademicFees += (comp.original_fee || comp.amount || 0);
            if (!paidTerms[cat]) {
                remainingPendingFees += (comp.amount || 0);
                originalRemainingPendingFees += (comp.original_fee || comp.amount || 0);
            }
        });
    } else {
        const fallbackTotal = wardDetails.feeStructureDetails?.total_amount || 0;
        originalAcademicFees = fallbackTotal;
        remainingPendingFees = Math.max(0, fallbackTotal - totalPaidAmount);
        originalRemainingPendingFees = remainingPendingFees;
    }
    
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
        const originalPending = wardDetails.feeRecords.reduce((sum, f) => sum + (f.original_fee || f.total_amount || f.outstanding_amount || 0), 0);
        if (!wardDetails.feeStructureDetails) {
            originalAcademicFees = originalPending;
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 flex-wrap">
                <div className="flex items-center gap-5 flex-wrap">
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
                            <span className="text-gray-400 font-medium">Program (Class)</span>
                            <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold border border-blue-100">
                                {wardProfile.program || 'General'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-3">
                            <span className="text-gray-400 font-medium">Board</span>
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-0.5 rounded-full text-xs font-bold border border-indigo-100">
                                {wardProfile.custom_board || 'N/A'}
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

            {/* Announcements Card for Guardian — always visible */}
            <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(99,102,241,0.08)',
                border: '1px solid #e8e8f5',
                overflow: 'hidden',
                marginBottom: 32,
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f1f1f8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'linear-gradient(135deg, #eef2ff 0%, #f8faff 100%)',
                }}>
                    <span style={{ fontSize: 18 }}>📢</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e1b4b' }}>Announcements</span>
                    {wardDetails.announcements?.length > 0 && (
                        <span style={{
                            marginLeft: 'auto',
                            background: '#6366f1',
                            color: '#fff',
                            borderRadius: 20,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                        }}>{wardDetails.announcements.length}</span>
                    )}
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(!wardDetails.announcements || wardDetails.announcements.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af' }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                            <p style={{ fontSize: 13 }}>No announcements for your child yet.</p>
                        </div>
                    ) : (
                        wardDetails.announcements.map(ann => {
                            const bgMap = { All: '#eef2ff', Board: '#e0f2fe', StudentGroup: '#d1fae5', Program: '#fef3c7' };
                            const bdMap = { All: '#c7d2fe', Board: '#bae6fd', StudentGroup: '#a7f3d0', Program: '#fde68a' };
                            const bg = bgMap[ann.targetType] || '#f3f4f6';
                            const bd = bdMap[ann.targetType] || '#e5e7eb';
                            return (
                                <div key={ann.id} style={{
                                    background: bg,
                                    border: `1px solid ${bd}`,
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 4 }}>{ann.title}</div>
                                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>{ann.message}</div>
                                    {ann.createdAt && (
                                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
                                            {ann.createdAt.toDate ? ann.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

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
                                            >
                                              <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between' }}>
                                                <div style={{ flex: '1 1 300px' }}>
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
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', minWidth: '120px' }}>
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
                                              </div>
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
                                            >
                                              <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between' }}>
                                                <div style={{ flex: '1 1 300px' }}>
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
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', minWidth: '120px' }}>
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
                                              </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Tabs.TabPane>

                <Tabs.TabPane tab={<span><TableOutlined /> Time Table</span>} key="2">
                    {wardDetails.timetablePhoto ? (
                        <Card 
                            bordered={false} 
                            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            title={<span style={{ fontSize: '16px', fontWeight: 700 }}>Weekly Time Table</span>}
                            extra={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button 
                                        type="primary" 
                                        shape="round" 
                                        href={wardDetails.timetablePhoto.fileUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        icon={<DownloadOutlined />}
                                    >
                                        Download Timetable
                                    </Button>
                                </div>
                            }
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f9fafb', borderRadius: '12px', padding: '16px', border: '1px solid #f0f0f0' }}>
                                <img 
                                    src={wardDetails.timetablePhoto.fileUrl} 
                                    alt="Weekly Timetable" 
                                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} 
                                />
                            </div>
                        </Card>
                    ) : (
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
                    )}
                </Tabs.TabPane>

                <Tabs.TabPane tab={<span><CalendarOutlined /> Attendance</span>} key="3">
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Calendar 
                            cellRender={(current, info) => {
                                if (info.type !== 'date') return info.originNode;
                                
                                const dateStr = current.format('YYYY-MM-DD');
                                
                                // Check for submitted leaves on this date
                                const leaves = leavesList || [];
                                const leavesOnDate = leaves.filter(l => 
                                    l.from_date <= dateStr && 
                                    l.to_date >= dateStr
                                );
                                
                                if (leavesOnDate.length > 0) {
                                    const markPresent = leavesOnDate.some(l => l.mark_as_present === 1 || l.mark_as_present === true);
                                    if (markPresent) {
                                        return (
                                            <div className="events animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px' }}>
                                                <Badge status="success" text={<span style={{ fontSize: '10px', fontWeight: 'bold' }}>Present (Leave Approved)</span>} />
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="events" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px' }}>
                                                <Badge status="warning" text={<span style={{ fontSize: '10px', fontWeight: 'bold', color: '#d97706' }}>Leave</span>} />
                                            </div>
                                        );
                                    }
                                }
                                
                                if (!wardDetails.attendanceList) return info.originNode;
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

                <Tabs.TabPane tab={<span><CalendarOutlined /> Leave Application</span>} key="7">
                    <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {leaveView === 'list' ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <Title level={4} style={{ margin: 0 }}>My Leave Applications</Title>
                                    <Button type="primary" onClick={() => {
                                        setLeaveEditing(null);
                                        setLeaveForm({
                                            student: wardProfile?.name || '',
                                            from_date: new Date().toISOString().split('T')[0],
                                            to_date: new Date().toISOString().split('T')[0],
                                            attendance_based_on: 'Student Group',
                                            student_group: wardDetails.studentGroups?.[0] || '',
                                            mark_as_present: 0,
                                            reason: '',
                                            docstatus: 0
                                        });
                                        setLeaveView('form');
                                    }}>
                                        + Apply for Leave
                                    </Button>
                                </div>

                                <Table
                                    dataSource={leavesList}
                                    rowKey="name"
                                    loading={leavesLoading}
                                    pagination={{ pageSize: 10 }}
                                    scroll={{ x: 'max-content' }}
                                    columns={[
                                        { title: 'Application ID', dataIndex: 'name', key: 'name' },
                                        { title: 'Student Group', dataIndex: 'student_group', key: 'student_group' },
                                        { title: 'From Date', dataIndex: 'from_date', key: 'from_date' },
                                        { title: 'To Date', dataIndex: 'to_date', key: 'to_date' },
                                        { 
                                            title: 'Reason', 
                                            dataIndex: 'reason', 
                                            key: 'reason',
                                            ellipsis: true
                                        },
                                        {
                                            title: 'Status',
                                            dataIndex: 'docstatus',
                                            key: 'status',
                                            render: (docstatus) => (
                                                docstatus === 1 ? (
                                                    <Tag color="green">Approved</Tag>
                                                ) : docstatus === 2 ? (
                                                    <Tag color="red">Cancelled</Tag>
                                                ) : (
                                                    <Tag color="amber">Draft</Tag>
                                                )
                                            )
                                        },
                                        {
                                            title: 'Actions',
                                            key: 'actions',
                                            align: 'center',
                                            render: (_, record) => (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <Button size="small" onClick={() => {
                                                        setLeaveEditing(record.name);
                                                        setLeaveForm({
                                                            student: record.student || '',
                                                            from_date: record.from_date || '',
                                                            to_date: record.to_date || '',
                                                            attendance_based_on: record.attendance_based_on || 'Student Group',
                                                            student_group: record.student_group || '',
                                                            mark_as_present: record.mark_as_present || 0,
                                                            reason: record.reason || '',
                                                            docstatus: record.docstatus
                                                        });
                                                        setLeaveView('form');
                                                    }}>
                                                        {record.docstatus === 0 ? 'Edit' : 'View'}
                                                    </Button>
                                                    {record.docstatus === 0 && (
                                                        <Button size="small" style={{ borderColor: '#52c41a', color: '#52c41a' }} onClick={() => handleSubmitLeave(record.name)}>
                                                            Submit
                                                        </Button>
                                                    )}
                                                    {record.docstatus === 0 && (
                                                        <Button size="small" danger onClick={() => handleDeleteLeave(record.name)}>
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Title level={4} style={{ margin: 0 }}>
                                            {leaveEditing ? `Leave Application: ${leaveEditing}` : 'New Leave Application'}
                                        </Title>
                                        {leaveEditing && (
                                            leaveForm.docstatus === 1 ? (
                                                <Tag color="green">Approved</Tag>
                                            ) : leaveForm.docstatus === 2 ? (
                                                <Tag color="red">Cancelled</Tag>
                                            ) : (
                                                <Tag color="amber">Draft</Tag>
                                            )
                                        )}
                                        {!leaveEditing && <Tag color="red">Not Saved (Draft)</Tag>}
                                    </div>
                                    <Button onClick={() => setLeaveView('list')}>Back to List</Button>
                                </div>

                                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
                                    {/* Readonly indicators for submitted states */}
                                    {leaveEditing && leaveForm.docstatus === 1 && (
                                        <Alert 
                                            message="Submitted Document" 
                                            description="This leave application has been submitted and is read-only. It cannot be modified." 
                                            type="info" 
                                            showIcon 
                                            style={{ marginBottom: '20px', borderRadius: '8px' }}
                                        />
                                    )}
                                    
                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} sm={12}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Student ID</label>
                                            <input 
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" 
                                                value={wardProfile?.name || ''} 
                                                disabled 
                                            />
                                        </Col>

                                        <Col xs={24} sm={12}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Student Name</label>
                                            <input 
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" 
                                                value={wardProfile?.student_name || ''} 
                                                disabled 
                                            />
                                        </Col>
                                        
                                        <Col span={24}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Student Group *</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                                value={leaveForm.student_group} 
                                                onChange={e => setLeaveForm({ ...leaveForm, student_group: e.target.value })}
                                                disabled={leaveForm.docstatus === 1}
                                            >
                                                <option value="">Select Student Group</option>
                                                {wardDetails.studentGroups?.map(sg => (
                                                    <option key={sg} value={sg}>{sg}</option>
                                                ))}
                                            </select>
                                        </Col>

                                        <Col xs={24} sm={12}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>From Date *</label>
                                            <input 
                                                type="date"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                                value={leaveForm.from_date} 
                                                onChange={e => setLeaveForm({ ...leaveForm, from_date: e.target.value })} 
                                                disabled={leaveForm.docstatus === 1}
                                            />
                                        </Col>

                                        <Col xs={24} sm={12}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>To Date *</label>
                                            <input 
                                                type="date"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                                value={leaveForm.to_date} 
                                                onChange={e => setLeaveForm({ ...leaveForm, to_date: e.target.value })} 
                                                disabled={leaveForm.docstatus === 1}
                                            />
                                        </Col>

                                        <Col span={24}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Attendance Based On</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                                value={leaveForm.attendance_based_on} 
                                                onChange={e => setLeaveForm({ ...leaveForm, attendance_based_on: e.target.value })}
                                                disabled={leaveForm.docstatus === 1}
                                            >
                                                <option value="Student Group">Student Group</option>
                                                <option value="Course">Course</option>
                                            </select>
                                        </Col>

                                        <Col span={24}>
                                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Reason</label>
                                            <textarea 
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white h-28 resize-none"
                                                placeholder="Please state the reason for leave..."
                                                value={leaveForm.reason} 
                                                onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                                                disabled={leaveForm.docstatus === 1}
                                            />
                                        </Col>

                                        <Col span={24} style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                            <Button onClick={() => setLeaveView('list')}>Cancel</Button>
                                            {(!leaveEditing || leaveForm.docstatus === 0) && (
                                                <>
                                                    {leaveEditing && (
                                                        <Button 
                                                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }} 
                                                            loading={savingLeave} 
                                                            onClick={() => handleSubmitLeave(leaveEditing)}
                                                        >
                                                            Submit Leave
                                                        </Button>
                                                    )}
                                                    <Button type="primary" loading={savingLeave} onClick={handleSaveLeave}>
                                                        {leaveEditing ? 'Save Draft' : 'Create Draft'}
                                                    </Button>
                                                </>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        )}
                    </Card>
                </Tabs.TabPane>

                {enableOnlineFeePayment && (
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
                                                    <div className="flex items-center justify-start sm:justify-end gap-3 mt-2 sm:mt-0 flex-wrap">
                                                        <div className="flex flex-col items-start sm:items-end">
                                                            {record.discount_amount > 0 && (
                                                                <span className="text-[10px] line-through text-gray-400">₹{record.original_fee?.toLocaleString()}</span>
                                                            )}
                                                            <span className={`text-sm font-bold ${isPaid ? 'text-green-600' : 'text-indigo-600'}`}>₹{v.toLocaleString()}</span>
                                                            {record.discount_amount > 0 && (
                                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded-sm w-fit mt-0.5">-₹{record.discount_amount.toLocaleString()} Off {record.discount_name ? `(${record.discount_name})` : ''}</span>
                                                            )}
                                                        </div>
                                                        {isPaid ? (
                                                            <div className="flex items-center gap-1">
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
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <Tag color="red" className="text-[10px] font-bold rounded-md uppercase m-0 border-none px-2 py-0">Unpaid</Tag>
                                                                <Button 
                                                                    type="primary" 
                                                                    size="small" 
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold h-7 px-3 rounded-lg border-none"
                                                                    onClick={() => handlePayNow(record)}
                                                                >
                                                                    PAY NOW
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        }
                                    ]}
                                />
                                
                                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center px-6 pb-6 bg-indigo-50/20 rounded-b-2xl flex-wrap gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Grand Total</span>
                                        <span className="text-sm font-black text-gray-700">TOTAL ACADEMIC FEES</span>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end">
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
                                        <div className="text-2xl font-black text-indigo-600 mt-2 border-t border-indigo-200/50 pt-2 min-w-[120px] text-left sm:text-right">
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
                )}
                {enableOnlineFeePayment && (
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
                                { 
                                  title: 'Amount', 
                                  dataIndex: 'amount', 
                                  key: 'amount', 
                                  render: (text, rec) => (
                                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                        {rec.discount_amount > 0 && (
                                            <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 11, marginBottom: '-2px' }}>
                                                ₹{rec.original_fee?.toLocaleString()}
                                            </div>
                                        )}
                                        <span className="font-semibold text-gray-800">₹{text?.toLocaleString()}</span>
                                        {rec.discount_amount > 0 && (
                                            <span style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, background: '#f3e8ff', padding: '0 6px', borderRadius: 4, marginTop: 2 }}>
                                                -₹{rec.discount_amount.toLocaleString()} Off {rec.discount_name ? `(${rec.discount_name})` : ''}
                                            </span>
                                        )}
                                    </div>
                                  ) 
                                },
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
                )}
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mb-4 px-2">
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
                            <div className="flex flex-wrap items-center justify-between gap-6 border-t pt-6">
                                <div className="flex-1 min-w-[200px]">
                                    <Checkbox 
                                        checked={termsAccepted} 
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="text-[11px] text-gray-500 font-medium leading-tight"
                                    >
                                        I confirm that all details are correct. I agree to the <span className="text-indigo-600 underline">Terms</span>.
                                    </Checkbox>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
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
