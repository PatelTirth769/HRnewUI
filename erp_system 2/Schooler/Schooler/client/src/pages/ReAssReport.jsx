import React, { useState } from 'react';
import { FaSearch, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ReAssReport = () => {
  const [formData, setFormData] = useState({
    student: '',
    semester: '',
    institute: '',
    name: '',
    subject: ''
  });

  const [tableData] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      student: 'John Doe',
      facultyAllocate: 'Dr. Smith',
      facultyAccepts: 'Yes',
      secondaryAssessment: 'Completed',
      accepted: 'Yes',
      marksAllocated: '85'
    },
    {
      id: 2,
      subject: 'Physics',
      student: 'Jane Smith',
      facultyAllocate: 'Dr. Johnson',
      facultyAccepts: 'Yes',
      secondaryAssessment: 'Completed',
      accepted: 'Yes',
      marksAllocated: '85'
    },
    {
      id: 3,
      subject: 'Chemistry',
      student: 'Bob Wilson',
      facultyAllocate: 'Dr. Brown',
      facultyAccepts: 'No',
      secondaryAssessment: 'Not Started',
      accepted: 'No',
      marksAllocated: ''
    }
  ]);

  const [semesterOptions] = useState(['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6']);
  const [instituteOptions] = useState(['Institute A', 'Institute B', 'Institute C', 'Institute D']);
  const [subjectOptions] = useState(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science']);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    console.log('Searching with criteria:', formData);
    // Filter logic would go here
  };

  const exportData = () => {
    const exportData = tableData.map(item => ({
      'Subject': item.subject,
      'Student': item.student,
      'Faculty Allocate': item.facultyAllocate,
      'Faculty Accepts': item.facultyAccepts,
      'Secondary Assessment': item.secondaryAssessment,
      'Accepted': item.accepted,
      'Marks Allocated': item.marksAllocated
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ReAss Report');
    XLSX.writeFile(wb, 'ReAss_Report_Export.xlsx');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Re-ass Report</h1>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <div className="relative">
              <input
                type="text"
                name="student"
                value={formData.student}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter student name"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Semester</option>
              {semesterOptions.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Institute</label>
            <select
              name="institute"
              value={formData.institute}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Institute</option>
              {instituteOptions.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {subjectOptions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <FaSearch className="mr-2" />
            Search
          </button>
          <button
            onClick={exportData}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200 flex items-center"
          >
            <FaFileExcel className="mr-2" />
            Export Data
          </button>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Faculty Allocate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Faculty Accepts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Secondary Assessment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Accepted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Marks Allocated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.subject}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.student}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.facultyAllocate}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.facultyAccepts}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.secondaryAssessment}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.accepted}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">{row.marksAllocated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReAssReport;