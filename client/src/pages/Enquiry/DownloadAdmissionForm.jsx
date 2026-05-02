import React, { useEffect, useMemo, useState } from 'react';
import { notification, Spin } from 'antd';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiDownload, FiSearch, FiRefreshCw, FiFileText } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import schoolLogo from '../../assets/images/SSVLOGO.png';

const ADMISSIONS_PATH = 'schooler_system/enquiry_management/final_admissions';

const generateAdmissionPDF = (record) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(45, 52, 54);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // School Logo
    try {
        doc.addImage(schoolLogo, 'PNG', 15, 8, 24, 24);
    } catch (e) {
        console.warn('Could not add logo to PDF:', e);
    }

    // School Name & Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SSV Campus - CBSE', 45, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL STUDENT ADMISSION FORM', 45, 32);

    // Admission Info Box
    doc.setFillColor(245, 245, 245);
    doc.rect(140, 45, 55, 25, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text('Admission No:', 145, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(record.admissionNo || '-', 145, 62);

    let currentY = 85;

    const addSection = (title, data) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 52, 54);
        doc.text(title.toUpperCase(), 20, currentY);
        doc.setLineWidth(0.5);
        doc.setDrawColor(45, 52, 54);
        doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
        
        const tableData = Object.entries(data).map(([label, value]) => [label, value || '-']);
        
        autoTable(doc, {
            startY: currentY + 5,
            head: [],
            body: tableData,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 60, fillColor: [250, 250, 250] } },
            margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
    };

    addSection('Admission Details', {
        'Admission Number': record.admissionNo,
        'Admission Date': record.admissionDate,
        'Academic Year': record.academicYear,
        'Class': record.class,
        'Admission Status': record.status || 'Confirmed'
    });

    addSection('Student Personal Information', {
        'Student Name': `${record.firstName} ${record.lastName}`,
        'Gender': record.gender,
        'Date of Birth': record.birthDate,
        'Mobile Number': record.mobile,
        'Email ID': record.email
    });

    addSection('Parent/Guardian Details', {
        'Father\'s Name': record.fatherName,
        'Mother\'s Name': record.motherName
    });

    // Footer
    const finalY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, finalY + 10);
    doc.text('Principal\'s Signature', pageWidth - 60, finalY + 10);
    doc.line(pageWidth - 70, finalY + 5, pageWidth - 20, finalY + 5);

    doc.save(`Admission_Form_${record.admissionNo}.pdf`);
};

export default function DownloadAdmissionForm() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        academicYear: 'All selected',
        admissionClass: 'All selected',
        admissionSource: 'All selected'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, ADMISSIONS_PATH), orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const filteredData = useMemo(() => {
        const term = searchQuery.toLowerCase();
        return data.filter(d => {
            const matchesSearch = ((d.firstName || '') + ' ' + (d.lastName || '')).toLowerCase().includes(term) || 
                                (d.admissionNo || '').toLowerCase().includes(term);
            
            const matchesYear = filters.academicYear === 'All selected' || d.academicYear === filters.academicYear;
            const matchesClass = filters.admissionClass === 'All selected' || d.class === filters.admissionClass;
            const matchesSource = filters.admissionSource === 'All selected' || d.admissionSource === filters.admissionSource;
            
            let matchesDate = true;
            if (filters.fromDate && filters.toDate) {
                const admDate = new Date(d.admissionDate);
                const from = new Date(filters.fromDate);
                const to = new Date(filters.toDate);
                matchesDate = admDate >= from && admDate <= to;
            }

            return matchesSearch && matchesYear && matchesClass && matchesSource && matchesDate;
        });
    }, [data, searchQuery, filters]);

    const handleReset = () => {
        setFilters({
            fromDate: '',
            toDate: '',
            academicYear: 'All selected',
            admissionClass: 'All selected',
            admissionSource: 'All selected'
        });
        setSearchQuery('');
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Download Admission Form</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Admission</span> / <span className="text-blue-600 font-bold">Download Admission Form</span>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">ERP Entry From Date <span className="text-red-500">*</span></label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                            value={filters.fromDate}
                            onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">ERP Entry To Date <span className="text-red-500">*</span></label>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" 
                            value={filters.toDate}
                            onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">Academic Year <span className="text-red-500">*</span></label>
                        <select 
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                            value={filters.academicYear}
                            onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
                        >
                            <option>All selected</option>
                            <option>2025-2026</option>
                            <option>2024-2025</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">Admission Class <span className="text-red-500">*</span></label>
                        <select 
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                            value={filters.admissionClass}
                            onChange={(e) => setFilters({...filters, admissionClass: e.target.value})}
                        >
                            <option>All selected</option>
                            <option>Nursery</option>
                            <option>LKG</option>
                            <option>UKG</option>
                            <option>1st</option>
                            <option>2nd</option>
                            <option>3rd</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">Admission Source <span className="text-red-500">*</span></label>
                        <select 
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                            value={filters.admissionSource}
                            onChange={(e) => setFilters({...filters, admissionSource: e.target.value})}
                        >
                            <option>All selected</option>
                            <option>Walk-in</option>
                            <option>Online</option>
                            <option>Reference</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-50">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-sm">View</button>
                    <button onClick={handleReset} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">Reset</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">Show</span>
                        <select className="border border-gray-300 rounded px-2 py-1 text-sm outline-none bg-white">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="text-sm font-bold text-gray-600">entries</span>
                    </div>
                    <div className="relative max-w-sm w-full">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-white border border-gray-200 rounded px-4 py-1.5 text-sm outline-none focus:border-blue-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button className="absolute right-0 top-0 bottom-0 px-4 bg-gray-50 border-l border-gray-200 rounded-r text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">Search</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Admission Code</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">G.R. No.</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Student Name</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Class</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Academic Year</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Unique Number</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">ERP Entry Date</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Admission By</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px]">Download Form</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={10} className="px-6 py-10 text-center"><Spin /></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={10} className="px-6 py-16 text-center text-gray-400 font-medium italic">No matching records found</td></tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-blue-600">{row.admissionNo}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.grNo || '-'}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{row.firstName} {row.lastName}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.class}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.academicYear}</td>
                                        <td className="px-6 py-4 font-mono text-[11px] text-gray-500">{row.registrationId?.slice(-8) || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{row.admissionDate}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">Admin</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => generateAdmissionPDF(row)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-all flex items-center gap-2 font-bold"
                                            >
                                                <FiDownload className="w-4 h-4" />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><FiFileText className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-5 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <span className="text-sm font-medium text-gray-500">Showing {filteredData.length} to {filteredData.length} of {data.length} entries</span>
                    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                        <button className="px-3 py-1 border-r border-gray-200 hover:bg-gray-100 transition-all text-gray-400 font-black">«</button>
                        <button className="px-3 py-1 border-r border-gray-200 hover:bg-gray-100 transition-all text-gray-400 font-black">‹</button>
                        <button className="px-3 py-1 border-r border-gray-200 hover:bg-gray-100 transition-all text-gray-400 font-black">›</button>
                        <button className="px-3 py-1 hover:bg-gray-100 transition-all text-gray-400 font-black">»</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
