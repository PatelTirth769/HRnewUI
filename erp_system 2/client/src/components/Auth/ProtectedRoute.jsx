import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Protected route component that redirects to login if not authenticated
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // If still loading auth state, show nothing (or could show a spinner)
  if (loading) {
    return null;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user doesn't have the required role, redirect to dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is logged in and has the required role (or no roles specified), render the child routes
  return <Outlet />;
};

export default ProtectedRoute;