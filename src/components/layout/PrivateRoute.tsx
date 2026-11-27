import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protege rotas privadas verificando a presença do token JWT em localStorage.
 */
export function PrivateRoute({ children }: { children?: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('@orca:token') : null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
