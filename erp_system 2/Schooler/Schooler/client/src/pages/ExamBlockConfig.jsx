import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDownload, FaUpload, FaSearch, FaTrash, FaEdit, FaPlus } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ExamBlockConfig = () => {
  const [examCenters, setExamCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
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

  useEffect(() => {
    fetchExamCenters();
  }, []);

  const fetchExamCenters = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/manage-exam-centers');
      setExamCenters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching exam centers:', error);
      toast.error('Failed to fetch exam centers');
      setExamCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCenter) {
        const response = await axios.put(`/api/manage-exam-centers/${editingCenter._id}`, formData);
        toast.success('Exam center updated successfully');
      } else {
        const response = await axios.post('/api/manage-exam-centers', formData);
        toast.success('Exam center created successfully');
      }
      setShowModal(false);
      setEditingCenter(null);
      resetForm();
      fetchExamCenters();
    } catch (error) {
      console.error('Error saving exam center:', error);
      toast.error(error.response?.data?.message || 'Failed to save exam center');
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      examCenterId: center.examCenterId,
      examCenterName: center.examCenterName,
      examCenterAddress1: center.examCenterAddress1,
      examCenterAddress2: center.examCenterAddress2 || '',
      cityId: center.cityId,
      stateId: center.stateId,
      pin: center.pin,
      contactNumber: center.contactNumber,
      examParentInstituteId: center.examParentInstituteId,
      examParentInstituteName: center.examParentInstituteName,
      instituteId: center.instituteId,
      pastExamCenterId: center.pastExamCenterId || '',
      pastExamCenterName: center.pastExamCenterName || '',
      isActive: center.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam center?')) {
      try {
        await axios.delete(`/api/manage-exam-centers/${id}`);
        toast.success('Exam center deleted successfully');
        fetchExamCenters();
      } catch (error) {
        console.error('Error deleting exam center:', error);
        toast.error('Failed to delete exam center');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/manage-exam-centers/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(response.data.message || 'Exam centers uploaded successfully');
      fetchExamCenters();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        examCenterId: 'EXC001',
        examCenterName: 'Main Exam Center',
        examCenterAddress1: '123 Main Street',
        examCenterAddress2: 'Building A',
        cityId: 'CITY001',
        stateId: 'STATE001',
        pin: '123456',
        contactNumber: '1234567890',
        examParentInstituteId: 'INST001',
        examParentInstituteName: 'University Name',
        instituteId: 'INST001',
        pastExamCenterId: '',
        pastExamCenterName: '',
        isActive: 'Y'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(template);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'ExamCenters');
    xlsx.writeFile(workbook, 'exam_center_template.xlsx');
  };

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
  };

  const filteredCenters = examCenters.filter(center =>
    center.examCenterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.examCenterId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.examParentInstituteName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Exam Block Configuration</h1>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Exam Centers</h2>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Template</label>
            <button
              onClick={handleDownloadTemplate}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Template
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add New Center</label>
            <button
              onClick={() => { setEditingCenter(null); resetForm(); setShowModal(true); }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaPlus className="mr-2" /> Add Center
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Upload an Excel file with columns: examCenterId, examCenterName, examCenterAddress1, examCenterAddress2, cityId, stateId, pin, contactNumber, examParentInstituteId, examParentInstituteName, instituteId, pastExamCenterId, pastExamCenterName, isActive
        </p>
      </div>

      {/* Exam Centers List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exam Centers</h2>
          <input
            type="text"
            placeholder="Search by center name, ID, or institute..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Institute</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredCenters.length > 0 ? (
                filteredCenters.map((center) => (
                  <tr key={center._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{center.examCenterId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{center.examCenterName}</td>
                    <td className="px-6 py-4">
                      <div>{center.examCenterAddress1}</div>
                      {center.examCenterAddress2 && <div className="text-sm text-gray-600">{center.examCenterAddress2}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{center.cityId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{center.contactNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{center.examParentInstituteName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        center.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {center.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(center)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(center._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No exam centers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCenter ? 'Edit Exam Center' : 'Add New Exam Center'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Center ID *</label>
                    <input
                      type="text"
                      name="examCenterId"
                      value={formData.examCenterId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                      disabled={!!editingCenter}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Center Name *</label>
                    <input
                      type="text"
                      name="examCenterName"
                      value={formData.examCenterName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      name="examCenterAddress1"
                      value={formData.examCenterAddress1}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      name="examCenterAddress2"
                      value={formData.examCenterAddress2}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City ID *</label>
                    <input
                      type="text"
                      name="cityId"
                      value={formData.cityId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State ID *</label>
                    <input
                      type="text"
                      name="stateId"
                      value={formData.stateId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Institute ID *</label>
                    <input
                      type="text"
                      name="examParentInstituteId"
                      value={formData.examParentInstituteId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Institute Name *</label>
                    <input
                      type="text"
                      name="examParentInstituteName"
                      value={formData.examParentInstituteName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institute ID *</label>
                    <input
                      type="text"
                      name="instituteId"
                      value={formData.instituteId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Past Center ID</label>
                    <input
                      type="text"
                      name="pastExamCenterId"
                      value={formData.pastExamCenterId}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Past Center Name</label>
                    <input
                      type="text"
                      name="pastExamCenterName"
                      value={formData.pastExamCenterName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingCenter ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBlockConfig;