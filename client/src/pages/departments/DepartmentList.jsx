import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Import API service
import { Spin, notification, Modal } from 'antd'; // Import Ant Design components
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DepartmentList = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/resource/Department?fields=["name","department_name","company","parent_department","disabled"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      notification.error({ message: "Failed to fetch departments" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic
  const filteredDepartments = departments.filter(dept => {
    const name = dept.department_name || dept.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDepartmentClick = (department) => {
    navigate(`/master/departments/${department.name}`, { state: { department } });
  };

  const handleAddNew = () => {
    navigate('/master/departments/new');
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // Stores the department name (ID) to delete
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteClick = (e, departmentName) => {
    e.stopPropagation();
    setDeleteTarget(departmentName);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const encodedName = encodeURIComponent(deleteTarget);
      console.log(`[DepartmentList] Attempting DELETE for: ${deleteTarget} (Encoded: ${encodedName})`);
      console.log(`[DepartmentList] API URL: /api/resource/Department/${encodedName}`);

      const response = await api.delete(`/api/resource/Department/${encodedName}`);

      console.log("[DepartmentList] Delete SUCCESS. Response:", response);
      notification.success({ message: `Department '${deleteTarget}' deleted successfully` });

      console.log("[DepartmentList] Refreshing list...");
      await fetchDepartments();
      console.log("[DepartmentList] List refreshed.");
      setIsDeleteModalVisible(false); // Close modal only on success
      setDeleteTarget(null);
    } catch (error) {
      console.error("[DepartmentList] Delete FAILED:", error);
      setIsDeleteModalVisible(false); // Close confirmation modal to show error modal

      const errorTitle = error.response?.data?.exc_type || "Delete Failed";
      const errorMessage = error.response?.data?.exception || error.message || "Unknown error occurred";
      const errorDetails = JSON.stringify(error.response?.data || {}, null, 2);

      Modal.error({
        title: errorTitle,
        content: (
          <div>
            <p>{errorMessage}</p>
            <details className="mt-2 text-xs text-gray-500">
              <summary>Technical Details</summary>
              <pre>{errorDetails}</pre>
            </details>
          </div>
        ),
        width: 600,
      });
    }
  };

  const handleEdit = (e, department) => {
    e.stopPropagation();
    navigate(`/master/departments/${department.name}/edit`, { state: { department } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add New Department
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by department name..."
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
                        <h3 className="text-lg font-semibold text-gray-800">{department.department_name}</h3>
                        <p className="text-sm text-gray-500">{department.name}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => handleEdit(e, department)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, department.name)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {department.company && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Company:</span>
                          <span className="font-medium text-gray-700">{department.company}</span>
                        </div>
                      )}
                      {department.parent_department && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Parent Dept:</span>
                          <span className="font-medium text-gray-700">{department.parent_department}</span>
                        </div>
                      )}
                      {department.disabled === 1 && (
                        <div className="mt-2">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Disabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredDepartments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No departments found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Are you sure delete this department?"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Yes"
        okType="danger"
        cancelText="No"
      >
        <p>This action cannot be undone.</p>
        <p className="text-sm text-gray-500 mt-2">Department ID: <strong>{deleteTarget}</strong></p>
      </Modal>
    </div>
  );
};

export default DepartmentList;
