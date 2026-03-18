import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext();
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const getApiUrl = (path) => `${API_BASE_URL}${path}`;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // If user needs approval (teacher or faculty)
      if (data.isApproved === false) {
        toast.info(data.message || 'Registration successful. Your account is pending approval.');
        navigate('/login');
        return;
      }

      // For roles that don't need approval
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get approval requests (for admin/HOD)
  const getApprovalRequests = async () => {
    try {
      // Don't set global loading state to prevent UI refresh
      console.log('Fetching approval requests');
      
      const response = await fetch(getApiUrl('/api/users/approval-requests'), {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to fetch approval requests: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched approval requests:', data);
      return data;
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      return [];
    }
  };

  // Approve user (for admin/HOD)
  const approveUser = async (userId) => {
    try {
      // Don't set global loading state to prevent UI refresh
      console.log(`Approving user with ID: ${userId}`);
      
      const response = await fetch(getApiUrl(`/api/users/${userId}/approve`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to approve user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Approval successful:', data);
      
      // Don't show toast here, let the component handle it
      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      return false;
    }
  };
  
  // Reject user (for admin/HOD)
  const rejectUser = async (userId, reason) => {
    try {
      // Don't set global loading state to prevent UI refresh
      console.log(`Rejecting user with ID: ${userId}, reason: ${reason}`);
      
      const response = await fetch(getApiUrl(`/api/users/${userId}/reject`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to reject user: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Rejection successful:', data);
      
      // Don't show toast here, let the component handle it
      return true;
    } catch (error) {
      console.error('Error rejecting user:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    getApprovalRequests,
    approveUser,
    rejectUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};