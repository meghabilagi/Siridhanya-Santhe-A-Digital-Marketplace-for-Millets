import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — guards routes by authentication and role.
 *
 * Props:
 *   allowedRoles: string[]  — roles permitted to access the nested routes
 *
 * Behaviour:
 *   - Not authenticated → redirect to /login
 *   - Authenticated but wrong role → redirect to / with state { message: 'Access Denied' }
 *   - Authorised → render <Outlet />
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" state={{ message: 'Access Denied' }} replace />
  }

  return <Outlet />
}
