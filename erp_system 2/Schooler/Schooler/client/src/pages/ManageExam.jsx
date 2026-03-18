import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageExam = () => {
  const [formData, setFormData] = useState({
    year: '',
    program: '',
    semester: '',
    subject: '',
    practical: '',
    assignment: '',
    examDate: '',
    gradingSystem: ''
  });
  
  const [years, setYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [examTerms, setExamTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Fetch years and programs when component mounts
    fetchYears();
    fetchPrograms();
    fetchExamTerms();
  }, []);
  
  const fetchYears = async () => {
    try {
      const response = await axios.get('/api/year-configurations');
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setYears(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setYears(response.data.data);
      } else {
        console.error('Years data is not an array:', response.data);
        setYears([]);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      setYears([]);
    }
  };
  
  const fetchPrograms = async () => {
    try {
      const response = await axios.get('/api/programs');
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setPrograms(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setPrograms(response.data.data);
      } else {
        console.error('Programs data is not an array:', response.data);
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms([]);
    }
  };
  
  const fetchExamTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/exam-terms');
      if (Array.isArray(response.data)) {
        setExamTerms(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setExamTerms(response.data.data);
      } else {
        console.error('Exam terms data is not an array:', response.data);
        setExamTerms([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam terms:', error);
      setExamTerms([]);
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/exam-terms', formData);
      // Reset form after successful submission
      setFormData({
        year: '',
        program: '',
        semester: '',
        subject: '',
        practical: '',
        assignment: '',
        examDate: '',
        gradingSystem: ''
      });
      // Refresh exam terms list
      fetchExamTerms();
      setLoading(false);
    } catch (error) {
      console.error('Error creating exam term:', error);
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Exam/Term</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
          <span className="mr-2">+</span> Upload Excel
        </button>
      </div>
      
      {/* Add Exam Term Form */}
      <div className="bg-white shadow-md rounded p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Exam Term</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year */}
            <div>
              <label className="block text-gray-700 mb-2">Year</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.year}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Program */}
            <div>
              <label className="block text-gray-700 mb-2">Program</label>
              <select
                name="program"
                value={formData.program}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Program</option>
                {programs.map((program) => (
                  <option key={program._id} value={program._id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Semester */}
            <div>
              <label className="block text-gray-700 mb-2">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
            
            {/* Subject */}
            <div>
              <label className="block text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter Subject"
                required
              />
            </div>
            
            {/* Practical */}
            <div>
              <label className="block text-gray-700 mb-2">Practical</label>
              <input
                type="text"
                name="practical"
                value={formData.practical}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter Practical"
              />
            </div>
            
            {/* Assignment */}
            <div>
              <label className="block text-gray-700 mb-2">Assignment</label>
              <input
                type="text"
                name="assignment"
                value={formData.assignment}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter Assignment"
              />
            </div>
            
            {/* Exam Date */}
            <div>
              <label className="block text-gray-700 mb-2">Exam Date</label>
              <input
                type="date"
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            {/* Grading System */}
            <div>
              <label className="block text-gray-700 mb-2">Grading System</label>
              <select
                name="gradingSystem"
                value={formData.gradingSystem}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Grading System</option>
                <option value="10-point">10-Point Scale</option>
                <option value="4-point">4-Point Scale</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 gap-2">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Exam Terms Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Exam Terms</h2>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search..."
              className="border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-r">
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">YEAR</th>
                <th className="py-2 px-4 border-b text-left">PROGRAM</th>
                <th className="py-2 px-4 border-b text-left">SEMESTER</th>
                <th className="py-2 px-4 border-b text-left">SUBJECT</th>
                <th className="py-2 px-4 border-b text-left">PRACTICAL</th>
                <th className="py-2 px-4 border-b text-left">ASSIGNMENT</th>
                <th className="py-2 px-4 border-b text-left">EXAM DATE</th>
                <th className="py-2 px-4 border-b text-left">GRADING SYSTEM</th>
                <th className="py-2 px-4 border-b text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center">Loading...</td>
                </tr>
              ) : examTerms.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center">No exam terms found</td>
                </tr>
              ) : (
                examTerms.map((term) => (
                  <tr key={term._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{term.year?.year || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{term.program?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">Semester {term.semester}</td>
                    <td className="py-2 px-4 border-b">{term.subject}</td>
                    <td className="py-2 px-4 border-b">{term.practical || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{term.assignment || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      {new Date(term.examDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b">{term.gradingSystem}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageExam;