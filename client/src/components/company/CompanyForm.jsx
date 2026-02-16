import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';

const CompanyForm = ({ onSave, onCancel, initialData, loading }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    abbr: '',
    default_currency: 'INR',
    country: 'India',
    domain: 'Services',
    is_group: 0,
    parent_company: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        company_name: initialData.company_name || '',
        abbr: initialData.abbr || '',
        default_currency: initialData.default_currency || 'INR',
        country: initialData.country || 'India',
        domain: initialData.domain || 'Services',
        is_group: initialData.is_group || 0,
        parent_company: initialData.parent_company || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
        <div className="p-6 border-b bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {initialData ? 'Edit Company' : 'New Company'}
              </h1>
              <p className="text-gray-600 mt-1">
                {initialData ? `Editing: ${initialData.company_name}` : 'Create new company master'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abbreviation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="abbr"
                  value={formData.abbr}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="default_currency"
                  value={formData.default_currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Services">Services</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Distribution">Distribution</option>
                  <option value="Non Profit">Non Profit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Company
                </label>
                <input
                  type="text"
                  name="parent_company"
                  value={formData.parent_company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Leave empty if root"
                />
              </div>

              <div className="col-span-2 flex items-center">
                <input
                  type="checkbox"
                  name="is_group"
                  checked={formData.is_group === 1}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Is Group Company
                </label>
              </div>

            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading && <Spin size="small" className="mr-2" />}
                Save Company
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;