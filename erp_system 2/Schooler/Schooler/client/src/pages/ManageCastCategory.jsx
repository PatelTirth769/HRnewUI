import React, { useState } from 'react';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaFileExport, FaFileImport } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageCastCategory = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('cast');
  
  // State for data
  const [casts, setCasts] = useState([
    { id: 1, castId: 'C001', castName: 'General', active: true },
    { id: 2, castId: 'C002', castName: 'OBC', active: true },
    { id: 3, castId: 'C003', castName: 'SC', active: true },
    { id: 4, castId: 'C004', castName: 'ST', active: false }
  ]);
  
  const [categories, setCategories] = useState([
    { id: 1, categoryId: 'CAT001', categoryName: 'Open', active: true },
    { id: 2, categoryId: 'CAT002', categoryName: 'Reserved', active: true },
    { id: 3, categoryId: 'CAT003', categoryName: 'Minority', active: false }
  ]);
  
  // State for forms
  const [castForm, setCastForm] = useState({ castId: '', castName: '', active: true });
  const [categoryForm, setCategoryForm] = useState({ categoryId: '', categoryName: '', active: true });
  
  // State for edit mode
  const [editCastMode, setEditCastMode] = useState(false);
  const [editCategoryMode, setEditCategoryMode] = useState(false);
  
  // State for search
  const [castSearchTerm, setCastSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  
  // State for loading
  const [loading, setLoading] = useState(false);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  // Form handlers for Cast
  const handleCastFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCastForm({
      ...castForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCastSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!castForm.castName) {
      toast.error('Cast Name is required');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (editCastMode) {
        // Update existing cast
        const updatedCasts = casts.map(cast => 
          cast.id === castForm.id ? { ...castForm } : cast
        );
        setCasts(updatedCasts);
        toast.success('Cast updated successfully');
      } else {
        // Add new cast
        const newCast = {
          id: casts.length + 1,
          castId: castForm.castId || `C00${casts.length + 1}`,
          castName: castForm.castName,
          active: castForm.active
        };
        setCasts([...casts, newCast]);
        toast.success('Cast added successfully');
      }
      
      // Reset form
      setCastForm({ castId: '', castName: '', active: true });
      setEditCastMode(false);
      setLoading(false);
    }, 500);
  };

  // Form handlers for Category
  const handleCategoryFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!categoryForm.categoryName) {
      toast.error('Category Name is required');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      if (editCategoryMode) {
        // Update existing category
        const updatedCategories = categories.map(category => 
          category.id === categoryForm.id ? { ...categoryForm } : category
        );
        setCategories(updatedCategories);
        toast.success('Category updated successfully');
      } else {
        // Add new category
        const newCategory = {
          id: categories.length + 1,
          categoryId: categoryForm.categoryId || `CAT00${categories.length + 1}`,
          categoryName: categoryForm.categoryName,
          active: categoryForm.active
        };
        setCategories([...categories, newCategory]);
        toast.success('Category added successfully');
      }
      
      // Reset form
      setCategoryForm({ categoryId: '', categoryName: '', active: true });
      setEditCategoryMode(false);
      setLoading(false);
    }, 500);
  };

  // Edit handlers
  const handleEditCast = (cast) => {
    setCastForm({
      id: cast.id,
      castId: cast.castId,
      castName: cast.castName,
      active: cast.active
    });
    setEditCastMode(true);
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
      id: category.id,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      active: category.active
    });
    setEditCategoryMode(true);
  };

  // Delete handlers (soft delete)
  const confirmDelete = () => {
    setLoading(true);
    
    setTimeout(() => {
      if (deleteType === 'cast') {
        const updatedCasts = casts.map(cast => 
          cast.id === itemToDelete.id ? { ...cast, active: false } : cast
        );
        setCasts(updatedCasts);
        toast.success('Cast deactivated successfully');
      } else if (deleteType === 'category') {
        const updatedCategories = categories.map(category => 
          category.id === itemToDelete.id ? { ...category, active: false } : category
        );
        setCategories(updatedCategories);
        toast.success('Category deactivated successfully');
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType('');
      setLoading(false);
    }, 500);
  };

  const handleDeleteCast = (cast) => {
    setItemToDelete(cast);
    setDeleteType('cast');
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = (category) => {
    setItemToDelete(category);
    setDeleteType('category');
    setShowDeleteModal(true);
  };

  // Filter functions
  const filteredCasts = casts.filter(cast => 
    cast.castName.toLowerCase().includes(castSearchTerm.toLowerCase()) ||
    cast.castId.toLowerCase().includes(castSearchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(category => 
    category.categoryName.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    category.categoryId.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // In a real application, you would process the Excel file here
    // For now, we'll just show a success message
    toast.success(`${type === 'cast' ? 'Cast' : 'Category'} data uploaded successfully`);
  };

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Cast/Category</h1>
        {activeTab === 'cast' && (
          <div className="flex items-center">
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center">
              <FaFileImport className="mr-2" />
              Upload Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'cast')}
              />
            </label>
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2 flex items-center">
              <FaFileExport className="mr-2" />
              Export
            </button>
          </div>
        )}
        {activeTab === 'category' && (
          <div className="flex items-center">
            <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center">
              <FaFileImport className="mr-2" />
              Upload Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'category')}
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
          className={`py-2 px-4 ${activeTab === 'cast' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('cast')}
        >
          Cast Management
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'category' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('category')}
        >
          Category Management
        </button>
      </div>
      
      {/* Cast Management Tab */}
      {activeTab === 'cast' && (
        <div>
          {/* Cast Form */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{editCastMode ? 'Edit Cast' : 'Add Cast'}</h2>
            <form onSubmit={handleCastSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cast ID</label>
                  <input
                    type="text"
                    name="castId"
                    value={castForm.castId}
                    onChange={handleCastFormChange}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2 border rounded"
                    disabled={editCastMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cast Name</label>
                  <input
                    type="text"
                    name="castName"
                    value={castForm.castName}
                    onChange={handleCastFormChange}
                    placeholder="Enter cast name"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="active"
                      checked={castForm.active}
                      onChange={handleCastFormChange}
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
                    setCastForm({ castId: '', castName: '', active: true });
                    setEditCastMode(false);
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
                  {loading ? 'Processing...' : editCastMode ? 'Update Cast' : 'Add Cast'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Cast Table */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cast List</h2>
              <div className="flex items-center">
                <div className="relative mr-2">
                  <input
                    type="text"
                    placeholder="Search casts..."
                    value={castSearchTerm}
                    onChange={(e) => setCastSearchTerm(e.target.value)}
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
                      <th className="py-2 px-4 border-b">Cast ID</th>
                      <th className="py-2 px-4 border-b">Cast Name</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCasts.length > 0 ? (
                      filteredCasts.map((cast) => (
                        <tr key={cast.id}>
                          <td className="py-2 px-4 border-b text-center">{cast.castId}</td>
                          <td className="py-2 px-4 border-b text-center">{cast.castName}</td>
                          <td className="py-2 px-4 border-b text-center">
                            <span className={`px-2 py-1 rounded text-xs ${cast.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {cast.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <button
                              onClick={() => handleEditCast(cast)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCast(cast)}
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
                          No casts found
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
      
      {/* Category Management Tab */}
      {activeTab === 'category' && (
        <div>
          {/* Category Form */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{editCategoryMode ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
                  <input
                    type="text"
                    name="categoryId"
                    value={categoryForm.categoryId}
                    onChange={handleCategoryFormChange}
                    placeholder="Auto-generated if empty"
                    className="w-full p-2 border rounded"
                    disabled={editCategoryMode}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    name="categoryName"
                    value={categoryForm.categoryName}
                    onChange={handleCategoryFormChange}
                    placeholder="Enter category name"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="inline-flex items-center mt-4">
                    <input
                      type="checkbox"
                      name="active"
                      checked={categoryForm.active}
                      onChange={handleCategoryFormChange}
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
                    setCategoryForm({ categoryId: '', categoryName: '', active: true });
                    setEditCategoryMode(false);
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
                  {loading ? 'Processing...' : editCategoryMode ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Category Table */}
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Category List</h2>
              <div className="flex items-center">
                <div className="relative mr-2">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
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
                      <th className="py-2 px-4 border-b">Category ID</th>
                      <th className="py-2 px-4 border-b">Category Name</th>
                      <th className="py-2 px-4 border-b">Status</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((category) => (
                        <tr key={category.id}>
                          <td className="py-2 px-4 border-b text-center">{category.categoryId}</td>
                          <td className="py-2 px-4 border-b text-center">{category.categoryName}</td>
                          <td className="py-2 px-4 border-b text-center">
                            <span className={`px-2 py-1 rounded text-xs ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {category.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
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
                          No categories found
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
              Are you sure you want to deactivate this {deleteType === 'cast' ? 'cast' : 'category'}?
              <br />
              <span className="font-semibold">
                {deleteType === 'cast' ? itemToDelete.castName : itemToDelete.categoryName}
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

export default ManageCastCategory;