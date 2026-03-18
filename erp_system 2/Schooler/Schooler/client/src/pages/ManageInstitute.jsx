import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ManageInstitute = () => {
  const [institutes, setInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    instituteId: '',
    instituteName: '',
    instituteCertificationNumber: '',
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchInstitutes();
  }, []);

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
        await axios.put(`http://localhost:5000/api/institutes/${currentId}`, formData);
        toast.success('Institute updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/institutes', formData);
        toast.success('Institute added successfully');
      }
      resetForm();
      fetchInstitutes();
    } catch (error) {
      console.error('Error saving institute:', error);
      toast.error('Failed to save institute');
    }
  };

  const handleEdit = (institute) => {
    setFormData({
      instituteId: institute.instituteId,
      instituteName: institute.instituteName,
      instituteCertificationNumber: institute.instituteCertificationNumber,
      active: institute.active
    });
    setIsEditing(true);
    setCurrentId(institute._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this institute?')) {
      try {
        await axios.delete(`http://localhost:5000/api/institutes/${id}`);
        toast.success('Institute deleted successfully');
        fetchInstitutes();
      } catch (error) {
        console.error('Error deleting institute:', error);
        toast.error('Failed to delete institute');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      instituteId: '',
      instituteName: '',
      instituteCertificationNumber: '',
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
      await axios.post('http://localhost:5000/api/institutes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel data uploaded successfully');
      fetchInstitutes();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const filteredInstitutes = institutes.filter(institute =>
    institute.instituteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institute.instituteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institute.instituteCertificationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Institute / Manage Stream</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Institute</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Institute ID</label>
              <input
                type="text"
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Institute ID"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Institute Name</label>
              <input
                type="text"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Institute Name"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Institute Certification Number</label>
              <input
                type="text"
                name="instituteCertificationNumber"
                value={formData.instituteCertificationNumber}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Certification Number"
                required
              />
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
          <h2 className="text-xl font-semibold">Institutes</h2>
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
                <th className="py-2 px-4 border-b text-left">INSTITUTE ID</th>
                <th className="py-2 px-4 border-b text-left">INSTITUTE NAME</th>
                <th className="py-2 px-4 border-b text-left">CERTIFICATION NUMBER</th>
                <th className="py-2 px-4 border-b text-left">STATUS</th>
                <th className="py-2 px-4 border-b text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstitutes.map((institute) => (
                <tr key={institute._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{institute.instituteId}</td>
                  <td className="py-2 px-4 border-b">{institute.instituteName}</td>
                  <td className="py-2 px-4 border-b">{institute.instituteCertificationNumber}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${institute.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {institute.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(institute)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(institute._id)}
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

export default ManageInstitute;