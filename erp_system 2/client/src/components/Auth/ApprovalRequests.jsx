import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const ApprovalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { user, getApprovalRequests, approveUser, rejectUser } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getApprovalRequests();
        if (isMounted) {
          setRequests(data);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
          toast.error('Failed to fetch approval requests');
        }
      }
    };
    
    // Delay initial fetch to prevent refresh issues
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [getApprovalRequests]);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      const data = await getApprovalRequests();
      setRequests(data);
    } catch (error) {
      toast.error('Failed to fetch approval requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const success = await approveUser(userId);
      if (success) {
        // Remove the approved user from the list
        setRequests(requests.filter(request => request._id !== userId));
        toast.success('User approved successfully!');
      }
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };
  
  const handleRejectClick = (userId) => {
    setSelectedUserId(userId);
    setRejectReason('');
    setShowRejectModal(true);
  };
  
  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setSelectedUserId(null);
    setRejectReason('');
  };
  
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      const success = await rejectUser(selectedUserId, rejectReason);
      if (success) {
        // Remove the rejected user from the list
        setRequests(requests.filter(request => request._id !== selectedUserId));
        toast.success('User rejected successfully!');
        setShowRejectModal(false);
        setSelectedUserId(null);
        setRejectReason('');
      }
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'hod')) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md`}>
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto text-${themeColor}-500 mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            You don't have permission to view this page. Only administrators and HODs can approve user registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Approval Requests</h2>
        <button
          onClick={fetchApprovalRequests}
          className={`px-4 py-2 rounded-md bg-${themeColor}-600 text-white hover:bg-${themeColor}-700 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 focus:ring-offset-2`}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className={`animate-spin h-8 w-8 text-${themeColor}-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : requests.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 mx-auto text-${themeColor}-500 mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium mb-2">No Pending Requests</h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            There are no pending approval requests at this time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Registered On
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {requests.map((request) => (
                <tr key={request._id} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{request.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{request.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.role === 'teacher' ? `bg-${themeColor}-100 text-${themeColor}-800` : `bg-purple-100 text-purple-800`}`}>
                      {request.role.charAt(0).toUpperCase() + request.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{request.department || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleApprove(request._id)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${themeColor}-500`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(request._id)}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-500'} opacity-75`}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div 
              className={`inline-block align-bottom ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
              role="dialog" 
              aria-modal="true" 
              aria-labelledby="modal-headline"
            >
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium" id="modal-headline">
                      Reject User Registration
                    </h3>
                    <div className="mt-2">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Please provide a reason for rejecting this user registration. This reason will be sent to the user via email.
                      </p>
                      <div className="mt-4">
                        <textarea
                          className={`shadow-sm focus:ring-${themeColor}-500 focus:border-${themeColor}-500 block w-full sm:text-sm border-gray-300 rounded-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                          rows="4"
                          placeholder="Enter rejection reason..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRejectSubmit}
                >
                  Reject
                </button>
                <button 
                  type="button" 
                  className={`mt-3 w-full inline-flex justify-center rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-white hover:bg-gray-50'} shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${themeColor}-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                  onClick={handleRejectCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRequests;