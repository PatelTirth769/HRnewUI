import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FacultySecondAssessment = () => {
  const [facultyAssessments, setFacultyAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [editingMarks, setEditingMarks] = useState(null);
  const [newMarks, setNewMarks] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchFacultyAssessments(selectedFaculty);
    }
  }, [selectedFaculty]);

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/faculties');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setError('Failed to fetch faculties');
    }
  };

  const fetchFacultyAssessments = async (facultyId) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/reassessments/faculty/${facultyId}`);
      // Filter for second_assessment type
      const filteredData = response.data.filter(item => item.reassessmentType === 'second_assessment');
      setFacultyAssessments(filteredData);
    } catch (error) {
      console.error('Error fetching faculty assessments:', error);
      setError('Failed to fetch faculty assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMarks = async (assessmentId) => {
    if (!newMarks || isNaN(newMarks)) {
      setError('Please enter valid marks');
      return;
    }

    try {
      await axios.put(`http://localhost:5001/api/reassessments/${assessmentId}/update-marks`, {
        reassessmentMarks: parseFloat(newMarks),
        remarks: remarks
      });
      
      setSuccess('Assessment marks updated successfully!');
      setEditingMarks(null);
      setNewMarks('');
      setRemarks('');
      fetchFacultyAssessments(selectedFaculty);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating assessment marks:', error);
      setError('Failed to update assessment marks');
    }
  };

  const handleCompleteAssessment = async (assessmentId) => {
    try {
      await axios.put(`http://localhost:5001/api/reassessments/${assessmentId}/update-marks`, {
        status: 'completed',
        completionDate: new Date()
      });
      
      setSuccess('Assessment completed successfully!');
      fetchFacultyAssessments(selectedFaculty);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error completing assessment:', error);
      setError('Failed to complete assessment');
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

  if (loading && !selectedFaculty) {
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
        <h1 className="text-2xl font-bold text-gray-800">Faculty Second Assessment</h1>
        <button
          onClick={() => {
            if (selectedFaculty) {
              fetchFacultyAssessments(selectedFaculty);
            }
          }}
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

      {/* Faculty Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Faculty</h2>
        <select
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a faculty member</option>
          {faculties.map((faculty) => (
            <option key={faculty._id} value={faculty._id}>
              {faculty.name} - {faculty.department} ({faculty.designation})
            </option>
          ))}
        </select>
      </div>

      {selectedFaculty && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-800">Total Assigned</h3>
              <p className="text-3xl font-bold text-blue-600">{facultyAssessments.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-800">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {facultyAssessments.filter(a => a.status === 'assigned').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-800">Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {facultyAssessments.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium text-gray-800">Approved</h3>
              <p className="text-3xl font-bold text-purple-600">
                {facultyAssessments.filter(a => a.status === 'approved').length}
              </p>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Assigned Second Assessments</h2>
            </div>
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
                      Assigned Date
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
                  {facultyAssessments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No second assessments assigned to this faculty
                      </td>
                    </tr>
                  ) : (
                    facultyAssessments.map((assessment) => (
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
                            <div className="space-y-2">
                              <input
                                type="number"
                                value={newMarks}
                                onChange={(e) => setNewMarks(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Marks"
                                min="0"
                                max="100"
                              />
                              <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Remarks"
                                rows="2"
                              />
                              <div className="flex space-x-2">
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
                                    setRemarks('');
                                  }}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">
                              {assessment.reassessmentMarks || 'Not assessed'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.assignedDate ? new Date(assessment.assignedDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                            {assessment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            {assessment.status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMarks(assessment._id);
                                    setNewMarks(assessment.reassessmentMarks || '');
                                    setRemarks(assessment.remarks || '');
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Update Marks
                                </button>
                                <button
                                  onClick={() => handleCompleteAssessment(assessment._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Complete
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                // Add view details functionality
                                console.log('View details:', assessment);
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
        </>
      )}
    </div>
  );
};

export default FacultySecondAssessment;