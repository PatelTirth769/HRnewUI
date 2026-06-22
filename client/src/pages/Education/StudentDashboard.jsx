import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Statistic, List, Avatar, Tag, Spin, notification, Empty, Descriptions, Divider, Button, Alert, Badge, Modal, Checkbox, Tabs, Table, Calendar } from 'antd';
import { 
  BookOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  WalletOutlined,
  UserOutlined,
  NotificationOutlined,
  LoadingOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  LockOutlined,
  CreditCardOutlined,
  RightOutlined,
  DownloadOutlined,
  TableOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import API from '../../services/api';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import FeeReceiptTemplate from './FeeReceiptTemplate';
import { generateAdmissionReceipt } from '../Enquiry/AdmissionFeeReceipt';
import { useRef } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user')?.trim() || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('');
  const [studentData, setStudentData] = useState({
    profile: null,
    attendance: 0,
    courses: 0,
    assignments: 0,
    fees: 0,
    schedule: [],
    fullSchedule: [],
    notifications: [],
    studentGroups: [],
    classTeacher: '',
    homework: [],
    classwork: [],
    timetablePhoto: null,
    permissions: {
      fees: true,
      attendance: true,
      schedule: true,
      assessments: true
    }
  });

  // Payment Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paidTerms, setPaidTerms] = useState({});
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const receiptRef = useRef(null);
  const [announcements, setAnnouncements] = useState([]);
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
        student: studentData.profile?.name,
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
      await fetchStudentLeaves(studentData.profile?.name);
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
      await fetchStudentLeaves(studentData.profile?.name);
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
      await fetchStudentLeaves(studentData.profile?.name);
    } catch (err) {
      console.error('Delete leave error:', err);
      notification.error({ message: 'Delete Failed', description: err.message });
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const email = localStorage.getItem('user')?.trim() || '';
      if (!email) {
        setError('No logged-in user email found.');
        setLoading(false);
        return;
      }
      
      // 1. Find Student Record
      let student = null;
      // Try Stage 1 & 2
      try {
        const resFilter = await API.get('/api/resource/Student', {
          params: {
            filters: `[["user","=","${email}"]]`,
            fields: '["name"]'
          }
        });
        if (resFilter.data?.data?.length > 0) student = resFilter.data.data[0];
      } catch (e) {}

      if (!student) {
        try {
          const resEmail = await API.get('/api/resource/Student', {
            params: {
              filters: `[["student_email_id","=","${email}"]]`,
              fields: '["name"]'
            }
          });
          if (resEmail.data?.data?.length > 0) student = resEmail.data.data[0];
        } catch (e) {}
      }

      // Stage 3 Scan
      if (!student) {
        try {
          const resAll = await API.get('/api/resource/Student', { params: { fields: '["name", "student_email_id", "user"]', limit_page_length: 500 } });
          student = (resAll.data?.data || []).find(s => 
            (s.user && s.user.toLowerCase() === email.toLowerCase()) || 
            (s.student_email_id && s.student_email_id.toLowerCase() === email.toLowerCase())
          );
        } catch (e) {}
      }

      if (!student) {
        setLoading(false);
        return;
      }

      // Fetch Full Profile
      const fullRes = await API.get(`/api/resource/Student/${encodeURIComponent(student.name)}`);
      const profile = fullRes.data?.data;
      const studentId = student.name;

      if (profile && profile.guardians && profile.guardians.length > 0) {
        for (let g of profile.guardians) {
          if (g.guardian) {
            try {
              const guardianRes = await API.get(`/api/resource/Guardian/${encodeURIComponent(g.guardian)}`);
              const guardianDoc = guardianRes.data?.data;
              if (guardianDoc && guardianDoc.email_address) {
                g.guardian_email_address = guardianDoc.email_address;
              }
            } catch (e) {
              console.warn('Failed to fetch guardian details for email:', e.message);
            }
          }
        }
      }

      // Fetch Student Group memberships
      let studentGroups = [];

      // Fetch paid terms from Firebase (Standard Terms + Admission/Registration Fees)
      try {
        const [historyRes, admHistoryRes] = await Promise.allSettled([
          axios.get(`/local-api/payment/history/${encodeURIComponent(studentId)}`),
          axios.get('/local-api/admission-payment/history-all')
        ]);

        const paidMap = {};
        const verifiedHistory = [];

        // 1. Process standard term fee payments
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

        // 2. Process admission and registration fee payments matching this student/email
        if (admHistoryRes.status === 'fulfilled' && admHistoryRes.value.data?.success && admHistoryRes.value.data?.data) {
          const cleanStudentName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim().toLowerCase();
          const cleanEmail = (profile?.student_email_id || email).trim().toLowerCase();

          admHistoryRes.value.data.data.forEach(admPay => {
            if (admPay.status === 'verified') {
              const payStudentName = (admPay.student_name || '').trim().toLowerCase();
              const payParentEmail = (admPay.parent_email || '').trim().toLowerCase();
              
              // Match logic: verify if the payment corresponds to the active user profile
              if (
                (payParentEmail && payParentEmail === cleanEmail) ||
                (payStudentName && cleanStudentName && payStudentName.includes(cleanStudentName)) ||
                (admPay.admission_no && admPay.admission_no === studentId)
              ) {
                const categoryLabel = admPay.fee_name || admPay.fee_type || 'Admission Fee';
                // Keep admission/registration fee records separate from the academic term fees paidMap calculation
                // so they show up beautifully under transaction records but do not incorrectly reduce the term fee pending sum.
                const mappedRecord = {
                  ...admPay,
                  fees_category: categoryLabel,
                  payment_id: admPay.receipt_no || admPay.payment_id || admPay.order_id,
                  amount: admPay.amount,
                  verified_at: admPay.verified_at || admPay.receipt_date || admPay.created_at
                };
                // Only push if not already added to avoid transaction duplicates
                if (!verifiedHistory.some(h => h.payment_id === mappedRecord.payment_id)) {
                  verifiedHistory.push(mappedRecord);
                }
              }
            }
          });
        }

        setPaidTerms(paidMap);
        setPaymentHistory(verifiedHistory);
      } catch (err) {
        console.warn('[StudentDashboard] Could not fetch complete payment history streams:', err.message);
      }

      // Parallel Data Fetch with Individual Error Handling
      const [attRes, enrRes, feeRes, assRes] = await Promise.allSettled([
        API.get('/api/resource/Student Attendance', { params: { filters: JSON.stringify([["student", "=", studentId]]), fields: JSON.stringify(["name", "date", "status", "student", "student_name", "student_group"]), limit_page_length: 1000 } }),
        API.get('/api/resource/Program Enrollment', { 
          params: { 
            filters: JSON.stringify([["student", "=", studentId]]), 
            fields: JSON.stringify(["name", "program"]) // Removed fee_structure to avoid 417
          } 
        }),
        API.get('/api/resource/Fees', { 
          params: { 
            filters: JSON.stringify([["student", "=", studentId], ["outstanding_amount", ">", 0]]), 
            fields: JSON.stringify(["name", "outstanding_amount"]) // Minimal fields
          } 
        }),
        API.get('/api/resource/Assessment Result', { params: { filters: JSON.stringify([["student", "=", studentId]]) } })
      ]);

      const permissions = {
        attendance: attRes.status === 'fulfilled',
        enrollment: enrRes.status === 'fulfilled',
        fees: feeRes.status === 'fulfilled' || feeRes.reason?.response?.status === 403,
        assessments: assRes.status === 'fulfilled'
      };

      const attendanceList = attRes.status === 'fulfilled' ? (attRes.value.data?.data || []) : [];
      const presentDays = attendanceList.filter(a => a.status === 'Present').length;
      const feeList = feeRes.status === 'fulfilled' ? (feeRes.value.data?.data || []) : [];
      
      const enrollmentData = enrRes.status === 'fulfilled' ? (enrRes.value.data?.data || []) : [];

      // --- Fallback Student Group Fetching ---
      // Since ERPNext restricts direct child table access (Student Group Student) for students (causing 403s),
      // we extract the student group/batch from their Program Enrollment record.

      if (enrollmentData.length > 0) {
        try {
          const enrollmentName = enrollmentData[0].name;
          const fullEnrRes = await API.get(`/api/resource/Program Enrollment/${encodeURIComponent(enrollmentName)}`);
          const enrDoc = fullEnrRes.data?.data || {};

          const fallbackGroup = enrDoc.student_group || enrDoc.student_batch_name || enrDoc.student_batch;
          if (fallbackGroup) {
            studentGroups.push(fallbackGroup);
          } else if (profile?.student_group || profile?.student_batch) {
             studentGroups.push(profile.student_group || profile.student_batch);
          }
        } catch(e) {
          console.error('FAILED to fetch full program enrollment details:', e.message);
        }
      } else {
         if (profile?.student_group || profile?.student_batch) {
             studentGroups.push(profile.student_group || profile.student_batch);
         }
      }
      // --- Fallback 1: Query Student Group doctype directly ---
      // If User Permissions are configured in ERPNext, querying Student Group directly 
      // will return only the groups this student is a member of.
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
        console.error('FAILED direct Student Group query:', e.message);
      }

      // --- Course Schedule Fetching ---
      // Now that we have definitively determined the student's groups, we fetch their specific schedule.
      let schRes;
      let scheduleStatus = false;
      try {
         const scheduleFilters = [["schedule_date", "=", new Date().toISOString().split('T')[0]]];
         if (studentGroups.length > 0) {
            scheduleFilters.push(["student_group", "in", studentGroups]);
         } else {
            // If the student has no groups, we force an impossible filter so it returns empty,
            // or we could skip fetching. Let's filter by student_group = 'NONE' so it returns [].
            scheduleFilters.push(["student_group", "=", "NONE_ASSIGNED_TO_STUDENT"]);
         }

         schRes = await API.get('/api/resource/Course Schedule', { 
            params: { 
               filters: JSON.stringify(scheduleFilters), 
               fields: JSON.stringify(["course", "from_time", "to_time", "room"]), 
               order_by: 'from_time asc' 
            } 
         });
         scheduleStatus = true;
      } catch (e) {
         console.warn('[StudentDashboard] Failed to fetch filtered Course Schedule:', e.message);
      }
      permissions.schedule = scheduleStatus;

      // --- Full Schedule (Time Table) Fetching ---
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
          console.warn('[StudentDashboard] Failed to fetch Full Schedule:', e.message);
        }
      }

      // --- Class Teacher Fetching ---
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
              console.warn('[StudentDashboard] Failed to fetch Instructor details for class teacher:', e.message);
            }
          }
        } catch (e) {
          console.warn('[StudentDashboard] Failed to fetch Student Group details for class teacher:', e.message);
        }
      }

      let linkedFeeStructure = (enrollmentData.length > 0 && enrollmentData[0].fee_structure) 
        ? enrollmentData[0].fee_structure 
        : (profile.fee_structure || null);

      // Stage 3: Search for a Fee Structure record that matches the Program name
      const programToSearch = (enrollmentData.length > 0 && enrollmentData[0].program) 
        ? enrollmentData[0].program 
        : (profile.program || null);

      if (!linkedFeeStructure && programToSearch) {
        try {
          let filters = [["program", "=", programToSearch]];
          if (profile.custom_board) {
            filters.push(["company", "=", profile.custom_board]);
          }

          const fsRes = await API.get('/api/resource/Fee Structure', {
            params: {
              filters: JSON.stringify(filters),
              fields: JSON.stringify(["name"])
            }
          });
          if (fsRes.data?.data?.length > 0) {
            linkedFeeStructure = fsRes.data.data[0].name;
          } else if (profile.custom_board) {
            const fsResFallback = await API.get('/api/resource/Fee Structure', {
              params: {
                filters: JSON.stringify([["program", "=", programToSearch]]),
                fields: JSON.stringify(["name"])
              }
            });
            if (fsResFallback.data?.data?.length > 0) {
              linkedFeeStructure = fsResFallback.data.data[0].name;
            }
          }

          if (!linkedFeeStructure) {
            try {
              const fsExact = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(programToSearch)}`);
              if (fsExact.data?.data) {
                linkedFeeStructure = fsExact.data.data.name;
              }
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          console.error('Fee Structure search failed:', e.response?.status || e.message);
        }
      }

      let feeStructureDetails = null;
      if (linkedFeeStructure) {
        try {
          const fsFull = await API.get(`/api/resource/Fee Structure/${encodeURIComponent(linkedFeeStructure)}`);
          feeStructureDetails = fsFull.data?.data;
        } catch (e) {
          console.error('Failed to fetch Fee Structure details:', e);
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

        const studentProgram = profile?.program;
        
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
        console.error('Error fetching work for student dashboard:', err);
      }

      // Fetch Announcements from Firestore and filter for this student
      let filteredAnnouncements = [];
      try {
        const annRef = collection(db, 'schooler_system/announcements/records');
        const annSnap = await getDocs(annRef);
        const allAnnouncements = annSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
          });
        const studentProgram = profile?.program || '';
        const studentBoard   = profile?.custom_board || '';
        filteredAnnouncements = allAnnouncements.filter(ann => {
          if (ann.targetType === 'All') return true;
          if (ann.targetType === 'Program' && ann.targetValue === studentProgram) return true;
          if (ann.targetType === 'Board'   && ann.targetValue === studentBoard)   return true;
          if (ann.targetType === 'StudentGroup' && studentGroups.includes(ann.targetValue)) return true;
          if (ann.targetType === 'Student') {
            if (Array.isArray(ann.targetValue)) {
              return ann.targetValue.includes(profile?.name);
            }
            return ann.targetValue === profile?.name;
          }
          return false;
        });
      } catch (annErr) {
        console.error('[StudentDashboard] Could not fetch announcements:', annErr);
      }

      // Fetch Discounts and Apply
      let studentDiscountsMap = {};
      let feeDiscountsMap = {};
      try {
        const studentId = profile?.name;
        if (studentId) {
            const sdSnaps = await getDocs(collection(db, 'schooler_system', 'data', 'student_discounts'));
            sdSnaps.forEach(doc => {
                const data = doc.data();
                if (data.student_id === studentId) {
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
        let originalTotal = parseFloat(fee.grand_total) || 0;
        let discountAmount = 0;
        const studentId = fee.student;
        if (feeStructureDetails) {
            const termComp = feeStructureDetails.components?.find(c => c.fees_category === fee.academic_term || c.name === fee.academic_term);
            if (termComp) {
                const originalTermAmount = parseFloat(termComp.amount) || 0;
                if (fee.grand_total < originalTermAmount) {
                    discountAmount = originalTermAmount - fee.grand_total;
                    originalTotal = originalTermAmount;
                } else if (studentDiscountsMap[studentId]) {
                    const activeDiscount = studentDiscountsMap[studentId][0];
                    if (activeDiscount && feeDiscountsMap[activeDiscount.discount_id]) {
                        if (!activeDiscount.terms || activeDiscount.terms.length === 0 || activeDiscount.terms.includes(fee.academic_term)) {
                            const fd = feeDiscountsMap[activeDiscount.discount_id];
                            if (fd.percentage > 0) {
                                discountAmount = (originalTermAmount * fd.percentage) / 100;
                                fee.grand_total = originalTermAmount - discountAmount;
                                if (fee.outstanding_amount > 0) fee.outstanding_amount = fee.grand_total;
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
              const studentId = profile?.name;
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
      
      // Fetch timetable photo from Firestore
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
          console.warn('[StudentDashboard] Failed to fetch timetable photo:', e.message);
        }
      }
      
      setStudentData({
        profile,
        studentGroups,
        classTeacher: classTeacherName,
        permissions,
        feeStructure: linkedFeeStructure,
        feeStructureDetails,
        attendanceList: attendanceList,
        attendance: attendanceList.length > 0 ? Math.round((presentDays / attendanceList.length) * 100) : 0,
        courses: enrollmentData.length || 0,
        assignments: homework.length + classwork.length,
        fees: feeList.reduce((sum, f) => sum + (f.outstanding_amount || 0), 0),
        feeRecords: feeList,
        schedule: scheduleStatus ? (schRes.data?.data || []) : [],
        fullSchedule,
        homework,
        classwork,
        notifications: filteredAnnouncements,
        timetablePhoto: timetablePhotoData,
      });

      // Fetch Student Leave Applications
      await fetchStudentLeaves(studentId);

    } catch (err) {
      console.error('Dashboard Error:', err);
      setError('Critical error loading profile.');
    } finally {
      setLoading(false);
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
        student_id: studentData.profile?.name,
        student_name: studentData.profile?.student_name || studentData.profile?.name,
        guardian_email: studentData.profile?.student_email_id || userEmail,
        fee_structure: studentData.feeStructure,
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
          name: "SSV School Fee Payment",
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
                  description: `${amount.toLocaleString()} paid for ${feesCategory}. Verified & Recorded in System.`,
                  key: 'verify_pay',
                  duration: 8
                });

                // Refresh data
                fetchAllData();
              } else {
                setPaymentProcessing(false);
                notification.error({ 
                  message: 'Verification Failed', 
                  description: verifyRes.data.message || 'Payment failed verification.', 
                  key: 'verify_pay'
                });
              }
            } catch (err) {
              console.error('Verification Error:', err);
              setPaymentProcessing(false);
              notification.warning({ 
                message: '⚠️ Verification Pending', 
                description: 'Payment succeeded but verification failed. Do not pay again.', 
                key: 'verify_pay'
              });
            }
          },
          prefill: {
            name: payload.student_name,
            email: payload.guardian_email,
          },
          notes: {
            student_id: payload.student_id,
            fees_category: feesCategory
          },
          theme: { color: "#4F46E5" },
          modal: {
            ondismiss: function() {
              setPaymentProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error('Payment Initialization Error:', err);
      setPaymentProcessing(false);
      notification.error({ message: 'Payment Error', description: err.message });
    }
  };

  const handleDownloadReceipt = (record) => {
    // Intercept admission or registration fee payments to render identical PDF layout as Enquiry module
    const isAdmissionStream = record.fee_type || record.fee_name || record.receipt_no?.includes('ADM-');
    if (isAdmissionStream) {
      const activeGuardian = (profile && profile.guardians && profile.guardians.length > 0) ? profile.guardians[0].guardian_name : '';
      generateAdmissionReceipt({
        receipt_no: record.receipt_no || record.payment_id || record.order_id || 'N/A',
        student_name: record.student_name || profile?.student_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
        registration_no: record.registration_no || '',
        admission_no: record.admission_no || profile?.name || '',
        program: record.program || profile?.program || '',
        academic_year: record.academic_year || '2026-2027',
        fee_type: record.fee_type || 'Admission',
        fee_name: record.fee_name || record.fees_category || 'Admission Fee',
        amount: record.amount,
        payment_mode: record.payment_mode || 'ONLINE',
        payment_id: record.payment_id || record.order_id || '',
        receipt_date: record.receipt_date || record.verified_at || record.created_at || new Date().toISOString(),
        parent_name: record.parent_name || activeGuardian || '',
        parent_mobile: record.parent_mobile || profile?.student_mobile_number || ''
      });
      return;
    }

    const dateObj = new Date(record.receipt_date || record.verified_at || record.created_at);
    const formattedDate = dateObj.toLocaleDateString('en-GB') + ' ' + dateObj.toLocaleTimeString('en-US');
    
    const receiptData = {
      enrollmentNo: profile?.name,
      studentName: record.student_name || profile?.student_name || `${profile?.first_name} ${profile?.last_name}`,
      courseName: profile?.program,
      semester: record.fees_category || 'N/A',
      receiptDate: formattedDate,
      receiptNo: record.payment_id || record.order_id,
      amount: record.amount,
      feeName: record.fees_category,
      paymentMode: record.payment_mode ? `${record.payment_mode} PAYMENT` : 'ONLINE PAYMENT',
      transactionNo: record.payment_id || 'N/A',
      original_fee: record.original_fee || 0,
      discount_amount: record.discount_amount || 0,
      discount_name: record.discount_name || '',
      discount_percentage: record.discount_percentage || 0,
      studentGroup: profile?.student_group || record.student_group || record.section || ''
    };

    setSelectedReceipt(receiptData);

    setTimeout(() => {
      if (receiptRef.current) {
        const opt = {
          margin: 0.3,
          filename: `Receipt_${receiptData.receiptNo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 700, width: 700 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(receiptRef.current).save().then(() => {
          notification.success({ message: 'Receipt Downloaded Successfully' });
          setSelectedReceipt(null);
        });
      }
    }, 500);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '20px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <Text type="secondary">Loading Academic Records...</Text>
      </div>
    );
  }

  const totalPaidAmount = Object.values(paidTerms).reduce((sum, term) => sum + (term.amount || 0), 0);
  
  let remainingPendingFees = 0;
  let originalRemainingPendingFees = 0;
  
  if (studentData.feeStructureDetails && studentData.feeStructureDetails.components) {
      studentData.feeStructureDetails.components.forEach(comp => {
          const cat = comp.fees_category || comp.name;
          if (!paidTerms[cat]) {
              remainingPendingFees += (comp.amount || 0);
              originalRemainingPendingFees += (comp.original_fee || comp.amount || 0);
          }
      });
  } else {
      const fallbackTotal = studentData.feeStructureDetails?.total_amount || 0;
      remainingPendingFees = Math.max(0, fallbackTotal - totalPaidAmount);
      originalRemainingPendingFees = remainingPendingFees;
  }
  
  let totalDiscount = 0;
  let activeDiscountName = '';
  
  if (studentData.feeStructureDetails) {
    totalDiscount = originalRemainingPendingFees - remainingPendingFees;
    if (studentData.feeStructureDetails.components) {
       const compWithDiscount = studentData.feeStructureDetails.components.find(c => c.discount_amount > 0);
       if (compWithDiscount && compWithDiscount.discount_name) activeDiscountName = compWithDiscount.discount_name;
    }
  } 
  
  if (studentData.feeRecords && studentData.feeRecords.length > 0) {
    const originalPending = studentData.feeRecords.reduce((sum, f) => sum + (f.original_fee || f.outstanding_amount || 0), 0);
    // If we didn't calculate a discount from feeStructure, try feeRecords
    if (!studentData.feeStructureDetails) {
      totalDiscount = originalPending - studentData.fees;
    }
    // Always try to grab the discount name from feeRecords if it wasn't found
    if (!activeDiscountName) {
      const recWithDiscount = studentData.feeRecords.find(f => f.discount_amount > 0);
      if (recWithDiscount && recWithDiscount.discount_name) {
          activeDiscountName = recWithDiscount.discount_name;
      }
    }
  }

  const profile = studentData.profile;
  const studentName = profile ? `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim() : userEmail;
  const guardianName = (profile && profile.guardians && profile.guardians.length > 0) ? profile.guardians[0].guardian_name : 'N/A';

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 32px)' }}>Student Dashboard</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>Welcome back, <b>{studentName}</b>.</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Button icon={<SyncOutlined />} onClick={fetchAllData} shape="round">Sync Data</Button>
          <Avatar size={{ xs: 48, sm: 64 }} src={profile?.image} icon={<UserOutlined />} style={{ border: '3px solid #1890ff', background: '#fff' }} />
        </div>
      </div>

      {!profile ? (
        <Card style={{ borderRadius: '16px', textAlign: 'center', padding: '40px' }}>
          <Empty description={<span>No Profile Linked to <b>{userEmail}</b></span>} />
        </Card>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.attendance ? (
                  <Statistic title="ATTENDANCE" value={studentData.attendance} suffix="%" valueStyle={{ color: '#52c41a', fontWeight: 800 }} prefix={<CalendarOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.enrollment ? (
                  <Statistic title="PROGRAMS" value={studentData.courses} valueStyle={{ color: '#1890ff', fontWeight: 800 }} prefix={<BookOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.assessments ? (
                  <Statistic title="HOMEWORK" value={studentData.assignments} valueStyle={{ color: '#faad14', fontWeight: 800 }} prefix={<FileTextOutlined />} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                {studentData.permissions.fees ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Statistic 
                      title="PENDING FEES" 
                      value={studentData.feeStructureDetails ? remainingPendingFees : studentData.fees} 
                      valueStyle={{ color: '#ff4d4f', fontWeight: 800 }} 
                      prefix={<WalletOutlined />} 
                      precision={2} 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                    />
                    {totalDiscount > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                         <span style={{ textDecoration: 'line-through' }}>₹{(studentData.feeStructureDetails ? originalRemainingPendingFees : (studentData.fees + totalDiscount)).toLocaleString()}</span>
                         <span style={{ marginLeft: 6, color: '#a855f7', fontWeight: 'bold', background: '#f3e8ff', padding: '2px 6px', borderRadius: 4 }}>
                            -₹{totalDiscount.toLocaleString()} Off {activeDiscountName ? `(${activeDiscountName})` : ''}
                         </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px' }}><LockOutlined style={{ color: '#bfbfbf', fontSize: '24px' }} /><br/><Text type="secondary">Access Locked</Text></div>
                )}
              </Card>
            </Col>
          </Row>

          <Tabs defaultActiveKey="1" className="guardian-tabs" style={{ marginTop: '32px' }}>
            <Tabs.TabPane tab={<span><IdcardOutlined /> Profile</span>} key="1">
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} bordered size="large">
                      <Descriptions.Item label="Student ID"><Text strong>{profile.name}</Text></Descriptions.Item>
                      <Descriptions.Item label="Joining Date">{profile.joining_date}</Descriptions.Item>
                      <Descriptions.Item label="Program (Class)"><Tag color="blue">{profile.program || 'N/A'}</Tag></Descriptions.Item>
                      <Descriptions.Item label="Board"><Tag color="geekblue">{profile.custom_board || 'N/A'}</Tag></Descriptions.Item>
                      <Descriptions.Item label="Student Group">
                        {studentData.studentGroups && studentData.studentGroups.length > 0 ? (
                          studentData.studentGroups.map(group => <Tag color="cyan" key={group}>{group}</Tag>)
                        ) : <Text type="secondary">N/A</Text>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Class Teacher">
                        <span className="font-semibold text-blue-600 flex items-center gap-1.5">
                          <UserOutlined /> {studentData.classTeacher || 'Not Assigned'}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Fee Structure">
                        <Text strong style={{ color: '#ff4d4f' }}>
                          <WalletOutlined style={{ marginRight: '8px' }} />
                          {studentData.feeStructure || 'Not Defined'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Gender">{profile.gender}</Descriptions.Item>
                      <Descriptions.Item label="Email"><MailOutlined style={{ color: '#888', marginRight: '8px' }} /> {profile.student_email_id}</Descriptions.Item>
                      <Descriptions.Item label="Mobile"><PhoneOutlined style={{ color: '#888', marginRight: '8px' }} /> {profile.student_mobile_number}</Descriptions.Item>
                      <Descriptions.Item label="Status"><Badge status="processing" text="Active" /></Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title={<span><NotificationOutlined style={{ color: '#faad14', marginRight: '8px' }} /> Announcements</span>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    {studentData.notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                        <p style={{ fontSize: 13 }}>No announcements for you yet.</p>
                      </div>
                    ) : (
                      <List
                        dataSource={studentData.notifications}
                        renderItem={item => (
                          <List.Item style={{ padding: '10px 0', alignItems: 'flex-start' }}>
                            <div style={{
                              width: '100%',
                              background: item.targetType === 'All' ? '#eef2ff' : item.targetType === 'Board' ? '#e0f2fe' : item.targetType === 'StudentGroup' ? '#d1fae5' : '#fef3c7',
                              border: `1px solid ${item.targetType === 'All' ? '#c7d2fe' : item.targetType === 'Board' ? '#bae6fd' : item.targetType === 'StudentGroup' ? '#a7f3d0' : '#fde68a'}`,
                              borderRadius: 10,
                              padding: '12px 14px',
                            }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937', marginBottom: 4 }}>{item.title}</div>
                              <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>{item.message}</div>
                              {item.createdAt && (
                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
                                  {item.createdAt.toDate ? item.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                </div>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                  {profile.guardians && profile.guardians.length > 0 && (
                    <Card 
                      title={<span><UserOutlined style={{ color: '#722ed1', marginRight: '8px' }} /> Linked Guardians</span>} 
                      bordered={false} 
                      style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '24px' }}
                    >
                      <List 
                        dataSource={profile.guardians} 
                        renderItem={g => (
                          <List.Item>
                            <List.Item.Meta 
                              avatar={<Avatar icon={<UserOutlined />} />} 
                              title={g.guardian_name} 
                              description={
                                <div className="flex flex-col gap-1 mt-1">
                                  <div><Tag color="purple">{g.relation}</Tag></div>
                                  {g.guardian_email_address && (
                                    <div className="text-gray-500 text-xs flex items-center gap-1">
                                      <MailOutlined /> {g.guardian_email_address}
                                    </div>
                                  )}
                                </div>
                              } 
                            />
                          </List.Item>
                        )} 
                      />
                    </Card>
                  )}
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<span><BookOutlined /> Work</span>} key="2">
              <Card 
                bordered={false} 
                style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                bodyStyle={{ padding: '12px 24px 24px 24px' }}
              >
                <Tabs defaultActiveKey="homework" type="line" size="middle">
                  <Tabs.TabPane tab={<span>Homework ({studentData.homework.length})</span>} key="homework">
                    <List
                      dataSource={studentData.homework}
                      locale={{ emptyText: <Empty description="No homework assignments found for your class." /> }}
                      renderItem={item => {
                        const isOverdue = dayjs(item.dueDate).isBefore(dayjs(), 'day') && item.status !== 'Completed';
                        return (
                          <List.Item
                            style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <List.Item.Meta
                                style={{ flex: '1 1 300px' }}
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
                  
                  <Tabs.TabPane tab={<span>Classwork ({studentData.classwork.length})</span>} key="classwork">
                    <List
                      dataSource={studentData.classwork}
                      locale={{ emptyText: <Empty description="No classwork assignments found for your class." /> }}
                      renderItem={item => {
                        const isOverdue = dayjs(item.classworkDate).isBefore(dayjs(), 'day') && item.status !== 'Completed';
                        return (
                          <List.Item
                            style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                          >
                            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <List.Item.Meta
                                style={{ flex: '1 1 300px' }}
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

            {enableOnlineFeePayment && (
            <Tabs.TabPane tab={<span><WalletOutlined /> Fee Details</span>} key="3">
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {studentData.feeRecords && studentData.feeRecords.length > 0 ? (
                  <List
                    dataSource={studentData.feeRecords}
                    renderItem={item => {
                      const isPaid = paidTerms[item.name] || item.outstanding_amount === 0;
                      return (
                        <List.Item>
                          <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                            <List.Item.Meta 
                              style={{ flex: '1 1 200px' }}
                              title={<Text strong>{item.name}</Text>} 
                              description={isPaid ? <Text type="success" size="small">Paid on {new Date(paidTerms[item.name]?.paid_at || Date.now()).toLocaleDateString()}</Text> : `Due: ${item.due_date}`} 
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  {item.discount_amount > 0 && (
                                      <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 11, marginBottom: '-2px' }}>
                                          ₹{item.original_fee?.toLocaleString()}
                                      </div>
                                  )}
                                  <span className="font-bold">₹{item.outstanding_amount.toLocaleString()}</span>
                                  {item.discount_amount > 0 && (
                                      <span style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, background: '#f3e8ff', padding: '0 6px', borderRadius: 4, marginTop: 2 }}>
                                          -₹{item.discount_amount.toLocaleString()} Off {item.discount_name ? `(${item.discount_name})` : ''}
                                      </span>
                                  )}
                              </div>
                              <Tag color={isPaid ? "green" : "red"} style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>{isPaid ? "PAID" : "UNPAID"}</Tag>
                              {!isPaid && (
                                <Button 
                                  type="primary" 
                                  size="small" 
                                  shape="round"
                                  style={{ fontSize: '10px', height: '24px' }}
                                  onClick={() => handlePayNow(item)}
                                >
                                  PAY NOW
                                </Button>
                              )}
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                ) : studentData.feeStructureDetails ? (
                  <div>
                    <Alert 
                      message="Scheduled Fees" 
                      description={`Showing components for: ${studentData.feeStructure}`} 
                      type="warning" 
                      showIcon 
                      style={{ marginBottom: '16px', borderRadius: '8px' }} 
                    />
                    <List
                      dataSource={studentData.feeStructureDetails.components}
                      renderItem={item => {
                        const t = item.fees_category || "";
                        const isPaid = paidTerms[t];
                        let dueDate = "";
                        if (t.includes("Q1")) dueDate = "Payable by 10th March";
                        else if (t.includes("Q2")) dueDate = "Payable by 10th June";
                        else if (t.includes("Q3")) dueDate = "Payable by 10th Sep";
                        else if (t.includes("Q4")) dueDate = "Payable by 10th Dec";

                        return (
                          <List.Item>
                            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                              <List.Item.Meta 
                                style={{ flex: '1 1 200px' }}
                                title={t} 
                                description={isPaid ? <Text type="success" style={{ fontSize: '10px' }}>✓ Paid on {new Date(isPaid.paid_at).toLocaleDateString()}</Text> : (dueDate && <span style={{ fontSize: '10px', color: '#8c8c8c' }}>{dueDate}</span>)}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {item.discount_amount > 0 && (
                                        <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 11, marginBottom: '-2px' }}>
                                            ₹{item.original_fee?.toLocaleString()}
                                        </div>
                                    )}
                                    <span className="font-bold">₹{item.amount.toLocaleString()}</span>
                                    {item.discount_amount > 0 && (
                                        <span style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, background: '#f3e8ff', padding: '0 6px', borderRadius: 4, marginTop: 2 }}>
                                            -₹{item.discount_amount.toLocaleString()} Off {item.discount_name ? `(${item.discount_name})` : ''}
                                        </span>
                                    )}
                                </div>
                                <Tag color={isPaid ? "green" : "red"} style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>{isPaid ? "PAID" : "UNPAID"}</Tag>
                                {!isPaid && (
                                  <Button 
                                    type="primary" 
                                    size="small" 
                                    shape="round"
                                    style={{ fontSize: '10px', height: '24px' }}
                                    onClick={() => handlePayNow(item)}
                                  >
                                    PAY NOW
                                  </Button>
                                )}
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', items: 'center', padding: '0 16px' }}>
                      <Text strong>Total Expected Amount</Text>
                      <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>₹{studentData.feeStructureDetails.total_amount?.toLocaleString()}</Text>
                    </div>
                  </div>
                ) : (
                  <Empty description="No pending fees or defined fee structure found." />
                )}
              </Card>
            </Tabs.TabPane>
            )}

            {enableOnlineFeePayment && (
            <Tabs.TabPane tab={<span><WalletOutlined /> Fees Receipt Transaction</span>} key="4">
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Table 
                  dataSource={paymentHistory}
                  rowKey="order_id"
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 'max-content' }}
                  columns={[
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
                    { title: 'Receipt No', dataIndex: 'payment_id', key: 'receipt_no' },
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
            <Tabs.TabPane tab={<span><TableOutlined /> Time Table</span>} key="5">
              {studentData.timetablePhoto ? (
                <Card 
                  bordered={false} 
                  style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  title={<span style={{ fontSize: '16px', fontWeight: 700 }}>Weekly Time Table</span>}
                  extra={
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        type="primary" 
                        shape="round" 
                        href={studentData.timetablePhoto.fileUrl} 
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
                      src={studentData.timetablePhoto.fileUrl} 
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
                    dataSource={(studentData.fullSchedule || []).filter(item => !selectedDayFilter || item.custom_day === selectedDayFilter)}
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

            <Tabs.TabPane tab={<span><CalendarOutlined /> Attendance</span>} key="6">
              <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {studentData.permissions.attendance ? (
                  <Calendar 
                    cellRender={(current, info) => {
                      if (info.type !== 'date') return info.originNode;
                      
                      const dateStr = current.format('YYYY-MM-DD');
                      
                      // Check for submitted leave applications covering this date
                      const leavesOnDate = (leavesList || []).filter(l => 
                        l.docstatus === 1 && 
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
                      
                      if (!studentData.attendanceList) return info.originNode;
                      const atts = studentData.attendanceList.filter(a => a.date === dateStr);
                      
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
                ) : (
                  <Empty description="You do not have permission to view Attendance." />
                )}
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
                          student: studentData.profile?.name || '',
                          from_date: new Date().toISOString().split('T')[0],
                          to_date: new Date().toISOString().split('T')[0],
                          attendance_based_on: 'Student Group',
                          student_group: studentData.studentGroups?.[0] || '',
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
                            value={studentData.profile?.name || ''} 
                            disabled 
                          />
                        </Col>

                        <Col xs={24} sm={12}>
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', color: '#595959' }}>Student Name</label>
                          <input 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" 
                            value={studentName || ''} 
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
                            {studentData.studentGroups?.map(sg => (
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
          </Tabs>
        </>
      )}

      {/* Hidden Receipt Component for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '700px' }}>
        <FeeReceiptTemplate 
          ref={receiptRef} 
          receiptData={selectedReceipt} 
        />
      </div>

      {/* Compact Payment Modal */}
      <Modal
        title={null}
        visible={isPaymentModalVisible}
        onCancel={() => { setIsPaymentModalVisible(false); setPaymentProcessing(false); }}
        footer={null}
        width={800}
        centered
        bodyStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
      >
        <div style={{ background: '#1d4ed8', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '32px', paddingRight: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCardOutlined style={{ fontSize: '20px', opacity: 0.8 }} />
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fee Checkout</h2>
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => setIsPaymentModalVisible(false)}>
            <RightOutlined rotate={-45} style={{ fontSize: '20px' }} />
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {profile && selectedFee && (
            <>
              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar size={48} icon={<UserOutlined />} style={{ background: '#1d4ed8', color: 'white' }} />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 900, color: '#1f2937', margin: 0 }}>{studentName}</h4>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile.program || 'General Program'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Guardian</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{guardianName}</span>
                </div>
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 px-2">
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Student ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{profile.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Academic Session</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>2026 - 2027</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Fee Structure</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{studentData.feeStructure || 'Standard'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Term / Category</span>
                  <Tag color="blue" style={{ margin: 0, fontWeight: 'bold', border: 'none', background: '#dbeafe', color: '#1e40af', fontSize: '11px' }}>{selectedFee.fees_category || selectedFee.name}</Tag>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Email Address</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{profile.student_email_id || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Mobile Number</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{profile.student_mobile_number || 'N/A'}</span>
                </div>
              </div>

              {/* Address Row */}
              <div style={{ marginBottom: '24px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'start', gap: '12px' }}>
                <InfoCircleOutlined style={{ color: '#60a5fa', marginTop: '4px' }} />
                <div>
                  <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Billing Address</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>
                    {profile.address_line1 || 'N/A'} {profile.address_line2 || ''}, {profile.city}, {profile.state} - {profile.pincode}
                  </span>
                </div>
              </div>

              {/* Footer Bar */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '24px' }}>
                <div style={{ flex: '1 1 100%' }}>
                  <Checkbox 
                    checked={termsAccepted} 
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500, lineHeight: 1.4 }}
                  >
                    I confirm all student and fee details are correct. I agree to the <span style={{ color: '#1d4ed8', textDecoration: 'underline' }}>Terms</span>.
                  </Checkbox>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Payable Amount</span>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#1d4ed8', lineHeight: 1 }}>₹{(selectedFee.amount || selectedFee.outstanding_amount || 0).toLocaleString()}</span>
                  </div>
                  <Button 
                    type="primary" 
                    size="large" 
                    loading={paymentProcessing}
                    style={{ height: '56px', paddingLeft: '32px', paddingRight: '32px', borderRadius: '12px', fontSize: '16px', fontWeight: 900, border: 'none', background: termsAccepted ? '#1d4ed8' : '#e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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
          color: #1d4ed8 !important;
        }
        .guardian-tabs .ant-tabs-ink-bar {
          background: #1d4ed8;
          height: 3px;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
