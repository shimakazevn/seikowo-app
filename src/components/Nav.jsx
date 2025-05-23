import React, { memo, useCallback, useEffect, useState } from 'react';
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
} from '@chakra-ui/icons';
import SearchModal from './Search/SearchModal';
import useSearchStore from '../store/useSearchStore';
import NavLogo from './Nav/NavLogo';
import NavActions from './Nav/NavActions';
import NavMenuDesktop from './Nav/NavMenuDesktop';
import NavMenuMobile from './Nav/NavMenuMobile';
import { backupUserData } from './GoogleDriveLogin';
import { 
  syncGuestData, 
  getHistoryData,
  READ_KEY,
  FOLLOW_KEY,
  MANGA_KEY
} from '../utils/historyUtils';
import NavLink from './Nav/NavLink';

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
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { openSearch } = useSearchStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('guest');
  const [accessToken, setAccessToken] = useState(null);
  const [atTop, setAtTop] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const hoverColor = useColorModeValue('blue.800', 'blue.200');

  const handleToggleColorMode = useCallback(() => {
    toggleColorMode();
  }, [toggleColorMode]);

  const handleOpenSearch = useCallback(() => {
    openSearch();
  }, [openSearch]);

  // Load user data on mount and token change
  useEffect(() => {
    const loadUserData = () => {
      const token = localStorage.getItem('furina_water');
      const id = localStorage.getItem('google_user_id') || 'guest';
      
      if (token) {
        setAccessToken(token);
        setUserId(id);
        
        // If we're on a user's history page but not logged in as that user,
        // redirect to the current user's history page
        const urlUserId = location.pathname.match(/^\/u\/([^/]+)/)?.[1];
        if (urlUserId && urlUserId !== id && urlUserId !== 'guest') {
          navigate(`/u/${id}`);
        }
      } else {
        // If no token, ensure we're in guest mode
        setAccessToken(null);
        setUserId('guest');
        localStorage.removeItem('google_user_id');
        
        // If we're on a user's history page but not in guest mode,
        // redirect to guest history
        const urlUserId = location.pathname.match(/^\/u\/([^/]+)/)?.[1];
        if (urlUserId && urlUserId !== 'guest') {
          navigate('/u/guest');
        }
      }
    };

    loadUserData();
    
    // Add storage event listener to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'furina_water' || e.key === 'google_user_id') {
        loadUserData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname, navigate]);

  const handleLogin = useCallback(async (token) => {
    try {
      const id = localStorage.getItem('google_user_id');
      
      if (!id) {
        throw new Error('Không thể lấy ID người dùng');
      }

      // Sync guest data when logging in
      const syncResult = await syncGuestData(id);
      
      // Only proceed with login if sync was successful
      if (syncResult.synced) {
        // Show success toast with sync results
        if (syncResult.changes.reads > 0 || syncResult.changes.follows > 0 || syncResult.changes.bookmarks > 0) {
          const details = [];
          
          if (syncResult.changes.reads > 0) {
            details.push(`${syncResult.changes.reads} bài đã đọc`);
          }
          
          if (syncResult.changes.follows > 0) {
            details.push(`${syncResult.changes.follows} bài theo dõi`);
          }
          
          if (syncResult.changes.bookmarks > 0) {
            details.push(`${syncResult.changes.bookmarks} bookmark`);
          }

          toast({
            title: 'Đã đồng bộ dữ liệu từ chế độ khách',
            description: details.join('\n'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        }
        
        // Backup synced data to Drive
        try {
          const currentData = {
            readPosts: getHistoryData(READ_KEY, id),
            followPosts: getHistoryData(FOLLOW_KEY, id),
            mangaBookmarks: getHistoryData(MANGA_KEY, id),
            timestamp: Date.now()
          };
          
          await backupUserData(token, id, currentData);
          
          // Only update state and localStorage after successful backup
          setAccessToken(token);
          setUserId(id);
          localStorage.setItem('furina_water', token);
          
          // Navigate to user's history page
          navigate(`/u/${id}`);
          
          toast({
            title: 'Đã sao lưu dữ liệu lên Drive',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (err) {
          console.error('Error backing up after guest sync:', err);
          toast({
            title: 'Lỗi sao lưu',
            description: 'Không thể sao lưu dữ liệu lên Drive. Vui lòng thử lại sau.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      console.error('Error during login process:', err);
      toast({
        title: 'Lỗi đăng nhập',
        description: err.message || 'Có lỗi xảy ra trong quá trình đăng nhập',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset state on error
      setAccessToken(null);
      setUserId('guest');
      localStorage.removeItem('furina_water');
      localStorage.removeItem('google_user_id');
    }
  }, [toast, navigate]);

  const handleLogout = useCallback(async () => {
    // Backup data before logout if user is logged in
    if (accessToken && userId !== 'guest') {
      try {
        const currentData = {
          readPosts: getHistoryData(READ_KEY, userId),
          followPosts: getHistoryData(FOLLOW_KEY, userId),
          mangaBookmarks: getHistoryData(MANGA_KEY, userId),
          timestamp: Date.now()
        };
        await backupUserData(accessToken, userId, currentData);
      } catch (err) {
        console.error('Auto backup on logout failed:', err);
      }
    }
    
    // Clear state
    setAccessToken(null);
    setUserId('guest');

    // Clear all user data from localStorage
    const keysToRemove = [
      'furina_water',
      'google_user_id',
      `history_read_posts_${userId}`,
      `history_follow_posts_${userId}`,
      `history_manga_bookmarks_${userId}`,
      `last_sync_time`
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Navigate to home page
    navigate('/');
  }, [accessToken, userId, navigate]);

  const handleHistory = useCallback(() => {
    navigate(`/u/${userId}`);
  }, [navigate, userId]);

  const menuItems = React.useMemo(() => [
    { name: 'Trang chủ', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ], [userId]);

  const isActive = useCallback((path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      bg={atTop ? 'transparent' : useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
      borderBottom={atTop ? 'none' : 1}
      borderStyle={atTop ? 'none' : 'solid'}
      borderColor={atTop ? 'transparent' : borderColor}
      backdropFilter={atTop ? 'none' : 'blur(12px)'}
      webkitbackdropfilter={atTop ? 'none' : 'blur(12px)'}
      transition="all 0.3s ease"
    >
      <Flex
        bg="transparent"
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 2, md: 4 }}
        align={'center'}
        maxW="100%"
        position="relative"
      >
        <Flex
          flex={{ base: 'initial', md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
          align="center"
          zIndex={1001}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
            size="sm"
            ml={2}
            mr={1}
          />
        </Flex>

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

        <Box flex="0 0 auto" zIndex={1001}>
          <NavActions
            colorMode={colorMode}
            handleToggleColorMode={handleToggleColorMode}
            handleOpenSearch={handleOpenSearch}
            accessToken={accessToken}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onHistory={handleHistory}
            userId={userId}
          />
        </Box>
      </Flex>

      <Box display={{ base: 'block', md: 'none' }}>
        <MobileNav
          menuItems={menuItems}
          isOpen={isOpen}
          isActive={isActive}
          activeColor={activeColor}
          textColor={textColor}
          hoverColor={hoverColor}
          onNavigate={onClose}
        />
      </Box>
      <SearchModal />
    </Box>
  );
};

export default memo(Nav); 