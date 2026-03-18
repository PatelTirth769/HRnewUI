import React, { useState } from 'react';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaFileExport, FaFileImport } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageUserRights = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('user');
  
  // State for data
  const [users, setUsers] = useState([
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'Administrator', active: true },
    { id: 2, username: 'teacher', email: 'teacher@example.com', role: 'Teacher', active: true },
    { id: 3, username: 'student', email: 'student@example.com', role: 'Student', active: true },
    { id: 4, username: 'staff', email: 'staff@example.com', role: 'Staff', active: false }
  ]);
  
  const [userRights, setUserRights] = useState([
    { id: 1, role: 'Administrator', permissions: 'Full Access', active: true },
    { id: 2, role: 'Teacher', permissions: 'View, Edit Grades', active: true },
    { id: 3, role: 'Student', permissions: 'View Only', active: true },
    { id: 4, role: 'Staff', permissions: 'Limited Access', active: false }
  ]);
  
  // State for forms
  const [userForm, setUserForm] = useState({ username: '', email: '', role: '', password: '', active: true });
  const [userRightsForm, setUserRightsForm] = useState({ role: '', permissions: '', active: true });
  
  // State for edit mode
  const [editUserMode, setEditUserMode] = useState(false);
  const [editUserRightsMode, setEditUserRightsMode] = useState(false);
  
  // State for search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRightsSearchTerm, setUserRightsSearchTerm] = useState('');
  
  // State for loading
  const [loading, setLoading] = useState(false);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  // Form handlers for User
  const handleUserFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserForm({
      ...userForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!userForm.username || !userForm.email || !userForm.role) {
      toast.error('Username, Email and Role are required');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (editUserMode) {
        // Update existing user
        const updatedUsers = users.map(user => 
          user.id === userForm.id ? { ...userForm } : user
        );
        setUsers(updatedUsers);
        toast.success('User updated successfully');
      } else {
        // Add new user
        const newUser = {
          id: users.length + 1,
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
          active: userForm.active
        };
        setUsers([...users, newUser]);
        toast.success('User added successfully');
      }
      
      // Reset form
      setUserForm({ username: '', email: '', role: '', password: '', active: true });
      setEditUserMode(false);
      setLoading(false);
    }, 500);
  };

  // Form handlers for User Rights
  const handleUserRightsFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserRightsForm({
      ...userRightsForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleUserRightsSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!userRightsForm.role || !userRightsForm.permissions) {
      toast.error('Role and Permissions are required');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (editUserRightsMode) {
        // Update existing user rights
        const updatedUserRights = userRights.map(right => 
          right.id === userRightsForm.id ? { ...userRightsForm } : right
        );
        setUserRights(updatedUserRights);
        toast.success('User Rights updated successfully');
      } else {
        // Add new user rights
        const newUserRights = {
          id: userRights.length + 1,
          role: userRightsForm.role,
          permissions: userRightsForm.permissions,
          active: userRightsForm.active
        };
        setUserRights([...userRights, newUserRights]);
        toast.success('User Rights added successfully');
      }
      
      // Reset form
      setUserRightsForm({ role: '', permissions: '', active: true });
      setEditUserRightsMode(false);
      setLoading(false);
    }, 500);
  };

  // Edit handlers
  const handleEditUser = (user) => {
    setUserForm({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      password: '', // Don't populate password for security
      active: user.active
    });
    setEditUserMode(true);
  };

  const handleEditUserRights = (right) => {
    setUserRightsForm({
      id: right.id,
      role: right.role,
      permissions: right.permissions,
      active: right.active
    });
    setEditUserRightsMode(true);
  };

  // Delete handlers (soft delete)
  const confirmDelete = () => {
    setLoading(true);
    
    setTimeout(() => {
      if (deleteType === 'user') {
        const updatedUsers = users.map(user => 
          user.id === itemToDelete.id ? { ...user, active: false } : user
        );
        setUsers(updatedUsers);
        toast.success('User deactivated successfully');
      } else if (deleteType === 'userRights') {
        const updatedUserRights = userRights.map(right => 
          right.id === itemToDelete.id ? { ...right, active: false } : right
        );
        setUserRights(updatedUserRights);
        toast.success('User Rights deactivated successfully');
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType('');
      setLoading(false);
    }, 500);
  };

  const handleDeleteUser = (user) => {
    setItemToDelete(user);
    setDeleteType('user');
    setShowDeleteModal(true);
  };

  const handleDeleteUserRights = (right) => {
    setItemToDelete(right);
    setDeleteType('userRights');
    setShowDeleteModal(true);
  };

  // Filter functions
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredUserRights = userRights.filter(right => 
    right.role.toLowerCase().includes(userRightsSearchTerm.toLowerCase()) ||
    right.permissions.toLowerCase().includes(userRightsSearchTerm.toLowerCase())
  );

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real application, you would process the Excel file here
    // For now, we'll just show a success message
    toast.success(`${type === 'user' ? 'User' : 'User Rights'} data uploaded successfully`);
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage User/User Rights</h1>
        {activeTab === 'user' && (
          <div className="flex items-center">
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center">
              <FaFileImport className="mr-2" />
              Upload Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'user')}
              />
            </label>
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2 flex items-center">
              <FaFileExport className="mr-2" />
              Export
            </button>
          </div>
        )}
        {activeTab === 'userRights' && (
          <div className="flex items-center">
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center">
              <FaFileImport className="mr-2" />
              Upload Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'userRights')}
              />
            </label>
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2 flex items-center">
              <FaFileExport className="mr-2" />
              Export
            </button>
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 ${activeTab === 'user' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('user')}
        >
          User Management
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'userRights' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('userRights')}
        >
          User Rights Management
        </button>
      </div>
      
      {/* User Management Tab */}
      {activeTab === 'user' && (
        <div>
          {/* User Form */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{editUserMode ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleUserSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userForm.username}
                    onChange={handleUserFormChange}
                    placeholder="Enter username"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userForm.email}
                    onChange={handleUserFormChange}
                    placeholder="Enter email"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleUserFormChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    placeholder={editUserMode ? "Leave blank to keep current password" : "Enter password"}
                    className="w-full p-2 border rounded"
                    required={!editUserMode}
                  />
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="active"
                      checked={userForm.active}
                      onChange={handleUserFormChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setUserForm({ username: '', email: '', role: '', password: '', active: true });
                    setEditUserMode(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editUserMode ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
          
          {/* User Table */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User List</h2>
              <div className="flex items-center">
                <div className="relative mr-2">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="p-2 pl-8 border rounded"
                  />
                  <FaSearch className="absolute left-2 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Username</th>
                      <th className="py-2 px-4 border-b">Email</th>
                      <th className="py-2 px-4 border-b">Role</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="py-2 px-4 border-b text-center">{user.username}</td>
                          <td className="py-2 px-4 border-b text-center">{user.email}</td>
                          <td className="py-2 px-4 border-b text-center">{user.role}</td>
                          <td className="py-2 px-4 border-b text-center">
                            <span className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-4 text-center">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* User Rights Management Tab */}
      {activeTab === 'userRights' && (
        <div>
          {/* User Rights Form */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{editUserRightsMode ? 'Edit User Rights' : 'Add User Rights'}</h2>
            <form onSubmit={handleUserRightsSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={userRightsForm.role}
                    onChange={handleUserRightsFormChange}
                    placeholder="Enter role name"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <input
                    type="text"
                    name="permissions"
                    value={userRightsForm.permissions}
                    onChange={handleUserRightsFormChange}
                    placeholder="Enter permissions"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="active"
                      checked={userRightsForm.active}
                      onChange={handleUserRightsFormChange}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setUserRightsForm({ role: '', permissions: '', active: true });
                    setEditUserRightsMode(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : editUserRightsMode ? 'Update User Rights' : 'Add User Rights'}
                </button>
              </div>
            </form>
          </div>
          
          {/* User Rights Table */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Rights List</h2>
              <div className="flex items-center">
                <div className="relative mr-2">
                  <input
                    type="text"
                    placeholder="Search user rights..."
                    value={userRightsSearchTerm}
                    onChange={(e) => setUserRightsSearchTerm(e.target.value)}
                    className="p-2 pl-8 border rounded"
                  />
                  <FaSearch className="absolute left-2 top-3 text-gray-400" />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Role</th>
                      <th className="py-2 px-4 border-b">Permissions</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserRights.length > 0 ? (
                      filteredUserRights.map((right) => (
                        <tr key={right.id}>
                          <td className="py-2 px-4 border-b text-center">{right.role}</td>
                          <td className="py-2 px-4 border-b text-center">{right.permissions}</td>
                          <td className="py-2 px-4 border-b text-center">
                            <span className={`px-2 py-1 rounded text-xs ${right.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {right.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <button
                              onClick={() => handleEditUserRights(right)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteUserRights(right)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center">
                          No user rights found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Deactivate</h3>
            <p className="mb-6">
              Are you sure you want to deactivate this {deleteType === 'user' ? 'user' : 'user rights'}?
              <br />
              <span className="font-semibold">
                {deleteType === 'user' ? itemToDelete.username : itemToDelete.role}
              </span>
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUserRights;