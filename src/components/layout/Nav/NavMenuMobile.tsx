import React, { memo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Link,
  Text,
  useColorModeValue,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  HStack,
  Divider
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { MenuItem } from '../../types/navigation';

interface NavMenuMobileProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeColor?: string;
  textColor?: string;
}

const NavMenuMobile: React.FC<NavMenuMobileProps> = memo(({
  menuItems,
  isOpen,
  onOpen,
  onClose,
  activeColor = 'blue.500',
  textColor
}) => {
  const location = useLocation();
  const { colorMode } = useColorMode();

  // Dynamic colors based on theme
  const isDark = colorMode === 'dark';
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const borderColor = isDark ? '#333333' : '#e5e5e5';
  const defaultTextColor = isDark ? '#ffffff' : '#000000';
  const finalTextColor = textColor || defaultTextColor;

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        icon={<HamburgerIcon />}
        onClick={onOpen}
        variant="ghost"
        size="sm"
        aria-label="Open menu"
      />

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={bgColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <Text fontSize="lg" fontWeight="bold">
              Menu
            </Text>
          </DrawerHeader>

          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              {menuItems.map((item, index) => (
                <Box key={item.path || index}>
                  <Link
                    as={RouterLink}
                    to={item.path}
                    onClick={onClose}
                    display="block"
                    px={6}
                    py={4}
                    color={isActive(item.path) ? activeColor : finalTextColor}
                    fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                    bg={isActive(item.path) ? '#00d4ff20' : 'transparent'}
                    _hover={{
                      bg: isDark ? '#222222' : '#f8f9fa',
                      color: '#00d4ff',
                      textDecoration: 'none'
                    }}
                    transition="all 0.2s"
                  >
                    <HStack spacing={3}>
                      {item.icon && <Box>{item.icon}</Box>}
                      <Text>{item.name}</Text>
                    </HStack>
                  </Link>
                  {index < menuItems.length - 1 && (
                    <Divider borderColor={borderColor} />
                  )}
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
});

NavMenuMobile.displayName = 'NavMenuMobile';

export default NavMenuMobile;