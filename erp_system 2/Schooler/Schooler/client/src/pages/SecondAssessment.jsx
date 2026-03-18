import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SecondAssessment = () => {
  const [secondAssessments, setSecondAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingMarks, setEditingMarks] = useState(null);
  const [newMarks, setNewMarks] = useState('');

  useEffect(() => {
    fetchSecondAssessments();
  }, [filter]);

  const fetchSecondAssessments = async () => {
    try {
      let response;
      if (filter === 'all') {
        response = await axios.get('http://localhost:5001/api/reassessments');
      } else {
        response = await axios.get(`http://localhost:5001/api/reassessments?status=${filter}`);
      }
      
      // Filter for second_assessment type
      const filteredData = response.data.filter(item => item.reassessmentType === 'second_assessment');
      setSecondAssessments(filteredData);
    } catch (error) {
      console.error('Error fetching second assessments:', error);
      setError('Failed to fetch second assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMarks = async (reassessmentId) => {
    if (!newMarks || isNaN(newMarks)) {
      setError('Please enter valid marks');
      return;
    }

    try {
      await axios.put(`http://localhost:5001/api/reassessments/${reassessmentId}/update-marks`, {
        reassessmentMarks: parseFloat(newMarks)
      });
      
      setSuccess('Marks updated successfully!');
      setEditingMarks(null);
      setNewMarks('');
      fetchSecondAssessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating marks:', error);
      setError('Failed to update marks');
    }
  };

  const handleApplyNearestMarks = async (reassessmentId) => {
    try {
      // Calculate nearest marks based on original marks and current assessment
      const assessment = secondAssessments.find(a => a._id === reassessmentId);
      const nearestMarks = Math.max(assessment.originalMarks, assessment.reassessmentMarks || 0);
      
      await axios.put(`http://localhost:5001/api/reassessments/${reassessmentId}/apply-nearest-marks`, {
        nearestMarks
      });
      
      setSuccess('Nearest marks applied successfully!');
      fetchSecondAssessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error applying nearest marks:', error);
      setError('Failed to apply nearest marks');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Second Assessment Management</h1>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Assessments</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
          </select>
          <button
            onClick={fetchSecondAssessments}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Total Assessments</h3>
          <p className="text-3xl font-bold text-blue-600">{secondAssessments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {secondAssessments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {secondAssessments.filter(a => a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Approved</h3>
          <p className="text-3xl font-bold text-purple-600">
            {secondAssessments.filter(a => a.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Faculty
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
              {secondAssessments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No second assessments found
                  </td>
                </tr>
              ) : (
                secondAssessments.map((assessment) => (
                  <tr key={assessment._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessment.student?.firstName} {assessment.student?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.student?.enrollmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessment.subject?.subjectName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.subject?.subjectCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.originalMarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMarks === assessment._id ? (
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={newMarks}
                            onChange={(e) => setNewMarks(e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Marks"
                            min="0"
                            max="100"
                          />
                          <button
                            onClick={() => handleUpdateMarks(assessment._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMarks(null);
                              setNewMarks('');
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {assessment.reassessmentMarks || 'Not assessed'}
                          {assessment.status === 'assigned' && (
                            <button
                              onClick={() => {
                                setEditingMarks(assessment._id);
                                setNewMarks(assessment.reassessmentMarks || '');
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.nearestMarks || 'Not applied'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {assessment.facultyAssigned?.name || 'Not assigned'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.facultyAssigned?.department || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                        {assessment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {assessment.status === 'completed' && !assessment.nearestMarks && (
                          <button
                            onClick={() => handleApplyNearestMarks(assessment._id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Apply Nearest
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Add view details functionality
                            console.log('View details:', assessment);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
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

export default SecondAssessment;