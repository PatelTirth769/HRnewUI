import React, { useEffect, useState } from 'react';
import { notification, Spin, DatePicker, Select } from 'antd';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSearch, FiDownload, FiRefreshCw, FiEye, FiMessageSquare } from 'react-icons/fi';
import dayjs from 'dayjs';

const ENQUIRIES_PATH = 'schooler_system/enquiry_management/enquiries';

export default function EnquiryFollowUpList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        academicYear: '2026-2027',
        fromDate: dayjs().subtract(1, 'month'),
        toDate: dayjs().add(1, 'month'),
        status: 'Interested'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const colRef = collection(db, ENQUIRIES_PATH);
            // In a real app, we'd use Firestore queries with where()
            // For now, we'll fetch and filter locally to keep it simple and avoid index issues
            const snapshot = await getDocs(colRef);
            const enquiries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Local Filtering
            const filtered = enquiries.filter(item => {
                const itemDate = dayjs(item.followUpDate || item.enquiryDate);
                const isWithinRange = itemDate.isAfter(filters.fromDate.subtract(1, 'day')) && 
                                   itemDate.isBefore(filters.toDate.add(1, 'day'));
                const matchesStatus = filters.status ? item.enquiryStatus === filters.status : true;
                const matchesYear = filters.academicYear ? item.academicYear === filters.academicYear : true;
                
                return isWithinRange && matchesStatus && matchesYear;
            });

            setData(filtered);
        } catch (err) {
            console.error('Fetch failed:', err);
            notification.error({ message: 'Error', description: 'Failed to fetch enquiries.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto pb-24 text-gray-800 font-inter">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Enquiry Follow Up's</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Enquiry</span> / <span className="text-blue-600 font-bold">Enquiry Follow Up's</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiDownload className="w-4 h-4" /> Export
                    </button>
                    <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700">Academic Year</label>
                        <Select
                            value={filters.academicYear}
                            onChange={(v) => setFilters(p => ({ ...p, academicYear: v }))}
                            className="w-full h-10"
                            options={[
                                { label: '2025-2026', value: '2025-2026' },
                                { label: '2026-2027', value: '2026-2027' }
                            ]}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700">From Date</label>
                        <DatePicker
                            value={filters.fromDate}
                            onChange={(v) => setFilters(p => ({ ...p, fromDate: v }))}
                            className="w-full h-10"
                            format="DD/MM/YYYY"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700">To Date</label>
                        <DatePicker
                            value={filters.toDate}
                            onChange={(v) => setFilters(p => ({ ...p, toDate: v }))}
                            className="w-full h-10"
                            format="DD/MM/YYYY"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700">Enquiry Status</label>
                        <Select
                            value={filters.status}
                            onChange={(v) => setFilters(p => ({ ...p, status: v }))}
                            className="w-full h-10"
                            options={[
                                { label: 'Interested', value: 'Interested' },
                                { label: 'Pending', value: 'Pending' },
                                { label: 'Thinking', value: 'Thinking' },
                                { label: 'Converted', value: 'Converted' },
                                { label: 'Closed', value: 'Closed' }
                            ]}
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={fetchData}
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                    >
                        Search / Apply Filters
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Enquiry Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Class</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Mobile No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Follow-Up Date</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Enquiry Date</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Source Of Enquiry</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-sm font-medium text-gray-400 font-inter">Filtering enquiries...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <FiSearch className="w-8 h-8 text-gray-200" />
                                            <span className="text-sm font-medium text-gray-400 font-inter">No matching records found for the selected criteria</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.enquiryCode}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{row.firstName} {row.lastName}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.class || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.academicYear || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{row.smsNumber1 || '-'}</td>
                                        <td className="px-6 py-4 text-orange-600 font-bold">{row.followUpDate || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.enquiryDate || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.sourceOfEnquiry || '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="View Detail"><FiEye className="w-4 h-4" /></button>
                                                <button className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors" title="Add Follow Up"><FiMessageSquare className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
