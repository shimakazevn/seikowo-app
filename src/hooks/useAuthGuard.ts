import { useContext } from 'react';
import { LOGIN_NOTIFICATIONS } from './useLoginNotification';
import { LoginNotificationContext, useLoginNotificationContext } from '../components/features/Auth/LoginNotificationProvider';

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
    requireUserAction: (action: 'bookmark' | 'comment' | 'like') => {
      const notifications = {
        bookmark: LOGIN_NOTIFICATIONS.BOOKMARK,
        comment: LOGIN_NOTIFICATIONS.COMMENT,
        like: LOGIN_NOTIFICATIONS.LIKE
      };
      return checkAuthAndNotify(notifications[action]);
    },
    
    // Execute action with auth check
    executeWithAuth
  };
}; 