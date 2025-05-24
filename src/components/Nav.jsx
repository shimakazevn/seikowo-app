import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useColorMode,
  useColorModeValue,
  Link,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useBreakpointValue,
  useToast,
  Badge,
  Avatar,
  Divider,
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
  AlertDescription,
  Heading,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HamburgerIcon, 
  MoonIcon, 
  SunIcon, 
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
  ChevronRightIcon,
  TimeIcon,
  StarIcon,
  DownloadIcon,
  DeleteIcon,
} from '@chakra-ui/icons';
import { 
  FaHeart, 
  FaUser, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaUserCircle, 
  FaHistory, 
  FaBookmark,
  FaEnvelope,
  FaInfoCircle,
  FaCog
} from 'react-icons/fa';
import SearchModal from './Search/SearchModal';
import useSearchStore from '../store/useSearchStore';
import NavLogo from './Nav/NavLogo';
import NavActions from './Nav/NavActions';
import NavMenuDesktop from './Nav/NavMenuDesktop';
import NavMenuMobile from './Nav/NavMenuMobile';
import { backupUserData } from '../api/auth';
import { deleteUserData } from '../api/auth';
import { 
  FOLLOW_KEY,
  MANGA_KEY,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  setStoredTokens,
  removeStoredTokens
} from '../utils/userUtils';
import NavLink from './Nav/NavLink';
import useUserStore from '../store/useUserStore';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { LoginButton, GoogleAuthEvents } from './GoogleDriveLogin';
import { handleError } from '../api';
import SettingsModal from './Modals/SettingsModal';
import { getHistoryData, saveHistoryData } from '../utils/indexedDBUtils';

const DesktopSubNav = memo(({ name, path }) => {
  return (
    <Link
      href={path}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{
        color: useColorModeValue('blue.600', 'blue.300'),
        textDecoration: 'none',
      }}
    >
      <Stack direction={'row'} align={'center'} style={{ background: 'transparent' }}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{}}
            fontWeight={500}
          >
            {name}
          </Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{}}
          justify={'flex-end'}
          align={'center'}
          flex={1}
        >
          <Icon color={'pink.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
});

DesktopSubNav.displayName = 'DesktopSubNav';

// Memoize DesktopNav component
const DesktopNav = memo(({ menuItems, isActive, activeColor, textColor, hoverColor }) => {
  return (
    <Stack direction={'row'} spacing={4} style={{ background: 'transparent' }}>
      {menuItems.map((navItem) => (
        <NavLink
          key={navItem.path}
          to={navItem.path}
          isActive={isActive}
          activeColor={activeColor}
          textColor={textColor}
          hoverColor={hoverColor}
        >
          {navItem.name}
        </NavLink>
      ))}
    </Stack>
  );
});

DesktopNav.displayName = 'DesktopNav';

// Memoize MobileNavItem component
const MobileNavItem = memo(({ name, children, path, isActive }) => {
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const isItemActive = isActive ? isActive(path) : location.pathname === path;

  return (
    <Box 
      onClick={children && onToggle}
      style={{ background: 'transparent' }}
      width="100%"
    >
      <Flex
        py={2}
        as={RouterLink}
        to={path ?? '#'}
        justify={'space-between'}
        align={'center'}
        style={{ background: 'transparent' }}
        width="100%"
        color={isItemActive ? useColorModeValue('blue.600', 'blue.200') : useColorModeValue('gray.600', 'gray.200')}
        fontWeight={isItemActive ? 600 : 500}
      >
        <Box flex="1" minW={0}>
          <Text
            fontWeight={isItemActive ? 600 : 500}
            noOfLines={1}
          >
            {name}
          </Text>
        </Box>
        {children && (
          <Box ml={2}>
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          </Box>
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important', background: 'transparent' }}>
        <VStack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align="stretch"
          spacing={2}
          style={{ background: 'transparent' }}
          width="100%"
          borderRadius="md"
          p={2}
        >
          {children &&
            children.map((child) => (
              <RouterLink 
                key={child.name} 
                to={child.path}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  color: location.pathname === child.path 
                    ? useColorModeValue('blue.600', 'blue.200')
                    : useColorModeValue('gray.600', 'gray.200'),
                  fontWeight: location.pathname === child.path ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <Text noOfLines={1}>
                  {child.name}
                </Text>
              </RouterLink>
            ))}
        </VStack>
      </Collapse>
    </Box>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

// Memoize MobileNav component
const MobileNav = memo(({ menuItems, isOpen, isActive, activeColor, textColor, hoverColor, onNavigate }) => {
  return (
    <Collapse in={isOpen} animateOpacity>
      <Box
        style={{ background: 'transparent' }}
        p={4}
        display={{ md: 'none' }}
        maxW="100vw"
        overflowX="hidden"
      >
        <VStack
          spacing={4}
          align="stretch"
          width="100%"
          style={{ background: 'transparent' }}
        >
          {menuItems.map((navItem) => (
            <MobileNavItem
              key={navItem.path}
              {...navItem}
              isActive={isActive}
              activeColor={activeColor}
              textColor={textColor}
              hoverColor={hoverColor}
              onNavigate={onNavigate}
            />
          ))}
        </VStack>
      </Box>
    </Collapse>
  );
});

MobileNav.displayName = 'MobileNav';

const Nav = () => {
  // All hooks at the top
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { openSearch } = useSearchStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, accessToken, isGuest, setUser, setGuest } = useUserStore();
  const [atTop, setAtTop] = useState(true);
  const [updatedFollowCount, setUpdatedFollowCount] = useState(0);
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const [restoring, setRestoring] = useState(false);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

  // Color mode values (moved all useColorModeValue here)
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const hoverColor = useColorModeValue('blue.800', 'blue.200');
  const transparentBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const gray600 = useColorModeValue('gray.600', 'gray.200');
  const blue600 = useColorModeValue('blue.600', 'blue.200');
  const gray200 = useColorModeValue('gray.200', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');

  // Callbacks
  const handleToggleColorMode = useCallback(() => {
    toggleColorMode();
  }, [toggleColorMode]);

  const handleOpenSearch = useCallback(() => {
    openSearch();
  }, [openSearch]);

  const handleLogin = useCallback(async (token) => {
    try {
      // Lưu token ngay lập tức
      setStoredTokens(token);

      // Lấy thông tin user từ token
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await response.json();
      
      // Lưu user info
      setUserInfo({
        sub: userInfo.sub,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email: userInfo.email,
        email_verified: userInfo.email_verified
      });

      // Cập nhật state
      setUser(userInfo.sub, token);

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${userInfo.name}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Lỗi đăng nhập",
        description: "Không thể lấy thông tin người dùng",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      // Clean up on error
      removeStoredTokens();
      removeUserInfo();
      setGuest();
    }
  }, [setUser, setGuest, toast]);

  const handleLogout = useCallback(() => {
    removeStoredTokens();
    removeUserInfo();
    setGuest();
  }, [setGuest]);

  const handleHistory = useCallback(() => {
    navigate('/bookmarks');
  }, [navigate]);

  const handleProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleViewMore = useCallback(() => {
    navigate('/favorite');
  }, [navigate]);

  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const isActive = useCallback((path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Memoized values
  const menuItems = useMemo(() => [
  ], []);

  // Google login hook
  const login = useGoogleLogin({
    onSuccess: (response) => {
      if (response.access_token) {
        handleLogin(response.access_token);
      }
    },
    flow: 'implicit',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: window.location.origin,
    popup: true,
    popup_width: 500,
    popup_height: 600,
    popup_position: 'center',
    popup_type: 'window',
    popup_features: 'width=500,height=600,left=0,top=0,resizable=yes,scrollbars=yes,status=yes'
  });

  // Effects
  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const cleanup = useUserStore.getState().initialize();
    return cleanup;
  }, []);

  useEffect(() => {
    const urlUserId = location.pathname.match(/^\/u\/([^/]+)/)?.[1];
    
    if (urlUserId) {
      if (isGuest && urlUserId !== 'guest') {
        navigate('/u/guest');
      } else if (!isGuest && urlUserId !== userId) {
        navigate(`/u/${userId}`);
      }
    }
  }, [location.pathname, navigate, userId, isGuest]);

  useEffect(() => {
    if (!isGuest && accessToken) {
      const checkUpdatedFollows = () => {
        const userInfo = getUserInfo();
        const userId = userInfo?.sub || 'guest';
        const followedData = getHistoryData(FOLLOW_KEY, userId);
        if (followedData && Array.isArray(followedData)) {
          const updatedCount = followedData.filter(post => {
            if (!post.updated || !post.published) return false;
            const updated = new Date(post.updated);
            const published = new Date(post.published);
            return updated > published;
          }).length;
          setUpdatedFollowCount(updatedCount);
        }
      };

      checkUpdatedFollows();
      const interval = setInterval(checkUpdatedFollows, 60000);
      return () => clearInterval(interval);
    }
  }, [isGuest, accessToken]);

  const syncWithDrive = useCallback(async () => {
    if (!accessToken || !userId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setRestoring(true);
      await backupUserData(accessToken);
      toast({
        title: "Thành công",
        description: "Đã sao lưu dữ liệu lên Google Drive",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      handleError(error, toast);
    } finally {
      setRestoring(false);
    }
  }, [accessToken, userId, toast]);

  const handleClearAllData = useCallback(async () => {
    if (!accessToken || !userId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setRestoring(true);
      await deleteUserData(accessToken);
      const userInfo = getUserInfo();
      const currentUserId = userInfo?.sub || 'guest';
      await saveHistoryData(FOLLOW_KEY, currentUserId, []);
      await saveHistoryData(MANGA_KEY, currentUserId, []);
      toast({
        title: "Thành công",
        description: "Đã xóa toàn bộ dữ liệu",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onConfirmClose();
    } catch (error) {
      handleError(error, toast);
    } finally {
      setRestoring(false);
    }
  }, [accessToken, userId, toast, onConfirmClose]);

  return (
    <>
      <Box
        position="sticky"
        top={0}
        zIndex={1000}
        bg={atTop ? 'transparent' : transparentBg}
        borderBottom={atTop ? 'none' : 1}
        borderStyle={atTop ? 'none' : 'solid'}
        borderColor={atTop ? 'transparent' : borderColor}
        backdropFilter={atTop ? 'none' : 'blur(12px)'}
        webkitbackdropfilter={atTop ? 'none' : 'blur(12px)'}
        transition="all 0.3s ease"
      >
        <Flex
          bg="transparent"
          color={gray600}
          minH={'60px'}
          py={{ base: 2 }}
          px={{ base: 2, md: 4 }}
          align={'center'}
          maxW="100%"
          position="relative"
        >
          <Box flex="0 0 auto" minW="120px">
            <NavLogo />
          </Box>

          <Flex
            flex={1}
            align="center"
            minW={0}
            position="relative"
          >
            <Box
              display={{ base: 'none', md: 'block' }}
              position="absolute"
              left={0}
              right={0}
              mx="auto"
              width="fit-content"
            >
              <DesktopNav
                menuItems={menuItems}
                isActive={isActive}
                activeColor={activeColor}
                textColor={textColor}
                hoverColor={hoverColor}
              />
            </Box>
          </Flex>

          <HStack spacing={2} ml="auto">
            <IconButton
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={handleToggleColorMode}
              variant="ghost"
              size="sm"
              aria-label="Toggle color mode"
            />
            <IconButton
              icon={<SearchIcon />}
              onClick={handleOpenSearch}
              variant="ghost"
              size="sm"
              aria-label="Search"
            />
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaUser />}
                variant="ghost"
                size="sm"
                aria-label="User menu"
              />
              <MenuList>
                {isGuest ? (
                  <MenuItem icon={<FaSignInAlt />} onClick={() => login()}>
                    Đăng nhập
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem icon={<FaUserCircle />} onClick={handleProfile}>
                      Hồ sơ
                    </MenuItem>
                    <MenuItem icon={<FaHistory />} onClick={handleHistory}>
                      Bookmark
                    </MenuItem>
                    <MenuItem icon={<FaBookmark />} onClick={handleViewMore}>
                      <HStack spacing={2}>
                        <span>Yêu thích</span>
                        {updatedFollowCount > 0 && (
                          <Badge
                            colorScheme="red"
                            borderRadius="full"
                            px={2}
                            py={0.5}
                            fontSize="0.75em"
                            fontWeight="bold"
                            lineHeight={1}
                          >
                            {updatedFollowCount}
                          </Badge>
                        )}
                      </HStack>
                    </MenuItem>
                    <MenuItem icon={<FaCog />} onClick={onSettingsOpen}>
                      Cài đặt
                    </MenuItem>
                  </>
                )}
                <Divider />
                <MenuItem as={RouterLink} to="/about" icon={<FaInfoCircle />}>
                  About
                </MenuItem>
                <MenuItem as={RouterLink} to="/contact" icon={<FaEnvelope />}>
                  Contact
                </MenuItem>
                {!isGuest && (
                  <>
                    <Divider />
                    <MenuItem 
                      icon={<FaSignOutAlt />} 
                      onClick={handleLogout}
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      _dark={{ _hover: { bg: 'red.900' } }}
                    >
                      Đăng xuất
                    </MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        <SearchModal />
      </Box>

      <SettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận xóa dữ liệu</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle>Chú ý!</AlertTitle>
                <AlertDescription>
                  Hành động này sẽ xóa toàn bộ dữ liệu bookmark của bạn trên cả Google Drive và máy tính. Hành động này không thể hoàn tác.
                </AlertDescription>
              </Box>
            </Alert>
            <Text>Bạn có chắc chắn muốn tiếp tục?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onConfirmClose}>
              Hủy
            </Button>
            <Button colorScheme="red" onClick={handleClearAllData}>
              Xóa dữ liệu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default memo(Nav); 