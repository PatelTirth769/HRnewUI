import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData, deleteStorageItem, registerStorageListener } from '../../services/realtimeStorageService';

export default function CodeList() {
  // State for code data
  const [codeData, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Storage key for codes
  const CODES_STORAGE_KEY = 'erp-codes';
  
  // Mock data for demonstration
  const mockCodes = [
    { id: 1, shortCode: 'admfee', fullName: 'Admission fees', type: 'Fee' },
    { id: 2, shortCode: 'Bottle', fullName: 'Bottle', type: 'product_measurement' },
    { id: 3, shortCode: 'BOX', fullName: 'BOX', type: 'product_measurement' },
    { id: 4, shortCode: 'brd', fullName: 'Board Practical Exam', type: 'No_fee_type' },
    { id: 5, shortCode: 'Can', fullName: 'Canteen', type: 'feedback' },
    { id: 6, shortCode: 'chem', fullName: 'Chemistry', type: 'feedback' },
    { id: 7, shortCode: 'comp', fullName: 'Computer', type: 'feedback' },
    { id: 8, shortCode: 'computer', fullName: 'Computer', type: 'product_type' },
    { id: 9, shortCode: 'city_school', fullName: 'City School', type: 'building_type' },
    { id: 10, shortCode: 'abcv_test', fullName: 'Abcv Test Achievement', type: 'other_module' },
    { id: 11, shortCode: 'abcv_ach', fullName: 'Abcvachv', type: 'other_module' },
    { id: 12, shortCode: 'abcv_p', fullName: 'Abcvp', type: 'other_module' },
    { id: 13, shortCode: 'abcv_question', fullName: 'Abcvquestion', type: 'other_module' },
    { id: 14, shortCode: 'abcv_r', fullName: 'Abcvr', type: 'other_module' },
    { id: 15, shortCode: 'abcv_sports', fullName: 'Sports', type: 'other_module' },
    { id: 16, shortCode: 'ABSENT STAFF SPORTS', fullName: 'ABSENT STAFF SPORTS', type: 'No_fee_type' },
    { id: 17, shortCode: 'AT', fullName: 'Absent', type: 'Type' },
    { id: 18, shortCode: 'AT', fullName: 'Absent', type: 'Dropdown' },
    { id: 19, shortCode: 'CTPAPER', fullName: 'CTPAPER', type: 'product_item_type' },
    { id: 20, shortCode: 'Textbook', fullName: 'Textbook', type: 'boarding_item' },
    { id: 21, shortCode: 'CUE EXAMINATION', fullName: 'CUE EXAMINATION', type: 'product_item_type' },
    { id: 22, shortCode: 'Electricity consumption', fullName: 'Electricity consumption', type: 'Announcement' },
    { id: 23, shortCode: 'EM', fullName: 'Electricity Interruption', type: 'Announcement' },
    { id: 24, shortCode: 'medical', fullName: 'Medical', type: 'product_type' },
    { id: 25, shortCode: 'MISCELLANEOUS', fullName: 'MISCELLANEOUS', type: 'product_item_type' },
    { id: 26, shortCode: 'National Game Sports', fullName: 'National Game Sports', type: 'No_fee_type' },
    { id: 27, shortCode: 'NCERT', fullName: 'Ncert Teaching', type: 'REGULAR' },
    { id: 28, shortCode: 'Nos', fullName: 'Nos', type: 'product_measurement' },
    { id: 29, shortCode: 'Nos', fullName: 'Nos', type: 'Announcement' },
    { id: 30, shortCode: 'notification.msg', fullName: 'notification.msg', type: 'Announcement' },
    { id: 31, shortCode: 'NT-D', fullName: 'Non-teaching', type: 'department' },
    { id: 32, shortCode: 'NT', fullName: 'Non-teaching', type: 'type' },
    { id: 33, shortCode: 'Other', fullName: 'Other', type: 'No_fee_type' },
    { id: 34, shortCode: 'No', fullName: 'No', type: 'product_measurement' },
    { id: 35, shortCode: 'ptrn', fullName: 'Program Item', type: 'type' },
    { id: 36, shortCode: 'prtd', fullName: 'Program', type: 'feedback' },
    { id: 37, shortCode: 'PRT', fullName: 'Program Prizes & Gifts', type: 'Announcement' },
    { id: 38, shortCode: 'PU', fullName: 'Program Update', type: 'Announcement' },
    { id: 39, shortCode: 'p', fullName: 'Prospectus', type: 'feedback' },
    { id: 40, shortCode: 'Qsn Type', fullName: 'Custom Question', type: '1' },
    { id: 41, shortCode: 'Sibling', fullName: 'Sibling', type: 'No_fee_type' },
    { id: 42, shortCode: 'ST', fullName: 'Sec-2', type: 'type' },
    { id: 43, shortCode: 'State Level Sports', fullName: 'State Level Sports', type: 'No_fee_type' },
    { id: 44, shortCode: 'Stationary', fullName: 'Stationary', type: 'product_item_type' },
    { id: 45, shortCode: 'Suggestion', fullName: 'Suggestion', type: 'feedback' },
    { id: 46, shortCode: 'T-D', fullName: 'Teaching', type: 'department' },
    { id: 47, shortCode: 'Teacher_test', fullName: 'Teacher test', type: 'No_fee_type' },
    { id: 48, shortCode: 'Teaching', fullName: 'Teaching', type: 'REGULAR' },
    { id: 49, shortCode: 'Test', fullName: 'Test', type: 'Announcement' },
    { id: 50, shortCode: 'TOGA', fullName: 'TOGA', type: 'product_item_type' },
    { id: 51, shortCode: 'tuition_fees', fullName: 'Tuition fees', type: 'fee' },
    { id: 52, shortCode: 'test', fullName: 'Under Section', type: 'admission_status' },
  ];

  // Load data on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Check if we have data in localStorage first
      const storedCodes = getStorageData(CODES_STORAGE_KEY);
      if (storedCodes && Array.isArray(storedCodes) && storedCodes.length > 0) {
        // Use data from localStorage
        setCodes(storedCodes);
        setTotalEntries(storedCodes.length);
      } else {
        // Initialize with mock data and save to localStorage
        setCodes(mockCodes);
        setStorageData(CODES_STORAGE_KEY, mockCodes);
        setTotalEntries(mockCodes.length);
      }
      setIsLoading(false);
    }, 300);
    
    // Register listener for real-time updates
    const unregisterListener = registerStorageListener(CODES_STORAGE_KEY, (updatedCodes) => {
      if (updatedCodes && Array.isArray(updatedCodes)) {
        setCodes(updatedCodes);
        setTotalEntries(updatedCodes.length);
      }
    });
    
    // Cleanup listener on component unmount
    return () => {
      unregisterListener();
    };
  }, []);

  // Filter codes when search term changes
  useEffect(() => {
    filterCodes();
  }, [searchTerm, codeData, currentPage, entriesPerPage]);

  // Filter codes based on search term
  const filterCodes = () => {
    let filtered = codeData;
    
    if (searchTerm) {
      filtered = codeData.filter(code => 
        code.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setTotalEntries(filtered.length);
    
    // Pagination
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    setFilteredCodes(filtered.slice(indexOfFirstEntry, indexOfLastEntry));
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
    // Navigate to edit page with the code ID
    navigate(`/dashboard/master-data/code/edit/${id}`);
  };
  
  // Handle delete action
  const handleDelete = (id) => {
    // In a real application, you would delete the data via an API
    // For this demo, we'll just show a confirmation and success message
    if (window.confirm('Are you sure you want to delete this code?')) {
      // Find the code to get its shortCode for the success message
      const codeToDelete = codeData.find(code => code.id === id);
      if (codeToDelete) {
        // Delete from localStorage with real-time update
        if (deleteStorageItem(CODES_STORAGE_KEY, id)) {
          toast.success(`Code ${codeToDelete.shortCode} deleted successfully`);
        } else {
          toast.error('Failed to delete code');
        }
      }
    }
  };
  
  // Handle add new code
  const handleAddCode = () => {
    // Navigate to add new code page (we'll reuse the edit page with no ID)
    navigate(`/dashboard/master-data/code/edit/new`);
  };

  // Calculate pagination information
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const pageNumbers = [];
  
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Calculate showing entries information
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const showingFrom = totalEntries === 0 ? 0 : indexOfFirstEntry + 1;
  const showingTo = Math.min(indexOfLastEntry, totalEntries);

  return (
    <div className="p-4 bg-gray-900 text-white">
      <div className="bg-blue-800 text-white p-4 rounded-t-lg flex items-center">
        <h2 className="text-xl font-bold">Code List</h2>
      </div>
      
      <div className="bg-gray-800 shadow-md rounded-b-lg overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <label className="block text-sm font-medium text-white mb-1">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Search..."
            />
          </div>
          
          <div className="flex items-center">
            <label className="text-sm font-medium text-white mr-2">Show</label>
            <select
              value={entriesPerPage}
              onChange={handleEntriesPerPageChange}
              className="px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none bg-gray-800 text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm font-medium text-white ml-2">entries</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Short Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Full Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">
                    No codes found
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {code.shortCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {code.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-600 text-white">
                        {code.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(code.id)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
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
        
        <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center bg-gray-700 border-t border-gray-700 sm:px-6">
          <div className="text-sm text-white mb-2 sm:mb-0 font-medium">
            Showing {showingFrom} to {showingTo} of {totalEntries} entries
          </div>
          
          <div className="flex">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-l-md text-white bg-gray-800 hover:bg-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Previous
            </button>
            
            <div className="hidden md:flex">
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-600 text-sm font-medium ${currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'} ${number !== pageNumbers.length ? 'border-r border-gray-600' : ''}`}
                >
                  {number}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-r-md text-white bg-gray-800 hover:bg-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 bg-blue-800 text-white p-3 rounded-md flex justify-between items-center">
        <h3 className="text-sm font-medium">Manage Code</h3>
        <button 
          onClick={handleAddCode}
          className="bg-white text-blue-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center"
        >
          Add New Code
        </button>
      </div>
    </div>
  );
}