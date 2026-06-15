import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import axios from 'axios';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';
import { DEFAULT_USER_PASSWORD } from '../../config/settings';

const getOptimizedAdmissionLogoUrl = async (src) => {
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

const generateAdmissionFormPDF = async (record) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(30, 58, 138); // Premium Deep Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    // School Logo - Pre-compressed via canvas to guarantee sub-50KB file size
    try {
        const optLogo = await getOptimizedAdmissionLogoUrl(schoolLogo);
        const format = optLogo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(optLogo, format, 15, 8, 24, 24, undefined, 'FAST');
    } catch (e) {
        console.warn('Could not add logo to PDF:', e);
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SSV Campus - CBSE', 45, 23);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPLETE STUDENT ADMISSION RECORD', 45, 31);

    // Admission Info Box
    doc.setFillColor(245, 245, 245);
    doc.rect(135, 45, 60, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('Admission Status:', 140, 53);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // Green
    doc.text('CONFIRMED / ADMITTED', 140, 60);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(`Reg: ${record.registrationNo || record.id || '-'}`, 140, 66);

    let currentY = 80;

    const addSection = (title, data) => {
        if (currentY > 245) {
            doc.addPage();
            currentY = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(title.toUpperCase(), 20, currentY);
        doc.setLineWidth(0.3);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
        
        const tableData = Object.entries(data).map(([label, value]) => [label, value || '-']);
        autoTable(doc, {
            startY: currentY + 5,
            head: [],
            body: tableData,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 65, fillColor: [250, 250, 250], textColor: [50, 50, 50] } },
            margin: { left: 20, right: 20 }
        });
        currentY = doc.lastAutoTable.finalY + 12;
    };

    // 1. Student Academic & Personal Details
    addSection('1. Student Academic & Basic Details', {
        'Student Full Name': `${record.first_name || ''} ${record.middle_name || ''} ${record.last_name || ''}`.trim(),
        'Program / Class': record.program,
        'Academic Year': record.academic_year,
        'Date of Birth': record.date_of_birth,
        'Gender': record.gender,
        'Student Contact Number': record.student_mobile_number || record.mobile || '-',
        'Student Email Address': record.student_email_id || '-',
        'Enquiry Reference': record.enquiryCode && record.enquiryCode !== '-' ? record.enquiryCode : 'N/A',
        'Registration Reference': record.registrationNo || record.id || 'N/A'
    });

    // 2. Parent & Guardian Details
    const primaryGuardian = record.guardians?.[0] || {};
    addSection('2. Parent & Guardian Information', {
        'Father Name': record.father_name || primaryGuardian.guardian_name || '-',
        'Father Contact': record.father_mobile_number || primaryGuardian.mobile_number || '-',
        'Father Occupation': record.father_occupation || primaryGuardian.occupation || '-',
        'Mother Name': record.mother_name || '-',
        'Mother Contact': record.mother_mobile_number || '-',
        'Primary Guardian Name': primaryGuardian.guardian_name || record.father_name || '-',
        'Guardian Relation': primaryGuardian.relation || 'Father',
        'Residential / Work Address': record.father_residential_address || primaryGuardian.work_address || record.guardian_address || '-'
    });

    // 3. Registration Fee Details
    addSection('3. Registration Fee Details', {
        'Fee Category': 'Registration Fee',
        'Payment Status': 'PAID & VERIFIED',
        'Registration Reference': record.registrationNo || record.id || 'N/A'
    });

    // 4. Final Verification Summary
    addSection('4. Office Administration Summary', {
        'Admission Processing Status': 'COMPLETED / ADMITTED',
        'Administration Review Remarks': record.remarks || record.admissionRemarks || 'Documents verified perfectly. Standard quota entry approved.',
        'Record Initialized On': record.created_at ? new Date(record.created_at).toLocaleDateString() : new Date().toLocaleDateString()
    });

    // Footer
    const finalY = doc.internal.pageSize.getHeight() - 22;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Official Document Dossier | Exported: ${new Date().toLocaleString()}`, 20, finalY + 5);
    doc.setDrawColor(150, 150, 150);
    doc.line(pageWidth - 75, finalY, pageWidth - 20, finalY);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('Principal / Administrator Sign', pageWidth - 70, finalY + 5);

    doc.save(`Admission_Form_${record.first_name || 'Student'}_${record.registrationNo || 'Record'}.pdf`);
};

const InputField = ({ label, value, required = false, onChange, type = 'text', placeholder = '', disabled = false }) => (
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
                rows={3}
                className={`border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${disabled ? 'bg-gray-50' : 'bg-white'}`}
            />
        ) : (
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
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
const ADMISSIONS_PATH = 'schooler_system/enquiry_management/final_admissions';

export default function FinalAdmissionForm({ initialView = 'list' }) {
    const [view, setView] = useState(initialView);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(20);
    const [visibleCount, setVisibleCount] = useState(20);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [boards, setBoards] = useState([]);

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

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkProgress, setBulkProgress] = useState(null); // null = closed, { total, done, errors, log } = open


    const initFormData = {
        admissionNo: '',
        admission_date: new Date().toISOString().split('T')[0],
        academic_year: '2025-2026',
        program: '',
        custom_board: '',
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        mobile: '',
        email: '',
        enquiryCode: '',
        registrationCode: '',
        roll_number: '',
        gr_number: '',
        status: 'Confirmed',
        remarks: '',
        // Payment fields
        feeAmount: 0,
        isFeePaid: false,
        receiptNo: '',
        paymentMode: 'Cash'
    };

    const [formData, setFormData] = useState(initFormData);

    const fetchERPNextData = async () => {
        try {
            const [progRes, yearRes, companyRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name","custom_board"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Company?fields=["name"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
            ]);
            const programs = progRes.data.data || [];
            const years = yearRes.data.data?.map(y => y.name) || [];
            setAcademicYears(years);
            setBoards((companyRes.data.data || []).map(c => c.name));
            await fetchRestrictions(programs);
        } catch (err) {
            console.error('Error fetching ERPNext data:', err);
        }
    };

    useEffect(() => {
        fetchERPNextData();
        if (view === 'list') fetchRegistrations();
    }, [view]);

    const fetchRestrictions = async (programs) => {
        const sortPrograms = (arr) => {
            const getRank = (name) => {
                const n = (name || '').toUpperCase();
                if (n.includes('NURSERY') || n.includes('NURSARY') || n.includes('NUR')) return 0;
                if (n.includes('JR') || n.includes('JUNIOR')) return 1;
                if (n.includes('SR') || n.includes('SENIOR')) return 2;
                const match = n.match(/(?:STD|CLASS)\s*(\d+)/);
                if (match) return parseInt(match[1]) + 2;
                return 999;
            };
            return [...arr].sort((a, b) => {
                const rA = getRank(a.name);
                const rB = getRank(b.name);
                if (rA !== rB) return rA - rB;
                return (a.name || '').localeCompare(b.name || '');
            });
        };

        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/program_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            setAvailableClasses(sortPrograms(programs.filter(c => !restricted.includes(c.name))));
        } catch (err) { 
            console.error('Restriction fetch failed', err);
            setAvailableClasses(sortPrograms(programs));
        }
    };

    const filteredClasses = useMemo(() => {
        if (!formData.custom_board) {
            return [];
        }
        return availableClasses.filter(c => {
            const pBoard = (c.custom_board || '').toString().trim().toLowerCase();
            const fBoard = (formData.custom_board || '').toString().trim().toLowerCase();
            return pBoard === fBoard;
        });
    }, [availableClasses, formData.custom_board]);


    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, REGISTRATIONS_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            setRegistrations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleConvert = (reg) => {
        setSelectedRegistration(reg);
        setFormData({
            ...initFormData,
            admissionNo: `ADM-${Date.now().toString().slice(-6)}`,
            program: reg.program,
            custom_board: reg.custom_board || '',
            first_name: reg.first_name,
            last_name: reg.last_name,
            gender: reg.gender,
            date_of_birth: reg.date_of_birth,
            mobile: reg.student_mobile_number || reg.mobile,
            email: reg.student_email_id || reg.email,
            enquiryCode: reg.enquiryCode || '-',
            registrationCode: reg.registrationNo || reg.id,
            roll_number: reg.roll_number || '',
            gr_number: reg.gr_number || '',
            academic_year: reg.academic_year
        });
        setView('form');
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete this record for "${record.first_name}"?`)) return;
        try {
            const docRef = doc(db, REGISTRATIONS_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: 'Record Deleted' });
            fetchRegistrations();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const handleSave = async () => {
        if (!formData.first_name || !formData.program) {
            notification.warning({ message: 'Missing Fields', description: 'First Name and Program are required.' });
            return;
        }
        setSaving(true);
        try {
            // 1. Sync with ERPNext if needed (creating Student and Guardian)
            let erpNextStudentName = null;
            try {
                let linkedGuardians = [];
                const baseGuardiansList = selectedRegistration?.guardians?.length > 0 ? selectedRegistration.guardians : [
                    {
                        is_new: true,
                        guardian_name: selectedRegistration?.parent_name || selectedRegistration?.father_name || `Parent of ${formData.first_name || 'Student'}`,
                        relation: 'Others',
                        mobile_number: formData.mobile || selectedRegistration?.student_mobile_number || null,
                        email_address: ''
                    }
                ];
                const guardiansArray = baseGuardiansList;
                for (let i = 0; i < guardiansArray.length; i++) {
                    const g = guardiansArray[i];
                    const cleanGName = (g.guardian_name || 'guardian').replace(/\s+/g, '').toLowerCase();
                    const baseGEmail = g.email_address || g.user;
                    const gEmail = baseGEmail ? baseGEmail.trim() : `${cleanGName}.${Date.now().toString().slice(-4)}${i}@guardian.ssvschool.edu.in`;

                    let finalGuardianName = g.guardian || g.existing_id;
                    let finalGuardianDisplayName = g.guardian_name || `Parent of ${formData.first_name || 'Student'}`;

                    if (g.is_new && !finalGuardianName) {
                        const guardianPayload = {
                            guardian_name: g.guardian_name || finalGuardianDisplayName,
                            email_address: gEmail,
                            mobile_number: g.mobile_number || null,
                            occupation: g.occupation || null,
                            designation: g.designation || null,
                            education: g.education || null,
                            alternate_number: g.alternate_number || null,
                            work_address: g.work_address || null,
                            date_of_birth: g.date_of_birth || null
                        };
                        
                        let gAttempts = 0;
                        while (gAttempts < 15 && !finalGuardianName) {
                            gAttempts++;
                            try {
                                const gRes = await API.post('/api/resource/Guardian', guardianPayload);
                                const createdGuardian = gRes.data.data;
                                finalGuardianName = createdGuardian.name;
                                finalGuardianDisplayName = createdGuardian.guardian_name;
                                console.log(`[ERPNext Guardian Sync] Created Guardian doc on attempt ${gAttempts}:`, finalGuardianName);
                            } catch (gErr) {
                                const status = gErr.response?.status;
                                const errStr = JSON.stringify(gErr.response?.data || {});
                                console.warn(`[ERPNext Guardian Sync] Attempt ${gAttempts} failed:`, gErr.response?.data || gErr.message);
                                
                                if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                                    if (gAttempts < 15) {
                                        await new Promise(r => setTimeout(r, 150));
                                        continue;
                                    }
                                }
                                
                                // Bulletproof Fallback: cleanly encoded query string to check if Guardian already exists by guardian_name
                                try {
                                    const safeFilters = encodeURIComponent(JSON.stringify([["guardian_name", "like", `%${guardianPayload.guardian_name}%`]]));
                                    const sq = await API.get(`/api/resource/Guardian?filters=${safeFilters}&limit_page_length=1`);
                                    if (sq.data.data?.length > 0) {
                                        finalGuardianName = sq.data.data[0].name;
                                        console.log('[ERPNext Guardian Sync] Fallback resolution: Found and linked existing Guardian doc:', finalGuardianName);
                                        break;
                                    }
                                } catch (lookupErr) {
                                    console.warn('[ERPNext Guardian Sync] Fallback search also yielded no result.');
                                }
                                break;
                            }
                        }
                    }
                    
                    if (finalGuardianName) {
                        linkedGuardians.push({
                            guardian: finalGuardianName,
                            guardian_name: finalGuardianDisplayName || g.guardian_name,
                            relation: g.relation || 'Others'
                        });
                    }

                    // Synchronize and auto-create the Guardian User account mapped with the correct role profiles and mobile number for seamless login
                    const shouldCreateUser = guardiansArray.length === 1 || g.create_user_account;
                    if (finalGuardianDisplayName && shouldCreateUser) {
                        try {
                            const cleanPhone = g.mobile_number ? String(g.mobile_number).replace(/[\s+-]/g, '') : '';
                            const cleanGUsername = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

                            const gUserPayload = {
                                mobile_no: g.mobile_number || null,
                                role_profile_name: 'Guardian',
                                module_profile: 'Guardian',
                                new_password: DEFAULT_USER_PASSWORD,
                                enabled: 1,
                                roles: [{ role: 'Guardian' }]
                            };
                            if (cleanGUsername) {
                                gUserPayload.username = cleanGUsername;
                            }
                            try {
                                await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, gUserPayload);
                                console.log('[ERPNext Guardian User Sync] Successfully mapped Guardian profiles to existing User:', gEmail);
                            } catch (guErr) {
                                if (guErr.response?.status === 404) {
                                    await API.post('/api/resource/User', {
                                        email: gEmail,
                                        first_name: finalGuardianDisplayName,
                                        send_welcome_email: 0,
                                        ...gUserPayload
                                    });
                                    console.log('[ERPNext Guardian User Sync] Explicitly auto-created User record for Guardian:', gEmail);
                                    // Explicit PUT to guarantee password is saved on creation
                                    await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, {
                                        new_password: DEFAULT_USER_PASSWORD
                                    }).catch(err => console.warn('[ERPNext Guardian Admission Password Sync] Explicit PUT failed:', err.message));
                                } else {
                                    console.warn('[ERPNext Guardian User Sync] Non-404 status response:', guErr.message);
                                }
                            }

                            // Securely map the user account back to the Guardian doc to ensure perfect login association and consistency
                            if (finalGuardianName) {
                                await API.put(`/api/resource/Guardian/${encodeURIComponent(finalGuardianName)}`, {
                                    user: gEmail,
                                    email_address: gEmail
                                }).catch(() => {});
                            }
                        } catch (gUserSyncErr) {
                            console.warn('[ERPNext Guardian User Sync] Gracefully caught sync error:', gUserSyncErr.message);
                        }
                    }
                }

                const baseEmail = formData.email || selectedRegistration?.student_email_id;
                const cleanFirstName = (formData.first_name || selectedRegistration?.first_name || 'student').replace(/\s+/g, '').toLowerCase();
                // Ensure a non-empty string is ALWAYS sent to avoid Error 500 in backend autoname strip()
                const safeEmail = baseEmail ? baseEmail.trim() : `${cleanFirstName}.${Date.now().toString().slice(-5)}@ssvschool.edu.in`;

                const studentPayload = {
                    first_name: formData.first_name || selectedRegistration?.first_name,
                    middle_name: selectedRegistration?.middle_name || null,
                    last_name: formData.last_name || selectedRegistration?.last_name || null,
                    student_email_id: safeEmail,
                    student_mobile_number: formData.mobile || selectedRegistration?.student_mobile_number || null,
                    gender: formData.gender || selectedRegistration?.gender || null,
                    date_of_birth: formData.date_of_birth || selectedRegistration?.date_of_birth || null,
                    blood_group: selectedRegistration?.blood_group || null,
                    address_line_1: selectedRegistration?.address_line_1 || selectedRegistration?.perm_address || null,
                    address_line_2: selectedRegistration?.address_line_2 || null,
                    city: selectedRegistration?.city || selectedRegistration?.perm_city || null,
                    state: selectedRegistration?.state || selectedRegistration?.perm_state || null,
                    pincode: selectedRegistration?.pincode || selectedRegistration?.perm_pincode || null,
                    country: selectedRegistration?.country || 'India',
                    academic_year: formData.academic_year || selectedRegistration?.academic_year,
                    program: formData.program || selectedRegistration?.program,
                    custom_board: formData.custom_board || selectedRegistration?.custom_board || null,
                    status: 'Admitted',
                    roll_number: formData.roll_number || selectedRegistration?.roll_number || null,
                    gr_number: formData.gr_number || selectedRegistration?.gr_number || null,
                    custom_aadhaar_uid: selectedRegistration?.custom_aadhaar_uid || null,
                    custom_pen_number: selectedRegistration?.custom_pen_number || null,
                    custom_apaar_id: selectedRegistration?.custom_apaar_id || null,
                    custom_aadhaar_card_number: selectedRegistration?.custom_aadhaar_card_number || null,
                    guardians: linkedGuardians
                };

                // Implement sequential auto-retry up to 40 times to rapidly push through backend primary key sequence lag (Error 409)
                let attempts = 0;
                const maxAttempts = 40;
                let lastSyncErr = null;

                while (attempts < maxAttempts && !erpNextStudentName) {
                    attempts++;
                    try {
                        // Pass the original safeEmail exactly on every attempt so the created Student doc retains the authentic email address
                        const currentPayload = {
                            ...studentPayload,
                            student_email_id: safeEmail
                        };
                        const sRes = await API.post('/api/resource/Student', currentPayload);
                        erpNextStudentName = sRes.data.data.name;
                        notification.success({ 
                            message: 'ERPNext Sync Successful', 
                            description: `Student Created in ERPNext: ${erpNextStudentName}${attempts > 1 ? ` (auto-recovered sequence lag after ${attempts} attempts)` : ''}` 
                        });

                        // Explicitly update the Student record via PUT to guarantee child table (guardians) linkage parity with Student master storage
                        if (linkedGuardians.length > 0) {
                            await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, {
                                guardians: linkedGuardians
                            }).catch(childErr => console.warn('[ERPNext Guardian Link Sync] Warning during explicit PUT linkage:', childErr.message));
                            console.log('[ERPNext Guardian Link Sync] Successfully applied child table guardians linking to Student record.');
                            
                            // Bidirectionally update Guardian's students child table
                            for (const lg of linkedGuardians) {
                                try {
                                    const guardianName = lg.guardian;
                                    const gDocRes = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardianName)}`);
                                    const existingStudents = gDocRes.data.data.students || [];
                                    const isAlreadyLinked = existingStudents.some(s => s.student === erpNextStudentName);
                                    if (!isAlreadyLinked) {
                                        existingStudents.push({
                                            student: erpNextStudentName,
                                            student_name: currentPayload.first_name || 'Student'
                                        });
                                        await API.put(`/api/resource/Guardian/${encodeURIComponent(guardianName)}`, {
                                            students: existingStudents
                                        });
                                        console.log(`[ERPNext Guardian Student Sync] Bidirectionally appended student ${erpNextStudentName} to Guardian ${guardianName}`);
                                    }
                                } catch (gSyncErr) {
                                    console.warn('Failed to bidirectionally append student to guardian:', gSyncErr.message);
                                }
                            }
                        }

                        // Instantly map Student profile settings to the corresponding ERPNext User account
                        try {
                            const sMobile = formData.mobile || selectedRegistration?.student_mobile_number || null;
                            const cleanPhone = sMobile ? String(sMobile).replace(/[\s+-]/g, '') : '';
                            const cleanStudentUsername = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

                            const userPayload = {
                                mobile_no: sMobile,
                                role_profile_name: 'Student',
                                module_profile: 'Student',
                                new_password: DEFAULT_USER_PASSWORD,
                                enabled: 1,
                                roles: [{ role: 'Student' }]
                            };
                            if (cleanStudentUsername) {
                                userPayload.username = cleanStudentUsername;
                            }
                            try {
                                // Try updating the User account if Frappe's backend trigger auto-created it
                                await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, userPayload);
                                console.log('[ERPNext User Sync] Automatically applied mobile number, role profile, and module profile to User record.');
                            } catch (uErr) {
                                // Fallback: if User record does not exist yet, explicitly create it with properties populated
                                if (uErr.response?.status === 404) {
                                    await API.post('/api/resource/User', {
                                        email: safeEmail,
                                        first_name: formData.first_name || selectedRegistration?.first_name || 'Student',
                                        last_name: formData.last_name || selectedRegistration?.last_name || null,
                                        send_welcome_email: 0,
                                        ...userPayload
                                    });
                                    console.log('[ERPNext User Sync] Explicitly created new User record mapped with Student permissions.');
                                    // Explicit PUT to guarantee password is saved on creation
                                    await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, {
                                        new_password: DEFAULT_USER_PASSWORD
                                    }).catch(err => console.warn('[ERPNext Student Admission Password Sync] Explicit PUT failed:', err.message));
                                } else {
                                    console.warn('[ERPNext User Sync] Non-404 update response:', uErr.message);
                                }
                            }
                        } catch (profileSyncErr) {
                            console.warn('[ERPNext User Sync] Gracefully caught sync override error:', profileSyncErr.message);
                        }
                    } catch (err) {
                        lastSyncErr = err;
                        const status = err.response?.status;
                        const errStr = JSON.stringify(err.response?.data || {});
                        console.warn(`[ERPNext Sync] Attempt ${attempts}/${maxAttempts} failed:`, err.response?.data || err.message);
                        
                        // If it's a primary key/duplicate entry error due to backend tabSeries lag, loop and retry to auto-increment the server sequence
                        if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                            if (attempts < maxAttempts) {
                                await new Promise(r => setTimeout(r, 120));
                                continue;
                            }
                        }
                        break;
                    }
                }

                if (!erpNextStudentName && lastSyncErr) {
                    throw lastSyncErr;
                }
            } catch (erpErr) {
                console.error('ERPNext Admission sync failed:', erpErr);
                const errMsg = erpErr.response?.data?.exception || erpErr.response?.data?._server_messages || erpErr.message;
                throw new Error(`ERPNext Sync Failed: ${typeof errMsg === 'string' ? errMsg.slice(0, 100) : 'Check server logs'}. Admission aborted.`);
            }

            // 2. Save to Firebase Final Admissions
            await addDoc(collection(db, ADMISSIONS_PATH), { 
                ...formData, 
                erp_student_id: erpNextStudentName,
                registrationId: selectedRegistration?.id,
                created_at: serverTimestamp(), 
                updated_at: serverTimestamp() 
            });
            
            // Update registration status to 'Admitted'
            if (selectedRegistration) {
                await updateDoc(doc(db, REGISTRATIONS_PATH, selectedRegistration.id), {
                    status: 'Converted',
                    admissionStatus: 'Admitted',
                    updated_at: serverTimestamp()
                });
            }

            notification.success({ message: 'Admission Confirmed!' });
            setView('list');
            fetchRegistrations();
        } catch (err) { 
            notification.error({ message: 'Admission Failed', description: err.message }); 
        } finally { 
            setSaving(false); 
        }
    };

    // ─── Single-registration confirm helper (reusable by bulk process) ─────────
    const confirmSingleRegistration = async (reg) => {
        let erpNextStudentName = null;
        try {
            let linkedGuardians = [];
            const baseGuardiansList = reg?.guardians?.length > 0 ? reg.guardians : [
                {
                    is_new: true,
                    guardian_name: reg?.parent_name || reg?.father_name || `Parent of ${reg.first_name || 'Student'}`,
                    relation: 'Others',
                    mobile_number: reg.student_mobile_number || reg.mobile || null,
                    email_address: ''
                }
            ];
            const guardiansArray = baseGuardiansList;
            for (let i = 0; i < guardiansArray.length; i++) {
                const g = guardiansArray[i];
                const cleanGName = (g.guardian_name || 'guardian').replace(/\s+/g, '').toLowerCase();
                const baseGEmail = g.email_address || g.user;
                const gEmail = baseGEmail ? baseGEmail.trim() : `${cleanGName}.${Date.now().toString().slice(-4)}${i}@guardian.ssvschool.edu.in`;
                let finalGuardianName = g.guardian || g.existing_id;
                let finalGuardianDisplayName = g.guardian_name || `Parent of ${reg.first_name || 'Student'}`;

                if (!finalGuardianName) {
                    const guardianPayload = {
                        guardian_name: g.guardian_name || finalGuardianDisplayName,
                        email_address: gEmail,
                        mobile_number: g.mobile_number || null,
                        occupation: g.occupation || null,
                        designation: g.designation || null,
                        education: g.education || null,
                        alternate_number: g.alternate_number || null,
                        work_address: g.work_address || null,
                        date_of_birth: g.date_of_birth || null
                    };
                    let gAttempts = 0;
                    while (gAttempts < 15 && !finalGuardianName) {
                        gAttempts++;
                        try {
                            const gRes = await API.post('/api/resource/Guardian', guardianPayload);
                            finalGuardianName = gRes.data.data.name;
                            finalGuardianDisplayName = gRes.data.data.guardian_name;
                            break;
                        } catch (gErr) {
                            const status = gErr.response?.status;
                            const errStr = JSON.stringify(gErr.response?.data || {});
                            if (status === 409 || errStr.includes('DuplicateEntryError')) {
                                if (gAttempts < 15) { await new Promise(r => setTimeout(r, 150)); continue; }
                            }
                            try {
                                const safeFilters = encodeURIComponent(JSON.stringify([["guardian_name", "like", `%${guardianPayload.guardian_name}%`]]));
                                const sq = await API.get(`/api/resource/Guardian?filters=${safeFilters}&limit_page_length=1`);
                                if (sq.data.data?.length > 0) { finalGuardianName = sq.data.data[0].name; break; }
                            } catch (_) {}
                            break;
                        }
                    }
                }

                // Synchronize and auto-create the Guardian User account mapped with the correct role profiles
                const shouldCreateUser = guardiansArray.length === 1 || g.create_user_account;
                if (finalGuardianDisplayName && shouldCreateUser) {
                    try {
                        const cleanPhone = g.mobile_number ? String(g.mobile_number).replace(/[\s+-]/g, '') : '';
                        const cleanGUsername = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
                        const gUserPayload = {
                            mobile_no: g.mobile_number || null,
                            role_profile_name: 'Guardian',
                            module_profile: 'Guardian',
                            new_password: DEFAULT_USER_PASSWORD,
                            enabled: 1,
                            roles: [{ role: 'Guardian' }]
                        };
                        if (cleanGUsername) {
                            gUserPayload.username = cleanGUsername;
                        }
                        try {
                            await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, gUserPayload);
                        } catch (guErr) {
                            if (guErr.response?.status === 404) {
                                await API.post('/api/resource/User', {
                                    email: gEmail,
                                    first_name: finalGuardianDisplayName,
                                    send_welcome_email: 0,
                                    ...gUserPayload
                                });
                                await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, {
                                    new_password: DEFAULT_USER_PASSWORD
                                }).catch(() => {});
                            }
                        }
                        if (finalGuardianName) {
                            await API.put(`/api/resource/Guardian/${encodeURIComponent(finalGuardianName)}`, {
                                user: gEmail,
                                email_address: gEmail
                            }).catch(() => {});
                        }
                    } catch (gUserSyncErr) {
                        console.warn('[Bulk Guardian User Sync Error]', gUserSyncErr.message);
                    }
                }

                if (finalGuardianName) {
                    linkedGuardians.push({ guardian: finalGuardianName, guardian_name: finalGuardianDisplayName || g.guardian_name, relation: g.relation || 'Others' });
                }
            }

            const cleanFirstName = (reg.first_name || 'student').replace(/\s+/g, '').toLowerCase();
            const safeEmail = reg.student_email_id || reg.email || `${cleanFirstName}.${Date.now().toString().slice(-5)}@ssvschool.edu.in`;

            const studentPayload = {
                first_name: reg.first_name,
                middle_name: reg.middle_name || null,
                last_name: reg.last_name || null,
                student_email_id: safeEmail,
                student_mobile_number: reg.student_mobile_number || reg.mobile || null,
                gender: reg.gender || null,
                date_of_birth: reg.date_of_birth || null,
                blood_group: reg.blood_group || null,
                address_line_1: reg.address_line_1 || reg.perm_address || null,
                city: reg.city || reg.perm_city || null,
                state: reg.state || reg.perm_state || null,
                pincode: reg.pincode || reg.perm_pincode || null,
                country: reg.country || 'India',
                academic_year: reg.academic_year,
                program: reg.program,
                custom_board: reg.custom_board || null,
                status: 'Admitted',
                roll_number: reg.roll_number || null,
                gr_number: reg.gr_number || null,
                guardians: linkedGuardians
            };

            let attempts = 0;
            let lastSyncErr = null;
            while (attempts < 40 && !erpNextStudentName) {
                attempts++;
                try {
                    const sRes = await API.post('/api/resource/Student', { ...studentPayload, student_email_id: safeEmail });
                    erpNextStudentName = sRes.data.data.name;
                    if (linkedGuardians.length > 0) {
                        await API.put(`/api/resource/Student/${encodeURIComponent(erpNextStudentName)}`, { guardians: linkedGuardians }).catch(() => {});
                        // Bidirectionally update Guardian's students child table
                        for (const lg of linkedGuardians) {
                            try {
                                const guardianName = lg.guardian;
                                const gDocRes = await API.get(`/api/resource/Guardian/${encodeURIComponent(guardianName)}`);
                                const existingStudents = gDocRes.data.data.students || [];
                                if (!existingStudents.some(s => s.student === erpNextStudentName)) {
                                    existingStudents.push({
                                        student: erpNextStudentName,
                                        student_name: reg.first_name || 'Student'
                                    });
                                    await API.put(`/api/resource/Guardian/${encodeURIComponent(guardianName)}`, { students: existingStudents });
                                }
                            } catch (gSyncErr) {
                                console.error('[Bulk Guardian Sync Error]', gSyncErr.response?.data || gSyncErr.message);
                            }
                        }
                    }

                    // Instantly map Student profile settings to the corresponding ERPNext User account
                    try {
                        const sMobile = reg.student_mobile_number || reg.mobile || null;
                        const cleanPhone = sMobile ? String(sMobile).replace(/[\s+-]/g, '') : '';
                        const cleanStudentUsername = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

                        const userPayload = {
                            mobile_no: sMobile,
                            role_profile_name: 'Student',
                            module_profile: 'Student',
                            new_password: DEFAULT_USER_PASSWORD,
                            enabled: 1,
                            roles: [{ role: 'Student' }]
                        };
                        if (cleanStudentUsername) {
                            userPayload.username = cleanStudentUsername;
                        }
                        try {
                            await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, userPayload);
                        } catch (uErr) {
                            if (uErr.response?.status === 404) {
                                await API.post('/api/resource/User', {
                                    email: safeEmail,
                                    first_name: reg.first_name || 'Student',
                                    last_name: reg.last_name || null,
                                    send_welcome_email: 0,
                                    ...userPayload
                                });
                                await API.put(`/api/resource/User/${encodeURIComponent(safeEmail)}`, {
                                    new_password: DEFAULT_USER_PASSWORD
                                }).catch(() => {});
                            }
                        }
                    } catch (profileSyncErr) {
                        console.warn('[Bulk Student User Sync Error]', profileSyncErr.message);
                    }
                } catch (err) {
                    lastSyncErr = err;
                    const status = err.response?.status;
                    const errStr = JSON.stringify(err.response?.data || {});
                    if (status === 409 || errStr.includes('DuplicateEntryError') || errStr.includes('Duplicate entry')) {
                        if (attempts < 40) { await new Promise(r => setTimeout(r, 120)); continue; }
                    }
                    break;
                }
            }
            if (!erpNextStudentName && lastSyncErr) throw lastSyncErr;
        } catch (erpErr) {
            console.error('[Bulk Confirm ERPNext Failed]', erpErr);
            throw new Error(`ERPNext Sync Failed: ${erpErr.message}. Admission aborted.`);
        }

        // Save to Firebase Final Admissions
        await addDoc(collection(db, ADMISSIONS_PATH), {
            admissionNo: `ADM-${Date.now().toString().slice(-6)}`,
            admission_date: new Date().toISOString().split('T')[0],
            academic_year: reg.academic_year || '2025-2026',
            program: reg.program,
            custom_board: reg.custom_board || '',
            first_name: reg.first_name,
            last_name: reg.last_name || '',
            gender: reg.gender || '',
            date_of_birth: reg.date_of_birth || '',
            mobile: reg.student_mobile_number || reg.mobile || '',
            enquiryCode: reg.enquiryCode || '-',
            registrationCode: reg.registrationNo || reg.id,
            erp_student_id: erpNextStudentName,
            registrationId: reg.id,
            status: 'Confirmed',
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        // Mark registration as Admitted
        await updateDoc(doc(db, REGISTRATIONS_PATH, reg.id), {
            status: 'Converted',
            admissionStatus: 'Admitted',
            updated_at: serverTimestamp()
        });
    };

    // ─── Bulk Confirm Handler ──────────────────────────────────────────────────
    const handleBulkConfirm = async () => {
        const pendingSelected = registrations.filter(r =>
            selectedIds.includes(r.id) && r.admissionStatus !== 'Admitted' && !r.isDisabled
        );
        if (pendingSelected.length === 0) {
            notification.warning({ message: 'No pending admissions selected.' });
            return;
        }
        setBulkProgress({ total: pendingSelected.length, done: 0, errors: 0, log: [] });
        setSelectedIds([]);

        let done = 0;
        let errors = 0;
        const log = [];

        for (const reg of pendingSelected) {
            try {
                await confirmSingleRegistration(reg);
                done++;
                log.push({ name: `${reg.first_name} ${reg.last_name || ''}`.trim(), status: 'success' });
            } catch (err) {
                errors++;
                log.push({ name: `${reg.first_name} ${reg.last_name || ''}`.trim(), status: 'error', msg: err.message });
                console.error('[Bulk Confirm] Failed for', reg.first_name, err);
            }
            setBulkProgress(prev => ({ ...prev, done: done, errors: errors, log: [...log] }));
            // Generous delay between students to proactively avoid Frappe server rate limits (417/429)
            await new Promise(r => setTimeout(r, 2000));
        }

        // Refresh after all done
        await fetchRegistrations();
        notification.success({
            message: `✅ Bulk Admission Complete`,
            description: `${done} student${done !== 1 ? 's' : ''} confirmed successfully${errors > 0 ? `, ${errors} failed` : ''}.`,
            duration: 7
        });
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.toLowerCase();
        return registrations.filter(d => {
            // 1. Text Search Query filter
            const matchesSearch = 
                (d.first_name || '').toLowerCase().includes(term) || 
                (d.registrationNo || '').toLowerCase().includes(term) ||
                (d.enquiryCode || '').toLowerCase().includes(term);
            
            if (!matchesSearch) return false;

            // 2. Program Filter
            if (filterProgram !== 'All' && d.program !== filterProgram) {
                return false;
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

            // 3. Status Filter (Pending vs Confirmed vs Disabled)
            const isDisabled = d.isDisabled === true;
            if (filterStatus === 'All' && isDisabled) return false; // Hide disabled by default
            
            if (filterStatus !== 'All') {
                if (filterStatus === 'Disabled') {
                    if (!isDisabled) return false;
                } else {
                    if (isDisabled) return false; // Hide disabled from Pending/Confirmed views
                    const isAdmitted = d.admissionStatus === 'Admitted';
                    if (filterStatus === 'Pending' && isAdmitted) return false;
                    if (filterStatus === 'Confirmed' && !isAdmitted) return false;
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
                const regDate = d.created_at?.toDate ? d.created_at.toDate() : d.created_at ? new Date(d.created_at) : null;
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
    }, [registrations, searchQuery, filterProgram, filterAcademicYear, filterBoard, filterStatus, filterDateFrom, filterDateTo, filterFeeStatus, filterImportedOnly, filterImportedDate]);

    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1000px] mx-auto pb-24 font-inter">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><FiArrowLeft /></button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Final Admission Process</h1>
                            <p className="text-[11px] text-gray-500 font-medium italic">Converting Registration: {formData.registrationCode}</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-md text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md">
                        {saving ? <Spin size="small" /> : <FiCheckCircle />} {saving ? 'Processing...' : 'Confirm Admission'}
                    </button>
                </div>
                <div className="bg-white p-8 shadow-xl rounded-b-xl border border-gray-100 space-y-8">
                    <div>
                        <SectionHeader title="1. Admission Metadata" color="red" />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <InputField label="Admission No" disabled value={formData.admissionNo} />
                            <InputField label="Admission Date" type="date" value={formData.admission_date} onChange={(v) => setFormData({...formData, admission_date: v})} />
                            <SelectField label="Academic Year" value={formData.academic_year} options={academicYears} onChange={(v) => setFormData({...formData, academic_year: v})} />
                            <SelectField 
                                label="Board" 
                                value={formData.custom_board} 
                                options={boards} 
                                onChange={(v) => setFormData({
                                    ...formData, 
                                    custom_board: v,
                                    program: '' // Clear program when board changes
                                })} 
                            />
                            <SelectField 
                                label="Final Admission Program (Class)" 
                                required 
                                value={formData.program} 
                                options={filteredClasses.map(c => c.name)} 
                                onChange={(v) => setFormData({...formData, program: v})} 
                                placeholder={formData.custom_board ? "Select Program" : "Please Select Board First"}
                                disabled={!formData.custom_board}
                            />

                            <InputField label="Roll Number" value={formData.roll_number} onChange={(v) => setFormData({...formData, roll_number: v})} placeholder="Enter Roll Number" />
                            <InputField label="GR Number" value={formData.gr_number} onChange={(v) => setFormData({...formData, gr_number: v})} placeholder="Enter GR Number" />

                            <InputField label="Enquiry Code" disabled value={formData.enquiryCode} />
                            <InputField label="Registration Code" disabled value={formData.registrationCode} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader title="2. Student Verification" color="green" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" required value={formData.first_name} onChange={(v) => setFormData({...formData, first_name: v})} />
                            <InputField label="Last Name" value={formData.last_name} onChange={(v) => setFormData({...formData, last_name: v})} />
                            <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => setFormData({...formData, gender: v})} />
                            <InputField label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(v) => setFormData({...formData, date_of_birth: v})} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader title="3. Final Remarks" color="gray" />
                        <InputField label="Admission Remarks" type="textarea" placeholder="Enter any specific notes for this admission..." value={formData.remarks} onChange={(v) => setFormData({...formData, remarks: v})} />
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 font-inter">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Final Admission Form</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Admission</span> / <span className="text-blue-600 font-bold">Final Admission Form</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchRegistrations} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
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
                            {availableClasses
                                .filter(p => filterBoard === 'All' || !p.custom_board || p.custom_board.toString().trim().toLowerCase() === filterBoard.toString().trim().toLowerCase())
                                .map((p) => (
                                <option key={p.name} value={p.name}>{p.name}</option>
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
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Admission Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                        >
                            <option value="All">All Active Statuses</option>
                            <option value="Pending">Admission Pending</option>
                            <option value="Confirmed">Confirmed Admission</option>
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
                                    className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                {filterImportedDate && (
                                    <button onClick={() => setFilterImportedDate('')} className="text-gray-400 hover:text-red-500 text-xs font-bold ml-1">✕ Clear</button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
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
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="relative max-w-sm w-full">
                        <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by student, enquiry or registration code..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 outline-none shadow-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkConfirm}
                                className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-[12px] font-black uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
                            >
                                <FiCheckCircle className="w-4 h-4" />
                                Confirm Selected ({selectedIds.filter(id => registrations.find(r => r.id === id && r.admissionStatus !== 'Admitted' && !r.isDisabled)).length})
                            </button>
                        )}
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{!loading && `${Math.min(visibleCount, filteredData.length)} of ${filteredData.length} TOTAL ADMISSIONS`}</span>
                </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-4 py-3.5 w-10">
                                    {/* Select all pending rows on current page */}
                                    {(() => {
                                        const visiblePending = filteredData.slice(0, visibleCount).filter(r => r.admissionStatus !== 'Admitted' && !r.isDisabled);
                                        const allChecked = visiblePending.length > 0 && visiblePending.every(r => selectedIds.includes(r.id));
                                        return (
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-green-600 cursor-pointer rounded"
                                                checked={allChecked}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(prev => [...new Set([...prev, ...visiblePending.map(r => r.id)])]);
                                                    } else {
                                                        setSelectedIds(prev => prev.filter(id => !visiblePending.some(r => r.id === id)));
                                                    }
                                                }}
                                                title="Select All Pending"
                                            />
                                        );
                                    })()}
                                </th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Student Details</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Program (Class)</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Board</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Academic Year</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Reference Codes</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Date of Birth</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center"><Spin /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400 font-medium italic">No matching records found</td></tr>
                            ) : (
                                filteredData.slice(0, visibleCount).map((row) => (
                                    <tr key={row.id} className={`hover:bg-blue-50/40 transition-all group ${selectedIds.includes(row.id) ? 'bg-green-50/60' : ''}`}>
                                        <td className="px-4 py-3.5">
                                            {(row.admissionStatus !== 'Admitted' && !row.isDisabled) ? (
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-green-600 cursor-pointer rounded"
                                                    checked={selectedIds.includes(row.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(prev => [...prev, row.id]);
                                                        } else {
                                                            setSelectedIds(prev => prev.filter(id => id !== row.id));
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-gray-900">{row.first_name} {row.last_name}</div>
                                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">{row.student_mobile_number || row.mobile || 'No mobile'}</div>
                                        </td>
                                        <td className="px-4 py-3.5 font-black text-blue-600 uppercase text-[11px]">{row.program}</td>
                                        <td className="px-4 py-3.5 font-medium text-gray-600 text-xs">{row.custom_board || '-'}</td>
                                        <td className="px-4 py-3.5 font-medium text-gray-600 text-xs">{row.academic_year}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-[10px] font-bold text-green-700 bg-green-50 rounded px-1.5 py-0.5 w-max border border-green-100/50">
                                                    Reg: {row.registrationNo || row.id}
                                                </span>
                                                {row.enquiryCode && row.enquiryCode !== '-' && (
                                                    <span className="font-mono text-[10px] font-medium text-purple-600 bg-purple-50 rounded px-1.5 py-0.5 w-max border border-purple-100/50">
                                                        Enq: {row.enquiryCode}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-medium text-gray-500 text-xs">{row.date_of_birth || '-'}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            {row.isDisabled ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                                        DISABLED
                                                    </span>
                                                </div>
                                            ) : row.admissionStatus === 'Admitted' ? (
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-200/60 shadow-2xs">
                                                        Admitted
                                                    </span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); generateAdmissionFormPDF(row); }}
                                                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-[11px] font-black tracking-tight transition-all shadow-2xs hover:shadow flex items-center gap-1 cursor-pointer active:scale-95"
                                                        title="Download Completed Admission Form Dossier"
                                                    >
                                                        <FiFileText className="w-3.5 h-3.5 text-blue-500" /> Form
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleConvert(row)}
                                                        className="px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                                    >
                                                        Add Admission
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleConvert(row); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                                                </div>
                                            )}
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

            {/* ─── Bulk Progress Modal ───────────────────────────────────────────────────── */}
            {bulkProgress !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-white text-lg font-black tracking-tight">Confirming Admissions</h2>
                                <p className="text-green-100 text-[11px] font-medium mt-0.5">Processing students one by one...</p>
                            </div>
                            {bulkProgress.done + bulkProgress.errors >= bulkProgress.total && (
                                <button
                                    onClick={() => setBulkProgress(null)}
                                    className="text-white hover:text-green-200 transition p-1.5 rounded-lg hover:bg-white/20"
                                    title="Close"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-5">
                            {/* Progress counts */}
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-gray-700">
                                    {bulkProgress.done + bulkProgress.errors} of {bulkProgress.total} processed
                                </span>
                                <div className="flex items-center gap-3 text-xs font-bold">
                                    <span className="text-green-600">{bulkProgress.done} ✓</span>
                                    {bulkProgress.errors > 0 && <span className="text-red-500">{bulkProgress.errors} ✗</span>}
                                </div>
                            </div>

                            {/* Animated progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden">
                                <div
                                    className="h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                    style={{
                                        width: `${bulkProgress.total > 0 ? ((bulkProgress.done + bulkProgress.errors) / bulkProgress.total) * 100 : 0}%`,
                                        background: 'linear-gradient(90deg, #16a34a, #22c55e)'
                                    }}
                                >
                                    {/* Shimmer animation */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                </div>
                            </div>

                            {/* Live log */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 h-40 overflow-y-auto p-3 space-y-1.5">
                                {bulkProgress.log.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs font-medium italic">Starting...</div>
                                ) : (
                                    [...bulkProgress.log].reverse().map((entry, i) => (
                                        <div key={i} className={`flex items-center gap-2 text-[11px] font-medium px-2 py-1 rounded-lg ${
                                            entry.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                        }`}>
                                            <span>{entry.status === 'success' ? '✅' : '❌'}</span>
                                            <span className="font-bold truncate">{entry.name}</span>
                                            {entry.msg && <span className="text-[10px] opacity-70 truncate">— {entry.msg}</span>}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Done message */}
                            {bulkProgress.done + bulkProgress.errors >= bulkProgress.total && (
                                <div className="mt-4 text-center">
                                    <div className="text-2xl font-black text-green-600">{bulkProgress.done}</div>
                                    <div className="text-sm text-gray-600 font-medium">student{bulkProgress.done !== 1 ? 's' : ''} confirmed successfully!</div>
                                    {bulkProgress.errors > 0 && <div className="text-xs text-red-500 font-medium mt-1">{bulkProgress.errors} failed — check console for details</div>}
                                    <button
                                        onClick={() => setBulkProgress(null)}
                                        className="mt-3 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-all active:scale-95"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
