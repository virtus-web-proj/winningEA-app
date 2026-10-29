import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="min-h-[60vh]" />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.hash }} replace />;
  return children;
}
