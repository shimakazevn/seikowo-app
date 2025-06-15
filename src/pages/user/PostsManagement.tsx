import React from 'react';
import {
  Box,
  Text,
  useColorModeValue,
  VStack,
  Heading,
} from '@chakra-ui/react';
import useUserStore from '../../store/useUserStore';
import PostsList from '../../components/Settings/PostsList/PostsList';
import AuthorRequestForm from '../../components/features/User/AuthorRequestForm';

interface PostsManagementProps {
  bloggerUserRole?: 'ADMIN' | 'AUTHOR' | 'READER' | 'NONE' | null;
  cardBg?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  isDark?: boolean;
}

const PostsManagement: React.FC<PostsManagementProps> = ({ 
  bloggerUserRole,
  cardBg,
  textColor: propTextColor,
  mutedColor,
  accentColor,
  isDark
}) => {
  const { isAuthenticated, user } = useUserStore();
  const defaultTextColor = useColorModeValue('gray.900', 'white');
  const textColor = propTextColor || defaultTextColor;

  if (!isAuthenticated) {
    return (
      <Box>
        <Text color={textColor}>Vui lòng đăng nhập để sử dụng tính năng này.</Text>
      </Box>
    );
  }

  // Check if the user has either ADMIN or AUTHOR role to manage posts
  if (bloggerUserRole !== 'ADMIN' && bloggerUserRole !== 'AUTHOR') {
    return (
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" color={textColor} mb={2}>
            Xin quyền Author
          </Heading>
          <Text color={mutedColor} mb={6}>
            Để quản lý bài viết, bạn cần có quyền Author. Hãy điền form dưới đây để gửi yêu cầu cho Admin.
          </Text>
        </Box>
        <AuthorRequestForm
          cardBg={cardBg || ''}
          textColor={textColor}
          mutedColor={mutedColor || ''}
          accentColor={accentColor || ''}
          isDark={isDark || false}
          userEmail={user?.email}
          userName={user?.name}
        />
      </VStack>
    );
  }

  return (
    <Box>
      <PostsList skipAuthCheck={true} bloggerUserRole={bloggerUserRole} />
    </Box>
  );
};

export default PostsManagement; 