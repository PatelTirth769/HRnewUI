import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const DesignationEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    level: '',
    status: 'Active',
    description: '',
    responsibilities: '',
    requirements: '',
    minSalary: '',
    maxSalary: '',
    reportingTo: '',
    location: '',
    experienceRequired: '',
    qualifications: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock designation data for editing
  useEffect(() => {
    const mockDesignationData = {
      name: 'BOMBAIM',
      code: 'BOM-001',
      department: 'Operations',
      level: 'Senior',
      status: 'Active',
      description: 'Bombay Operations Manager - Senior level position responsible for managing operations in the Bombay region',
      responsibilities: 'Oversee daily operations in Bombay region\nCoordinate with regional teams\nManage operational budgets\nEnsure compliance with company policies\nReport to senior management',
      requirements: 'Bachelor\'s degree in Business Administration\n5+ years of operational management experience\nStrong leadership and communication skills\nKnowledge of regional market dynamics\nProficiency in MS Office and operational software',
      minSalary: '800000',
      maxSalary: '1500000',
      reportingTo: 'Regional Director',
      location: 'Mumbai, Pune',
      experienceRequired: '5-8 years',
      qualifications: 'Bachelor\'s degree in Business Administration or related field'
    };

    setFormData(mockDesignationData);
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
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
      newErrors.name = 'Designation name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Designation code is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.level.trim()) {
      newErrors.level = 'Level is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.minSalary && formData.maxSalary) {
      if (parseInt(formData.minSalary) >= parseInt(formData.maxSalary)) {
        newErrors.maxSalary = 'Maximum salary must be greater than minimum salary';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Designation updated successfully!');
      navigate(`/master/designations/${id}`);
    } catch (error) {
      alert('Failed to update designation. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/master/designations/${id}`);
  };

  const handleReset = () => {
    const mockDesignationData = {
      name: 'BOMBAIM',
      code: 'BOM-001',
      department: 'Operations',
      level: 'Senior',
      status: 'Active',
      description: 'Bombay Operations Manager - Senior level position responsible for managing operations in the Bombay region',
      responsibilities: 'Oversee daily operations in Bombay region\nCoordinate with regional teams\nManage operational budgets\nEnsure compliance with company policies\nReport to senior management',
      requirements: 'Bachelor\'s degree in Business Administration\n5+ years of operational management experience\nStrong leadership and communication skills\nKnowledge of regional market dynamics\nProficiency in MS Office and operational software',
      minSalary: '800000',
      maxSalary: '1500000',
      reportingTo: 'Regional Director',
      location: 'Mumbai, Pune',
      experienceRequired: '5-8 years',
      qualifications: 'Bachelor\'s degree in Business Administration or related field'
    };

    setFormData(mockDesignationData);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Link 
                    to={`/master/designations/${id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Designation
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Edit Designation</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Designation</h1>
                <p className="text-gray-600">Update designation details and information</p>
              </div>
              <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                ← Home
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  📋 Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter designation name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.code ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter designation code"
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Department</option>
                      <option value="Operations">Operations</option>
                      <option value="IT">IT</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Business Development">Business Development</option>
                    </select>
                    {errors.department && (
                      <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level *
                    </label>
                    <select
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.level ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Level</option>
                      <option value="Entry">Entry</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Manager">Manager</option>
                      <option value="Director">Director</option>
                    </select>
                    {errors.level && (
                      <p className="text-red-500 text-sm mt-1">{errors.level}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting To
                    </label>
                    <input
                      type="text"
                      name="reportingTo"
                      value={formData.reportingTo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reporting manager"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter designation description"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location(s)"
                  />
                </div>
              </div>

              {/* Salary Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  💰 Salary Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="minSalary"
                      value={formData.minSalary}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter minimum salary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="maxSalary"
                      value={formData.maxSalary}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.maxSalary ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter maximum salary"
                    />
                    {errors.maxSalary && (
                      <p className="text-red-500 text-sm mt-1">{errors.maxSalary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Required
                    </label>
                    <input
                      type="text"
                      name="experienceRequired"
                      value={formData.experienceRequired}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5-8 years"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualifications
                    </label>
                    <input
                      type="text"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter required qualifications"
                    />
                  </div>
                </div>
              </div>

              {/* Responsibilities and Requirements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    📋 Key Responsibilities
                  </h2>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter key responsibilities (one per line)"
                  />
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    ✅ Requirements
                  </h2>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter requirements (one per line)"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </span>
                ) : (
                  'Update Designation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DesignationEdit;