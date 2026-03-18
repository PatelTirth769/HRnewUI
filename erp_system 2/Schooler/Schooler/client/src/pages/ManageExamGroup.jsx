import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaSearch, FaFileExcel, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ManageExamGroup = () => {
  const [formData, setFormData] = useState({
    groupName: '',
    year: '',
    specialization: '',
    specializations: [],
    courses: [],
    isActive: true
  });
  
  const [years, setYears] = useState([]);
  const [examGroups, setExamGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [file, setFile] = useState(null);

  // Fetch years and exam groups on component mount
  useEffect(() => {
    fetchYears();
    fetchExamGroups();
  }, []);

  // Fetch years from API
  const fetchYears = async () => {
    try {
      const response = await axios.get('/api/year-configurations');
      if (Array.isArray(response.data)) {
        setYears(response.data);
      } else {
        setYears([]);
        console.error('Years data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      toast.error('Failed to fetch years');
    }
  };

  // Fetch exam groups from API
  const fetchExamGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/exam-groups');
      if (Array.isArray(response.data)) {
        setExamGroups(response.data);
      } else {
        setExamGroups([]);
        console.error('Exam groups data is not an array:', response.data);
      }
    } catch (error) {
      console.error('Error fetching exam groups:', error);
      toast.error('Failed to fetch exam groups');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Add a new specialization to the specializations array
  const handleAddSpecialization = () => {
    if (newSpecialization.trim()) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, newSpecialization.trim()]
      });
      setNewSpecialization('');
    }
  };

  // Remove a specialization from the specializations array
  const handleRemoveSpecialization = (index) => {
    const updatedSpecializations = [...formData.specializations];
    updatedSpecializations.splice(index, 1);
    setFormData({
      ...formData,
      specializations: updatedSpecializations
    });
  };

  // Add a new course to the courses array
  const handleAddCourse = () => {
    if (newCourse.trim()) {
      setFormData({
        ...formData,
        courses: [...formData.courses, newCourse.trim()]
      });
      setNewCourse('');
    }
  };

  // Remove a course from the courses array
  const handleRemoveCourse = (index) => {
    const updatedCourses = [...formData.courses];
    updatedCourses.splice(index, 1);
    setFormData({
      ...formData,
      courses: updatedCourses
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (editMode) {
        await axios.put(`/api/exam-groups/${currentId}`, formData);
        toast.success('Exam group updated successfully');
      } else {
        await axios.post('/api/exam-groups', formData);
        toast.success('Exam group created successfully');
      }
      
      resetForm();
      fetchExamGroups();
    } catch (error) {
      console.error('Error saving exam group:', error);
      toast.error('Failed to save exam group');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (examGroup) => {
    setFormData({
      groupName: examGroup.groupName,
      year: examGroup.year._id,
      specialization: '',
      specializations: examGroup.specializations || [],
      courses: examGroup.courses || [],
      isActive: examGroup.isActive
    });
    setEditMode(true);
    setCurrentId(examGroup._id);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam group?')) {
      try {
        await axios.delete(`/api/exam-groups/${id}`);
        toast.success('Exam group deleted successfully');
        fetchExamGroups();
      } catch (error) {
        console.error('Error deleting exam group:', error);
        toast.error('Failed to delete exam group');
      }
    }
  };

  // Handle toggle active status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/exam-groups/${id}/toggle-status`);
      toast.success(`Exam group ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchExamGroups();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle file change for Excel upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle Excel file upload
  const handleUploadExcel = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      await axios.post('/api/exam-groups/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      setFile(null);
      fetchExamGroups();
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      groupName: '',
      year: '',
      specialization: '',
      specializations: [],
      courses: [],
      isActive: true
    });
    setEditMode(false);
    setCurrentId(null);
    setNewCourse('');
    setNewSpecialization('');
  };

  // Filter exam groups based on search term
  const filteredExamGroups = examGroups.filter(group => 
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.year && group.year.year && group.year.year.toLowerCase().includes(searchTerm.toLowerCase())) ||
    group.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Exam Group</h1>
      
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Exam Group' : 'Add Exam Group'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year._id} value={year._id}>
                    {year.year}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="specialization"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-l-md"
                  placeholder="Add a specialization"
                />
                <button
                  type="button"
                  onClick={handleAddSpecialization}
                  className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.specializations.map((spec, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialization(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Yes/No</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Courses</label>
            <div className="flex items-center">
              <input
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l-md"
                placeholder="Add a course"
              />
              <button
                type="button"
                onClick={handleAddCourse}
                className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600"
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.courses.map((course, index) => (
                <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                  <span>{course}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : editMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Excel Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Excel</h2>
        
        <form onSubmit={handleUploadExcel} className="flex items-center space-x-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="flex-grow p-2 border border-gray-300 rounded-md"
            accept=".xlsx, .xls"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            disabled={loading || !file}
          >
            <FaFileExcel className="mr-2" />
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
      
      {/* Data Table Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exam Groups</h2>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 p-2 border border-gray-300 rounded-md"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExamGroups.length > 0 ? (
                  filteredExamGroups.map((examGroup) => (
                    <tr key={examGroup._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{examGroup.groupName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{examGroup.year ? examGroup.year.year : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{examGroup.specialization}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {examGroup.courses && examGroup.courses.map((course, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                              {course}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(examGroup._id, examGroup.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            examGroup.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {examGroup.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(examGroup)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(examGroup._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      No exam groups found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageExamGroup;