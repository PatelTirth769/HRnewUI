import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { notification, Spin } from 'antd';

const DepartmentDetail = () => {
  const { id } = useParams(); // id is the branch name
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await api.get(`/api/resource/Branch/${id}`);
        if (response.data && response.data.data) {
          setBranch(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching branch:", error);
        notification.error({ message: "Failed to fetch branch details" });
      } finally {
        setLoading(false);
      }
    };

    fetchBranch();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;

    try {
      await api.delete(`/api/resource/Branch/${id}`);
      notification.success({ message: "Branch deleted successfully" });
      navigate('/master/departments');
    } catch (error) {
      console.error("Error deleting branch:", error);
      notification.error({
        message: "Failed to delete branch",
        description: error.response?.data?.exception || error.message
      });
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><Spin size="large" /></div>;
  if (!branch) return <div className="p-6 text-center">Branch not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{branch.name}</h1>
                <p className="text-gray-600">Branch Details</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Branch
                </button>
                <button
                  onClick={() => navigate('/master/departments')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Back to List
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">Branch Name</label>
                <p className="text-lg font-semibold text-gray-800">{branch.name}</p>
              </div>
              {/* Add more fields here if available from API */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;
