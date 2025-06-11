import React from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { useAuthGuard, useLoginNotificationContext } from '../Auth/LoginNotificationProvider';
import { LOGIN_NOTIFICATIONS } from '../../hooks/useLoginNotification';

const LoginNotificationTest: React.FC = () => {
  const { isAuthenticated, showLoginNotification } = useLoginNotificationContext();
  const { requireAdmin, requirePostAccess, requireUserAction, executeWithAuth } = useAuthGuard();

  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const testActions = [
    {
      label: 'Test Admin Access',
      action: () => requireAdmin(),
      description: 'Kiểm tra quyền admin'
    },
    {
      label: 'Test Create Post',
      action: () => requirePostAccess('create'),
      description: 'Kiểm tra quyền tạo bài viết'
    },
    {
      label: 'Test Edit Post',
      action: () => requirePostAccess('edit'),
      description: 'Kiểm tra quyền chỉnh sửa'
    },
    {
      label: 'Test Delete Post',
      action: () => requirePostAccess('delete'),
      description: 'Kiểm tra quyền xóa bài viết'
    },
    {
      label: 'Test Bookmark',
      action: () => requireUserAction('bookmark'),
      description: 'Kiểm tra quyền bookmark'
    },
    {
      label: 'Test Follow',
      action: () => requireUserAction('follow'),
      description: 'Kiểm tra quyền follow'
    },
    {
      label: 'Test Like',
      action: () => requireUserAction('like'),
      description: 'Kiểm tra quyền like'
    },
    {
      label: 'Test Comment',
      action: () => requireUserAction('comment'),
      description: 'Kiểm tra quyền comment'
    }
  ];

  const executeWithAuthTests = [
    {
      label: 'Execute Admin Action',
      action: () => executeWithAuth(
        () => alert('Admin action executed!'),
        LOGIN_NOTIFICATIONS.ADMIN_ACCESS
      ),
      description: 'Thực hiện action admin'
    },
    {
      label: 'Execute User Action',
      action: () => executeWithAuth(
        () => alert('User action executed!'),
        LOGIN_NOTIFICATIONS.BOOKMARK
      ),
      description: 'Thực hiện action user'
    }
  ];

  const customNotificationTests = [
    {
      label: 'Custom Notification 1',
      action: () => showLoginNotification({
        title: 'Tính năng Premium',
        message: 'Bạn cần đăng nhập để sử dụng tính năng premium này',
        feature: 'tính năng premium'
      }),
      description: 'Thông báo tùy chỉnh 1'
    },
    {
      label: 'Custom Notification 2',
      action: () => showLoginNotification({
        title: 'Truy cập VIP',
        message: 'Nội dung này chỉ dành cho thành viên VIP',
        feature: 'nội dung VIP'
      }),
      description: 'Thông báo tùy chỉnh 2'
    }
  ];

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="bold">
          🧪 Login Notification Test
        </Text>
        
        <Text fontSize="sm" color="gray.500">
          Auth Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </Text>

        <Divider />

        {/* Auth Guard Tests */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Auth Guard Tests:
          </Text>
          
          {testActions.map((test, index) => (
            <HStack key={index} justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {test.label}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {test.description}
                </Text>
              </VStack>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={test.action}
              >
                Test
              </Button>
            </HStack>
          ))}
        </VStack>

        <Divider />

        {/* Execute With Auth Tests */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Execute With Auth Tests:
          </Text>
          
          {executeWithAuthTests.map((test, index) => (
            <HStack key={index} justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {test.label}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {test.description}
                </Text>
              </VStack>
              <Button
                size="sm"
                colorScheme="green"
                variant="outline"
                onClick={test.action}
              >
                Execute
              </Button>
            </HStack>
          ))}
        </VStack>

        <Divider />

        {/* Custom Notification Tests */}
        <VStack spacing={3} align="stretch">
          <Text fontSize="md" fontWeight="semibold">
            Custom Notification Tests:
          </Text>
          
          {customNotificationTests.map((test, index) => (
            <HStack key={index} justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {test.label}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {test.description}
                </Text>
              </VStack>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={test.action}
              >
                Show
              </Button>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};

export default LoginNotificationTest;
