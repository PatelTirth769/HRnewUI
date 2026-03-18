import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const StudentTermGrant = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState({
    instituteId: '',
    programId: '',
    year: '',
    minimumEligibility: '',
    term: ''
  });
  const [institutes, setInstitutes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [file, setFile] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchInstitutes();
    fetchPrograms();
    fetchYears();
    fetchTerms();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await axios.get('/api/institutes');
      setInstitutes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      setInstitutes([]);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('/api/programs');
      setPrograms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await axios.get('/api/manage-years');
      setYears(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching years:', error);
      setYears([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await axios.get('/api/exam-terms');
      setTerms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTerms([]);
    }
  };

  const fetchStudents = async () => {
    if (!filterData.instituteId || !filterData.programId || !filterData.year || !filterData.term) {
      toast.error('Please fill all filter fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/student-term-grant', {
        params: filterData
      });
      const studentData = Array.isArray(response.data) ? response.data : [];
      setStudents(studentData);
      setFilteredStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const handleSearch = () => {
    fetchStudents();
  };

  const handleGrantToggle = async (studentId, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = currentStatus === 'Yes' ? 'No' : 'Yes';
      await axios.put(`/api/student-term-grant/${studentId}`, {
        granted: newStatus
      });
      
      // Update local state
      const updatedStudents = students.map(student =>
        student._id === studentId ? { ...student, granted: newStatus } : student
      );
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      
      toast.success(`Student grant status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating grant status:', error);
      toast.error('Failed to update grant status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = async (e) => {
      try {
        const bufferArray = e.target.result;
        const wb = XLSX.read(bufferArray, { type: 'buffer' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        setLoading(true);
        await axios.post('/api/student-term-grant/upload', { 
          data,
          filterData 
        });
        toast.success('Data uploaded successfully');
        fetchStudents(); // Refresh the student list
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload file');
      } finally {
        setLoading(false);
        setFile(null);
        document.getElementById('fileUpload').value = '';
      }
    };
  };

  const handleDownloadExcel = async () => {
    if (filteredStudents.length === 0) {
      toast.error('No data available to download');
      return;
    }

    try {
      // Format data for Excel
      const formattedData = filteredStudents.map(student => ({
        'Student ID': student.studentId,
        'Student Name': student.studentName,
        'Granted': student.granted,
        'Institute': student.institute || filterData.instituteId,
        'Program': student.program || filterData.programId,
        'Year': student.year || filterData.year,
        'Term': student.term || filterData.term
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Student Term Grant');

      // Save file
      XLSX.writeFile(wb, 'student_term_grant.xlsx');
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Create template data
      const templateData = [
        {
          'Student ID': 'STU001',
          'Student Name': 'John Doe',
          'Granted': 'Yes'
        },
        {
          'Student ID': 'STU002',
          'Student Name': 'Jane Smith',
          'Granted': 'No'
        }
      ];

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // Save file
      XLSX.writeFile(wb, 'student_term_grant_template.xlsx');
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Term Grant</h1>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Filter Students</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
            <select
              name="instituteId"
              value={filterData.instituteId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Institute</option>
              {institutes.map(institute => (
                <option key={institute._id} value={institute._id}>
                  {institute.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select
              name="programId"
              value={filterData.programId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Program</option>
              {programs.map(program => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              name="year"
              value={filterData.year}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year._id} value={year.yearId}>
                  {year.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Eligibility (%)</label>
            <input
              type="number"
              name="minimumEligibility"
              value={filterData.minimumEligibility}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              min="0"
              max="100"
              placeholder="Enter minimum eligibility"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              name="term"
              value={filterData.term}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Term</option>
              {terms.map(term => (
                <option key={term._id} value={term._id}>
                  {term.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              disabled={loading}
            >
              <FaSearch className="mr-2" />
              {loading ? 'Searching...' : 'Search Students'}
            </button>
          </div>
        </div>
      </div>

      {/* Excel Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold">Excel Operations</h2>
            <p className="text-sm text-gray-600">Upload or download student term grant data</p>
          </div>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <div className="flex items-center">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 inline-block"
              >
                Select Excel File
              </label>
              <span className="ml-2 text-sm text-gray-600">
                {file ? file.name : 'No file selected'}
              </span>
            </div>
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading || filteredStudents.length === 0}
            >
              Download Data
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Granted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">
                  {students.length === 0 ? 'No students found. Please use the search filter above.' : 'No students match the current filter.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id || student.studentId}>
                  <td className="px-6 py-4 whitespace-nowrap">{student.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      student.granted === 'Yes' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.granted}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleGrantToggle(student._id || student.studentId, student.granted)}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        student.granted === 'Yes'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      disabled={loading}
                    >
                      {student.granted === 'Yes' ? 'Revoke Grant' : 'Grant Access'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
              <p className="text-2xl font-bold text-blue-600">{filteredStudents.length}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Granted</h3>
              <p className="text-2xl font-bold text-green-600">
                {filteredStudents.filter(s => s.granted === 'Yes').length}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Not Granted</h3>
              <p className="text-2xl font-bold text-red-600">
                {filteredStudents.filter(s => s.granted === 'No').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTermGrant;