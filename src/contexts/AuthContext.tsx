import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
// import { useAuth, UseAuthReturn } from '../hooks/useAuthNew'; // REMOVED - causing useAuth spam
import { Spinner, Center, Box, VStack, Text, Button } from '@chakra-ui/react';
import useUserStore from '../store/useUserStore';
import * as securityUtils from '../utils/securityUtils';

// Simplified AuthContextType to avoid useAuth hook
interface AuthContextType {
  user: any;
  isLoading: boolean;
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
    storeReady
  } = useUserStore();

  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state when component mounts
  useEffect(() => {
    const initAuth = async () => {
      if (isInitialized) return;
      
      try {
        console.log('[AuthProvider] Starting auth initialization...');
        setIsLoading(true);

        // First try to get token
        const token = await securityUtils.getAndDecryptToken();
        console.log('[AuthProvider] Token status:', token ? 'exists' : 'not found');

        // Then try to get user data
        const userData = await securityUtils.getAndDecryptUserData();
        console.log('[AuthProvider] User data status:', userData ? 'exists' : 'not found');

        // If we have token but no user data, try to get user info from Google
        if (token && !userData) {
          console.log('[AuthProvider] Token exists but no user data, attempting to fetch user info...');
          try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
              const googleUserData = await response.json();
              console.log('[AuthProvider] Successfully fetched user info from Google');
              
              // Save the user data
              const success = await securityUtils.encryptAndStoreUserData(googleUserData);
              if (success) {
                console.log('[AuthProvider] Successfully saved user data');
                const success = await initializeUser();
                console.log('[AuthProvider] Auth initialization result:', { success, storeReady });
                if (success) {
                  setIsInitialized(true);
                  return;
                }
              }
            }
          } catch (error) {
            console.error('[AuthProvider] Error fetching user info:', error);
          }
        }

        // If we have both token and user data, or if we couldn't recover user data
        const success = await initializeUser();
        console.log('[AuthProvider] Auth initialization result:', { success, storeReady });
        
        if (!success) {
          console.log('[AuthProvider] Auth initialization failed, clearing state...');
          // Only clear token if we couldn't recover user data
          if (!userData) {
            await storeLogout();
          }
        }
      } catch (err) {
        console.error('[AuthProvider] Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
        await storeLogout();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [initializeUser, storeLogout, isInitialized]);

  // Show loading state while initializing
  if (isLoading || !isInitialized) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500">Authentication Error</Text>
          <Text fontSize="sm" color="gray.500">{error}</Text>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </VStack>
      </Center>
    );
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: async (accessToken: string) => {
      try {
        setIsLoading(true);
        const success = await initializeUser();
        if (!success) {
          throw new Error('Failed to initialize user after login');
        }
      } catch (err) {
        console.error('[AuthProvider] Login error:', err);
        setError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    logout: storeLogout,
    refreshAuth: async () => {
      try {
        setIsLoading(true);
        await initializeUser();
      } catch (err) {
        console.error('[AuthProvider] Refresh error:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh auth');
      } finally {
        setIsLoading(false);
      }
    },
    clearError: () => setError(null),
    forceRefresh: async () => {
      try {
        setIsLoading(true);
        await initializeUser();
      } catch (err) {
        console.error('[AuthProvider] Force refresh error:', err);
        setError(err instanceof Error ? err.message : 'Failed to force refresh');
      } finally {
        setIsLoading(false);
      }
    },
    syncData: async () => {
      // Implementation would go here
      console.log('[AuthProvider] syncData called');
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
  const { isAuthenticated } = useUserStore();
  const isLoading = false; // Simplified for now

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
