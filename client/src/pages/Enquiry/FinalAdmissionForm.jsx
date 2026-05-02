import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin, Tabs, Modal } from 'antd';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiPlus, FiArrowLeft, FiSave, FiUser, FiUsers, FiBriefcase, FiLink, FiEdit2, FiTrash2, FiSearch, FiDownload, FiRefreshCw, FiX, FiFileText, FiCheckCircle } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';

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
const FEES_PATH = 'schooler_system/enquiry_management/form_fee_setup';

export default function FinalAdmissionForm({ initialView = 'list' }) {
    const [view, setView] = useState(initialView);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [admFee, setAdmFee] = useState(0);
    const [availableClasses, setAvailableClasses] = useState(['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']);


    const initFormData = {
        admissionNo: '',
        admissionDate: new Date().toISOString().split('T')[0],
        academicYear: '2025-2026',
        class: '',
        firstName: '',
        lastName: '',
        gender: '',
        birthDate: '',
        mobile: '',
        email: '',
        fatherName: '',
        motherName: '',
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

    useEffect(() => {
        fetchRestrictions();
        if (view === 'list') fetchRegistrations();
    }, [view]);

    const fetchRestrictions = async () => {
        try {
            const snap = await getDocs(collection(db, 'schooler_system/enquiry_management/class_restrictions'));
            const restricted = snap.docs.filter(d => d.data().isDisabled).map(d => d.id);
            const all = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
            setAvailableClasses(all.filter(c => !restricted.includes(c)));
        } catch (err) { console.error('Restriction fetch failed'); }
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
            class: reg.class,
            firstName: reg.firstName,
            lastName: reg.lastName,
            gender: reg.gender,
            birthDate: reg.birthDate,
            mobile: reg.smsNumber1 || reg.mobile,
            email: reg.email,
            fatherName: reg.fatherName,
            motherName: reg.motherName,
            enquiryCode: reg.enquiryCode || '-',
            registrationCode: reg.registrationNo || reg.id,
            academicYear: reg.academicYear
        });
        fetchAdmFee();
        setView('form');
    };

    const fetchAdmFee = async () => {
        try {
            const q = query(collection(db, FEES_PATH));
            const snap = await getDocs(q);
            const fees = snap.docs.map(d => d.data());
            const activeAdmFee = fees.find(f => f.feeType === 'Admission' && f.status === 'Active');
            if (activeAdmFee) {
                setAdmFee(activeAdmFee.amount);
                setFormData(prev => ({ ...prev, feeAmount: activeAdmFee.amount }));
            }
        } catch (err) { console.error('Fee fetch error:', err); }
    };

    const handleSave = async () => {
        if (!formData.firstName || !formData.class) {
            notification.warning({ message: 'Missing Fields' });
            return;
        }
        setSaving(true);
        try {
            // Save to admissions
            await addDoc(collection(db, ADMISSIONS_PATH), { 
                ...formData, 
                registrationId: selectedRegistration?.id,
                created_at: serverTimestamp(), 
                updated_at: serverTimestamp() 
            });
            
            // Optionally update registration status to 'Admitted'
            if (selectedRegistration) {
                await updateDoc(doc(db, REGISTRATIONS_PATH, selectedRegistration.id), {
                    admissionStatus: 'Admitted',
                    updated_at: serverTimestamp()
                });
            }

            notification.success({ message: 'Admission Confirmed!' });
            setView('list');
            fetchRegistrations();
        } catch (err) { notification.error({ message: err.message }); }
        finally { setSaving(false); }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.toLowerCase();
        return registrations.filter(d => 
            (d.firstName || '').toLowerCase().includes(term) || 
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
                            <InputField label="Admission Date" type="date" value={formData.admissionDate} onChange={(v) => setFormData({...formData, admissionDate: v})} />
                            <SelectField label="Academic Year" value={formData.academicYear} options={['2025-2026', '2024-2025']} onChange={(v) => setFormData({...formData, academicYear: v})} />
                            <SelectField label="Final Admission Class" required value={formData.class} options={availableClasses} onChange={(v) => setFormData({...formData, class: v})} />

                            <InputField label="Enquiry Code" disabled value={formData.enquiryCode} />
                            <InputField label="Registration Code" disabled value={formData.registrationCode} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader title="2. Student & Parent Verification" color="green" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" required value={formData.firstName} onChange={(v) => setFormData({...formData, firstName: v})} />
                            <InputField label="Last Name" value={formData.lastName} onChange={(v) => setFormData({...formData, lastName: v})} />
                            <SelectField label="Gender" value={formData.gender} options={['Male', 'Female', 'Other']} onChange={(v) => setFormData({...formData, gender: v})} />
                            <InputField label="Date of Birth" type="date" value={formData.birthDate} onChange={(v) => setFormData({...formData, birthDate: v})} />
                            <InputField label="Father's Name" value={formData.fatherName} onChange={(v) => setFormData({...formData, fatherName: v})} />
                            <InputField label="Mother's Name" value={formData.motherName} onChange={(v) => setFormData({...formData, motherName: v})} />
                        </div>
                    </div>

                    <div>
                        <SectionHeader title="3. Final Remarks" color="gray" />
                        <InputField label="Admission Remarks" type="textarea" placeholder="Enter any specific notes for this admission..." value={formData.remarks} onChange={(v) => setFormData({...formData, remarks: v})} />
                    </div>

                    <div>
                        <SectionHeader title="4. Payment Verification" color="orange" />
                        <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100 flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-bold text-orange-800">Applicable Admission Fee</p>
                                <p className="text-[11px] text-orange-600 italic">Pre-set in Form Fee Setup</p>
                            </div>
                            <div className="text-2xl font-black text-orange-700">
                                ₹ {admFee}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Fee Amount (₹)" type="number" value={formData.feeAmount} onChange={(v) => setFormData({...formData, feeAmount: v})} />
                            <SelectField label="Payment Status" value={formData.isFeePaid ? 'Paid' : 'Unpaid'} options={['Paid', 'Unpaid']} onChange={(v) => setFormData({...formData, isFeePaid: v === 'Paid'})} />
                            <InputField label="Receipt No" value={formData.receiptNo} onChange={(v) => setFormData({...formData, receiptNo: v})} placeholder="Enter Receipt No" />
                        </div>
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
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Admission Class</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Enquiry Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Registration Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Mobile No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Registration Date</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Date of Birth</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center"><Spin /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-16 text-center text-gray-400 font-medium italic">No matching records found</td></tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/40 transition-all group">
                                        <td className="px-6 py-4 font-bold text-gray-900">{row.firstName} {row.lastName}</td>
                                        <td className="px-6 py-4 font-black text-blue-600 uppercase text-[11px]">{row.class}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.academicYear}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-[11px] font-bold text-purple-600 bg-purple-50 rounded-md px-2 py-0.5">
                                                {row.enquiryCode || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-[11px] font-bold text-green-600 bg-green-50 rounded-md px-2 py-0.5">
                                                {row.registrationNo || row.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">{row.smsNumber1 || row.mobile || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-500">{row.registrationDate || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-500">{row.birthDate || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleConvert(row)}
                                                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${row.admissionStatus === 'Admitted' ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
                                                disabled={row.admissionStatus === 'Admitted'}
                                            >
                                                {row.admissionStatus === 'Admitted' ? 'Admitted' : 'Add Admission'}
                                            </button>
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
