import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaUpload, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function InternalPracticalMarksEntryLock() {
  const [marksLockEntries, setMarksLockEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    institute: '',
    program: '',
    semester: '',
    subject: '',
    examDate: '',
    examType: '',
    lockDate: '',
    applyToAll: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMarksLockEntries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/marks-lock-entries');
        setMarksLockEntries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching marks lock entries:', error);
        toast.error('Failed to fetch marks lock entries');
        setMarksLockEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarksLockEntries();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if (isEditing) {
        await axios.put(`/api/marks-lock-entries/${currentId}`, formData);
        toast.success('Marks lock entry updated successfully');
      } else {
        await axios.post('/api/marks-lock-entries', formData);
        toast.success('Marks lock entry added successfully');
      }

      const response = await axios.get('/api/marks-lock-entries');
      setMarksLockEntries(Array.isArray(response.data) ? response.data : []);
      
      resetForm();
    } catch (error) {
      console.error('Error saving marks lock entry:', error);
      toast.error('Failed to save marks lock entry');
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
      examDate: entry.examDate,
      examType: entry.examType,
      lockDate: entry.lockDate,
      applyToAll: false
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this marks lock entry?')) {
      try {
        await axios.delete(`/api/marks-lock-entries/${id}`);
        toast.success('Marks lock entry deleted successfully');
        
        const response = await axios.get('/api/marks-lock-entries');
        setMarksLockEntries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error deleting marks lock entry:', error);
        toast.error('Failed to delete marks lock entry');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      institute: '',
      program: '',
      semester: '',
      subject: '',
      examDate: '',
      examType: '',
      lockDate: '',
      applyToAll: false
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

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      setLoading(true);
      await axios.post('/api/marks-lock-entries/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      
      const response = await axios.get('/api/marks-lock-entries');
      setMarksLockEntries(Array.isArray(response.data) ? response.data : []);
      
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
      const response = await axios.get('/api/marks-lock-entries/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'marks_lock_entries.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const filteredEntries = marksLockEntries.filter(entry =>
    Object.values(entry).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Internal/Practical Marks Entry Lock</h1>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaDownload className="mr-2" /> Download
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Marks Lock Entry' : 'Add Marks Lock Entry'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="applyToAll"
              name="applyToAll"
              checked={formData.applyToAll}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="applyToAll">Apply to all</label>
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Locked Marks Entries</h2>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded"
            />
            <FaSearch className="ml-2 text-gray-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Institute</th>
                <th className="py-2 px-4 border-b">Program</th>
                <th className="py-2 px-4 border-b">Semester</th>
                <th className="py-2 px-4 border-b">Subject</th>
                <th className="py-2 px-4 border-b">Exam Date</th>
                <th className="py-2 px-4 border-b">Exam Type</th>
                <th className="py-2 px-4 border-b">Lock Date</th>
                <th className="py-2 px-4 border-b">Locked?</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">Loading...</td>
                </tr>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="py-2 px-4 border-b">{entry.institute}</td>
                    <td className="py-2 px-4 border-b">{entry.program}</td>
                    <td className="py-2 px-4 border-b">{entry.semester}</td>
                    <td className="py-2 px-4 border-b">{entry.subject}</td>
                    <td className="py-2 px-4 border-b">{entry.examDate}</td>
                    <td className="py-2 px-4 border-b">{entry.examType}</td>
                    <td className="py-2 px-4 border-b">{entry.lockDate}</td>
                    <td className="py-2 px-4 border-b">{entry.isLocked ? 'Yes' : 'No'}</td>
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
                  <td colSpan="9" className="text-center py-4">No entries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InternalPracticalMarksEntryLock;