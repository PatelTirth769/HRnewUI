import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

function ManageSubjectHead() {
  const [subjectHeads, setSubjectHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    instituteId: '',
    year: '',
    programId: '',
    subjectName: '',
    branch: '',
    leadFacultyName: '',
    examiners: []
  });
  const [facultyName, setFacultyName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    // Fetch subject heads data when component mounts
    const fetchSubjectHeads = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await axios.get('/api/subject-heads');
        setSubjectHeads(response.data || []);
      } catch (error) {
        console.error('Error fetching subject heads:', error);
        toast.error('Failed to fetch subject heads');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectHeads();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle adding faculty to examiners list
  const handleAddFaculty = () => {
    if (!facultyName.trim()) {
      toast.error('Faculty name cannot be empty');
      return;
    }
    
    setFormData({
      ...formData,
      examiners: [...formData.examiners, facultyName]
    });
    setFacultyName(''); // Clear the input field after adding
  };

  // Handle removing faculty from examiners list
  const handleRemoveFaculty = (index) => {
    const updatedExaminers = [...formData.examiners];
    updatedExaminers.splice(index, 1);
    setFormData({
      ...formData,
      examiners: updatedExaminers
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/subject-heads/${currentId}`, formData);
        toast.success('Subject head updated successfully');
      } else {
        await axios.post('/api/subject-heads', formData);
        toast.success('Subject head created successfully');
      }
      resetForm();
      // Refresh the list
      const response = await axios.get('/api/subject-heads');
      setSubjectHeads(response.data || []);
    } catch (error) {
      console.error('Error saving subject head:', error);
      toast.error('Failed to save subject head');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      instituteId: '',
      year: '',
      programId: '',
      subjectName: '',
      branch: '',
      leadFacultyName: '',
      examiners: []
    });
    setFacultyName('');
    setIsEditing(false);
    setCurrentId(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Subject Heads</h1>
      
      {/* Form for adding/editing subject heads */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Subject Head' : 'Add Subject Head'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Institute ID</label>
              <input
                type="text"
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Year</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Program ID</label>
              <input
                type="text"
                name="programId"
                value={formData.programId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Subject Name</label>
              <input
                type="text"
                name="subjectName"
                value={formData.subjectName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Branch</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Lead Faculty Name</label>
              <input
                type="text"
                name="leadFacultyName"
                value={formData.leadFacultyName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
          </div>
          
          {/* Faculty name input and add button */}
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">Examiners</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                placeholder="Enter Faculty Name"
              />
              <button
                type="button"
                onClick={handleAddFaculty}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                <FaPlus className="inline mr-1" /> Add
              </button>
            </div>
            
            {/* Display added examiners */}
            {formData.examiners.length > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-semibold">Added Examiners:</h3>
                <ul className="mt-1">
                  {formData.examiners.map((examiner, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-1 rounded">
                      <span>{examiner}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaculty(index)}
                        className="text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Display subject heads */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Subject Heads List</h2>
        {loading ? (
          <p>Loading subject heads...</p>
        ) : subjectHeads.length === 0 ? (
          <p>No subject heads found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Institute ID</th>
                  <th className="py-2 px-4 border-b text-left">Year</th>
                  <th className="py-2 px-4 border-b text-left">Program ID</th>
                  <th className="py-2 px-4 border-b text-left">Subject Name</th>
                  <th className="py-2 px-4 border-b text-left">Branch</th>
                  <th className="py-2 px-4 border-b text-left">Lead Faculty</th>
                  <th className="py-2 px-4 border-b text-left">Examiners</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(subjectHeads) && subjectHeads.map((head) => (
                  <tr key={head._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{head.instituteId}</td>
                    <td className="py-2 px-4 border-b">{head.year}</td>
                    <td className="py-2 px-4 border-b">{head.programId}</td>
                    <td className="py-2 px-4 border-b">{head.subjectName}</td>
                    <td className="py-2 px-4 border-b">{head.branch}</td>
                    <td className="py-2 px-4 border-b">{head.leadFacultyName}</td>
                    <td className="py-2 px-4 border-b">
                      {head.examiners && head.examiners.length > 0 
                        ? head.examiners.join(', ') 
                        : 'None'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => {
                          setFormData({
                            instituteId: head.instituteId,
                            year: head.year,
                            programId: head.programId,
                            subjectName: head.subjectName,
                            branch: head.branch,
                            leadFacultyName: head.leadFacultyName,
                            examiners: head.examiners || []
                          });
                          setIsEditing(true);
                          setCurrentId(head._id);
                        }}
                        className="text-blue-500 mr-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this subject head?')) {
                            try {
                              await axios.delete(`/api/subject-heads/${head._id}`);
                              toast.success('Subject head deleted successfully');
                              // Refresh the list
                              const response = await axios.get('/api/subject-heads');
                              setSubjectHeads(response.data || []);
                            } catch (error) {
                              console.error('Error deleting subject head:', error);
                              toast.error('Failed to delete subject head');
                            }
                          }
                        }}
                        className="text-red-500"
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
    </div>
  );
}

export default ManageSubjectHead;