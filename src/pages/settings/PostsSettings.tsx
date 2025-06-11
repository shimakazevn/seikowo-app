import React from 'react';
import {
  Box,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useAuthContext } from '../../contexts/AuthContext';
import { adminConfig } from '../../config';
import AdminPage from '../../components/Settings/Admin/AdminPage';

const PostsSettings = () => {
  const { isAuthenticated, user } = useAuthContext();
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

  // Check if user is admin
  const isAdmin = React.useMemo(() => {
    if (!isAuthenticated || !user?.email) return false;
    return adminConfig.adminEmails.includes(user.email);
  }, [isAuthenticated, user?.email]);

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="lg" color={textColor} mb={2}>
          bạn không có quyền truy cập tính năng này.
        </Text>
        <Text fontSize="sm" color={mutedTextColor}>
          chỉ admin mới có thể quản lý bài viết.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <AdminPage skipAuthCheck={false} />
    </Box>
  );
};

export default PostsSettings;
