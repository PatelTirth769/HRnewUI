import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBuilding, FaDoorOpen, FaChair } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ManageBlockAndResource = () => {
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('blocks');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [examCenters, setExamCenters] = useState([]);
  
  // Block form data
  const [blockFormData, setBlockFormData] = useState({
    blockId: '',
    blockName: '',
    examCenterId: '',
    totalRooms: '',
    capacity: '',
    isActive: true
  });
  
  // Room form data
  const [roomFormData, setRoomFormData] = useState({
    roomId: '',
    roomName: '',
    blockId: '',
    examCenterId: '',
    capacity: '',
    roomType: 'CLASSROOM',
    floorNumber: '',
    isActive: true
  });

  useEffect(() => {
    fetchExamCenters();
    fetchBlocks();
    fetchRooms();
  }, []);

  const fetchExamCenters = async () => {
    try {
      const response = await axios.get('/api/manage-exam-centers');
      setExamCenters(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching exam centers:', error);
      setExamCenters([]);
    }
  };

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/blocks');
      setBlocks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Failed to fetch blocks');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem && activeTab === 'blocks') {
        await axios.put(`/api/blocks/${editingItem._id}`, blockFormData);
        toast.success('Block updated successfully');
      } else if (activeTab === 'blocks') {
        await axios.post('/api/blocks', blockFormData);
        toast.success('Block created successfully');
      }
      setShowModal(false);
      setEditingItem(null);
      resetBlockForm();
      fetchBlocks();
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error(error.response?.data?.message || 'Failed to save block');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem && activeTab === 'rooms') {
        await axios.put(`/api/rooms/${editingItem._id}`, roomFormData);
        toast.success('Room updated successfully');
      } else if (activeTab === 'rooms') {
        await axios.post('/api/rooms', roomFormData);
        toast.success('Room created successfully');
      }
      setShowModal(false);
      setEditingItem(null);
      resetRoomForm();
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error(error.response?.data?.message || 'Failed to save room');
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    if (type === 'blocks') {
      setBlockFormData({
        blockId: item.blockId,
        blockName: item.blockName,
        examCenterId: item.examCenterId,
        totalRooms: item.totalRooms,
        capacity: item.capacity,
        isActive: item.isActive
      });
    } else {
      setRoomFormData({
        roomId: item.roomId,
        roomName: item.roomName,
        blockId: item.blockId,
        examCenterId: item.examCenterId,
        capacity: item.capacity,
        roomType: item.roomType || 'CLASSROOM',
        floorNumber: item.floorNumber || '',
        isActive: item.isActive
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      try {
        const endpoint = type === 'blocks' ? '/api/blocks' : '/api/rooms';
        await axios.delete(`${endpoint}/${id}`);
        toast.success(`${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)} deleted successfully`);
        if (type === 'blocks') {
          fetchBlocks();
        } else {
          fetchRooms();
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      }
    }
  };

  const resetBlockForm = () => {
    setBlockFormData({
      blockId: '',
      blockName: '',
      examCenterId: '',
      totalRooms: '',
      capacity: '',
      isActive: true
    });
  };

  const resetRoomForm = () => {
    setRoomFormData({
      roomId: '',
      roomName: '',
      blockId: '',
      examCenterId: '',
      capacity: '',
      roomType: 'CLASSROOM',
      floorNumber: '',
      isActive: true
    });
  };

  const getExamCenterName = (centerId) => {
    const center = examCenters.find(c => c.examCenterId === centerId);
    return center ? center.examCenterName : centerId;
  };

  const getBlockName = (blockId) => {
    const block = blocks.find(b => b._id === blockId);
    return block ? block.blockName : blockId;
  };

  const filteredBlocks = blocks.filter(block =>
    block.blockName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.blockId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getExamCenterName(block.examCenterId)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(room =>
    room.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBlockName(room.blockId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getExamCenterName(room.examCenterId)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Block and Resource</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-6 py-3 font-medium text-sm ${activeTab === 'blocks' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaBuilding className="inline mr-2" />
            Blocks
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-3 font-medium text-sm ${activeTab === 'rooms' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaDoorOpen className="inline mr-2" />
            Rooms
          </button>
        </div>
      </div>

      {/* Search and Add Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => { setEditingItem(null); activeTab === 'blocks' ? resetBlockForm() : resetRoomForm(); setShowModal(true); }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <FaPlus className="mr-2" /> Add {activeTab === 'blocks' ? 'Block' : 'Room'}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'blocks' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Blocks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : filteredBlocks.length > 0 ? (
                  filteredBlocks.map((block) => (
                    <tr key={block._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{block.blockId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{block.blockName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getExamCenterName(block.examCenterId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{block.totalRooms}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{block.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          block.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {block.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(block, 'blocks')} className="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(block._id, 'blocks')} className="text-red-600 hover:text-red-900" title="Delete">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No blocks found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Rooms</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Center</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <tr key={room._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-600">{room.roomId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.roomName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getBlockName(room.blockId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getExamCenterName(room.examCenterId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.roomType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room.floorNumber || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          room.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {room.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(room, 'rooms')} className="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(room._id, 'rooms')} className="text-red-600 hover:text-red-900" title="Delete">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">No rooms found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? `Edit ${activeTab === 'blocks' ? 'Block' : 'Room'}` : `Add New ${activeTab === 'blocks' ? 'Block' : 'Room'}`}
              </h3>
              <form onSubmit={activeTab === 'blocks' ? handleBlockSubmit : handleRoomSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {activeTab === 'blocks' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Block ID *</label>
                        <input
                          type="text"
                          name="blockId"
                          value={blockFormData.blockId}
                          onChange={(e) => setBlockFormData({...blockFormData, blockId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                          disabled={!!editingItem}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Block Name *</label>
                        <input
                          type="text"
                          name="blockName"
                          value={blockFormData.blockName}
                          onChange={(e) => setBlockFormData({...blockFormData, blockName: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center *</label>
                        <select
                          name="examCenterId"
                          value={blockFormData.examCenterId}
                          onChange={(e) => setBlockFormData({...blockFormData, examCenterId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          <option value="">Select Exam Center</option>
                          {examCenters.map(center => (
                            <option key={center.examCenterId} value={center.examCenterId}>
                              {center.examCenterName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms *</label>
                        <input
                          type="number"
                          name="totalRooms"
                          value={blockFormData.totalRooms}
                          onChange={(e) => setBlockFormData({...blockFormData, totalRooms: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                        <input
                          type="number"
                          name="capacity"
                          value={blockFormData.capacity}
                          onChange={(e) => setBlockFormData({...blockFormData, capacity: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room ID *</label>
                        <input
                          type="text"
                          name="roomId"
                          value={roomFormData.roomId}
                          onChange={(e) => setRoomFormData({...roomFormData, roomId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                          disabled={!!editingItem}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                        <input
                          type="text"
                          name="roomName"
                          value={roomFormData.roomName}
                          onChange={(e) => setRoomFormData({...roomFormData, roomName: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Center *</label>
                        <select
                          name="examCenterId"
                          value={roomFormData.examCenterId}
                          onChange={(e) => setRoomFormData({...roomFormData, examCenterId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          <option value="">Select Exam Center</option>
                          {examCenters.map(center => (
                            <option key={center.examCenterId} value={center.examCenterId}>
                              {center.examCenterName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                        <select
                          name="blockId"
                          value={roomFormData.blockId}
                          onChange={(e) => setRoomFormData({...roomFormData, blockId: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        >
                          <option value="">Select Block</option>
                          {blocks.map(block => (
                            <option key={block._id} value={block._id}>
                              {block.blockName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                        <input
                          type="number"
                          name="capacity"
                          value={roomFormData.capacity}
                          onChange={(e) => setRoomFormData({...roomFormData, capacity: e.target.value})}
                          className="w-full p-2 border rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                          name="roomType"
                          value={roomFormData.roomType}
                          onChange={(e) => setRoomFormData({...roomFormData, roomType: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="CLASSROOM">Classroom</option>
                          <option value="LABORATORY">Laboratory</option>
                          <option value="AUDITORIUM">Auditorium</option>
                          <option value="CONFERENCE">Conference Room</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                        <input
                          type="number"
                          name="floorNumber"
                          value={roomFormData.floorNumber}
                          onChange={(e) => setRoomFormData({...roomFormData, floorNumber: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={activeTab === 'blocks' ? blockFormData.isActive : roomFormData.isActive}
                        onChange={(e) => {
                          if (activeTab === 'blocks') {
                            setBlockFormData({...blockFormData, isActive: e.target.checked});
                          } else {
                            setRoomFormData({...roomFormData, isActive: e.target.checked});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBlockAndResource;