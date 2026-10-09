import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (location.pathname === '/dashboard' || user.role === 'UNKNOWN') {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}
