import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';

export default function PerformanceModule() {
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    const adminSections = [
        {
            title: 'Master',
            items: [
                { label: 'Appraisal Template', path: '/performance/appraisal-template' },
                { label: 'KRA', path: '/performance/kra' },
                { label: 'Employee Feedback Criteria', path: '/performance/employee-feedback-criteria' },
            ],
        },
        {
            title: 'Appraisal',
            items: [
                { label: 'Appraisal', path: '/performance/appraisal' },
                { label: 'Appraisal Cycle', path: '/performance/appraisal-cycle' },
                { label: 'Employee Performance Feedback', path: '/performance/employee-performance-feedback' },
                { label: 'Employee Performance Feedback by HR', path: '/performance/employee-performance-feedback-by-hr' },
                { label: 'Goal', path: '/performance/goal' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Appraisal Overview', path: '/performance/appraisal-overview' },
                { label: 'Training Needs Identification', path: '/performance/training-needs-identification' },
            ],
        },
    ];

    const employeeSections = [
        {
            title: 'Master',
            items: [
                { label: 'Appraisal Template', path: '/performance/appraisal-template' },
            ],
        },
        {
            title: 'Appraisal',
            items: [
                { label: 'Appraisal', path: '/performance/appraisal' },
                { label: 'Appraisal Cycle', path: '/performance/appraisal-cycle' },
                { label: 'Employee Performance Feedback', path: '/performance/employee-performance-feedback' },
                { label: 'Employee Performance Feedback by HR', path: '/performance/employee-performance-feedback-by-hr' },
                { label: 'Goal', path: '/performance/goal' },
            ],
        },
        {
            title: 'Energy Points',
            items: [
                { label: 'Energy Point Log', path: '/performance/energy-point-log' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Appraisal Overview', path: '/performance/appraisal-overview' },
            ],
        },
    ];

    const sections = isAdmin ? adminSections : employeeSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Performance Module</h1>
                    <p className="text-sm text-gray-500 mt-1">{isAdmin ? 'Appraisals, Goals & Reports' : 'Masters & Transactions'}</p>
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
