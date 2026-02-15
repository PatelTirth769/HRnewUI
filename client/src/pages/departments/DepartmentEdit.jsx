import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const DepartmentEdit = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const departmentData = location.state?.department || {
    id: id,
    name: 'BOMBAIM',
    code: 'BOM',
    description: 'Bombay Regional Office',
    location: 'Mumbai, Maharashtra',
    address: '123, Nariman Point, Mumbai - 400021',
    head: 'Mr. Rajesh Kumar',
    contact: '022-23456789',
    email: 'bom@mumbai.company.com',
    budget: '2.5',
    revenue: '15.2',
    status: 'Active'
  };

  const [formData, setFormData] = useState({
    name: departmentData.name,
    code: departmentData.code,
    description: departmentData.description,
    location: departmentData.location,
    address: departmentData.address,
    head: departmentData.head,
    contact: departmentData.contact,
    email: departmentData.email,
    budget: departmentData.budget,
    revenue: departmentData.revenue,
    status: departmentData.status
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.head.trim()) {
      newErrors.head = 'Department head is required';
    }
    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }
    if (!formData.revenue || parseFloat(formData.revenue) <= 0) {
      newErrors.revenue = 'Revenue must be greater than 0';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      // Form is valid, submit data
      console.log('Form submitted:', formData);
      alert('Department updated successfully!');
      navigate(`/master/departments/${id}`, { 
        state: { department: { ...formData, id } } 
      });
    } else {
      setErrors(newErrors);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      navigate(`/master/departments/${id}`);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all fields?')) {
      setFormData({
        name: departmentData.name,
        code: departmentData.code,
        description: departmentData.description,
        location: departmentData.location,
        address: departmentData.address,
        head: departmentData.head,
        contact: departmentData.contact,
        email: departmentData.email,
        budget: departmentData.budget,
        revenue: departmentData.revenue,
        status: departmentData.status
      });
      setErrors({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Edit Department</h1>
                <p className="text-gray-600">Update department information</p>
              </div>
              <button
                onClick={() => navigate(`/master/departments/${id}`)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Back to Details
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department code"
                  maxLength="3"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department description"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter location"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Contact Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Head <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="head"
                  value={formData.head}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.head ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter department head name"
                />
                {errors.head && <p className="text-red-500 text-xs mt-1">{errors.head}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter contact number"
                />
                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter complete address"
                />
              </div>

              {/* Financial Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Budget (Crores) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter budget in crores"
                />
                {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue (Crores) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.revenue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter revenue in crores"
                />
                {errors.revenue && <p className="text-red-500 text-xs mt-1">{errors.revenue}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🔄 Reset
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 transition-colors"
              >
                ❌ Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                💾 Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentEdit;
