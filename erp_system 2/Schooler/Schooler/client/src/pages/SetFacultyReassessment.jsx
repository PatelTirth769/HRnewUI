import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SetFacultyReassessment = () => {
  const [pendingReassessments, setPendingReassessments] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  const [selectedReassessment, setSelectedReassessment] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingReassessments();
    fetchAvailableFaculties();
  }, []);

  const fetchPendingReassessments = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/reassessments/pending');
      setPendingReassessments(response.data);
    } catch (error) {
      console.error('Error fetching pending reassessments:', error);
      setError('Failed to fetch pending reassessments');
    }
  };

  const fetchAvailableFaculties = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/faculties/available/assign');
      setAvailableFaculties(response.data);
    } catch (error) {
      console.error('Error fetching available faculties:', error);
      setError('Failed to fetch available faculties');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    if (!selectedReassessment || !selectedFaculty) {
      setError('Please select both reassessment and faculty');
      return;
    }

    try {
      await axios.put(`http://localhost:5001/api/reassessments/${selectedReassessment}/assign-faculty/${selectedFaculty}`);
      setSuccess('Faculty assigned successfully!');
      setSelectedReassessment('');
      setSelectedFaculty('');
      fetchPendingReassessments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error assigning faculty:', error);
      setError('Failed to assign faculty');
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
        <h1 className="text-2xl font-bold text-gray-800">Set Faculty Reassessment</h1>
        <div className="flex space-x-4">
          <button
            onClick={fetchPendingReassessments}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reassessments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Reassessments</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingReassessments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending reassessments</p>
            ) : (
              pendingReassessments.map((reassessment) => (
                <div
                  key={reassessment._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedReassessment === reassessment._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReassessment(reassessment._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {reassessment.student?.firstName} {reassessment.student?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Enrollment: {reassessment.student?.enrollmentNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subject: {reassessment.subject?.subjectName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Original Marks: {reassessment.originalMarks}
                      </p>
                      <p className="text-sm text-blue-600">
                        Type: {reassessment.reassessmentType?.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {reassessment.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Faculty Assignment */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Assign Faculty</h2>
          
          <form onSubmit={handleAssignFaculty} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Reassessment
              </label>
              <div className="border rounded-lg p-3 bg-gray-50">
                {selectedReassessment ? (
                  <div>
                    {pendingReassessments.find(r => r._id === selectedReassessment)?.student?.firstName} {' '}
                    {pendingReassessments.find(r => r._id === selectedReassessment)?.student?.lastName}
                  </div>
                ) : (
                  <span className="text-gray-500">Please select a reassessment from the left</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Faculty
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a faculty member</option>
                {availableFaculties.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.name} - {faculty.department} ({faculty.designation})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedReassessment || !selectedFaculty}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Assign Faculty
            </button>
          </form>

          {/* Available Faculties List */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Available Faculties</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableFaculties.map((faculty) => (
                <div key={faculty._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{faculty.name}</p>
                      <p className="text-sm text-gray-600">{faculty.department}</p>
                      <p className="text-sm text-gray-600">{faculty.designation}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      faculty.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {faculty.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {faculty.subjects && faculty.subjects.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Specializations:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {faculty.subjects.map((subject, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {subject.subjectName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Total Pending</h3>
          <p className="text-3xl font-bold text-blue-600">{pendingReassessments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Available Faculties</h3>
          <p className="text-3xl font-bold text-green-600">{availableFaculties.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium text-gray-800">Assignment Ratio</h3>
          <p className="text-3xl font-bold text-purple-600">
            {availableFaculties.length > 0 ? Math.round(pendingReassessments.length / availableFaculties.length * 10) / 10 : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetFacultyReassessment;