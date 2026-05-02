import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Firebase collection path
const ENQUIRIES_PATH = 'schooler_system/enquiry_management/enquiries';

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

const CheckboxField = ({ label, checked, onChange, disabled = false }) => (
    <div className="flex items-center gap-2 mt-2">
        <input
            type="checkbox"
            checked={checked || false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label className={`text-[13px] font-semibold text-gray-700 cursor-pointer ${disabled ? 'opacity-50' : ''}`} onClick={() => !disabled && onChange(!checked)}>
            {label}
        </label>
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

export default function AddEnquiry() {
    const navigate = useNavigate();
    const [view, setView] = useState('list');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('1');
    const [availableClasses, setAvailableClasses] = useState(['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']);


    const initFormData = {
        // Student Detail
        academicYear: '2025-2026',
        class: '',
        enquiryDate: new Date().toISOString().split('T')[0],
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
        enquiryFormNo: '',
        enquiryStatus: 'Open',
        isRegistrationFormGiven: false,
        sendSMS: false,
        sendEmail: false,
        remarks: '',
        referenceBy: '',
        campusVisit: 'No',
        enquiryCode: '',

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

        // Sibling Info
        siblings: []
    };

    const [formData, setFormData] = useState(initFormData);
    const [selectedSibling, setSelectedSibling] = useState('');

    useEffect(() => {
        fetchRestrictions();
        if (view === 'list') {
            fetchData();
        } else {
            if (editingRecord) {
                setFormData({ ...initFormData, ...editingRecord });
            } else {
                setFormData({ ...initFormData, enquiryCode: `ENQ-${Date.now().toString().slice(-6)}` });
            }
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


    const fetchData = async () => {
        setLoading(true);
        try {
            const colRef = collection(db, ENQUIRIES_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            const enquiries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(enquiries);
        } catch (err) {
            console.error('Fetch Enquiries failed:', err);
            try {
                const colRef = collection(db, ENQUIRIES_PATH);
                const snapshot = await getDocs(colRef);
                const enquiries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setData(enquiries);
            } catch (err2) {
                setData([]);
            }
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
            const colRef = collection(db, ENQUIRIES_PATH);
            if (editingRecord) {
                const docRef = doc(db, ENQUIRIES_PATH, editingRecord.id);
                await updateDoc(docRef, {
                    ...formData,
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Enquiry Updated Successfully' });
            } else {
                await addDoc(colRef, {
                    ...formData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                notification.success({ message: 'Enquiry Created Successfully' });
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
        if (!window.confirm(`Are you sure you want to delete enquiry for "${record.firstName}"?`)) return;
        try {
            const docRef = doc(db, ENQUIRIES_PATH, record.id);
            await deleteDoc(docRef);
            notification.success({ message: 'Enquiry Deleted' });
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
            (d.enquiryCode || '').toLowerCase().includes(term) ||
            (d.smsNumber1 || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

                        <InputField label="Enquiry Date" type="date" value={formData.enquiryDate} onChange={(v) => updateField('enquiryDate', v)} />
                    </div>

                    <SectionHeader title="Basic Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Student Name/First Name" required value={formData.firstName} onChange={(v) => updateField('firstName', v)} placeholder="Enter Student Name" />
                        <InputField label="Father Name/Middle Name" value={formData.middleName} onChange={(v) => updateField('middleName', v)} placeholder="Enter Father Name" />
                        <InputField label="Surname/Last Name" value={formData.lastName} onChange={(v) => updateField('lastName', v)} placeholder="Enter Surname" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Student Full Name as per marksheet" value={formData.fullName} onChange={(v) => updateField('fullName', v)} placeholder="Enter Student Full Name as per marksheet" />
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
                    <div className="flex flex-col gap-1 mt-4">
                        <label className="text-[13px] font-semibold text-gray-700">Father Photo</label>
                        <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
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
                    <div className="flex flex-col gap-1 mt-4">
                        <label className="text-[13px] font-semibold text-gray-700">Mother Photo</label>
                        <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
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
                            {editingRecord ? `Edit Enquiry: ${formData.enquiryCode}` : 'New Admission Enquiry'}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50">
                            {saving ? <Spin size="small" /> : <FiSave className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Enquiry'}
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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Add Enquiry</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Enquiry</span> / <span className="text-blue-600 font-bold">Add Enquiry</span>
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
                            placeholder="Search enquiries by name, code or mobile..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none transition-all placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {filteredData.length} TOTAL ENQUIRIES
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Enquiry Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Source From</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Class</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Mobile No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Enquiry Date</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">No matching records found</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => { setEditingRecord(row); setView('form'); }}>
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.enquiryCode}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.firstName} {row.lastName}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.sourceOfEnquiry || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.class || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.academicYear || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.smsNumber1 || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.enquiryDate || '-'}</td>
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
