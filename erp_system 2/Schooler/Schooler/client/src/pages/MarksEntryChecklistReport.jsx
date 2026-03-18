import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaUpload, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function MarksEntryChecklistReport() {
  const [checklistData, setChecklistData] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/marks-entry-checklist');
        setChecklistData(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching checklist data:', error);
        toast.error('Failed to fetch checklist data');
        setChecklistData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.get('/api/marks-entry-checklist', { params: formData });
      setChecklistData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error searching checklist data:', error);
      toast.error('Failed to search checklist data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      setLoading(true);
      await axios.post('/api/marks-entry-checklist/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      
      const response = await axios.get('/api/marks-entry-checklist');
      setChecklistData(Array.isArray(response.data) ? response.data : []);
      
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    try {
      const response = await axios.get('/api/marks-entry-checklist/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marks_entry_checklist.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const filteredData = checklistData.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Marks Entry Checklist Report</h1>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaDownload className="mr-2" /> Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Exam Fee</h2>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Institute ID</label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                placeholder="Enter Institute ID"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 2023-24"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program Name</label>
              <input
                type="text"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                placeholder="Enter Program Name"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-4">Fee Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="proctor"
                value={formData.proctor}
                onChange={handleChange}
                placeholder="e.g. Regular/Backlog"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="text"
                name="student"
                value={formData.student}
                onChange={handleChange}
                placeholder="Enter Amount"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
              >
                <FaSearch className="mr-2" /> Add
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Excel</h2>
        <form onSubmit={handleExcelUpload}>
          <div className="flex items-center">
            <input
              type="file"
              id="fileInput"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded ml-4 flex items-center"
            >
              <FaUpload className="mr-2" /> Upload Excel
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exam Fees</h2>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Student</th>
                <th className="py-2 px-4 border-b">Admit Card</th>
                <th className="py-2 px-4 border-b">Roll</th>
                <th className="py-2 px-4 border-b">% Division Marks</th>
                <th className="py-2 px-4 border-b">% Locked Identity</th>
                <th className="py-2 px-4 border-b">% Verified Identity</th>
                <th className="py-2 px-4 border-b">Deviation</th>
                <th className="py-2 px-4 border-b">Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading...</td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{item.student}</td>
                    <td className="py-2 px-4 border-b">{item.admitCard}</td>
                    <td className="py-2 px-4 border-b">{item.roll}</td>
                    <td className="py-2 px-4 border-b">{item.divisionMarks}</td>
                    <td className="py-2 px-4 border-b">{item.lockedIdentity}</td>
                    <td className="py-2 px-4 border-b">{item.verifiedIdentity}</td>
                    <td className="py-2 px-4 border-b">{item.deviation}</td>
                    <td className="py-2 px-4 border-b">{item.score}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No exam fees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MarksEntryChecklistReport;