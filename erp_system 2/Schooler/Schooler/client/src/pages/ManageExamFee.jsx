import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function ManageExamFee() {
  const [examFees, setExamFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    instituteId: '',
    year: '',
    programName: '',
    feeDetails: []
  });
  const [feeItem, setFeeItem] = useState({
    category: '',
    amount: '',
    dueDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Fetch exam fees data when component mounts
    const fetchExamFees = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/exam-fees');
        setExamFees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching exam fees:', error);
        toast.error('Failed to fetch exam fees');
        setExamFees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExamFees();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle fee item input changes
  const handleFeeItemChange = (e) => {
    const { name, value } = e.target;
    setFeeItem({
      ...feeItem,
      [name]: value
    });
  };

  // Handle adding fee item to fee details
  const handleAddFeeItem = () => {
    if (!feeItem.category || !feeItem.amount || !feeItem.dueDate) {
      toast.error('Please fill all fee details fields');
      return;
    }

    setFormData({
      ...formData,
      feeDetails: [...formData.feeDetails, { ...feeItem }]
    });

    // Reset fee item form
    setFeeItem({
      category: '',
      amount: '',
      dueDate: ''
    });
  };

  // Handle removing fee item
  const handleRemoveFeeItem = (index) => {
    const updatedFeeDetails = [...formData.feeDetails];
    updatedFeeDetails.splice(index, 1);
    setFormData({
      ...formData,
      feeDetails: updatedFeeDetails
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.instituteId || !formData.year || !formData.programName || formData.feeDetails.length === 0) {
      toast.error('Please fill all required fields and add at least one fee detail');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        // Update existing exam fee
        await axios.put(`/api/exam-fees/${currentId}`, formData);
        toast.success('Exam fee updated successfully');
      } else {
        // Create new exam fee
        await axios.post('/api/exam-fees', formData);
        toast.success('Exam fee added successfully');
      }

      // Refresh exam fees data
      const response = await axios.get('/api/exam-fees');
      setExamFees(Array.isArray(response.data) ? response.data : []);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving exam fee:', error);
      toast.error('Failed to save exam fee');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit exam fee
  const handleEdit = (fee) => {
    setIsEditing(true);
    setCurrentId(fee._id);
    setFormData({
      instituteId: fee.instituteId,
      year: fee.year,
      programName: fee.programName,
      feeDetails: fee.feeDetails || []
    });
  };

  // Handle delete exam fee
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam fee?')) {
      try {
        await axios.delete(`/api/exam-fees/${id}`);
        toast.success('Exam fee deleted successfully');
        
        // Refresh exam fees data
        const response = await axios.get('/api/exam-fees');
        setExamFees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error deleting exam fee:', error);
        toast.error('Failed to delete exam fee');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      instituteId: '',
      year: '',
      programName: '',
      feeDetails: []
    });
    setFeeItem({
      category: '',
      amount: '',
      dueDate: ''
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
      await axios.post('/api/exam-fees/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel file uploaded successfully');
      
      // Refresh exam fees data
      const response = await axios.get('/api/exam-fees');
      setExamFees(Array.isArray(response.data) ? response.data : []);
      
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
      const response = await axios.get('/api/exam-fees/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'exam_fees.xlsx');
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
        <h1 className="text-2xl font-bold">Manage Exam Fee</h1>
        <button
          onClick={handleExcelDownload}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaDownload className="mr-2" /> Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Exam Fee' : 'Add Exam Fee'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Institute ID</label>
              <input
                type="text"
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter Institute ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g. 2023-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Program Name</label>
              <input
                type="text"
                name="programName"
                value={formData.programName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter Program Name"
              />
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <h3 className="text-lg font-medium mb-2">Fee Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={feeItem.category}
                  onChange={handleFeeItemChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Regular/Backlog"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={feeItem.amount}
                  onChange={handleFeeItemChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter Amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={feeItem.dueDate}
                  onChange={handleFeeItemChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddFeeItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <FaPlus className="mr-2" /> Add
                </button>
              </div>
            </div>

            {formData.feeDetails.length > 0 && (
              <div className="mt-4 border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.feeDetails.map((fee, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{fee.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">₹{fee.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveFeeItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
          <h2 className="text-xl font-semibold">Exam Fees</h2>
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
                    Institute ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(examFees) && examFees.length > 0 ? (
                  examFees.map((fee) => (
                    <tr key={fee._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{fee.instituteId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{fee.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{fee.programName}</td>
                      <td className="px-6 py-4">
                        <div className="max-h-20 overflow-y-auto">
                          {fee.feeDetails && fee.feeDetails.map((detail, index) => (
                            <div key={index} className="mb-1 text-sm">
                              <span className="font-medium">{detail.category}:</span> ₹{detail.amount} (Due: {new Date(detail.dueDate).toLocaleDateString()})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(fee)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(fee._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      No exam fees found
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
}

export default ManageExamFee;