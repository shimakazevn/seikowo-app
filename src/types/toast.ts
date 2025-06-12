export interface ToastFunction {
  (options: {
    title: string;
    description: string;
    status: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    isClosable: boolean;
  }): void;
} 