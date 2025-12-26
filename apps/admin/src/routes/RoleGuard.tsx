import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

interface RoleGuardProps {
  roles: string[];
  children: React.ReactElement;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const user = useSelector(selectUser);
  const role = user?.role;

  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
