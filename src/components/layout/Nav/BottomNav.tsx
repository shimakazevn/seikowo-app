import React, { memo } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
  useColorModeValue,
  useColorMode
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MenuItem } from '../../types/navigation';
import { BOTTOM_NAV_HEIGHT, NAV_Z_INDEX, NAV_COLORS } from './NavConstants';

interface BottomNavProps {
  menuItems: MenuItem[];
  activeColor?: string;
  textColor?: string;
  onSearchOpen?: () => void;
}

const BottomNav: React.FC<BottomNavProps> = memo(({
  menuItems,
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
  const borderColor = isDark ? NAV_COLORS.borderColor.dark : NAV_COLORS.borderColor.light;
  const defaultTextColor = isDark ? NAV_COLORS.textColor.dark : NAV_COLORS.textColor.light;
  const mutedColor = isDark ? NAV_COLORS.mutedTextColor.dark : NAV_COLORS.mutedTextColor.light;
  const finalTextColor = textColor || defaultTextColor;

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
      aria-label="Mobile navigation"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      height={BOTTOM_NAV_HEIGHT}
      zIndex={NAV_Z_INDEX}
      display={{ base: 'flex', lg: 'none' }}
      alignItems="center"
      px={4}
      pb={2}
      userSelect="none"
    >
      {/* Samsung-style rounded container with blur effect */}
      <Box
        bg={isDark ? 'rgba(26, 26, 26, 0.4)' : 'rgba(255, 255, 255, 0.4)'}
        borderRadius="20px"
        width="100%"
        height="60px"
        display="flex"
        alignItems="center"
        px={3}
        boxShadow={isDark
          ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)'
        }
        border={isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.15)'}
        backdropFilter="blur(30px)"
        sx={{
          WebkitBackdropFilter: 'blur(30px)'
        }}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '20px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%)',
          pointerEvents: 'none'
        }}
      >
        <HStack spacing={0} justify="space-around" width="100%">
          {menuItems.map((item) => (
            <VStack
              key={item.path}
              spacing={1}
              cursor="pointer"
              onClick={() => handleItemClick(item)}
              flex={1}
              align="center"
              py={2}
              px={1}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              borderRadius="20px"
              userSelect="none"
              // Remove ugly mobile touch backgrounds
              sx={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                outline: 'none',
                '&:focus': {
                  outline: 'none',
                  boxShadow: 'none'
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  opacity: 0.8
                }
              }}
            >
              <Box
                color={isActive(item.path) ? activeColor : mutedColor}
                fontSize={{ base: "20px", sm: "18px" }}
                transition="all 0.15s ease"
                opacity={isActive(item.path) ? 1 : 0.7}
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="24px"
              >
                {item.icon}
              </Box>
              <Text
                fontSize="xs"
                color={isActive(item.path) ? activeColor : mutedColor}
                fontWeight={isActive(item.path) ? 'semibold' : 'normal'}
                textAlign="center"
                textTransform="lowercase"
                whiteSpace="nowrap"
                opacity={isActive(item.path) ? 1 : 0.8}
              >
                {item.name}
              </Text>
            </VStack>
          ))}
        </HStack>
      </Box>
    </Box>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
