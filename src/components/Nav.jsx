import React, { memo, useCallback } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const { openSearch } = useSearchStore();
  
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  const menuItems = React.useMemo(() => [
    { name: 'Trang chủ', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ], []);

  const isActive = useCallback((path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleToggleColorMode = useCallback(() => {
    toggleColorMode();
  }, [toggleColorMode]);

  const handleOpenSearch = useCallback(() => {
    openSearch();
  }, [openSearch]);

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
      WebkitBackdropFilter="blur(10px)"
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

        <Flex 
          flex={{ base: 1 }} 
          justify={{ base: 'center', md: 'start' }}
          align="center"
          minW={0}
          position="relative"
        >
          <Box
            textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
            fontFamily={'heading'}
            color={useColorModeValue('gray.800', 'white')}
            fontWeight="bold"
            fontSize={{ base: 'md', md: 'xl' }}
            minW={0}
            flex="0 1 auto"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            position={{ base: 'absolute', md: 'relative' }}
            left={{ base: '55%', md: 0 }}
            transform={{ base: 'translateX(-50%)', md: 'none' }}
            ml={0}
          >
            <RouterLink to="/">Seikowo Team</RouterLink>
          </Box>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10} align="center" minW={0}>
            <DesktopNav 
              menuItems={menuItems}
              isActive={isActive}
              hoverBg={hoverBg}
              activeColor={activeColor}
              textColor={textColor}
            />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: '0 0 auto' }}
          justify={'flex-end'}
          direction={'row'}
          spacing={2}
          align="center"
          h="100%"
        >
          <IconButton
            size="sm"
            aria-label="Search"
            icon={<SearchIcon />}
            variant="ghost"
            onClick={handleOpenSearch}
            display="flex"
            alignItems="center"
          />
          <IconButton
            size="sm"
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={handleToggleColorMode}
            variant="ghost"
            display="flex"
            alignItems="center"
          />
        </Stack>
      </Flex>

      <MobileNav menuItems={menuItems} isOpen={isOpen} />
      <SearchModal />
    </Box>
  );
};

export default memo(Nav); 