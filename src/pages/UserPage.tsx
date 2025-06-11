import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import ProtectedRoute from '../components/features/Auth/ProtectedRoute';
import UserDashboard from '../components/features/User/UserDashboard';
import LoginPage from './LoginPage';
import useUserStore from '../store/useUserStore';

const UserPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthContext();
  const { accessToken } = useUserStore();

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If authenticated, show dashboard inside protected route
  return (
    <ProtectedRoute>
      <UserDashboard user={user} accessToken={accessToken} />
    </ProtectedRoute>
  );
};

export default UserPage;