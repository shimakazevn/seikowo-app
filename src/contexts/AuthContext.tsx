import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
// import { useAuth, UseAuthReturn } from '../hooks/useAuthNew'; // REMOVED - causing useAuth spam
import { Spinner, Center, Box, VStack, Text, Button } from '@chakra-ui/react';
import useUserStore from '../store/useUserStore';
import * as securityUtils from '../utils/securityUtils';

// Simplified AuthContextType to avoid useAuth hook
interface AuthContextType {
  user: any;
  isLoading: boolean; // Reflects if useUserStore is ready
  isAuthenticated: boolean;
  error: string | null;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  forceRefresh: () => void;
  syncData: () => Promise<void>;
  exportData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  uploadToken: string | null;
  setUploadToken: (token: string | null) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component - using store instead of useAuth hook
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Use store directly to avoid useAuth hook spam
  const {
    user,
    isAuthenticated,
    logout: storeLogout,
    initializeUser,
    storeReady,
    accessToken, // Get accessToken from store for syncData
    setUser: storeSetUser, // Use setUser from store directly
  } = useUserStore();

  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null); // Local error state for AuthProvider

  // Effect to ensure useUserStore is initialized
  useEffect(() => {
    console.log('[AuthProvider] useEffect started. Dependencies: storeReady=', storeReady, ', isAuthenticated=', isAuthenticated);
    let isMounted = true;
    // Only attempt to initialize if the store is not ready and user is not authenticated
    // This prevents re-initialization loops when no user data is found
    if (!storeReady && !isAuthenticated && isMounted) {
      console.log('[AuthProvider] EFFECT TRIGGERED: storeReady is false AND isAuthenticated is false, attempting initialization.');
      initializeUser().then(success => {
        if (!success && isMounted) {
          console.log('[AuthProvider] initial initializeUser failed.');
          // If initialization fails, the store should already reflect the unauthenticated state.
          // No need to call storeLogout here, as it could trigger another loop.
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [storeReady, isAuthenticated, initializeUser, storeLogout]); // Keep dependencies minimal and relevant

  // Show loading state while useUserStore is not ready
  if (!storeReady) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Show error state if initialization failed
  if (localError) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500">Authentication Error</Text>
          <Text fontSize="sm" color="gray.500">{localError}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </VStack>
      </Center>
    );
  }

  const contextValue: AuthContextType = {
    user,
    isLoading: !storeReady, // Reflects the store's readiness
    isAuthenticated,
    error: localError,
    login: async (newAccessToken: string) => {
      try {
        setLocalError(null);
        // When login is called, we directly set the user and access token in the store
        // We assume user data will be fetched and passed to storeSetUser within useAuthNew.ts
        // For now, we pass null for userData as useAuthNew.ts will handle getting it
        // The storeSetUser will then trigger restoreAndSaveUserData from Google Drive
        await storeSetUser(user, newAccessToken); // Pass current user and new access token
      } catch (err) {
        console.error('[AuthProvider] Login error:', err);
        setLocalError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      }
    },
    logout: storeLogout,
    refreshAuth: async () => {
      try {
        setLocalError(null);
        // Force re-initialization of user store to refresh auth status
        await initializeUser();
      } catch (err) {
        console.error('[AuthProvider] Refresh error:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to refresh auth');
      }
    },
    clearError: () => setLocalError(null),
    forceRefresh: async () => {
      try {
        setLocalError(null);
        await initializeUser(); // Force re-initialization
      } catch (err) {
        console.error('[AuthProvider] Force refresh error:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to force refresh');
      }
    },
    syncData: async () => {
      try {
        setLocalError(null);
        // syncUserData in useUserStore requires accessToken and userId
        if (accessToken && user?.id) {
          await useUserStore.getState().syncUserData(accessToken, user.id);
        } else {
          throw new Error("Cannot sync data: Access token or user ID is missing.");
        }
      } catch (err) {
        console.error('[AuthProvider] Sync data error:', err);
        setLocalError(err instanceof Error ? err.message : 'Failed to sync data');
        throw err;
      }
    },
    exportData: async () => {
      // Implementation would go here
      console.log('[AuthProvider] exportData called');
    },
    deleteAccount: async () => {
      // Implementation would go here
      console.log('[AuthProvider] deleteAccount called');
    },
    uploadToken,
    setUploadToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  // Use store directly to avoid useAuth hook spam
  const { isAuthenticated, storeReady } = useUserStore();
  const isLoading = !storeReady; // Use storeReady to determine loading state

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        {fallback || (
          <Center h="200px">
            <Box textAlign="center">
              <Box fontSize="lg" mb={2}>
                Bạn cần đăng nhập để truy cập trang này
              </Box>
            </Box>
          </Center>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
