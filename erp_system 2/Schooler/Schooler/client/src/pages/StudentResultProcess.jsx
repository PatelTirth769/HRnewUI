import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const StudentResultProcess = () => {
  const [formData, setFormData] = useState({ 
    university: '', 
    semester: '', 
    year: '', 
    proctor: '',
    exam: '', 
    subject: '', 
    student: '', 
    room: ''
  });
  const [studentResults, setStudentResults] = useState([
    { 
      id: 1, 
      student: '', 
      attendance: '', 
      fee: '', 
      branchActive: '', 
      studentId: '', 
      appear: '', 
      cheating: '', 
      verification: '', 
      class: '', 
      result: '', 
      remarks: '', 
      withHold: false 
    }
  ]);
  const [savedResults, setSavedResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length > 1) {
        const headers = data[0];
        const fileData = data.slice(1).map(row => {
          let rowData = {};
          row.forEach((value, index) => {
            rowData[headers[index]] = value;
          });
          return rowData;
        });

        // Set form data from first row
        const newFormData = {
          university: fileData[0]?.University || '',
          semester: fileData[0]?.Semester || '',
          year: fileData[0]?.Year || '',
          proctor: fileData[0]?.Proctor || '',
          exam: fileData[0]?.Exam || '',
          subject: fileData[0]?.Subject || '',
          student: fileData[0]?.Student || '',
          room: fileData[0]?.Room || '',
        };

        // Set student results from all rows
        const newStudentResults = fileData.map((row, index) => ({
          id: index + 1,
          student: row.Student || '',
          attendance: row.Attendance || '',
          fee: row.Fee || '',
          branchActive: row['Branch Active'] || '',
          studentId: row['Student ID'] || '',
          appear: row.Appear || '',
          cheating: row.Cheating || '',
          verification: row.Verification || '',
          class: row.Class || '',
          result: row.Result || '',
          remarks: row.Remarks || '',
          withHold: row['With Hold'] === 'Yes' || false
        }));

        setFormData(newFormData);
        setStudentResults(newStudentResults);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Fetch saved results on component mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get('/api/student-result-process');
        setSavedResults(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching student results:', error);
        setSavedResults([]);
      }
    };
    fetchResults();
  }, []);

  // Filter saved results based on search term
  const filteredResults = (savedResults || []).filter(result =>
    result.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.semester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.exam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Excel download
  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredResults.flatMap(savedResult => 
      savedResult.studentResults.map(result => ({
        University: savedResult.university,
        Semester: savedResult.semester,
        Year: savedResult.year,
        Proctor: savedResult.proctor,
        Exam: savedResult.exam,
        Subject: savedResult.subject,
        Student: savedResult.student,
        Room: savedResult.room,
        'Student Name': result.student,
        Attendance: result.attendance,
        Fee: result.fee,
        'Branch Active': result.branchActive,
        'Student ID': result.studentId,
        Appear: result.appear,
        Cheating: result.cheating,
        Verification: result.verification,
        Class: result.class,
        Result: result.result,
        Remarks: result.remarks,
        'With Hold': result.withHold ? 'Yes' : 'No',
      }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'StudentResults');
    XLSX.writeFile(workbook, 'StudentResultProcess.xlsx');
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle student result changes
  const handleStudentResultChange = (id, e) => {
    const { name, value, type, checked } = e.target;
    const newStudentResults = studentResults.map(result => {
      if (result.id === id) {
        return { ...result, [name]: type === 'checkbox' ? checked : value };
      }
      return result;
    });
    setStudentResults(newStudentResults);
  };

  // Add new student result row
  const handleAddStudentResult = () => {
    const newId = studentResults.length > 0 ? Math.max(...studentResults.map(result => result.id)) + 1 : 1;
    setStudentResults([...studentResults, { 
      id: newId, 
      student: '', 
      attendance: '', 
      fee: '', 
      branchActive: '', 
      studentId: '', 
      appear: '', 
      cheating: '', 
      verification: '', 
      class: '', 
      result: '', 
      remarks: '', 
      withHold: false 
    }]);
  };

  // Remove student result row
  const handleRemoveStudentResult = (id) => {
    setStudentResults(studentResults.filter(result => result.id !== id));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/student-result-process', { 
        ...formData, 
        studentResults 
      });
      
      // Show success message
      setSaveMessage('Student results processed successfully!');
      
      // Refresh the saved results after successful save
      const fetchResults = async () => {
        try {
          const response = await axios.get('/api/student-result-process');
          setSavedResults(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Error fetching student results:', error);
          setSavedResults([]);
        }
      };
      fetchResults();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving student results:', error);
      setSaveMessage('Error saving student results. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Student Result Process</h1>

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {saveMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        {/* Form Fields - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
            <input 
              type="text" 
              name="university" 
              placeholder="Enter University" 
              value={formData.university} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <input 
              type="text" 
              name="semester" 
              placeholder="Enter Semester" 
              value={formData.semester} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input 
              type="text" 
              name="year" 
              placeholder="Enter Year" 
              value={formData.year} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proctor</label>
            <input 
              type="text" 
              name="proctor" 
              placeholder="Enter Proctor" 
              value={formData.proctor} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Form Fields - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <input 
              type="text" 
              name="exam" 
              placeholder="Enter Exam" 
              value={formData.exam} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input 
              type="text" 
              name="subject" 
              placeholder="Enter Subject" 
              value={formData.subject} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <input 
              type="text" 
              name="student" 
              placeholder="Enter Student" 
              value={formData.student} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
            <input 
              type="text" 
              name="room" 
              placeholder="Enter Room" 
              value={formData.room} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Student Results Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Student Results</h3>
            <button 
              type="button" 
              onClick={handleAddStudentResult} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add Student Result
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Student</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Attendance</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Fee</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Branch Active</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Student ID</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Appear</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Cheating</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Verification</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Class</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Result</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Remarks</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">With Hold</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="student"
                        value={result.student}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Student Name"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="attendance"
                        value={result.attendance}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Attendance"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="fee"
                        value={result.fee}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Fee Status"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="branchActive"
                        value={result.branchActive}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Branch Active"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="studentId"
                        value={result.studentId}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Student ID"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="appear"
                        value={result.appear}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Appear Status"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="cheating"
                        value={result.cheating}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Cheating Status"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="verification"
                        value={result.verification}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Verification Status"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="class"
                        value={result.class}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Class"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="result"
                        value={result.result}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Result"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="remarks"
                        value={result.remarks}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Remarks"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      <input
                        type="checkbox"
                        name="withHold"
                        checked={result.withHold}
                        onChange={(e) => handleStudentResultChange(result.id, e)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStudentResult(result.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Process Student Results
          </button>
        </div>
      </form>

      {/* File Upload/Download Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Excel Operations</h3>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Results</label>
            <button 
              onClick={handleDownload} 
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Saved Results Display */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Saved Student Results</h3>
          <input
            type="text"
            placeholder="Search by University, Semester, Year, Exam, Subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">University</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Semester</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Year</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Exam</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Subject</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Proctor</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Room</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Total Students</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">With Hold Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length > 0 ? (
                filteredResults.map((savedResult, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">{savedResult.university}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.semester}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.year}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.exam}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.subject}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.proctor}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedResult.room}</td>
                    <td className="py-3 px-4 border border-gray-300 text-center">{savedResult.studentResults?.length || 0}</td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      {savedResult.studentResults?.filter(result => result.withHold).length || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-4 px-4 text-center text-gray-500">
                    No saved student results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentResultProcess;