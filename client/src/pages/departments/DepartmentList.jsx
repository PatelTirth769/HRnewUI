import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Import API service
import { Spin, notification } from 'antd'; // Import Ant Design components

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/api/resource/Branch?fields=["*"]&limit_page_length=None');
      if (response.data && response.data.data) {
        // Map Branch data to the structure expected by the UI, or adjust UI
        // For now, we'll use the raw data and adjust the UI rendering
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      notification.error({ message: "Failed to fetch branches" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filteredDepartments = departments.filter(dept => {
    const name = dept.name || dept.branch || ''; // Adjust based on actual API field
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDepartmentClick = (department) => {
    navigate(`/master/departments/${department.name}`, { state: { department } });
  };

  const handleAddNew = () => {
    navigate('/master/departments/new');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Branch Management</h1> {/* Renamed to Branch */}
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add New Branch
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by branch name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDepartments.map((department) => (
                  <div
                    key={department.name}
                    onClick={() => handleDepartmentClick(department)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{department.name}</h3> {/* Display Name */}
                      </div>
                    </div>

                    {/* You can add more fields here if available in the API response */}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        {/* Example generic info */}
                        <span className="text-gray-500">Modified:</span>
                        <span className="font-medium">{department.modified}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDepartments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No branches found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;
