import React, { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { notification, Spin, Table, Checkbox } from 'antd';
import { FiEye, FiRefreshCw } from 'react-icons/fi';

const REGISTRATIONS_PATH = 'schooler_system/enquiry_management/registrations';

const ALL_FIELDS = [
    { label: 'Date Of Enquiry', value: 'enquiryDate' },
    { label: 'Academic Year', value: 'academicYear' },
    { label: 'Student Name', value: 'firstName' },
    { label: 'Father Name', value: 'fatherName' },
    { label: 'Surname', value: 'lastName' },
    { label: 'Student Full Name as per marksheet', value: 'fullNameMarksheet' },
    { label: 'Gender', value: 'gender' },
    { label: 'Birth Date', value: 'birthDate' },
    { label: 'Place of Birth', value: 'birthPlace' },
    { label: 'Caste', value: 'caste' },
    { label: 'Sub Caste', value: 'subCaste' },
    { label: 'Category', value: 'category' },
    { label: 'Religion', value: 'religion' },
    { label: 'Mother Tongue', value: 'motherTongue' },
    { label: 'Blood Group', value: 'bloodGroup' },
    { label: 'Mother Name', value: 'motherName' },
    { label: 'Current Address', value: 'currentAddress' },
    { label: 'Current State', value: 'currentState' },
    { label: 'Current City', value: 'currentCity' },
    { label: 'Current Zipcode', value: 'currentZip' },
    { label: 'Permanent Address', value: 'permanentAddress' },
    { label: 'Permanent State', value: 'permanentState' },
    { label: 'Permanent City', value: 'permanentCity' },
    { label: 'Permanent Zipcode', value: 'permanentZip' },
    { label: 'SMS Number1(Communication)', value: 'smsNumber1' },
    { label: 'E-Mail(Communication)', value: 'email' },
    { label: 'Alternate Mobile No.', value: 'altMobile' },
    { label: 'Alternate E-Mail Id', value: 'altEmail' },
    { label: 'Source Of Enquiry', value: 'sourceOfEnquiry' },
    { label: 'Enquiry Form No.', value: 'formNo' },
    { label: 'Enquiry Status', value: 'status' },
    { label: 'Remarks', value: 'remarks' },
    { label: 'Reference By', value: 'referenceBy' },
    { label: 'Father Qualification', value: 'fatherQual' },
    { label: 'Father Occupation', value: 'fatherOcc' },
    { label: 'Father Company Name', value: 'fatherCompany' },
    { label: 'Father Designation', value: 'fatherDesig' },
    { label: 'Father Mobile No.', value: 'fatherMobile' },
    { label: 'Father Aadhar Card Number', value: 'fatherAadhar' },
    { label: 'Father Office Address', value: 'fatherOffice' },
    { label: 'Mother Qualification', value: 'motherQual' },
    { label: 'Mother Occupation', value: 'motherOcc' },
    { label: 'Mother Company Name', value: 'motherCompany' },
    { label: 'Mother Designation', value: 'motherDesig' },
    { label: 'Mother Mobile No.', value: 'motherMobile' },
    { label: 'Mother Aadhar Card Number', value: 'motherAadhar' },
    { label: 'Mother Office Address', value: 'motherOffice' },
    { label: 'Parents Anniversary Date', value: 'anniversaryDate' },
    { label: 'Father Income(Annual)', value: 'fatherIncome' },
    { label: 'Mother Income(Annual)', value: 'motherIncome' },
    { label: 'Phone No (R)', value: 'phoneRes' },
    { label: 'Guardian Name', value: 'guardianName' },
    { label: 'Guardian Email Id', value: 'guardianEmail' },
    { label: 'Guardian Mobile No.', value: 'guardianMobile' },
    { label: 'Guardian Address', value: 'guardianAddress' },
    { label: 'Guardian State', value: 'guardianState' },
    { label: 'Guardian City', value: 'guardianCity' },
    { label: 'Guardian Zipcode', value: 'guardianZip' },
    { label: 'Previous School Name', value: 'prevSchool' },
    { label: 'Reason For Leaving School', value: 'leavingReason' },
    { label: 'Previous Class', value: 'prevClass' },
    { label: 'School Address', value: 'schoolAddress' },
    { label: 'Exam Marks(%)', value: 'examMarks' },
    { label: 'Last School Affiliated Is', value: 'lastAffiliated' },
    { label: 'Previous School LC/TC Number', value: 'lcNo' },
    { label: 'LC/TC Issue Date', value: 'lcDate' },
    { label: 'Student Adhar Card Number', value: 'studentAadhar' },
    { label: 'Single Girl Child?', value: 'singleGirl' },
    { label: 'Specially Abled (Divyangjan)?', value: 'speciallyAbled' },
    { label: 'Belonging to the EWS?', value: 'ews' },
    { label: 'Enquiry Entry By', value: 'recordedBy' },
    { label: 'Enquiry. Entry Date-Time', value: 'created_at' },
    { label: 'Enquiry. Entry Via (App/Website/Web)', value: 'entryVia' },
    { label: 'Registration Entry By', value: 'regEntryBy' },
    { label: 'Registration. Entry Date-Time', value: 'regDate' },
    { label: 'Registration. Entry Via (App/Website/Web)', value: 'regVia' }
];

export default function RegistrationCustomReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFields, setSelectedFields] = useState([]);
    const [academicYear, setAcademicYear] = useState('All selected');
    const [selectedClass, setSelectedClass] = useState('All selected');
    const [showTable, setShowTable] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFields(ALL_FIELDS.map(f => f.value));
        } else {
            setSelectedFields([]);
        }
    };

    const toggleField = (field) => {
        setSelectedFields(prev => 
            prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
        );
    };

    const columns = useMemo(() => {
        return ALL_FIELDS.filter(f => selectedFields.includes(f.value)).map(f => ({
            title: f.label,
            dataIndex: f.value,
            key: f.value,
            render: (val) => {
                if (val?.toDate) return val.toDate().toLocaleString();
                return val || '-';
            }
        }));
    }, [selectedFields]);

    const filteredData = useMemo(() => {
        return data.filter(d => {
            const matchesYear = academicYear === 'All selected' || d.academicYear === academicYear;
            const matchesClass = selectedClass === 'All selected' || d.class === selectedClass;
            return matchesYear && matchesClass;
        });
    }, [data, academicYear, selectedClass]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto font-inter text-gray-800">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Registration Custom Report</h1>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 mt-1 font-medium">
                        <span>Home</span> / <span>Enquiry Module</span> / <span>Report</span> / <span className="text-blue-600 font-bold">Registration Custom Report</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Select Academic Year <span className="text-red-500">*</span></label>
                        <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white">
                            <option>All selected</option>
                            <option>2024-2025</option>
                            <option>2025-2026</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Select Class <span className="text-red-500">*</span></label>
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white uppercase">
                            <option>All selected</option>
                            <option>Nursery</option>
                            <option>LKG</option>
                            <option>UKG</option>
                            {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(c => <option key={c}>{c}</option>)}
                        </select>

                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <button onClick={() => setShowTable(true)} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                        <FiEye /> View
                    </button>
                    <button onClick={() => { setSelectedFields([]); setShowTable(false); }} className="px-8 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all">Reset</button>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Checkbox onChange={handleSelectAll} checked={selectedFields.length === ALL_FIELDS.length} className="text-red-500 font-bold">Select All</Checkbox>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-3 gap-x-8">
                        {ALL_FIELDS.map(field => (
                            <div key={field.value} className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedFields.includes(field.value)}
                                    onChange={() => toggleField(field.value)}
                                    className="text-[12px] font-medium text-gray-600"
                                >
                                    {field.label}
                                </Checkbox>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showTable && selectedFields.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <Table 
                        columns={columns} 
                        dataSource={filteredData} 
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        className="custom-table"
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            )}
        </div>
    );
}
