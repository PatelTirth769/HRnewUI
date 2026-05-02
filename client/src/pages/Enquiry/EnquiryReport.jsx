import React, { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notification, Spin, Table, Tag } from 'antd';
import { FiSearch, FiRefreshCw, FiDownload, FiFileText } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ENQUIRIES_PATH = 'schooler_system/enquiry_management/enquiries';

export default function EnquiryReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState('');
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        academicYear: 'All selected',
        enquiryClass: 'All selected',
        enquiryStatus: 'All selected',
        enquirySource: 'All selected',
        employeeName: 'All selected'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, ENQUIRIES_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Fetch Failed' });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!criteria) return [];
        return data.filter(d => {
            const matchesYear = filters.academicYear === 'All selected' || d.academicYear === filters.academicYear;
            const matchesClass = filters.enquiryClass === 'All selected' || d.class === filters.enquiryClass;
            const matchesStatus = filters.enquiryStatus === 'All selected' || d.status === filters.enquiryStatus;
            const matchesSource = filters.enquirySource === 'All selected' || d.sourceOfEnquiry === filters.enquirySource;
            
            let matchesDate = true;
            if (filters.fromDate && filters.toDate && (criteria.includes('DATE WISE'))) {
                const enqDate = new Date(d.enquiryDate);
                const from = new Date(filters.fromDate);
                const to = new Date(filters.toDate);
                matchesDate = enqDate >= from && enqDate <= to;
            }

            return matchesYear && matchesClass && matchesStatus && matchesSource && matchesDate;
        });
    }, [data, filters, criteria]);

    const handleReset = () => {
        setFilters({
            fromDate: '',
            toDate: '',
            academicYear: 'All selected',
            enquiryClass: 'All selected',
            enquiryStatus: 'All selected',
            enquirySource: 'All selected',
            employeeName: 'All selected'
        });
        setCriteria('');
    };

    const columns = [
        { title: 'Date', dataIndex: 'enquiryDate', key: 'date' },
        { title: 'Student Name', render: (_, r) => `${r.firstName} ${r.lastName}`, key: 'name' },
        { title: 'Class', dataIndex: 'class', key: 'class' },
        { title: 'Mobile', dataIndex: 'smsNumber1', key: 'mobile' },
        { title: 'Source', dataIndex: 'sourceOfEnquiry', key: 'source' },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Open' ? 'blue' : status === 'Converted' ? 'green' : 'gray'}>
                    {status}
                </Tag>
            )
        }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Enquiry Report</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Report</span> / <span className="text-blue-600 font-bold">Enquiry Report</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Report Criteria <span className="text-red-500">*</span></label>
                        <select 
                            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white transition-all w-full"
                            value={criteria}
                            onChange={(e) => setCriteria(e.target.value)}
                        >
                            <option value="">Select Report Criteria</option>
                            <option>DATE WISE ENQUIRY REPORT</option>
                            <option>DATE WISE USER WISE ENQUIRY REPORT</option>
                            <option>SESSION WISE ENQUIRY REPORT</option>
                            <option>ACADEMIC YEAR WISE ENQUIRY REPORT</option>
                            <option>SESSION CLASS WISE ENQUIRY REPORT</option>
                            <option>DATE WISE CLASS WISE ENQUIRY COUNT REPORT</option>
                        </select>
                    </div>

                    {criteria && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 border-t border-gray-50">
                            {/* Date Fields - Only for DATE WISE reports */}
                            {(criteria.includes('DATE WISE')) && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Date From <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Date To <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                </>
                            )}
                            
                            {/* Academic Year - Always visible except where specified otherwise (though it seems common to all) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Academic Year <span className="text-red-500">*</span></label>
                                <select value={filters.academicYear} onChange={(e) => setFilters({...filters, academicYear: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    <option>2024-2025</option>
                                    <option>2025-2026</option>
                                </select>
                            </div>

                            {/* Enquiry Class - Hidden for Count Report */}
                            {criteria !== 'DATE WISE CLASS WISE ENQUIRY COUNT REPORT' && (
                                <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Class <span className="text-red-500">*</span></label>
                                <select value={filters.enquiryClass} onChange={(e) => setFilters({...filters, enquiryClass: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    <option>Nursery</option>
                                    <option>LKG</option>
                                    <option>UKG</option>
                                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            )}

                            {/* Enquiry Status - Hidden for Session/Class Wise and Count Reports */}
                            {!criteria.includes('SESSION') && criteria !== 'DATE WISE CLASS WISE ENQUIRY COUNT REPORT' && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Status <span className="text-red-500">*</span></label>
                                    <select value={filters.enquiryStatus} onChange={(e) => setFilters({...filters, enquiryStatus: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                        <option>All selected</option>
                                        <option>Open</option>
                                        <option>Converted</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                            )}

                            {/* Enquiry Source - Hidden for Count Report */}
                            {criteria !== 'DATE WISE CLASS WISE ENQUIRY COUNT REPORT' && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Source <span className="text-red-500">*</span></label>
                                    <select value={filters.enquirySource} onChange={(e) => setFilters({...filters, enquirySource: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                        <option>All selected</option>
                                        <option>Walk-in</option>
                                        <option>Online</option>
                                        <option>Newspaper</option>
                                    </select>
                                </div>
                            )}

                            {/* Employee Name - Only for User Wise */}
                            {criteria.includes('USER WISE') && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Employee Name <span className="text-red-500">*</span></label>
                                    <select value={filters.employeeName} onChange={(e) => setFilters({...filters, employeeName: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                        <option>All selected</option>
                                        <option>Admin</option>
                                        <option>Counselor 1</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">View</button>
                        <button onClick={handleReset} className="px-8 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">Reset</button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={filteredData} 
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    className="custom-table"
                />
            </div>
        </div>
    );
}
