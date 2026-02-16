import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Spin, notification, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DesignationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [designation, setDesignation] = useState(location.state?.designation || null);
  const [loading, setLoading] = useState(!designation);
  const [modal, contextHolder] = Modal.useModal();

  useEffect(() => {
    const fetchDesignation = async () => {
      try {
        const response = await api.get(`/api/resource/Designation/${id}`);
        if (response.data && response.data.data) {
          setDesignation(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching designation:", error);
        notification.error({ message: "Failed to fetch designation details" });
      } finally {
        setLoading(false);
      }
    };

    if (!designation) {
      fetchDesignation();
    } else {
      setLoading(false);
    }
  }, [id, designation]);

  const handleDelete = () => {
    modal.confirm({
      title: 'Are you sure you want to delete this designation?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const encodedId = encodeURIComponent(id);
          await api.delete(`/api/resource/Designation/${encodedId}`);
          notification.success({ message: "Designation deleted successfully" });
          navigate('/master/designations');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!designation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Designation Not Found</h2>
        <Link to="/master/designations" className="text-blue-600 hover:text-blue-800">
          ← Back to Designations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {contextHolder}
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Link
                    to="/master/designations"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Back to Designations
                  </Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Designation Details</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{designation.designation_name || designation.name}</h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate(`/master/designations/${id}/edit`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
                <p className="text-gray-700">{designation.description || 'No description provided.'}</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="font-medium text-gray-800">{designation.modified}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created On</p>
                    <p className="font-medium text-gray-800">{designation.creation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationDetail;