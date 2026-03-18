import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function ManageBacklogNorms() {
  const [backlogNorms, setBacklogNorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('course');
  const [formData, setFormData] = useState({
    level: 'course',
    name: '',
    minimumEligibility: '',
    active: true,
    startDate: '',
    endDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Fetch backlog norms data when component mounts
    const fetchBacklogNorms = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/backlog-norms');
        setBacklogNorms(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching backlog norms:', error);
        toast.error('Failed to fetch backlog norms');
        setBacklogNorms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBacklogNorms();
  }, []);

  // Handle level change
  const handleLevelChange = (e) => {
    const level = e.target.value;
    setSelectedLevel(level);
    setFormData({
      ...formData,
      level: level,
      name: '' // Reset name when level changes
    });
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.minimumEligibility || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        // Update existing backlog norm
        await axios.put(`/api/backlog-norms/${currentId}`, formData);
        toast.success('Backlog norm updated successfully');
      } else {
        // Create new backlog norm
        await axios.post('/api/backlog-norms', formData);
        toast.success('Backlog norm added successfully');
      }

      // Refresh backlog norms data
      const response = await axios.get('/api/backlog-norms');
      setBacklogNorms(Array.isArray(response.data) ? response.data : []);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving backlog norm:', error);
      toast.error('Failed to save backlog norm');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit backlog norm
  const handleEdit = (norm) => {
    setIsEditing(true);
    setCurrentId(norm._id);
    setSelectedLevel(norm.level);
    setFormData({
      level: norm.level,
      name: norm.name,
      minimumEligibility: norm.minimumEligibility,
      active: norm.active,
      startDate: norm.startDate ? norm.startDate.split('T')[0] : '',
      endDate: norm.endDate ? norm.endDate.split('T')[0] : ''
    });
  };

  // Handle delete backlog norm
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this backlog norm?')) {
      try {
        await axios.delete(`/api/backlog-norms/${id}`);
        toast.success('Backlog norm deleted successfully');
        
        // Refresh backlog norms data
        const response = await axios.get('/api/backlog-norms');
        setBacklogNorms(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error deleting backlog norm:', error);
        toast.error('Failed to delete backlog norm');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      level: selectedLevel,
      name: '',
      minimumEligibility: '',
      active: true,
      startDate: '',
      endDate: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  // Handle file change for Excel upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle Excel upload
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
      await axios.post('/api/backlog-norms/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      
      // Refresh backlog norms data
      const response = await axios.get('/api/backlog-norms');
      setBacklogNorms(Array.isArray(response.data) ? response.data : []);
      
      // Reset file input
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel download
  const handleExcelDownload = async () => {
    try {
      const response = await axios.get('/api/backlog-norms/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'backlog_norms.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      toast.error('Failed to download Excel file');
    }
  };

  // Sample data for demonstration
  const sampleData = [
    {
      _id: '1',
      level: 'course',
      name: 'M.Tech',
      minimumEligibility: 'B.Tech',
      active: true,
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    },
    {
      _id: '2',
      level: 'course',
      name: 'MBA',
      minimumEligibility: 'Bachelor\'s Degree',
      active: true,
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    },
    {
      _id: '3',
      level: 'program',
      name: 'Computer Science',
      minimumEligibility: 'Mathematics',
      active: false,
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Backlog Norms</h1>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaDownload className="mr-2" /> Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Backlog Norm' : 'Add Backlog Norm'}
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Level</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="level"
                value="course"
                checked={selectedLevel === 'course'}
                onChange={handleLevelChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Course Level</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="level"
                value="program"
                checked={selectedLevel === 'program'}
                onChange={handleLevelChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Program Level</span>
            </label>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {selectedLevel === 'course' ? 'Course Name' : 'Program Name'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder={selectedLevel === 'course' ? 'e.g. M.Tech' : 'e.g. Computer Science'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Eligibility</label>
              <input
                type="text"
                name="minimumEligibility"
                value={formData.minimumEligibility}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g. B.Tech"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Active</label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Excel</h2>
        </div>
        <form onSubmit={handleExcelUpload} className="flex items-center space-x-4">
          <div className="flex-grow">
            <input
              id="fileInput"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            disabled={loading || !file}
          >
            <FaUpload className="mr-2" /> Upload Excel
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Backlog Norms</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search..."
              className="p-2 border rounded"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course/Program Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minimum Eligibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Use sample data for demonstration, replace with actual data in production */}
                {(backlogNorms.length > 0 ? backlogNorms : sampleData).map((norm) => (
                  <tr key={norm._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {norm.level} Level
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {norm.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {norm.minimumEligibility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${norm.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {norm.active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(norm.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(norm.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(norm)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(norm._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageBacklogNorms;