import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
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
    const [availableClasses, setAvailableClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [guardiansList, setGuardiansList] = useState([]);


    const initFormData = {
        // Student Detail
        academic_year: '2025-2026',
        program: '', // maps to Class
        enquiry_date: new Date().toISOString().split('T')[0],
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
        enquiry_form_no: '',
        status: 'Open', // ERP uses status
        is_registration_form_given: false,
        send_sms: false,
        send_email: false,
        remarks: '',
        referred_by: '', // ERP uses referred_by
        campus_visit: 'No',
        enquiry_code: '',

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

        // Sibling Info
        siblings: []
    };

    const [formData, setFormData] = useState(initFormData);
    const [selectedSibling, setSelectedSibling] = useState('');

    const fetchERPNextData = async () => {
        try {
            const [progRes, yearRes, guardianRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Guardian?fields=["name","guardian_name","email_address","mobile_number"]&limit_page_length=None&order_by=name asc').catch(() => ({ data: { data: [] } })),
            ]);
            const programs = progRes.data.data?.map(p => p.name) || [];
            const years = yearRes.data.data?.map(y => y.name) || [];
            
            setAcademicYears(years);
            setGuardiansList((guardianRes.data.data || []).map(g => ({ name: g.name, guardian_name: g.guardian_name || g.name, email_address: g.email_address || '', mobile_number: g.mobile_number || '' })));
            await fetchRestrictions(programs);
        } catch (err) {
            console.error('Error fetching ERPNext data:', err);
        }
    };

    useEffect(() => {
        fetchERPNextData();
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
        if (!formData.first_name || !formData.program || !formData.student_mobile_number) {
            notification.warning({ message: 'Required Fields Missing', description: 'Please fill in Student Name, Class, and Mobile Number.' });
            return;
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

                // Validate guardians
                for (let i = 0; i < (formData.guardians || []).length; i++) {
                    const g = formData.guardians[i];
                    if (g.is_new && !g.guardian_name) throw new Error(`Guardian Name is required for Guardian #${i + 1}.`);
                    if (!g.is_new && !g.guardian) throw new Error(`Please select an existing guardian for Guardian #${i + 1} or remove it.`);
                    if (!g.relation) throw new Error(`Relation is required for Guardian #${i + 1}.`);
                }

                // Removed ERPNext sync from Enquiry stage. 
                // Student and Guardian will only be created during Final Admission.
            } catch (erpErr) {
                console.error('Validation failed:', erpErr);
            }

            // 2. Save to Firebase (local storage)
            const colRef = collection(db, ENQUIRIES_PATH);
            const finalData = {
                ...formData,
                erp_student_id: erpNextStudentName,
                updated_at: serverTimestamp()
            };

            if (editingRecord) {
                const docRef = doc(db, ENQUIRIES_PATH, editingRecord.id);
                await updateDoc(docRef, finalData);
                notification.success({ message: 'Enquiry Updated Successfully' });
            } else {
                await addDoc(colRef, {
                    ...finalData,
                    created_at: serverTimestamp()
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
            (d.first_name || '').toLowerCase().includes(term) ||
            (d.enquiry_code || '').toLowerCase().includes(term) ||
            (d.student_mobile_number || '').toLowerCase().includes(term)
        );
    }, [data, searchQuery]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addGuardian = () => {
        setFormData(prev => ({
            ...prev,
            guardians: [...(prev.guardians || []), { 
                is_new: true,
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
            return { ...prev, guardians: g };
        });
    };
    
    const removeGuardian = (idx) => {
        setFormData(prev => ({ ...prev, guardians: (prev.guardians || []).filter((_, i) => i !== idx) }));
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
                        <SelectField label="Academic Year" required value={formData.academic_year} options={academicYears} onChange={(v) => updateField('academic_year', v)} />
                        <SelectField label="Program (Class)" required value={formData.program} options={availableClasses} onChange={(v) => updateField('program', v)} />

                        <InputField label="Enquiry Date" type="date" value={formData.enquiry_date} onChange={(v) => updateField('enquiry_date', v)} />
                    </div>

                    <SectionHeader title="Basic Detail" color="green" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="First Name" required value={formData.first_name} onChange={(v) => updateField('first_name', v)} placeholder="Enter First Name" />
                        <InputField label="Middle Name" value={formData.middle_name} onChange={(v) => updateField('middle_name', v)} placeholder="Enter Middle Name" />
                        <InputField label="Last Name" value={formData.last_name} onChange={(v) => updateField('last_name', v)} placeholder="Enter Last Name" />
                    </div>
                    <div className="mt-4">
                        <InputField label="Student Full Name" value={formData.student_full_name} onChange={(v) => updateField('student_full_name', v)} placeholder="Enter Student Full Name" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Gender" required value={formData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => updateField('gender', v)} />
                        <InputField label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
                        <InputField label="Place of Birth" value={formData.place_of_birth} onChange={(v) => updateField('place_of_birth', v)} placeholder="Enter Place of Birth" />
                        <SelectField label="Caste" value={formData.caste} options={['General', 'OBC', 'SC', 'ST']} onChange={(v) => updateField('caste', v)} />
                        <SelectField label="Religion" value={formData.religion} options={['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain']} onChange={(v) => updateField('religion', v)} />
                        <SelectField label="Blood Group" value={formData.blood_group} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} onChange={(v) => updateField('blood_group', v)} />
                    </div>

                    <SectionHeader title="Communication" color="red" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Student Mobile Number" required value={formData.student_mobile_number} onChange={(v) => updateField('student_mobile_number', v)} placeholder="Enter Mobile Number" />
                        <InputField label="Student Email Address" type="email" value={formData.student_email_id} onChange={(v) => updateField('student_email_id', v)} placeholder="Enter Email Address" />
                        <InputField label="Emergency Mobile Number" value={formData.emergency_mobile_number} onChange={(v) => updateField('emergency_mobile_number', v)} placeholder="Enter Emergency Mobile Number" />
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
                <div className="space-y-8">
                    <div className="max-w-md">
                        <SelectField label="Single Parent?" value={formData.single_parent} options={['Yes', 'No']} onChange={(v) => updateField('single_parent', v)} placeholder="Single Parent?" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 text-sm mb-4 uppercase tracking-wider border-b-2 border-blue-500 pb-1 w-fit">Guardian Details</h3>
                        {(formData.guardians || []).map((g, idx) => (
                            <div key={idx} className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50/40 relative shadow-sm">
                                <button onClick={() => removeGuardian(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 font-bold transition" title="Remove Guardian">✕</button>
                                
                                <div className="flex gap-6 mb-6 pb-4 border-b border-gray-100">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                        <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!g.is_new} onChange={() => updateGuardian(idx, 'is_new', false)} /> Link Existing Guardian
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                        <input type="radio" className="text-blue-600 focus:ring-blue-500" name={`g_type_${idx}`} checked={!!g.is_new} onChange={() => updateGuardian(idx, 'is_new', true)} /> Create New Guardian
                                    </label>
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
                                            <InputField label="Email Address" type="email" value={g.email_address || ''} onChange={v => updateGuardian(idx, 'email_address', v)} placeholder="email@example.com" />
                                            <InputField label="Mobile Number" value={g.mobile_number || ''} onChange={v => updateGuardian(idx, 'mobile_number', v)} placeholder="+91 ..." />
                                            <InputField label="Alternate Number" value={g.alternate_number || ''} onChange={v => updateGuardian(idx, 'alternate_number', v)} />
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
                    <InputField label="Previous School Name" value={formData.prev_school_name} onChange={(v) => updateField('prev_school_name', v)} placeholder="Enter Previous School Name" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <InputField label="Reason For Leaving School" value={formData.reason_for_leaving} onChange={(v) => updateField('reason_for_leaving', v)} placeholder="Enter Reason For Leaving School" />
                        <InputField label="Previous Program" value={formData.prev_program} onChange={(v) => updateField('prev_program', v)} placeholder="Enter Previous Program" />
                    </div>
                    <div className="mt-4">
                        <InputField label="School Address" type="textarea" value={formData.school_address} onChange={(v) => updateField('school_address', v)} placeholder="Enter School Address" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <InputField label="Exam Marks(%)" value={formData.exam_marks} onChange={(v) => updateField('exam_marks', v)} placeholder="Enter Exam Marks(%)" />
                        <SelectField label="Last School Affiliated Is" value={formData.last_school_affiliated} options={['CBSE', 'ICSE', 'State Board']} onChange={(v) => updateField('last_school_affiliated', v)} />
                        <InputField label="Previous School LC/TC Number" value={formData.prev_school_lctc} onChange={(v) => updateField('prev_school_lctc', v)} placeholder="Enter Previous School LC/TC Number" />
                        <InputField label="LC/TC Issue Date" type="date" value={formData.lctc_issue_date} onChange={(v) => updateField('lctc_issue_date', v)} />
                    </div>

                    <SectionHeader title="Additional Detail" color="blue" />
                    <div className="mt-4">
                        <InputField label="Student Adhar Card Number" value={formData.student_aadhar_number} onChange={(v) => updateField('student_aadhar_number', v)} placeholder="Enter Student Adhar Card Number" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <SelectField label="Single Girl Child?" value={formData.single_girl_child} options={['Yes', 'No']} onChange={(v) => updateField('single_girl_child', v)} placeholder="Single Girl Child?" />
                        <SelectField label="Specially Abled (Divyangjan)?" value={formData.specially_abled} options={['Yes', 'No']} onChange={(v) => updateField('specially_abled', v)} placeholder="Specially Abled (Divyangjan)?" />
                        <SelectField label="Belonging to the EWS?" value={formData.belonging_ews} options={['Yes', 'No']} onChange={(v) => updateField('belonging_ews', v)} placeholder="Belonging to the EWS?" />
                        <InputField label="Personal Education Number(PEN)" value={formData.pen_number} onChange={(v) => updateField('pen_number', v)} placeholder="Enter Personal Education Number" />
                        <InputField label="ABHA Number" value={formData.abha_number} onChange={(v) => updateField('abha_number', v)} placeholder="Enter ABHA Number" />
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
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Program (Class)</th>
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
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.enquiry_code}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.first_name} {row.last_name}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.source || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.program || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.academic_year || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.student_mobile_number || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.enquiry_date || '-'}</td>
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
