import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaUpload, FaFileExport } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ManageExamCenter = () => {
  const [examCenters, setExamCenters] = useState([]);
  const [formData, setFormData] = useState({
    examCenterId: '',
    examCenterName: '',
    examCenterAddress1: '',
    examCenterAddress2: '',
    cityId: '',
    stateId: '',
    pin: '',
    contactNumber: '',
    examParentInstituteId: '',
    examParentInstituteName: '',
    instituteId: '',
    pastExamCenterId: '',
    pastExamCenterName: '',
    isActive: true
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch all exam centers
  const fetchExamCenters = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/manage-exam-center');
      setExamCenters(response.data);
      toast.success('Exam centers loaded successfully');
    } catch (error) {
      console.error('Error fetching exam centers:', error);
      toast.error('Failed to load exam centers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamCenters();
  }, []);

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
    setLoading(true);
    
    // Validate required fields
    const requiredFields = [
      'examCenterId', 'examCenterName', 'examCenterAddress1',
      'cityId', 'stateId', 'pin', 'contactNumber',
      'examParentInstituteId', 'examParentInstituteName', 'instituteId'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }
    
    try {
      if (editMode) {
        await axios.put(`http://localhost:5001/api/manage-exam-center/${currentId}`, formData);
        toast.success('Exam center updated successfully');
      } else {
        await axios.post('http://localhost:5001/api/manage-exam-center', formData);
        toast.success('Exam center added successfully');
      }
      resetForm();
      fetchExamCenters();
    } catch (error) {
      console.error('Error saving exam center:', error);
      toast.error(error.response?.data?.message || 'Error saving exam center');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (examCenter) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFormData({
      examCenterId: examCenter.examCenterId,
      examCenterName: examCenter.examCenterName,
      examCenterAddress1: examCenter.examCenterAddress1,
      examCenterAddress2: examCenter.examCenterAddress2 || '',
      cityId: examCenter.cityId,
      stateId: examCenter.stateId,
      pin: examCenter.pin,
      contactNumber: examCenter.contactNumber,
      examParentInstituteId: examCenter.examParentInstituteId,
      examParentInstituteName: examCenter.examParentInstituteName,
      instituteId: examCenter.instituteId,
      pastExamCenterId: examCenter.pastExamCenterId || '',
      pastExamCenterName: examCenter.pastExamCenterName || '',
      isActive: examCenter.isActive
    });
    setEditMode(true);
    setCurrentId(examCenter._id);
    toast.info('Editing exam center - make changes and click Update');
  };

  // Handle delete (soft delete)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam center?')) {
      return;
    }
    
    setDeleteLoading(id);
    try {
      await axios.delete(`http://localhost:5001/api/manage-exam-center/${id}`);
      toast.success('Exam center deleted successfully');
      fetchExamCenters();
    } catch (error) {
      console.error('Error deleting exam center:', error);
      toast.error('Failed to delete exam center');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      examCenterId: '',
      examCenterName: '',
      examCenterAddress1: '',
      examCenterAddress2: '',
      cityId: '',
      stateId: '',
      pin: '',
      contactNumber: '',
      examParentInstituteId: '',
      examParentInstituteName: '',
      instituteId: '',
      pastExamCenterId: '',
      pastExamCenterName: '',
      isActive: true
    });
    setEditMode(false);
    setCurrentId(null);
  };

  // Handle file change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      toast.info('File selected. Click Upload to process.');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload only Excel files (.xlsx or .xls)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/manage-exam-center/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`File uploaded successfully! ${response.data.successCount} records processed.`);
      
      if (response.data.errorCount > 0) {
        toast.warning(`${response.data.errorCount} records had errors. Check console for details.`);
        console.log('Upload errors:', response.data.errors);
      }
      
      fetchExamCenters();
      setFile(null);
      // Reset file input
      document.getElementById('fileUpload').value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploadLoading(false);
    }
  };

  // Filter exam centers based on search term
  const filteredExamCenters = examCenters.filter(center => 
    center.examCenterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.examCenterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Exam Center / Manage Stream</h1>
        <div className="flex items-center">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => document.getElementById('fileUpload').click()}
            disabled={uploadLoading}
          >
            <FaUpload className="mr-2" /> Upload Excel
          </button>
          <input
            id="fileUpload"
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploadLoading}
          />
          {file && (
            <button 
              className={`${uploadLoading ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-700'} text-white font-bold py-2 px-4 rounded ml-2 flex items-center`}
              onClick={handleFileUpload}
              disabled={uploadLoading}
            >
              {uploadLoading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Exam Center Form */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Exam Center' : 'Add Exam Center'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Exam Center ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="examCenterId"
              value={formData.examCenterId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Exam Center ID"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Exam Center Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="examCenterName"
              value={formData.examCenterName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Exam Center Name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Address Line 1 <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="examCenterAddress1"
              value={formData.examCenterAddress1}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Address Line 1"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Address Line 2</label>
            <input
              type="text"
              name="examCenterAddress2"
              value={formData.examCenterAddress2}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Address Line 2"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">City ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter City ID"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">State ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="stateId"
              value={formData.stateId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter State ID"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">PIN <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter PIN"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Contact Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Contact Number"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Parent Institute ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="examParentInstituteId"
              value={formData.examParentInstituteId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Parent Institute ID"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Parent Institute Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="examParentInstituteName"
              value={formData.examParentInstituteName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Parent Institute Name"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Institute ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="instituteId"
              value={formData.instituteId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Institute ID"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Past Exam Center ID</label>
            <input
              type="text"
              name="pastExamCenterId"
              value={formData.pastExamCenterId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Past Exam Center ID"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Past Exam Center Name</label>
            <input
              type="text"
              name="pastExamCenterName"
              value={formData.pastExamCenterName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter Past Exam Center Name"
              disabled={loading}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="isActive" className="text-gray-700 text-sm font-bold">Active</label>
          </div>
          <div className="col-span-2 flex justify-end mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center min-w-[80px] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Saving...' : editMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Exam Centers Table */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exam Centers</h2>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center"
              onClick={() => exportToExcel(filteredExamCenters)}
              disabled={loading}
            >
              <FaFileExport className="mr-2" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading && filteredExamCenters.length === 0 ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2">Loading exam centers...</p>
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Exam Center ID
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Exam Center Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Institute ID
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    City
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    State
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExamCenters.map((center) => (
                  <tr key={center._id}>
                    <td className="py-2 px-4 border-b border-gray-200">{center.examCenterId}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{center.examCenterName}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{center.instituteId}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{center.cityId}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{center.stateId}</td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${center.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {center.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <button
                        onClick={() => handleEdit(center)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        disabled={loading || deleteLoading === center._id}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(center._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading || deleteLoading === center._id}
                      >
                        {deleteLoading === center._id ? (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExamCenters.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-500">
                      No exam centers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExamCenter;