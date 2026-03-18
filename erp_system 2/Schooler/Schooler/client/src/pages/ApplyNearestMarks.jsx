import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplyNearestMarks = () => {
  const [reassessments, setReassessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [years, setYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedReassessments, setSelectedReassessments] = useState([]);

  useEffect(() => {
    fetchYears();
    fetchPrograms();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedYear || selectedProgram || selectedSubject) {
      fetchReassessments();
    }
  }, [selectedYear, selectedProgram, selectedSubject]);

  const fetchYears = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/years');
      setYears(response.data);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/programs');
      setPrograms(response.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchReassessments = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5001/api/reassessments';
      const params = [];
      
      if (selectedYear) params.push(`year=${selectedYear}`);
      if (selectedProgram) params.push(`program=${selectedProgram}`);
      if (selectedSubject) params.push(`subject=${selectedSubject}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      setReassessments(response.data);
    } catch (error) {
      console.error('Error fetching reassessments:', error);
      setError('Failed to fetch reassessments');
    } finally {
      setLoading(false);
    }
  };

  const calculateNearestMarks = (originalMarks, secondAssessmentMarks, nearestMarksData) => {
    // Simple nearest marks calculation logic
    // This can be customized based on your specific requirements
    const difference = Math.abs(secondAssessmentMarks - originalMarks);
    
    if (difference <= 3) {
      // If difference is 3 or less, take average
      return Math.round((originalMarks + secondAssessmentMarks) / 2);
    } else if (difference <= 5) {
      // If difference is 4-5, take the higher marks
      return Math.max(originalMarks, secondAssessmentMarks);
    } else {
      // If difference is more than 5, take second assessment marks
      return secondAssessmentMarks;
    }
  };

  const handleApplyNearestMarks = async (reassessmentId) => {
    try {
      const reassessment = reassessments.find(r => r._id === reassessmentId);
      if (!reassessment || !reassessment.reassessmentMarks) {
        setError('Second assessment marks not available');
        return;
      }

      const nearestMarks = calculateNearestMarks(
        reassessment.originalMarks,
        reassessment.reassessmentMarks,
        {}
      );

      await axios.put(`http://localhost:5001/api/reassessments/${reassessmentId}/apply-nearest-marks`, {
        nearestMarks: nearestMarks,
        appliedBy: 'Admin', // You should get this from user context
        appliedDate: new Date()
      });

      setSuccess('Nearest marks applied successfully!');
      fetchReassessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error applying nearest marks:', error);
      setError('Failed to apply nearest marks');
    }
  };

  const handleBulkApplyNearestMarks = async () => {
    if (selectedReassessments.length === 0) {
      setError('Please select reassessments to apply nearest marks');
      return;
    }

    try {
      for (const reassessmentId of selectedReassessments) {
        const reassessment = reassessments.find(r => r._id === reassessmentId);
        if (reassessment && reassessment.reassessmentMarks) {
          const nearestMarks = calculateNearestMarks(
            reassessment.originalMarks,
            reassessment.reassessmentMarks,
            {}
          );

          await axios.put(`http://localhost:5001/api/reassessments/${reassessmentId}/apply-nearest-marks`, {
            nearestMarks: nearestMarks,
            appliedBy: 'Admin',
            appliedDate: new Date()
          });
        }
      }

      setSuccess(`Nearest marks applied to ${selectedReassessments.length} reassessments successfully!`);
      setSelectedReassessments([]);
      fetchReassessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error applying nearest marks in bulk:', error);
      setError('Failed to apply nearest marks in bulk');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const eligibleReassessments = reassessments
        .filter(r => r.status === 'completed' && r.reassessmentMarks && !r.nearestMarks)
        .map(r => r._id);
      setSelectedReassessments(eligibleReassessments);
    } else {
      setSelectedReassessments([]);
    }
  };

  const handleSelectReassessment = (reassessmentId) => {
    setSelectedReassessments(prev => {
      if (prev.includes(reassessmentId)) {
        return prev.filter(id => id !== reassessmentId);
      } else {
        return [...prev, reassessmentId];
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'nearest_marks_applied': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const eligibleForNearestMarks = (reassessment) => {
    return reassessment.status === 'completed' && 
           reassessment.reassessmentMarks && 
           !reassessment.nearestMarks;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Apply Nearest Marks</h1>
        <button
          onClick={fetchReassessments}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.yearName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.programName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReassessments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedReassessments.length} reassessment(s) selected
            </span>
            <button
              onClick={handleBulkApplyNearestMarks}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Apply Nearest Marks to Selected
            </button>
          </div>
        </div>
      )}

      {/* Reassessments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Reassessments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedReassessments.length > 0 && selectedReassessments.length === reassessments.filter(r => eligibleForNearestMarks(r)).length}
                    disabled={reassessments.filter(r => eligibleForNearestMarks(r)).length === 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Second Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nearest Marks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reassessments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    No reassessments found
                  </td>
                </tr>
              ) : (
                reassessments.map((reassessment) => (
                  <tr key={reassessment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedReassessments.includes(reassessment._id)}
                        onChange={() => handleSelectReassessment(reassessment._id)}
                        disabled={!eligibleForNearestMarks(reassessment)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reassessment.student?.firstName} {reassessment.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reassessment.student?.enrollmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reassessment.subject?.subjectName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reassessment.subject?.subjectCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reassessment.originalMarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reassessment.reassessmentMarks || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reassessment.nearestMarks || 'Not Applied'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reassessment.reassessmentMarks ? (
                        <span className={`font-medium ${
                          Math.abs(reassessment.reassessmentMarks - reassessment.originalMarks) <= 3 
                            ? 'text-green-600' 
                            : Math.abs(reassessment.reassessmentMarks - reassessment.originalMarks) <= 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {Math.abs(reassessment.reassessmentMarks - reassessment.originalMarks)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reassessment.status)}`}>
                        {reassessment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {eligibleForNearestMarks(reassessment) && (
                          <button
                            onClick={() => handleApplyNearestMarks(reassessment._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Apply Nearest Marks
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Add view details functionality
                            console.log('View details:', reassessment);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          View Details
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

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4 mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Nearest Marks Calculation Rules:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Difference ≤ 3: Take average of both marks
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            Difference 4-5: Take higher marks
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Difference > 5: Take second assessment marks
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyNearestMarks;