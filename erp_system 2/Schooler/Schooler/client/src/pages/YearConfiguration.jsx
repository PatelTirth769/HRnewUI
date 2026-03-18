import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaMinus, FaDownload, FaEdit, FaToggleOn } from 'react-icons/fa';

const YearConfiguration = () => {
  const [yearConfig, setYearConfig] = useState({
    academicYear: '',
    startOfSemester: '',
    endOfSemester: '',
    classCommenceDate: '',
    classEndDate: '',
    examSchedules: [{ exam: '', startDate: '', endDate: '' }]
  });
  
  const [yearConfigs, setYearConfigs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchYearConfigurations();
  }, []);

  const fetchYearConfigurations = async () => {
    try {
      const response = await axios.get('/api/year-configurations');
      // Ensure response.data is an array before setting state
      if (Array.isArray(response.data)) {
        setYearConfigs(response.data);
      } else {
        console.error('Expected array but got:', typeof response.data, response.data);
        setYearConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching year configurations:', error);
      setYearConfigs([]); // Set empty array on error
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setYearConfig({ ...yearConfig, [name]: value });
  };

  const handleExamScheduleChange = (index, field, value) => {
    const updatedSchedules = [...yearConfig.examSchedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setYearConfig({ ...yearConfig, examSchedules: updatedSchedules });
  };

  const addExamSchedule = () => {
    setYearConfig({
      ...yearConfig,
      examSchedules: [...yearConfig.examSchedules, { exam: '', startDate: '', endDate: '' }]
    });
  };

  const removeExamSchedule = (index) => {
    if (yearConfig.examSchedules.length > 1) {
      const updatedSchedules = yearConfig.examSchedules.filter((_, i) => i !== index);
      setYearConfig({ ...yearConfig, examSchedules: updatedSchedules });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/year-configurations/${currentId}`, yearConfig);
      } else {
        await axios.post('/api/year-configurations', yearConfig);
      }
      resetForm();
      fetchYearConfigurations();
    } catch (error) {
      console.error('Error saving year configuration:', error);
    }
  };

  const handleEdit = (config) => {
    setYearConfig({
      academicYear: config.academicYear,
      startOfSemester: config.startOfSemester,
      endOfSemester: config.endOfSemester,
      classCommenceDate: config.classCommenceDate,
      classEndDate: config.classEndDate,
      examSchedules: config.examSchedules
    });
    setIsEditing(true);
    setCurrentId(config._id);
  };

  const resetForm = () => {
    setYearConfig({
      academicYear: '',
      startOfSemester: '',
      endOfSemester: '',
      classCommenceDate: '',
      classEndDate: '',
      examSchedules: [{ exam: '', startDate: '', endDate: '' }]
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/year-configurations/${id}`);
      fetchYearConfigurations();
    } catch (error) {
      console.error('Error deleting year configuration:', error);
    }
  };

  const filteredConfigs = Array.isArray(yearConfigs) 
    ? yearConfigs.filter(config => 
        config.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Year Configuration</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit' : 'Add'} Year Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                name="academicYear"
                value={yearConfig.academicYear}
                onChange={handleChange}
                placeholder="e.g. 2023-2024"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start of Semester</label>
              <input
                type="date"
                name="startOfSemester"
                value={yearConfig.startOfSemester}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End of Semester</label>
              <input
                type="date"
                name="endOfSemester"
                value={yearConfig.endOfSemester}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Commence Date</label>
              <input
                type="date"
                name="classCommenceDate"
                value={yearConfig.classCommenceDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class End Date</label>
              <input
                type="date"
                name="classEndDate"
                value={yearConfig.classEndDate}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Approximate Exam Schedule</label>
            {yearConfig.examSchedules.map((schedule, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 mb-2">
                <div className="flex-1">
                  <select
                    value={schedule.exam}
                    onChange={(e) => handleExamScheduleChange(index, 'exam', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Exam</option>
                    <option value="Mid Semester">Mid Semester</option>
                    <option value="End Semester">End Semester</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={schedule.startDate}
                    onChange={(e) => handleExamScheduleChange(index, 'startDate', e.target.value)}
                    placeholder="Start Date"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={schedule.endDate}
                    onChange={(e) => handleExamScheduleChange(index, 'endDate', e.target.value)}
                    placeholder="End Date"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => addExamSchedule()}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <FaPlus />
                  </button>
                  {yearConfig.examSchedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExamSchedule(index)}
                      className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      <FaMinus />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Year Configurations</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-md"
            />
            <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center">
              <FaDownload className="mr-2" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start of Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End of Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Commence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConfigs.length > 0 ? (
                filteredConfigs.map((config) => (
                  <tr key={config._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{config.academicYear}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(config.startOfSemester)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(config.endOfSemester)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(config.classCommenceDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(config.classEndDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaMinus />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <FaToggleOn />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No year configurations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearConfiguration;