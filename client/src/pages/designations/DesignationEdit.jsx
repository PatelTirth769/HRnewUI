import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { notification, Spin } from 'antd';

const DesignationEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === 'new';

  const [formData, setFormData] = useState({
    designation_name: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const fetchDesignation = async () => {
        try {
          const response = await api.get(`/api/resource/Designation/${id}`);
          if (response.data && response.data.data) {
            setFormData({
              designation_name: response.data.data.designation_name || response.data.data.name,
              description: response.data.data.description || ''
            });
          }
        } catch (error) {
          console.error("Error fetching designation:", error);
          notification.error({ message: "Failed to fetch designation details" });
        } finally {
          setFetching(false);
        }
      };
      fetchDesignation();
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.designation_name.trim()) {
      notification.error({ message: "Designation Name is required" });
      return;
    }

    setLoading(true);
    try {
      if (isNew) {
        await api.post('/api/resource/Designation', {
          designation_name: formData.designation_name,
          description: formData.description
        });
        notification.success({ message: "Designation created successfully" });
      } else {
        await api.put(`/api/resource/Designation/${id}`, {
          description: formData.description
        });
        notification.success({ message: "Designation updated successfully" });
      }
      navigate('/master/designations');
    } catch (error) {
      console.error("Error saving designation:", error);
      notification.error({
        message: "Failed to save designation",
        description: error.response?.data?.exception || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 flex justify-center"><Spin size="large" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{isNew ? 'Create Designation' : 'Edit Designation'}</h1>
                <p className="text-gray-600">{isNew ? 'Add a new designation' : 'Update designation details'}</p>
              </div>
              <Link to="/master/designations" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Cancel
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation Name *
                    </label>
                    <input
                      type="text"
                      name="designation_name"
                      value={formData.designation_name}
                      onChange={handleChange}
                      disabled={!isNew} // Usually Name is ID and cannot be changed easily
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${!isNew ? 'bg-gray-100' : ''}`}
                      placeholder="Enter designation name"
                      required
                    />
                    {!isNew && <p className="text-xs text-gray-500 mt-1">Designation Name cannot be changed once created.</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter designation description"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/master/designations')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                disabled={loading}
              >
                {loading && <Spin size="small" className="mr-2" />}
                {isNew ? 'Create Designation' : 'Update Designation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DesignationEdit;