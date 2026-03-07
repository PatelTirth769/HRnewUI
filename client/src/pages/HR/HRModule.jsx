import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';

export default function HRModule() {
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    // Admin sees all sections; Employee sees limited sections
    const adminSections = [
        {
            title: 'Setup',
            items: [
                { label: 'Company', path: '/companies' },
                { label: 'Department', path: '/master/departments' },
                { label: 'Designation', path: '/master/designations' },
            ],
        },
        {
            title: 'Employee',
            items: [
                { label: 'Employee', path: '/employee-master' },
                { label: 'Employee Grade', path: '/master/employee-grade' },
            ],
        },
        {
            title: 'Leaves',
            items: [
                { label: 'Leave Application', path: '/talv/leave-application' },
            ],
        },
        {
            title: 'Settings',
            items: [
                { label: 'HR Settings', path: '/master/hr-settings' },
            ],
        },
        {
            title: 'Attendance',
            items: [
                { label: 'Attendance', path: '/talv/attendance-dashboard' },
                { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
            ],
        },
        {
            title: 'Key Reports',
            items: [
                { label: 'Employee Leave Balance', path: '/talv/employee-leave-balance' },
                { label: 'Recruitment Analytics', path: '/recruitment/recruitment-analytics' },
            ],
        },
    ];

    const employeeSections = [
        {
            title: 'Setup',
            items: [
                { label: 'Department', path: '/master/departments' },
                { label: 'Designation', path: '/master/designations' },
            ],
        },
        {
            title: 'Employee',
            items: [
                { label: 'Employee', path: '/employee-master' },
                { label: 'Employee Grade', path: '/master/employee-grade' },
            ],
        },
        {
            title: 'Leaves',
            items: [
                { label: 'Leave Application', path: '/talv/leave-application' },
                { label: 'Compensatory Leave Request', path: '/talv/compensatory-leave-request' },
            ],
        },
        {
            title: 'Attendance',
            items: [
                { label: 'Attendance', path: '/talv/attendance-dashboard' },
                { label: 'Attendance Request', path: '/talv/attendance-control' },
                { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
            ],
        },
    ];

    const sections = isAdmin ? adminSections : employeeSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">HR Module</h1>
                    <p className="text-sm text-gray-500 mt-1">Reports &amp; Masters</p>
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-3 gap-x-20 gap-y-14">
                    {sections.map((section) => (
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
            </div>
        </div>
    );
}
