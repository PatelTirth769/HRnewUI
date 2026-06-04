import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import axios from 'axios';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX, FiFileText, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';
import { generateAdmissionReceipt } from './AdmissionFeeReceipt';



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
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('reg_tab') || '1');
    const [regFee, setRegFee] = useState(0);
    const [formData, setFormData] = useState(() => {
        const saved = sessionStorage.getItem('reg_form_data');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return initFormData;
    });
    const [selectedSibling, setSelectedSibling] = useState('');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [availableCastes, setAvailableCastes] = useState(['General', 'OBC', 'SC', 'ST']);
    const [academicYears, setAcademicYears] = useState([]);
    const [guardiansList, setGuardiansList] = useState([]);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [previewModal, setPreviewModal] = useState({ visible: false, url: '', name: '', type: '' });

    // Filters state
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterProgram, setFilterProgram] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterFeeStatus, setFilterFeeStatus] = useState('All');

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
            const [progRes, yearRes, guardianRes, casteRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Guardian?fields=["name","guardian_name","email_address"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Student Category?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            const programs = progRes.data.data?.map(p => p.name) || [];
            const years = yearRes.data.data?.map(y => y.name) || [];
            const guards = guardianRes.data.data || [];
            const castes = casteRes.data.data?.map(c => c.name) || [];
            
            if (castes.length > 0) {
                setAvailableCastes(castes);
            }
            
            setAcademicYears(years);
            setGuardiansList((guardianRes.data.data || []).map(g => ({ name: g.name, guardian_name: g.guardian_name || g.name, email_address: g.email_address || '' })));
            await fetchRestrictions(programs);
        } catch (err) {
            console.error('Error fetching ERPNext data:', err);
        }
    };

    useEffect(() => {
        fetchERPNextData();
        if (view === 'list') fetchData();
        else {
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
        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/program_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            setAvailableClasses(programs.filter(c => !restricted.includes(c)));
        } catch (err) { 
            console.error('Restriction fetch failed', err);
            setAvailableClasses(programs);
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
            const regs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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

            console.log('[Registration Save] 💾 Saving Registration to Firebase. Document Data inside payload:', finalData.documents);

            if (editingRecord) {
                const docRef = doc(db, REGISTRATIONS_PATH, editingRecord.id);
                await updateDoc(docRef, finalData);
                api.success({ message: 'Registration Updated Successfully' });
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
            if (filterProgram !== 'All' && d.program !== filterProgram) {
                return false;
            }

            // 3. Status Filter (Converted vs Open)
            if (filterStatus !== 'All') {
                const isConverted = d.status === 'Converted';
                if (filterStatus === 'Converted' && !isConverted) return false;
                if (filterStatus === 'Open' && isConverted) return false;
            }

            // 4. Fee Status Filter (Paid vs Unpaid)
            if (filterFeeStatus !== 'All') {
                const isPaid = !!d.isFeePaid;
                if (filterFeeStatus === 'Paid' && !isPaid) return false;
                if (filterFeeStatus === 'Unpaid' && isPaid) return false;
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

            return true;
        });
    }, [data, searchQuery, filterProgram, filterStatus, filterFeeStatus, filterDateFrom, filterDateTo]);

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
                if (found) g[idx].guardian_name = found.guardian_name;
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

    const tabItems = [
        {
            key: '1',
            label: <span className="flex items-center gap-2"><FiUser /> Student Detail</span>,
            children: (
                <div className="space-y-4">
                    <SectionHeader title="Academic Detail" color="red" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Academic Year" required value={formData.academic_year} options={academicYears} onChange={(v) => updateField('academic_year', v)} />
                        <SelectField label="Program (Class)" required value={formData.program} options={availableClasses} onChange={(v) => updateField('program', v)} />
                        <InputField label="Roll Number" value={formData.roll_number} onChange={(v) => updateField('roll_number', v)} placeholder="Enter Roll Number" />
                        <InputField label="GR Number" value={formData.gr_number} onChange={(v) => updateField('gr_number', v)} placeholder="Enter GR Number" />

                        <InputField label="Registration Date" type="date" value={formData.registration_date} onChange={(v) => updateField('registration_date', v)} />
                    </div>

                    <SectionHeader title="Basic Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="First Name" required value={formData.first_name} onChange={(v) => {
                            setFormData(prev => {
                                const next = { ...prev, first_name: v };
                                next.student_email_id = generateUniqueEmail(v, next.last_name, data);
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
                                next.student_email_id = generateUniqueEmail(next.first_name, v, data);
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
                        <div className="md:col-span-2">
                            <InputField label="Remarks" value={formData.remarks} onChange={(v) => updateField('remarks', v)} placeholder="Enter Remarks" />
                        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <InputField label="Nationality" value={formData.nationality} onChange={(v) => updateField('nationality', v)} placeholder="Enter Nationality" />
                        <InputField label="Aadhaar DISE number (UID)" type="tel" maxLength={18} value={formData.studentAadhar} onChange={(v) => updateField('studentAadhar', v)} placeholder="Enter 18-digit Aadhaar DISE number (UID)" />
                        <SelectField label="Belonging EWS" value={formData.belongingEws} options={['Yes', 'No']} onChange={(v) => updateField('belongingEws', v)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Single Girl Child?" value={formData.single_girl_child} options={['Yes', 'No']} onChange={(v) => updateField('single_girl_child', v)} placeholder="Single Girl Child?" />
                        <SelectField label="Specially Abled (Divyangjan)?" value={formData.specially_abled} options={['Yes', 'No']} onChange={(v) => updateField('specially_abled', v)} placeholder="Specially Abled (Divyangjan)?" />
                        <SelectField label="Belonging to the EWS?" value={formData.belonging_ews} options={['Yes', 'No']} onChange={(v) => updateField('belonging_ews', v)} placeholder="Belonging to the EWS?" />
                        <InputField label="Personal Education Number(PEN)" type="tel" maxLength={11} value={formData.pen_number} onChange={(v) => updateField('pen_number', v)} placeholder="Enter 11-digit PEN Number" />
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

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
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
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                        <FiDownload className="w-4 h-4" /> Export
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Program</label>
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
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Converted">Converted</option>
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
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => {
                            setFilterDateFrom('');
                            setFilterDateTo('');
                            setFilterProgram('All');
                            setFilterStatus('All');
                            setFilterFeeStatus('All');
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all cursor-pointer"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search registrations by name, No. or mobile..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none transition-all placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL REGISTRATIONS
                    </div>
                </div>

                <div className="overflow-x-auto">
<table className="w-full text-left text-[12px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Registration Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Program</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Mobile No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Date of Registration</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Date of Birth</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Fee Status</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Download</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right">Action</th>
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
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => { setEditingRecord(row); setView('form'); }}>
                                        <td className="px-6 py-4 font-bold text-blue-600 tracking-tight">{row.registrationNo}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{row.first_name} {row.last_name}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.program || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.academic_year || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-bold">{row.student_mobile_number || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.registration_date || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.date_of_birth || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${row.isFeePaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                {row.isFeePaid ? '✅ PAID' : '⏳ UNPAID'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${row.status === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {row.status || 'Open'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
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
                                        <td className="px-6 py-4 text-right">
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
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-enquiry-tabs .ant-tabs-nav::before { border-bottom: 1px solid #e5e7eb; }
                .custom-enquiry-tabs .ant-tabs-tab { padding: 12px 16px; margin: 0 !important; font-weight: 700; font-size: 14px; color: #6b7280; transition: all 0.2s; }
                .custom-enquiry-tabs .ant-tabs-tab-active { color: #2563eb !important; }
                .custom-enquiry-tabs .ant-tabs-ink-bar { height: 3px !important; background: #2563eb !important; }
            `}} />
            {renderPreviewModal}
        </div>
    );
}
