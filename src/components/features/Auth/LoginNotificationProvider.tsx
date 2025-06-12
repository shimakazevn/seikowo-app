import React, { createContext, useContext, ReactNode } from 'react';
import LoginNotificationModal from './LoginNotificationModal';
import { LOGIN_NOTIFICATIONS, useLoginNotification } from '../../../hooks';

interface LoginNotificationContextType {
  checkAuthAndNotify: (options?: any) => boolean;
  executeWithAuth: (action: () => void | Promise<void>, options?: any) => void | Promise<void>;
  showLoginNotification: (options?: any) => void;
  isAuthenticated: boolean;
}

export const LoginNotificationContext = createContext<LoginNotificationContextType | undefined>(undefined);

interface LoginNotificationProviderProps {
  children: ReactNode;
}

export const LoginNotificationProvider: React.FC<LoginNotificationProviderProps> = ({ children }) => {
  const {
    isAuthenticated,
    isModalOpen,
    modalProps,
    checkAuthAndNotify,
    executeWithAuth,
    closeModal,
    showLoginNotification
  } = useLoginNotification();

  const contextValue: LoginNotificationContextType = {
    checkAuthAndNotify,
    executeWithAuth,
    showLoginNotification,
    isAuthenticated
  };

  return (
    <LoginNotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Global Login Notification Modal */}
      <LoginNotificationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalProps.title}
        message={modalProps.message}
        feature={modalProps.feature}
      />
    </LoginNotificationContext.Provider>
  );
};

// Hook to use login notification context
export const useLoginNotificationContext = () => {
  const context = useContext(LoginNotificationContext);
  if (context === undefined) {
    throw new Error('useLoginNotificationContext must be used within a LoginNotificationProvider');
  }
  return context;
};

// Convenience hooks for common use cases
// The useAuthGuard hook was moved to src/hooks/useAuthGuard.ts to resolve HMR issues.

export default LoginNotificationProvider;
