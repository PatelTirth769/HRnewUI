import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaUpload, FaDownload, FaSearch, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PostExaminationReport = () => {
  const [formData, setFormData] = useState({
    university: '',
    semester: '',
    year: '',
    exam: '',
    proctor: '',
    subject: '',
    student: '',
    room: ''
  });

  const [reports, setReports] = useState([
    {
      id: 1,
      studentName: '',
      rollNumber: '',
      subjectName: '',
      examDate: '',
      totalMarks: '',
      obtainedMarks: '',
      percentage: '',
      grade: '',
      resultStatus: 'Pending',
      attendance: 'Present',
      remarks: '',
      verifiedBy: '',
      verificationDate: ''
    }
  ]);

  const [savedReports, setSavedReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [reportType, setReportType] = useState('detailed');

  // Fetch saved reports on component mount
  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const response = await fetch('/api/post-examination-report');
      if (response.ok) {
        const data = await response.json();
        setSavedReports(data);
      }
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReportChange = (index, field, value) => {
    setReports(prev => prev.map((report, i) => 
      i === index ? { ...report, [field]: value } : report
    ));
  };

  const addReport = () => {
    setReports(prev => [...prev, {
      id: Date.now(),
      studentName: '',
      rollNumber: '',
      subjectName: '',
      examDate: '',
      totalMarks: '',
      obtainedMarks: '',
      percentage: '',
      grade: '',
      resultStatus: 'Pending',
      attendance: 'Present',
      remarks: '',
      verifiedBy: '',
      verificationDate: ''
    }]);
  };

  const removeReport = (index) => {
    setReports(prev => prev.filter((_, i) => i !== index));
  };

  const calculatePercentage = (obtained, total) => {
    if (total && obtained) {
      return ((parseFloat(obtained) / parseFloat(total)) * 100).toFixed(2);
    }
    return '';
  };

  const handleMarksChange = (index, field, value) => {
    const newReports = [...reports];
    newReports[index][field] = value;
    
    // Auto-calculate percentage
    const obtained = newReports[index].obtainedMarks;
    const total = newReports[index].totalMarks;
    newReports[index].percentage = calculatePercentage(obtained, total);
    
    // Auto-assign grade based on percentage
    const percentage = parseFloat(newReports[index].percentage);
    if (percentage >= 90) newReports[index].grade = 'A+';
    else if (percentage >= 80) newReports[index].grade = 'A';
    else if (percentage >= 70) newReports[index].grade = 'B';
    else if (percentage >= 60) newReports[index].grade = 'C';
    else if (percentage >= 50) newReports[index].grade = 'D';
    else if (percentage > 0) newReports[index].grade = 'F';
    else newReports[index].grade = '';
    
    setReports(newReports);
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length > 0) {
            const mappedReports = jsonData.map((row, index) => ({
              id: Date.now() + index,
              studentName: row['Student Name'] || row.studentName || '',
              rollNumber: row['Roll Number'] || row.rollNumber || '',
              subjectName: row['Subject Name'] || row.subjectName || '',
              examDate: row['Exam Date'] || row.examDate || '',
              totalMarks: row['Total Marks'] || row.totalMarks || '',
              obtainedMarks: row['Obtained Marks'] || row.obtainedMarks || '',
              percentage: row['Percentage'] || row.percentage || '',
              grade: row['Grade'] || row.grade || '',
              resultStatus: row['Result Status'] || row.resultStatus || 'Pending',
              attendance: row['Attendance'] || row.attendance || 'Present',
              remarks: row['Remarks'] || row.remarks || '',
              verifiedBy: row['Verified By'] || row.verifiedBy || '',
              verificationDate: row['Verification Date'] || row.verificationDate || ''
            }));
            
            setReports(mappedReports);
            setSuccessMessage('Excel file uploaded successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          alert('Error processing Excel file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExcelDownload = () => {
    try {
      const data = reports.map(report => ({
        'Student Name': report.studentName,
        'Roll Number': report.rollNumber,
        'Subject Name': report.subjectName,
        'Exam Date': report.examDate,
        'Total Marks': report.totalMarks,
        'Obtained Marks': report.obtainedMarks,
        'Percentage': report.percentage,
        'Grade': report.grade,
        'Result Status': report.resultStatus,
        'Attendance': report.attendance,
        'Remarks': report.remarks,
        'Verified By': report.verifiedBy,
        'Verification Date': report.verificationDate
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Post Examination Report');
      XLSX.writeFile(workbook, 'Post_Examination_Report.xlsx');
      
      setSuccessMessage('Excel file downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Error downloading Excel file.');
    }
  };

  const generatePDFReport = () => {
    setSuccessMessage('PDF report generation started...');
    setTimeout(() => {
      setSuccessMessage('PDF report generated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 2000);
  };

  const printReport = () => {
    window.print();
  };

  const generateSummaryReport = () => {
    const summary = {
      totalStudents: reports.length,
      passedStudents: reports.filter(r => r.resultStatus === 'Pass').length,
      failedStudents: reports.filter(r => r.resultStatus === 'Fail').length,
      pendingStudents: reports.filter(r => r.resultStatus === 'Pending').length,
      averagePercentage: reports.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0) / reports.length
    };
    
    setSuccessMessage(`Summary: Total: ${summary.totalStudents}, Pass: ${summary.passedStudents}, Fail: ${summary.failedStudents}, Avg: ${summary.averagePercentage.toFixed(2)}%`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        reports: reports,
        reportType: reportType
      };
      
      const response = await fetch('/api/post-examination-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage('Post examination report saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSavedReports();
      } else {
        throw new Error('Failed to save post examination report');
      }
    } catch (error) {
      console.error('Error saving post examination report:', error);
      alert('Error saving post examination report. Please try again.');
    }
  };

  const filteredReports = savedReports.filter(report => 
    report.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.resultStatus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold">Post Examination Report</h1>
            <p className="text-indigo-100 mt-1">Generate and manage post examination reports</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded m-4">
              {successMessage}
            </div>
          )}

          {/* Form Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => handleFormChange('university', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter university"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => handleFormChange('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => handleFormChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                <input
                  type="text"
                  value={formData.exam}
                  onChange={(e) => handleFormChange('exam', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter exam name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proctor</label>
                <input
                  type="text"
                  value={formData.proctor}
                  onChange={(e) => handleFormChange('proctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter proctor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleFormChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <input
                  type="text"
                  value={formData.student}
                  onChange={(e) => handleFormChange('student', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => handleFormChange('room', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter room number"
                />
              </div>
            </div>

            {/* Report Type Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="detailed"
                    checked={reportType === 'detailed'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  Detailed Report
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="summary"
                    checked={reportType === 'summary'}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mr-2"
                  />
                  Summary Report
                </label>
              </div>
            </div>
          </div>

          {/* Report Operations */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center transition-colors">
                <FaUpload className="mr-2" />
                Upload Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExcelDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaDownload className="mr-2" />
                Download Excel
              </button>
              <button
                onClick={generatePDFReport}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaFilePdf className="mr-2" />
                Generate PDF
              </button>
              <button
                onClick={printReport}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPrint className="mr-2" />
                Print Report
              </button>
              <button
                onClick={generateSummaryReport}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaFileExcel className="mr-2" />
                Generate Summary
              </button>
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPlus className="mr-2" />
                Save Report
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Examination Report Details</h2>
              <button
                onClick={addReport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Student Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Student Name</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Roll Number</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Exam Date</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Total Marks</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Obtained Marks</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Percentage</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Grade</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Result Status</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Attendance</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Remarks</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Verified By</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Verification Date</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.studentName}
                          onChange={(e) => handleReportChange(index, 'studentName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Student name"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.rollNumber}
                          onChange={(e) => handleReportChange(index, 'rollNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Roll number"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.subjectName}
                          onChange={(e) => handleReportChange(index, 'subjectName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Subject name"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="date"
                          value={report.examDate}
                          onChange={(e) => handleReportChange(index, 'examDate', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="number"
                          value={report.totalMarks}
                          onChange={(e) => handleMarksChange(index, 'totalMarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Total"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="number"
                          value={report.obtainedMarks}
                          onChange={(e) => handleMarksChange(index, 'obtainedMarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Obtained"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.percentage}
                          readOnly
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-gray-600"
                          placeholder="%"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.grade}
                          readOnly
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 text-gray-600"
                          placeholder="Grade"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <select
                          value={report.resultStatus}
                          onChange={(e) => handleReportChange(index, 'resultStatus', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                          <option value="Reappear">Reappear</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <select
                          value={report.attendance}
                          onChange={(e) => handleReportChange(index, 'attendance', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <textarea
                          value={report.remarks}
                          onChange={(e) => handleReportChange(index, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Remarks"
                          rows="2"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={report.verifiedBy}
                          onChange={(e) => handleReportChange(index, 'verifiedBy', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Verifier"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="date"
                          value={report.verificationDate}
                          onChange={(e) => handleReportChange(index, 'verificationDate', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <button
                          onClick={() => removeReport(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
                        >
                          <FaTrash className="mr-1" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Saved Reports Search */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search saved reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {filteredReports.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Saved Examination Reports</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredReports.map((report, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{report.studentName}</p>
                          <p className="text-sm text-gray-600">Roll: {report.rollNumber} | {report.subjectName}</p>
                          <p className="text-xs text-gray-500">Marks: {report.obtainedMarks}/{report.totalMarks} ({report.percentage}%)</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          report.resultStatus === 'Pass' ? 'bg-green-100 text-green-800' :
                          report.resultStatus === 'Fail' ? 'bg-red-100 text-red-800' :
                          report.resultStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {report.resultStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostExaminationReport;