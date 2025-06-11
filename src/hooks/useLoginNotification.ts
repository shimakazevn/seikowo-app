import { useState, useCallback } from 'react';
// import { useAuth } from './useAuthNew'; // REMOVED - causing API spam
import useUserStore from '../store/useUserStore';

interface LoginNotificationOptions {
  title?: string;
  message?: string;
  feature?: string;
  requireAuth?: boolean;
}

export const useLoginNotification = () => {
  // Use store directly to avoid useAuth hook spam
  const { isAuthenticated } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<LoginNotificationOptions>({});

  // Check if user is authenticated and show modal if not
  const checkAuthAndNotify = useCallback((options: LoginNotificationOptions = {}) => {
    if (!isAuthenticated) {
      setModalProps({
        title: options.title || "Thông báo đăng nhập",
        message: options.message || "Bạn cần đăng nhập để sử dụng tính năng này",
        feature: options.feature || "tính năng này",
        ...options
      });
      setIsModalOpen(true);
      return false; // Not authenticated
    }
    return true; // Authenticated
  }, [isAuthenticated]);

  // Execute action only if authenticated, otherwise show notification
  const executeWithAuth = useCallback((
    action: () => void | Promise<void>,
    options: LoginNotificationOptions = {}
  ) => {
    if (checkAuthAndNotify(options)) {
      return action();
    }
  }, [checkAuthAndNotify]);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalProps({});
  }, []);

  // Show notification manually
  const showLoginNotification = useCallback((options: LoginNotificationOptions = {}) => {
    setModalProps({
      title: options.title || "Thông báo đăng nhập",
      message: options.message || "Bạn cần đăng nhập để tiếp tục",
      feature: options.feature || "tính năng này",
      ...options
    });
    setIsModalOpen(true);
  }, []);

  return {
    isAuthenticated,
    isModalOpen,
    modalProps,
    checkAuthAndNotify,
    executeWithAuth,
    closeModal,
    showLoginNotification
  };
};

// Predefined notification configurations
export const LOGIN_NOTIFICATIONS = {
  ADMIN_ACCESS: {
    title: "Truy cập Admin",
    message: "Bạn cần đăng nhập để truy cập trang quản trị",
    feature: "trang admin"
  },
  CREATE_POST: {
    title: "Tạo bài viết",
    message: "Bạn cần đăng nhập để tạo bài viết mới",
    feature: "tạo bài viết"
  },
  EDIT_POST: {
    title: "Chỉnh sửa bài viết",
    message: "Bạn cần đăng nhập để chỉnh sửa bài viết",
    feature: "chỉnh sửa bài viết"
  },
  DELETE_POST: {
    title: "Xóa bài viết",
    message: "Bạn cần đăng nhập để xóa bài viết",
    feature: "xóa bài viết"
  },
  PUBLISH_POST: {
    title: "Xuất bản bài viết",
    message: "Bạn cần đăng nhập để xuất bản bài viết",
    feature: "xuất bản bài viết"
  },
  SETTINGS_ACCESS: {
    title: "Truy cập Cài đặt",
    message: "Bạn cần đăng nhập để truy cập trang cài đặt",
    feature: "trang cài đặt"
  },
  BOOKMARK: {
    title: "Bookmark bài viết",
    message: "Bạn cần đăng nhập để bookmark bài viết",
    feature: "bookmark"
  },
  FOLLOW: {
    title: "Follow tác giả",
    message: "Bạn cần đăng nhập để follow tác giả",
    feature: "follow"
  },
  COMMENT: {
    title: "Bình luận",
    message: "Bạn cần đăng nhập để bình luận",
    feature: "bình luận"
  },
  LIKE: {
    title: "Thích bài viết",
    message: "Bạn cần đăng nhập để thích bài viết",
    feature: "like bài viết"
  }
} as const;
