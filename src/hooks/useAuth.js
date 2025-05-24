import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStoredToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
  isTokenValid,
  refreshToken,
  login,
  logout,
  getUserInfo,
  isAuthenticated,
  getValidToken
} from '../api/auth';
import { handleError } from '../api';
import useUserStore from '../store/useUserStore';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId, accessToken, setUser, setGuest } = useUserStore();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getStoredToken();
      if (!token) {
        setGuest();
        return;
      }

      // Kiểm tra token hiện tại
      let isValid = await isTokenValid(token);
      let currentToken = token;

      // Nếu token không hợp lệ, thử refresh
      if (!isValid) {
        const refreshTokenValue = getStoredRefreshToken();
        if (refreshTokenValue) {
          try {
            currentToken = await refreshToken(refreshTokenValue);
            isValid = true;
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Không xóa user ngay lập tức, để người dùng có thể thử lại
            return;
          }
        } else {
          setGuest();
          return;
        }
      }

      // Lấy thông tin user
      const userInfo = await getUserInfo(currentToken);
      if (!userInfo.sub) {
        throw new Error('Invalid user info');
      }

      // Lưu lại user info vào localStorage
      localStorage.setItem('user_info', JSON.stringify({
        sub: userInfo.sub,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email: userInfo.email,
        email_verified: userInfo.email_verified
      }));

      setUser(userInfo.sub, currentToken);
    } catch (err) {
      const handledError = handleError(err);
      setError(handledError);
      // Chỉ xóa user khi có lỗi nghiêm trọng
      if (err.message?.includes('Invalid user info')) {
        setGuest();
        clearStoredTokens();
        localStorage.removeItem('user_info');
      }
    } finally {
      setLoading(false);
    }
  }, [setUser, setGuest]);

  const handleLogin = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = await login(code);
      setUser(userInfo.sub, getStoredToken());
      navigate('/', { replace: true });
    } catch (err) {
      const handledError = handleError(err);
      setError(handledError);
      setGuest();
    } finally {
      setLoading(false);
    }
  }, [navigate, setUser, setGuest]);

  const handleLogout = useCallback(() => {
    logout();
    setGuest();
    setError(null);
    navigate('/', { replace: true });
  }, [navigate, setGuest]);

  const handleRetry = useCallback(() => {
    setError(null);
    checkAuth();
  }, [checkAuth]);

  // Kiểm tra auth khi component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Tự động refresh token trước khi hết hạn
  useEffect(() => {
    if (!accessToken) return;

    const checkTokenInterval = setInterval(async () => {
      try {
        const token = getStoredToken();
        if (!token) return;

        const isValid = await isTokenValid(token);
        if (!isValid) {
          const refreshTokenValue = getStoredRefreshToken();
          if (refreshTokenValue) {
            const newToken = await refreshToken(refreshTokenValue);
            setUser(userId, newToken);
          } else {
            // Không logout ngay lập tức, để người dùng có thể thử lại
            console.warn('Refresh token not found');
          }
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        // Không logout ngay lập tức, để người dùng có thể thử lại
      }
    }, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút

    return () => clearInterval(checkTokenInterval);
  }, [accessToken, userId, setUser]);

  return {
    user: userId !== 'guest' ? { sub: userId } : null,
    loading,
    error,
    isAuthenticated: userId !== 'guest',
    login: handleLogin,
    logout: handleLogout,
    retry: handleRetry
  };
}; 