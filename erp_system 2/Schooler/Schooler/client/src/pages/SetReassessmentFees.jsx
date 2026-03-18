import React, { useState, useEffect } from 'react';
import { FaFileExcel, FaDownload, FaUpload } from 'react-icons/fa';

const SetReassessmentFees = () => {
  const [formData, setFormData] = useState({
    institute: '',
    year: '',
    semester: '',
    program: '',
    examType: '',
    fee: '',
    applyAll: false,
  });

  const [feeDetails, setFeeDetails] = useState([{ examId: '', fee: '' }]);
  const [savedFees, setSavedFees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Fetch saved fees from API
    // axios.get('/api/reassessment-fees').then(response => setSavedFees(response.data));
  }, []);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleDetailChange = (index, e) => {
    const { name, value } = e.target;
    const newFeeDetails = [...feeDetails];
    newFeeDetails[index][name] = value;
    setFeeDetails(newFeeDetails);
  };

  const addDetailRow = () => {
    setFeeDetails([...feeDetails, { examId: '', fee: '' }]);
  };

  const removeDetailRow = (index) => {
    const newFeeDetails = [...feeDetails];
    newFeeDetails.splice(index, 1);
    setFeeDetails(newFeeDetails);
  };

  const handleSave = () => {
    // Save data to API
    // axios.post('/api/reassessment-fees', { ...formData, feeDetails }).then(response => {
    //   setSuccessMessage('Fees saved successfully!');
    //   setTimeout(() => setSuccessMessage(''), 3000);
    // });
    console.log({ ...formData, feeDetails });
    setSuccessMessage('Fees saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData({
      institute: '',
      year: '',
      semester: '',
      program: '',
      examType: '',
      fee: '',
      applyAll: false,
    });
    setFeeDetails([{ examId: '', fee: '' }]);
  };

  const filteredFees = savedFees.filter(fee =>
    Object.values(fee).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Set Reassessment Fees</h1>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 flex items-center">
          <FaDownload className="mr-2" />
          Export
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Add Reassessment Fee</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="text"
            name="institute"
            value={formData.institute}
            onChange={handleFormChange}
            placeholder="Enter Institute ID"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleFormChange}
            placeholder="e.g., 2023-24"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="semester"
            value={formData.semester}
            onChange={handleFormChange}
            placeholder="Enter Semester"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="program"
            value={formData.program}
            onChange={handleFormChange}
            placeholder="Enter Program Name"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="examType"
            value={formData.examType}
            onChange={handleFormChange}
            placeholder="Enter Exam Type"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="fee"
            value={formData.fee}
            onChange={handleFormChange}
            placeholder="Enter Fee"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-6 flex items-center">
          <input
            type="checkbox"
            name="applyAll"
            checked={formData.applyAll}
            onChange={handleFormChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="applyAll" className="ml-2 text-gray-700">Apply to all students</label>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Fee Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Exam ID</th>
                <th className="py-3 px-4 text-left">Fee</th>
                <th className="py-3 px-4 text-left">Replicate</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeDetails.map((detail, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      name="examId"
                      value={detail.examId}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      name="fee"
                      value={detail.fee}
                      onChange={(e) => handleDetailChange(index, e)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input type="checkbox" className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => removeDetailRow(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between">
            <button
                onClick={addDetailRow}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600"
            >
                + Add Row
            </button>
            <div>
                <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-gray-600 mr-4"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600"
                >
                    Save
                </button>
            </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Upload Excel</h2>
        <div className="flex items-center">
          <input type="file" className="hidden" id="excel-upload" />
          <label
            htmlFor="excel-upload"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 cursor-pointer flex items-center"
          >
            <FaUpload className="mr-2" />
            Choose File
          </label>
          <span className="ml-4 text-gray-500">No file chosen</span>
        </div>
        <div className="mt-4 flex space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 flex items-center">
                <FaUpload className="mr-2" />
                Upload Excel
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 flex items-center">
                <FaFileExcel className="mr-2" />
                Download Template
            </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Saved Fees</h2>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Institute ID</th>
                <th className="py-3 px-4 text-left">Year</th>
                <th className="py-3 px-4 text-left">Program Name</th>
                <th className="py-3 px-4 text-left">Fee Details</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.length > 0 ? (
                filteredFees.map((fee, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4">{fee.institute}</td>
                    <td className="py-3 px-4">{fee.year}</td>
                    <td className="py-3 px-4">{fee.program}</td>
                    <td className="py-3 px-4">
                      {/* Render fee details here */}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-600 mr-2">
                        Edit
                      </button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded-lg shadow-md hover:bg-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-gray-500">
                    No exam fees found
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

export default SetReassessmentFees;