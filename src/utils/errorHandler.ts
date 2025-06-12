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