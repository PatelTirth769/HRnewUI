import React, { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import API from '../../services/api';
import { notification, Spin, Table, Tag } from 'antd';
import { FiSearch, FiRefreshCw, FiDownload } from 'react-icons/fi';

const REGISTRATIONS_PATH = 'schooler_system/enquiry_management/registrations';

export default function RegistrationReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState('');
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        academicYear: 'All selected',
        enquiryClass: 'All selected',
        registrationSource: 'All selected',
        employeeName: 'All selected'
    });
    const [academicYears, setAcademicYears] = useState([]);
    const [availablePrograms, setAvailablePrograms] = useState([]);

    useEffect(() => {
        fetchData();
        fetchERPNextData();
    }, []);

    const fetchERPNextData = async () => {
        try {
            const [progRes, yearRes] = await Promise.all([
                API.get('/api/resource/Program?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
                API.get('/api/resource/Academic Year?fields=["name"]&limit_page_length=None').catch(() => ({ data: { data: [] } })),
            ]);
            setAvailablePrograms(progRes.data.data?.map(p => p.name) || []);
            setAcademicYears(yearRes.data.data?.map(y => y.name) || []);
        } catch (err) {
            console.error('Error fetching ERPNext data:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, REGISTRATIONS_PATH), orderBy('created_at', 'desc'));
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
            const matchesYear = filters.academicYear === 'All selected' || d.academic_year === filters.academicYear;
            const matchesClass = filters.enquiryClass === 'All selected' || d.program === filters.enquiryClass;
            const matchesSource = filters.registrationSource === 'All selected' || d.source === filters.registrationSource;
            const matchesEmployee = filters.employeeName === 'All selected' || d.recordedBy === filters.employeeName;
            
            // Rejection logic (if report type is rejection)
            if (criteria.includes('REJECTION') && d.status !== 'Rejected') return false;
            if (!criteria.includes('REJECTION') && d.status === 'Rejected') return false;

            let matchesDate = true;
            if (filters.fromDate && filters.toDate && criteria.includes('DATE WISE')) {
                const regDate = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
                const from = new Date(filters.fromDate);
                const to = new Date(filters.toDate);
                matchesDate = regDate >= from && regDate <= to;
            }

            return matchesYear && matchesClass && matchesSource && matchesEmployee && matchesDate;
        });
    }, [data, filters, criteria]);

    const handleReset = () => {
        setFilters({
            fromDate: '',
            toDate: '',
            academicYear: 'All selected',
            enquiryClass: 'All selected',
            registrationSource: 'All selected',
            employeeName: 'All selected'
        });
        setCriteria('');
    };

    const columns = [
        { title: 'Reg. Date', dataIndex: 'created_at', key: 'date', render: (val) => val?.toDate ? val.toDate().toLocaleDateString() : new Date(val).toLocaleDateString() },
        { title: 'Student Name', render: (_, r) => `${r.first_name} ${r.last_name}`, key: 'name' },
        { title: 'Program', dataIndex: 'program', key: 'program' },
        { title: 'Receipt No', dataIndex: 'receiptNo', key: 'receipt' },
        { title: 'Amount', dataIndex: 'feeAmount', key: 'amount', render: (val, r) => `₹${val || 0} (${r.isFeePaid ? 'PAID' : 'UNPAID'})` },

        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Rejected' ? 'red' : 'green'}>
                    {status || 'Active'}
                </Tag>
            )
        },
        { title: 'Source', dataIndex: 'source', key: 'source' }
    ];

    return (
        <div className="p-6 max-w-[1400px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Registration Report</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Report</span> / <span className="text-blue-600 font-bold">Registration Report</span>
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
                            <option>DATE WISE REGISTRATION REPORT</option>
                            <option>DATE WISE USER WISE REGISTRATION REPORT</option>
                            <option>ACADEMIC YEAR WISE REGISTRATION REPORT</option>
                            <option>DATE WISE REGISTRATION REJECTION REPORT</option>
                            <option>ACADEMIC YEAR WISE REGISTRATION REJECTION REPORT</option>
                        </select>
                    </div>

                    {criteria && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 border-t border-gray-50">
                            {criteria.includes('DATE WISE') && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Registration Date From <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.fromDate} onChange={(e) => setFilters({...filters, fromDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Registration Date To <span className="text-red-500">*</span></label>
                                        <input type="date" value={filters.toDate} onChange={(e) => setFilters({...filters, toDate: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                </>
                            )}
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Academic Year <span className="text-red-500">*</span></label>
                                <select value={filters.academicYear} onChange={(e) => setFilters({...filters, academicYear: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    {academicYears.map(y => <option key={y}>{y}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Enquiry Program <span className="text-red-500">*</span></label>
                                <select value={filters.enquiryClass} onChange={(e) => setFilters({...filters, enquiryClass: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                                    <option>All selected</option>
                                    {availablePrograms.map(p => <option key={p}>{p}</option>)}
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
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Registration Source <span className="text-red-500">*</span></label>
                                <select value={filters.registrationSource} onChange={(e) => setFilters({...filters, registrationSource: e.target.value})} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
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
                        <button onClick={handleReset} className="px-8 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all">Reset</button>
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
                />
            </div>
        </div>
    );
}
