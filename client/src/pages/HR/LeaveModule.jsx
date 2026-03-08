import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';

export default function LeaveModule() {
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    const adminSections = [
        {
            title: 'Setup',
            items: [
                { label: 'Holiday List', path: '/master/holiday-master' },
                { label: 'Leave Policy', path: '/talv/leave-policy-config' },
            ],
        },
        {
            title: 'Allocation',
            items: [
                { label: 'Leave Allocation', path: '/talv/employee-leave-master' },
            ],
        },
        {
            title: 'Application',
            items: [
                { label: 'Leave Application', path: '/talv/leave-application' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
            ],
        },
    ];

    const employeeSections = [
        {
            title: 'Setup',
            items: [
                { label: 'Holiday List', path: '/master/holiday-master' },
                { label: 'Leave Type', path: '/talv/leave-type' },
            ],
        },
        {
            title: 'Application',
            items: [
                { label: 'Leave Application', path: '/talv/leave-application' },
                { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
            ],
        },
    ];

    const sections = isAdmin ? adminSections : employeeSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Leave Module</h1>
                    <p className="text-sm text-gray-500 mt-1">Masters &amp; Reports</p>
                </div>

                {/* Sections Grid Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-20 gap-y-14 mb-14">
                    {sections.filter(s => s.title !== 'Reports').map((section) => (
                        <div key={section.title}>
                            <h2 className="text-[10px] font-semibold text-gray-900 pb-2 mb-4 border-b border-gray-200">{section.title}</h2>
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

                {/* Reports Section - only for admin */}
                {sections.find(s => s.title === 'Reports') && (
                    <div className="border-t border-gray-100 pt-10">
                        <h2 className="text-[16px] font-bold text-gray-800 pb-2 mb-4">Reports</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-20 gap-y-3">
                            {sections.find(s => s.title === 'Reports')?.items.map((item) => (
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
                )}
            </div>
        </div>
    );
}
