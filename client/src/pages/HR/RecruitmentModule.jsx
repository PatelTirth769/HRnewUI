import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';

export default function RecruitmentModule() {
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    const adminSections = [
        {
            title: 'Jobs',
            items: [
                { label: 'Staffing Plan', path: '/recruitment/staffing-plan' },
                { label: 'Job Requisition', path: '/recruitment/job-requisition' },
                { label: 'Job Opening', path: '/recruitment/job-opening' },
                { label: 'Job Applicant', path: '/recruitment/job-applicant' },
                { label: 'Job Offer', path: '/recruitment/job-offer' },
                { label: 'Employee Referral', path: '/recruitment/employee-referral' },
                { label: 'Upload Resume', path: '/talv/upload-resume' },
                { label: 'Resume Database', path: '/talv/resume-database' },
            ],
        },
        {
            title: 'Interviews',
            items: [
                { label: 'Interview Type', path: '/recruitment/interview-type' },
                { label: 'Interview Round', path: '/recruitment/interview-round' },
                { label: 'Interview', path: '/recruitment/interview' },
                { label: 'Interview Feedback', path: '/recruitment/interview-feedback' },
            ],
        },
        {
            title: 'Appointment',
            items: [
                { label: 'Appointment Letter Template', path: '/recruitment/appointment-letter-template' },
                { label: 'Appointment Letter', path: '/recruitment/appointment-letter' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Recruitment Dashboard', path: '/recruitment-dashboard' },
                { label: 'Recruitment Analytics', path: '/recruitment/recruitment-analytics' },
            ],
        },
    ];

    const employeeSections = [
        {
            title: 'Dashboards',
            items: [
                { label: 'Recruitment Dashboard', path: '/recruitment-dashboard' },
            ],
        },
        {
            title: 'Jobs',
            items: [
                { label: 'Job Opening', path: '/recruitment/job-opening' },
                { label: 'Employee Referral', path: '/recruitment/employee-referral' },
            ],
        },
    ];

    const sections = isAdmin ? adminSections : employeeSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Recruitment Module</h1>
                    <p className="text-sm text-gray-500 mt-1">Jobs, Interviews &amp; Appointments</p>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-3 gap-x-20 gap-y-14">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h2 className="text-[13px] font-semibold text-gray-900 pb-2 mb-4 border-b border-gray-200">{section.title}</h2>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-2 group cursor-pointer py-0.5"
                                        onClick={() => item.path && navigate(item.path)}
                                    >
                                        <span className={`text-[14px] transition-colors duration-150 ${item.path ? 'text-gray-700 group-hover:text-blue-600' : 'text-gray-400'}`}>
                                            {item.label}
                                        </span>
                                        {item.path && (
                                            <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 7H7M17 7v10" />
                                            </svg>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
