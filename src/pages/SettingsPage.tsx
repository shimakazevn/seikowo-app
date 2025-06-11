import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  useBreakpointValue,
  Button,
  Stack,
  Heading,
  Badge,
  Card,
  CardBody,
  Avatar,
  SimpleGrid,
  Input,
  FormControl,
  FormLabel,
  Divider,
  useToast,
  useDisclosure,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  FiSettings,
  FiUser,
  FiFileText,
  FiEye,
  FiTool,
  FiArrowLeft,
  FiChevronRight
} from 'react-icons/fi';
import {
  MdVerified,
  MdBookmark,
  MdFavorite,
  MdHistory,
  MdLogout,
  MdDownload,
  MdDelete,
  MdRefresh
} from 'react-icons/md';
// import { useAuthContext } from '../contexts/AuthContext'; // REMOVED - causing useAuth spam
import useUserStore from '../store/useUserStore';
import { adminConfig } from '../config';

// Import settings components
import ProfileSettingsTab from '../components/Settings/Profile/ProfileSettingsTab';
import PostsSettings from './settings/PostsSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import AccessibilitySettings from './settings/AccessibilitySettings';
import AdvancedSettings from './settings/AdvancedSettings';

// Profile Settings Wrapper Component
const ProfileSettings = () => {
  // Use store directly to avoid useAuth hook spam
  const { isAuthenticated, user, logout } = useUserStore();

  // Debug authentication state (commented out to prevent loops)
  // console.log('ProfileSettings Debug:', {
  //   isAuthenticated,
  //   user,
  //   userExists: !!user,
  //   userEmail: user?.email
  // });
  const [isSyncing, setIsSyncing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoadAttempts, setAvatarLoadAttempts] = useState(0);

  const MAX_AVATAR_LOAD_ATTEMPTS = 3;

  // Modal states
  const { isOpen: isLogoutOpen, onOpen: onLogoutOpen, onClose: onLogoutClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Avatar handling
  const handleAvatarError = () => {
    if (avatarLoadAttempts < MAX_AVATAR_LOAD_ATTEMPTS) {
      setAvatarLoadAttempts(prev => prev + 1);
      const timestamp = Date.now();
      setAvatarUrl(`${user?.picture}?t=${timestamp}`);
    } else {
      setAvatarUrl('');
    }
  };

  // Data management functions
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'đồng bộ thành công',
        description: 'dữ liệu đã được đồng bộ hóa.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'lỗi đồng bộ',
        description: 'không thể đồng bộ dữ liệu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      user: user,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'xuất dữ liệu thành công',
      description: 'dữ liệu đã được tải xuống.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      onLogoutClose();
      toast({
        title: 'Đăng xuất thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi đăng xuất',
        description: 'Có lỗi xảy ra khi đăng xuất',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle delete data
  const handleDeleteData = async () => {
    try {
      // Clear local storage
      localStorage.clear();

      // Clear session storage
      sessionStorage.clear();

      // Clear IndexedDB (simplified)
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve(undefined);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      }

      onDeleteClose();
      toast({
        title: 'Xóa dữ liệu thành công',
        description: 'Tất cả dữ liệu đã được xóa khỏi thiết bị',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Logout after deleting data
      await logout();
    } catch (error) {
      toast({
        title: 'Lỗi xóa dữ liệu',
        description: 'Có lỗi xảy ra khi xóa dữ liệu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Initialize avatar and stats
  useEffect(() => {
    if (user?.picture && !avatarUrl) {
      setAvatarUrl(user.picture);
    }
  }, [user?.picture]); // Remove avatarUrl from dependencies to prevent infinite loop



  return (
    <>
      <ProfileSettingsTab
        isAuthenticated={isAuthenticated}
        userInfo={user}
        avatarUrl={avatarUrl}
        handleAvatarError={handleAvatarError}
        isSyncing={isSyncing}
        handleSyncData={handleSyncData}
        handleExportData={handleExportData}
        onLogoutOpen={onLogoutOpen}
        onDeleteOpen={onDeleteOpen}
      />

      {/* Logout Modal */}
      <Modal isOpen={isLogoutOpen} onClose={onLogoutClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận đăng xuất</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="info" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Đăng xuất khỏi tài khoản</AlertTitle>
                <AlertDescription>
                  Bạn có chắc chắn muốn đăng xuất? Dữ liệu của bạn sẽ được giữ nguyên.
                </AlertDescription>
              </Box>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLogoutClose}>
              Hủy
            </Button>
            <Button colorScheme="orange" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Data Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận xóa dữ liệu</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Cảnh báo!</AlertTitle>
                <AlertDescription>
                  Hành động này sẽ xóa toàn bộ dữ liệu của bạn khỏi thiết bị này.
                  Hành động này không thể hoàn tác.
                </AlertDescription>
              </Box>
            </Alert>
            <Text>Bạn có chắc chắn muốn tiếp tục?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Hủy
            </Button>
            <Button colorScheme="red" onClick={handleDeleteData}>
              Xóa dữ liệu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

interface SettingsTab {
  id: string;
  label: string;
  icon: any;
  description: string;
  adminOnly?: boolean;
  color: string;
  component: React.ComponentType;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'profile',
    label: 'tài khoản',
    icon: FiUser,
    description: 'cài đặt tài khoản',
    color: '#3b82f6',
    component: ProfileSettings
  },
  {
    id: 'posts',
    label: 'bài viết',
    icon: FiFileText,
    description: 'quản lý bài viết',
    adminOnly: true,
    color: '#f59e0b',
    component: PostsSettings
  },
  {
    id: 'appearance',
    label: 'giao diện',
    icon: FiSettings,
    description: 'tùy chỉnh giao diện',
    color: '#8b5cf6',
    component: AppearanceSettings
  },
  {
    id: 'accessibility',
    label: 'khả năng tiếp cận',
    icon: FiEye,
    description: 'cài đặt khả năng tiếp cận',
    color: '#10b981',
    component: AccessibilitySettings
  },
  {
    id: 'advanced',
    label: 'nâng cao',
    icon: FiTool,
    description: 'cài đặt nâng cao',
    color: '#64748b',
    component: AdvancedSettings
  }
];

const SettingsPage = () => {
  // Use store directly to avoid useAuth hook spam
  const { isAuthenticated, user } = useUserStore();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Simple internal state - no URL sync
  const [activeTab, setActiveTab] = useState('profile');

  // Refs for sticky sidebar
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enhanced sticky sidebar - avoid fixed position issues
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      const sidebar = sidebarRef.current;
      const sidebar_content = contentRef.current;

      if (!sidebar || !sidebar_content) {
        return;
      }

      const scrollTop = window.scrollY;
      const contentHeight = sidebar_content.getBoundingClientRect().height;
      const sidebarHeight = sidebar.getBoundingClientRect().height;

      // Only apply transform if content is much taller than sidebar
      if (contentHeight > sidebarHeight + 200) {
        const maxTranslate = contentHeight - sidebarHeight - 160; // Account for padding
        const translateY = Math.min(Math.max(0, scrollTop - 80), maxTranslate);

        sidebar.style.transform = `translateY(${translateY}px)`;
        sidebar.style.transition = 'transform 0.1s ease-out';
      } else {
        sidebar.style.transform = "";
        sidebar.style.transition = "";
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);



  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Check if user is admin
  const isAdmin = React.useMemo(() => {
    if (!isAuthenticated || !user?.email) return false;
    return adminConfig.adminEmails.includes(user.email);
  }, [isAuthenticated, user?.email]);

  // Get available tabs
  const availableTabs = React.useMemo(() =>
    SETTINGS_TABS.filter(tab => !tab.adminOnly || isAdmin),
    [isAdmin]
  );

  // Get current tab
  const currentTab = React.useMemo(() =>
    availableTabs.find(tab => tab.id === activeTab) || availableTabs[0],
    [availableTabs, activeTab]
  );

  // Handle tab change - simple internal state
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Handle back to settings list (mobile only)
  const handleBackToList = () => {
    setActiveTab('');
  };

  // Mobile: Show settings list when no tab selected
  if (isMobile && !activeTab) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" color={textColor} mb={2}>
              cài đặt
            </Heading>
            <Text color={mutedTextColor} fontSize="md">
              quản lý tài khoản và tùy chỉnh ứng dụng
            </Text>
          </Box>

          {/* Settings List */}
          <VStack spacing={3} align="stretch">
            {availableTabs.map(tab => (
              <Card
                key={tab.id}
                variant="outline"
                cursor="pointer"
                onClick={() => handleTabChange(tab.id)}
                _hover={{
                  bg: hoverBg,
                  transform: 'translateY(-2px)',
                  boxShadow: 'md'
                }}
                transition="all 0.2s ease"
              >
                <CardBody py={4}>
                  <HStack spacing={4} justify="space-between">
                    <HStack spacing={4}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={`${tab.color}15`}
                      >
                        <Icon as={tab.icon} color={tab.color} w={5} h={5} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="md" color={textColor}>
                            {tab.label}
                          </Text>
                          {tab.adminOnly && isAdmin && (
                            <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                              Admin
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {tab.description}
                        </Text>
                      </VStack>
                    </HStack>
                    <Icon as={FiChevronRight} color={mutedTextColor} w={4} h={4} />
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>
      </Container>
    );
  }

  // Mobile: Show individual tab content
  if (isMobile && activeTab) {
    const TabComponent = currentTab.component;

    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={6} align="stretch">
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={handleBackToList}
              size="sm"
            >
              cài đặt
            </Button>
          </HStack>

          <Box>
            <HStack spacing={3} mb={2}>
              <Icon as={currentTab.icon} color={currentTab.color} w={6} h={6} />
              <Heading size="lg" color={textColor}>
                {currentTab.label}
                {currentTab.adminOnly && isAdmin && (
                  <Badge ml={2} colorScheme="orange" variant="subtle">
                    Admin
                  </Badge>
                )}
              </Heading>
            </HStack>
            <Text color={mutedTextColor} fontSize="md">
              {currentTab.description}
            </Text>
          </Box>

          <Box>
            <TabComponent />
          </Box>
        </VStack>
      </Container>
    );
  }

  // Desktop: Show sidebar + content layout
  const TabComponent = currentTab.component;

  return (
    <Container maxW="container.xl" pb={6}>
      <Box display="flex" gap={4} >
        {/* Sidebar */}
        <Box
          ref={sidebarRef}
          width="270px"
          flexShrink={0}
          position="sticky"
          top={0}
          mt={"35vh"}
          height={"max-content"}
          alignSelf="flex-start"
        >
          <VStack align="stretch" spacing={3}>
            {availableTabs.map(tab => (
              <Button
                key={tab.id}
                variant="ghost"
                justifyContent="flex-start"
                leftIcon={<Icon as={tab.icon} color={activeTab === tab.id ? tab.color : mutedTextColor} w={5} h={5} />}
                color={activeTab === tab.id ? tab.color : textColor}
                bg={activeTab === tab.id ? `${tab.color}15` : 'transparent'}
                _hover={{
                  bg: activeTab === tab.id ? `${tab.color}25` : hoverBg,
                  transform: 'translateX(4px)'
                }}
                onClick={() => handleTabChange(tab.id)}
                transition="all 0.2s ease"
                size="lg"
                fontWeight="medium"
                borderRadius="md"
                h="auto"
                py={3}
                px={4}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold" fontSize="md">{tab.label}</Text>
                  <Text fontSize="sm" color={mutedTextColor}>
                    {tab.description}
                  </Text>
                </VStack>
              </Button>
            ))}
          </VStack>
        </Box>

        {/* Content */}
        <Box ref={contentRef} flex={1} py={8}>
          <Heading size="lg" mb={2} color={textColor}>
            {currentTab.label}
            {currentTab.adminOnly && isAdmin && (
              <Badge ml={2} colorScheme="orange" variant="subtle">
                Admin
              </Badge>
            )}
          </Heading>
          <Text color="gray.500" mb={6}>
            {currentTab.description}
          </Text>
          <Box>
            <TabComponent />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default SettingsPage;
