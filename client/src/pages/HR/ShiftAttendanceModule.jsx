import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../hooks/useUserRole';

export default function ShiftAttendanceModule() {
    const navigate = useNavigate();
    const { isAdmin } = useUserRole();

    const adminSections = [
        {
            title: 'Shifts',
            items: [
                { label: 'Shift Type', path: '/talv/shift-master' },
                { label: 'Shift Assignment', path: '/talv/shift-planning-upload' },
            ],
        },
        {
            title: 'Attendance',
            items: [
                { label: 'Attendance', path: '/talv/attendance-dashboard' },
                { label: 'Employee Checkin', path: '/talv/attendance-reports/shift-punch-register' },
                { label: 'Upload Attendance', path: '/talv/capture-attendance/import-attendance' },
            ],
        },
        {
            title: 'Reports',
            items: [
                { label: 'Monthly Attendance Sheet', path: '/talv/attendance-reports/attendance-register' },
            ],
        },
    ];

    const employeeSections = [
        {
            title: 'Shifts',
            items: [
                { label: 'Shift Request', path: '/talv/attendance-dashboard' },
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
        {
            title: 'Reports',
            items: [
                { label: 'Shift Attendance', path: '/talv/attendance-reports/shift-punch-register' },
                { label: 'Project Profitability', path: '/talv/attendance-reports/headcount-occupancy-report' },
            ],
        },
    ];

    const sections = isAdmin ? adminSections : employeeSections;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-8 py-10">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Shift & Attendance Module</h1>
                    <p className="text-[17px] font-semibold text-gray-700 mt-4">Masters & Reports</p>
                </div>

                {/* Sections Grid Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-20 gap-y-14 mb-14">
                    {sections.filter(s => s.title !== 'Reports').map((section) => (
                        <div key={section.title}>
                            <h2 className="text-[15px] font-bold text-gray-800 pb-2 mb-4">{section.title}</h2>
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

                {/* Reports Section */}
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
            </div>
        </div>
    );
}
