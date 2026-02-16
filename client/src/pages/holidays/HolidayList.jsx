import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Spin, notification, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const HolidayList = () => {
  const navigate = useNavigate();
  const [holidayLists, setHolidayLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, contextHolder] = Modal.useModal();

  const fetchHolidayLists = async () => {
    try {
      const response = await api.get('/api/resource/Holiday List?fields=["name","from_date","to_date"]&limit_page_length=None');
      if (response.data && response.data.data) {
        setHolidayLists(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching holiday lists:", error);
      notification.error({ message: "Failed to fetch holiday lists" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidayLists();
  }, []);

  const filteredHolidayLists = holidayLists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (e, list) => {
    e.stopPropagation();
    modal.confirm({
      title: 'Are you sure you want to delete this Holiday List?',
      icon: <ExclamationCircleOutlined />,
      content: `This will permanently delete the holiday list "${list.name}".`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const encodedName = encodeURIComponent(list.name);
          await api.delete(`/api/resource/Holiday List/${encodedName}`);
          notification.success({ message: "Holiday List deleted successfully" });
          fetchHolidayLists();
        } catch (error) {
          console.error("Error deleting holiday list:", error);
          notification.error({
            message: "Failed to delete holiday list",
            description: error.response?.data?.exception || error.message
          });
        }
      },
    });
  };

  const handleEdit = (list) => {
    navigate(`/master/holiday-master/edit/${encodeURIComponent(list.name)}`);
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
                <h1 className="text-3xl font-bold text-gray-800">Holiday Lists</h1>
                <p className="text-gray-600 mt-1">Manage holiday calendars for your organization</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/master/holiday-master/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <span className="mr-2">+</span>
                  New Holiday List
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

          {/* Search */}
          <div className="px-8 py-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search holiday lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* List */}
          <div className="px-8 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHolidayLists.map((list) => (
                      <tr key={list.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(list)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{list.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.from_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{list.to_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(list); }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, list)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredHolidayLists.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No holiday lists found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayList;