import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ManageStudentDetail = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    enrollmentNo: '',
    contactNo: '',
    email: '',
    address: '',
    active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/students/${currentId}`, formData);
        toast.success('Student details updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/students', formData);
        toast.success('Student added successfully');
      }
      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student details:', error);
      toast.error('Failed to save student details');
    }
  };

  const handleEdit = (student) => {
    setFormData({
      studentId: student.studentId,
      name: student.name,
      enrollmentNo: student.enrollmentNo,
      contactNo: student.contactNo,
      email: student.email,
      address: student.address,
      active: student.active
    });
    setIsEditing(true);
    setCurrentId(student._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`http://localhost:5000/api/students/${id}`);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      enrollmentNo: '',
      contactNo: '',
      email: '',
      address: '',
      active: true
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5000/api/students/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Excel data uploaded successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Student data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const filteredStudents = students.filter(student =>
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Student Detail</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Edit Student Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Student ID</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Student ID"
                required
                readOnly={isEditing}
              />
            </div>
            <div>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Student Name"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Enrollment No</label>
              <input
                type="text"
                name="enrollmentNo"
                value={formData.enrollmentNo}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Enrollment No"
                required
                readOnly={isEditing}
              />
            </div>
            <div>
              <label className="block mb-2">Contact No</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Contact No"
              />
            </div>
            <div>
              <label className="block mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Email"
              />
            </div>
            <div>
              <label className="block mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter Address"
              />
            </div>
            <div className="flex items-center mt-8">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Active</label>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-md p-2"
              />
            </div>
            <div className="relative">
              <label htmlFor="fileUpload" className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-md flex items-center">
                <span>Upload Excel</span>
              </label>
              <input
                id="fileUpload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-md"
              onClick={handleExport}
            >
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b text-left">STUDENT ID</th>
                <th className="py-2 px-4 border-b text-left">NAME</th>
                <th className="py-2 px-4 border-b text-left">ENROLLMENT NO</th>
                <th className="py-2 px-4 border-b text-left">CONTACT NO</th>
                <th className="py-2 px-4 border-b text-left">EMAIL</th>
                <th className="py-2 px-4 border-b text-left">STATUS</th>
                <th className="py-2 px-4 border-b text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{student.studentId}</td>
                  <td className="py-2 px-4 border-b">{student.name}</td>
                  <td className="py-2 px-4 border-b">{student.enrollmentNo}</td>
                  <td className="py-2 px-4 border-b">{student.contactNo}</td>
                  <td className="py-2 px-4 border-b">{student.email}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs ${student.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {student.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaDownload />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageStudentDetail;