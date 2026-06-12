import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { DEFAULT_USER_PASSWORD } from '../../config/settings';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX, FiFileText, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';
import { generateAdmissionReceipt } from './AdmissionFeeReceipt';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);



const getOptimizedFormLogoUrl = async (src) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 100, 100);
            ctx.drawImage(img, 0, 0, 100, 100);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
};

const generatePDF = async (record) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(86, 94, 125);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // School Logo - compressed via canvas to eliminate uncompressed 32MB PDF payloads
    try {
        const optLogo = await getOptimizedFormLogoUrl(schoolLogo);
        const format = optLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(optLogo, format, 15, 8, 24, 24, undefined, 'FAST');
    } catch (e) {
        console.warn('Could not add logo to PDF:', e);
    }

    // School Name & Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SSV Campus - CBSE', 45, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPLETE STUDENT REGISTRATION RECORD', 45, 32);

    // Registration Info Box
    doc.setFillColor(245, 245, 245);
    doc.rect(140, 45, 55, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('Registration No:', 145, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(record.registrationNo || '-', 145, 62);

    let currentY = 80;

    const addSection = (title, data, isTable = true) => {
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(86, 94, 125);
        doc.text(title.toUpperCase(), 20, currentY);
        doc.setLineWidth(0.3);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
        
        if (isTable) {
            const tableData = Object.entries(data).map(([label, value]) => [label, value || '-']);
            autoTable(doc, {
                startY: currentY + 5,
                head: [],
                body: tableData,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: 'bold', width: 60, fillColor: [250, 250, 250] } },
                margin: { left: 20, right: 20 }
            });
            currentY = doc.lastAutoTable.finalY + 12;
        } else {
            currentY += 10;
        }
    };

    // 1. Student Details
    addSection('1. Student Academic & Basic Details', {
        'Academic Year': record.academic_year,
        'Program': record.program,
        'Registration Date': record.registration_date,
        'Full Name': `${record.first_name} ${record.middle_name || ''} ${record.last_name || ''}`,
        'Gender': record.gender,
        'Date of Birth': record.date_of_birth,
        'Place of Birth': record.place_of_birth,
        'Caste / Religion': `${record.caste || '-'} / ${record.religion || '-'}`,
        'Blood Group': record.blood_group || '-',
        'Communication Mobile': record.student_mobile_number,
        'Email Address': record.student_email_id,
        'Emergency Contact': record.emergency_mobile_number
    });

    // 2. Father & Mother Details
    addSection('2. Father & Mother Details', {
        'Father Name': record.father_name || '-',
        'Father Education': record.father_education,
        'Father Occupation': `${record.father_occupation || '-'} (${record.father_company_name || '-'})`,
        'Father Mobile / Email': `${record.father_mobile_number || '-'} / ${record.father_email_id || '-'}`,
        'Father Aadhar': record.father_aadhar_number,
        'Mother Name': record.mother_name || '-',
        'Mother Education': record.mother_education,
        'Mother Occupation': `${record.mother_occupation || '-'} (${record.mother_company_name || '-'})`,
        'Mother Mobile / Email': `${record.mother_mobile_number || '-'} / ${record.mother_email_id || '-'}`,
        'Mother Aadhar': record.mother_aadhar_number,
        'Annual Income (F/M)': `${record.father_income_annual || '-'} / ${record.mother_income_annual || '-'}`
    });

    // 3. Guardian & Address
    addSection('3. Guardian & Contact Information', {
        'Guardian Name': record.guardian_name || '-',
        'Guardian Mobile': record.guardian_mobile_number,
        'Guardian Address': record.guardian_address,
        'Residential Address': record.father_residential_address || record.mother_residential_address || '-'
    });

    // 4. Office Use & Previous Academic History
    addSection('4. Office Use & Previous Academic History', {
        'Previous School': record.prev_school_name,
        'Previous Program / Marks': `${record.prev_program || '-'} / ${record.exam_marks || '-'}%`,
        'School Affiliation': record.last_school_affiliated,
        'TC/LC Number & Date': `${record.prev_school_lctc || '-'} (${record.lctc_issue_date || '-'})`,
        'Student Aadhar No': record.student_aadhar_number,
        'PEN Number': record.pen_number,
        'ABHA Number': record.abha_number,
        'Single Girl Child / EWS': `${record.single_girl_child || 'No'} / ${record.belonging_ews || 'No'}`
    });

    // 5. Document Checklist
    const docData = (record.documents || []).reduce((acc, d) => {
        acc[d.name] = d.status;
        return acc;
    }, {});
    addSection('5. Document Submission Checklist', docData);

    // 6. Sibling Information
    if (record.siblings && record.siblings.length > 0) {
        const sibData = record.siblings.reduce((acc, s, i) => {
            acc[`Sibling ${i+1}`] = s;
            return acc;
        }, {});
        addSection('6. Sibling Links', sibData);
    }

    // Footer
    const finalY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`System Generated Report | Date: ${new Date().toLocaleString()}`, 20, finalY + 5);
    doc.setDrawColor(150, 150, 150);
    doc.line(pageWidth - 70, finalY, pageWidth - 20, finalY);
    doc.text('Authorized Signature', pageWidth - 60, finalY + 5);

    doc.save(`Registration_Full_${record.registrationNo}.pdf`);
};

const InputField = ({ label, value, required = false, onChange, type = 'text', placeholder = '', disabled = false, maxLength }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                rows={3}
                className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-gray-50' : 'bg-white'}`}
            />
        ) : (
            <input
                type={type}
                value={value || ''}
                onChange={(e) => {
                    if (type === 'tel') {
                        const val = e.target.value.replace(/\D/g, '');
                        if (maxLength && val.length > maxLength) return;
                        onChange(val);
                    } else {
                        onChange(e.target.value);
                    }
                }}
                maxLength={maxLength}
                placeholder={placeholder}
                disabled={disabled}
                className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-gray-50' : 'bg-white'}`}
            />
        )}
    </div>
);

const SelectField = ({ label, value, required = false, onChange, options = [], placeholder = 'Select', disabled = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[13px] font-semibold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all bg-white ${disabled ? 'bg-gray-50' : 'bg-white'}`}
        >
            <option value="">{placeholder}</option>
            {options.map((opt, i) => (
                <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
        </select>
    </div>
);

const SectionHeader = ({ title, color = 'blue' }) => {
    const colors = {
        blue: 'border-blue-500 text-blue-700',
        green: 'border-green-500 text-green-700',
        orange: 'border-orange-500 text-orange-700',
        red: 'border-red-500 text-red-700',
        brown: 'border-amber-800 text-amber-900',
        gray: 'border-gray-500 text-gray-700'
    };
    return (
        <div className={`border-b-2 ${colors[color]} mb-4 pb-1 mt-6`}>
            <h3 className="text-sm font-bold uppercase tracking-tight">{title}</h3>
        </div>
    );
};

// Firebase collection paths
const REGISTRATIONS_PATH = 'schooler_system/enquiry_management/registrations';
const FEES_PATH = 'schooler_system/enquiry_management/form_fee_setup';

const generateUniqueEmail = (firstName, lastName, existingList, extraExclusions = []) => {
    const cleanFirst = (firstName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = (lastName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let base = 'student';
    if (cleanFirst && cleanLast) {
        base = `${cleanFirst}.${cleanLast}`;
    } else if (cleanFirst) {
        base = cleanFirst;
    } else if (cleanLast) {
        base = cleanLast;
    }
    
    let suffix = 1;
    let email = `${base}${suffix}@ssvschool.edu.in`;
    
    const existingEmails = new Set([
        ...existingList.map(s => (s.student_email_id || '').trim().toLowerCase()),
        ...extraExclusions.map(e => e.trim().toLowerCase())
    ]);
    
    while (existingEmails.has(email)) {
        suffix++;
        email = `${base}${suffix}@ssvschool.edu.in`;
    }
    
    return email;
};

const generateUniqueGuardianEmail = (guardianName, existingGuardiansList, extraExclusions = []) => {
    const nameParts = (guardianName || '').trim().split(/\s+/);
    let first = nameParts[0] || '';
    let last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    
    const cleanFirst = first.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = last.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    let base = 'guardian';
    if (cleanFirst && cleanLast) {
        base = `${cleanFirst}.${cleanLast}`;
    } else if (cleanFirst) {
        base = cleanFirst;
    } else if (cleanLast) {
        base = cleanLast;
    }
    
    let suffix = 1;
    let email = `${base}${suffix}@guardian.ssvschool.edu.in`;
    
    const existingEmails = new Set([
        ...existingGuardiansList.map(g => (g.email_address || '').trim().toLowerCase()),
        ...extraExclusions.map(e => e.trim().toLowerCase())
    ]);
    
    while (existingEmails.has(email)) {
        suffix++;
        email = `${base}${suffix}@guardian.ssvschool.edu.in`;
    }
    
    return email;
};

export default function RegistrationForm({ initialView = 'list' }) {
    const [api, contextHolder] = notification.useNotification();
    const initFormData = {
        // Student Detail
        academic_year: '2025-2026',
        program: '',
        custom_board: '',
        rte_student: '',
        roll_number: '',
        gr_number: '',
        registration_date: new Date().toISOString().split('T')[0],
        first_name: '',
        middle_name: '',
        last_name: '',
        student_full_name: '',
        gender: '',
        date_of_birth: '',
        place_of_birth: '',
        caste: '',
        sub_caste: '',
        category: '',
        religion: '',
        mother_tongue: '',
        blood_group: '',
        father_name: '',
        mother_name: '',
        address_line_1: '',
        state: '',
        city: '',
        pincode: '',
        perm_address: '',
        perm_state: '',
        perm_city: '',
        perm_pincode: '',
        sameAsCurrent: false,
        student_mobile_number: '',
        student_email_id: '',
        alt_mobile: '',
        alt_email: '',
        emergency_mobile_number: '',
        smsNumber: '',
        source: '',
        follow_up_date: '',
        registration_form_no: '',
        status: 'Open',
        is_registration_form_given: false,
        send_sms: false,
        send_email: false,
        remarks: '',
        referred_by: '',
        campus_visit: 'No',
        registrationNo: '',
        // Fee fields
        feeAmount: 0,
        isFeePaid: false,
        receiptNo: '',
        paymentMode: 'Cash',

        // Parent Detail Details
        single_parent: '',
        guardians: [],

        // Office Use Detail
        prev_school_name: '',
        reason_for_leaving: '',
        prev_program: '',
        school_address: '',
        exam_marks: '',
        last_school_affiliated: '',
        prev_school_lctc: '',
        lctc_issue_date: '',
        student_aadhar_number: '',
        single_girl_child: '',
        specially_abled: '',
        belonging_ews: '',
        pen_number: '',
        abha_number: '',
        custom_aadhaar_uid: '',
        custom_pen_number: '',
        custom_apaar_id: '',
        custom_aadhaar_card_number: '',
        address_line_2: '',
        country: 'India',

        // Document Detail (New for Registration)
        documents: [
            { name: 'Student Photo', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Parent Photo', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Birth Certificate', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Previous School LC', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Previous School Last Marksheet', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Student Aadhar Card', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Parents Aadhar Card', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Migration Report', status: 'Pending', fileUrl: '', fileName: '' },
            { name: 'Caste Certificate', status: 'Pending', fileUrl: '', fileName: '' }
        ],

        // Sibling Info
        siblings: []
    };

    const [view, setView] = useState(() => sessionStorage.getItem('reg_view') || initialView);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);
    const [exportFormat, setExportFormat] = useState('csv');
    const [availableExportFields, setAvailableExportFields] = useState([]);
    const [selectedExportFields, setSelectedExportFields] = useState([]);
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('reg_tab') || '1');
    const [regFee, setRegFee] = useState(0);
    const [formData, setFormData] = useState(() => {
        const saved = sessionStorage.getItem('reg_form_data');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return { ...initFormData, registrationNo: `REG-${Date.now().toString().slice(-6)}` };
    });
    const [selectedSibling, setSelectedSibling] = useState('');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [availableCastes, setAvailableCastes] = useState(['General', 'OBC', 'SC', 'ST']);
    const [academicYears, setAcademicYears] = useState([]);
    const [boards, setBoards] = useState([]);
    const [guardiansList, setGuardiansList] = useState([]);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [previewModal, setPreviewModal] = useState({ visible: false, url: '', name: '', type: '' });

    // Filters state
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterProgram, setFilterProgram] = useState('All');
    const [filterAcademicYear, setFilterAcademicYear] = useState('All');
    const [filterBoard, setFilterBoard] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterFeeStatus, setFilterFeeStatus] = useState('All');
    const [filterImportedOnly, setFilterImportedOnly] = useState(false);
    const [filterImportedDate, setFilterImportedDate] = useState('');

    // --- Data Import States ---
    const [importView, setImportView] = useState('list');
    const [importList, setImportList] = useState(() => {
        const stored = localStorage.getItem('registration_imports');
        return stored ? JSON.parse(stored) : [];
    });
    const [activeImportRun, setActiveImportRun] = useState(null);
    const [importType, setImportType] = useState('Insert New Records');
    const [selectedFile, setSelectedFile] = useState(null);
    const [importProgress, setImportProgress] = useState(0);
    const [importing, setImporting] = useState(false);
    const [importLogs, setImportLogs] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateFormat, setTemplateFormat] = useState('Excel');
    const [templateType, setTemplateType] = useState('Blank Template');
    const [selectedFields, setSelectedFields] = useState({
        // Academic
        academic_year: true, program: true, custom_board: false, roll_number: false, gr_number: false, registration_date: false,
        // Basic Detail
        first_name: true, middle_name: false, last_name: false, student_full_name: false, gender: true,
        date_of_birth: false, place_of_birth: false, caste: false, sub_caste: false, category: false,
        religion: false, mother_tongue: false, blood_group: false,
        custom_aadhaar_uid: false, custom_pen_number: false, custom_apaar_id: false, custom_aadhaar_card_number: false,
        // Address
        address_line_1: false, address_line_2: false, city: false, state: false, pincode: false, country: false,
        // Communication
        student_mobile_number: true, student_email_id: true, emergency_mobile_number: false,
        alt_mobile: false, alt_email: false,
        // Additional Info
        source: false, follow_up_date: false, status: false, fees_status: false, remarks: false, campus_visit: false,
        referred_by: false, single_parent: false,
        // Guardian
        guardian_relation: false, guardian_name: false, guardian_email: false, guardian_mobile: false,
        guardian_alternate_number: false, guardian_date_of_birth: false, guardian_education: false,
        guardian_occupation: false, guardian_designation: false, guardian_work_address: false,
        // Office Use
        prev_school_name: false, reason_for_leaving: false, prev_program: false, school_address: false,
        exam_marks: false, last_school_affiliated: false, prev_school_lctc: false, lctc_issue_date: false,
        nationality: false, student_aadhar_number: false, single_girl_child: false, specially_abled: false,
        belonging_ews: false, pen_number: false, abha_number: false,
        // Registration
        registrationNo: false
    });

    const navigate = useNavigate();

    // Sync state to sessionStorage to prevent data loss on camera/scanner refresh
    useEffect(() => { sessionStorage.setItem('reg_view', view); }, [view]);
    useEffect(() => { sessionStorage.setItem('reg_tab', activeTab); }, [activeTab]);
    useEffect(() => { 
        if (!editingRecord) {
            sessionStorage.setItem('reg_form_data', JSON.stringify(formData)); 
        }
    }, [formData, editingRecord]);

    // Load Razorpay checkout script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { try { document.body.removeChild(script); } catch(e) {} };
    }, []);

    // Razorpay online payment handler
    const handleOnlinePayment = async () => {
        if (!formData.first_name || !formData.program) {
            api.warning({ message: 'Missing Fields', description: 'Please fill Student Name and Program before payment.' });
            return;
        }
        const payAmount = parseFloat(formData.feeAmount || regFee);
        if (payAmount < 1) {
            api.warning({ message: 'Invalid Amount', description: 'Fee amount must be at least ₹1.' });
            return;
        }
        setPaymentProcessing(true);
        try {
            // 1. Create order
            const orderRes = await axios.post('/local-api/admission-payment/create-order', {
                student_name: `${formData.first_name} ${formData.middle_name || ''} ${formData.last_name || ''}`.trim(),
                registration_no: formData.registrationNo,
                program: formData.program,
                academic_year: formData.academic_year,
                fee_type: 'Registration',
                fee_name: 'Registration Fee',
                amount: payAmount,
                parent_name: (formData.guardians?.[0]?.guardian_name) || formData.father_name || '',
                parent_mobile: formData.student_mobile_number || '',
                parent_email: formData.student_email_id || '',
            });
            if (!orderRes.data.success) throw new Error(orderRes.data.message);
            const { order_id, key_id } = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: key_id,
                amount: orderRes.data.amount,
                currency: 'INR',
                name: 'SSV CAMPUS - CBSE',
                description: 'Registration Fee Payment',
                order_id: order_id,
                handler: async (response) => {
                    try {
                        const verifyRes = await axios.post('/local-api/admission-payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            student_name: `${formData.first_name} ${formData.middle_name || ''} ${formData.last_name || ''}`.trim(),
                            registration_no: formData.registrationNo,
                            program: formData.program,
                            academic_year: formData.academic_year,
                            fee_type: 'Registration',
                            fee_name: 'Registration Fee',
                            amount: payAmount,
                            parent_name: (formData.guardians?.[0]?.guardian_name) || '',
                            parent_mobile: formData.student_mobile_number || '',
                            parent_email: formData.student_email_id || '',
                        });
                        if (verifyRes.data.success) {
                            setFormData(prev => ({
                                ...prev,
                                isFeePaid: true,
                                receiptNo: verifyRes.data.receipt_no || response.razorpay_payment_id,
                                paymentMode: 'Online',
                                paymentId: response.razorpay_payment_id,
                                orderId: response.razorpay_order_id,
                                paymentDate: new Date().toISOString(),
                            }));

                            // Auto-update Firebase if it's an existing registration
                            if (editingRecord?.id) {
                                try {
                                    await updateDoc(doc(db, REGISTRATIONS_PATH, editingRecord.id), {
                                        isFeePaid: true,
                                        receiptNo: verifyRes.data.receipt_no || response.razorpay_payment_id,
                                        paymentMode: 'Online',
                                        paymentId: response.razorpay_payment_id,
                                        paymentDate: new Date().toISOString(),
                                        feeAmount: payAmount,
                                        updated_at: serverTimestamp()
                                    });
                                } catch (e) { console.error('Auto-update DB failed:', e); }
                            }

                            api.success({ message: '✅ Payment Successful!', description: `Receipt: ${verifyRes.data.receipt_no}` });
                        }
                    } catch (vErr) {
                        api.error({ message: 'Verification Failed', description: vErr.message });
                    }
                    setPaymentProcessing(false);
                },
                prefill: {
                    name: `${formData.first_name} ${formData.last_name || ''}`.trim(),
                    email: formData.student_email_id || '',
                    contact: formData.student_mobile_number || '',
                },
                theme: { color: '#1e3a8a' },
                modal: { ondismiss: () => setPaymentProcessing(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            api.error({ message: 'Payment Failed', description: err.message });
            setPaymentProcessing(false);
        }
    };

    // Manual (Cash/Cheque) payment handler
    const handleManualPayment = async () => {
        if (!formData.first_name || !formData.program) {
            api.warning({ message: 'Missing Fields', description: 'Please fill Student Name and Program.' });
            return;
        }
        const payAmount = parseFloat(formData.feeAmount || regFee);
        if (payAmount < 1) { api.warning({ message: 'Invalid Amount' }); return; }
        if (!formData.paymentMode || formData.paymentMode === 'Online') {
            api.warning({ message: 'Select Mode', description: 'Choose Cash or Cheque for manual payment.' }); return;
        }
        setPaymentProcessing(true);
        try {
            const res = await axios.post('/local-api/admission-payment/record-manual', {
                student_name: `${formData.first_name} ${formData.middle_name || ''} ${formData.last_name || ''}`.trim(),
                registration_no: formData.registrationNo,
                program: formData.program,
                academic_year: formData.academic_year,
                fee_type: 'Registration',
                fee_name: 'Registration Fee',
                amount: payAmount,
                payment_mode: formData.paymentMode,
                manual_receipt_no: formData.receiptNo || '',
                parent_name: (formData.guardians?.[0]?.guardian_name) || '',
                parent_mobile: formData.student_mobile_number || '',
                parent_email: formData.student_email_id || '',
            });
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    isFeePaid: true,
                    receiptNo: res.data.receipt_no,
                    paymentId: res.data.payment_id,
                    paymentDate: new Date().toISOString(),
                }));

                // Auto-update Firebase if it's an existing registration
                if (editingRecord?.id) {
                    try {
                        await updateDoc(doc(db, REGISTRATIONS_PATH, editingRecord.id), {
                            isFeePaid: true,
                            receiptNo: res.data.receipt_no,
                            paymentId: res.data.payment_id,
                            paymentMode: formData.paymentMode || 'Cash',
                            paymentDate: new Date().toISOString(),
                            feeAmount: payAmount,
                            updated_at: serverTimestamp()
                        });
                    } catch (e) { console.error('Auto-update DB failed:', e); }
                }

                api.success({ message: '✅ Payment Recorded!', description: `Receipt: ${res.data.receipt_no}` });
            }
        } catch (err) {
            api.error({ message: 'Recording Failed', description: err.message });
        } finally { setPaymentProcessing(false); }
    };

    // Download receipt PDF
    const handleDownloadReceipt = (record) => {
        generateAdmissionReceipt({
            receipt_no: record.receiptNo || record.receipt_no || 'N/A',
            student_name: `${record.first_name || ''} ${record.middle_name || ''} ${record.last_name || ''}`.trim(),
            registration_no: record.registrationNo || '',
            program: record.program || '',
            academic_year: record.academic_year || '',
            fee_type: 'Registration',
            fee_name: 'Registration Fee',
            amount: record.feeAmount || 0,
            payment_mode: record.paymentMode || 'ONLINE',
            payment_id: record.paymentId || record.receiptNo || '',
            receipt_date: record.paymentDate || record.created_at || new Date().toISOString(),
            parent_name: record.guardians?.[0]?.guardian_name || '',
            parent_mobile: record.student_mobile_number || '',
        });
    };

    const fetchERPNextData = async () => {
        try {
            const [progRes, yearRes, guardianRes, casteRes, companyRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Guardian?fields=["name","guardian_name","email_address","mobile_number"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Category?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
            ]);
            
            const programs = progRes.data.data?.map(p => p.name) || [];
            const years = yearRes.data.data?.map(y => y.name) || [];
            const castes = casteRes.data.data?.map(c => c.name) || [];
            
            if (castes.length > 0) {
                setAvailableCastes(castes);
            }
            
            setAcademicYears(years);
            setBoards((companyRes.data.data || []).map(c => c.name));
            setGuardiansList((guardianRes.data.data || []).map(g => ({ name: g.name, guardian_name: g.guardian_name || g.name, email_address: g.email_address || '', mobile_number: g.mobile_number || '' })));
            await fetchRestrictions(programs);
        } catch (err) {
            console.error('Error fetching ERPNext data:', err);
        }
    };

    useEffect(() => {
        fetchERPNextData();
        if (view === 'list') fetchData();
        else if (view === 'import') {
            fetchImportList();
        } else {
            fetchRegFee();
            if (!editingRecord) {
                // Only initialize if we didn't just load a draft from sessionStorage
                const hasDraft = !!sessionStorage.getItem('reg_form_data');
                if (!hasDraft) {
                    setFormData({ ...initFormData, registrationNo: `REG-${Date.now().toString().slice(-6)}` });
                }
            } else {
                const mergedDocs = initFormData.documents.map(defaultDoc => {
                    const existing = (editingRecord.documents || []).find(d => d.name === defaultDoc.name);
                    return existing ? { ...defaultDoc, ...existing } : defaultDoc;
                });
                setFormData({ ...editingRecord, documents: mergedDocs });
            }
        }
    }, [view, editingRecord]);

    const fetchRestrictions = async (programs) => {
        const sortPrograms = (arr) => {
            const getRank = (name) => {
                const n = name.toUpperCase();
                if (n.includes('NURSERY') || n.includes('NURSARY') || n.includes('NUR')) return 0;
                if (n.includes('JR') || n.includes('JUNIOR')) return 1;
                if (n.includes('SR') || n.includes('SENIOR')) return 2;
                const match = n.match(/(?:STD|CLASS)\s*(\d+)/);
                if (match) return parseInt(match[1]) + 2;
                return 999;
            };
            return [...arr].sort((a, b) => {
                const rA = getRank(a);
                const rB = getRank(b);
                if (rA !== rB) return rA - rB;
                return a.localeCompare(b);
            });
        };

        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/program_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            setAvailableClasses(sortPrograms(programs.filter(c => !restricted.includes(c))));
        } catch (err) { 
            console.error('Restriction fetch failed', err);
            setAvailableClasses(sortPrograms(programs));
        }
    };


    const fetchRegFee = async () => {
        try {
            const q = query(collection(db, FEES_PATH));
            const snap = await getDocs(q);
            const fees = snap.docs.map(d => d.data());
            const activeRegFee = fees.find(f => f.feeType === 'Registration' && f.status === 'Active');
            if (activeRegFee) {
                setRegFee(activeRegFee.amount);
                if (!editingRecord) setFormData(prev => ({ ...prev, feeAmount: activeRegFee.amount }));
            }
        } catch (err) { console.error('Fee fetch error:', err); }
    };




    const fetchData = async () => {
        setLoading(true);
        try {
            const colRef = collection(db, REGISTRATIONS_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const regs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            setData(regs);
        } catch (err) {
            console.error('Fetch Registration failed:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.academic_year) {
            api.warning({ message: 'Required Field Missing', description: 'Academic Year is required.' });
            return;
        }
        if (!formData.program) {
            api.warning({ message: 'Required Field Missing', description: 'Program is required.' });
            return;
        }
        if (!formData.first_name || !formData.first_name.trim()) {
            api.warning({ message: 'Required Field Missing', description: 'First Name is required.' });
            return;
        }
        if (!formData.gender) {
            api.warning({ message: 'Required Field Missing', description: 'Gender is required.' });
            return;
        }
        if (!formData.student_mobile_number || !formData.student_mobile_number.trim()) {
            api.warning({ message: 'Required Field Missing', description: 'Student Mobile Number is required.' });
            return;
        }
        if (formData.student_mobile_number && formData.student_mobile_number.trim().length !== 10) {
            api.warning({ message: 'Invalid Input', description: 'Student Mobile Number must be exactly 10 digits.' });
            return;
        }
        if (formData.emergency_mobile_number && formData.emergency_mobile_number.trim().length !== 10) {
            api.warning({ message: 'Invalid Input', description: 'Emergency Mobile Number must be exactly 10 digits.' });
            return;
        }
        if (formData.custom_aadhaar_uid && formData.custom_aadhaar_uid.trim().length !== 18) {
            api.warning({ message: 'Invalid Input', description: 'Aadhaar DISE number (UID) must be exactly 18 digits.' });
            return;
        }
        if (formData.custom_pen_number && formData.custom_pen_number.trim().length !== 11) {
            api.warning({ message: 'Invalid Input', description: 'PEN Number must be exactly 11 digits.' });
            return;
        }
        if (formData.custom_aadhaar_card_number && formData.custom_aadhaar_card_number.trim().length !== 12) {
            api.warning({ message: 'Invalid Input', description: 'Aadhaar Card Number must be exactly 12 digits.' });
            return;
        }
        if (formData.studentAadhar && formData.studentAadhar.trim().length !== 18) {
            api.warning({ message: 'Invalid Input', description: 'Aadhaar DISE number (UID) must be exactly 18 digits.' });
            return;
        }
        if (formData.pen_number && formData.pen_number.trim().length !== 11) {
            api.warning({ message: 'Invalid Input', description: 'Personal Education Number(PEN) must be exactly 11 digits.' });
            return;
        }
        if (!formData.student_email_id || !formData.student_email_id.trim()) {
            api.warning({ message: 'Required Field Missing', description: 'Student Email Address is required.' });
            return;
        }
        if (!formData.status) {
            api.warning({ message: 'Required Field Missing', description: 'Status is required.' });
            return;
        }

        // Validate guardians
        if (!formData.guardians || formData.guardians.length === 0) {
            api.warning({ message: 'Required Field Missing', description: 'At least one Parent/Guardian is required.' });
            return;
        }

        for (let i = 0; i < formData.guardians.length; i++) {
            const g = formData.guardians[i];
            
            // Relation is the first field in UI
            if (!g.relation) {
                api.warning({ message: 'Required Field Missing', description: `Relation with Student is required for Guardian #${i + 1}.` });
                return;
            }

            if (g.is_new) {
                if (!g.guardian_name || !g.guardian_name.trim()) {
                    api.warning({ message: 'Required Field Missing', description: `Guardian Name is required for Guardian #${i + 1}.` });
                    return;
                }
                if (!g.email_address || !g.email_address.trim()) {
                    api.warning({ message: 'Required Field Missing', description: `Email Address is required for Guardian #${i + 1}.` });
                    return;
                }
                if (!g.mobile_number || !g.mobile_number.trim()) {
            api.warning({ message: 'Required Field Missing', description: `Mobile Number is required for Guardian #${i + 1}.` });
            return;
        }
        if (g.mobile_number && g.mobile_number.trim().length !== 10) {
            api.warning({ message: 'Invalid Input', description: `Mobile Number must be exactly 10 digits for Guardian #${i + 1}.` });
            return;
        }
        if (g.alternate_number && g.alternate_number.trim().length !== 10) {
            api.warning({ message: 'Invalid Input', description: `Alternate Number must be exactly 10 digits for Guardian #${i + 1}.` });
            return;
        }
    } else {
                if (!g.guardian) {
                    api.warning({ message: 'Required Field Missing', description: `Please select an existing guardian for Guardian #${i + 1} or remove it.` });
                    return;
                }
            }
        }

        setSaving(true);
        try {
            // Ensure registrationNo is populated on formData so it goes to ERPNext and Firebase
            const currentRegNo = formData.registrationNo || `REG-${Date.now().toString().slice(-6)}`;
            if (!formData.registrationNo) {
                setFormData(prev => ({ ...prev, registrationNo: currentRegNo }));
                formData.registrationNo = currentRegNo;
            }

            // Check if we are newly disabling this registration
            if (formData.isDisabled && editingRecord && !editingRecord.isDisabled) {
                try {
                    const admsQuery = query(collection(db, 'schooler_system/enquiry_management/final_admissions'), where('registrationId', '==', editingRecord.id));
                    const admsSnap = await getDocs(admsQuery);
                    if (!admsSnap.empty) {
                        const adm = admsSnap.docs[0].data();
                        if (adm.erp_student_id) {
                            await API.put(`/api/resource/Student/${encodeURIComponent(adm.erp_student_id)}`, { enabled: 0 });
                        }
                    }
                } catch (erpErr) {
                    console.warn('Failed to auto-disable ERPNext student', erpErr);
                }
            }

            // 1. Sync with ERPNext if needed (creating Student and Guardian)
            let erpNextStudentName = null;
            try {
                // Check if program exists in ERPNext
                if (formData.program && !availableClasses.includes(formData.program)) {
                    throw new Error(`Program '${formData.program}' not found in ERPNext. Please select a valid program.`);
                }
            } catch (erpErr) {
                console.error('Validation failed:', erpErr);
            }

            // 2. Save to Firebase (local storage)
            const colRef = collection(db, REGISTRATIONS_PATH);
            const finalData = {
                ...formData,
                erp_student_id: erpNextStudentName,
                updated_at: serverTimestamp()
            };

            // Auto-generate registration code if missing
            if (!finalData.registrationNo) {
                finalData.registrationNo = `REG-${Date.now().toString().slice(-6)}`;
            }

            console.log('[Registration Save] 💾 Saving Registration to Firebase. Document Data inside payload:', finalData.documents);

            if (editingRecord) {
                const docRef = doc(db, REGISTRATIONS_PATH, editingRecord.id);
                await updateDoc(docRef, finalData);

                // --- FORWARD SYNC: Update linked ERPNext Student record ---
                let erpSyncSuccess = false;
                let erpSyncError = '';
                try {
                    const admsQuery = query(
                        collection(db, 'schooler_system/enquiry_management/final_admissions'),
                        where('registrationId', '==', editingRecord.id)
                    );
                    const admsSnap = await getDocs(admsQuery);
                    if (!admsSnap.empty) {
                        const adm = admsSnap.docs[0].data();
                        if (adm.erp_student_id) {
                            // Build the student update payload from matching fields
                            const studentUpdatePayload = {
                                first_name: formData.first_name || null,
                                middle_name: formData.middle_name || null,
                                last_name: formData.last_name || null,
                                gender: formData.gender || null,
                                date_of_birth: formData.date_of_birth || null,
                                blood_group: formData.blood_group || null,
                                student_mobile_number: formData.student_mobile_number || null,
                                student_email_id: formData.student_email_id || null,
                                program: formData.program || null,
                                custom_board: formData.custom_board || null,
                                gr_number: formData.gr_number || null,
                                roll_number: formData.roll_number || null,
                                address_line_1: formData.address_line_1 || null,
                                address_line_2: formData.perm_address || null,
                                city: formData.city || null,
                                state: formData.state || null,
                                pincode: formData.pincode || null,
                                country: formData.country || null,
                                custom_aadhaar_uid: formData.custom_aadhaar_uid || null,
                                custom_pen_number: formData.custom_pen_number || null,
                                custom_apaar_id: formData.custom_apaar_id || null,
                                custom_aadhaar_card_number: formData.custom_aadhaar_card_number || null,
                            };
                            await API.put(`/api/resource/Student/${encodeURIComponent(adm.erp_student_id)}`, studentUpdatePayload);
                            
                            // Sync with User record as well
                            try {
                                const studentRes = await API.get(`/api/resource/Student/${encodeURIComponent(adm.erp_student_id)}`);
                                const existingUserEmail = studentRes.data.data?.student_email_id;
                                if (existingUserEmail) {
                                    const cleanPhone = formData.student_mobile_number ? String(formData.student_mobile_number).replace(/[\s+-]/g, '') : '';
                                    const cleanStudentUsername = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
                                    
                                    const editUserPayload = {
                                        first_name: formData.first_name || undefined,
                                        middle_name: formData.middle_name || undefined,
                                        last_name: formData.last_name || undefined,
                                        mobile_no: formData.student_mobile_number ? String(formData.student_mobile_number).trim() : null,
                                        role_profile_name: 'Student',
                                        module_profile: 'Student',
                                        enabled: 1,
                                        roles: [{ role: 'Student' }]
                                    };
                                    if (cleanStudentUsername) {
                                        editUserPayload.username = cleanStudentUsername;
                                    }
                                    await API.put(`/api/resource/User/${encodeURIComponent(existingUserEmail)}`, editUserPayload)
                                        .catch(uPutErr => console.warn('[Registration→User Sync] PUT to user failed silently:', uPutErr.message));
                                    console.log('[Registration→User Sync] Successfully updated User record for student:', existingUserEmail);
                                }
                            } catch (uSyncErr) {
                                console.warn('[Registration→User Sync] Failed to update User profile during sync:', uSyncErr.message);
                            }

                            erpSyncSuccess = true;
                            console.log('[Registration→Student Sync] Successfully synced fields to ERPNext Student:', adm.erp_student_id);
                        }
                    } else {
                        // No admission found yet (registration not converted), that's fine
                        erpSyncSuccess = true;
                    }
                } catch (erpSyncErr) {
                    erpSyncError = erpSyncErr?.response?.data?.message || erpSyncErr.message || 'Unknown error';
                    console.warn('[Registration→Student Sync] Failed to sync to ERPNext Student:', erpSyncErr);
                }
                // ---------------------------------------------------------

                if (erpSyncSuccess) {
                    api.success({ message: '✅ Student Updated Successfully', description: 'Changes have been saved in both Registration and Student records.' });
                } else {
                    api.warning({ message: '⚠️ Registration Saved', description: `Registration updated but failed to sync Student record: ${erpSyncError}` });
                }
            } else {
                await addDoc(colRef, {
                    ...finalData,
                    created_at: serverTimestamp()
                });
                api.success({ message: 'Registration Created Successfully' });
            }
            sessionStorage.removeItem('reg_form_data');
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            api.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete registration for "${record.first_name}"?`)) return;
        try {
            const docRef = doc(db, REGISTRATIONS_PATH, record.id);
            await deleteDoc(docRef);
            api.success({ message: 'Registration Deleted' });
            fetchData();
        } catch (err) {
            api.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        return data.filter(d => {
            // 1. Text Search Query filter
            const matchesSearch = !term || 
                (d.first_name || '').toLowerCase().includes(term) ||
                (d.registrationNo || '').toLowerCase().includes(term) ||
                (d.student_mobile_number || '').toLowerCase().includes(term);
            
            if (!matchesSearch) return false;

            // 2. Program Filter
            if (filterProgram !== 'All') {
                const docProgram = (d.program || '').toString().trim().toLowerCase();
                const selProgram = filterProgram.toString().trim().toLowerCase();
                if (docProgram !== selProgram) return false;
            }

            // 2.5 Academic Year Filter
            if (filterAcademicYear !== 'All' && d.academic_year !== filterAcademicYear) {
                return false;
            }

            // 2.7 Board Filter
            if (filterBoard !== 'All') {
                const docBoard = (d.custom_board || '').toString().trim().toLowerCase();
                const selBoard = filterBoard.toString().trim().toLowerCase();
                if (docBoard !== selBoard) return false;
            }

            // 3. Status Filter (Converted vs Open vs Disabled)
            const isDisabled = d.isDisabled === true;
            if (filterStatus === 'All' && isDisabled) return false; // Hide disabled by default
            
            if (filterStatus !== 'All') {
                if (filterStatus === 'Disabled') {
                    if (!isDisabled) return false;
                } else {
                    if (isDisabled) return false; // Hide disabled from Open/Converted views
                    const isConverted = d.status === 'Converted';
                    if (filterStatus === 'Converted' && !isConverted) return false;
                    if (filterStatus === 'Open' && isConverted) return false;
                }
            }

            // 4. Fee Status Filter
            if (filterFeeStatus !== 'All') {
                const isOldStudent = d.paymentMode === 'Old Student' || (d.fees_status && d.fees_status.toLowerCase() === 'old student');
                const isPaid = !!d.isFeePaid && !isOldStudent;
                if (filterFeeStatus === 'Old Student' && !isOldStudent) return false;
                if (filterFeeStatus === 'Paid' && !isPaid) return false;
                if (filterFeeStatus === 'Unpaid' && !!d.isFeePaid) return false;
            }

            // 5. Date Range Filter
            if (filterDateFrom || filterDateTo) {
                const regDate = d.registration_date ? new Date(d.registration_date) : d.created_at?.toDate ? d.created_at.toDate() : d.created_at ? new Date(d.created_at) : null;
                if (!regDate) return false;
                
                const dateToCheck = new Date(regDate);
                dateToCheck.setHours(0, 0, 0, 0);

                if (filterDateFrom) {
                    const from = new Date(filterDateFrom);
                    from.setHours(0, 0, 0, 0);
                    if (dateToCheck < from) return false;
                }

                if (filterDateTo) {
                    const to = new Date(filterDateTo);
                    to.setHours(23, 59, 59, 999);
                    if (dateToCheck > to) return false;
                }
            }

            // 6. Imported Data Filter
            if (filterImportedOnly) {
                if (!d.is_imported) return false;
                if (filterImportedDate && d.imported_date !== filterImportedDate) return false;
            }

            return true;
        });
    }, [data, searchQuery, filterProgram, filterAcademicYear, filterBoard, filterStatus, filterFeeStatus, filterDateFrom, filterDateTo, filterImportedOnly, filterImportedDate]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addGuardian = () => {
        setFormData(prev => ({
            ...prev,
            guardians: [...(prev.guardians || []), { 
                is_new: true,
                create_user_account: (prev.guardians || []).length === 0,
                guardian: '', 
                guardian_name: '', 
                relation: '',
                email_address: '',
                mobile_number: '',
                occupation: '',
                designation: '',
                education: '',
                alternate_number: '',
                work_address: '',
                date_of_birth: '',
                user: ''
            }]
        }));
    };
    
    const updateGuardian = (idx, key, val) => {
        setFormData(prev => {
            const g = [...(prev.guardians || [])];
            g[idx] = { ...g[idx], [key]: val };
            if (key === 'guardian') {
                const found = guardiansList.find(gl => gl.name === val);
                if (found) {
                    g[idx].guardian_name = found.guardian_name;
                    g[idx].email_address = found.email_address;
                    g[idx].mobile_number = found.mobile_number;
                }
            }
            if (key === 'guardian_name' && g[idx].is_new) {
                const otherNewEmails = g
                    .filter((item, i) => i !== idx && item.is_new && item.email_address)
                    .map(item => item.email_address);
                g[idx].email_address = generateUniqueGuardianEmail(val, guardiansList, otherNewEmails);
            }
            return { ...prev, guardians: g };
        });
    };
    
    const removeGuardian = (idx) => {
        setFormData(prev => ({ ...prev, guardians: (prev.guardians || []).filter((_, i) => i !== idx) }));
    };

    const updateDocStatus = (index, status) => {
        const newDocs = [...(formData.documents || [])];
        if (newDocs[index]) {
            newDocs[index].status = status;
        }
        setFormData(prev => ({ ...prev, documents: newDocs }));
    };

    const handleQuickVerifyAllDocs = () => {
        setFormData(prev => {
            const updatedDocs = (prev.documents || []).map(doc => {
                const hasFiles = (doc.files && doc.files.length > 0) || doc.fileUrl;
                return {
                    ...doc,
                    status: hasFiles ? 'Verified' : doc.status
                };
            });
            return { ...prev, documents: updatedDocs };
        });
        api.success({ message: '⚡ All Uploaded Documents Verified Instantly!' });
    };

    const handleFileUpload = async (index, fileList) => {
        if (!fileList || fileList.length === 0) return;
        
        const validTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024;
        
        const newFiles = [];
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!validTypes.includes(file.type)) {
                api.error({ 
                    message: 'Invalid File Format', 
                    description: `Skipped "${file.name}": Only JPG, JPEG, and PDF files are supported.` 
                });
                continue;
            }
            if (file.size > maxSize) {
                api.error({ 
                    message: 'File Too Large', 
                    description: `Skipped "${file.name}": Maximum file size is 5 MB.` 
                });
                continue;
            }

            try {
                console.log(`[AWS S3] ⏳ Requesting presigned URL for file: ${file.name}`);
                const response = await axios.post('/local-api/api/s3/presigned-url', {
                    fileName: file.name,
                    fileType: file.type
                });
                
                const { presignedUrl, fileUrl } = response.data;
                console.log(`[AWS S3] 🚀 Received presigned URL. Uploading directly to S3...`);

                await axios.put(presignedUrl, file, {
                    headers: { 'Content-Type': file.type }
                });

                console.log(`[AWS S3] ✅ Successfully uploaded "${file.name}" to AWS S3! \nPublic URL:`, fileUrl);

                newFiles.push({
                    fileName: file.name,
                    fileUrl: fileUrl,
                    uploadedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error('[AWS S3 Upload Error] ❌ Failed to upload:', error.response?.data || error.message);
                api.error({
                    message: 'Upload Failed',
                    description: `Failed to upload "${file.name}". Please check your network and AWS config.`
                });
                continue;
            }
        }

        if (newFiles.length === 0) return;

        setFormData(prev => {
            const updatedDocs = [...(prev.documents || [])];
            if (updatedDocs[index]) {
                const doc = updatedDocs[index];
                const existingFiles = doc.files ? [...doc.files] : (doc.fileUrl ? [{ fileName: doc.fileName, fileUrl: doc.fileUrl, uploadedAt: doc.uploadedAt }] : []);
                updatedDocs[index] = {
                    ...doc,
                    status: 'Submitted',
                    files: [...existingFiles, ...newFiles],
                    fileUrl: existingFiles.length > 0 ? existingFiles[0].fileUrl : newFiles[0].fileUrl,
                    fileName: existingFiles.length > 0 ? existingFiles[0].fileName : newFiles[0].fileName,
                };
            }
            return { ...prev, documents: updatedDocs };
        });
        api.success({ message: `Successfully uploaded ${newFiles.length} file(s)!` });
    };

    const handleRemoveFile = (docIndex, fileIndex) => {
        setFormData(prev => {
            const updatedDocs = [...(prev.documents || [])];
            if (updatedDocs[docIndex]) {
                const doc = updatedDocs[docIndex];
                const existingFiles = doc.files ? [...doc.files] : (doc.fileUrl ? [{ fileName: doc.fileName, fileUrl: doc.fileUrl, uploadedAt: doc.uploadedAt }] : []);
                
                const remainingFiles = existingFiles.filter((_, idx) => idx !== fileIndex);
                
                updatedDocs[docIndex] = {
                    ...doc,
                    status: remainingFiles.length > 0 ? doc.status : 'Pending',
                    files: remainingFiles,
                    fileUrl: remainingFiles.length > 0 ? remainingFiles[0].fileUrl : '',
                    fileName: remainingFiles.length > 0 ? remainingFiles[0].fileName : ''
                };
            }
            return { ...prev, documents: updatedDocs };
        });
        api.info({ message: 'File removed.' });
    };

    const handleViewDocument = (fileUrl, fileName) => {
        if (!fileUrl) return;
        const isPdf = fileUrl.startsWith('data:application/pdf') || fileName?.toLowerCase().endsWith('.pdf');
        setPreviewModal({
            visible: true,
            url: fileUrl,
            name: fileName || 'Document Preview',
            type: isPdf ? 'pdf' : 'image'
        });
    };

    const addSibling = () => {
        if (!selectedSibling) return;
        if (formData.siblings.includes(selectedSibling)) {
            api.info({ message: 'Sibling already added' });
            return;
        }
        setFormData(prev => ({
            ...prev,
            siblings: [...prev.siblings, selectedSibling]
        }));
        setSelectedSibling('');
    };

    const removeSibling = (sibling) => {
        setFormData(prev => ({
            ...prev,
            siblings: prev.siblings.filter(s => s !== sibling)
        }));
    };

    // --- Data Import Logics ---
    const CheckboxField = ({ name, label, isRed }) => (
        <label className="flex items-center gap-3 cursor-pointer">
            <input 
                type="checkbox" 
                checked={!!selectedFields[name]} 
                onChange={(e) => setSelectedFields(prev => ({ ...prev, [name]: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
            />
            <span className={isRed ? "text-red-600 font-medium" : "text-gray-700 font-medium"}>{label}</span>
        </label>
    );

    const IMPORT_FIELD_MAP = {
        // Academic
        academic_year: { label: 'Academic Year', width: 15 },
        program: { label: 'Program (Class)', width: 20 },
        custom_board: { label: 'Board', width: 20 },
        rte_student: { label: 'RTE Student', width: 15 },
        roll_number: { label: 'Roll Number', width: 15 },
        gr_number: { label: 'GR Number', width: 15 },
        registration_date: { label: 'Registration Date', width: 15 },
        // Basic Detail
        first_name: { label: 'First Name', width: 20 },
        middle_name: { label: 'Middle Name', width: 20 },
        last_name: { label: 'Last Name', width: 20 },
        student_full_name: { label: 'Student Full Name', width: 25 },
        gender: { label: 'Gender', width: 12 },
        date_of_birth: { label: 'Date of Birth', width: 15 },
        place_of_birth: { label: 'Place of Birth', width: 20 },
        caste: { label: 'Caste', width: 15 },
        sub_caste: { label: 'Sub Caste', width: 15 },
        category: { label: 'Category', width: 15 },
        religion: { label: 'Religion', width: 15 },
        mother_tongue: { label: 'Mother Tongue', width: 15 },
        blood_group: { label: 'Blood Group', width: 12 },
        custom_aadhaar_uid: { label: 'Aadhaar DISE Number (UID)', width: 22 },
        custom_pen_number: { label: 'PEN Number (Custom)', width: 18 },
        custom_apaar_id: { label: 'APAAR ID', width: 18 },
        custom_aadhaar_card_number: { label: 'Aadhaar Card Number', width: 20 },
        // Address
        address_line_1: { label: 'Address Line 1 (Current)', width: 25 },
        address_line_2: { label: 'Address Line 2 (Permanent)', width: 25 },
        city: { label: 'City', width: 15 },
        state: { label: 'State', width: 15 },
        pincode: { label: 'Pincode', width: 12 },
        country: { label: 'Country', width: 15 },
        // Communication
        student_mobile_number: { label: 'Student Mobile Number', width: 20 },
        student_email_id: { label: 'Student Email Address', width: 25 },
        emergency_mobile_number: { label: 'Emergency Mobile Number', width: 20 },
        alt_mobile: { label: 'Alt Mobile Number', width: 18 },
        alt_email: { label: 'Alt Email', width: 20 },
        // Additional Info
        source: { label: 'Source', width: 15 },
        follow_up_date: { label: 'Follow-up Date', width: 15 },
        status: { label: 'Status', width: 12 },
        fees_status: { label: 'Fees Status', width: 18 },
        remarks: { label: 'Remarks', width: 25 },
        campus_visit: { label: 'Campus Visit', width: 12 },
        referred_by: { label: 'Referred By', width: 20 },
        single_parent: { label: 'Single Parent', width: 12 },
        // Guardian
        guardian_relation: { label: 'Guardian Relation', width: 15 },
        guardian_name: { label: 'Guardian Name', width: 20 },
        guardian_email: { label: 'Guardian Email', width: 25 },
        guardian_mobile: { label: 'Guardian Mobile', width: 18 },
        guardian_alternate_number: { label: 'Guardian Alternate Number', width: 18 },
        guardian_date_of_birth: { label: 'Guardian Date of Birth', width: 15 },
        guardian_education: { label: 'Guardian Education', width: 20 },
        guardian_occupation: { label: 'Guardian Occupation', width: 20 },
        guardian_designation: { label: 'Guardian Designation', width: 20 },
        guardian_work_address: { label: 'Guardian Work Address', width: 25 },
        // Office Use
        prev_school_name: { label: 'Previous School Name', width: 25 },
        reason_for_leaving: { label: 'Reason For Leaving', width: 20 },
        prev_program: { label: 'Previous Class', width: 15 },
        school_address: { label: 'School Address', width: 25 },
        exam_marks: { label: 'Exam Marks (%)', width: 15 },
        last_school_affiliated: { label: 'Last School Affiliated', width: 18 },
        prev_school_lctc: { label: 'Previous School LC/TC Number', width: 22 },
        lctc_issue_date: { label: 'LC/TC Issue Date', width: 15 },
        nationality: { label: 'Nationality', width: 15 },
        student_aadhar_number: { label: 'Student Aadhar Number', width: 20 },
        single_girl_child: { label: 'Single Girl Child', width: 15 },
        specially_abled: { label: 'Specially Abled', width: 15 },
        belonging_ews: { label: 'Belonging EWS', width: 15 },
        pen_number: { label: 'Personal Education Number (PEN)', width: 22 },
        abha_number: { label: 'ABHA Number', width: 18 },
        // Registration
        registrationNo: { label: 'Registration No', width: 20 }
    };

    const IMPORT_ORDERED_FIELDS = Object.keys(IMPORT_FIELD_MAP);

    const handleDownloadTemplate = async () => {
        const headers = [];
        const cols = [];
        const activeFields = IMPORT_ORDERED_FIELDS.filter(f => selectedFields[f]);

        activeFields.forEach(f => {
            headers.push(IMPORT_FIELD_MAP[f].label);
            cols.push({ wch: IMPORT_FIELD_MAP[f].width });
        });

        const rows = [headers];

        if (templateType === '5 Records' || templateType === 'All Records') {
            api.info({ message: 'Fetching existing registration records...', duration: 2 });
            try {
                const colRef = collection(db, REGISTRATIONS_PATH);
                const q2 = query(colRef, orderBy('created_at', 'desc'));
                const snapshot = await getDocs(q2);
                let records = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
                if (templateType === '5 Records') records = records.slice(0, 5);

                records.forEach(rec => {
                    const rowData = activeFields.map(f => {
                        if (f.startsWith('guardian_')) {
                            const g = (rec.guardians || [])[0] || {};
                            const gKey = f.replace('guardian_', '');
                            return g[gKey] || g[gKey === 'name' ? 'guardian_name' : gKey] || '';
                        }
                        return rec[f] || '';
                    });
                    rows.push(rowData);
                });
            } catch (err) {
                console.error('Error exporting registration records:', err);
                api.error({ message: 'Export Failed', description: 'Failed to retrieve registration records.' });
                return;
            }
        } else if (templateType === '1 Dummy Record') {
            const dummyData = {
                first_name: 'Dummy',
                last_name: 'Student',
                gender: 'Male',
                student_mobile_number: '9999999999',
                student_email_id: 'dummy.student@example.com',
                academic_year: '2024-2025',
                program: 'Class 1',
                date_of_birth: '15-05-2015',
                guardian_relation: 'Father',
                guardian_name: 'Dummy Father',
                guardian_mobile: '8888888888',
                guardian_email: 'dummy.father@example.com',
                blood_group: 'A+',
                status: 'Open',
                source: 'Walk-in'
            };
            rows.push(activeFields.map(f => dummyData[f] || `Sample ${IMPORT_FIELD_MAP[f]?.label || f}`));
        } else {
            rows.push(activeFields.map(() => ""));
        }

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = cols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registration");

        const filename = `Registration_Import_Template.${templateFormat === 'CSV' ? 'csv' : 'xlsx'}`;
        if (templateFormat === 'CSV') {
            XLSX.writeFile(wb, filename, { bookType: 'csv' });
        } else {
            XLSX.writeFile(wb, filename);
        }
        api.success({ message: `Template ${filename} downloaded successfully.` });
        setShowTemplateModal(false);
    };

    const handleImportFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const fileData = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    api.error({ message: 'Error', description: 'The file is empty.' });
                    return;
                }

                setPreviewRows(jsonData);
                api.success({ message: 'File parsed successfully.', description: `Found ${jsonData.length} rows.` });
            } catch (err) {
                console.error(err);
                api.error({ message: 'Parsing Failed', description: 'Failed to read spreadsheet file.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const fetchImportList = async () => {
        try {
            const colRef = collection(db, "schooler_system", "registration_imports", "logs");
            const q2 = query(colRef, orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q2);

            const list = [];
            snapshot.forEach((docSnap) => {
                const d = docSnap.data();
                let formattedTime = 'N/A';
                if (d.timestamp) {
                    formattedTime = d.timestamp.toDate ? d.timestamp.toDate().toLocaleString() : new Date(d.timestamp).toLocaleString();
                }
                list.push({
                    id: d.id || docSnap.id,
                    firestoreId: docSnap.id,
                    status: d.status || 'Success',
                    importType: d.importType || 'Insert New Records',
                    importFile: d.fileName || 'Uploaded File.xlsx',
                    time: formattedTime,
                    successCount: Number(d.successCount) || 0,
                    failureCount: Number(d.failureCount) || 0,
                    totalRecords: Number(d.totalRecords) || 0,
                    logs: d.logs || []
                });
            });

            setImportList(list);
        } catch (err) {
            console.error('Error fetching registration import logs:', err);
            const stored = localStorage.getItem('registration_imports');
            if (stored) setImportList(JSON.parse(stored));
        }
    };

    const handleSelectImportRun = (row) => {
        if (activeImportRun?.id === row.id) {
            setActiveImportRun(null);
            return;
        }
        setActiveImportRun(row);
    };

    const handleDeleteImport = async (id, firestoreId) => {
        if (!window.confirm(`Are you sure you want to delete this import log?`)) return;
        try {
            api.info({ message: 'Deleting import log...', duration: 1.5 });
            if (firestoreId) {
                const { doc: fsDoc, deleteDoc: fsDelete } = require('firebase/firestore');
                await fsDelete(fsDoc(db, "schooler_system", "registration_imports", "logs", firestoreId));
            }
            const stored = localStorage.getItem('registration_imports');
            if (stored) {
                const parsed = JSON.parse(stored);
                const filtered = parsed.filter(item => item.id !== id);
                localStorage.setItem('registration_imports', JSON.stringify(filtered));
            }
            setImportList(prev => prev.filter(item => item.id !== id));
            if (activeImportRun?.id === id) setActiveImportRun(null);
            api.success({ message: 'Import log deleted successfully.' });
        } catch (err) {
            console.error('Failed to delete import log:', err);
            api.error({ message: 'Delete Failed' });
        }
    };

    const handleStartImport = async () => {
        if (previewRows.length === 0) {
            api.error({ message: 'Error', description: 'No records to import.' });
            return;
        }

        setImporting(true);
        setImportProgress(0);
        const logs = [];
        let successCount = 0;
        let failCount = 0;
        const errorMessages = [];
        const allocatedGuardianEmails = [];

        try {
            for (let i = 0; i < previewRows.length; i++) {
                const row = previewRows[i];
                const rowNum = i + 2;

                const getField = (row, ...keys) => { for (const k of keys) { if (row[k] !== undefined && row[k] !== '') return row[k]; } return ''; };

                const parseDate = (d) => {
                    if (!d) return '';
                    if (typeof d === 'number') {
                        return new Date(Math.round((d - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                    }
                    if (typeof d === 'string' && d.includes('-')) {
                        const parts = d.split('-');
                        if (parts[0].length === 2 && parts[2].length === 4) {
                            return `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                    }
                    return d;
                };

                try {
                    // Extract all fields
                    const firstName = String(getField(row, 'First Name', 'first_name')).trim();
                    const middleName = String(getField(row, 'Middle Name', 'middle_name')).trim();
                    const lastName = String(getField(row, 'Last Name', 'last_name')).trim();
                    const studentFullName = String(getField(row, 'Student Full Name', 'student_full_name')).trim() || [firstName, middleName, lastName].filter(Boolean).join(' ');
                    const gender = String(getField(row, 'Gender', 'gender')).trim();
                    const mobile = String(getField(row, 'Student Mobile Number', 'student_mobile_number')).trim();
                    const email = String(getField(row, 'Student Email Address', 'student_email_id')).trim();
                    const academicYear = String(getField(row, 'Academic Year', 'academic_year')).trim();
                    const program = String(getField(row, 'Program (Class)', 'Program', 'program')).trim();
                    const customBoard = String(getField(row, 'Board', 'custom_board')).trim();
                    const rteStudent = String(getField(row, 'RTE Student', 'rte_student')).trim();
                    const rollNumber = String(getField(row, 'Roll Number', 'roll_number')).trim();
                    const grNumber = String(getField(row, 'GR Number', 'gr_number')).trim();
                    const rawRegDate = getField(row, 'Registration Date', 'registration_date');
                    const rawDob = getField(row, 'Date of Birth', 'date_of_birth');
                    const placeOfBirth = String(getField(row, 'Place of Birth', 'place_of_birth')).trim();
                    const caste = String(getField(row, 'Caste', 'caste')).trim();
                    const subCaste = String(getField(row, 'Sub Caste', 'sub_caste')).trim();
                    const category = String(getField(row, 'Category', 'category')).trim();
                    const religion = String(getField(row, 'Religion', 'religion')).trim();
                    const motherTongue = String(getField(row, 'Mother Tongue', 'mother_tongue')).trim();
                    const bloodGroup = String(getField(row, 'Blood Group', 'blood_group')).trim();
                    const aadhaarUid = String(getField(row, 'Aadhaar DISE Number (UID)', 'custom_aadhaar_uid')).trim();
                    const penNumCustom = String(getField(row, 'PEN Number (Custom)', 'custom_pen_number')).trim();
                    const apaarId = String(getField(row, 'APAAR ID', 'custom_apaar_id')).trim();
                    const aadhaarCard = String(getField(row, 'Aadhaar Card Number', 'custom_aadhaar_card_number')).trim();
                    const addressLine1 = String(getField(row, 'Address Line 1 (Current)', 'address_line_1')).trim();
                    const addressLine2 = String(getField(row, 'Address Line 2 (Permanent)', 'address_line_2')).trim();
                    const city = String(getField(row, 'City', 'city')).trim();
                    const state = String(getField(row, 'State', 'state')).trim();
                    const pincode = String(getField(row, 'Pincode', 'pincode')).trim();
                    const country = String(getField(row, 'Country', 'country')).trim() || 'India';
                    const emergencyMobile = String(getField(row, 'Emergency Mobile Number', 'emergency_mobile_number')).trim();
                    const altMobile = String(getField(row, 'Alt Mobile Number', 'alt_mobile')).trim();
                    const altEmail = String(getField(row, 'Alt Email', 'alt_email')).trim();
                    const source = String(getField(row, 'Source', 'source')).trim();
                    const rawFollowUp = getField(row, 'Follow-up Date', 'follow_up_date');
                    const statusField = String(getField(row, 'Status', 'status')).trim() || 'Open';
                    const feesStatusField = String(getField(row, 'Fees Status', 'fees_status')).trim();
                    const remarks = String(getField(row, 'Remarks', 'remarks')).trim();
                    const campusVisit = String(getField(row, 'Campus Visit', 'campus_visit')).trim();
                    const referredBy = String(getField(row, 'Referred By', 'referred_by')).trim();
                    const singleParent = String(getField(row, 'Single Parent', 'single_parent')).trim();
                    const registrationNo = String(getField(row, 'Registration No', 'registrationNo')).trim() || `REG-${Date.now().toString().slice(-6)}-${i}`;
                    const nationality = String(getField(row, 'Nationality', 'nationality')).trim();
                    const studentAadhar = String(getField(row, 'Student Aadhar Number', 'student_aadhar_number')).trim();
                    const singleGirlChild = String(getField(row, 'Single Girl Child', 'single_girl_child')).trim();
                    const speciallyAbled = String(getField(row, 'Specially Abled', 'specially_abled')).trim();
                    const belongingEws = String(getField(row, 'Belonging EWS', 'belonging_ews')).trim();
                    const penNumber = String(getField(row, 'Personal Education Number (PEN)', 'pen_number')).trim();
                    const abhaNumber = String(getField(row, 'ABHA Number', 'abha_number')).trim();
                    const prevSchoolName = String(getField(row, 'Previous School Name', 'prev_school_name')).trim();
                    const reasonForLeaving = String(getField(row, 'Reason For Leaving', 'reason_for_leaving')).trim();
                    const prevProgram = String(getField(row, 'Previous Class', 'prev_program')).trim();
                    const schoolAddress = String(getField(row, 'School Address', 'school_address')).trim();
                    const examMarks = String(getField(row, 'Exam Marks (%)', 'exam_marks')).trim();
                    const lastSchoolAffiliated = String(getField(row, 'Last School Affiliated', 'last_school_affiliated')).trim();
                    const prevSchoolLctc = String(getField(row, 'Previous School LC/TC Number', 'prev_school_lctc')).trim();
                    const rawLctcDate = getField(row, 'LC/TC Issue Date', 'lctc_issue_date');
                    // Guardian fields
                    const guardianRelation = String(getField(row, 'Guardian Relation', 'guardian_relation')).trim();
                    const guardianName = String(getField(row, 'Guardian Name', 'guardian_name')).trim();
                    const guardianEmail = String(getField(row, 'Guardian Email', 'guardian_email')).trim();
                    const guardianMobile = String(getField(row, 'Guardian Mobile', 'guardian_mobile')).trim();
                    const guardianAltNum = String(getField(row, 'Guardian Alternate Number', 'guardian_alternate_number')).trim();
                    const rawGuardianDob = getField(row, 'Guardian Date of Birth', 'guardian_date_of_birth');
                    const guardianEducation = String(getField(row, 'Guardian Education', 'guardian_education')).trim();
                    const guardianOccupation = String(getField(row, 'Guardian Occupation', 'guardian_occupation')).trim();
                    const guardianDesignation = String(getField(row, 'Guardian Designation', 'guardian_designation')).trim();
                    const guardianWorkAddr = String(getField(row, 'Guardian Work Address', 'guardian_work_address')).trim();

                    // --- Validations ---
                    if (!firstName) throw new Error("Missing required field 'First Name'");
                    if (!gender) throw new Error("Missing required field 'Gender'");
                    if (!mobile) throw new Error("Missing required field 'Student Mobile Number'");
                    if (!email) throw new Error("Missing required field 'Student Email Address'");

                    // Mobile number validation
                    const cleanMobile = mobile.replace(/\D/g, '');
                    if (cleanMobile.length !== 10) throw new Error(`Student Mobile Number must be exactly 10 digits. Got: '${mobile}'`);

                    if (emergencyMobile) {
                        const cleanEmMobile = emergencyMobile.replace(/\D/g, '');
                        if (cleanEmMobile.length !== 10) throw new Error(`Emergency Mobile Number must be exactly 10 digits. Got: '${emergencyMobile}'`);
                    }

                    // Gender validation
                    let resolvedGender = gender;
                    const validGenders = ['Male', 'Female', 'Other'];
                    const genderMatch = validGenders.find(g => g.toLowerCase() === gender.toLowerCase());
                    if (!genderMatch) throw new Error(`Invalid Gender: '${gender}'. Allowed: Male, Female, Other`);
                    resolvedGender = genderMatch;

                    // Blood Group validation
                    let resolvedBloodGroup = bloodGroup || undefined;
                    if (bloodGroup) {
                        const validBG = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
                        const bgMatch = validBG.find(bg => bg.toLowerCase() === bloodGroup.replace(/\s+/g, '').toLowerCase());
                        if (!bgMatch) throw new Error(`Invalid Blood Group: '${bloodGroup}'. Allowed: A+, A-, B+, B-, O+, O-, AB+, AB-`);
                        resolvedBloodGroup = bgMatch;
                    }

                    // Status validation
                    let resolvedStatus = statusField || 'Open';
                    if (statusField) {
                        const validStatuses = ['Open', 'Closed', 'Converted'];
                        const statusMatch = validStatuses.find(s => s.toLowerCase() === statusField.toLowerCase());
                        if (!statusMatch) throw new Error(`Invalid Status: '${statusField}'. Allowed: Open, Closed, Converted`);
                        resolvedStatus = statusMatch;
                    }

                    // Aadhaar validation
                    if (aadhaarUid && aadhaarUid.replace(/\D/g, '').length !== 18) {
                        throw new Error(`Aadhaar DISE Number (UID) must be exactly 18 digits. Got: '${aadhaarUid}'`);
                    }
                    if (penNumCustom && penNumCustom.replace(/\D/g, '').length !== 11) {
                        throw new Error(`PEN Number (Custom) must be exactly 11 digits. Got: '${penNumCustom}'`);
                    }
                    if (aadhaarCard && aadhaarCard.replace(/\D/g, '').length !== 12) {
                        throw new Error(`Aadhaar Card Number must be exactly 12 digits. Got: '${aadhaarCard}'`);
                    }
                    if (penNumber && penNumber.replace(/\D/g, '').length !== 11) {
                        throw new Error(`Personal Education Number (PEN) must be exactly 11 digits. Got: '${penNumber}'`);
                    }

                    // Guardian validation
                    const hasGuardianDetails = !!(guardianName || guardianMobile || guardianEmail || guardianOccupation || guardianEducation);
                    if (hasGuardianDetails) {
                        if (!guardianRelation) throw new Error("Guardian Relation is required when providing Guardian details.");
                        if (!guardianName) throw new Error("Guardian Name is required when providing Guardian details.");
                        if (!guardianMobile) throw new Error("Guardian Mobile is required when providing Guardian details.");

                        const validRelations = ['Father', 'Mother', 'Others'];
                        const relMatch = validRelations.find(r => r.toLowerCase() === guardianRelation.toLowerCase());
                        if (!relMatch) throw new Error(`Invalid Guardian Relation: '${guardianRelation}'. Allowed: Father, Mother, Others`);

                        if (guardianMobile.replace(/\D/g, '').length !== 10) {
                            throw new Error(`Guardian Mobile must be exactly 10 digits. Got: '${guardianMobile}'`);
                        }
                    }

                    // Parse dates
                    const dob = parseDate(rawDob);
                    const regDate = parseDate(rawRegDate) || new Date().toISOString().split('T')[0];
                    const followUpDate = parseDate(rawFollowUp);
                    const lctcDate = parseDate(rawLctcDate);
                    const guardianDob = parseDate(rawGuardianDob);

                    // --- Build Guardian ---
                    let finalGuardians = [];
                    if (hasGuardianDetails) {
                        const relMatch = ['Father', 'Mother', 'Others'].find(r => r.toLowerCase() === guardianRelation.toLowerCase()) || 'Others';
                        let gEmail = guardianEmail || '';
                        if (!gEmail) {
                            gEmail = generateUniqueGuardianEmail(guardianName, guardiansList, allocatedGuardianEmails);
                        }
                        allocatedGuardianEmails.push(gEmail);

                        // Try to find Guardian in ERPNext
                        let resolvedGuardianId = null;
                        try {
                            const found = guardiansList.find(g => g.guardian_name?.toLowerCase() === guardianName.toLowerCase());
                            if (found) {
                                resolvedGuardianId = found.name;
                            }
                        } catch (gSyncErr) {
                            console.warn('[Guardian Lookup] Gracefully caught:', gSyncErr.message);
                        }

                        finalGuardians.push({
                            is_new: true,
                            guardian: resolvedGuardianId || '',
                            guardian_name: guardianName,
                            relation: relMatch,
                            email_address: gEmail,
                            mobile_number: guardianMobile,
                            alternate_number: guardianAltNum,
                            date_of_birth: guardianDob,
                            education: guardianEducation,
                            occupation: guardianOccupation,
                            designation: guardianDesignation,
                            work_address: guardianWorkAddr
                        });
                    }

                    let isFeePaid = false;
                    let feePaymentMode = 'Cash';
                    let feeReceiptNo = '';
                    
                    if (feesStatusField.toLowerCase() === 'old student') {
                        isFeePaid = true;
                        feePaymentMode = 'Old Student';
                        feeReceiptNo = `OLD-${Date.now().toString().slice(-6)}-${i}`;
                    } else if (feesStatusField.toLowerCase() === 'paid') {
                        isFeePaid = true;
                        feePaymentMode = 'Online';
                        feeReceiptNo = `RCPT-${Date.now().toString().slice(-6)}-${i}`;
                    }

                    // --- Save to Firebase ---
                    const regPayload = {
                        ...initFormData,
                        academic_year: academicYear || initFormData.academic_year,
                        program: program || '',
                        custom_board: customBoard || '',
                        rte_student: rteStudent || '',
                        roll_number: rollNumber,
                        gr_number: grNumber,
                        registration_date: regDate,
                        first_name: firstName,
                        middle_name: middleName,
                        last_name: lastName,
                        student_full_name: studentFullName,
                        gender: resolvedGender,
                        date_of_birth: dob,
                        place_of_birth: placeOfBirth,
                        caste: caste,
                        sub_caste: subCaste,
                        category: category,
                        religion: religion,
                        mother_tongue: motherTongue,
                        blood_group: resolvedBloodGroup || '',
                        custom_aadhaar_uid: aadhaarUid,
                        custom_pen_number: penNumCustom,
                        custom_apaar_id: apaarId,
                        custom_aadhaar_card_number: aadhaarCard,
                        address_line_1: addressLine1,
                        address_line_2: addressLine2,
                        city: city,
                        state: state,
                        pincode: pincode,
                        country: country,
                        student_mobile_number: cleanMobile,
                        student_email_id: email,
                        emergency_mobile_number: emergencyMobile,
                        alt_mobile: altMobile,
                        alt_email: altEmail,
                        source: source,
                        follow_up_date: followUpDate,
                        status: resolvedStatus,
                        fees_status: feesStatusField,
                        isFeePaid: isFeePaid,
                        paymentMode: feePaymentMode,
                        receiptNo: feeReceiptNo,
                        remarks: remarks,
                        campus_visit: campusVisit,
                        referred_by: referredBy,
                        single_parent: singleParent,
                        registrationNo: registrationNo,
                        nationality: nationality,
                        student_aadhar_number: studentAadhar,
                        single_girl_child: singleGirlChild,
                        specially_abled: speciallyAbled,
                        belonging_ews: belongingEws,
                        pen_number: penNumber,
                        abha_number: abhaNumber,
                        prev_school_name: prevSchoolName,
                        reason_for_leaving: reasonForLeaving,
                        prev_program: prevProgram,
                        school_address: schoolAddress,
                        exam_marks: examMarks,
                        last_school_affiliated: lastSchoolAffiliated,
                        prev_school_lctc: prevSchoolLctc,
                        lctc_issue_date: lctcDate,
                        guardians: finalGuardians,
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                        is_imported: true,
                        imported_date: new Date().toISOString().split('T')[0]
                    };

                    // Remove document array defaults for imported records (no files uploaded)
                    // Keep default document checklist

                    if (importType === 'Update Existing Records') {
                        // Find existing record by registrationNo
                        if (!registrationNo) throw new Error("Missing 'Registration No' for update");
                        const existingQuery = query(collection(db, REGISTRATIONS_PATH));
                        const existingSnap = await getDocs(existingQuery);
                        const existingDoc = existingSnap.docs.find(d => d.data().registrationNo === registrationNo);
                        if (!existingDoc) throw new Error(`Registration '${registrationNo}' not found for update.`);
                        
                        // Only update non-empty fields
                        const updatePayload = {};
                        Object.keys(regPayload).forEach(k => {
                            if (regPayload[k] !== '' && regPayload[k] !== undefined && regPayload[k] !== null && k !== 'documents' && k !== 'siblings') {
                                updatePayload[k] = regPayload[k];
                            }
                        });
                        updatePayload.updated_at = serverTimestamp();
                        updatePayload.is_imported = true;
                        updatePayload.imported_date = new Date().toISOString().split('T')[0];
                        
                        await updateDoc(doc(db, REGISTRATIONS_PATH, existingDoc.id), updatePayload);
                        successCount++;
                        logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully updated Registration '${registrationNo}'` });
                    } else {
                        // Insert New Record
                        const colRef = collection(db, REGISTRATIONS_PATH);
                        await addDoc(colRef, regPayload);
                        successCount++;
                        logs.push({ type: 'success', msg: `Row ${rowNum}: Successfully created Registration '${registrationNo}' for ${firstName} ${lastName}` });
                    }
                } catch (err) {
                    failCount++;
                    let errMsg = err.message || 'Unknown error';
                    try {
                        if (err.response?.data?._server_messages) {
                            const parsed = JSON.parse(err.response.data._server_messages);
                            const firstMsg = typeof parsed === 'string' ? JSON.parse(parsed) : parsed[0];
                            errMsg = typeof firstMsg === 'string' ? JSON.parse(firstMsg).message : (firstMsg?.message || JSON.stringify(firstMsg));
                        }
                    } catch (_) { /* use original errMsg */ }
                    logs.push({ type: 'error', msg: `Row ${rowNum}: Failed - ${errMsg}` });
                    errorMessages.push(`Row ${rowNum}: ${errMsg}`);
                }

                setImportProgress(Math.round(((i + 1) / previewRows.length) * 100));
                setImportLogs([...logs]);
            }

            const finalStatus = failCount === 0
                ? "Success"
                : failCount === previewRows.length
                    ? "Failed"
                    : "Partial Success";

            const newRun = {
                id: `REG-IMP-${Date.now().toString().slice(-8)}`,
                status: finalStatus,
                importType: importType,
                importFile: selectedFile?.name || 'Uploaded File.xlsx',
                time: new Date().toLocaleString(),
                successCount: successCount,
                failureCount: failCount,
                totalRecords: previewRows.length,
                logs: logs
            };
            const updatedList = [newRun, ...(Array.isArray(importList) ? importList : []).filter(item => item && item.id !== newRun.id)];
            localStorage.setItem('registration_imports', JSON.stringify(updatedList));

            // Save log to Firebase
            try {
                await addDoc(collection(db, "schooler_system", "registration_imports", "logs"), {
                    id: newRun.id,
                    fileName: newRun.importFile,
                    importType: newRun.importType,
                    timestamp: serverTimestamp(),
                    successCount: newRun.successCount,
                    failureCount: newRun.failureCount,
                    totalRecords: newRun.totalRecords,
                    status: newRun.status,
                    logs: newRun.logs.map(l => ({ type: l.type, msg: l.msg })),
                    module: 'Registration'
                });
            } catch (fsErr) {
                console.error('Failed to save import log to Firestore:', fsErr);
            }

            if (successCount > 0 && failCount === 0) {
                api.success({ message: 'Import Successful', description: `Registration import completed. ${successCount} row(s) processed successfully.`, duration: 6 });
            } else if (successCount > 0 && failCount > 0) {
                api.warning({ message: 'Import Partial Success', description: `${successCount} succeeded, ${failCount} failed.`, duration: 8 });
            } else {
                const uniqueErrors = [...new Set(errorMessages)];
                api.error({ message: 'Import Failed', description: `All ${failCount} row(s) failed.\n${uniqueErrors.slice(0, 3).join('\n')}`, duration: 10 });
            }
        } catch (outerErr) {
            console.error('Critical import failure:', outerErr);
            api.error({ message: 'Import Error', description: outerErr.message, duration: 10 });
        } finally {
            setImporting(false);
            setImportView('list');
            fetchImportList();
        }
    };

    const tabItems = [
        {
            key: '1',
            label: <span className="flex items-center gap-2"><FiUser /> Student Detail</span>,
            children: (
                <div className="space-y-4">
                    <SectionHeader title="Academic Detail" color="red" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SelectField label="Academic Year" required value={formData.academic_year} options={academicYears} onChange={(v) => updateField('academic_year', v)} />
                        <SelectField label="Program (Class)" required value={formData.program} options={availableClasses} onChange={(v) => updateField('program', v)} />
                        <SelectField label="Board" value={formData.custom_board} options={boards} onChange={(v) => updateField('custom_board', v)} />
                        <SelectField label="RTE Student" value={formData.rte_student} options={['Yes', 'No']} onChange={(v) => updateField('rte_student', v)} />
                        <InputField label="Roll Number" value={formData.roll_number} onChange={(v) => updateField('roll_number', v)} placeholder="Enter Roll Number" />
                        <InputField label="GR Number" value={formData.gr_number} onChange={(v) => updateField('gr_number', v)} placeholder="Enter GR Number" />

                        <InputField label="Registration Date" type="date" value={formData.registration_date} onChange={(v) => updateField('registration_date', v)} />
                    </div>

                    <SectionHeader title="Basic Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="First Name" required value={formData.first_name} onChange={(v) => {
                            setFormData(prev => {
                                const next = { ...prev, first_name: v };
                                if (!editingRecord) {
                                    next.student_email_id = generateUniqueEmail(v, next.last_name, data);
                                }
                                next.student_full_name = [v, next.middle_name, next.last_name].filter(Boolean).join(' ').trim();
                                return next;
                            });
                        }} placeholder="Enter First Name" />
                        <InputField label="Middle Name" value={formData.middle_name} onChange={(v) => {
                            setFormData(prev => {
                                const next = { ...prev, middle_name: v };
                                next.student_full_name = [next.first_name, v, next.last_name].filter(Boolean).join(' ').trim();
                                return next;
                            });
                        }} placeholder="Enter Middle Name" />
                        <InputField label="Last Name" value={formData.last_name} onChange={(v) => {
                            setFormData(prev => {
                                const next = { ...prev, last_name: v };
                                if (!editingRecord) {
                                    next.student_email_id = generateUniqueEmail(next.first_name, v, data);
                                }
                                next.student_full_name = [next.first_name, next.middle_name, v].filter(Boolean).join(' ').trim();
                                return next;
                            });
                        }} placeholder="Enter Last Name" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Student Full Name" value={formData.student_full_name} onChange={(v) => updateField('student_full_name', v)} placeholder="Enter Student Full Name" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Gender" required value={formData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => updateField('gender', v)} />
                        <InputField label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
                        <InputField label="Place of Birth" value={formData.place_of_birth} onChange={(v) => updateField('place_of_birth', v)} placeholder="Enter Place of Birth" />
                        <SelectField label="Caste" value={formData.caste} options={availableCastes} onChange={(v) => updateField('caste', v)} />
                        <SelectField label="Religion" value={formData.religion} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']} onChange={(v) => updateField('religion', v)} />
                        <SelectField label="Blood Group" value={formData.blood_group} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} onChange={(v) => updateField('blood_group', v)} />
                        <InputField label="Aadhaar DISE number (UID)" type="tel" maxLength={18} value={formData.custom_aadhaar_uid} onChange={(v) => updateField('custom_aadhaar_uid', v)} placeholder="18-digit Aadhaar DISE number" />
                        <InputField label="PEN Number (Custom)" type="tel" maxLength={11} value={formData.custom_pen_number} onChange={(v) => updateField('custom_pen_number', v)} placeholder="11-digit PEN Number" />
                        <InputField label="APAAR ID" value={formData.custom_apaar_id} onChange={(v) => updateField('custom_apaar_id', v)} placeholder="APAAR ID" />
                        <InputField label="Aadhaar Card Number" type="tel" maxLength={12} value={formData.custom_aadhaar_card_number} onChange={(v) => updateField('custom_aadhaar_card_number', v)} placeholder="12-digit Aadhaar Card Number" />
                    </div>

                    <SectionHeader title="Residential Address" color="gray" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Address Line 1 (Current)" value={formData.address_line_1} onChange={(v) => updateField('address_line_1', v)} placeholder="House No, Street" />
                        <InputField label="Address Line 2 (Permanent)" value={formData.address_line_2} onChange={(v) => updateField('address_line_2', v)} placeholder="Locality, Landmark" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <InputField label="City" value={formData.city} onChange={(v) => updateField('city', v)} placeholder="Enter City" />
                        <InputField label="State" value={formData.state} onChange={(v) => updateField('state', v)} placeholder="Enter State" />
                        <InputField label="Pincode" value={formData.pincode} onChange={(v) => updateField('pincode', v)} placeholder="Enter Pincode" />
                        <SelectField label="Country" value={formData.country || 'India'} options={['India']} onChange={(v) => updateField('country', v)} />
                    </div>

                    <SectionHeader title="Communication" color="red" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Student Mobile Number" required type="tel" maxLength={10} value={formData.student_mobile_number} onChange={(v) => updateField('student_mobile_number', v)} placeholder="Enter 10-digit Mobile Number" />
                        <InputField label="Student Email Address" required type="email" value={formData.student_email_id} onChange={(v) => updateField('student_email_id', v)} placeholder="Enter Email Address" />
                        <InputField label="Emergency Mobile Number" type="tel" maxLength={10} value={formData.emergency_mobile_number} onChange={(v) => updateField('emergency_mobile_number', v)} placeholder="Enter 10-digit Emergency Mobile Number" />
                    </div>

                    <SectionHeader title="Additional Information" color="orange" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Source" value={formData.source} options={['Direct', 'Reference', 'Social Media']} onChange={(v) => updateField('source', v)} />
                        <InputField label="Follow-up Date" type="date" value={formData.follow_up_date} onChange={(v) => updateField('follow_up_date', v)} />
                        <SelectField label="Status" required value={formData.status} options={['Open', 'Closed', 'Converted']} onChange={(v) => updateField('status', v)} />
                    </div>
                </div>
            )
        },
        {
            key: '2',
            label: <span className="flex items-center gap-2"><FiUsers /> Parents Detail</span>,
            children: (
                <div className="space-y-6">
                    <div className="max-w-md">
                        <SelectField label="Single Parent?" value={formData.single_parent} options={['Yes', 'No']} onChange={(v) => updateField('single_parent', v)} placeholder="Single Parent?" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider border-b-2 border-blue-500 pb-1 w-fit">Guardian Details</h3>
                        {(formData.guardians || []).map((g, idx) => (
                            <div key={idx} className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50/40 relative shadow-sm">
                                <button onClick={() => removeGuardian(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 font-bold transition" title="Remove Guardian">✕</button>
                                
                                <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-gray-100">
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                            <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!g.is_new} onChange={() => updateGuardian(idx, 'is_new', false)} /> Link Existing Guardian
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                            <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!!g.is_new} onChange={() => updateGuardian(idx, 'is_new', true)} /> Create New Guardian
                                        </label>
                                    </div>
                                    {(formData.guardians || []).length > 1 && (
                                        <label className="flex items-center gap-2 text-sm font-medium text-blue-700 cursor-pointer mt-1">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                                checked={!!g.create_user_account}
                                                onChange={(e) => updateGuardian(idx, 'create_user_account', e.target.checked)} 
                                            /> 
                                            Create Portal User Account for this Guardian
                                        </label>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                        <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Relation with Student *</label>
                                        <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" value={g.relation || ''} onChange={e => updateGuardian(idx, 'relation', e.target.value)}>
                                            <option value="">Select Relation...</option>
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                    
                                    {!g.is_new ? (
                                        <>
                                            <div>
                                                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Select Guardian *</label>
                                                <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" value={g.guardian || ''} onChange={e => updateGuardian(idx, 'guardian', e.target.value)}>
                                                    <option value="">Link Guardian...</option>
                                                    {guardiansList.map(gl => <option key={gl.name} value={gl.name}>{gl.name} ({gl.guardian_name})</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <InputField label="Guardian Name" value={g.guardian_name || ''} disabled={true} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <InputField label="Guardian Name *" value={g.guardian_name || ''} onChange={v => updateGuardian(idx, 'guardian_name', v)} placeholder="Full Name" />
                                            <InputField label="Email Address *" type="email" value={g.email_address || ''} onChange={v => updateGuardian(idx, 'email_address', v)} placeholder="email@example.com" />
                                            <InputField label="Mobile Number *" type="tel" maxLength={10} value={g.mobile_number || ''} onChange={v => updateGuardian(idx, 'mobile_number', v)} placeholder="10-digit Number" />
                                            <InputField label="Alternate Number" type="tel" maxLength={10} value={g.alternate_number || ''} onChange={v => updateGuardian(idx, 'alternate_number', v)} placeholder="10-digit Number" />
                                            <InputField label="Date of Birth" type="date" value={g.date_of_birth || ''} onChange={v => updateGuardian(idx, 'date_of_birth', v)} />
                                            <InputField label="User Id" value={g.user || ''} onChange={v => updateGuardian(idx, 'user', v)} placeholder="User ID" />
                                            <div>
                                                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Education</label>
                                                <input className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" value={g.education || ''} onChange={e => updateGuardian(idx, 'education', e.target.value)} placeholder="Qualification" />
                                            </div>
                                            <div>
                                                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Occupation</label>
                                                <input className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" value={g.occupation || ''} onChange={e => updateGuardian(idx, 'occupation', e.target.value)} placeholder="Occupation" />
                                            </div>
                                            <div>
                                                <label className="text-[13px] font-semibold text-gray-700 mb-1 block">Designation</label>
                                                <input className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" value={g.designation || ''} onChange={e => updateGuardian(idx, 'designation', e.target.value)} placeholder="Designation" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <InputField label="Work Address" type="textarea" value={g.work_address || ''} onChange={v => updateGuardian(idx, 'work_address', v)} placeholder="Full Address" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(formData.guardians || []).length === 0 && (
                            <div className="text-center py-8 mb-6 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                                No Guardians Added
                            </div>
                        )}
                        <button onClick={addGuardian} className="px-4 py-2 bg-white border border-gray-200 text-blue-600 text-[13px] font-semibold rounded-md hover:bg-blue-50 transition shadow-sm">+ Add Guardian</button>
                    </div>
                </div>
            )
        },
        {
            key: '3',
            label: <span className="flex items-center gap-2"><FiBriefcase /> Office Use</span>,
            children: (
                <div className="space-y-6">
                    <SectionHeader title="Previous School Detail" color="red" />
                    <InputField label="Previous School Name" value={formData.prevSchoolName} onChange={(v) => updateField('prevSchoolName', v)} placeholder="Enter Previous School Name" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InputField label="Reason For Leaving School" value={formData.reasonForLeaving} onChange={(v) => updateField('reasonForLeaving', v)} placeholder="Enter Reason For Leaving School" />
                        <InputField label="Previous Class" value={formData.prevClass} onChange={(v) => updateField('prevClass', v)} placeholder="Enter Previous Class" />
                    </div>
                    <div className="mt-4">
                        <InputField label="School Address" type="textarea" value={formData.schoolAddress} onChange={(v) => updateField('schoolAddress', v)} placeholder="Enter School Address" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <InputField label="Exam Marks(%)" value={formData.examMarks} onChange={(v) => updateField('examMarks', v)} placeholder="Enter Exam Marks(%)" />
                        <SelectField label="Last School Affiliated Is" value={formData.lastSchoolAffiliated} options={['CBSE', 'ICSE', 'State Board']} onChange={(v) => updateField('lastSchoolAffiliated', v)} />
                        <InputField label="Previous School LC/TC Number" value={formData.prevSchoolLCTC} onChange={(v) => updateField('prevSchoolLCTC', v)} placeholder="Enter Previous School LC/TC Number" />
                        <InputField label="LC/TC Issue Date" type="date" value={formData.lctcIssueDate} onChange={(v) => updateField('lctcIssueDate', v)} />
                    </div>

                    <SectionHeader title="Additional Detail" color="blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InputField label="Nationality" value={formData.nationality} onChange={(v) => updateField('nationality', v)} placeholder="Enter Nationality" />
                        <SelectField label="Belonging EWS" value={formData.belongingEws} options={['Yes', 'No']} onChange={(v) => updateField('belongingEws', v)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <SelectField label="Single Girl Child?" value={formData.single_girl_child} options={['Yes', 'No']} onChange={(v) => updateField('single_girl_child', v)} placeholder="Single Girl Child?" />
                        <SelectField label="Specially Abled (Divyangjan)?" value={formData.specially_abled} options={['Yes', 'No']} onChange={(v) => updateField('specially_abled', v)} placeholder="Specially Abled (Divyangjan)?" />
                        <SelectField label="Belonging to the EWS?" value={formData.belonging_ews} options={['Yes', 'No']} onChange={(v) => updateField('belonging_ews', v)} placeholder="Belonging to the EWS?" />
                        <InputField label="ABHA Number" value={formData.abha_number} onChange={(v) => updateField('abha_number', v)} placeholder="Enter ABHA Number" />
                    </div>
                </div>
            )
        },
        {
            key: '4',
            label: <span className="flex items-center gap-2"><FiFileText /> Document Detail</span>,
            children: (
                <div className="space-y-6">
                    {/* Professional Guidelines Note in Red */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">⚠️ Important Upload Guidelines</p>
                        <p className="text-xs text-red-600 mt-1 font-medium">
                            Supported file formats: <span className="font-bold">JPG, JPEG, PDF</span>. Maximum allowed file size: <span className="font-bold">5 MB</span> per document. Please ensure all uploaded documents are clear and legible.
                        </p>
                    </div>

                    <div className="flex items-center justify-between border-b-2 border-blue-500 pb-2 mt-6">
                        <h3 className="text-sm font-bold uppercase tracking-tight text-blue-700">Student & Supporting Documents</h3>
                        {editingRecord && (
                            <button 
                                type="button"
                                onClick={handleQuickVerifyAllDocs}
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                title="Instantly marks all uploaded documents as Verified"
                            >
                                ⚡ Quick Verify All Uploaded Docs
                            </button>
                        )}
                    </div>
                    <div className="bg-gray-50/30 rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-100/50">
                                    <th className="px-6 py-3 font-bold text-gray-600">Document Name</th>
                                    <th className="px-6 py-3 font-bold text-gray-600">Status</th>
                                    <th className="px-6 py-3 font-bold text-gray-600">Upload / Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(formData.documents || []).map((doc, i) => {
                                    const existingFiles = doc.files ? doc.files : (doc.fileUrl ? [{ fileName: doc.fileName, fileUrl: doc.fileUrl, uploadedAt: doc.uploadedAt }] : []);
                                    return (
                                        <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">{doc.name}</div>
                                                {/* List of successfully uploaded files */}
                                                {existingFiles.length > 0 && (
                                                    <div className="flex flex-col gap-1.5 mt-2">
                                                        {existingFiles.map((f, fIdx) => (
                                                            <div key={fIdx} className="flex items-center justify-between bg-green-50/60 border border-green-200/60 rounded-lg px-2.5 py-1 max-w-xs">
                                                                <span className="text-[11px] text-green-700 font-medium truncate flex-1 mr-2" title={f.fileName}>
                                                                    📎 {f.fileName?.length > 20 ? f.fileName.slice(0, 17) + '...' : f.fileName}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleViewDocument(f.fileUrl, f.fileName)}
                                                                        className="text-blue-600 hover:text-blue-800 font-bold text-[10px] bg-white hover:bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded shadow-2xs transition-all cursor-pointer"
                                                                    >
                                                                        View
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleRemoveFile(i, fIdx)}
                                                                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                                                                        title="Remove this file"
                                                                    >
                                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 w-40 align-top">
                                                <SelectField 
                                                    value={doc.status} 
                                                    options={['Submitted', 'Pending', 'Verified']} 
                                                    onChange={(v) => updateDocStatus(i, v)} 
                                                />
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col gap-3">
                                                    <label className="cursor-pointer block">
                                                        <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider mb-1">
                                                            {existingFiles.length > 0 ? '+ Add More Images/Pages' : 'Upload File(s)'}
                                                        </span>
                                                        <input 
                                                            type="file" 
                                                            multiple
                                                            accept=".jpg,.jpeg,.pdf"
                                                            onChange={(e) => handleFileUpload(i, e.target.files)}
                                                            className="text-xs text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer transition-all max-w-[200px]" 
                                                        />
                                                    </label>

                                                    {/* Mini Visual Preview Gallery Box */}
                                                    {existingFiles.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100/80">
                                                            {existingFiles.map((f, fIdx) => {
                                                                const isPdf = f.fileUrl?.startsWith('data:application/pdf') || f.fileName?.toLowerCase().endsWith('.pdf');
                                                                return (
                                                                    <div 
                                                                        key={fIdx} 
                                                                        onClick={() => handleViewDocument(f.fileUrl, f.fileName)}
                                                                        className="relative group w-11 h-11 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer shadow-2xs hover:border-blue-400 transition-all"
                                                                        title={`Click to preview: ${f.fileName}`}
                                                                    >
                                                                        {isPdf ? (
                                                                            <span className="text-[9px] font-black text-red-600 flex flex-col items-center">
                                                                                📄<span className="text-[8px] scale-90">PDF</span>
                                                                            </span>
                                                                        ) : (
                                                                            <img 
                                                                                src={f.fileUrl} 
                                                                                alt="thumbnail" 
                                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                                                            />
                                                                        )}
                                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <span className="text-[8px] text-white font-bold">VIEW</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
        },
        {
            key: '5',
            label: <span className="flex items-center gap-2"><FiLink /> Siblings Info</span>,
            children: (
                <div className="space-y-6">
                    <SectionHeader title="Sibling Info" color="brown" />
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <SelectField 
                                label="Sibling Name ([StudentName][Class-Section][GRNo.])" 
                                value={selectedSibling} 
                                options={[
                                    { label: 'Rahul Sharma [4th-A][GR1023]', value: 'Rahul Sharma [4th-A][GR1023]' },
                                    { label: 'Priya Verma [2nd-B][GR1154]', value: 'Priya Verma [2nd-B][GR1154]' },
                                    { label: 'Aman Gupta [10th-C][GR0942]', value: 'Aman Gupta [10th-C][GR0942]' }
                                ]} 
                                onChange={(v) => setSelectedSibling(v)} 
                                placeholder="Select Student"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={addSibling}
                                className="px-6 py-1.5 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" /> Add New
                            </button>
                        </div>

                        {formData.siblings.length > 0 && (
                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <h4 className="text-sm font-bold text-gray-700 mb-4">Added Siblings</h4>
                                <div className="space-y-2">
                                    {formData.siblings.map((sib, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm group">
                                            <span className="text-sm font-semibold text-gray-700">{sib}</span>
                                            <button 
                                                onClick={() => removeSibling(sib)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-md transition-all"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: '6',
            label: <span className="flex items-center gap-2"><FiCreditCard /> Fee & Payment</span>,
            children: (
                <div className="space-y-6">
                    <SectionHeader title="Registration Fee Payment" color="green" />
                    {/* Fee Amount Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-blue-800">Applicable Registration Fee</p>
                            <p className="text-[11px] text-blue-600 italic">Auto-fetched from Form Fee Setup</p>
                        </div>
                        <div className="text-3xl font-black text-blue-700">₹ {regFee || formData.feeAmount || 0}</div>
                    </div>

                    {/* Payment Status */}
                    {formData.isFeePaid && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"><FiCheckCircle className="text-white w-6 h-6" /></div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-green-800">Payment Successful</p>
                                <p className="text-[12px] text-green-600">Receipt: <span className="font-bold">{formData.receiptNo}</span> | Mode: {formData.paymentMode} | Date: {formData.paymentDate ? new Date(formData.paymentDate).toLocaleDateString('en-IN') : '-'}</p>
                            </div>
                            <button onClick={() => handleDownloadReceipt(formData)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm">
                                <FiDownload /> Receipt
                            </button>
                        </div>
                    )}

                    {!formData.isFeePaid && (
                        <>
                            {/* Fee Amount */}
                            <div className="max-w-xs">
                                <InputField label="Fee Amount (₹)" type="number" value={formData.feeAmount} onChange={(v) => updateField('feeAmount', v)} />
                            </div>

                            {/* Online Payment */}
                            <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                                <h4 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2"><FiCreditCard className="text-blue-600" /> Pay Online (Razorpay)</h4>
                                <p className="text-[12px] text-gray-500 mb-4">Secure payment via UPI, Debit/Credit Card, Net Banking</p>
                                <button onClick={handleOnlinePayment} disabled={paymentProcessing} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
                                    {paymentProcessing ? <Spin size="small" /> : <FiCreditCard />} Pay ₹{formData.feeAmount || regFee || 0} Online
                                </button>
                            </div>

                            {/* Manual Payment */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <h4 className="text-sm font-black text-gray-800 mb-3">💵 Record Cash / Cheque Payment</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SelectField label="Payment Mode" value={formData.paymentMode} options={['Cash', 'Cheque']} onChange={(v) => updateField('paymentMode', v)} />
                                    <InputField label="Manual Receipt Ref (optional)" value={formData.receiptNo} onChange={(v) => updateField('receiptNo', v)} placeholder="Cheque No / Ref" />
                                    <div className="flex items-end">
                                        <button onClick={handleManualPayment} disabled={paymentProcessing} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900 transition-all flex items-center gap-2 disabled:opacity-50">
                                            {paymentProcessing ? <Spin size="small" /> : null} Record Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <InputField label="Remarks" value={formData.remarks} onChange={(v) => updateField('remarks', v)} placeholder="Enter Remarks" type="textarea" />
                    </div>
                </div>
            )
        }
    ];

    const renderPreviewModal = (
        <Modal
            title={<span className="font-bold text-blue-900 flex items-center gap-2">📄 {previewModal.name}</span>}
            open={previewModal.visible}
            footer={null}
            onCancel={() => setPreviewModal({ visible: false, url: '', name: '', type: '' })}
            width={800}
            centered
            destroyOnClose
        >
            <div className="flex flex-col items-center justify-center p-2 min-h-[300px]">
                {previewModal.type === 'pdf' ? (
                    <div className="w-full flex flex-col items-center gap-4">
                        <iframe 
                            src={previewModal.url} 
                            title={previewModal.name}
                            className="w-full h-[600px] border border-gray-200 rounded-lg shadow-inner" 
                        />
                        <a 
                            href={previewModal.url} 
                            download={previewModal.name || 'document.pdf'}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <FiDownload /> Download PDF File
                        </a>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center gap-4">
                        <img 
                            src={previewModal.url} 
                            alt={previewModal.name} 
                            className="max-w-full max-h-[70vh] object-contain rounded border border-gray-100 shadow-sm" 
                        />
                        <a 
                            href={previewModal.url} 
                            download={previewModal.name || 'document-image'}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all flex items-center gap-2 text-xs"
                        >
                            <FiDownload /> Download Original Image
                        </a>
                    </div>
                )}
            </div>
        </Modal>
    );

    // --- IMPORT VIEW ---
    if (view === 'import') {
        const REQUIRED_FIELDS = ['first_name', 'gender', 'student_mobile_number', 'student_email_id'];
        return (
            <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter animate-fade-in">
                {contextHolder}
                {/* Header */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Import Registration Data</h1>
                            <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                                <span>Home</span> / <span>Enquiry Module</span> / <span>Registration</span> / <span className="text-blue-600 font-bold">Import Data</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setImportView('list'); setActiveImportRun(null); fetchImportList(); }} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${importView === 'list' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            Import History
                        </button>
                        <button onClick={() => { setImportView('form'); setSelectedFile(null); setPreviewRows([]); setImportLogs([]); setImportProgress(0); }} className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${importView === 'form' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            <FiPlus className="w-4 h-4 inline mr-1" /> New Import
                        </button>
                    </div>
                </div>

                {/* IMPORT FORM VIEW */}
                {importView === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Import Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Step 1 - Template */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiDownload className="text-blue-600" /> Step 1: Download Template</h3>
                                <p className="text-sm text-gray-500 mb-4">Select the fields you want to include and download a pre-formatted template file.</p>
                                <button onClick={() => setShowTemplateModal(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                                    <FiDownload className="w-4 h-4" /> Download Import Template
                                </button>
                            </div>

                            {/* Step 2 - Upload */}
                            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FiFileText className="text-blue-600" /> Step 2: Upload Data File</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <select value={importType} onChange={e => setImportType(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                                        <option value="Insert New Records">Insert New Records</option>
                                        <option value="Update Existing Records">Update Existing Records</option>
                                    </select>
                                </div>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
                                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportFileChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer" />
                                    <p className="text-xs text-gray-400 mt-3">Supported: .xlsx, .xls, .csv files</p>
                                </div>
                                {selectedFile && <div className="mt-3 text-sm text-gray-600">📎 Selected: <span className="font-bold">{selectedFile.name}</span></div>}
                            </div>

                            {/* Preview Table */}
                            {previewRows.length > 0 && !importing && (
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800">Data Preview ({previewRows.length} rows)</h3>
                                        <button onClick={handleStartImport} className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer">
                                            🚀 Start Import
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-3 py-2 font-bold text-gray-500">#</th>
                                                    {Object.keys(previewRows[0]).map((key, idx) => (
                                                        <th key={idx} className="px-3 py-2 font-bold text-gray-500 whitespace-nowrap">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {previewRows.slice(0, 10).map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-3 py-2 font-bold text-gray-400">{i + 1}</td>
                                                        {Object.values(row).map((val, j) => (
                                                            <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[150px] truncate">{String(val)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {previewRows.length > 10 && <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-50">Showing first 10 of {previewRows.length} rows</div>}
                                </div>
                            )}

                            {/* Import Progress */}
                            {importing && (
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4">Importing... {importProgress}%</h3>
                                    <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden">
                                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 flex items-center justify-center" style={{ width: `${importProgress}%` }}>
                                            <span className="text-[9px] text-white font-bold">{importProgress}%</span>
                                        </div>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                                        {importLogs.map((log, idx) => (
                                            <div key={idx} className={`text-xs px-3 py-2 rounded-lg border ${log.type === 'success' ? 'bg-green-50/30 border-green-100/50 text-green-800' : 'bg-red-50/30 border-red-100/50 text-red-800'}`}>
                                                {log.type === 'success' ? <FiCheckCircle className="w-3.5 h-3.5 inline mr-1.5 text-green-600" /> : <FiX className="w-3.5 h-3.5 inline mr-1.5 text-red-600" />}
                                                {log.msg}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Notes & Instructions */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                                <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">📋 Import Instructions</h4>
                                <div className="space-y-3 text-xs text-blue-800">
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold text-red-600 mb-1">⚠️ Required Fields</p>
                                        <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                                            <li>First Name</li>
                                            <li>Gender</li>
                                            <li>Student Mobile Number (10 digits)</li>
                                            <li>Student Email Address</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">📅 Date Format</p>
                                        <p>YYYY-MM-DD or DD-MM-YYYY (auto-detected). Excel date serial numbers are also supported.</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">🏫 Board Field</p>
                                        <p>If you have multiple Boards (like CBSE, GSEB), ensure you provide the exact same name as in the Company list in ERPNext.</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">✅ Allowed Values</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li><b>Gender:</b> Male, Female, Other</li>
                                            <li><b>Blood Group:</b> A+, A-, B+, B-, O+, O-, AB+, AB-</li>
                                            <li><b>Guardian Relation:</b> Father, Mother, Others</li>
                                            <li><b>RTE Student:</b> Yes, No</li>
                                            <li><b>Status:</b> Open, Closed, Converted</li>
                                            <li><b>Source:</b> Direct, Reference, Social Media</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">👨‍👩‍👧 Guardian Import</p>
                                        <p>If providing guardian details, ensure <b>Guardian Name</b>, <b>Guardian Mobile</b>, and <b>Guardian Relation</b> are all present. Guardian will be auto-created in ERPNext.</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">📱 Mobile Numbers</p>
                                        <p>All mobile numbers must be exactly <b>10 digits</b>. Non-numeric characters will cause errors.</p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">🔢 ID Number Lengths</p>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            <li>Aadhaar DISE UID: 18 digits</li>
                                            <li>PEN Number: 11 digits</li>
                                            <li>Aadhaar Card: 12 digits</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3 border border-blue-100/50">
                                        <p className="font-bold mb-1">🏷️ Registration No</p>
                                        <p>If not provided, a unique Registration Number will be auto-generated as <b>REG-XXXXXX</b>.</p>
                                    </div>
                                    <div className="rounded-lg p-3 border border-green-200 bg-green-50/50">
                                        <p className="font-bold text-green-700 mb-1">💰 Fees Status (Old Students)</p>
                                        <p className="text-green-800">For academic year <b>2025-26</b> old students, set <b>Fees Status</b> to <code className="bg-green-100 px-1.5 py-0.5 rounded border border-green-200">old student</code> to automatically bypass admission fees.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* IMPORT LIST VIEW */}
                {importView === 'list' && (
                    <div className="space-y-6">
                        {/* Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Runs</span><h3 className="text-2xl font-bold text-gray-800 mt-1">{importList.length}</h3></div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FiFileText className="w-6 h-6" /></div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Success Rows</span><h3 className="text-2xl font-bold text-emerald-600 mt-1">{importList.reduce((a, c) => a + (c.successCount || 0), 0)}</h3></div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><FiCheckCircle className="w-6 h-6" /></div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Failed Rows</span><h3 className="text-2xl font-bold text-rose-600 mt-1">{importList.reduce((a, c) => a + (c.failureCount || 0), 0)}</h3></div>
                                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><FiX className="w-6 h-6" /></div>
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
                                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Success Rate</span><h3 className="text-2xl font-bold text-violet-600 mt-1">{(() => { const t = importList.reduce((a, c) => a + (c.successCount || 0) + (c.failureCount || 0), 0); return t > 0 ? ((importList.reduce((a, c) => a + (c.successCount || 0), 0) / t) * 100).toFixed(1) : '0'; })()}%</h3></div>
                                <div className="p-3 bg-violet-50 text-violet-600 rounded-lg"><FiFileText className="w-6 h-6" /></div>
                            </div>
                        </div>

                        {/* Import History Table */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-800">Import History</h3>
                                <button onClick={fetchImportList} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm flex items-center gap-2 cursor-pointer">
                                    <FiRefreshCw className="w-4 h-4" /> Refresh
                                </button>
                            </div>
                            {importList.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    <FiFileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-700">No Import Logs</h3>
                                    <p className="text-sm text-gray-400 mt-1">Create a new import to get started.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-6 py-4 font-semibold text-gray-600">Import ID / File</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600">Results</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {importList.map((run) => {
                                                let badge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                                if (run.status === 'Partial Success') badge = "bg-amber-50 text-amber-700 border-amber-100";
                                                else if (run.status === 'Failed') badge = "bg-rose-50 text-rose-700 border-rose-100";
                                                return (
                                                    <tr key={run.id} className="hover:bg-gray-50/50 transition cursor-pointer" onClick={() => handleSelectImportRun(run)}>
                                                        <td className="px-6 py-4"><div className="font-semibold text-gray-800 truncate max-w-xs">{run.importFile}</div><div className="text-xs text-gray-400 mt-0.5">{run.id}</div></td>
                                                        <td className="px-6 py-4 text-gray-600">{run.time}</td>
                                                        <td className="px-6 py-4"><span className="text-gray-600 text-xs px-2.5 py-1 bg-gray-100 rounded-md font-medium">{run.importType}</span></td>
                                                        <td className="px-6 py-4"><div className="flex items-center gap-1.5 text-xs"><span className="font-bold text-emerald-600">{run.successCount}</span><span className="text-gray-400">/</span><span className="font-bold text-rose-600">{run.failureCount}</span><span className="text-gray-400">of</span><span className="font-bold text-gray-700">{run.totalRecords}</span></div></td>
                                                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge}`}>{run.status}</span></td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteImport(run.id, run.firestoreId); }} className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"><FiTrash2 className="w-4 h-4" /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Selected Run Details - Drawer */}
                        {activeImportRun && (
                            <div className="fixed inset-0 z-50 flex justify-end">
                                <div onClick={() => setActiveImportRun(null)} className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300" />
                                <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-gray-100">
                                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800 truncate max-w-md">{activeImportRun.importFile}</h2>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><span>ID: {activeImportRun.id}</span><span>•</span><span>{activeImportRun.time}</span></div>
                                        </div>
                                        <button onClick={() => setActiveImportRun(null)} className="p-2 rounded-full hover:bg-gray-200 transition text-gray-500 cursor-pointer">✕</button>
                                    </div>
                                    <div className="p-6 border-b border-gray-100 grid grid-cols-3 gap-4 bg-white">
                                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-center">
                                            <span className="text-xs font-medium text-emerald-800">Success</span>
                                            <p className="text-2xl font-bold text-emerald-700 mt-1">{activeImportRun.successCount}</p>
                                        </div>
                                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50 text-center">
                                            <span className="text-xs font-medium text-rose-800">Failed</span>
                                            <p className="text-2xl font-bold text-rose-700 mt-1">{activeImportRun.failureCount}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                            <span className="text-xs font-medium text-gray-600">Total</span>
                                            <p className="text-2xl font-bold text-gray-800 mt-1">{activeImportRun.totalRecords}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/50">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detailed Processing Logs</h3>
                                        {activeImportRun.logs && activeImportRun.logs.length > 0 ? (
                                            activeImportRun.logs.map((item, idx) => (
                                                <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 transition shadow-xs ${item.type === 'success' ? 'bg-emerald-50/20 border-emerald-100/50 text-emerald-950' : 'bg-rose-50/20 border-rose-100/50 text-rose-950'}`}>
                                                    <div className="mt-0.5">{item.type === 'success' ? <FiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <FiX className="w-4 h-4 text-rose-600 flex-shrink-0" />}</div>
                                                    <div className="text-sm font-medium leading-relaxed break-all">{item.msg}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-20 text-gray-400"><p className="text-sm">No individual row logs found for this run.</p></div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-gray-100 flex justify-end bg-white">
                                        <button onClick={() => setActiveImportRun(null)} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition cursor-pointer shadow-sm">Close Inspector</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Template Download Modal */}
                <Modal
                    title={<span className="font-bold text-gray-800 text-lg">📥 Download Registration Import Template</span>}
                    open={showTemplateModal}
                    onCancel={() => setShowTemplateModal(false)}
                    footer={null}
                    width={850}
                    centered
                    destroyOnClose
                >
                    <div className="space-y-5 pt-2">
                        {/* Format & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">File Format</label>
                                <select value={templateFormat} onChange={e => setTemplateFormat(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                                    <option value="Excel">Excel (.xlsx)</option>
                                    <option value="CSV">CSV (.csv)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">Export Type</label>
                                <select value={templateType} onChange={e => setTemplateType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                                    <option value="Blank Template">Blank Template</option>
                                    <option value="1 Dummy Record">With 1 Dummy Record</option>
                                    <option value="5 Records">With 5 Records</option>
                                    <option value="All Records">With All Records</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Quick Select Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => { const all = {}; IMPORT_ORDERED_FIELDS.forEach(f => { all[f] = true; }); setSelectedFields(all); }} className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md cursor-pointer hover:bg-gray-800 transition">Select All</button>
                            <button onClick={() => { const req = {}; IMPORT_ORDERED_FIELDS.forEach(f => { req[f] = REQUIRED_FIELDS.includes(f); }); setSelectedFields(req); }} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-md cursor-pointer hover:bg-red-700 transition">Select Mandatory Only</button>
                            <button onClick={() => { const none = {}; IMPORT_ORDERED_FIELDS.forEach(f => { none[f] = false; }); setSelectedFields(none); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-md cursor-pointer hover:bg-gray-300 transition">Unselect All</button>
                        </div>

                        {/* Field Selector */}
                        <div className="max-h-[400px] overflow-y-auto border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-4">
                            {/* Academic */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">📚 Academic Detail</h4>
                            <div className="grid grid-cols-3 gap-2">{['academic_year','program','custom_board','rte_student','roll_number','gr_number','registration_date'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Basic */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">👤 Basic Detail</h4>
                            <div className="grid grid-cols-3 gap-2">{['first_name','middle_name','last_name','student_full_name','gender','date_of_birth','place_of_birth','caste','sub_caste','category','religion','mother_tongue','blood_group','custom_aadhaar_uid','custom_pen_number','custom_apaar_id','custom_aadhaar_card_number'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Address */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">🏠 Address</h4>
                            <div className="grid grid-cols-3 gap-2">{['address_line_1','address_line_2','city','state','pincode','country'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Communication */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">📞 Communication</h4>
                            <div className="grid grid-cols-3 gap-2">{['student_mobile_number','student_email_id','emergency_mobile_number','alt_mobile','alt_email'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Additional */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">📝 Additional Info</h4>
                            <div className="grid grid-cols-3 gap-2">{['source','follow_up_date','status','fees_status','remarks','campus_visit','referred_by','single_parent'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Guardian */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">👨‍👩‍👧 Guardian Detail</h4>
                            <div className="grid grid-cols-3 gap-2">{['guardian_relation','guardian_name','guardian_email','guardian_mobile','guardian_alternate_number','guardian_date_of_birth','guardian_education','guardian_occupation','guardian_designation','guardian_work_address'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Office Use */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">🏢 Office Use / Previous School</h4>
                            <div className="grid grid-cols-3 gap-2">{['prev_school_name','reason_for_leaving','prev_program','school_address','exam_marks','last_school_affiliated','prev_school_lctc','lctc_issue_date','nationality','student_aadhar_number','single_girl_child','specially_abled','belonging_ews','pen_number','abha_number'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                            {/* Registration */}
                            <div><h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">🏷️ Registration</h4>
                            <div className="grid grid-cols-3 gap-2">{['registrationNo'].map(f => <CheckboxField key={f} name={f} label={IMPORT_FIELD_MAP[f].label} isRed={REQUIRED_FIELDS.includes(f)} />)}</div></div>
                        </div>

                        {/* Download Button */}
                        <div className="flex justify-end pt-2">
                            <button onClick={handleDownloadTemplate} className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 cursor-pointer">
                                <FiDownload className="w-4 h-4" /> Download Template ({IMPORT_ORDERED_FIELDS.filter(f => selectedFields[f]).length} fields)
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1200px] mx-auto pb-24 text-gray-800 font-inter">
                {contextHolder}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => {
                            // If they go back, ask if they want to clear draft? No, just keep it in case they return.
                            setView('list');
                        }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                            {editingRecord ? `Edit Registration: ${formData.registrationNo}` : 'New Registration Form'}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer mr-4">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                                    checked={formData.isDisabled || false}
                                    onChange={(e) => updateField('isDisabled', e.target.checked)}
                                />
                                <span className={`text-sm font-bold ${formData.isDisabled ? 'text-red-600' : 'text-gray-500'}`}>
                                    {formData.isDisabled ? 'ACCOUNT DISABLED (LEFT)' : 'Disable Account (Left Student)'}
                                </span>
                            </label>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50">
                                {saving ? <Spin size="small" /> : <FiSave className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Registration'}
                            </button>
                        </div>
                </div>
                <div className="bg-white p-6 shadow-xl rounded-b-xl border-x border-b border-gray-100">
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="custom-enquiry-tabs" />
                </div>
                {renderPreviewModal}
            </div>
        );
    }

    const handleOpenExportModal = (format) => {
        if (!filteredData || filteredData.length === 0) {
            notification.warning({ message: 'No data to export' });
            return;
        }
        
        const keys = new Set();
        filteredData.forEach(row => {
            Object.keys(row).forEach(key => keys.add(key));
        });
        
        const fields = Array.from(keys).sort();
        setAvailableExportFields(fields);
        setSelectedExportFields(fields);
        setExportFormat(format);
        setIsExportModalVisible(true);
    };

    const confirmExport = () => {
        if (selectedExportFields.length === 0) {
            notification.warning({ message: 'Please select at least one field to export' });
            return;
        }

        const exportArray = filteredData.map(record => {
            const cleanRecord = {};
            selectedExportFields.forEach(field => {
                if (record[field] !== undefined) {
                    let val = record[field];
                    if (val && val.toDate) {
                        val = val.toDate().toLocaleString();
                    } else if (typeof val === 'object' && val !== null) {
                        val = JSON.stringify(val);
                    }
                    cleanRecord[field] = val;
                }
            });
            return cleanRecord;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportArray);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

        if (exportFormat === 'csv') {
            XLSX.writeFile(workbook, `Registrations_${new Date().toISOString().split('T')[0]}.csv`);
        } else {
            XLSX.writeFile(workbook, `Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
        
        notification.success({ message: `Exported as ${exportFormat.toUpperCase()} successfully` });
        setIsExportModalVisible(false);
    };

    return (
        <div className="p-6 w-full mx-auto pb-24 text-gray-800 font-inter">
            {contextHolder}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manage Registration</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Registration</span> / <span className="text-blue-600 font-bold">Manage Registration</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenExportModal('csv')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-blue-700">
                            <FiDownload className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={() => handleOpenExportModal('xlsx')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-green-700">
                            <FiDownload className="w-4 h-4" /> Excel
                        </button>
                    </div>
                    <button onClick={() => { setView('import'); setImportView('form'); }} className="px-4 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-50 text-blue-700 transition-all shadow-sm active:scale-95">
                        <FiFileText className="w-4 h-4" /> Import Data
                    </button>
                    <button onClick={() => { 
                        sessionStorage.removeItem('reg_form_data');
                        setFormData({ ...initFormData, registrationNo: `REG-${Date.now().toString().slice(-6)}` });
                        setEditingRecord(null); 
                        setView('form'); 
                        setActiveTab('1');
                    }} className="px-5 py-2 bg-[#8C3A3A] text-white rounded-lg text-sm font-black hover:bg-[#732929] transition-all shadow-lg shadow-black/10 flex items-center gap-2 active:scale-95">
                        <FiPlus className="w-4 h-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Start Date</label>
                        <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">End Date</label>
                        <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Academic Year</label>
                        <select
                            value={filterAcademicYear}
                            onChange={(e) => setFilterAcademicYear(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Years</option>
                            {academicYears.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Program (Class)</label>
                        <select
                            value={filterProgram}
                            onChange={(e) => setFilterProgram(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Programs</option>
                            {availableClasses.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Board</label>
                        <select
                            value={filterBoard}
                            onChange={(e) => setFilterBoard(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Boards</option>
                            {boards.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Active Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Converted">Converted</option>
                            <option value="Disabled">Disabled / Left</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Fee Status</label>
                        <select
                            value={filterFeeStatus}
                            onChange={(e) => setFilterFeeStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Payments</option>
                            <option value="Paid">✅ PAID</option>
                            <option value="Unpaid">⏳ UNPAID</option>
                            <option value="Old Student">🎓 OLD STUDENT</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filterImportedOnly}
                                onChange={(e) => setFilterImportedOnly(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Show Imported Data Only
                        </label>
                        {filterImportedOnly && (
                            <div className="flex items-center gap-2">
                                <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Import Date:</label>
                                <input
                                    type="date"
                                    value={filterImportedDate}
                                    onChange={(e) => setFilterImportedDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setFilterDateFrom('');
                            setFilterDateTo('');
                            setFilterAcademicYear('All');
                            setFilterProgram('All');
                            setFilterBoard('All');
                            setFilterStatus('All');
                            setFilterFeeStatus('All');
                            setFilterImportedOnly(false);
                            setFilterImportedDate('');
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all cursor-pointer"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3 w-full max-w-md">
                        <div className="relative flex-1">
                            <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none transition-all placeholder:text-gray-400" 
                                placeholder="Search registrations..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {!loading && `${Math.min(visibleCount, filteredData.length)} of ${filteredData.length} TOTAL REGISTRATIONS`}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Registration Code</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Student Name</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Program (Class)</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Academic Year</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Mobile No.</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Date of Registration</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Date of Birth</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Fee Status</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Status</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Last Updated On</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px]">Download</th>
                                <th className="px-2 py-3 font-bold text-gray-500 uppercase tracking-widest text-[9px] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400 font-inter">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-400 font-medium font-inter italic">No matching records found</td>
                                </tr>
                            ) : (
                                filteredData.slice(0, visibleCount).map((row, index) => (
                                    <tr key={`${row.id}_${index}`} className="hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => { setEditingRecord(row); setView('form'); }}>
                                        <td className="px-2 py-3 font-bold text-blue-600 tracking-tight">{row.registrationNo}</td>
                                        <td className="px-2 py-3 font-bold text-gray-900 tracking-tight">{row.first_name} {row.last_name}</td>
                                        <td className="px-2 py-3 text-gray-600 font-medium">{row.program || '-'}</td>
                                        <td className="px-2 py-3 text-gray-600 font-medium">{row.academic_year || '-'}</td>
                                        <td className="px-2 py-3 text-gray-600 font-bold">{row.student_mobile_number || '-'}</td>
                                        <td className="px-2 py-3 text-gray-600 font-medium">{row.registration_date || '-'}</td>
                                        <td className="px-2 py-3 text-gray-600 font-medium">{row.date_of_birth || '-'}</td>
                                        <td className="px-2 py-3">
                                            <div className="flex flex-col gap-1 items-start">
                                                {row.paymentMode === 'Old Student' || (row.fees_status && row.fees_status.toLowerCase() === 'old student') ? (
                                                    <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                                                        🎓 OLD STUDENT
                                                    </span>
                                                ) : (
                                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${row.isFeePaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                        {row.isFeePaid ? '✅ PAID' : '⏳ UNPAID'}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    ₹ {row.feeAmount || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3">
                                            {row.isDisabled ? (
                                                <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                                    DISABLED
                                                </span>
                                            ) : (
                                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${row.status === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {row.status || 'Open'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-2 py-3 text-gray-500 font-medium text-[11px] whitespace-nowrap">
                                            {row.updated_at ? dayjs(row.updated_at.toDate ? row.updated_at.toDate() : row.updated_at).fromNow() : row.created_at ? dayjs(row.created_at.toDate ? row.created_at.toDate() : row.created_at).fromNow() : '-'}
                                        </td>
                                        <td className="px-2 py-3">
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); generatePDF(row); }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                    title="Download Registration Form"
                                                >
                                                    <FiFileText className="w-4 h-4" />
                                                </button>
                                                {row.isFeePaid && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadReceipt(row); }}
                                                        className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-all"
                                                        title="Download Fee Receipt"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingRecord(row); setView('form'); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors"><FiTrash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredData.length > 0 && (
                    <div className="flex justify-between items-center p-4 bg-gray-50/30 border-t border-gray-100">
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                            {[20, 100, 500, 2500].map((size) => (
                                <button
                                    key={size}
                                    className={`px-4 py-1.5 text-xs font-bold border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition cursor-pointer ${
                                        pageSize === size ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
                                    }`}
                                    onClick={() => {
                                        setPageSize(size);
                                        setVisibleCount(size);
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                        {visibleCount < filteredData.length && (
                            <button
                                className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-xs hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                onClick={() => setVisibleCount(prev => prev + pageSize)}
                            >
                                Load More
                            </button>
                        )}
                    </div>
                )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-enquiry-tabs .ant-tabs-nav::before { border-bottom: 1px solid #e5e7eb; }
                .custom-enquiry-tabs .ant-tabs-tab { padding: 12px 16px; margin: 0 !important; font-weight: 700; font-size: 14px; color: #6b7280; transition: all 0.2s; }
                .custom-enquiry-tabs .ant-tabs-tab-active { color: #2563eb !important; }
                .custom-enquiry-tabs .ant-tabs-ink-bar { height: 3px !important; background: #2563eb !important; }
            `}} />
            {isExportModalVisible && (
                <Modal
                    title={<div className="text-lg font-black text-gray-900 tracking-tight">Select Fields to Export</div>}
                    open={isExportModalVisible}
                    onCancel={() => setIsExportModalVisible(false)}
                    footer={null}
                    width={800}
                    className="custom-export-modal"
                >
                    <div className="py-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-gray-600">{selectedExportFields.length} of {availableExportFields.length} fields selected</span>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedExportFields(availableExportFields)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Select All</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={() => setSelectedExportFields([])} className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors">Deselect All</button>
                            </div>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {availableExportFields.map(field => (
                                    <label key={field} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors group">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                            checked={selectedExportFields.includes(field)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedExportFields([...selectedExportFields, field]);
                                                } else {
                                                    setSelectedExportFields(selectedExportFields.filter(f => f !== field));
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900" title={field}>
                                            {field}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsExportModalVisible(false)}
                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmExport}
                                disabled={selectedExportFields.length === 0}
                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FiDownload className="w-4 h-4" />
                                Export as {exportFormat.toUpperCase()}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            {renderPreviewModal}
        </div>
    );
}
