import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Spin, notification, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DesignationList = () => {
  const navigate = useNavigate();
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, contextHolder] = Modal.useModal();

  const fetchDesignations = async () => {
    try {
      const response = await api.get('/api/resource/Designation?fields=["*"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setDesignations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
      notification.error({ message: "Failed to fetch designations" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const filteredDesignations = designations.filter(designation => {
    const name = designation.name || designation.designation_name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetails = (designation) => {
    navigate(`/master/designations/${designation.name}`, { state: { designation } });
  };

  const handleEdit = (e, designation) => {
    e.stopPropagation();
    navigate(`/master/designations/${designation.name}/edit`, { state: { designation } });
  };

  const handleDelete = (e, designation) => {
    e.stopPropagation();
    modal.confirm({
      title: 'Are you sure you want to delete this designation?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          // Ensure spaces and special characters are encoded
          const encodedName = encodeURIComponent(designation.name);
          await api.delete(`/api/resource/Designation/${encodedName}`);
          notification.success({ message: "Designation deleted successfully" });
          fetchDesignations(); // Refresh list
        } catch (error) {
          console.error("Error deleting designation:", error);
          notification.error({
            message: "Failed to delete designation",
            description: error.response?.data?.exception || error.message
          });
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {contextHolder}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Designations</h1>
                <p className="text-gray-600 mt-1">Manage employee designations and roles</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/master/designations/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <span className="mr-2">+</span>
                  New Designation
                </Link>
                <Link
                  to="/"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search designations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Designation Cards Grid */}
          <div className="px-8 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesignations.map((designation) => (
                  <div
                    key={designation.name}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                    onClick={() => handleViewDetails(designation)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                          {designation.designation_name || designation.name}
                        </h3>
                        {/* <p className="text-sm text-gray-600">{designation.name}</p> */}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{designation.description}</p>

                    <div className="flex space-x-2 mt-auto pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => handleEdit(e, designation)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, designation)}
                        className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDesignations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No designations found</h3>
                <Link
                  to="/master/designations/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create New Designation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationList;