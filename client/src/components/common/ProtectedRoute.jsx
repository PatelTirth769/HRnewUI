import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth.jsx'
import { useUserRole } from '../../hooks/useUserRole.js'

const ProtectedRoute = ({ children }) => {
  const [auth] = useAuth()
  const location = useLocation()
  const { isStudent, isGuardian } = useUserRole()
  
  const token = auth?.token || localStorage.getItem('userToken') || localStorage.getItem('apiToken')
  const isLogged = localStorage.getItem('isLogged') === 'true'

  if (!token || !isLogged) return <Navigate to="/login" replace />

  // Security constraint: Restrict Students and Guardians to their own dashboards
  if (isStudent && location.pathname !== '/student-dashboard') {
     return <Navigate to="/student-dashboard" replace />
  }

  if (isGuardian && location.pathname !== '/guardian-dashboard') {
     return <Navigate to="/guardian-dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default ProtectedRoute
