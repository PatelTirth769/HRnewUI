import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/auth.jsx'

const ProtectedRoute = ({ children }) => {
  const [auth] = useAuth()
  const token = auth?.token || localStorage.getItem('userToken') || localStorage.getItem('apiToken')
  const isLogged = localStorage.getItem('isLogged') === 'true'

  if (!token || !isLogged) return <Navigate to="/login" replace />

  return children ? children : <Outlet />
}

export default ProtectedRoute

