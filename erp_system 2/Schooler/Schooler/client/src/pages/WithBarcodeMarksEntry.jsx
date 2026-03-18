import React, { useState, useEffect } from 'react';
import { FaSearch, FaDownload, FaUpload, FaBarcode, FaFilter, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const WithBarcodeMarksEntry = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [examCenters, setExamCenters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    examCenterId: '',
    programId: '',
    yearId: '',
    subjectId: '',
    examDate: ''
  });
  const [editingMarks, setEditingMarks] = useState({});
  const [marksData, setMarksData] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch dropdown data - using mock data for now
      setExamCenters([
        { examCenterId: 'EC001', examCenterName: 'Center 1' },
        { examCenterId: 'EC002', examCenterName: 'Center 2' }
      ]);
      setPrograms([
        { programId: 'PR001', programName: 'Computer Science' },
        { programId: 'PR002', programName: 'Information Technology' }
      ]);
      setYears([
        { yearId: 'Y2023', yearName: '2023-2024' },
        { yearId: 'Y2024', yearName: '2024-2025' }
      ]);
      setSubjects([
        { subjectId: 'SUB001', subjectName: 'Mathematics' },
        { subjectId: 'SUB002', subjectName: 'Physics' },
        { subjectId: 'SUB003', subjectName: 'Chemistry' }
      ]);
      
      // Fetch mock student data
      setStudents([
        { 
          _id: '1', 
          studentId: 'S001', 
          studentName: 'John Doe', 
          enrollmentNo: 'EN001', 
          barcode: 'BAR001',
          programId: 'PR001', 
          yearId: 'Y2023', 
          examCenterId: 'EC001',
          subjectId: 'SUB001',
          examDate: '2024-01-15',
          internalMarks: 25,
          externalMarks: 75,
          totalMarks: 100
        },
        { 
          _id: '2', 
          studentId: 'S002', 
          studentName: 'Jane Smith', 
          enrollmentNo: 'EN002', 
          barcode: 'BAR002',
          programId: 'PR002', 
          yearId: 'Y2023', 
          examCenterId: 'EC002',
          subjectId: 'SUB002',
          examDate: '2024-01-16',
          internalMarks: 28,
          externalMarks: 72,
          totalMarks: 100
        }
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBarcodeScan = () => {
    setScanning(true);
    // Simulate barcode scanning
    setTimeout(() => {
      const mockBarcode = 'BAR' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setScannedBarcode(mockBarcode);
      setScanning(false);
      
      // Find student by barcode
      const student = students.find(s => s.barcode === mockBarcode);
      if (student) {
        toast.success(`Found student: ${student.studentName}`);
        // Focus on marks entry for this student
        setEditingMarks({ [student._id]: true });
      } else {
        toast.error('No student found with this barcode');
      }
    }, 2000);
  };

  const handleMarksChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveMarks = async (studentId) => {
    try {
      setLoading(true);
      // Simulate API call to save marks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update student data
      const updatedStudents = students.map(student => {
        if (student._id === studentId) {
          const newMarks = marksData[studentId] || {};
          return {
            ...student,
            internalMarks: newMarks.internalMarks || student.internalMarks,
            externalMarks: newMarks.externalMarks || student.externalMarks,
            totalMarks: (parseInt(newMarks.internalMarks) || student.internalMarks) + (parseInt(newMarks.externalMarks) || student.externalMarks)
          };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      setEditingMarks(prev => ({ ...prev, [studentId]: false }));
      toast.success('Marks saved successfully');
    } catch (error) {
      console.error('Error saving marks:', error);
      toast.error('Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = (studentId) => {
    setEditingMarks(prev => ({ ...prev, [studentId]: false }));
    setMarksData(prev => {
      const newData = { ...prev };
      delete newData[studentId];
      return newData;
    });
  };

  const downloadReport = () => {
    // Create CSV content
    const csvContent = [
      ['Student ID', 'Name', 'Enrollment No', 'Barcode', 'Internal Marks', 'External Marks', 'Total Marks'],
      ...filteredStudents.map(student => [
        student.studentId,
        student.studentName,
        student.enrollmentNo,
        student.barcode,
        student.internalMarks,
        student.externalMarks,
        student.totalMarks
      ])
    ].map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `barcode-marks-entry-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  const uploadExcel = (event) => {
    const file = event.target.files[0];
    if (file) {
      toast.success(`File "${file.name}" uploaded successfully`);
      // Here you would typically parse the Excel file and update the data
    }
  };

  const clearFilters = () => {
    setFilters({
      examCenterId: '',
      programId: '',
      yearId: '',
      subjectId: '',
      examDate: ''
    });
    setSearchTerm('');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (!filters.examCenterId || student.examCenterId === filters.examCenterId) &&
      (!filters.programId || student.programId === filters.programId) &&
      (!filters.yearId || student.yearId === filters.yearId) &&
      (!filters.subjectId || student.subjectId === filters.subjectId) &&
      (!filters.examDate || student.examDate === filters.examDate);
    
    return matchesSearch && matchesFilters;
  });

  const getExamCenterName = (centerId) => {
    const center = examCenters.find(c => c.examCenterId === centerId);
    return center ? center.examCenterName : centerId;
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.programId === programId);
    return program ? program.programName : programId;
  };

  const getYearName = (yearId) => {
    const year = years.find(y => y.yearId === yearId);
    return year ? year.yearName : yearId;
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.subjectId === subjectId);
    return subject ? subject.subjectName : subjectId;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">With Barcode Marks Entry</h1>
      </div>

      {/* Barcode Scanner Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaBarcode className="mr-2" />
          Barcode Scanner
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter barcode or click scan button"
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <button
            onClick={handleBarcodeScan}
            disabled={scanning}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md transition-colors flex items-center"
          >
            {scanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scanning...
              </>
            ) : (
              <>
                <FaBarcode className="mr-2" /> Scan Barcode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FaFilter className="mr-2" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center</label>
            <select
              value={filters.examCenterId}
              onChange={(e) => handleFilterChange('examCenterId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Centers</option>
              {examCenters.map(center => (
                <option key={center.examCenterId} value={center.examCenterId}>
                  {center.examCenterName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              value={filters.programId}
              onChange={(e) => handleFilterChange('programId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.programId} value={program.programId}>
                  {program.programName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.yearId}
              onChange={(e) => handleFilterChange('yearId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year.yearId} value={year.yearId}>
                  {year.yearName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filters.subjectId}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
            <input
              type="date"
              value={filters.examDate}
              onChange={(e) => handleFilterChange('examDate', e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, enrollment no, student ID, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center cursor-pointer">
              <FaUpload className="mr-2" /> Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={uploadExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={downloadReport}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Students ({filteredStudents.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm bg-gray-100 px-2 py-1 rounded">{student.barcode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getProgramName(student.programId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getSubjectName(student.subjectId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMarks[student._id] ? (
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={marksData[student._id]?.internalMarks || student.internalMarks}
                          onChange={(e) => handleMarksChange(student._id, 'internalMarks', e.target.value)}
                          className="w-16 p-1 border rounded text-center"
                        />
                      ) : (
                        student.internalMarks
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMarks[student._id] ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={marksData[student._id]?.externalMarks || student.externalMarks}
                          onChange={(e) => handleMarksChange(student._id, 'externalMarks', e.target.value)}
                          className="w-16 p-1 border rounded text-center"
                        />
                      ) : (
                        student.externalMarks
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {editingMarks[student._id] 
                        ? (parseInt(marksData[student._id]?.internalMarks) || student.internalMarks) + 
                          (parseInt(marksData[student._id]?.externalMarks) || student.externalMarks)
                        : student.totalMarks
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMarks[student._id] ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveMarks(student._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <FaSave />
                          </button>
                          <button
                            onClick={() => cancelEdit(student._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingMarks(prev => ({ ...prev, [student._id]: true }))}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Marks"
                        >
                          <FaEdit />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WithBarcodeMarksEntry;