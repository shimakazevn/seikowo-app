import React, { ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorTypes } from '../utils/errorHandler'; // Assuming errorHandler is now TS

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