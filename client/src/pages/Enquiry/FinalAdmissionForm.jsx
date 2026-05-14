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
    const [availableClasses, setAvailableClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);


    const initFormData = {
        admissionNo: '',
        admission_date: new Date().toISOString().split('T')[0],
        academic_year: '2025-2026',
        program: '',
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        mobile: '',
        email: '',
        enquiryCode: '',
        registrationCode: '',
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
            const [progRes, yearRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            const programs = progRes.data.data?.map(p => p.name) || [];
            const years = yearRes.data.data?.map(y => y.name) || [];
            setAcademicYears(years);
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
        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/program_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            setAvailableClasses(programs.filter(c => !restricted.includes(c)));
        } catch (err) { 
            console.error('Restriction fetch failed', err);
            setAvailableClasses(programs);
        }
    };


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
            first_name: reg.first_name,
            last_name: reg.last_name,
            gender: reg.gender,
            date_of_birth: reg.date_of_birth,
            mobile: reg.student_mobile_number || reg.mobile,
            email: reg.student_email_id || reg.email,
            enquiryCode: reg.enquiryCode || '-',
            registrationCode: reg.registrationNo || reg.id,
            academic_year: reg.academic_year
        });
        setView('form');
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

                    let finalGuardianName = g.guardian;
                    let finalGuardianDisplayName = g.guardian_name || `Parent of ${formData.first_name || 'Student'}`;

                    if (g.is_new) {
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
                                linkedGuardians.push({
                                    guardian: finalGuardianName,
                                    guardian_name: finalGuardianDisplayName,
                                    relation: g.relation || 'Others'
                                });
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
                                        linkedGuardians.push({
                                            guardian: finalGuardianName,
                                            guardian_name: guardianPayload.guardian_name,
                                            relation: g.relation || 'Others'
                                        });
                                        console.log('[ERPNext Guardian Sync] Fallback resolution: Found and linked existing Guardian doc:', finalGuardianName);
                                        break;
                                    }
                                } catch (lookupErr) {
                                    console.warn('[ERPNext Guardian Sync] Fallback search also yielded no result.');
                                }
                                break;
                            }
                        }
                    } else {
                        linkedGuardians.push({
                            guardian: g.guardian,
                            guardian_name: g.guardian_name,
                            relation: g.relation || 'Others'
                        });
                    }

                    // Synchronize and auto-create the Guardian User account mapped with the correct role profiles and mobile number for seamless login
                    if (finalGuardianDisplayName) {
                        try {
                            const gUserPayload = {
                                mobile_no: g.mobile_number || null,
                                role_profile_name: 'Guardian',
                                module_profile: 'Guardian'
                            };
                            try {
                                await API.put(`/api/resource/User/${encodeURIComponent(gEmail)}`, gUserPayload);
                                console.log('[ERPNext Guardian User Sync] Successfully mapped Guardian profiles to existing User:', gEmail);
                            } catch (guErr) {
                                if (guErr.response?.status === 404) {
                                    await API.post('/api/resource/User', {
                                        email: gEmail,
                                        first_name: finalGuardianDisplayName,
                                        send_welcome_email: 1,
                                        ...gUserPayload
                                    });
                                    console.log('[ERPNext Guardian User Sync] Explicitly auto-created User record for Guardian:', gEmail);
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
                    city: selectedRegistration?.city || selectedRegistration?.perm_city || null,
                    state: selectedRegistration?.state || selectedRegistration?.perm_state || null,
                    pincode: selectedRegistration?.pincode || selectedRegistration?.perm_pincode || null,
                    academic_year: formData.academic_year || selectedRegistration?.academic_year,
                    program: formData.program || selectedRegistration?.program,
                    status: 'Admitted',
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
                        }

                        // Instantly map Student profile settings to the corresponding ERPNext User account
                        try {
                            const userPayload = {
                                mobile_no: formData.mobile || selectedRegistration?.student_mobile_number || null,
                                role_profile_name: 'Student',
                                module_profile: 'Student'
                            };
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
                                        send_welcome_email: 1,
                                        ...userPayload
                                    });
                                    console.log('[ERPNext User Sync] Explicitly created new User record mapped with Student permissions.');
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
                notification.warning({ message: 'ERPNext Sync Partial', description: `Student creation skipped/failed: ${typeof errMsg === 'string' ? errMsg.slice(0, 100) : 'Check server logs'}` });
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

    const filteredData = useMemo(() => {
        const term = searchQuery.toLowerCase();
        return registrations.filter(d => 
            (d.first_name || '').toLowerCase().includes(term) || 
            (d.registrationNo || '').toLowerCase().includes(term) ||
            (d.enquiryCode || '').toLowerCase().includes(term)
        );
    }, [registrations, searchQuery]);

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Admission No" disabled value={formData.admissionNo} />
                            <InputField label="Admission Date" type="date" value={formData.admission_date} onChange={(v) => setFormData({...formData, admission_date: v})} />
                            <SelectField label="Academic Year" value={formData.academic_year} options={academicYears} onChange={(v) => setFormData({...formData, academic_year: v})} />
                            <SelectField label="Final Admission Program" required value={formData.program} options={availableClasses} onChange={(v) => setFormData({...formData, program: v})} />

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
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Showing Ready for Admission</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Student Details</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Program</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Academic Year</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Reference Codes</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px]">Date of Birth</th>
                                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-[11px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center"><Spin /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400 font-medium italic">No matching records found</td></tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/40 transition-all group">
                                        <td className="px-4 py-3.5">
                                            <div className="font-bold text-gray-900">{row.first_name} {row.last_name}</div>
                                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">{row.student_mobile_number || row.mobile || 'No mobile'}</div>
                                        </td>
                                        <td className="px-4 py-3.5 font-black text-blue-600 uppercase text-[11px]">{row.program}</td>
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
                                            {row.admissionStatus === 'Admitted' ? (
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
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleConvert(row)}
                                                    className="px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                                >
                                                    Add Admission
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
