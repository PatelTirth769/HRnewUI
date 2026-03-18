import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import OutcomeBoard from './components/OutcomeBoard';
import DropdownMenu from './components/OutcomeBoard/DropdownMenu';
import MasterDataSection from './components/MasterData';
import Settings from './components/Settings';
import EducationModule from './modules/education/EducationModule';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ApprovalRequests from './components/Auth/ApprovalRequests';
import ProtectedRoute from './components/Auth/ProtectedRoute';
// Import react-toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Main App wrapper with ThemeProvider and AuthProvider
export function AppWrapper() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

// Main App component
function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [approvalCount, setApprovalCount] = useState(0);
  const { isDarkMode, themeColor, sidebarColor, updateTheme } = useTheme();
  const { user, logout, getApprovalRequests } = useAuth();
  
  // Fetch approval requests for admin/HOD users
  useEffect(() => {
    let isMounted = true;
    let intervalId;
    
    const fetchApprovalRequests = async () => {
      if (user && (user.role === 'admin' || user.role === 'hod')) {
        try {
          const requests = await getApprovalRequests();
          if (isMounted) {
            setApprovalCount(requests.length);
          }
        } catch (error) {
          console.error('Error fetching approval requests:', error);
        }
      }
    };
    
    if (user && (user.role === 'admin' || user.role === 'hod')) {
      // Use setTimeout to delay the initial fetch to prevent refresh issues
      const timeoutId = setTimeout(() => {
        fetchApprovalRequests();
        // Refresh approval count every 5 minutes
        intervalId = setInterval(fetchApprovalRequests, 5 * 60 * 1000);
      }, 1000); // 1 second delay
      
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, getApprovalRequests]);

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Toast Container for notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
        {/* Sidebar Navigation - Hidden on mobile, visible on md screens and up */}
        <div className={`hidden md:flex w-64 ${isDarkMode ? `bg-${sidebarColor}-800` : `bg-${sidebarColor}-700`} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} flex-col`}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
            <div className={`bg-${themeColor}-600 rounded-md p-1`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-white">Logixica</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="py-4 flex-grow">
            <div className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Outcome Board</div>
            <NavLink to="/" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </NavLink>
            {user && (user.role === 'admin' || user.role === 'hod') && (
              <NavLink to="/dashboard/approval-requests" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approvals
                {approvalCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full bg-${themeColor}-600 text-white`}>
                    {approvalCount}
                  </span>
                )}
              </NavLink>
            )}
            <div className="relative group">
              <NavLink to="/dashboard/master-data" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Master Data
              </NavLink>
              <div className="absolute left-full top-0 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 transform scale-0 group-hover:scale-100 transition-transform origin-left">
                <div className="py-1">
                  <Link to="/dashboard/master-data/code" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Dropdown Values
                  </Link>
                  <Link to="/dashboard/master-data/subject" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Subject
                  </Link>
                  <Link to="/dashboard/master-data/course" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Course
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative group">
              <NavLink to="/dashboard/outcome-board/masters" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Masters
              </NavLink>
              <div className="absolute left-full top-0 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 transform scale-0 group-hover:scale-100 transition-transform origin-left">
                <div className="py-1">
                  <Link to="/dashboard/outcome-board/masters/department" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Department
                  </Link>
                  <Link to="/dashboard/outcome-board/masters/vision" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Vision & Mission
                  </Link>
                  <Link to="/dashboard/outcome-board/masters/po" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    PO (Program Outcome)
                  </Link>
                  <Link to="/dashboard/outcome-board/masters/co" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    CO (Course Outcome)
                  </Link>
                </div>
              </div>
            </div>
            <NavLink to="/dashboard/outcome-board/mapping" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Mapping
            </NavLink>
            <NavLink to="/dashboard/outcome-board/attainment" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Attainment
            </NavLink>
            <NavLink to="/dashboard/outcome-board/r-path" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              R-Path
            </NavLink>
            <NavLink to="/dashboard/education" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" />
              </svg>
              Education
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </NavLink>
          </div>

          {/* Logout */}
            <div className="p-4 border-t border-gray-700">
            <button onClick={logout} className="flex w-full items-center px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Sidebar - Visible only when mobile menu is open */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
            
            {/* Mobile Menu */}
            <div className={`fixed inset-y-0 left-0 flex flex-col w-72 max-w-sm ${isDarkMode ? `bg-${sidebarColor}-800` : `bg-${sidebarColor}-700`} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} overflow-y-auto`}>
              {/* Logo */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`bg-${themeColor}-600 rounded-md p-1`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">iERP System</div>
                    <div className="text-xs text-gray-400">Admin</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="py-4 flex-grow">
                <div className="px-4 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Outcome Board</div>
                <NavLink to="/" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </NavLink>
                {user && (user.role === 'admin' || user.role === 'hod') && (
                  <NavLink to="/dashboard/approval-requests" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approvals
                    {approvalCount > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full bg-${themeColor}-600 text-white`}>
                        {approvalCount}
                      </span>
                    )}
                  </NavLink>
                )}
                <div className="relative">
                  <NavLink to="/dashboard/master-data" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Master Data
                  </NavLink>
                  <div className="pl-12 mt-1 mb-2 border-l-2 border-gray-700 ml-4">
                    <Link to="/dashboard/master-data/code" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Dropdown Values
                    </Link>
                    <Link to="/dashboard/master-data/subject" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Subject
                    </Link>
                    <Link to="/dashboard/master-data/course" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Course
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <NavLink to="/dashboard/outcome-board/masters" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Masters
                  </NavLink>
                  <div className="pl-12 mt-1 mb-2 border-l-2 border-gray-700 ml-4">
                    <Link to="/dashboard/outcome-board/masters/department" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Department
                    </Link>
                    <Link to="/dashboard/outcome-board/masters/course" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Course
                    </Link>
                    <Link to="/dashboard/outcome-board/masters/vision" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Vision
                    </Link>
                    <Link to="/dashboard/outcome-board/masters/mission" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      Mission
                    </Link>
                    <Link to="/dashboard/outcome-board/masters/po" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      PO (Program Outcome)
                    </Link>
                    <Link to="/dashboard/outcome-board/masters/co" className="block py-2 text-sm text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                      CO (Course Outcome)
                    </Link>
                  </div>
                </div>
                <NavLink to="/dashboard/outcome-board/mapping" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Mapping
                </NavLink>
                <NavLink to="/dashboard/outcome-board/attainment" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Attainment
                </NavLink>
                <NavLink to="/dashboard/outcome-board/r-path" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  R-Path
                </NavLink>
                <NavLink to="/dashboard/education" className={({isActive}) => `flex items-center px-4 py-3 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" />
                  </svg>
                  Education
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `flex items-center px-4 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </NavLink>
              </div>

              {/* Logout */}
              <div className="p-4 border-t border-gray-700">
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex w-full items-center px-4 py-3 text-red-400 hover:bg-gray-700 hover:text-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-b flex items-center justify-between p-3 sm:p-4`}>
            <div className="flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden mr-3 text-gray-300 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-white">Logixica Schooler</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Dark/Light Mode Toggle */}
              <button 
                onClick={() => updateTheme('isDarkMode', !isDarkMode)}
                className={`text-${isDarkMode ? 'gray-300 hover:text-white' : 'gray-600 hover:text-gray-800'} relative`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {/* Notification Bell */}
              <button className="text-gray-300 hover:text-white relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500"></span>
              </button>
              {/* User Profile */}
              <button className="text-gray-300 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} p-3 sm:p-4`}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<OutcomeBoard />} />
                <Route path="/dashboard/outcome-board/*" element={<OutcomeBoard />} />
                <Route path="/dashboard/master-data/*" element={<MasterDataSection />} />
                <Route path="/dashboard/education/*" element={<EducationModule />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Admin/HOD Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'hod']} />}>
                  <Route path="/dashboard/approval-requests" element={<ApprovalRequests />} />
                </Route>
              </Route>
            </Routes>
          </main>
        </div>
      </div>
  );
}

// Simple HomePage component
const HomePage = () => (
  <div className="max-w-7xl mx-auto px-2 sm:px-4">
    <div className="mb-6 sm:mb-8 text-center sm:text-left">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Welcome to Logixica Schooler</h1>
      <p className="text-gray-300 text-sm sm:text-base">Manage your academic and administrative tasks efficiently</p>
      <button className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors">
        Admin Dashboard
      </button>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Total Students */}
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Students</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">2,456</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +15% from last month
            </p>
          </div>
          <div className="bg-blue-900/30 p-1.5 sm:p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Ph.D. Applications */}
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Active Ph.D. Applications</h3>
            <p className="text-xl sm:text-2xl font-bold text-white">89</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +5% this week
            </p>
          </div>
          <div className="bg-indigo-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* NAAC Submissions */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">NAAC Submissions</h3>
            <p className="text-2xl font-bold text-white">23</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +18% completion
            </p>
          </div>
          <div className="bg-purple-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Startups */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Active Startups</h3>
            <p className="text-2xl font-bold text-white">34</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +7% new registrations
            </p>
          </div>
          <div className="bg-cyan-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Second Row Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Faculty Members */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Faculty Members</h3>
            <p className="text-2xl font-bold text-white">187</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +2 new hires
            </p>
          </div>
          <div className="bg-blue-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Research Projects */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Research Projects</h3>
            <p className="text-2xl font-bold text-white">156</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              ₹2.5Cr funding
            </p>
          </div>
          <div className="bg-indigo-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Placement Rate */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Placement Rate</h3>
            <p className="text-2xl font-bold text-white">94%</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +8% from last year
            </p>
          </div>
          <div className="bg-purple-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Infrastructure Score */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Infrastructure Score</h3>
            <p className="text-2xl font-bold text-white">92/100</p>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              NAAC Grade A+
            </p>
          </div>
          <div className="bg-cyan-900/30 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Recent Activities and Quick Actions */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activities */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">Recent Activities</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Latest updates and notifications</p>
        {/* Activity list would go here */}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <p className="text-xs text-gray-400 mb-4">Common tasks for admins</p>
        {/* Quick action buttons would go here */}
      </div>
    </div>
  </div>
);

export default AppWrapper;
