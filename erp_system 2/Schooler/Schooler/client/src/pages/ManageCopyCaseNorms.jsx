import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaToggleOn, FaToggleOff, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ManageCopyCaseNorms = () => {
  const [copyCaseNorms, setCopyCaseNorms] = useState([]);
  const [formData, setFormData] = useState({
    university: '',
    semester: '',
    exam: '',
    subject: '',
    copyCaseFee: '',
    lateFee: '',
    processingFee: '',
    totalFee: '',
    active: true,
    effectiveFrom: '',
    effectiveTo: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCopyCaseNorms();
  }, []);

  const fetchCopyCaseNorms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/copy-case-norms');
      setCopyCaseNorms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching copy case norms:', error);
      toast.error('Failed to fetch copy case norms');
      setCopyCaseNorms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotalFee = () => {
    const copyCaseFee = parseFloat(formData.copyCaseFee) || 0;
    const lateFee = parseFloat(formData.lateFee) || 0;
    const processingFee = parseFloat(formData.processingFee) || 0;
    return copyCaseFee + lateFee + processingFee;
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalFee: calculateTotalFee().toString()
    }));
  }, [formData.copyCaseFee, formData.lateFee, formData.processingFee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const totalFee = calculateTotalFee();
      const dataToSubmit = {
        ...formData,
        totalFee: totalFee.toString()
      };

      if (isEditing) {
        await axios.put(`/api/copy-case-norms/${currentId}`, dataToSubmit);
        toast.success('Copy case norm updated successfully');
      } else {
        await axios.post('/api/copy-case-norms', dataToSubmit);
        toast.success('Copy case norm added successfully');
      }
      
      resetForm();
      fetchCopyCaseNorms();
    } catch (error) {
      console.error('Error saving copy case norm:', error);
      toast.error('Failed to save copy case norm');
    }
  };

  const handleEdit = (norm) => {
    setFormData({
      university: norm.university || '',
      semester: norm.semester || '',
      exam: norm.exam || '',
      subject: norm.subject || '',
      copyCaseFee: norm.copyCaseFee || '',
      lateFee: norm.lateFee || '',
      processingFee: norm.processingFee || '',
      totalFee: norm.totalFee || '',
      active: norm.active || true,
      effectiveFrom: norm.effectiveFrom ? norm.effectiveFrom.split('T')[0] : '',
      effectiveTo: norm.effectiveTo ? norm.effectiveTo.split('T')[0] : ''
    });
    setIsEditing(true);
    setCurrentId(norm._id);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`/api/copy-case-norms/${id}/toggle-status`);
      toast.success(`Copy case norm ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchCopyCaseNorms();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const resetForm = () => {
    setFormData({
      university: '',
      semester: '',
      exam: '',
      subject: '',
      copyCaseFee: '',
      lateFee: '',
      processingFee: '',
      totalFee: '',
      active: true,
      effectiveFrom: '',
      effectiveTo: ''
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const filteredNorms = copyCaseNorms.filter(norm =>
    norm.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    norm.semester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    norm.exam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    norm.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/copy-case-norms/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('File uploaded successfully');
      fetchCopyCaseNorms();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('/api/copy-case-norms/download', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'copy_case_norms.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Copy Case Norms</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit' : 'Add'} Copy Case Norm</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
              <input
                type="text"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Copy Case Fee</label>
              <input
                type="number"
                name="copyCaseFee"
                value={formData.copyCaseFee}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee</label>
              <input
                type="number"
                name="lateFee"
                value={formData.lateFee}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee</label>
              <input
                type="number"
                name="processingFee"
                value={formData.processingFee}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
              <input
                type="number"
                name="totalFee"
                value={formData.totalFee}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
              <input
                type="date"
                name="effectiveFrom"
                value={formData.effectiveFrom}
                onChange={handleChange}
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
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
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
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Excel Operations */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Excel Operations</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Norms</label>
            <button
              onClick={handleDownload}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <FaDownload className="mr-2" /> Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Copy Case Norms List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Copy Case Norms</h2>
          <input
            type="text"
            placeholder="Search by university, semester, exam, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Copy Case Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredNorms.length > 0 ? (
                filteredNorms.map((norm) => (
                  <tr key={norm._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{norm.university}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{norm.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{norm.exam}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{norm.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{norm.copyCaseFee}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{norm.lateFee}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{norm.processingFee}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">₹{norm.totalFee}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(norm.effectiveFrom).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(norm.effectiveTo).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        norm.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {norm.active ? 'Active' : 'Inactive'}
                      </span>
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
                          onClick={() => handleToggleStatus(norm._id, norm.active)}
                          className={`${norm.active ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {norm.active ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="px-6 py-4 text-center text-gray-500">
                    No copy case norms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageCopyCaseNorms;