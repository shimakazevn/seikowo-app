import axios, { AxiosError, AxiosResponse } from 'axios';
import { tokenManager } from './tokenManager';
import { ApiResponse } from '../types/common';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 and refresh token
    if (error.response?.status === 401) {
      try {
        await tokenManager.refreshToken();
        // Retry original request
        const token = await tokenManager.getAccessToken();
        error.config!.headers.Authorization = `Bearer ${token}`;
        return apiClient(error.config!);
      } catch (e) {
        // Token refresh failed
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// API Response wrapper
export const handleApiResponse = async <T>(
  promise: Promise<AxiosResponse>
): Promise<ApiResponse<T>> => {
  try {
    const response = await promise;
    return {
      data: response.data,
      status: response.status,
      message: response.statusText
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        data: null as T,
        status: error.response?.status || 500,
        message: error.message
      };
    }
    throw error;
  }
};
