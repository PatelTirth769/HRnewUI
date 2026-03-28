import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const SECTION_CLASSES = "mb-8 bg-white border border-gray-100 rounded-md p-6 shadow-sm";
const SEC_HEADER = "text-lg font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2";

export default function EducationSettings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('Details');
    const [showSecret, setShowSecret] = useState(false);

    const defaultData = {
        // Details Tab
        current_academic_year: '',
        current_academic_term: '',
        attendance_freeze_date: '',
        validate_batch_for_students_in_student_group: 0,
        validate_enrolled_course_for_students_in_student_group: 0,
        make_academic_term_mandatory: 0,
        skip_user_creation_for_new_student: 0,
        
        // Accounting
        create_sales_order_instead_of_sales_invoice: 0,
        submit_sales_invoice_from_program_enrollment: 0,
        sales_invoice_posting_date_same_as_fee_schedule_date: 1,

        // Instructor
        instructor_naming_by: 'Full Name',

        // Portal Settings Tab
        attendance_based_on_course_schedule: 0,
        razorpay_key: '',
        razorpay_secret: '',
        school_college_name_abbreviation: '',
        school_college_logo: '',
    };

    const [formData, setFormData] = useState({ ...defaultData });
    const [lookups, setLookups] = useState({
        academicYears: [],
        academicTerms: []
    });

    useEffect(() => {
        fetchSettings();
        fetchLookups();
    }, []);

    const fetchLookups = async () => {
        try {
            const [yearsRes, termsRes] = await Promise.all([
                API.get('/api/resource/Academic Year', { params: { limit_page_length: 'None' } }),
                API.get('/api/resource/Academic Term', { params: { limit_page_length: 'None' } })
            ]);
            setLookups({
                academicYears: yearsRes.data?.data || [],
                academicTerms: termsRes.data?.data || []
            });
        } catch (err) {
            console.error('Failed to fetch lookups', err);
        }
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            // ERPNext singletons are accessed by their name
            const res = await API.get('/api/resource/Education Settings/Education Settings');
            const doc = res.data?.data;
            if (doc) {
                setFormData(prev => ({ ...prev, ...doc }));
            }
        } catch (err) {
            console.error('Failed to load Education Settings', err);
            if (err.response?.status !== 404) {
                notification.error({ message: 'Failed to load Education Settings' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Using PUT for update as per user's API table
            await API.put('/api/resource/Education Settings/Education Settings', formData);
            notification.success({ message: 'Education Settings Saved Successfully' });
        } catch (err) {
            console.error('Failed to save Education Settings', err);
            notification.error({ 
                message: 'Failed to save Education Settings', 
                description: err.response?.data?._server_messages || err.message 
            });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-gray-400 font-medium">Loading settings...</span>
                </div>
            </div>
        );
    }

    const labelStyle = "block text-[13px] text-gray-500 mb-1 font-medium";
    const inputStyle = "w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 transition-all";
    const checkboxLabelStyle = "text-sm text-gray-700 font-medium cursor-pointer transition-colors";
    const subTextStyle = "text-[11px] text-gray-400 mt-1 leading-relaxed";

    return (
        <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Education Settings</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-0 border-b border-gray-200 mb-8 bg-white rounded-t-lg shadow-sm border border-gray-100 overflow-hidden">
                {['Details', 'Portal Settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${
                            activeTab === tab 
                                ? 'border-gray-900 text-gray-900 bg-white' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === 'Details' ? (
                    <>
                        <div className={SECTION_CLASSES}>
                            <h2 className={SEC_HEADER}>General Configuration</h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>Current Academic Year</label>
                                        <select className={inputStyle} value={formData.current_academic_year} onChange={e => updateField('current_academic_year', e.target.value)}>
                                            <option value="">Select Academic Year...</option>
                                            {lookups.academicYears.map(item => (
                                                <option key={item.name} value={item.name}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Current Academic Term</label>
                                        <select className={inputStyle} value={formData.current_academic_term} onChange={e => updateField('current_academic_term', e.target.value)}>
                                            <option value="">Select Academic Term...</option>
                                            {lookups.academicTerms.map(item => (
                                                <option key={item.name} value={item.name}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Attendance Freeze Date</label>
                                        <input type="date" className={inputStyle} value={formData.attendance_freeze_date} onChange={e => updateField('attendance_freeze_date', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.validate_batch_for_students_in_student_group === 1}
                                            onChange={e => updateField('validate_batch_for_students_in_student_group', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Validate Batch for Students in Student Group</span>
                                            <p className={subTextStyle}>The Student Batch will be validated for every Student from the Program Enrollment.</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.validate_enrolled_course_for_students_in_student_group === 1}
                                            onChange={e => updateField('validate_enrolled_course_for_students_in_student_group', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Validate Enrolled Course for Students in Student Group</span>
                                            <p className={subTextStyle}>The Course will be validated for every Student from the enrolled Courses in Program Enrollment.</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.make_academic_term_mandatory === 1}
                                            onChange={e => updateField('make_academic_term_mandatory', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Make Academic Term Mandatory</span>
                                            <p className={subTextStyle}>If enabled, field Academic Term will be Mandatory in Program Enrollment Tool.</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer border-t border-gray-50 pt-4">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.skip_user_creation_for_new_student === 1}
                                            onChange={e => updateField('skip_user_creation_for_new_student', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Skip User creation for new Student</span>
                                            <p className={subTextStyle}>By default, a new User is created for every new Student.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={SECTION_CLASSES}>
                            <h2 className={SEC_HEADER}>Accounting</h2>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.create_sales_order_instead_of_sales_invoice === 1}
                                            onChange={e => updateField('create_sales_order_instead_of_sales_invoice', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Create Sales Order instead of Sales Invoice</span>
                                            <p className={subTextStyle}>By default, Sales Invoice will be created against Program Enrollment / Fee Schedule. If enabled Sales Order will be created</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.sales_invoice_posting_date_same_as_fee_schedule_date === 1}
                                            onChange={e => updateField('sales_invoice_posting_date_same_as_fee_schedule_date', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>
                                                {formData.create_sales_order_instead_of_sales_invoice === 1 ? 'Sales Order' : 'Sales Invoice'} Posting Date should be same as Fee Schedule Posting Date
                                            </span>
                                            <p className={subTextStyle}>
                                                By default, the {formData.create_sales_order_instead_of_sales_invoice === 1 ? "Sales Order's" : "Sales Invoice's"} Transaction Date will be equal to Fee Schedule's Transaction Date.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900" 
                                            checked={formData.submit_sales_invoice_from_program_enrollment === 1}
                                            onChange={e => updateField('submit_sales_invoice_from_program_enrollment', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>
                                                Submit {formData.create_sales_order_instead_of_sales_invoice === 1 ? 'Sales Order' : 'Sales Invoice'} from Program Enrollment / Fee Schedule
                                            </span>
                                            <p className={subTextStyle}>
                                                If enabled, the {formData.create_sales_order_instead_of_sales_invoice === 1 ? 'Sales Order' : 'Sales Invoice'} will be submitted once created.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={SECTION_CLASSES}>
                            <h2 className={SEC_HEADER}>Instructor Settings</h2>
                            <div className="w-1/2 pr-6">
                                <label className={labelStyle}>Instructor Records to be created by</label>
                                <select className={inputStyle} value={formData.instructor_naming_by} onChange={e => updateField('instructor_naming_by', e.target.value)}>
                                    <option value="Naming Series">Naming Series</option>
                                    <option value="Full Name">Full Name</option>
                                    <option value="Employee ID">Employee ID</option>
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={SECTION_CLASSES}>
                            <h2 className={SEC_HEADER}>Portal Settings</h2>
                            <div className="grid grid-cols-2 gap-12">
                                {/* Left Column: Methodology & Payment */}
                                <div className="space-y-8">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input type="checkbox" className="w-4 h-4 mt-1 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                            checked={formData.attendance_based_on_course_schedule === 1}
                                            onChange={e => updateField('attendance_based_on_course_schedule', e.target.checked ? 1 : 0)} />
                                        <div>
                                            <span className={checkboxLabelStyle}>Attendance Based on Course Schedule</span>
                                            <p className={subTextStyle}>If enabled, the attendance will be marked on Course Schedule basis and will be mandatory. If disabled, the attendance will be marked on Student Group Basis for that particular date.</p>
                                        </div>
                                    </label>

                                    <div className="space-y-4 pt-2">
                                        <div>
                                            <label className={labelStyle}>Razorpay Key</label>
                                            <input type="text" className={inputStyle} value={formData.razorpay_key} onChange={e => updateField('razorpay_key', e.target.value)} placeholder="administrator" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className={labelStyle}>Razorpay Secret</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Strong</span>
                                                    <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="w-3/4 h-full bg-blue-500"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <input type={showSecret ? "text" : "password"} className={inputStyle} value={formData.razorpay_secret} onChange={e => updateField('razorpay_secret', e.target.value)} placeholder="••••••••••••" />
                                                <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showSecret ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            <p className={subTextStyle}>Include symbols, numbers and capital letters in the password</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Branding */}
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelStyle}>School / College Name Abbreviation</label>
                                        <input type="text" className={inputStyle} value={formData.school_college_name_abbreviation} onChange={e => updateField('school_college_name_abbreviation', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>School / College Logo</label>
                                        <div className="flex items-center">
                                            <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors">Attach</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
