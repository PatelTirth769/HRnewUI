import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const SetGradeClassRule = () => {
  const [formData, setFormData] = useState({ 
    university: '', 
    semester: '', 
    year: '', 
    exam: '' 
  });
  const [gradeRules, setGradeRules] = useState([
    { id: 1, grade: '', minResult: '', outOfTotal: '', max: '' }
  ]);
  const [savedRules, setSavedRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

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
          year: fileData[0]?.Year || '',
          exam: fileData[0]?.Exam || '',
        };

        // Set grade rules from all rows
        const newGradeRules = fileData.map((row, index) => ({
          id: index + 1,
          grade: row.Grade || '',
          minResult: row['Min Result'] || '',
          outOfTotal: row['Out of Total'] || '',
          max: row.Max || ''
        }));

        setFormData(newFormData);
        setGradeRules(newGradeRules);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Fetch saved rules on component mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get('/api/grade-class-rule');
        setSavedRules(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching grade rules:', error);
        setSavedRules([]);
      }
    };
    fetchRules();
  }, []);

  // Filter saved rules based on search term
  const filteredRules = (savedRules || []).filter(rule =>
    rule.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.semester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.year?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.exam?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Excel download
  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRules.flatMap(savedRule => 
      savedRule.gradeRules.map(rule => ({
        University: savedRule.university,
        Semester: savedRule.semester,
        Year: savedRule.year,
        Exam: savedRule.exam,
        Grade: rule.grade,
        'Min Result': rule.minResult,
        'Out of Total': rule.outOfTotal,
        Max: rule.max,
      }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GradeClassRules');
    XLSX.writeFile(workbook, 'GradeClassRules.xlsx');
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle grade rule changes
  const handleGradeRuleChange = (id, e) => {
    const { name, value } = e.target;
    const newGradeRules = gradeRules.map(rule => {
      if (rule.id === id) {
        return { ...rule, [name]: value };
      }
      return rule;
    });
    setGradeRules(newGradeRules);
  };

  // Add new grade rule row
  const handleAddGradeRule = () => {
    const newId = gradeRules.length > 0 ? Math.max(...gradeRules.map(rule => rule.id)) + 1 : 1;
    setGradeRules([...gradeRules, { id: newId, grade: '', minResult: '', outOfTotal: '', max: '' }]);
  };

  // Remove grade rule row
  const handleRemoveGradeRule = (id) => {
    setGradeRules(gradeRules.filter(rule => rule.id !== id));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/grade-class-rule', { 
        ...formData, 
        gradeRules 
      });
      
      // Show success message
      setSaveMessage('Grade & Class rules saved successfully!');
      
      // Refresh the saved rules after successful save
      const fetchRules = async () => {
        try {
          const response = await axios.get('/api/grade-class-rule');
          setSavedRules(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Error fetching grade rules:', error);
          setSavedRules([]);
        }
      };
      fetchRules();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving grade rule:', error);
      setSaveMessage('Error saving grade rules. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Set Grade & Class Rule</h1>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input 
              type="text" 
              name="year" 
              placeholder="Enter Year" 
              value={formData.year} 
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
        </div>

        {/* Grade Rules Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Grade Rules</h3>
            <button 
              type="button" 
              onClick={handleAddGradeRule} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add Grade Rule
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Grade</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Min Result</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Out of Total</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Max</th>
                  <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {gradeRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="grade"
                        value={rule.grade}
                        onChange={(e) => handleGradeRuleChange(rule.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Grade"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="minResult"
                        value={rule.minResult}
                        onChange={(e) => handleGradeRuleChange(rule.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Min Result"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="outOfTotal"
                        value={rule.outOfTotal}
                        onChange={(e) => handleGradeRuleChange(rule.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Out of Total"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300">
                      <input
                        type="text"
                        name="max"
                        value={rule.max}
                        onChange={(e) => handleGradeRuleChange(rule.id, e)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Max"
                      />
                    </td>
                    <td className="py-3 px-4 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveGradeRule(rule.id)}
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            Submit Grade & Class Rules
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Download Rules</label>
            <button 
              onClick={handleDownload} 
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Saved Rules Display */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Saved Grade & Class Rules</h3>
          <input
            type="text"
            placeholder="Search by University, Semester, Year, or Exam..."
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
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Year</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Exam</th>
                <th className="py-3 px-4 border border-gray-300 text-left text-sm font-medium text-gray-700">Grade Rules</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length > 0 ? (
                filteredRules.map((savedRule, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border border-gray-300">{savedRule.university}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedRule.semester}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedRule.year}</td>
                    <td className="py-3 px-4 border border-gray-300">{savedRule.exam}</td>
                    <td className="py-3 px-4 border border-gray-300">
                      <div className="text-sm">
                        {savedRule.gradeRules?.map((rule, ruleIndex) => (
                          <div key={ruleIndex} className="mb-1">
                            <strong>{rule.grade}:</strong> Min: {rule.minResult}, Out of: {rule.outOfTotal}, Max: {rule.max}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 px-4 text-center text-gray-500">
                    No saved grade & class rules found.
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

export default SetGradeClassRule;