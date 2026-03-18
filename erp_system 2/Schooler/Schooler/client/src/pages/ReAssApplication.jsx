import React, { useState, useEffect } from 'react';
import { FaSearch, FaFileExcel, FaDownload, FaUpload, FaPlus } from 'react-icons/fa';

const ReAssApplication = () => {
  const [studentId, setStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessmentList, setAssessmentList] = useState([]);
  const [totalFee, setTotalFee] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = () => {
    // Mock student data
    const mockStudent = {
      name: 'John Doe',
      year: '2023-24',
      program: 'Computer Science',
      subjects: ['Math', 'Physics', 'Chemistry'],
    };
    setStudentDetails(mockStudent);
  };

  const handleAddToAssessment = () => {
    if (studentDetails && selectedSubject) {
      const newAssessment = {
        student: studentId,
        name: studentDetails.name,
        subject: selectedSubject,
        year: studentDetails.year,
        exam: 'Regular', // Example data
        fee: 100, // Example fee
      };
      setAssessmentList([...assessmentList, newAssessment]);
    }
  };

  useEffect(() => {
    const total = assessmentList.reduce((sum, item) => sum + item.fee, 0);
    setTotalFee(total);
  }, [assessmentList]);

  const handlePayment = () => {
    // Integrate with Razorpay/UPI
    console.log('Redirecting to payment gateway...');
    setSuccessMessage('Payment initiated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Re-assessment Application</h1>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 flex items-center">
          <FaDownload className="mr-2" />
          Export
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Student Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex items-center">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter Student ID"
              className="p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white p-3 rounded-r-lg hover:bg-blue-600 flex items-center"
            >
              <FaSearch />
            </button>
          </div>
          {studentDetails && (
            <>
              <input
                type="text"
                value={studentDetails.name}
                readOnly
                placeholder="Name"
                className="p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <input
                type="text"
                value={studentDetails.year}
                readOnly
                placeholder="Year"
                className="p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <input
                type="text"
                value={studentDetails.program}
                readOnly
                placeholder="Program"
                className="p-3 border border-gray-300 rounded-lg bg-gray-50"
              />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {studentDetails.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToAssessment}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center justify-center"
              >
                <FaPlus className="mr-2" />
                Add to Assessment
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Assessment List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Student</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-left">Year</th>
                <th className="py-3 px-4 text-left">Exam</th>
                <th className="py-3 px-4 text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {assessmentList.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-4">{item.student}</td>
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4">{item.subject}</td>
                  <td className="py-3 px-4">{item.year}</td>
                  <td className="py-3 px-4">{item.exam}</td>
                  <td className="py-3 px-4 text-right">{item.fee}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td colSpan="5" className="py-3 px-4 text-right">Total</td>
                <td className="py-3 px-4 text-right">{totalFee}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePayment}
            className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 text-lg font-semibold"
          >
            Pay Now
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Upload Excel</h2>
        <div className="flex items-center">
          <input type="file" className="hidden" id="excel-upload" />
          <label
            htmlFor="excel-upload"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 cursor-pointer flex items-center"
          >
            <FaUpload className="mr-2" />
            Choose File
          </label>
          <span className="ml-4 text-gray-500">No file chosen</span>
        </div>
        <div className="mt-4 flex space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center">
                <FaUpload className="mr-2" />
                Upload Excel
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 flex items-center">
                <FaFileExcel className="mr-2" />
                Download Template
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReAssApplication;