import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData, deleteStorageItem, registerStorageListener } from '../../services/realtimeStorageService';

export default function CourseList() {
  // State for course data
  const [courseData, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to generate mock data
  const generateMockCourses = () => {
    const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Mathematics', 'Physics', 'Chemistry'];
    const courseTypes = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'BSc', 'MSc', 'PhD', 'Diploma'];
    const durations = [2, 3, 4, 5];
    
    const courses = [];
    let id = 1;
    
    // Generate courses for each department and type
    departments.forEach(department => {
      courseTypes.forEach(type => {
        const duration = durations[Math.floor(Math.random() * durations.length)];
        const code = `${type.substring(0, 1)}${department.substring(0, 2)}${Math.floor(Math.random() * 1000)}`;
        
        courses.push({
          id: id++,
          code,
          name: `${type} in ${department}`,
          department,
          type,
          duration,
          status: Math.random() > 0.2 ? 'Active' : 'Inactive'
        });
      });
    });
    
    return courses;
  };
  
  // Generate mock data
  const mockCourses = generateMockCourses();
  
  // Storage key for courses
  const COURSES_STORAGE_KEY = 'erp-courses';

  // Load data on component mount
  useEffect(() => {
    // Simulate API call to fetch data
    setIsLoading(true);
    setTimeout(() => {
      // Check if we have data in localStorage first
      const storedCourses = getStorageData(COURSES_STORAGE_KEY);
      if (storedCourses && Array.isArray(storedCourses) && storedCourses.length > 0) {
        // Use data from localStorage
        setCourses(storedCourses);
        setTotalEntries(storedCourses.length);
      } else {
        // Initialize with mock data and save to localStorage
        setCourses(mockCourses);
        setStorageData(COURSES_STORAGE_KEY, mockCourses);
        setTotalEntries(mockCourses.length);
      }
      setIsLoading(false);
    }, 500);
    
    // Register listener for real-time updates
    const unregisterListener = registerStorageListener(COURSES_STORAGE_KEY, (updatedCourses) => {
      if (updatedCourses && Array.isArray(updatedCourses)) {
        setCourses(updatedCourses);
        setTotalEntries(updatedCourses.length);
      }
    });
    
    // Cleanup listener on component unmount
    return () => {
      unregisterListener();
    };
  }, []);

  // Filter courses when search term changes
  useEffect(() => {
    filterCourses();
  }, [searchTerm, courseData, currentPage, entriesPerPage]);

  // Filter courses based on search term
  const filterCourses = () => {
    let filtered = courseData;
    
    if (searchTerm.trim() !== '') {
      filtered = courseData.filter(course => 
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Update total entries based on filtered results
      setTotalEntries(filtered.length);
    } else {
      // If no search term, restore original total
      setTotalEntries(courseData.length);
    }
    
    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    setFilteredCourses(filtered.slice(indexOfFirstEntry, indexOfLastEntry));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle entries per page change
  const handleEntriesPerPageChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle edit action
  const handleEdit = (id) => {
    // Navigate to edit page with the course ID
    navigate(`/dashboard/master-data/course/edit/${id}`);
    toast.info(`Editing course with ID: ${id}`);
  };
  
  // Handle delete action
  const handleDelete = (id) => {
    // In a real application, you would delete the data via an API
    // For this demo, we'll just show a confirmation and success message
    if (window.confirm('Are you sure you want to delete this course?')) {
      // Find the course to get its code for the success message
      const courseToDelete = courseData.find(course => course.id === id);
      if (courseToDelete) {
        // Delete from localStorage with real-time update
        if (deleteStorageItem(COURSES_STORAGE_KEY, id)) {
          toast.success(`Course ${courseToDelete.code} deleted successfully`);
        } else {
          toast.error('Failed to delete course');
        }
      }
    }
  };
  
  // Handle add new course
  const handleAddCourse = () => {
    // Navigate to add new course page
    navigate(`/dashboard/master-data/course/edit/new`);
    toast.info('Adding new course');
  };

  // Calculate pagination information
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const pageNumbers = [];
  
  // For demonstration, we'll show a limited set of page numbers with ellipsis
  const displayPageRange = (current, total, range = 2) => {
    const pages = [];
    const startPage = Math.max(1, current - range);
    const endPage = Math.min(total, current + range);
    
    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      // Add ellipsis if there's a gap
      if (startPage > 2) pages.push('...');
    }
    
    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (endPage < total) {
      // Add ellipsis if there's a gap
      if (endPage < total - 1) pages.push('...');
      pages.push(total);
    }
    
    return pages;
  };
  
  const visiblePageNumbers = displayPageRange(currentPage, totalPages);

  // Calculate showing entries information for display
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const showingFrom = totalEntries === 0 ? 0 : indexOfFirstEntry + 1;
  const showingTo = Math.min(indexOfLastEntry, totalEntries);

  // Handle download report
  const handleDownloadReport = () => {
    toast.info('Downloading course report...');
    
    // Create a function to download the file
    const downloadFile = (url, fileName) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    // In a real application, this would be the path to your actual file
    // For now, we'll use a placeholder path
    const filePath = '/courseReport.xls';
    
    // Download the file
    downloadFile(filePath, 'courseReport.xls');
    
    // Show success message after a delay
    setTimeout(() => {
      toast.success('Course report downloaded successfully!');
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-blue-900 shadow-md rounded-lg overflow-hidden text-white">
        <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-xl font-semibold text-white mb-2 sm:mb-0">Course List</h2>
          <button
            onClick={handleDownloadReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
        </div>
        
        <div className="px-6 py-4 bg-blue-900 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="w-full sm:w-1/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white">Show</span>
              <select
                value={entriesPerPage}
                onChange={handleEntriesPerPageChange}
                className="block w-20 pl-3 pr-10 py-2 text-base border border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-700 text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-white">entries</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Course Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Course Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Duration (Years)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-white">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-white">
                    No courses found
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {course.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {course.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {course.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.status === 'Active' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(course.id)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(course.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-blue-900 border-t border-gray-700">
          <div className="text-sm text-white mb-2 sm:mb-0 font-medium">
            Showing {showingFrom} to {showingTo} of {totalEntries} entries
          </div>
          
          <div className="flex">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-l-md ${currentPage === 1 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Previous
            </button>
            
            <div className="hidden md:flex">
              {visiblePageNumbers.map((number, index) => (
                number === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border-t border-b border-r border-gray-600 text-sm font-medium bg-gray-700 text-white"
                  >
                    {number}
                  </span>
                ) : (
                  <button
                    key={`page-${number}`}
                    onClick={() => handlePageChange(number)}
                    className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-600 text-sm font-medium ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'} ${number !== totalPages ? 'border-r border-gray-600' : ''}`}
                  >
                    {number}
                  </button>
                )
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-r-md ${currentPage === totalPages ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Manage Courses Section */}
      <div className="mt-6 bg-blue-900 shadow-md rounded-lg overflow-hidden text-white">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Manage Courses</h2>
        </div>
        <div className="p-6">
          <button
            onClick={handleAddCourse}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Course
          </button>
        </div>
      </div>
    </div>
  );
}