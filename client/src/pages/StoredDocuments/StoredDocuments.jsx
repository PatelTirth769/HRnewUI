import React, { useState, useEffect, useMemo } from 'react';
import { FiDownload, FiEye, FiFile, FiFileText, FiImage, FiSearch, FiChevronDown, FiChevronUp, FiUser, FiCalendar, FiBook } from 'react-icons/fi';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getSystemQueryParam } from '../../services/api';
import { useUserRole } from '../../hooks/useUserRole';
import { useInstructorGroups } from '../../hooks/useInstructorGroups';
import { useCoordinatorScope } from '../../hooks/useCoordinatorScope';

const getFileIcon = (fileName) => {
    if (!fileName) return <FiFile className="text-gray-500" />;
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return <FiImage className="text-blue-500" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return <FiFileText className="text-red-500" />;
    return <FiFile className="text-gray-500" />;
};

const REGISTRATIONS_PATH = 'schooler_system/enquiry_management/registrations';

const StoredDocuments = () => {
    const { isInstructor, isCoordinator } = useUserRole();
    const instructorData = useInstructorGroups();
    const coordinatorScope = useCoordinatorScope();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedStudentId, setExpandedStudentId] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterProgram, setFilterProgram] = useState('All');
    const [filterAcademicYear, setFilterAcademicYear] = useState('All');
    const [filterBoard, setFilterBoard] = useState('All');
    const [pageSize, setPageSize] = useState(20);

    useEffect(() => {
        if (isCoordinator && coordinatorScope.loading) return;
        fetchStudentDocuments();
    }, [isCoordinator, coordinatorScope.loading]);

    const fetchStudentDocuments = async () => {
        try {
            setLoading(true);
            const colRef = collection(db, REGISTRATIONS_PATH);
            const q = query(colRef, orderBy('created_at', 'desc'));
            const snapshot = await getDocs(q);
            
            const studentData = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const documents = data.documents || [];
                
                // Only keep documents that have a valid file attached
                const uploadedDocs = documents.filter(doc => 
                    (doc.files && doc.files.length > 0) || doc.fileUrl
                ).map(doc => {
                    // Extract file information handling both array and single string structures
                    const files = doc.files && doc.files.length > 0 ? doc.files : [{
                        fileName: doc.fileName || doc.name,
                        fileUrl: doc.fileUrl,
                        uploadedAt: doc.uploadedAt || data.created_at
                    }];
                    return {
                        name: doc.name,
                        status: doc.status,
                        files: files
                    };
                });

                studentData.push({
                    id: docSnap.id,
                    registrationNo: data.registrationNo || 'N/A',
                    fullName: `${data.first_name || ''} ${data.middle_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Student',
                    program: data.program || 'N/A',
                    academicYear: data.academic_year || 'N/A',
                    board: data.custom_board || 'N/A',
                    registrationDate: data.registration_date || (data.created_at?.toDate ? data.created_at.toDate().toISOString().split('T')[0] : ''),
                    mobileNumber: data.student_mobile_number || '',
                    uploadedDocs: uploadedDocs
                });
            });
            
            setStudents(studentData);
        } catch (err) {
            console.error('Failed to fetch student documents:', err);
            setError('Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (fileUrl, fileName, actionType) => {
        try {
            if (!fileUrl) return;
            
            if (fileUrl.startsWith('http')) {
                 if (actionType === 'download') {
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.download = fileName || 'download';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    window.open(fileUrl, '_blank');
                }
            } else {
                const queryParam = getSystemQueryParam();
                const symbol = queryParam ? '&' : '?';
                const response = await fetch(`/local-api/api/s3/download-url${queryParam}${symbol}key=${encodeURIComponent(fileUrl)}`);
                if (!response.ok) {
                    throw new Error('Failed to get document URL');
                }
                const { presignedUrl } = await response.json();
                
                if (actionType === 'download') {
                    const link = document.createElement('a');
                    link.href = presignedUrl;
                    link.download = fileName || 'download';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    window.open(presignedUrl, '_blank');
                }
            }
        } catch (err) {
            alert('Failed to process action: ' + err.message);
        }
    };

    const toggleStudent = (id) => {
        setExpandedStudentId(prev => prev === id ? null : id);
    };
    const visibleStudentsList = useMemo(() => {
        if (isCoordinator) {
            if (coordinatorScope.loading) return [];
            return students.filter(student => coordinatorScope.programs.includes(student.program));
        } else if (isInstructor) {
            if (instructorData.loading) return [];
            return students.filter(student => {
                return instructorData.studentMobiles.includes(student.mobileNumber) ||
                    instructorData.studentNames.some(name => student.fullName.toLowerCase() === name.toLowerCase()) ||
                    instructorData.studentIds.includes(student.registrationNo) ||
                    instructorData.studentIds.includes(student.id);
            });
        }
        return students;
    }, [students, isInstructor, instructorData, isCoordinator, coordinatorScope]);

    // Extract unique filter options from the fetched data
    const availablePrograms = useMemo(() => {
        return [...new Set(visibleStudentsList.map(s => s.program))].filter(p => p !== 'N/A');
    }, [visibleStudentsList]);

    const availableAcademicYears = useMemo(() => {
        return [...new Set(visibleStudentsList.map(s => s.academicYear))].filter(y => y !== 'N/A');
    }, [visibleStudentsList]);

    const availableBoards = useMemo(() => {
        return [...new Set(visibleStudentsList.map(s => s.board))].filter(b => b && b !== 'N/A');
    }, [visibleStudentsList]);

    // Apply Filters
    const filteredStudents = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        return visibleStudentsList.filter(student => {
            // Text Search
            const matchesSearch = !term || 
                student.fullName.toLowerCase().includes(term) ||
                student.registrationNo.toLowerCase().includes(term) ||
                student.mobileNumber.toLowerCase().includes(term);
            if (!matchesSearch) return false;

            // Program Filter
            if (filterProgram !== 'All' && student.program !== filterProgram) return false;

            // Board Filter
            if (filterBoard !== 'All' && student.board !== filterBoard) return false;

            // Academic Year Filter
            if (filterAcademicYear !== 'All' && student.academicYear !== filterAcademicYear) return false;

            // Date Range Filter
            if (filterDateFrom && student.registrationDate) {
                if (new Date(student.registrationDate) < new Date(filterDateFrom)) return false;
            }
            if (filterDateTo && student.registrationDate) {
                if (new Date(student.registrationDate) > new Date(filterDateTo)) return false;
            }

            return true;
        });
    }, [visibleStudentsList, searchQuery, filterProgram, filterBoard, filterAcademicYear, filterDateFrom, filterDateTo]);
    const displayedStudents = useMemo(() => {
        return filteredStudents.slice(0, pageSize);
    }, [filteredStudents, pageSize]);

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Documents</h1>
                <p className="text-sm text-gray-500 mt-1">Filter and view uploaded documents by specific students.</p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    {error}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Filters Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><FiCalendar /> Start Date</label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full bg-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><FiCalendar /> End Date</label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-full bg-white"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><FiCalendar /> Academic Year</label>
                                <select
                                    value={filterAcademicYear}
                                    onChange={(e) => setFilterAcademicYear(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                                >
                                    <option value="All">All Years</option>
                                    {availableAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><FiBook /> Program</label>
                                <select
                                    value={filterProgram}
                                    onChange={(e) => setFilterProgram(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                                >
                                    <option value="All">All Programs</option>
                                    {availablePrograms.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2"><FiBook /> Board</label>
                                <select
                                    value={filterBoard}
                                    onChange={(e) => setFilterBoard(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white w-full"
                                >
                                    <option value="All">All Boards</option>
                                    {availableBoards.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-96">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by student name, Reg No or mobile..."
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button 
                                    onClick={() => {
                                        setSearchQuery(''); setFilterDateFrom(''); setFilterDateTo('');
                                        setFilterProgram('All'); setFilterAcademicYear('All'); setFilterBoard('All');
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-right text-sm font-medium text-gray-500">
                        {filteredStudents.length} Students Found
                    </div>

                    {/* Students List */}
                    <div className="space-y-4">
                        {filteredStudents.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                                <FiUser className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No Students Found</h3>
                                <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            displayedStudents.map(student => (
                                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <div 
                                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                                {student.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                    {student.fullName}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-medium">
                                                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                        {student.registrationNo}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{student.program}</span>
                                                    {student.board && student.board !== 'N/A' && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-gray-600 font-bold">{student.board}</span>
                                                        </>
                                                    )}
                                                    <span>•</span>
                                                    <span>{student.academicYear}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                            <div className="flex flex-col items-end mr-0 sm:mr-4">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {student.uploadedDocs.length} Documents
                                                </span>
                                                {student.uploadedDocs.length === 0 && (
                                                    <span className="text-xs text-red-500">No uploads yet</span>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-full transition-colors ${expandedStudentId === student.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {expandedStudentId === student.id ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Documents Section */}
                                    {expandedStudentId === student.id && (
                                        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                                            {student.uploadedDocs.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <FiFile className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                                    <p className="text-sm">No documents have been uploaded for this student yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {student.uploadedDocs.map((doc, idx) => (
                                                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:border-blue-200 transition-colors">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                                                        {getFileIcon(doc.files[0]?.fileName)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-gray-900">{doc.name}</h4>
                                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md inline-block mt-1">
                                                                            {doc.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="space-y-3 mt-2 border-t border-gray-100 pt-4">
                                                                {doc.files.map((file, fIdx) => (
                                                                    <div key={fIdx} className="flex items-center justify-between group bg-gray-50 rounded-lg p-2 px-3">
                                                                        <div 
                                                                            className="truncate text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex-1 pr-3 font-medium" 
                                                                            title={file.fileName}
                                                                            onClick={(e) => { e.stopPropagation(); handleAction(file.fileUrl, file.fileName, 'view'); }}
                                                                        >
                                                                            {file.fileName || 'Document File'}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); handleAction(file.fileUrl, file.fileName, 'view'); }}
                                                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                                                title="View File"
                                                                            >
                                                                                <FiEye size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); handleAction(file.fileUrl, file.fileName, 'download'); }}
                                                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                                                title="Download File"
                                                                            >
                                                                                <FiDownload size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {!loading && filteredStudents.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-gray-50/30 border border-gray-200 mt-4 rounded-xl">
                            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
                                {[20, 100, 500, 2500].map((size) => (
                                    <button
                                        key={size}
                                        className={`px-4 py-1.5 text-xs font-bold border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition cursor-pointer ${
                                            pageSize === size ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
                                        }`}
                                        onClick={() => setPageSize(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                Displaying {displayedStudents.length} of {filteredStudents.length}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StoredDocuments;
