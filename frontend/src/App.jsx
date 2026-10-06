import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST']}><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><UsersPage /></Layout></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><AuditLogsPage /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST']}><Layout><NotificationsPage /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST']}><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><ReportsPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
