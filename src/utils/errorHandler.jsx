import React from 'react';

export const ErrorTypes = {
  API_ERROR: 'API_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export class AppError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
    this.name = 'AppError';
  }
}

export const handleError = (error) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return error;
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError(
      ErrorTypes.NETWORK_ERROR,
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
    );
  }

  if (error.response) {
    return new AppError(
      ErrorTypes.API_ERROR,
      `Lỗi máy chủ: ${error.response.status}`
    );
  }

  return new AppError(
    ErrorTypes.UNKNOWN_ERROR,
    error.message || 'Đã xảy ra lỗi không xác định'
  );
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Đã xảy ra lỗi</h2>
          <p>{this.state.error?.message || 'Vui lòng thử lại sau'}</p>
          <button onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 