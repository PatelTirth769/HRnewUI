import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';



const generatePDF = (record) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(86, 94, 125);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // School Logo
    try {
        doc.addImage(schoolLogo, 'PNG', 15, 8, 24, 24);
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
        'Academic Year': record.academicYear,
        'Class': record.class,
        'Registration Date': record.registrationDate,
        'Full Name': `${record.firstName} ${record.middleName || ''} ${record.lastName || ''}`,
        'Gender': record.gender,
        'Date of Birth': record.birthDate,
        'Place of Birth': record.placeOfBirth,
        'Caste / Religion': `${record.caste || '-'} / ${record.religion || '-'}`,
        'Blood Group': record.bloodGroup || '-',
        'Communication Mobile': record.smsNumber1,
        'Email Address': record.email,
        'Emergency Contact': record.emergencyMobile
    });

    // 2. Parent Information
    addSection('2. Father & Mother Details', {
        'Father Name': record.fatherName || '-',
        'Father Qualification': record.fatherQualification,
        'Father Occupation': `${record.fatherOccupation || '-'} (${record.fatherCompanyName || '-'})`,
        'Father Mobile / Email': `${record.fatherMobile || '-'} / ${record.fatherEmail || '-'}`,
        'Father Aadhar': record.fatherAadhar,
        'Mother Name': record.motherName || '-',
        'Mother Qualification': record.motherQualification,
        'Mother Occupation': `${record.motherOccupation || '-'} (${record.motherCompanyName || '-'})`,
        'Mother Mobile / Email': `${record.motherMobile || '-'} / ${record.motherEmail || '-'}`,
        'Mother Aadhar': record.motherAadhar,
        'Annual Income (F/M)': `${record.fatherIncomeAnnual || '-'} / ${record.motherIncomeAnnual || '-'}`
    });

    // 3. Guardian & Address
    addSection('3. Guardian & Contact Information', {
        'Guardian Name': record.guardianName || '-',
        'Guardian Mobile': record.guardianMobile,
        'Guardian Address': record.guardianAddress,
        'Residential Address': record.fatherResidentialAddress || record.motherResidentialAddress || '-'
    });

    // 4. Office Use & Previous School
    addSection('4. Office Use & Previous Academic History', {
        'Previous School': record.prevSchoolName,
        'Previous Class / Marks': `${record.prevClass || '-'} / ${record.examMarks || '-'}%`,
        'School Affiliation': record.lastSchoolAffiliated,
        'TC/LC Number & Date': `${record.prevSchoolLCTC || '-'} (${record.lctcIssueDate || '-'})`,
        'Student Aadhar No': record.studentAadhar,
        'PEN Number': record.penNumber,
        'ABHA Number': record.abhaNumber,
        'Single Girl Child / EWS': `${record.singleGirlChild || 'No'} / ${record.belongingEWS || 'No'}`
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
const FEES_PATH = 'schooler_system/enquiry_management/form_fee_setup';

export default function RegistrationForm({ initialView = 'list' }) {
    const initFormData = {
        // Student Detail
        academicYear: '2025-2026',
        class: '',
        registrationDate: new Date().toISOString().split('T')[0],
        firstName: '',
        middleName: '',
        lastName: '',
        fullName: '',
        gender: '',
        birthDate: '',
        placeOfBirth: '',
        caste: '',
        subCaste: '',
        category: '',
        religion: '',
        motherTongue: '',
        bloodGroup: '',
        fatherName: '',
        motherName: '',
        address: '',
        state: '',
        city: '',
        zipcode: '',
        permAddress: '',
        permState: '',
        permCity: '',
        permZipcode: '',
        sameAsCurrent: false,
        smsNumber1: '',
        email: '',
        altMobile: '',
        altEmail: '',
        emergencyMobile: '',
        smsNumber: '',
        sourceOfEnquiry: '',
        followUpDate: '',
        registrationFormNo: '',
        enquiryStatus: 'Open',
        isRegistrationFormGiven: false,
        sendSMS: false,
        sendEmail: false,
        remarks: '',
        referenceBy: '',
        campusVisit: 'No',
        registrationNo: '',
        // Fee fields
        feeAmount: 0,
        isFeePaid: false,
        receiptNo: '',
        paymentMode: 'Cash',

        // Parent Detail Details
        singleParent: '',
        fatherQualification: '',
        fatherOccupation: '',
        fatherCompanyName: '',
        fatherDesignation: '',
        fatherMobile: '',
        fatherEmail: '',
        fatherAadhar: '',
        fatherOfficeAddress: '',
        fatherResidentialAddress: '',
        motherQualification: '',
        motherOccupation: '',
        motherCompanyName: '',
        motherDesignation: '',
        motherMobile: '',
        motherEmail: '',
        motherAadhar: '',
        motherOfficeAddress: '',
        motherResidentialAddress: '',
        parentsAnniversaryDate: '',
        fatherIncomeAnnual: '',
        motherIncomeAnnual: '',
        phoneNoR: '',
        guardianName: '',
        guardianEmail: '',
        guardianMobile: '',
        guardianAddress: '',
        guardianState: '',
        guardianCity: '',
        guardianZipcode: '',

        // Office Use Detail
        prevSchoolName: '',
        reasonForLeaving: '',
        prevClass: '',
        schoolAddress: '',
        examMarks: '',
        lastSchoolAffiliated: '',
        prevSchoolLCTC: '',
        lctcIssueDate: '',
        studentAadhar: '',
        singleGirlChild: '',
        speciallyAbled: '',
        belongingEWS: '',
        penNumber: '',
        abhaNumber: '',

        // Document Detail (New for Registration)
        documents: [
            { name: 'Birth Certificate', status: 'Pending', remarks: '' },
            { name: 'Aadhar Card', status: 'Pending', remarks: '' },
            { name: 'Last Year Marksheet', status: 'Pending', remarks: '' },
            { name: 'Passport Size Photo', status: 'Pending', remarks: '' },
            { name: 'Transfer Certificate (TC)', status: 'Pending', remarks: '' }
        ],

        // Sibling Info
        siblings: []
    };

    const [view, setView] = useState(initialView);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [regFee, setRegFee] = useState(0);
    const [formData, setFormData] = useState(initFormData);
    const [selectedSibling, setSelectedSibling] = useState('');
    const [availableClasses, setAvailableClasses] = useState(['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']);

    const navigate = useNavigate();

    useEffect(() => {
        fetchRestrictions();
        if (view === 'list') fetchData();
        else {
            fetchRegFee();
            if (!editingRecord) setFormData({ ...initFormData, registrationNo: `REG-${Date.now().toString().slice(-6)}` });
            else setFormData(editingRecord);
        }
    }, [view, editingRecord]);

    const fetchRestrictions = async () => {
        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/class_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            const all = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
            setAvailableClasses(all.filter(c => !restricted.includes(c)));
        } catch (err) { console.error('Restriction fetch failed'); }
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
        if (!formData.firstName || !formData.class || !formData.smsNumber1) {
            notification.warning({ message: 'Required Fields Missing', description: 'Please fill in Student Name, Class, and Mobile Number.' });
            return;
        }

        setSaving(true);
        try {
            const colRef = collection(db, REGISTRATIONS_PATH);
            if (editingRecord) {
                const docRef = doc(db, REGISTRATIONS_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Registration Updated Successfully' });
            } else {
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Registration Created Successfully' });
            }
            setView('list');
            setEditingRecord(null);
        } catch (err) {
            notification.error({ message: 'Save Failed', description: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (record) => {
        if (!window.confirm(`Are you sure you want to delete registration for "${record.firstName}"?`)) return;
        try {
            const docRef = doc(db, REGISTRATIONS_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: 'Registration Deleted' });
            fetchData();
        } catch (err) {
            notification.error({ message: 'Delete Failed', description: err.message });
        }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        if (!term) return data;
        return data.filter(d => 
            (d.firstName || '').toLowerCase().includes(term) ||
            (d.registrationNo || '').toLowerCase().includes(term) ||
            (d.smsNumber1 || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateDocStatus = (index, status) => {
        const newDocs = [...formData.documents];
        newDocs[index].status = status;
        setFormData(prev => ({ ...prev, documents: newDocs }));
    };

    const addSibling = () => {
        if (!selectedSibling) return;
        if (formData.siblings.includes(selectedSibling)) {
            notification.info({ message: 'Sibling already added' });
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
                        <SelectField label="Academic Year" required value={formData.academicYear} options={['2024-2025', '2025-2026']} onChange={(v) => updateField('academicYear', v)} />
                        <SelectField label="Class" required value={formData.class} options={availableClasses} onChange={(v) => updateField('class', v)} />

                        <InputField label="Registration Date" type="date" value={formData.registrationDate} onChange={(v) => updateField('registrationDate', v)} />
                    </div>

                    <SectionHeader title="Basic Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Student Name/First Name" required value={formData.firstName} onChange={(v) => updateField('firstName', v)} placeholder="Enter Student Name" />
                        <InputField label="Father Name/Middle Name" value={formData.middleName} onChange={(v) => updateField('middleName', v)} placeholder="Enter Father Name" />
                        <InputField label="Surname/Last Name" value={formData.lastName} onChange={(v) => updateField('lastName', v)} placeholder="Enter Surname" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Student Full Name as per marksheet" value={formData.fullName} onChange={(v) => updateField('fullName', v)} placeholder="Enter Student Full Name" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Gender" required value={formData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => updateField('gender', v)} />
                        <InputField label="Birth Date" type="date" value={formData.birthDate} onChange={(v) => updateField('birthDate', v)} />
                        <InputField label="Place of Birth" value={formData.placeOfBirth} onChange={(v) => updateField('placeOfBirth', v)} placeholder="Enter Place of Birth" />
                        <SelectField label="Caste" value={formData.caste} options={['General', 'OBC', 'SC', 'ST']} onChange={(v) => updateField('caste', v)} />
                        <SelectField label="Religion" value={formData.religion} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']} onChange={(v) => updateField('religion', v)} />
                        <SelectField label="Blood Group" value={formData.bloodGroup} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} onChange={(v) => updateField('bloodGroup', v)} />
                    </div>

                    <SectionHeader title="Communication" color="red" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="SMS Number1(Communication)" required value={formData.smsNumber1} onChange={(v) => updateField('smsNumber1', v)} placeholder="Enter SMS Number" />
                        <InputField label="E-Mail(Communication)" type="email" value={formData.email} onChange={(v) => updateField('email', v)} placeholder="enter e-mail" />
                        <InputField label="Emergency Mobile No." value={formData.emergencyMobile} onChange={(v) => updateField('emergencyMobile', v)} placeholder="Enter Emergency Mobile No." />
                    </div>

                    <SectionHeader title="Additional Information" color="orange" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Source Of Enquiry" value={formData.sourceOfEnquiry} options={['Direct', 'Reference', 'Social Media']} onChange={(v) => updateField('sourceOfEnquiry', v)} />
                        <InputField label="Follow-up Date" type="date" value={formData.followUpDate} onChange={(v) => updateField('followUpDate', v)} />
                        <SelectField label="Enquiry Status" required value={formData.enquiryStatus} options={['Open', 'Closed', 'Converted']} onChange={(v) => updateField('enquiryStatus', v)} />
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
                        <SelectField label="Single Parent?" value={formData.singleParent} options={['Yes', 'No']} onChange={(v) => updateField('singleParent', v)} placeholder="Single Parent?" />
                    </div>

                    <SectionHeader title="Father Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Qualification" value={formData.fatherQualification} onChange={(v) => updateField('fatherQualification', v)} placeholder="Enter Qualification" />
                        <InputField label="Occupation" value={formData.fatherOccupation} onChange={(v) => updateField('fatherOccupation', v)} placeholder="Enter Occupation" />
                        <InputField label="Company Name" value={formData.fatherCompanyName} onChange={(v) => updateField('fatherCompanyName', v)} placeholder="Enter Company Name" />
                        <InputField label="Designation" value={formData.fatherDesignation} onChange={(v) => updateField('fatherDesignation', v)} placeholder="Enter Designation" />
                        <InputField label="Father Mobile No." value={formData.fatherMobile} onChange={(v) => updateField('fatherMobile', v)} placeholder="Enter Father Mobile No." />
                        <InputField label="Email Id" value={formData.fatherEmail} onChange={(v) => updateField('fatherEmail', v)} placeholder="Enter Email Id" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Father Aadhar Card Number" value={formData.fatherAadhar} onChange={(v) => updateField('fatherAadhar', v)} placeholder="Enter Father Aadhar Card Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InputField label="Office Address" type="textarea" value={formData.fatherOfficeAddress} onChange={(v) => updateField('fatherOfficeAddress', v)} placeholder="Enter Office Address" />
                        <InputField label="Residential Address" type="textarea" value={formData.fatherResidentialAddress} onChange={(v) => updateField('fatherResidentialAddress', v)} placeholder="Enter Residential Address" />
                    </div>

                    <SectionHeader title="Mother Detail" color="orange" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Qualification" value={formData.motherQualification} onChange={(v) => updateField('motherQualification', v)} placeholder="Enter Qualification" />
                        <InputField label="Occupation" value={formData.motherOccupation} onChange={(v) => updateField('motherOccupation', v)} placeholder="Enter Occupation" />
                        <InputField label="Company Name" value={formData.motherCompanyName} onChange={(v) => updateField('motherCompanyName', v)} placeholder="Enter Company Name" />
                        <InputField label="Designation" value={formData.motherDesignation} onChange={(v) => updateField('motherDesignation', v)} placeholder="Enter Designation" />
                        <InputField label="Mother Mobile No." value={formData.motherMobile} onChange={(v) => updateField('motherMobile', v)} placeholder="Enter Mother Mobile No." />
                        <InputField label="Email Id" value={formData.motherEmail} onChange={(v) => updateField('motherEmail', v)} placeholder="Enter Email Id" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Mother Aadhar Card Number" value={formData.motherAadhar} onChange={(v) => updateField('motherAadhar', v)} placeholder="Enter Mother Aadhar Card Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InputField label="Office Address" type="textarea" value={formData.motherOfficeAddress} onChange={(v) => updateField('motherOfficeAddress', v)} placeholder="Enter Office Address" />
                        <InputField label="Residential Address" type="textarea" value={formData.motherResidentialAddress} onChange={(v) => updateField('motherResidentialAddress', v)} placeholder="Enter Residential Address" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-4 border-t border-gray-100">
                        <InputField label="Parents Anniversary Date" type="date" value={formData.parentsAnniversaryDate} onChange={(v) => updateField('parentsAnniversaryDate', v)} />
                        <InputField label="Father Income(Annual)" value={formData.fatherIncomeAnnual} onChange={(v) => updateField('fatherIncomeAnnual', v)} placeholder="Enter Father Income" />
                        <InputField label="Mother Income(Annual)" value={formData.motherIncomeAnnual} onChange={(v) => updateField('motherIncomeAnnual', v)} placeholder="Enter Mother Income" />
                        <InputField label="Phone No (R)" value={formData.phoneNoR} onChange={(v) => updateField('phoneNoR', v)} placeholder="Enter Phone No (R)" />
                    </div>

                    <SectionHeader title="Guardian Detail" color="brown" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Guardian Name" value={formData.guardianName} onChange={(v) => updateField('guardianName', v)} placeholder="Enter Guardian Name" />
                        <InputField label="Guardian Email id" value={formData.guardianEmail} onChange={(v) => updateField('guardianEmail', v)} placeholder="Enter guardian email id" />
                        <InputField label="Guardian Mobile No." value={formData.guardianMobile} onChange={(v) => updateField('guardianMobile', v)} placeholder="Enter Guardian Mobile No." />
                    </div>
                    <div className="mt-4">
                        <InputField label="Guardian Address" type="textarea" value={formData.guardianAddress} onChange={(v) => updateField('guardianAddress', v)} placeholder="Enter Guardian Address" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="State" value={formData.guardianState} options={['Gujarat', 'Maharashtra']} onChange={(v) => updateField('guardianState', v)} />
                        <SelectField label="City" value={formData.guardianCity} options={['Ahmedabad', 'Surat']} onChange={(v) => updateField('guardianCity', v)} />
                        <InputField label="Zipcode" value={formData.guardianZipcode} onChange={(v) => updateField('guardianZipcode', v)} placeholder="Enter Zipcode" />
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
                    <div className="mt-4">
                        <InputField label="Student Adhar Card Number" value={formData.studentAadhar} onChange={(v) => updateField('studentAadhar', v)} placeholder="Enter Student Adhar Card Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Single Girl Child?" value={formData.singleGirlChild} options={['Yes', 'No']} onChange={(v) => updateField('singleGirlChild', v)} placeholder="Single Girl Child?" />
                        <SelectField label="Specially Abled (Divyangjan)?" value={formData.speciallyAbled} options={['Yes', 'No']} onChange={(v) => updateField('speciallyAbled', v)} placeholder="Specially Abled (Divyangjan)?" />
                        <SelectField label="Belonging to the EWS?" value={formData.belongingEWS} options={['Yes', 'No']} onChange={(v) => updateField('belongingEWS', v)} placeholder="Belonging to the EWS?" />
                        <InputField label="Personal Education Number(PEN)" value={formData.penNumber} onChange={(v) => updateField('penNumber', v)} placeholder="Enter Personal Education Number" />
                        <InputField label="ABHA Number" value={formData.abhaNumber} onChange={(v) => updateField('abhaNumber', v)} placeholder="Enter ABHA Number" />
                    </div>
                </div>
            )
        },
        {
            key: '4',
            label: <span className="flex items-center gap-2"><FiFileText /> Document Detail</span>,
            children: (
                <div className="space-y-6">
                    <SectionHeader title="Required Documents" color="blue" />
                    <div className="bg-gray-50/30 rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-100/50">
                                    <th className="px-6 py-3 font-bold text-gray-600">Document Name</th>
                                    <th className="px-6 py-3 font-bold text-gray-600">Status</th>
                                    <th className="px-6 py-3 font-bold text-gray-600">Upload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.documents.map((doc, i) => (
                                    <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-700">{doc.name}</td>
                                        <td className="px-6 py-4">
                                            <SelectField 
                                                value={doc.status} 
                                                options={['Submitted', 'Pending', 'Verified']} 
                                                onChange={(v) => updateDocStatus(i, v)} 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input type="file" className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        </td>
                                    </tr>
                                ))}
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
            label: <span className="flex items-center gap-2"><FiBriefcase /> Fee & Payment</span>,
            children: (
                <div className="space-y-6">
                    <SectionHeader title="Form Fee Details" color="green" />
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-blue-800">Applicable Registration Fee</p>
                            <p className="text-[11px] text-blue-600 italic">This fee is automatically fetched from Form Fee Setup</p>
                        </div>
                        <div className="text-2xl font-black text-blue-700">
                            ₹ {regFee}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <InputField 
                            label="Fee Amount (₹)" 
                            type="number" 
                            value={formData.feeAmount} 
                            onChange={(v) => updateField('feeAmount', v)} 
                        />
                        <SelectField 
                            label="Payment Status" 
                            value={formData.isFeePaid ? 'Paid' : 'Unpaid'} 
                            options={['Paid', 'Unpaid']} 
                            onChange={(v) => updateField('isFeePaid', v === 'Paid')} 
                        />
                        <InputField 
                            label="Receipt Number" 
                            value={formData.receiptNo} 
                            onChange={(v) => updateField('receiptNo', v)} 
                            placeholder="Enter Receipt No." 
                        />
                        <SelectField 
                            label="Payment Mode" 
                            value={formData.paymentMode} 
                            options={['Cash', 'Online', 'Cheque']} 
                            onChange={(v) => updateField('paymentMode', v)} 
                        />
                    </div>
                </div>
            )
        }
    ];

    if (view === 'form') {
        return (
            <div className="p-6 max-w-[1200px] mx-auto pb-24 text-gray-800 font-inter">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
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
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
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
                    <button onClick={() => { setEditingRecord(null); setView('form'); }} className="px-5 py-2 bg-[#8C3A3A] text-white rounded-lg text-sm font-black hover:bg-[#732929] transition-all shadow-lg shadow-black/10 flex items-center gap-2 active:scale-95">
                        <FiPlus className="w-4 h-4" /> Add New
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
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Class</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Mobile No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Date of Registration</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Date of Birth</th>
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
                                        <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{row.firstName} {row.lastName}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.class || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.academicYear || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-bold">{row.smsNumber1 || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.registrationDate || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.birthDate || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${row.enquiryStatus === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {row.enquiryStatus || 'Open'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); generatePDF(row); }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                            >
                                                <FiDownload className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
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
        </div>
    );
}
