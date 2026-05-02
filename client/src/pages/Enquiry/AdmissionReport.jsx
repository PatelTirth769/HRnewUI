import React, { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notification, Spin, Table, Tag } from 'antd';
import { FiBarChart2, FiUsers, FiRepeat } from 'react-icons/fi';

const ADMISSIONS_PATH = 'schooler_system/enquiry_management/final_admissions';
const ENQUIRIES_PATH = 'schooler_system/enquiry_management/enquiries';
const REGISTRATIONS_PATH = 'schooler_system/enquiry_management/registrations';

export default function AdmissionReport() {
    const [admissions, setAdmissions] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState('');
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        academicYear: 'All selected',
        enquiryClass: 'All selected',
        admissionSource: 'All selected',
        employeeName: 'All selected'
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [admSnap, enqSnap, regSnap] = await Promise.all([
                getDocs(query(collection(db, ADMISSIONS_PATH), orderBy('created_at', 'desc'))),
                getDocs(collection(db, ENQUIRIES_PATH)),
                getDocs(collection(db, REGISTRATIONS_PATH))
            ]);
            
            setAdmissions(admSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setEnquiries(enqSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setRegistrations(regSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
            notification.error({ message: 'Data Fetch Failed' });
        } finally {
            setLoading(false);
        }
    };

    // Conversion Logic for Conversation Report
    const conversationData = useMemo(() => {
        if (criteria !== 'ADMISSION CONVERSATION REPORT') return [];
        
        // Group by class/year
        const stats = {};
        enquiries.forEach(e => {
            const key = `${e.class}-${e.academicYear}`;
            if (!stats[key]) stats[key] = { class: e.class, year: e.academicYear, enq: 0, inProg: 0, reg: 0, adm: 0 };
            stats[key].enq++;
            if (e.status === 'Open') stats[key].inProg++;
        });

        registrations.forEach(r => {
            const key = `${r.class}-${r.academicYear}`;
            if (stats[key]) stats[key].reg++;
        });

        admissions.forEach(a => {
            const key = `${a.admissionClass}-${a.academicYear}`;
            if (stats[key]) stats[key].adm++;
        });

        return Object.values(stats);
    }, [enquiries, registrations, admissions, criteria]);

    const filteredAdmissions = useMemo(() => {
        if (!criteria || criteria.includes('CONVERSATION')) return [];
        return admissions.filter(d => {
            const matchesYear = filters.academicYear === 'All selected' || d.academicYear === filters.academicYear;
            const matchesClass = filters.enquiryClass === 'All selected' || d.admissionClass === filters.enquiryClass;
            const matchesSource = filters.admissionSource === 'All selected' || d.sourceOfEnquiry === filters.admissionSource;
            
            let matchesDate = true;
            if (filters.fromDate && filters.toDate && criteria.includes('DATE WISE')) {
                const admDate = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
                const from = new Date(filters.fromDate);
                const to = new Date(filters.toDate);
                matchesDate = admDate >= from && admDate <= to;
            }

            return matchesYear && matchesClass && matchesSource && matchesDate;
        });
    }, [admissions, filters, criteria]);

    const columns = criteria === 'ADMISSION CONVERSATION REPORT' ? [
        { title: 'Class', dataIndex: 'class', key: 'class' },
        { title: 'Academic Year', dataIndex: 'year', key: 'year' },
        { title: 'Total Enquiry', dataIndex: 'enq', key: 'enq' },
        { title: 'InProgress Enquiry Count', dataIndex: 'inProg', key: 'inProg' },
        { title: 'Total Registration', dataIndex: 'reg', key: 'reg' },
        { title: 'Total Admission', dataIndex: 'adm', key: 'adm' }
    ] : [
        { title: 'ERP Entry Date', dataIndex: 'created_at', key: 'date', render: (val) => val?.toDate ? val.toDate().toLocaleDateString() : new Date(val).toLocaleDateString() },
        { title: 'Student Name', render: (_, r) => `${r.firstName} ${r.lastName}`, key: 'name' },
        { title: 'Admission Class', render: (_, r) => r.admissionClass || r.class, key: 'class' },
        { title: 'Academic Year', dataIndex: 'academicYear', key: 'year' },
        { title: 'Admission Source', render: (_, r) => r.sourceOfEnquiry || r.source, key: 'source' },
        { title: 'Admission Fees', render: (_, r) => `₹${r.feeAmount || r.admissionFee || 0} (${(r.isFeePaid || r.isAdmissionFeePaid) ? 'PAID' : 'UNPAID'})`, key: 'fee' },

        { title: 'Status', render: () => <Tag color="green">ADMITTED</Tag> }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admission Report</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Report</span> / <span className="text-blue-600 font-bold">Admission Report</span>
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
                            <option>DATE WISE ADMISSION REPORT</option>
                            <option>DATE WISE USER WISE ADMISSION REPORT</option>
                            <option>ACADEMIC YEAR WISE ADMISSION REPORT</option>
                            <option>ADMISSION CONVERSATION REPORT</option>
                            <option>ADMISSION CLASS CHANGE REPORT</option>
                        </select>
                    </div>

                    {criteria && !criteria.includes('CONVERSATION') && !criteria.includes('CHANGE') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 border-t border-gray-50">
                            {criteria.includes('DATE WISE') && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">ERP Entry Date From <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">ERP Entry Date To <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                </>
                            )}
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Academic Year <span className="text-red-500">*</span></label>
                                <select value={filters.academicYear} onChange={(e) => setFilters({...filters, academicYear: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    <option>2024-2025</option>
                                    <option>2025-2026</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Class <span className="text-red-500">*</span></label>
                                <select value={filters.enquiryClass} onChange={(e) => setFilters({...filters, enquiryClass: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    <option>Nursery</option>
                                    <option>LKG</option>
                                    <option>UKG</option>
                                    {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>


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

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Admission Source <span className="text-red-500">*</span></label>
                                <select value={filters.admissionSource} onChange={(e) => setFilters({...filters, admissionSource: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    <option>Walk-in</option>
                                    <option>Online</option>
                                    <option>Reference</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                        <button className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">View</button>
                        <button className="px-8 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all">Reset</button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={criteria === 'ADMISSION CONVERSATION REPORT' ? conversationData : filteredAdmissions} 
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </div>
        </div>
    );
}
