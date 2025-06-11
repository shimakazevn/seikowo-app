import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { DRIVE_SCOPE } from '../constants';
import { handleLogin } from '../utils/authUtils';
import { handleError } from '../api';
import { UseLoginParams, ToastFunction } from '../types/auth';

export const useGoogleAuth = ({
  setUser,
  initializeUser,
  navigate,
  toast,
  onClose
}: UseLoginParams) => {
  return useGoogleLogin({
    onSuccess: (response: TokenResponse) => handleLogin({
      response: response as any,
      setUser: setUser as any,
      initializeUser: initializeUser as any,
      navigate,
      toast: toast as any,
      onClose
    }),
    onError: (error: any) => {
      console.error('Google login error:', error);
      const handledError = handleError(error);
      toast({
        title: "Lỗi đăng nhập",
        description: handledError.message || "Không thể đăng nhập bằng Google",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
    flow: 'implicit',
    scope: DRIVE_SCOPE
  });
};
