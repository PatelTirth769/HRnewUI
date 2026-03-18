import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStorageData, setStorageData, updateStorageItem, deleteStorageItem, addStorageItem } from '../../services/realtimeStorageService';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState({
    code: '',
    name: '',
    department: '',
    type: '',
    duration: '',
    status: 'Active'
  });
  
  // Check if we're adding a new course or editing an existing one
  const isAddMode = id === 'new';

  // Storage key for courses
  const COURSES_STORAGE_KEY = 'erp-courses';

  // Fetch course data based on ID
  useEffect(() => {
    // If we're adding a new course, no need to fetch data
    if (isAddMode) {
      setIsLoading(false);
      return;
    }
    
    // In a real application, you would fetch data from an API
    // For this demo, we'll use the realtimeStorageService
    setIsLoading(true);
    
    // Get data from localStorage with timeout to simulate API call
    setTimeout(() => {
      const storedCourses = getStorageData(COURSES_STORAGE_KEY) || [];
      const foundCourse = storedCourses.find(c => c.id === parseInt(id));
      
      if (foundCourse) {
        setCourse(foundCourse);
        setIsLoading(false);
      } else {
        toast.error('Course not found');
        navigate('/dashboard/master-data/course');
      }
    }, 300);
  }, [id, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse(prevCourse => ({
      ...prevCourse,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!course.code || !course.name || !course.department || !course.type || !course.duration || !course.status) {
      toast.error('All fields are required');
      return;
    }
    
    // Get current courses from localStorage
    const storedCourses = getStorageData(COURSES_STORAGE_KEY) || [];
    
    if (isAddMode) {
      // Add new course
      const newCourse = {
        id: Date.now(), // Generate a unique ID
        code: course.code,
        name: course.name,
        department: course.department,
        type: course.type,
        duration: course.duration,
        status: course.status
      };
      
      if (addStorageItem(COURSES_STORAGE_KEY, newCourse)) {
        toast.success(`Course ${course.code} added successfully`);
        navigate('/dashboard/master-data/course');
      } else {
        toast.error('Failed to add course');
      }
    } else {
      // Update existing course
      const updatedCourse = {
        id: parseInt(id),
        code: course.code,
        name: course.name,
        department: course.department,
        type: course.type,
        duration: course.duration,
        status: course.status
      };
      
      if (updateStorageItem(COURSES_STORAGE_KEY, parseInt(id), updatedCourse)) {
        toast.success(`Course ${course.code} updated successfully`);
        navigate('/dashboard/master-data/course');
      } else {
        toast.error('Failed to update course');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/dashboard/master-data/course');
  };

  // Handle delete
  const handleDelete = () => {
    // Don't show delete button in add mode
    if (isAddMode) return;
    
    // In a real application, you would delete the data via an API
    // For this demo, we'll use the realtimeStorageService
    if (window.confirm('Are you sure you want to delete this course?')) {
      if (deleteStorageItem(COURSES_STORAGE_KEY, parseInt(id))) {
        toast.success(`Course ${course.code} deleted successfully`);
        navigate('/dashboard/master-data/course');
      } else {
        toast.error('Failed to delete course');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-blue-900 shadow-md rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-blue-900 shadow-md rounded-lg overflow-hidden text-white">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">{isAddMode ? 'Add New Course' : 'Update Course'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium mb-2">Course Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={course.code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-2">Course Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={course.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="department" className="block text-sm font-medium mb-2">Department *</label>
            <select
              id="department"
              name="department"
              value={course.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium mb-2">Course Type *</label>
            <select
              id="type"
              name="type"
              value={course.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Course Type</option>
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="BSc">BSc</option>
              <option value="MSc">MSc</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="duration" className="block text-sm font-medium mb-2">Duration (Years) *</label>
            <select
              id="duration"
              name="duration"
              value={course.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Duration</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium mb-2">Status *</label>
            <select
              id="status"
              name="status"
              value={course.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isAddMode ? 'Add' : 'Update'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
            
            {!isAddMode && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}