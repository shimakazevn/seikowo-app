import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { authService } from '../services/authService';
import useUserStore from '../store/useUserStore';
import { User } from '../types/global';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  });

  const {
    user: storeUser,
    isAuthenticated: storeIsAuthenticated,
    initializeUser,
    setUser,
    logout: storeLogout,
    storeReady
  } = useUserStore();

  const login = useCallback(async (accessToken?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      let userData: User;
      if (accessToken) {
        // Nếu có token, sử dụng token đó để đăng nhập
        const response = await authService.login(accessToken);
        userData = {
          sub: response.sub,
          name: response.name,
          given_name: response.given_name || '',
          family_name: response.family_name || '',
          picture: response.picture || '',
          email: response.email,
          email_verified: response.email_verified,
          id: response.sub,
          updatedAt: Date.now()
        };
      } else {
        // Nếu không có token, thực hiện đăng nhập Google mới
        const success = await authService.loginWithGoogle();
        if (!success) {
          throw new Error('Đăng nhập Google thất bại');
        }
        // Sau khi đăng nhập thành công, lấy thông tin user từ store
        await initializeUser();
        if (!storeUser) {
          throw new Error('Không thể lấy thông tin người dùng');
        }
        userData = storeUser;
      }

      // Lưu user vào store
      await setUser(userData, accessToken || null);

      setState(prev => ({
        ...prev,
        user: userData,
        isAuthenticated: true,
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Đăng nhập thất bại',
        isLoading: false
      }));

      toast({
        title: "Lỗi đăng nhập",
        description: error.message || "Không thể đăng nhập",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  }, [setUser, toast, initializeUser, storeUser]);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await storeLogout();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      });
      navigate('/');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  }, [navigate, storeLogout]);

  useEffect(() => {
    if (storeReady && storeIsAuthenticated) {
      setState(prev => ({
        ...prev,
        user: storeUser,
        isAuthenticated: storeIsAuthenticated,
        isLoading: false
      }));
      // Trigger syncUserData after authentication and store is ready
      // This ensures data is synchronized upon successful login or session restoration
      useUserStore.getState().syncUserData();
    }
  }, [storeUser, storeIsAuthenticated, storeReady]);

  return {
    ...state,
    login,
    logout
  };
};
