import React, { createContext, useContext, ReactNode } from 'react';
import LoginNotificationModal from './LoginNotificationModal';
import { LOGIN_NOTIFICATIONS, useLoginNotification } from '../../../hooks';

interface LoginNotificationContextType {
  checkAuthAndNotify: (options?: any) => boolean;
  executeWithAuth: (action: () => void | Promise<void>, options?: any) => void | Promise<void>;
  showLoginNotification: (options?: any) => void;
  isAuthenticated: boolean;
}

const LoginNotificationContext = createContext<LoginNotificationContextType | undefined>(undefined);

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
export const useAuthGuard = () => {
  const { checkAuthAndNotify, executeWithAuth } = useLoginNotificationContext();
  
  return {
    // Check auth for admin access
    requireAdmin: () => checkAuthAndNotify(LOGIN_NOTIFICATIONS.ADMIN_ACCESS),
    
    // Check auth for post operations
    requirePostAccess: (action: 'create' | 'edit' | 'delete' | 'publish') => {
      const notifications = {
        create: LOGIN_NOTIFICATIONS.CREATE_POST,
        edit: LOGIN_NOTIFICATIONS.EDIT_POST,
        delete: LOGIN_NOTIFICATIONS.DELETE_POST,
        publish: LOGIN_NOTIFICATIONS.PUBLISH_POST
      };
      return checkAuthAndNotify(notifications[action]);
    },
    
    // Check auth for user interactions
    requireUserAction: (action: 'bookmark' | 'follow' | 'comment' | 'like') => {
      const notifications = {
        bookmark: LOGIN_NOTIFICATIONS.BOOKMARK,
        follow: LOGIN_NOTIFICATIONS.FOLLOW,
        comment: LOGIN_NOTIFICATIONS.COMMENT,
        like: LOGIN_NOTIFICATIONS.LIKE
      };
      return checkAuthAndNotify(notifications[action]);
    },
    
    // Execute action with auth check
    executeWithAuth
  };
};

export default LoginNotificationProvider;
