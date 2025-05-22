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

const MotionIconButton = motion(IconButton);

// Memoize NavLink component with forwardRef
const NavLink = memo(React.forwardRef(({ to, children, isMobile = false, isActive, hoverBg, activeColor, textColor, ...props }, ref) => (
  <Link
    ref={ref}
    as={RouterLink}
    to={to}
    px={3}
    py={2}
    rounded="md"
    _hover={{
      textDecoration: 'none',
      bg: hoverBg,
    }}
    bg={isActive(to) ? hoverBg : 'transparent'}
    color={isActive(to) ? activeColor : textColor}
    w={isMobile ? "full" : "auto"}
    textAlign={isMobile ? "left" : "center"}
    fontSize="sm"
    fontWeight="medium"
    {...props}
  >
    {children}
  </Link>
)));

NavLink.displayName = 'NavLink';

const DesktopSubNav = memo(({ name, path }) => {
  return (
    <Link
      href={path}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}
    >
      <Stack direction={'row'} align={'center'} style={{ background: 'transparent' }}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'pink.400' }}
            fontWeight={500}
          >
            {name}
          </Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
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
const DesktopNav = memo(({ menuItems, isActive, hoverBg, activeColor, textColor }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4} style={{ background: 'transparent' }}>
      {menuItems.map((navItem) => (
        <Box key={navItem.path}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                as={RouterLink}
                to={navItem.path}
                p={2}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
              >
                {navItem.name}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack style={{ background: 'transparent' }}>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.name} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
});

DesktopNav.displayName = 'DesktopNav';

// Memoize MobileNavItem component
const MobileNavItem = memo(({ name, children, path }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box 
      onClick={children && onToggle}
      style={{ background: 'transparent' }}
      width="100%"
    >
      <Flex
        py={2}
        as={Link}
        href={path ?? '#'}
        justify={'space-between'}
        align={'center'}
        style={{ background: 'transparent' }}
        width="100%"
      >
        <Box flex="1" minW={0}>
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}
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
        >
          {children &&
            children.map((child) => (
              <Link 
                key={child.name} 
                py={2} 
                href={child.path}
                style={{ background: 'transparent' }}
                display="block"
                width="100%"
              >
                <Text noOfLines={1}>
                  {child.name}
                </Text>
              </Link>
            ))}
        </VStack>
      </Collapse>
    </Box>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

// Memoize MobileNav component
const MobileNav = memo(({ menuItems, isOpen }) => {
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
            <MobileNavItem key={navItem.path} {...navItem} />
          ))}
        </VStack>
      </Box>
    </Collapse>
  );
});

MobileNav.displayName = 'MobileNav';

const Nav = () => {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { openSearch } = useSearchStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('guest');
  const [accessToken, setAccessToken] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const textColor = useColorModeValue('gray.600', 'gray.200');

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

  const menuItems = React.useMemo(() => [
    { name: 'Trang chủ', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Lịch sử', path: `/u/${userId}` },
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
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      backdropFilter="blur(10px)"
      webkitbackdropfilter="blur(10px)"
    >
      <Flex
        bg="transparent"
        color={useColorModeValue('gray.600', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 2, md: 4 }}
        align={'center'}
        maxW="100%"
      >
        <Flex
          flex={{ base: 'initial', md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}
          align="center"
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

        <Flex flex={1} justify="center" align="center" minW={0} position="relative">
          <NavMenuDesktop
            menuItems={menuItems}
            isActive={isActive}
            hoverBg={hoverBg}
            activeColor={activeColor}
            textColor={textColor}
          />
        </Flex>

        <Box flex="0 0 auto">
          <NavActions
            colorMode={colorMode}
            handleToggleColorMode={handleToggleColorMode}
            handleOpenSearch={handleOpenSearch}
            accessToken={accessToken}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </Box>
      </Flex>

      <NavMenuMobile menuItems={menuItems} isOpen={isOpen} />
      <SearchModal />
    </Box>
  );
};

export default memo(Nav); 