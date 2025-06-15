import React, { memo } from 'react';
import {
  Box,
  VStack,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useColorMode
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_Z_INDEX, NAV_COLORS, SIDEBAR_TOP_ITEMS, SIDEBAR_BOTTOM_ITEMS } from './NavConstants';

interface SidebarNavProps {
  activeColor?: string;
  textColor?: string;
  onSearchOpen?: () => void;
}

export interface MenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
  isAction?: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = memo(({
  activeColor = '#00d4ff',
  textColor,
  onSearchOpen
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();

  // Dynamic colors based on theme using NAV_COLORS
  const isDark = colorMode === 'dark';
  const bgColor = isDark ? NAV_COLORS.solidBg.dark : NAV_COLORS.solidBg.light;
  const defaultTextColor = isDark ? NAV_COLORS.textColor.dark : NAV_COLORS.textColor.light;

  // Button colors exactly matching the design in the image
  const buttonBg = isDark ? '#2a2a2a' : '#f0f0f0';
  const buttonHoverBg = isDark ? '#3a3a3a' : '#e0e0e0';
  const activeBg = isDark ? '#404040' : '#d0d0d0';
  const buttonTextColor = isDark ? '#ffffff' : '#000000';

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.isAction && item.name === 'search' && onSearchOpen) {
      onSearchOpen();
    } else {
      handleNavigation(item.path);
    }
  };

  return (
    <Box
      as="nav"
      role="navigation"
      aria-label="Main navigation"
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      minWidth="80px"
      bg={bgColor}
      zIndex={NAV_Z_INDEX - 1}
      display={{ base: 'none', lg: 'flex' }}
      flexDirection="column"
      alignItems="center"
      py={4}
    >
      {/* Logo/Brand area */}
      <Box mb={4} mt={3}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={buttonTextColor}
          textAlign="center"
        >
          seikowo
        </Text>
      </Box>

      {/* Top Navigation items */}
      <VStack spacing={2} align="center" as="ul" role="list">
        {SIDEBAR_TOP_ITEMS.map((item) => (
            <VStack
              as="li"
              key={item.path}
              spacing={1}
              cursor="pointer"
              onClick={() => handleItemClick(item)}
              transition="all 0.15s ease"
              minW="68px"
              py={3}
              px={3}
              borderRadius="lg"
              bg={isActive(item.path) ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)') : 'transparent'}
              _hover={{
                bg: isActive(item.path)
                  ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')
                  : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
              }}
              _active={{
                transform: 'scale(0.95)',
                bg: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'
              }}
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${item.name}`}
              aria-current={isActive(item.path) ? 'page' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="20px"
                minH="20px"
                color={isActive(item.path) ? '#00d4ff' : buttonTextColor}
                fontSize={{ base: "18px", lg: "16px" }}
                opacity={isActive(item.path) ? 1 : 0.7}
              >
                {item.icon}
              </Box>
              <Text
                fontSize="10px"
                color={isActive(item.path) ? '#00d4ff' : buttonTextColor}
                textAlign="center"
                fontWeight="normal"
                textTransform="lowercase"
                lineHeight="1"
                whiteSpace="nowrap"

                opacity={isActive(item.path) ? 1 : 0.8}
              >
                {item.name}
              </Text>
            </VStack>
        ))}
      </VStack>

      {/* Spacer to push bottom items down */}
      <Box flex={1} />

      {/* Bottom Navigation items */}
      <VStack spacing={2} align="center" mb={2} as="ul" role="list">
        {SIDEBAR_BOTTOM_ITEMS.map((item) => (
            <VStack
              as="li"
              key={item.path}
              spacing={1}
              cursor="pointer"
              onClick={() => handleItemClick(item)}
              transition="all 0.15s ease"
              minW="68px"
              py={3}
              px={3}
              borderRadius="lg"
              bg={isActive(item.path) ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)') : 'transparent'}
              _hover={{
                bg: isActive(item.path)
                  ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')
                  : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
              }}
              _active={{
                transform: 'scale(0.95)',
                bg: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'
              }}
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${item.name}`}
              aria-current={isActive(item.path) ? 'page' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="20px"
                minH="20px"
                color={isActive(item.path) ? '#00d4ff' : buttonTextColor}
                fontSize={{ base: "18px", lg: "16px" }}
                opacity={isActive(item.path) ? 1 : 0.7}
              >
                {item.icon}
              </Box>
              <Text
                fontSize="10px"
                color={isActive(item.path) ? '#00d4ff' : buttonTextColor}
                textAlign="center"
                fontWeight="normal"
                textTransform="lowercase"
                lineHeight="1"
                whiteSpace="nowrap"

                opacity={isActive(item.path) ? 1 : 0.8}
              >
                {item.name}
              </Text>
            </VStack>
        ))}
      </VStack>
    </Box>
  );
});

SidebarNav.displayName = 'SidebarNav';

export default SidebarNav;
