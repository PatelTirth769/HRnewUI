import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { notification, Spin, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const DepartmentDetail = () => {
  const { id } = useParams(); // id is the department name
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const response = await api.get(`/api/resource/Department/${encodeURIComponent(id)}`);
        if (response.data && response.data.data) {
          setDepartment(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching department:", error);
        notification.error({ message: "Failed to fetch department details" });
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const encodedId = encodeURIComponent(id);
      console.log(`[DepartmentDetail] Attempting DELETE for: ${id} (Encoded: ${encodedId})`);

      await api.delete(`/api/resource/Department/${encodedId}`);

      console.log("[DepartmentDetail] Delete SUCCESS.");
      notification.success({ message: "Department deleted successfully" });
      setIsDeleteModalVisible(false); // Close modal
      navigate('/master/departments');
    } catch (error) {
      console.error("[DepartmentDetail] Delete FAILED:", error);
      setIsDeleteModalVisible(false); // Close delete modal to show error modal

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

  const handleEdit = () => {
    navigate(`/master/departments/${encodeURIComponent(id)}/edit`, { state: { department } });
  };

  if (loading) return <div className="p-6 flex justify-center"><Spin size="large" /></div>;
  if (!department) return <div className="p-6 text-center">Department not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{department.department_name}</h1>
                <p className="text-gray-600">Department Details</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Department
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Department
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">Department Name</label>
                <p className="text-lg font-semibold text-gray-800">{department.department_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Name (ID)</label>
                <p className="text-gray-800">{department.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Company</label>
                <p className="text-gray-800">{department.company || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Parent Department</label>
                <p className="text-gray-800">{department.parent_department || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Leave Block List</label>
                <p className="text-gray-800">{department.leave_block_list || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Payroll Cost Center</label>
                <p className="text-gray-800">{department.payroll_cost_center || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Are you sure delete this department?"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Yes, Delete"
        okType="danger"
        cancelText="No"
      >
        <p>This action cannot be undone.</p>
        <p className="text-sm text-gray-500 mt-2">Department ID: <strong>{id}</strong></p>
      </Modal>
    </div>
  );
};

export default DepartmentDetail;
