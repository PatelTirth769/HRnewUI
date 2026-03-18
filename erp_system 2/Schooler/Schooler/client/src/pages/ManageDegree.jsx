import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ManageDegree = () => {
  const [degrees, setDegrees] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    degreeId: '',
    degreeName: '',
    specialization: '',
    parentDegree: '',
    instituteId: '',
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchDegrees();
    fetchInstitutes();
  }, []);

  const fetchDegrees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/degrees');
      setDegrees(response.data);
    } catch (error) {
      console.error('Error fetching degrees:', error);
      toast.error('Failed to fetch degrees');
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/institutes');
      setInstitutes(response.data);
    } catch (error) {
      console.error('Error fetching institutes:', error);
      toast.error('Failed to fetch institutes');
    }
  };

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
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/degrees/${currentId}`, formData);
        toast.success('Degree updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/degrees', formData);
        toast.success('Degree added successfully');
      }
      resetForm();
      fetchDegrees();
    } catch (error) {
      console.error('Error saving degree:', error);
      toast.error('Failed to save degree');
    }
  };

  const handleEdit = (degree) => {
    setFormData({
      degreeId: degree.degreeId,
      degreeName: degree.degreeName,
      specialization: degree.specialization,
      parentDegree: degree.parentDegree,
      instituteId: degree.instituteId,
      active: degree.active
    });
    setIsEditing(true);
    setCurrentId(degree._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this degree?')) {
      try {
        await axios.delete(`http://localhost:5000/api/degrees/${id}`);
        toast.success('Degree deleted successfully');
        fetchDegrees();
      } catch (error) {
        console.error('Error deleting degree:', error);
        toast.error('Failed to delete degree');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      degreeId: '',
      degreeName: '',
      specialization: '',
      parentDegree: '',
      instituteId: '',
      active: true
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5000/api/degrees/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel data uploaded successfully');
      fetchDegrees();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const filteredDegrees = degrees.filter(degree =>
    degree.degreeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    degree.degreeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    degree.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Degree</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Degree</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Degree ID</label>
              <input
                type="text"
                name="degreeId"
                value={formData.degreeId}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Degree ID"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Degree Name</label>
              <input
                type="text"
                name="degreeName"
                value={formData.degreeName}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Degree Name"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Specialization"
              />
            </div>
            <div>
              <label className="block mb-2">Parent Degree</label>
              <input
                type="text"
                name="parentDegree"
                value={formData.parentDegree}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Parent Degree"
              />
            </div>
            <div>
              <label className="block mb-2">Institute ID</label>
              <select
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="">Select Institute</option>
                {institutes.map(institute => (
                  <option key={institute._id} value={institute.instituteId}>
                    {institute.instituteName} ({institute.instituteId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center mt-8">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Active</label>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Degrees</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-md p-2"
              />
            </div>
            <div className="relative">
              <label htmlFor="fileUpload" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-md flex items-center">
                <span>Upload Excel</span>
              </label>
              <input
                id="fileUpload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md">
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">DEGREE ID</th>
                <th className="py-2 px-4 border-b text-left">DEGREE NAME</th>
                <th className="py-2 px-4 border-b text-left">SPECIALIZATION</th>
                <th className="py-2 px-4 border-b text-left">PARENT DEGREE</th>
                <th className="py-2 px-4 border-b text-left">INSTITUTE ID</th>
                <th className="py-2 px-4 border-b text-left">STATUS</th>
                <th className="py-2 px-4 border-b text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredDegrees.map((degree) => (
                <tr key={degree._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{degree.degreeId}</td>
                  <td className="py-2 px-4 border-b">{degree.degreeName}</td>
                  <td className="py-2 px-4 border-b">{degree.specialization}</td>
                  <td className="py-2 px-4 border-b">{degree.parentDegree}</td>
                  <td className="py-2 px-4 border-b">{degree.instituteId}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${degree.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {degree.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(degree)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(degree._id)}
                        className="text-red-600 hover:text-red-800"
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
      </div>
    </div>
  );
};

export default ManageDegree;