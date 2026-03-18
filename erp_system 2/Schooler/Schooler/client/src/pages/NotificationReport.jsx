import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaUpload, FaDownload, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const NotificationReport = () => {
  const [formData, setFormData] = useState({
    university: '',
    semester: '',
    proctor: '',
    exam: '',
    subject: '',
    student: '',
    room: ''
  });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      studentName: '',
      notificationType: '',
      message: '',
      status: 'Pending',
      sentDate: '',
      recipient: '',
      priority: 'Normal',
      response: '',
      remarks: ''
    }
  ]);

  const [savedNotifications, setSavedNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch saved notifications on component mount
  useEffect(() => {
    fetchSavedNotifications();
  }, []);

  const fetchSavedNotifications = async () => {
    try {
      const response = await fetch('/api/notification-report');
      if (response.ok) {
        const data = await response.json();
        setSavedNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching saved notifications:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (index, field, value) => {
    setNotifications(prev => prev.map((notification, i) => 
      i === index ? { ...notification, [field]: value } : notification
    ));
  };

  const addNotification = () => {
    setNotifications(prev => [...prev, {
      id: Date.now(),
      studentName: '',
      notificationType: '',
      message: '',
      status: 'Pending',
      sentDate: '',
      recipient: '',
      priority: 'Normal',
      response: '',
      remarks: ''
    }]);
  };

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length > 0) {
            const mappedNotifications = jsonData.map((row, index) => ({
              id: Date.now() + index,
              studentName: row['Student Name'] || row.studentName || '',
              notificationType: row['Notification Type'] || row.notificationType || '',
              message: row['Message'] || row.message || '',
              status: row['Status'] || 'Pending',
              sentDate: row['Sent Date'] || row.sentDate || '',
              recipient: row['Recipient'] || row.recipient || '',
              priority: row['Priority'] || 'Normal',
              response: row['Response'] || row.response || '',
              remarks: row['Remarks'] || row.remarks || ''
            }));
            
            setNotifications(mappedNotifications);
            setSuccessMessage('Excel file uploaded successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        } catch (error) {
          console.error('Error processing Excel file:', error);
          alert('Error processing Excel file. Please check the format.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleExcelDownload = () => {
    try {
      const data = notifications.map(notification => ({
        'Student Name': notification.studentName,
        'Notification Type': notification.notificationType,
        'Message': notification.message,
        'Status': notification.status,
        'Sent Date': notification.sentDate,
        'Recipient': notification.recipient,
        'Priority': notification.priority,
        'Response': notification.response,
        'Remarks': notification.remarks
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Notification Report');
      XLSX.writeFile(workbook, 'Notification_Report.xlsx');
      
      setSuccessMessage('Excel file downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      alert('Error downloading Excel file.');
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        notifications: notifications
      };
      
      const response = await fetch('/api/notification-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage('Notification report saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSavedNotifications();
      } else {
        throw new Error('Failed to save notification report');
      }
    } catch (error) {
      console.error('Error saving notification report:', error);
      alert('Error saving notification report. Please try again.');
    }
  };

  const filteredNotifications = savedNotifications.filter(notification => 
    notification.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.notificationType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold">Notification Report</h1>
            <p className="text-purple-100 mt-1">Manage and track student notifications</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded m-4">
              {successMessage}
            </div>
          )}

          {/* Form Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => handleFormChange('university', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter university"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => handleFormChange('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proctor</label>
                <input
                  type="text"
                  value={formData.proctor}
                  onChange={(e) => handleFormChange('proctor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter proctor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                <input
                  type="text"
                  value={formData.exam}
                  onChange={(e) => handleFormChange('exam', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter exam name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleFormChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <input
                  type="text"
                  value={formData.student}
                  onChange={(e) => handleFormChange('student', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => handleFormChange('room', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter room number"
                />
              </div>
            </div>
          </div>

          {/* Excel Operations */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center transition-colors">
                <FaUpload className="mr-2" />
                Upload Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExcelDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaDownload className="mr-2" />
                Download Excel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPlus className="mr-2" />
                Save Report
              </button>
            </div>
          </div>

          {/* Notifications Table */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Notification Details</h2>
              <button
                onClick={addNotification}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                <FaPlus className="mr-2" />
                Add Notification
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Student Name</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Notification Type</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Message</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Sent Date</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Recipient</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Priority</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Response</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Remarks</th>
                    <th className="px-4 py-3 border-b border-gray-300 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification, index) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={notification.studentName}
                          onChange={(e) => handleNotificationChange(index, 'studentName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Student name"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <select
                          value={notification.notificationType}
                          onChange={(e) => handleNotificationChange(index, 'notificationType', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="">Select Type</option>
                          <option value="Result">Result</option>
                          <option value="Attendance">Attendance</option>
                          <option value="Fee">Fee</option>
                          <option value="Exam">Exam</option>
                          <option value="General">General</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <textarea
                          value={notification.message}
                          onChange={(e) => handleNotificationChange(index, 'message', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Message content"
                          rows="2"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <select
                          value={notification.status}
                          onChange={(e) => handleNotificationChange(index, 'status', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Sent">Sent</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Failed">Failed</option>
                          <option value="Read">Read</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="date"
                          value={notification.sentDate}
                          onChange={(e) => handleNotificationChange(index, 'sentDate', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={notification.recipient}
                          onChange={(e) => handleNotificationChange(index, 'recipient', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Recipient details"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <select
                          value={notification.priority}
                          onChange={(e) => handleNotificationChange(index, 'priority', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <input
                          type="text"
                          value={notification.response}
                          onChange={(e) => handleNotificationChange(index, 'response', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Response received"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <textarea
                          value={notification.remarks}
                          onChange={(e) => handleNotificationChange(index, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Additional remarks"
                          rows="2"
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-gray-300">
                        <button
                          onClick={() => removeNotification(index)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center transition-colors"
                        >
                          <FaTrash className="mr-1" />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Saved Notifications Search */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search saved notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {filteredNotifications.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Saved Notification Reports</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredNotifications.map((notification, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{notification.studentName}</p>
                          <p className="text-sm text-gray-600">{notification.notificationType} - {notification.status}</p>
                          <p className="text-xs text-gray-500">{notification.message}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          notification.status === 'Sent' ? 'bg-green-100 text-green-800' :
                          notification.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          notification.status === 'Failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationReport;