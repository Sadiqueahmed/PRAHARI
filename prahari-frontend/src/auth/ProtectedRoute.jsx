import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Protected route wrapper — redirects to login if not authenticated.
 * Optionally restricts access to specific roles.
 * 
 * Usage:
 *   <Route path="/admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AdminPage /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#F1F5F9]">
        <div className="text-[--color-text-secondary] text-sm">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
