import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

/** Only the admin account may see these pages. Everyone else goes to the admin login. */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

/** Customer pages. If the admin lands here they are sent to their own dashboard. */
export const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <>{children}</>;
};
