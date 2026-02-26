import React, { useState, useEffect } from 'react';
import { notification } from 'antd';
import API from '../../services/api';

const SECTION_CLASSES = "mb-8 bg-white border border-gray-100 rounded-md p-6 shadow-sm";
const SEC_HEADER = "text-lg font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2";

export default function HRSettings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial state matching standard ERPNext HR Settings fields
    const defaultData = {
        emp_created_by: 'Naming Series',
        retirement_age: 58,
        standard_working_hours: 9.000,

        work_anniversaries: 1,
        birthdays: 1,
        holidays: 1,
        remind_holidays_on: 'Weekly',
        sender: '',

        send_leave_notification: 1,
        leave_approval_notification_template: 'Leave Approval Notification',
        leave_status_notification_template: 'Leave Status Notification',
        leave_approver_mandatory_in_leave_application: 1,
        restrict_backdated_leave_application: 0,
        expense_approver_mandatory_in_expense_claim: 1,
        show_leaves_of_all_department_members_in_calendar: 0,
        auto_leave_encashment: 0,

        allow_multiple_shift_assignments: 0,

        check_vacancies: 0,
        send_interview_reminder: 0,
        send_interview_feedback_reminder: 0,
        interview_sender: '',

        exit_questionnaire_web_form: '',
        exit_questionnaire_notification_template: '',

        allow_employee_checkin_from_mobile_app: 1,
        allow_geolocation_tracking: 1,

        unlink_payment_on_cancellation_of_employee_advance: 0
    };

    const [formData, setFormData] = useState({ ...defaultData });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await API.post('/api/method/frappe.desk.form.load.getdoc', {
                doctype: 'HR Settings',
                name: 'HR Settings'
            });
            const doc = res.data?.docs?.[0] || res.data?.message?.docs?.[0];
            if (doc) {
                // Merge doc with defaultData to ensure all fields exist
                setFormData(prev => ({ ...prev, ...doc }));
            }
        } catch (err) {
            console.error('Failed to load HR Settings', err);
            notification.error({ message: 'Failed to load HR Settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                doc: {
                    doctype: 'HR Settings',
                    name: 'HR Settings',
                    ...formData
                },
                action: 'Save'
            };
            await API.post('/api/method/frappe.desk.form.save.savedocs', payload);
            notification.success({ message: 'HR Settings Saved Successfully' });
        } catch (err) {
            console.error('Failed to save HR Settings', err);
            notification.error({ message: 'Failed to save HR Settings' });
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">HR Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 transition disabled:opacity-70 flex items-center gap-2"
                >
                    {saving && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
                    Save
                </button>
            </div>

            <div className="space-y-6">

                {/* Employee Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Employee Settings</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Employee Naming By</label>
                            <select
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                value={formData.emp_created_by || ''}
                                onChange={(e) => updateField('emp_created_by', e.target.value)}
                            >
                                <option value="Naming Series">Naming Series</option>
                                <option value="Employee Number">Employee Number</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Employee records are created using the selected option</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Retirement Age (In Years)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.retirement_age || ''}
                                onChange={(e) => updateField('retirement_age', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Standard Working Hours</label>
                            <input
                                type="number"
                                step="0.001"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.standard_working_hours || ''}
                                onChange={(e) => updateField('standard_working_hours', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Reminders */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Reminders</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.work_anniversaries === 1} onChange={(e) => updateField('work_anniversaries', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Work Anniversaries</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.birthdays === 1} onChange={(e) => updateField('birthdays', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Birthdays</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.holidays === 1} onChange={(e) => updateField('holidays', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Holidays</span>
                            </label>

                            <div className="mt-4">
                                <label className="block text-sm text-gray-600 mb-1">Set the frequency for holiday reminders <span className="text-red-400">*</span></label>
                                <select
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
                                    value={formData.remind_holidays_on || ''}
                                    onChange={(e) => updateField('remind_holidays_on', e.target.value)}
                                >
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Daily">Daily</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Sender</label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.sender || ''}
                                onChange={(e) => updateField('sender', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Leave and Expense Claim Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Leave and Expense Claim Settings</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.send_leave_notification === 1} onChange={(e) => updateField('send_leave_notification', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700 font-medium">Send Leave Notification</span>
                            </label>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Leave Approval Notification Template <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                    value={formData.leave_approval_notification_template || ''}
                                    onChange={(e) => updateField('leave_approval_notification_template', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Leave Status Notification Template <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                    value={formData.leave_status_notification_template || ''}
                                    onChange={(e) => updateField('leave_status_notification_template', e.target.value)}
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-2">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.leave_approver_mandatory_in_leave_application === 1} onChange={(e) => updateField('leave_approver_mandatory_in_leave_application', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700 font-medium">Leave Approver Mandatory In Leave Application</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.restrict_backdated_leave_application === 1} onChange={(e) => updateField('restrict_backdated_leave_application', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Restrict Backdated Leave Application</span>
                            </label>
                        </div>

                        <div className="space-y-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.expense_approver_mandatory_in_expense_claim === 1} onChange={(e) => updateField('expense_approver_mandatory_in_expense_claim', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700 font-medium">Expense Approver Mandatory In Expense Claim</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.show_leaves_of_all_department_members_in_calendar === 1} onChange={(e) => updateField('show_leaves_of_all_department_members_in_calendar', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Show Leaves Of All Department Members In Calendar</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.auto_leave_encashment === 1} onChange={(e) => updateField('auto_leave_encashment', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Auto Leave Encashment</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Shift Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Shift Settings</h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            checked={formData.allow_multiple_shift_assignments === 1} onChange={(e) => updateField('allow_multiple_shift_assignments', e.target.checked ? 1 : 0)} />
                        <span className="text-sm text-gray-700">Allow Multiple Shift Assignments for Same Date</span>
                    </label>
                </div>

                {/* Hiring Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Hiring Settings</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.check_vacancies === 1} onChange={(e) => updateField('check_vacancies', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Check Vacancies On Job Offer Creation</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.send_interview_reminder === 1} onChange={(e) => updateField('send_interview_reminder', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Send Interview Reminder</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                    checked={formData.send_interview_feedback_reminder === 1} onChange={(e) => updateField('send_interview_feedback_reminder', e.target.checked ? 1 : 0)} />
                                <span className="text-sm text-gray-700">Send Interview Feedback Reminder</span>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Sender</label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.interview_sender || ''}
                                onChange={(e) => updateField('interview_sender', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Employee Exit Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Employee Exit Settings</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Exit Questionnaire Web Form</label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.exit_questionnaire_web_form || ''}
                                onChange={(e) => updateField('exit_questionnaire_web_form', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Exit Questionnaire Notification Template</label>
                            <input
                                type="text"
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-blue-400"
                                value={formData.exit_questionnaire_notification_template || ''}
                                onChange={(e) => updateField('exit_questionnaire_notification_template', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Attendance Settings */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Attendance Settings</h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={formData.allow_employee_checkin_from_mobile_app === 1} onChange={(e) => updateField('allow_employee_checkin_from_mobile_app', e.target.checked ? 1 : 0)} />
                            <span className="text-sm text-gray-700 font-medium">Allow Employee Checkin from Mobile App</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                checked={formData.allow_geolocation_tracking === 1} onChange={(e) => updateField('allow_geolocation_tracking', e.target.checked ? 1 : 0)} />
                            <span className="text-sm text-gray-700 font-medium">Allow Geolocation Tracking</span>
                        </label>
                    </div>
                </div>

                {/* Unlink Payment */}
                <div className={SECTION_CLASSES}>
                    <h2 className={SEC_HEADER}>Unlink Payment</h2>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            checked={formData.unlink_payment_on_cancellation_of_employee_advance === 1} onChange={(e) => updateField('unlink_payment_on_cancellation_of_employee_advance', e.target.checked ? 1 : 0)} />
                        <span className="text-sm text-gray-700">Unlink Payment on Cancellation of Employee Advance</span>
                    </label>
                </div>

            </div>
        </div>
    );
}
