import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStorageData, setStorageData, updateStorageItem, deleteStorageItem, addStorageItem } from '../../services/realtimeStorageService';

export default function EditCode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [code, setCode] = useState({
    shortCode: '',
    fullName: '',
    type: ''
  });
  
  // Check if we're adding a new code or editing an existing one
  const isAddMode = id === 'new';

  // Storage key for codes
  const CODES_STORAGE_KEY = 'erp-codes';

  // Fetch code data based on ID
  useEffect(() => {
    // If we're adding a new code, no need to fetch data
    if (isAddMode) {
      setIsLoading(false);
      return;
    }
    
    // In a real application, you would fetch data from an API
    // For this demo, we'll simulate fetching data
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Get data from localStorage
      const storedCodes = getStorageData(CODES_STORAGE_KEY) || [];
      
      const foundCode = storedCodes.find(c => c.id === parseInt(id));
      
      if (foundCode) {
        setCode(foundCode);
        setIsLoading(false);
      } else {
        toast.error('Code not found');
        navigate('/dashboard/master-data/code');
      }
    }, 300);
  }, [id, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCode(prevCode => ({
      ...prevCode,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!code.shortCode || !code.fullName || !code.type) {
      toast.error('All fields are required');
      return;
    }
    
    // Get current codes from localStorage
    const storedCodes = getStorageData(CODES_STORAGE_KEY) || [];
    
    if (isAddMode) {
      // Add new code
      const newCode = {
        id: Date.now(), // Generate a unique ID
        shortCode: code.shortCode,
        fullName: code.fullName,
        type: code.type
      };
      
      if (addStorageItem(CODES_STORAGE_KEY, newCode)) {
        toast.success(`Code ${code.shortCode} added successfully`);
        navigate('/dashboard/master-data/code');
      } else {
        toast.error('Failed to add code');
      }
    } else {
      // Update existing code
      const updatedCode = {
        id: parseInt(id),
        shortCode: code.shortCode,
        fullName: code.fullName,
        type: code.type
      };
      
      if (updateStorageItem(CODES_STORAGE_KEY, parseInt(id), updatedCode)) {
        toast.success(`Code ${code.shortCode} updated successfully`);
        navigate('/dashboard/master-data/code');
      } else {
        toast.error('Failed to update code');
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/dashboard/master-data/code');
  };

  // Handle delete
  const handleDelete = () => {
    // Don't show delete button in add mode
    if (isAddMode) return;
    
    // In a real application, you would delete the data via an API
    // For this demo, we'll just show a success message and redirect
    if (window.confirm('Are you sure you want to delete this code?')) {
      if (deleteStorageItem(CODES_STORAGE_KEY, parseInt(id))) {
        toast.success(`Code ${code.shortCode} deleted successfully`);
        navigate('/dashboard/master-data/code');
      } else {
        toast.error('Failed to delete code');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 shadow-md rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden text-white">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">{isAddMode ? 'Add New Code' : 'Update Code'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="shortCode" className="block text-sm font-medium mb-2">Short Code *</label>
            <input
              type="text"
              id="shortCode"
              name="shortCode"
              value={code.shortCode}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={code.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="type" className="block text-sm font-medium mb-2">Type *</label>
            <select
              id="type"
              name="type"
              value={code.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Type</option>
              <option value="Fee">Fee</option>
              <option value="Discount">Discount</option>
              <option value="Tax">Tax</option>
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