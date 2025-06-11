import React, { useState } from 'react';
import { IconButton, Button, useToast, Box, useColorModeValue } from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import { MdLogin, MdLogout } from 'react-icons/md';
import { useAuth } from '../../../hooks/useAuthNew';
import { blogConfig } from '../../../config'; // Import blogConfig

interface LoginButtonProps {
  variant?: 'icon' | 'button' | 'google' | 'google-compact' | 'google-full' | 'google-floating';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: string;
  width?: string | number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  useGoogleIcon?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const LoginButton = ({
  variant = 'icon',
  size = 'sm',
  colorScheme,
  width = '240px',
  position = 'bottom-right',
  useGoogleIcon = false,
  onSuccess,
  onError
}: LoginButtonProps): React.ReactElement | null => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const toast = useToast();

  const isLoading = authLoading || isProcessing;

  // Color mode values
  const bgColor = useColorModeValue('white', '#202124');
  const borderColor = useColorModeValue('gray.200', 'rgba(255,255,255,0.2)');
  const textColor = useColorModeValue('rgba(0,0,0,.54)', 'white');
  const hoverBg = useColorModeValue('gray.50', '#303134');
  const activeBg = useColorModeValue('gray.100', '#424242');

  // Google login hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      console.log('=== Google Login Success ===');
      console.log('Response received:', {
        hasAccessToken: !!response.access_token,
        tokenType: response.token_type,
        scope: response.scope,
        expiresIn: response.expires_in
      });

      if (!response.access_token) {
        console.error('No access token in response');
        toast({
          title: 'Lỗi đăng nhập',
          description: 'Không nhận được token từ Google',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        onError?.(new Error('No access token'));
        return;
      }

      setIsProcessing(true);
      try {
        console.log('Calling login with token...');
        await login(response.access_token);
        console.log('Login completed successfully');
        onSuccess?.();

        toast({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng bạn quay trở lại!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Login failed:', error);
        toast({
          title: 'Lỗi đăng nhập',
          description: error instanceof Error ? error.message : 'Không thể đăng nhập',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (error) => {
      console.error('=== Google Login Error ===');
      console.error('Error details:', error);
      toast({
        title: 'Lỗi đăng nhập',
        description: 'Không thể đăng nhập bằng Google',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      onError?.(error);
    },
    scope: blogConfig.scope, // Use scope from blogConfig
    flow: 'implicit',
    prompt: 'consent'
  });

  // Handle logout
  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await logout();
    } catch (error) {
      // Error is already handled in useAuth
    } finally {
      setIsProcessing(false);
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return '32px';
      case 'lg': return '48px';
      default: return '40px';
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return '12px';
      case 'lg': return '16px';
      default: return '14px';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return '14px';
      case 'lg': return '22px';
      default: return '18px';
    }
  };

  const getGoogleButtonStyles = () => {
    // Determine the border color based on color mode and variant
    const currentBorderColor = useColorModeValue('gray.200', 'transparent'); // Make border transparent in dark mode for Google buttons

    const baseStyles = {
      bg: bgColor,
      color: textColor,
      border: '1px solid',
      // The borderColor will be set specifically for Google variants below
      _hover: {
        bg: hoverBg,
        boxShadow: "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
        transform: 'translateY(-1px)'
      },
      _active: {
        bg: activeBg,
        boxShadow: "0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)",
        transform: 'translateY(0)'
      },
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2
    };

    switch (variant) {
      case 'google-compact':
        return {
          ...baseStyles,
          w: 'auto',
          h: '36px',
          fontSize: 'sm',
          fontWeight: '500',
          px: 4,
          borderRadius: '4px',
          // Override border color for this variant
          borderColor: currentBorderColor,
        };
      case 'google-full':
        return {
          ...baseStyles,
          w: 'full',
          h: '44px',
          fontSize: 'sm',
          fontWeight: '500',
          borderRadius: '4px',
          // Override border color for this variant
          borderColor: currentBorderColor,
        };
      case 'google-floating':
        return {
          ...baseStyles,
          w: 'auto',
          h: 'auto',
          p: 3,
          borderRadius: 'full',
          boxShadow: 'lg',
          // Override border color for this variant
          borderColor: currentBorderColor,
        };
      default: // google
        return {
          ...baseStyles,
          w: width,
          h: getHeight(),
          fontSize: getFontSize(),
          fontWeight: '500',
          px: 4,
          borderRadius: '8px',
          // Override border color for this variant
          borderColor: currentBorderColor,
        };
    }
  };

  console.log('[LoginButton] Render:', {
    isLoading: isLoading,
    authLoading: authLoading,
    isProcessing: isProcessing,
    isAuthenticated: isAuthenticated
  });

  // Google style button
  if (variant.startsWith('google')) {
    const button = (
      <Button
        onClick={() => googleLogin()}
        isLoading={isLoading}
        loadingText="Đang đăng nhập..."
        leftIcon={
          useGoogleIcon ? (
            <Box
              as="img"
              src="https://www.google.com/favicon.ico"
              alt="Google"
              w={getIconSize()}
              h={getIconSize()}
            />
          ) : undefined
        }
        {...getGoogleButtonStyles()}
      >
        {variant === 'google-floating' ? null : 'Đăng nhập với Google'}
      </Button>
    );

    if (variant === 'google-floating') {
      const [top, right, bottom, left] = position.split('-').map(pos => 
        pos === 'top' || pos === 'left' ? '20px' : 'auto'
      );
      return (
        <Box
          position="fixed"
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          zIndex={1000}
        >
          {button}
        </Box>
      );
    }

    return button;
  }

  // Regular button
  if (variant === 'button') {
    return (
      <Box position="relative" w={width}>
        <Button
          leftIcon={isAuthenticated ? <MdLogout /> : <MdLogin />}
          onClick={isAuthenticated ? handleLogout : () => googleLogin()}
          isLoading={isLoading}
          loadingText={isAuthenticated ? 'Đang đăng xuất...' : 'Đang đăng nhập...'}
          colorScheme={colorScheme || (isAuthenticated ? 'red' : 'blue')}
          size={size}
          w={width}
        >
          {isAuthenticated ? 'Đăng xuất' : 'Đăng nhập'}
        </Button>
      </Box>
    );
  }

  // Icon button
  return (
    <IconButton
      aria-label={isAuthenticated ? 'Đăng xuất' : 'Đăng nhập'}
      icon={isAuthenticated ? <MdLogout /> : <MdLogin />}
      onClick={isAuthenticated ? handleLogout : () => googleLogin()}
      isLoading={isLoading}
      colorScheme={colorScheme || (isAuthenticated ? 'red' : 'blue')}
      size={size}
      variant="ghost"
    />
  );
};

export default LoginButton;
