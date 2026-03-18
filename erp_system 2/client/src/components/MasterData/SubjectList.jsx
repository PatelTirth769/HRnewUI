import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData, deleteStorageItem, registerStorageListener } from '../../services/realtimeStorageService';

export default function SubjectList() {
  // State for subject data
  const [subjectData, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to generate mock data
  const generateMockSubjects = () => {
    const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Mathematics', 'Physics', 'Chemistry'];
    const subjectPrefixes = {
      'Computer Science': 'CS',
      'Electronics': 'EC',
      'Mechanical': 'ME',
      'Civil': 'CE',
      'Electrical': 'EE',
      'Mathematics': 'MA',
      'Physics': 'PH',
      'Chemistry': 'CH'
    };
    
    const csSubjects = [
      'Introduction to Computer Science', 'Programming Fundamentals', 'Data Structures', 'Algorithms', 
      'Database Systems', 'Operating Systems', 'Computer Networks', 'Software Engineering',
      'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Mobile App Development',
      'Cloud Computing', 'Big Data Analytics', 'Cybersecurity', 'Blockchain Technology',
      'Computer Graphics', 'Human-Computer Interaction', 'Distributed Systems', 'Compiler Design'
    ];
    
    const ecSubjects = [
      'Basic Electronics', 'Digital Logic Design', 'Analog Circuits', 'Signals and Systems',
      'Communication Systems', 'Microprocessors', 'VLSI Design', 'Embedded Systems',
      'Digital Signal Processing', 'Control Systems', 'Antenna Theory', 'Wireless Communication'
    ];
    
    const meSubjects = [
      'Engineering Mechanics', 'Thermodynamics', 'Fluid Mechanics', 'Material Science',
      'Manufacturing Processes', 'Machine Design', 'Heat Transfer', 'Automobile Engineering',
      'Robotics', 'CAD/CAM', 'Industrial Engineering', 'Refrigeration and Air Conditioning'
    ];
    
    const ceSubjects = [
      'Engineering Drawing', 'Surveying', 'Structural Analysis', 'Concrete Technology',
      'Soil Mechanics', 'Transportation Engineering', 'Environmental Engineering', 'Hydrology',
      'Construction Management', 'Geotechnical Engineering', 'Steel Structures', 'Earthquake Engineering'
    ];
    
    const eeSubjects = [
      'Electrical Circuits', 'Electromagnetic Theory', 'Electrical Machines', 'Power Systems',
      'Power Electronics', 'Electrical Measurements', 'Control Systems', 'Digital Electronics',
      'Microprocessors', 'Renewable Energy Systems', 'High Voltage Engineering', 'Electric Drives'
    ];
    
    const maSubjects = [
      'Calculus', 'Linear Algebra', 'Differential Equations', 'Discrete Mathematics',
      'Probability and Statistics', 'Numerical Methods', 'Complex Analysis', 'Real Analysis',
      'Abstract Algebra', 'Topology', 'Number Theory', 'Graph Theory'
    ];
    
    const phSubjects = [
      'Mechanics', 'Electromagnetism', 'Optics', 'Thermodynamics',
      'Quantum Mechanics', 'Nuclear Physics', 'Solid State Physics', 'Astrophysics'
    ];
    
    const chSubjects = [
      'Inorganic Chemistry', 'Organic Chemistry', 'Physical Chemistry', 'Analytical Chemistry',
      'Biochemistry', 'Polymer Chemistry', 'Environmental Chemistry', 'Industrial Chemistry'
    ];
    
    const subjectsByDepartment = {
      'Computer Science': csSubjects,
      'Electronics': ecSubjects,
      'Mechanical': meSubjects,
      'Civil': ceSubjects,
      'Electrical': eeSubjects,
      'Mathematics': maSubjects,
      'Physics': phSubjects,
      'Chemistry': chSubjects
    };
    
    const subjects = [];
    let id = 1;
    
    // Generate subjects for each department
    departments.forEach(department => {
      const prefix = subjectPrefixes[department];
      const departmentSubjects = subjectsByDepartment[department];
      
      departmentSubjects.forEach((name, index) => {
        const courseNumber = Math.floor(index / 4) + 1;
        const courseIndex = (index % 4) + 1;
        const code = `${prefix}${courseNumber}0${courseIndex}`;
        const semester = Math.min(courseNumber, 8);
        const credits = Math.floor(Math.random() * 2) + 3; // Random credits between 3-4
        
        subjects.push({
          id: id++,
          code,
          name,
          department,
          semester,
          credits
        });
      });
    });
    
    return subjects;
  };
  
  // Generate mock data
  const mockSubjects = generateMockSubjects();
  
  // Storage key for subjects
  const SUBJECTS_STORAGE_KEY = 'erp-subjects';

  // Load data on component mount
  useEffect(() => {
    // Simulate API call to fetch data
    setIsLoading(true);
    setTimeout(() => {
      // Check if we have data in localStorage first
      const storedSubjects = getStorageData(SUBJECTS_STORAGE_KEY);
      if (storedSubjects && Array.isArray(storedSubjects) && storedSubjects.length > 0) {
        // Use data from localStorage
        setSubjects(storedSubjects);
        setTotalEntries(storedSubjects.length);
      } else {
        // Initialize with mock data and save to localStorage
        setSubjects(mockSubjects);
        setStorageData(SUBJECTS_STORAGE_KEY, mockSubjects);
        setTotalEntries(mockSubjects.length);
      }
      setIsLoading(false);
    }, 500);
    
    // Register listener for real-time updates
    const unregisterListener = registerStorageListener(SUBJECTS_STORAGE_KEY, (updatedSubjects) => {
      if (updatedSubjects && Array.isArray(updatedSubjects)) {
        setSubjects(updatedSubjects);
        setTotalEntries(updatedSubjects.length);
      }
    });
    
    // Cleanup listener on component unmount
    return () => {
      unregisterListener();
    };
  }, []);

  // Filter subjects when search term changes
  useEffect(() => {
    filterSubjects();
  }, [searchTerm, subjectData, currentPage, entriesPerPage]);

  // Filter subjects based on search term
  const filterSubjects = () => {
    let filtered = subjectData;
    
    if (searchTerm.trim() !== '') {
      filtered = subjectData.filter(subject => 
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Update total entries based on filtered results
      setTotalEntries(filtered.length);
    } else {
      // If no search term, restore original total
      setTotalEntries(8390);
    }
    
    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    setFilteredSubjects(filtered.slice(indexOfFirstEntry, indexOfLastEntry));
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
    // Navigate to edit page with the subject ID
    navigate(`/dashboard/master-data/subject/edit/${id}`);
    toast.info(`Editing subject with ID: ${id}`);
  };
  
  // Handle delete action
  const handleDelete = (id) => {
    // In a real application, you would delete the data via an API
    // For this demo, we'll just show a confirmation and success message
    if (window.confirm('Are you sure you want to delete this subject?')) {
      // Find the subject to get its code for the success message
      const subjectToDelete = subjectData.find(subject => subject.id === id);
      if (subjectToDelete) {
        // Delete from localStorage with real-time update
        if (deleteStorageItem(SUBJECTS_STORAGE_KEY, id)) {
          toast.success(`Subject ${subjectToDelete.code} deleted successfully`);
        } else {
          toast.error('Failed to delete subject');
        }
      }
    }
  };
  
  // Handle add new subject
  const handleAddSubject = () => {
    // Navigate to add new subject page
    navigate(`/dashboard/master-data/subject/edit/new`);
    toast.info('Adding new subject');
  };

  // Calculate pagination information
  const totalPages = 839; // Set to 839 as per requirement
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
    toast.info('Downloading subject report...');
    
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
    const filePath = '/studentReport.xls';
    
    // Download the file
    downloadFile(filePath, 'studentReport.xls');
    
    // Show success message after a delay
    setTimeout(() => {
      toast.success('Subject report downloaded successfully!');
    }, 1500);
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-xl font-semibold text-white mb-2 sm:mb-0">Subject List</h2>
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
        
        <div className="p-6 bg-gray-800 border-b border-gray-700">
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
                  placeholder="Search subjects..."
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
              <span className="text-sm text-gray-700">entries</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Subject Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Subject Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Semester
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Credits
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-white">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-white">
                    No subjects found
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-600 text-white">
                        {subject.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {subject.semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {subject.credits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(subject.id)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center bg-gray-800 border-t border-gray-700 sm:px-6">
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
      
      <div className="mt-4 bg-blue-800 text-white p-3 rounded-md flex justify-between items-center">
        <h3 className="text-sm font-medium">Manage Subjects</h3>
        <button 
          onClick={handleAddSubject}
          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Subject
        </button>
      </div>
    </div>
  );
}