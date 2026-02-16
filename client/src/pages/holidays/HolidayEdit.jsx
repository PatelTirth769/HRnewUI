import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { notification, Spin, Button, Table, Input, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const HolidayEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    holiday_list_name: '',
    from_date: '',
    to_date: '',
    holidays: []
  });

  useEffect(() => {
    const fetchHolidayList = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const response = await api.get(`/api/resource/Holiday List/${decodedId}`);
        if (response.data && response.data.data) {
          const data = response.data.data;
          setFormData({
            holiday_list_name: data.name,
            from_date: data.from_date,
            to_date: data.to_date,
            holidays: data.holidays ? data.holidays.map((h, index) => ({
              ...h,
              description: h.description ? h.description.replace(/<\/?[^>]+(>|$)/g, "") : "",
              key: index // Add key for React list
            })) : []
          });
        }
      } catch (error) {
        console.error("Error fetching holiday list:", error);
        notification.error({ message: "Failed to fetch holiday list details" });
      } finally {
        setFetching(false);
      }
    };

    fetchHolidayList();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddHoliday = () => {
    setFormData(prev => ({
      ...prev,
      holidays: [...prev.holidays, { holiday_date: '', description: '', key: Date.now() }]
    }));
  };

  const handleHolidayChange = (index, field, value) => {
    const newHolidays = [...formData.holidays];
    newHolidays[index][field] = value;
    setFormData(prev => ({ ...prev, holidays: newHolidays }));
  };

  const handleRemoveHoliday = (index) => {
    const newHolidays = formData.holidays.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, holidays: newHolidays }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.holiday_list_name || !formData.from_date || !formData.to_date) {
      notification.error({ message: "Please fill all required fields" });
      return;
    }

    setLoading(true);
    try {
      const decodedId = decodeURIComponent(id);
      const payload = {
        from_date: formData.from_date,
        to_date: formData.to_date,
        holidays: formData.holidays.map(({ key, ...rest }) => rest) // Remove key
      };

      await api.put(`/api/resource/Holiday List/${decodedId}`, payload);
      notification.success({ message: "Holiday List updated successfully" });
      navigate('/master/holiday-master');
    } catch (error) {
      console.error("Error updating holiday list:", error);
      notification.error({
        message: "Failed to update holiday list",
        description: error.response?.data?.exception || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 flex justify-center"><Spin size="large" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Holiday List</h1>
                <p className="text-gray-600">Update holiday calendar details</p>
              </div>
              <Link to="/master/holiday-master" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Cancel
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="holiday_list_name"
                  value={formData.holiday_list_name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Name cannot be changed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date *</label>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date *</label>
                <input
                  type="date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Holidays</h3>
                <Button type="dashed" onClick={handleAddHoliday} icon={<PlusOutlined />}>
                  Add Holiday
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.holidays.map((holiday, index) => (
                      <tr key={holiday.key || index}>
                        <td className="px-6 py-2">
                          <input
                            type="date"
                            value={holiday.holiday_date}
                            onChange={(e) => handleHolidayChange(index, 'holiday_date', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </td>
                        <td className="px-6 py-2">
                          <input
                            type="text"
                            value={holiday.description}
                            onChange={(e) => handleHolidayChange(index, 'description', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Holiday Name"
                            required
                          />
                        </td>
                        <td className="px-6 py-2 text-right">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveHoliday(index)}
                          />
                        </td>
                      </tr>
                    ))}
                    {formData.holidays.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          No holidays added yet. Click "Add Holiday" to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/master/holiday-master')}
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
                Update Holiday List
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HolidayEdit;