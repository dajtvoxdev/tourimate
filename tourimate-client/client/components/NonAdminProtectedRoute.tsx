import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';

interface NonAdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function NonAdminProtectedRoute({ children }: NonAdminProtectedRouteProps) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isAdmin) {
    // Admin users cannot register as tour guides
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
