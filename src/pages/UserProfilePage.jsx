import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Avatar,
  HStack,
  Badge,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdEmail, MdVerified } from 'react-icons/md';
import { useAuth } from '../hooks/useAuth';
import { getUserInfo as fetchUserInfo } from '../api/auth';
import { handleError } from '../api';
import { 
  getStoredToken, 
  getUserInfo, 
  setUserInfo as saveUserInfo,
  USER_INFO_CACHE_DURATION
} from '../utils/userUtils';

const DEFAULT_AVATAR = 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png';

function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const avatarBg = useColorModeValue('gray.100', 'gray.700');

  // Memoize user info from localStorage
  const cachedUserInfo = useMemo(() => getUserInfo(), []);

  useEffect(() => {
    const loadUserInfo = async () => {
      const accessToken = getStoredToken();
      if (!accessToken) {
        setError('Không tìm thấy token đăng nhập');
        setLoading(false);
        return;
      }

      // Use cached data if available
      if (cachedUserInfo) {
        setUserInfo(cachedUserInfo);
        setLoading(false);
        return;
      }

      // Fetch fresh data from API
      try {
        const data = await fetchUserInfo(accessToken);
        const dataWithTimestamp = { ...data, timestamp: Date.now() };
        setUserInfo(dataWithTimestamp);
        saveUserInfo(dataWithTimestamp);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err.message);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin người dùng',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [cachedUserInfo, toast]);

  const handleAvatarError = () => {
    setAvatarError(true);
    toast({
      title: 'Lỗi tải avatar',
      description: 'Không thể tải ảnh đại diện, đang sử dụng ảnh mặc định',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="200px" borderRadius="lg" />
          <Skeleton height="40px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Lỗi
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button
            colorScheme="blue"
            mt={4}
            onClick={() => navigate('/')}
          >
            Quay lại trang chủ
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <Box
        bg={bgColor}
        p={8}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6} align="center">
          <Avatar
            size="2xl"
            name={userInfo?.name}
            src={avatarError ? DEFAULT_AVATAR : userInfo?.picture}
            onError={handleAvatarError}
            bg={avatarBg}
          />
          
          <VStack spacing={2} align="center">
            <Heading size="lg" color={textColor}>
              {userInfo?.name}
            </Heading>
            <HStack spacing={2} align="center">
              <Text color={mutedTextColor}>
                {userInfo?.given_name} {userInfo?.family_name}
              </Text>
              {userInfo?.email_verified && (
                <Badge colorScheme="green" display="flex" alignItems="center" px={2} py={0.5} fontWeight="bold" fontSize="sm">
                  <MdVerified style={{ marginRight: 4 }} />
                  ĐÃ XÁC MINH
                </Badge>
              )}
            </HStack>
          </VStack>

          <VStack spacing={4} align="stretch" width="100%">
            <Box>
              <HStack spacing={2} color={mutedTextColor}>
                <MdEmail />
                <Text>{userInfo?.email}</Text>
              </HStack>
            </Box>

            <Box>
              <Text color={mutedTextColor} fontSize="sm">
                ID: {userInfo?.sub}
              </Text>
            </Box>
          </VStack>
        </VStack>
      </Box>
    </Container>
  );
}

export default UserProfilePage; 