import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const SetAttendanceEligibility = () => {
  const [attendanceRules, setAttendanceRules] = useState([]);
const [filteredRules, setFilteredRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instituteId: '',
    programId: '',
    minimumEligibility: '',
    examId: '',
    active: 'Y',
    effectiveFrom: '',
    effectiveTo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [examTerms, setExamTerms] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedExamTerm, setSelectedExamTerm] = useState('');
  const [file, setFile] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchAttendanceRules();
    fetchInstitutes();
    fetchPrograms();
    fetchExamTerms();
    fetchYears();
  }, []);

  const fetchAttendanceRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/attendance-eligibility');
      // Ensure response.data is always an array
      setAttendanceRules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching attendance rules:', error);
      toast.error('Failed to fetch attendance rules');
      setAttendanceRules([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await axios.get('/api/institutes');
      // Ensure response.data is always an array
      setInstitutes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      setInstitutes([]); // Set empty array on error
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('/api/programs');
      // Ensure response.data is always an array
      setPrograms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]); // Set empty array on error
    }
  };

  const fetchExamTerms = async () => {
    try {
      const response = await axios.get('/api/exam-terms');
      // Ensure response.data is always an array
      setExamTerms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching exam terms:', error);
      setExamTerms([]); // Set empty array on error
    }
  };

  const fetchYears = async () => {
    try {
      const response = await axios.get('/api/manage-years');
      // Ensure response.data is always an array
      setYears(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching years:', error);
      setYears([]); // Set empty array on error
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleExamTermChange = (e) => {
    setSelectedExamTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Combine year and exam term to create examId
    const examId = `${selectedYear}_${selectedExamTerm}`;
    const submitData = { ...formData, examId };
    
    setLoading(true);
    try {
      if (isEditing) {
        await axios.put(`/api/attendance-eligibility/${currentId}`, submitData);
        toast.success('Attendance eligibility rule updated successfully');
      } else {
        await axios.post('/api/attendance-eligibility', submitData);
        toast.success('Attendance eligibility rule added successfully');
      }
      resetForm();
      fetchAttendanceRules();
    } catch (error) {
      console.error('Error saving attendance rule:', error);
      toast.error('Failed to save attendance rule');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setIsEditing(true);
    setCurrentId(rule._id);
    
    // Split examId to get year and exam term
    const [year, examTerm] = rule.examId.split('_');
    setSelectedYear(year);
    setSelectedExamTerm(examTerm);
    
    setFormData({
      instituteId: rule.instituteId,
      programId: rule.programId,
      minimumEligibility: rule.minimumEligibility,
      active: rule.active,
      effectiveFrom: rule.effectiveFrom.split('T')[0],
      effectiveTo: rule.effectiveTo.split('T')[0]
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      setLoading(true);
      try {
        await axios.delete(`/api/attendance-eligibility/${id}`);
        toast.success('Attendance eligibility rule deleted successfully');
        fetchAttendanceRules();
      } catch (error) {
        console.error('Error deleting rule:', error);
        toast.error('Failed to delete rule');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      instituteId: '',
      programId: '',
      minimumEligibility: '',
      examId: '',
      active: 'Y',
      effectiveFrom: '',
      effectiveTo: ''
    });
    setSelectedYear('');
    setSelectedExamTerm('');
    setIsEditing(false);
    setCurrentId(null);
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
        await axios.post('/api/attendance-eligibility/upload', { data });
        toast.success('Data uploaded successfully');
        fetchAttendanceRules();
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload file');
      } finally {
        setLoading(false);
        setFile(null);
        // Reset file input
        document.getElementById('fileUpload').value = '';
      }
    };
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get('/api/attendance-eligibility');
      const data = response.data;

      if (data.length === 0) {
        toast.error('No data available to download');
        return;
      }

      // Format data for Excel
      const formattedData = data.map(rule => ({
        'Institute ID': rule.instituteId,
        'Program ID': rule.programId,
        'Minimum Eligibility (%)': rule.minimumEligibility,
        'Exam ID': rule.examId,
        'Active': rule.active,
        'Effective From': new Date(rule.effectiveFrom).toLocaleDateString(),
        'Effective To': new Date(rule.effectiveTo).toLocaleDateString()
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Eligibility');

      // Save file
      XLSX.writeFile(wb, 'attendance_eligibility.xlsx');
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Set Attendance Eligibility</h1>

      {/* Form for adding/editing attendance eligibility rules */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Attendance Eligibility Rule' : 'Add Attendance Eligibility Rule'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute</label>
              <select
                name="instituteId"
                value={formData.instituteId}
                onChange={handleInputChange}
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
                value={formData.programId}
                onChange={handleInputChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Eligibility (%)</label>
              <input
                type="number"
                name="minimumEligibility"
                value={formData.minimumEligibility}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Term</label>
              <select
                value={selectedExamTerm}
                onChange={handleExamTermChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Exam Term</option>
                {examTerms.map(term => (
                  <option key={term._id} value={term._id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select
                name="active"
                value={formData.active}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
              <input
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective To</label>
              <input
                type="date"
                name="effectiveTo"
                value={formData.effectiveTo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Excel Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold">Excel Operations</h2>
            <p className="text-sm text-gray-600">Upload or download attendance eligibility data</p>
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
              disabled={loading}
            >
              Download Excel Template
            </button>
          </div>
        </div>
      </div>

      {/* Table to display attendance eligibility rules */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Eligibility (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : attendanceRules.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">No attendance eligibility rules found</td>
              </tr>
            ) : (
              attendanceRules.map((rule) => {
                // Find institute and program names
                const institute = institutes.find(i => i._id === rule.instituteId);
                const program = programs.find(p => p._id === rule.programId);
                
                return (
                  <tr key={rule._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{institute ? institute.name : rule.instituteId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{program ? program.name : rule.programId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rule.minimumEligibility}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rule.examId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{rule.active}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(rule.effectiveFrom).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(rule.effectiveTo).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SetAttendanceEligibility;