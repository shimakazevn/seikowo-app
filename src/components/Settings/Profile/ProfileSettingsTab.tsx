import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Avatar,
  useColorModeValue,
  SimpleGrid,
  Input,
  FormControl,
  FormLabel,
  Divider,
  IconButton,
  useToast,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import {
  MdVerified,
  MdLogout,
  MdDownload,
  MdDelete,
  MdRefresh,
  MdContentCopy,
  MdVisibility,
  MdVisibilityOff
} from 'react-icons/md';
import { User } from '../../../types';
import { useAuth } from '../../../hooks/useAuthNew';
import LoginButton from '../../features/Auth/LoginButton';

interface ProfileSettingsTabProps {
  isAuthenticated: boolean;
  userInfo: User | null;
  avatarUrl: string;
  handleAvatarError: () => void;
  isSyncing: boolean;
  handleSyncData: () => void;
  handleExportData: () => void;
  onLogoutOpen: () => void;
  onDeleteOpen: () => void;
  onDeleteDriveBackupOpen: () => void;
}

const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  isAuthenticated,
  userInfo,
  avatarUrl,
  handleAvatarError,
  isSyncing,
  handleSyncData,
  handleExportData,
  onLogoutOpen,
  onDeleteOpen,
  onDeleteDriveBackupOpen
}) => {
  // Local state
  const [showEmail, setShowEmail] = useState(false);
  const toast = useToast();
  const { login, isLoading: isAuthLoading } = useAuth();

  // Color mode values
  const textColor = useColorModeValue('#1a202c', '#ffffff');
  const mutedTextColor = useColorModeValue('#718096', '#a0aec0');
  const hoverBg = useColorModeValue('#f7fafc', '#2d3748');

  // Helper functions
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Responsive values (for future use)
  // const isMobile = useBreakpointValue({ base: true, md: false });
  // const avatarSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  // Not authenticated state
  if (!isAuthenticated || !userInfo) {
    return (
      <Box p={8} textAlign="center">
        <VStack spacing={6}>
          <Box>
            <Heading size="lg" color={textColor} mb={2}>
              chưa đăng nhập
            </Heading>
            <Text fontSize="md" color={mutedTextColor}>
              vui lòng đăng nhập để quản lý cài đặt tài khoản của bạn
            </Text>
          </Box>
          <LoginButton
            variant="google"
            size="md"
            useGoogleIcon={true}
            onSuccess={() => {
              console.log('Login successful');
            }}
            onError={(error) => {
              console.error('Login error:', error);
            }}
          />
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Mobile Layout */}
      <Box display={{ base: 'block', md: 'none' }}>
        <VStack spacing={6} align="stretch">
          {/* Profile Header - Mobile */}
          <Box>
            <VStack spacing={4} align="center">
              {/* Avatar with verification badge */}
              <Box position="relative">
                <Avatar
                  size="xl"
                  name={userInfo?.name || userInfo?.email}
                  src={avatarUrl || undefined}
                  onError={handleAvatarError}
                  boxShadow="md"
                />
                {userInfo?.email_verified && (
                  <Box
                    position="absolute"
                    bottom="2px"
                    right="2px"
                    bg="green.500"
                    borderRadius="full"
                    p={1}
                    boxShadow="sm"
                  >
                    <MdVerified color="white" size="12" />
                  </Box>
                )}
              </Box>

              {/* User name and email */}
              <VStack spacing={1} align="center">
                <Heading
                  size="md"
                  fontWeight="600"
                  color={textColor}
                  textAlign="center"
                >
                  {userInfo?.name || 'người dùng'}
                </Heading>
                <Text
                  fontSize="sm"
                  color={mutedTextColor}
                  textAlign="center"
                >
                  {userInfo?.email}
                </Text>
              </VStack>
            </VStack>
          </Box>

          <Divider />
          {/* Account Details - Mobile Optimized */}
          <Box>
            <Heading size="sm" color={textColor} mb={4} fontWeight="600">
              thông tin tài khoản
            </Heading>

            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="500" color={mutedTextColor} mb={1}>
                  email
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showEmail ? "email" : "text"}
                    value={showEmail ? userInfo.email : maskEmail(userInfo.email)}
                    isReadOnly
                    variant="filled"
                    size="sm"
                    _focus={{ bg: hoverBg }}
                  />
                  <InputRightElement height="32px">
                    <IconButton
                      aria-label={showEmail ? "Hide email" : "Show email"}
                      icon={showEmail ? <MdVisibilityOff /> : <MdVisibility />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowEmail(!showEmail)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="500" color={mutedTextColor} mb={1}>
                  user id
                </FormLabel>
                <InputGroup>
                  <Input
                    value={userInfo.sub || ''}
                    isReadOnly
                    variant="filled"
                    size="sm"
                    fontFamily="mono"
                    fontSize="xs"
                    _focus={{ bg: hoverBg }}
                  />
                  <InputRightElement height="32px">
                    <IconButton
                      aria-label="Copy user ID"
                      icon={<MdContentCopy />}
                      size="xs"
                      variant="ghost"
                      onClick={() => copyToClipboard(userInfo.sub || '', 'User ID')}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Data Management - Mobile Optimized */}
          <Box>
            <Heading size="sm" color={textColor} mb={4} fontWeight="600">
              quản lý dữ liệu
            </Heading>

            <VStack spacing={4} align="stretch">
              <Button
                leftIcon={<MdRefresh />}
                colorScheme="blue"
                variant="outline"
                onClick={handleSyncData}
                isLoading={isSyncing}
              >
                đồng bộ dữ liệu
              </Button>
              <Button
                leftIcon={<MdDownload />}
                colorScheme="green"
                variant="outline"
                onClick={handleExportData}
              >
                xuất dữ liệu cục bộ
              </Button>
              <Button
                leftIcon={<MdDelete />}
                colorScheme="red"
                variant="outline"
                onClick={onDeleteOpen}
              >
                xóa dữ liệu cục bộ
              </Button>
              {isAuthenticated && (
                <Button
                  leftIcon={<MdDelete />}
                  colorScheme="red"
                  variant="outline"
                  onClick={onDeleteDriveBackupOpen}
                >
                  xóa bản sao lưu trên drive
                </Button>
              )}
            </VStack>
          </Box>

          <Divider />

          {/* Security Actions - Mobile Optimized */}
          <Box>
            <Heading size="sm" color={textColor} mb={4} fontWeight="600">
              bảo mật & quyền riêng tư
            </Heading>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              <Button
                leftIcon={<MdLogout />}
                onClick={onLogoutOpen}
                colorScheme="orange"
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                fontWeight="500"
              >
                đăng xuất
              </Button>

              <Button
                leftIcon={<MdDelete />}
                onClick={onDeleteOpen}
                colorScheme="red"
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                fontWeight="500"
              >
                xóa dữ liệu
              </Button>
            </SimpleGrid>
          </Box>
        </VStack>
      </Box>

      {/* Desktop Layout */}
      <Box display={{ base: 'none', md: 'block' }}  mt={{ base: 0, md: 56 }}>
        <VStack spacing={8} align="stretch">
          {/* Profile Header - Desktop */}
          <Box>
            <HStack spacing={6} align="start">
              {/* Avatar with verification badge */}
              <Box position="relative">
                <Avatar
                  size="2xl"
                  name={userInfo?.name || userInfo?.email}
                  src={avatarUrl || undefined}
                  onError={handleAvatarError}
                  boxShadow="lg"
                />
                {userInfo?.email_verified && (
                  <Box
                    position="absolute"
                    bottom="4px"
                    right="4px"
                    bg="green.500"
                    borderRadius="full"
                    p={2}
                    boxShadow="md"
                  >
                    <MdVerified color="white" size="16" />
                  </Box>
                )}
              </Box>

              {/* User info */}
              <VStack align="start" spacing={2} flex={1}>
                <Heading
                  size="xl"
                  fontWeight="700"
                  color={textColor}
                >
                  {userInfo?.name || 'người dùng'}
                </Heading>
                <HStack spacing={2}>
                  <Text
                    fontSize="lg"
                    color={mutedTextColor}
                  >
                    {showEmail ? userInfo?.email : maskEmail(userInfo?.email || '')}
                  </Text>
                  <IconButton
                    aria-label={showEmail ? "Hide email" : "Show email"}
                    icon={showEmail ? <MdVisibilityOff /> : <MdVisibility />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowEmail(!showEmail)}
                  />
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="x-small" color={mutedTextColor} fontFamily="mono">
                    {userInfo.sub}
                  </Text>
                  <IconButton
                    aria-label="Copy user ID"
                    icon={<MdContentCopy />}
                    size="xs"
                    variant="ghost"
                    onClick={() => copyToClipboard(userInfo.sub || '', 'User ID')}
                  />
                </HStack>
              </VStack>
            </HStack>
          </Box>

          {/* Actions - Desktop */}
          <HStack spacing={6} justify="space-between">
            <VStack align="start" spacing={3}>
              <Heading size="md" color={textColor} fontWeight="600">
                quản lý dữ liệu
              </Heading>
              <HStack spacing={4} mb={2}>
                <Button
                  leftIcon={<MdRefresh />}
                  onClick={handleSyncData}
                  isLoading={isSyncing}
                  loadingText="đang đồng bộ..."
                  colorScheme="blue"
                  variant="outline"
                  size="md"
                  fontWeight="500"
                >
                  đồng bộ
                </Button>

                <Button
                  leftIcon={<MdDownload />}
                  onClick={handleExportData}
                  colorScheme="green"
                  variant="outline"
                  size="md"
                  fontWeight="500"
                >
                  xuất dữ liệu
                </Button>
                <Button
                  leftIcon={<MdLogout />}
                  onClick={onLogoutOpen}
                  colorScheme="orange"
                  variant="outline"
                  size="md"
                  fontWeight="500"
                >
                  đăng xuất
                </Button>

                <Button
                  leftIcon={<MdDelete />}
                  onClick={onDeleteOpen}
                  colorScheme="red"
                  variant="outline"
                  size="md"
                  fontWeight="500"
                >
                  xóa dữ liệu
                </Button>
                {isAuthenticated && (
                  <Button
                    leftIcon={<MdDelete />}
                    colorScheme="red"
                    variant="outline"
                    onClick={onDeleteDriveBackupOpen}
                  >
                    xóa bản sao lưu trên drive
                  </Button>
                )}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default ProfileSettingsTab;
