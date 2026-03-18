import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ManageInstituteSemester = () => {
  // State for form data
  const [formData, setFormData] = useState({
    instituteSemesterId: '',
    instituteId: '',
    semesterProgramId: '',
    startDate: '',
    endDate: '',
    specialization: '',
    isActive: true
  });

  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // State for institute semester list
  const [instituteSemesters, setInstituteSemesters] = useState([
    {
      id: 1,
      instituteSemesterId: 'IS001',
      instituteId: 'INST001',
      semesterProgramId: 'SP001',
      startDate: '2023-06-01',
      endDate: '2023-12-31',
      specialization: 'Computer Science',
      isActive: true
    },
    {
      id: 2,
      instituteSemesterId: 'IS002',
      instituteId: 'INST001',
      semesterProgramId: 'SP002',
      startDate: '2023-06-01',
      endDate: '2023-12-31',
      specialization: 'Electronics',
      isActive: true
    },
    {
      id: 3,
      instituteSemesterId: 'IS003',
      instituteId: 'INST002',
      semesterProgramId: 'SP001',
      startDate: '2023-01-15',
      endDate: '2023-06-30',
      specialization: 'Mechanical',
      isActive: false
    }
  ]);

  // State for search
  const [searchTerm, setSearchTerm] = useState('');

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditMode) {
      // Update existing institute semester
      const updatedSemesters = instituteSemesters.map(semester => 
        semester.id === editId ? { ...semester, ...formData } : semester
      );
      setInstituteSemesters(updatedSemesters);
      toast.success('Institute semester updated successfully!');
    } else {
      // Add new institute semester
      const newSemester = {
        id: instituteSemesters.length + 1,
        ...formData
      };
      setInstituteSemesters([...instituteSemesters, newSemester]);
      toast.success('Institute semester added successfully!');
    }

    // Reset form
    resetForm();
  };

  // Handle edit
  const handleEdit = (id) => {
    const semesterToEdit = instituteSemesters.find(semester => semester.id === id);
    if (semesterToEdit) {
      setFormData(semesterToEdit);
      setIsEditMode(true);
      setEditId(id);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmation = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = () => {
    // Soft delete - In a real app, you might set a 'deleted' flag or call an API
    const updatedSemesters = instituteSemesters.filter(semester => semester.id !== deleteId);
    setInstituteSemesters(updatedSemesters);
    setShowDeleteModal(false);
    toast.success('Institute semester deleted successfully!');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      instituteSemesterId: '',
      instituteId: '',
      semesterProgramId: '',
      startDate: '',
      endDate: '',
      specialization: '',
      isActive: true
    });
    setIsEditMode(false);
    setEditId(null);
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter institute semesters based on search term
  const filteredSemesters = instituteSemesters.filter(semester => 
    semester.instituteSemesterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.instituteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.semesterProgramId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    semester.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Excel upload
  const handleExcelUpload = () => {
    // In a real app, this would trigger a file input and process the Excel file
    toast.info('Excel upload functionality would be implemented here.');
  };

  // Handle export
  const handleExport = () => {
    // In a real app, this would export the data to Excel or CSV
    toast.info('Export functionality would be implemented here.');
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-md">
        <h1 className="text-xl font-semibold text-gray-800">Manage Year / Manage Institute wise Semester</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          onClick={handleExcelUpload}
        >
          <FaPlus className="mr-2" /> Upload Excel
        </button>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-md shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Add Institute Semester</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute Semester ID</label>
              <input
                type="text"
                name="instituteSemesterId"
                value={formData.instituteSemesterId}
                onChange={handleChange}
                placeholder="Enter Institute Semester ID"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute ID</label>
              <input
                type="text"
                name="instituteId"
                value={formData.instituteId}
                onChange={handleChange}
                placeholder="Enter Institute ID"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester Program ID</label>
              <input
                type="text"
                name="semesterProgramId"
                value={formData.semesterProgramId}
                onChange={handleChange}
                placeholder="Enter Semester Program ID"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Enter Specialization"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Institute Semesters List */}
      <div className="bg-white rounded-md shadow-sm">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">Institute Semesters</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institute Semester ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institute ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester Program ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
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
              {filteredSemesters.map((semester) => (
                <tr key={semester.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semester.instituteSemesterId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semester.instituteId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semester.semesterProgramId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {semester.specialization}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(semester.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(semester.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${semester.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {semester.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(semester.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteConfirmation(semester.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrashAlt />
                      </button>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle"
                          id={`toggle-${semester.id}`}
                          checked={semester.isActive}
                          onChange={() => {
                            const updatedSemesters = instituteSemesters.map(s => 
                              s.id === semester.id ? { ...s, isActive: !s.isActive } : s
                            );
                            setInstituteSemesters(updatedSemesters);
                          }}
                          className="checked:bg-blue-500 outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label
                          htmlFor={`toggle-${semester.id}`}
                          className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                            semester.isActive ? 'bg-green-400' : 'bg-gray-300'
                          }`}
                        ></label>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this institute semester? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInstituteSemester;