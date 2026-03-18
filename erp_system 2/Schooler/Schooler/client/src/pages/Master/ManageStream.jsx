import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUpload, FaDownload, FaSearch } from 'react-icons/fa';

const ManageStream = () => {
  const [formData, setFormData] = useState({
    streamId: '',
    streamName: '',
    streamCode: '',
    streamShortName: '',
    streamProgram: '',
    streamBranch: '',
    isActive: true,
    instituteId: ''
  });

  const [streams, setStreams] = useState([
    {
      id: 1,
      streamId: 'STR001',
      streamName: 'Computer Science',
      streamCode: 'CS',
      streamShortName: 'CS',
      streamProgram: 'B.Tech',
      streamBranch: 'Engineering',
      isActive: true,
      instituteId: 'INST001'
    },
    {
      id: 2,
      streamId: 'STR002',
      streamName: 'Information Technology',
      streamCode: 'IT',
      streamShortName: 'IT',
      streamProgram: 'B.Tech',
      streamBranch: 'Engineering',
      isActive: true,
      instituteId: 'INST001'
    }
  ]);

  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [streamToDelete, setStreamToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      // Update existing stream
      const updatedStreams = streams.map(stream => 
        stream.id === currentId ? { ...formData, id: currentId } : stream
      );
      setStreams(updatedStreams);
      setEditMode(false);
      setCurrentId(null);
    } else {
      // Add new stream
      const newStream = {
        ...formData,
        id: streams.length > 0 ? Math.max(...streams.map(stream => stream.id)) + 1 : 1
      };
      setStreams([...streams, newStream]);
    }
    
    // Reset form
    setFormData({
      streamId: '',
      streamName: '',
      streamCode: '',
      streamShortName: '',
      streamProgram: '',
      streamBranch: '',
      isActive: true,
      instituteId: ''
    });
  };

  const handleEdit = (id) => {
    const streamToEdit = streams.find(stream => stream.id === id);
    setFormData(streamToEdit);
    setEditMode(true);
    setCurrentId(id);
  };

  const handleDelete = (id) => {
    setStreamToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Soft delete - In a real application, you would set a 'deleted' flag or make an API call
    const updatedStreams = streams.filter(stream => stream.id !== streamToDelete);
    setStreams(updatedStreams);
    setShowDeleteModal(false);
    setStreamToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStreamToDelete(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real application, you would process the Excel file here
      alert('Excel file uploaded: ' + file.name);
      // Reset the file input
      e.target.value = null;
    }
  };

  const filteredStreams = streams.filter(stream => 
    stream.streamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.streamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.streamCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-medium text-gray-800">Manage Year / Manage Stream</h1>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <FaUpload className="mr-2" /> Upload Excel
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-md shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Add Stream</h2>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="streamId" className="block text-sm font-medium text-gray-700 mb-1">Stream ID</label>
                <input
                  type="text"
                  id="streamId"
                  name="streamId"
                  placeholder="Enter Stream ID"
                  value={formData.streamId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="streamName" className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <input
                  type="text"
                  id="streamName"
                  name="streamName"
                  placeholder="e.g. Computer Science"
                  value={formData.streamName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="instituteId" className="block text-sm font-medium text-gray-700 mb-1">Institute ID</label>
                <input
                  type="text"
                  id="instituteId"
                  name="instituteId"
                  placeholder="Enter Institute ID"
                  value={formData.instituteId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="streamProgram" className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <input
                  type="text"
                  id="streamProgram"
                  name="streamProgram"
                  placeholder="Enter Program"
                  value={formData.streamProgram}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="streamCode" className="block text-sm font-medium text-gray-700 mb-1">Stream Code</label>
                <input
                  type="text"
                  id="streamCode"
                  name="streamCode"
                  placeholder="Enter Stream Code"
                  value={formData.streamCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="streamShortName" className="block text-sm font-medium text-gray-700 mb-1">Stream Short Name</label>
                <input
                  type="text"
                  id="streamShortName"
                  name="streamShortName"
                  placeholder="Enter Short Name"
                  value={formData.streamShortName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="streamBranch" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  id="streamBranch"
                  name="streamBranch"
                  placeholder="Enter Branch"
                  value={formData.streamBranch}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">Active</label>
              </div>
              
              <div className="col-span-full flex justify-end gap-2 mt-4">
                {editMode && (
                  <button 
                    type="button" 
                    className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300"
                    onClick={() => {
                      setEditMode(false);
                      setCurrentId(null);
                      setFormData({
                        streamId: '',
                        streamName: '',
                        streamCode: '',
                        streamShortName: '',
                        streamProgram: '',
                        streamBranch: '',
                        isActive: true,
                        instituteId: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                >
                  {editMode ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="bg-white rounded-md shadow-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Stream List</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button className="flex items-center bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700">
                  <FaDownload className="mr-1" /> Export
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStreams.map(stream => (
                    <tr key={stream.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamCode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamShortName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamProgram}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.streamBranch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stream.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {stream.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stream.instituteId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-1"
                          onClick={() => handleEdit(stream.id)}
                        >
                          <FaEdit size={18} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1"
                          onClick={() => handleDelete(stream.id)}
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this stream? This action is reversible.</p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStream;