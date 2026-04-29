import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiFileText, FiBarChart2, FiClock, FiSearch, FiLayers, FiPrinter, FiArrowRight } from 'react-icons/fi';
import { Input, Tag, Empty } from 'antd';

const reportSections = [
    {
        title: "Transport Detail",
        icon: <FiLayers className="w-5 h-5 text-blue-600" />,
        color: "bg-blue-50",
        items: [
            { label: "Pickup Route Wise Student List", path: "/transport/reports/pickup-route-students" },
            { label: "Drop Route Wise Student List", path: "/transport/reports/drop-route-students" },
            { label: "Pickup Point Wise Students List", path: "/transport/reports/pickup-point-students" },
            { label: "Drop Point Wise Students List", path: "/transport/reports/drop-point-students" },
            { label: "Student Route Wise Transport Balance", path: "/transport/reports/student-route-balance" },
            { label: "Student Transport Balance Summary", path: "/transport/reports/student-balance-summary" },
            { label: "Point Wise Fee Structure", path: "/transport/reports/point-fee-structure" },
            { label: "Route Schedule", path: "/transport/reports/route-schedule" }
        ]
    },
    {
        title: "Transport Count",
        icon: <FiBarChart2 className="w-5 h-5 text-green-600" />,
        color: "bg-green-50",
        items: [
            { label: "Route Wise Students Count", path: "/transport/reports/route-student-count" },
            { label: "Pickup & Drop Point Wise Student Count", path: "/transport/reports/point-student-count" },
            { label: "Range Wise Student Count", path: "/transport/reports/range-student-count" }
        ]
    },
    {
        title: "Transport Schedule List",
        icon: <FiClock className="w-5 h-5 text-purple-600" />,
        color: "bg-purple-50",
        items: [
            { label: "Student Schedule Transport Allocation", path: "/transport/reports/schedule-allocation" },
            { label: "Student Schedule Transport Withdraw", path: "/transport/reports/schedule-withdraw" }
        ]
    }
];

export default function NewTransportReport() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSections = reportSections.map(section => ({
        ...section,
        items: section.items.filter(item => 
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => section.items.length > 0);

    return (
        <div className="p-8 max-w-7xl mx-auto pb-40">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        <span>Home</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span>Transport</span>
                        <FiChevronRight className="w-3 h-3" />
                        <span className="text-blue-600">New Transport Report</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                        Transport <span className="text-blue-600">Report</span> Hub
                    </h1>
                    <p className="text-gray-500 text-lg font-medium mt-3 leading-relaxed max-w-2xl">
                        A comprehensive directory of all transportation reports and analytics for your school.
                    </p>
                </div>

                <div className="w-full md:w-96">
                    <Input
                        prefix={<FiSearch className="text-gray-400 mr-2" />}
                        placeholder="Search reports by name..."
                        className="h-14 rounded-2xl border-gray-200 shadow-sm text-base font-medium"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                    />
                </div>
            </div>

            {/* Quick Actions Tabs (From User Screenshot) */}
            <div className="flex gap-4 mb-10 border-b border-gray-100 pb-4">
                <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all">
                    General Reports
                </button>
                <button className="px-6 py-2 bg-white text-gray-400 font-bold rounded-full text-xs uppercase tracking-widest border border-gray-100 hover:border-blue-200 hover:text-blue-600 transition-all">
                    Custom Reports
                </button>
            </div>

            {/* Hub Content */}
            {filteredSections.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {filteredSections.map((section, sIndex) => (
                        <div key={sIndex} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-black/[0.02] overflow-hidden flex flex-col h-full group transition-all duration-500 hover:shadow-2xl hover:shadow-black/[0.05]">
                            {/* Card Header */}
                            <div className={`p-8 ${section.color} flex items-center justify-between`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        {section.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">{section.title}</h2>
                                        <Tag className="m-0 mt-1 border-none bg-white text-[10px] font-black uppercase text-gray-400">
                                            {section.items.length} Reports
                                        </Tag>
                                    </div>
                                </div>
                                <FiPrinter className="text-gray-300 w-5 h-5 cursor-pointer hover:text-blue-600 transition-colors" title="Print Section" />
                            </div>

                            {/* Link List */}
                            <div className="p-4 flex-1">
                                <div className="space-y-1">
                                    {section.items.map((item, iIndex) => (
                                        <div 
                                            key={iIndex}
                                            onClick={() => navigate(item.path)}
                                            className="group/item flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-gray-200 group-hover/item:bg-blue-600 transition-colors" />
                                                <span className="text-[14px] font-bold text-gray-600 group-hover/item:text-gray-900 transition-colors leading-tight">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center opacity-0 group-hover/item:opacity-100 group-hover/item:bg-white group-hover/item:shadow-sm transition-all">
                                                <FiArrowRight className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-20 flex flex-col items-center border border-dashed border-gray-200">
                    <Empty 
                        description={
                            <span className="text-gray-400 font-bold text-lg">No reports found matching your search.</span>
                        }
                    />
                </div>
            )}

            {/* Footer Tip */}
            <div className="mt-20 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <FiPrinter className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Global Print Support</h4>
                        <p className="text-xs text-gray-500 font-medium">All reports support PDF and Excel export by default.</p>
                    </div>
                </div>
                <button className="px-8 py-3 bg-white text-gray-600 font-bold rounded-2xl border border-gray-200 hover:border-blue-600 hover:text-blue-600 transition-all whitespace-nowrap">
                    View Print Queue
                </button>
            </div>
            
            <div className="mt-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                Powered by : Microweb Solutions ®
            </div>
        </div>
    );
}
