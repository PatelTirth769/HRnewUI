import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const ResultDeclarationDetail = () => {
  const [formData, setFormData] = useState({ 
    university: '', 
    semester: '', 
    proctor: '',
    exam: '', 
    subject: '', 
    student: '', 
    room: ''
  });
  const [resultDetails, setResultDetails] = useState([
    { 
      id: 1, 
      student: '', 
      checked: '', 
      reassessed: '', 
      preRequired: '', 
      batch: '', 
      verified: '', 
      declaredDate: '', 
      auto: ''
    }
  ]);
  const [savedDeclarations, setSavedDeclarations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [declarationStatus, setDeclarationStatus] = useState({
    declareResult: false,
    publishResult: false,
    notify: false,
    examReport: false
  });

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (data.length > 1) {
        const headers = data[0];
        const fileData = data.slice(1).map(row => {
          let rowData = {};
          row.forEach((value, index) => {
            rowData[headers[index]] = value;
          });
          return rowData;
        });

        // Set form data from first row
        const newFormData = {
          university: fileData[0]?.University || '',
          semester: fileData[0]?.Semester || '',
          proctor: fileData[0]?.Proctor || '',
          exam: fileData[0]?.Exam || '',
          subject: fileData[0]?.Subject || '',
          student: fileData[0]?.Student || '',
          room: fileData[0]?.Room || '',
        };

        // Set result details from all rows
        const newResultDetails = fileData.map((row, index) => ({
          id: index + 1,
          student: row.Student || '',
          checked: row.Checked || row.Cheeled || '',
          reassessed: row.Reassessed || '',
          preRequired: row['Pre Required'] || row.Pregu || '',
          batch: row.Batch || '',
          verified: row.Verified || '',
          declaredDate: row['Declared Date'] || '',
          auto: row.Auto || ''
        }));

        setFormData(newFormData);
        setResultDetails(newResultDetails);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Fetch saved declarations on component mount
  useEffect(() => {
    const fetchDeclarations = async () => {
      try {
        const response = await axios.get('/api/result-declaration-detail');
        setSavedDeclarations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching result declarations:', error);
        setSavedDeclarations([]);
      }
    };
    fetchDeclarations();
  }, []);

  // Filter saved declarations based on search term
  const filteredDeclarations = (savedDeclarations || []).filter(declaration =>
    declaration.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    declaration.semester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    declaration.exam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    declaration.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Excel download
  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredDeclarations.flatMap(savedDeclaration => 
      savedDeclaration.resultDetails.map(detail => ({
        University: savedDeclaration.university,
        Semester: savedDeclaration.semester,
        Proctor: savedDeclaration.proctor,
        Exam: savedDeclaration.exam,
        Subject: savedDeclaration.subject,
        Student: savedDeclaration.student,
        Room: savedDeclaration.room,
        'Student Name': detail.student,
        Checked: detail.checked,
        Reassessed: detail.reassessed,
        'Pre Required': detail.preRequired,
        Batch: detail.batch,
        Verified: detail.verified,
        'Declared Date': detail.declaredDate,
        Auto: detail.auto,
      }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ResultDeclarations');
    XLSX.writeFile(workbook, 'ResultDeclarationDetail.xlsx');
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle result detail changes
  const handleResultDetailChange = (id, e) => {
    const { name, value } = e.target;
    const newResultDetails = resultDetails.map(detail => {
      if (detail.id === id) {
        return { ...detail, [name]: value };
      }
      return detail;
    });
    setResultDetails(newResultDetails);
  };

  // Add new result detail row
  const handleAddResultDetail = () => {
    const newId = resultDetails.length > 0 ? Math.max(...resultDetails.map(detail => detail.id)) + 1 : 1;
    setResultDetails([...resultDetails, { 
      id: newId, 
      student: '', 
      checked: '', 
      reassessed: '', 
      preRequired: '', 
      batch: '', 
      verified: '', 
      declaredDate: '', 
      auto: ''
    }]);
  };

  // Remove result detail row
  const handleRemoveResultDetail = (id) => {
    setResultDetails(resultDetails.filter(detail => detail.id !== id));
  };

  // Handle action button clicks
  const handleActionClick = async (action) => {
    try {
      // Simulate API call for each action
      const response = await axios.post(`/api/result-declaration-detail/${action}`, { 
        ...formData, 
        resultDetails 
      });
      
      setDeclarationStatus(prev => ({
        ...prev,
        [action]: true
      }));
      
      setSaveMessage(`${action.replace(/([A-Z])/g, ' $1').trim()} completed successfully!`);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setDeclarationStatus(prev => ({
          ...prev,
          [action]: false
        }));
        setSaveMessage('');
      }, 3000);
      
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      setSaveMessage(`Error in ${action}. Please try again.`);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/result-declaration-detail', { 
        ...formData, 
        resultDetails 
      });
      
      // Show success message
      setSaveMessage('Result declaration details saved successfully!');
      
      // Refresh the saved declarations after successful save
      const fetchDeclarations = async () => {
        try {
          const response = await axios.get('/api/result-declaration-detail');
          setSavedDeclarations(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Error fetching result declarations:', error);
          setSavedDeclarations([]);
        }
      };
      fetchDeclarations();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving result declaration details:', error);
      setSaveMessage('Error saving result declaration details. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Result Declaration Detail</h1>

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-4 p-3 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {saveMessage}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
            <input 
              type="text" 
              name="university" 
              placeholder="Enter University" 
              value={formData.university} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <input 
              type="text" 
              name="semester" 
              placeholder="Enter Semester" 
              value={formData.semester} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proctor</label>
            <input 
              type="text" 
              name="proctor" 
              placeholder="Enter Proctor" 
              value={formData.proctor} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <input 
              type="text" 
              name="exam" 
              placeholder="Enter Exam" 
              value={formData.exam} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input 
              type="text" 
              name="subject" 
              placeholder="Enter Subject" 
              value={formData.subject} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <input 
              type="text" 
              name="student" 
              placeholder="Enter Student" 
              value={formData.student} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
            <input 
              type="text" 
              name="room" 
              placeholder="Enter Room" 
              value={formData.room} 
              onChange={handleChange} 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        {/* Result Details Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Result Details</h3>
            <button 
              type="button" 
              onClick={handleAddResultDetail} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add Result Detail
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Student</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Checked</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Reassessed</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Pre Required</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Batch</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Verified</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Declaration Date</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Auto</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="student"
                        value={detail.student}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Student Name"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <select
                        name="checked"
                        value={detail.checked}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <select
                        name="reassessed"
                        value={detail.reassessed}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <select
                        name="preRequired"
                        value={detail.preRequired}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="batch"
                        value={detail.batch}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Batch"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <select
                        name="verified"
                        value={detail.verified}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="date"
                        name="declaredDate"
                        value={detail.declaredDate}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <select
                        name="auto"
                        value={detail.auto}
                        onChange={(e) => handleResultDetailChange(detail.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveResultDetail(detail.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Result Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => handleActionClick('declareResult')}
              disabled={declarationStatus.declareResult}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                declarationStatus.declareResult 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {declarationStatus.declareResult ? '✓ Declared' : 'Declare Result'}
            </button>
            <button
              type="button"
              onClick={() => handleActionClick('publishResult')}
              disabled={declarationStatus.publishResult}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                declarationStatus.publishResult 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {declarationStatus.publishResult ? '✓ Published' : 'Publish Result'}
            </button>
            <button
              type="button"
              onClick={() => handleActionClick('notify')}
              disabled={declarationStatus.notify}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                declarationStatus.notify 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {declarationStatus.notify ? '✓ Notified' : 'Notify'}
            </button>
            <button
              type="button"
              onClick={() => handleActionClick('examReport')}
              disabled={declarationStatus.examReport}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                declarationStatus.examReport 
                  ? 'bg-green-600 text-white cursor-not-allowed' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {declarationStatus.examReport ? '✓ Generated' : 'Exam Report'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Save Declaration Details
          </button>
        </div>
      </form>

      {/* File Upload/Download Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Declarations</label>
            <button 
              onClick={handleDownload} 
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Saved Declarations Display */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Saved Result Declarations</h3>
          <input
            type="text"
            placeholder="Search by University, Semester, Exam, Subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">University</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Semester</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Exam</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Subject</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Proctor</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Room</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Total Students</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Actions Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeclarations.length > 0 ? (
                filteredDeclarations.map((savedDeclaration, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.university}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.semester}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.exam}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.subject}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.proctor}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedDeclaration.room}</td>
                    <td className="py-3 px-4 border border-gray-300 text-center">{savedDeclaration.resultDetails?.length || 0}</td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          savedDeclaration.declarationStatus?.declareResult ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Declared
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          savedDeclaration.declarationStatus?.publishResult ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Published
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          savedDeclaration.declarationStatus?.notify ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Notified
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          savedDeclaration.declarationStatus?.examReport ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Report
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                    No saved result declarations found.
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

export default ResultDeclarationDetail;