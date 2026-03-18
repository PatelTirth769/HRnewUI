import React, { useState, useEffect } from 'react';
import { FaSearch, FaUpload, FaDownload, FaFileExcel } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ReAssResultProcess = () => {
  const [formData, setFormData] = useState({
    student: '',
    semester: '',
    institute: '',
    name: '',
    subject: ''
  });

  const [tableData, setTableData] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      student: 'John Doe',
      facultyAllocate: 'Dr. Smith',
      facultyAccepts: 'Yes',
      checked: false,
      secondaryAssessment: 'Pending',
      accepted: 'No',
      marksAllocated: ''
    },
    {
      id: 2,
      subject: 'Physics',
      student: 'Jane Smith',
      facultyAllocate: 'Dr. Johnson',
      facultyAccepts: 'Yes',
      checked: true,
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
      checked: false,
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

  const handleTableChange = (id, field, value) => {
    setTableData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleCheckboxChange = (id) => {
    setTableData(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleMarksAllocation = (id, marks) => {
    setTableData(prev => prev.map(item => 
      item.id === id ? { ...item, marksAllocated: marks } : item
    ));
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Subject', 'Student', 'Faculty Allocate', 'Faculty Accepts', 'Checked', 'Secondary Assessment', 'Accepted', 'Marks Allocated']
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'ReAss_Result_Process_Template.xlsx');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Uploaded data:', jsonData);
        // Process uploaded data here
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const exportData = () => {
    const exportData = tableData.map(item => ({
      'Subject': item.subject,
      'Student': item.student,
      'Faculty Allocate': item.facultyAllocate,
      'Faculty Accepts': item.facultyAccepts,
      'Checked': item.checked ? 'Yes' : 'No',
      'Secondary Assessment': item.secondaryAssessment,
      'Accepted': item.accepted,
      'Marks Allocated': item.marksAllocated
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ReAss Result Process');
    XLSX.writeFile(wb, 'ReAss_Result_Process_Export.xlsx');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Re-ass Result Process</h1>
        
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
        
        <div className="mb-6">
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <FaSearch className="mr-2" />
            Search
          </button>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Faculty Allocate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Faculty Accepts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Checked</th>
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={() => handleCheckboxChange(row.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">
                    <select
                      value={row.secondaryAssessment}
                      onChange={(e) => handleTableChange(row.id, 'secondaryAssessment', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">
                    <select
                      value={row.accepted}
                      onChange={(e) => handleTableChange(row.id, 'accepted', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border">
                    <input
                      type="number"
                      value={row.marksAllocated}
                      onChange={(e) => handleMarksAllocation(row.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Marks"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Excel Operations */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 cursor-pointer flex items-center"
            >
              <FaUpload className="mr-2" />
              Upload Excel
            </label>
          </div>
          
          <button
            onClick={downloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center"
          >
            <FaDownload className="mr-2" />
            Download Template
          </button>
          
          <button
            onClick={exportData}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200 flex items-center"
          >
            <FaFileExcel className="mr-2" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReAssResultProcess;