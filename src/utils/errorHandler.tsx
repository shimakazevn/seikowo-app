import React, { ErrorInfo, ReactNode } from 'react';

export enum ErrorTypes {
  API_ERROR = 'API_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  type: ErrorTypes;

  constructor(type: ErrorTypes, message: string) {
    super(message);
    this.type = type;
    this.name = 'AppError';
  }
}

export const handleError = (error: any): AppError => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === 'TypeError' && error?.message.includes('fetch')) {
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
    error?.message || 'Đã xảy ra lỗi không xác định'
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(ErrorTypes.UNKNOWN_ERROR, error?.message);
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
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