import React from 'react';
import {
  Box,
  Container,
  VStack,
  Text,
  useColorMode,
  Center,
  useToast
} from '@chakra-ui/react';
import { LoginButton } from '../components/features/Auth/LoginButton';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';

const LoginPage: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#888' : '#666';
  const toast = useToast();

  const { user, accessToken } = useUserStore();
  const { syncData } = useFavoriteBookmarkStore();

  return (
    <Box
      bg={isDark ? '#000000' : '#ffffff'}
      minH="100vh"
      color={textColor}
      position="relative"
    >
      <Container maxW="400px" py={8}>
        <Center minH="80vh">
          <VStack spacing={6} textAlign="center" w="100%">
            <VStack spacing={3}>
              <Text
                fontSize="2xl"
                fontWeight="600"
                color={textColor}
              >
                ようこそ！ welcome senpai~
              </Text>
              <Text
                color={mutedColor}
                fontSize="sm"
                textAlign="center"
              >
                sign in with google to unlock your profile
              </Text>
            </VStack>

            <LoginButton
              variant="google"
              size="md"
              useGoogleIcon={true}
              onSuccess={async () => {
                console.log('Login successful');
                if (user && user.id && accessToken) {
                  try {
                    await syncData(user.id, accessToken, toast);
                    console.log('User data synced from Drive to IndexedDB.');
                  } catch (error) {
                    console.error('Error syncing data from Drive:', error);
                    toast({
                      title: 'Lỗi đồng bộ dữ liệu',
                      description: 'Không thể đồng bộ dữ liệu từ Google Drive.',
                      status: 'error',
                      duration: 5000,
                      isClosable: true,
                    });
                  }
                }
              }}
              onError={(error) => {
                console.error('Login error:', error);
                toast({
                  title: 'Lỗi đăng nhập',
                  description: 'Đăng nhập không thành công. Vui lòng thử lại.',
                  status: 'error',
                  duration: 5000,
                  isClosable: true,
                });
              }}
            />

            <Text
              fontSize="xs"
              color={isDark ? '#666' : '#999'}
              textAlign="center"
            >
              ready for an epic adventure? (◕‿◕)
            </Text>
          </VStack>
        </Center>
      </Container>
    </Box>
  );
};

export default LoginPage; 