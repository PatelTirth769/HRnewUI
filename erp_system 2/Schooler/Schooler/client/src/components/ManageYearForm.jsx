import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-hot-toast';
import { createYear, updateYear } from '../services/manageYearService';

const ManageYearForm = ({ onSuccess, editData, setEditData }) => {
  const initialFormState = {
    yearId: '',
    year: '',
    instituteId: '',
    academy: '',
    startDate: null,
    endDate: null,
    finalYear: false,
    active: true
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        startDate: editData.startDate ? new Date(editData.startDate) : null,
        endDate: editData.endDate ? new Date(editData.endDate) : null
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (date, field) => {
    setFormData({
      ...formData,
      [field]: date
    });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    if (setEditData) setEditData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null
      };

      if (editData) {
        await updateYear(editData._id, payload);
        toast.success('Year updated successfully');
      } else {
        await createYear(payload);
        toast.success('Year added successfully');
      }

      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">{editData ? 'Edit' : 'Add'} Academic Year</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year ID</label>
          <input
            type="text"
            name="yearId"
            value={formData.yearId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Year ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 2025-26"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Institute ID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academy</label>
          <input
            type="text"
            name="academy"
            value={formData.academy}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Academy Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <DatePicker
            selected={formData.startDate}
            onChange={(date) => handleDateChange(date, 'startDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="Select start date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <DatePicker
            selected={formData.endDate}
            onChange={(date) => handleDateChange(date, 'endDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="dd/MM/yyyy"
            placeholderText="Select end date"
          />
        </div>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            name="finalYear"
            id="finalYear"
            checked={formData.finalYear}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="finalYear" className="ml-2 block text-sm text-gray-700">
            Final Year
          </label>
        </div>

        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            name="active"
            id="active"
            checked={formData.active}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Active
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editData ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageYearForm;