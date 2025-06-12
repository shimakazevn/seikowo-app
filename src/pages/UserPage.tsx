import React, { Suspense } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import ProtectedRoute from '../components/features/Auth/ProtectedRoute';
import UserDashboard from '../components/features/User/UserDashboard';
import LoginPage from './LoginPage';
import useUserStore from '../store/useUserStore';
import { Center, Spinner } from '@chakra-ui/react';

// Wrap the main content in a component that safely uses auth context
const UserPageContent: React.FC = () => {
  const { isAuthenticated, user } = useAuthContext();
  const { accessToken } = useUserStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ProtectedRoute>
      <UserDashboard user={user} accessToken={accessToken} />
    </ProtectedRoute>
  );
};

// Main component with Suspense
const UserPage: React.FC = () => {
  return (
    <Suspense fallback={
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    }>
      <UserPageContent />
    </Suspense>
  );
};

export default UserPage;