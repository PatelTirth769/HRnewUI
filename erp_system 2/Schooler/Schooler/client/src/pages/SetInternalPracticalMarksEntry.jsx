import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function SetInternalPracticalMarksEntry() {
  const [marksEntries, setMarksEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    institute: '',
    program: '',
    semester: '',
    subject: '',
    studentName: '',
    examDate: '',
    examMaking: '',
    examType: '',
    year: '',
    scanner: '',
    marks: {
      scored: '',
      outOf: ''
    },
    addDate: '',
    lockDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchMarksEntries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/marks-entries');
        setMarksEntries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching marks entries:', error);
        toast.error('Failed to fetch marks entries');
        setMarksEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarksEntries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'scored' || name === 'outOf') {
      setFormData({
        ...formData,
        marks: {
          ...formData.marks,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (isEditing) {
        await axios.put(`/api/marks-entries/${currentId}`, formData);
        toast.success('Marks entry updated successfully');
      } else {
        await axios.post('/api/marks-entries', formData);
        toast.success('Marks entry added successfully');
      }

      const response = await axios.get('/api/marks-entries');
      setMarksEntries(Array.isArray(response.data) ? response.data : []);
      
      resetForm();
    } catch (error) {
      console.error('Error saving marks entry:', error);
      toast.error('Failed to save marks entry');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setIsEditing(true);
    setCurrentId(entry._id);
    setFormData({
      institute: entry.institute,
      program: entry.program,
      semester: entry.semester,
      subject: entry.subject,
      studentName: entry.studentName,
      examDate: entry.examDate,
      examMaking: entry.examMaking,
      examType: entry.examType,
      year: entry.year,
      scanner: entry.scanner,
      marks: {
        scored: entry.marks.scored,
        outOf: entry.marks.outOf
      },
      addDate: entry.addDate,
      lockDate: entry.lockDate
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this marks entry?')) {
      try {
        await axios.delete(`/api/marks-entries/${id}`);
        toast.success('Marks entry deleted successfully');
        
        const response = await axios.get('/api/marks-entries');
        setMarksEntries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error deleting marks entry:', error);
        toast.error('Failed to delete marks entry');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      institute: '',
      program: '',
      semester: '',
      subject: '',
      studentName: '',
      examDate: '',
      examMaking: '',
      examType: '',
      year: '',
      scanner: '',
      marks: {
        scored: '',
        outOf: ''
      },
      addDate: '',
      lockDate: ''
    });
    setIsEditing(false);
    setCurrentId(null);
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post('/api/marks-entries/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      
      const response = await axios.get('/api/marks-entries');
      setMarksEntries(Array.isArray(response.data) ? response.data : []);
      
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
      const response = await axios.get('/api/marks-entries/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marks_entries.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Set Internal/Practical Marks Entry</h1>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaDownload className="mr-2" /> Download
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Marks Entry' : 'Add Marks Entry'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Institute</label>
              <input
                type="text"
                name="institute"
                value={formData.institute}
                onChange={handleChange}
                placeholder="Institute"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="Program"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="Semester"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Student Name</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Student Name"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam Date</label>
              <input
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam Making</label>
              <input
                type="text"
                name="examMaking"
                value={formData.examMaking}
                onChange={handleChange}
                placeholder="Exam Making"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Exam Type</label>
              <input
                type="text"
                name="examType"
                value={formData.examType}
                onChange={handleChange}
                placeholder="Exam Type"
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
                placeholder="Year"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Scanner</label>
              <input
                type="text"
                name="scanner"
                value={formData.scanner}
                onChange={handleChange}
                placeholder="Scanner"
                className="border p-2 rounded w-full mt-1"
              />
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Marks Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scored</label>
                <input
                  type="number"
                  name="scored"
                  value={formData.marks.scored}
                  onChange={handleChange}
                  placeholder="Scored"
                  className="border p-2 rounded w-full mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Out Of</label>
                <input
                  type="number"
                  name="outOf"
                  value={formData.marks.outOf}
                  onChange={handleChange}
                  placeholder="Out Of"
                  className="border p-2 rounded w-full mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Add Date</label>
                <input
                  type="date"
                  name="addDate"
                  value={formData.addDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lock Date</label>
                <input
                  type="date"
                  name="lockDate"
                  value={formData.lockDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full mt-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white px-4 py-2 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {isEditing ? 'Update' : 'Save'}
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
              className="bg-blue-600 text-white px-4 py-2 rounded ml-2 flex items-center"
            >
              <FaUpload className="mr-2" /> Upload Excel
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Marks Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Institute</th>
                <th className="py-2 px-4 border-b">Program</th>
                <th className="py-2 px-4 border-b">Semester</th>
                <th className="py-2 px-4 border-b">Subject</th>
                <th className="py-2 px-4 border-b">Student Name</th>
                <th className="py-2 px-4 border-b">Exam Date</th>
                <th className="py-2 px-4 border-b">Exam Making</th>
                <th className="py-2 px-4 border-b">Exam Type</th>
                <th className="py-2 px-4 border-b">Year</th>
                <th className="py-2 px-4 border-b">Scored</th>
                <th className="py-2 px-4 border-b">Out Of</th>
                <th className="py-2 px-4 border-b">Add Date</th>
                <th className="py-2 px-4 border-b">Lock Date</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-4">Loading...</td>
                </tr>
              ) : marksEntries.length > 0 ? (
                marksEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="py-2 px-4 border-b">{entry.institute}</td>
                    <td className="py-2 px-4 border-b">{entry.program}</td>
                    <td className="py-2 px-4 border-b">{entry.semester}</td>
                    <td className="py-2 px-4 border-b">{entry.subject}</td>
                    <td className="py-2 px-4 border-b">{entry.studentName}</td>
                    <td className="py-2 px-4 border-b">{entry.examDate}</td>
                    <td className="py-2 px-4 border-b">{entry.examMaking}</td>
                    <td className="py-2 px-4 border-b">{entry.examType}</td>
                    <td className="py-2 px-4 border-b">{entry.year}</td>
                    <td className="py-2 px-4 border-b">{entry.marks.scored}</td>
                    <td className="py-2 px-4 border-b">{entry.marks.outOf}</td>
                    <td className="py-2 px-4 border-b">{entry.addDate}</td>
                    <td className="py-2 px-4 border-b">{entry.lockDate}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4">No marks entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SetInternalPracticalMarksEntry;