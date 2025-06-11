import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useColorModeValue, useDisclosure, useColorMode } from '@chakra-ui/react';
// import { useAuthContext } from '../contexts/AuthContext'; // REMOVED - causing useAuth spam
import { useScrollPosition } from './useScrollPosition';
import useUserStore from '../store/useUserStore';
import { MAIN_MENU_ITEMS, NAV_COLORS, SCROLL_THROTTLE } from '../constants/navigation';

export const useNavigation = () => {
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  // Use store directly to avoid useAuth hook spam
  const { isAuthenticated, logout } = useUserStore();
  const { isAtTop } = useScrollPosition({ throttle: SCROLL_THROTTLE });


  // Modals
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onClose: onSettingsClose
  } = useDisclosure();

  const {
    isOpen: isMobileMenuOpen,
    onOpen: onMobileMenuOpen,
    onClose: onMobileMenuClose
  } = useDisclosure();

  // Dynamic colors based on theme
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const borderColor = isDark ? NAV_COLORS.borderColor.dark : NAV_COLORS.borderColor.light;
  const transparentBg = isDark ? NAV_COLORS.transparentBg.dark : NAV_COLORS.transparentBg.light;
  const solidBg = isDark ? NAV_COLORS.solidBg.dark : NAV_COLORS.solidBg.light;
  const textColor = isDark ? NAV_COLORS.textColor.dark : NAV_COLORS.textColor.light;

  // Memoized colors object
  const colors = useMemo(() => ({
    borderColor,
    transparentBg,
    textColor
  }), [borderColor, transparentBg, textColor]);

  // Navigation handlers - memoized for performance
  const handlers = useMemo(() => ({
    handleOpenSearch: () => {
      navigate('/search');
    },

    handleHistory: () => {
      navigate('/user');
      onMobileMenuClose();
    },

    handleProfile: () => {
      navigate('/settings');
      onMobileMenuClose();
    },

    handleViewMore: () => {
      navigate('/user');
      onMobileMenuClose();
    }
  }), [navigate, onMobileMenuClose]);

  // Active path checker - memoized
  const isActivePath = useCallback((path: string) => {
    return location.pathname === path;
  }, [location.pathname]);

  // Menu items - memoized
  const menuItems = useMemo(() => MAIN_MENU_ITEMS, []);

  return {
    // State
    isAtTop,
    isAuthenticated,
    location,

    // Colors
    colors,

    // Menu
    menuItems,
    isActivePath,

    // Handlers
    handlers,
    logout,

    // Modals
    modals: {
      settings: {
        isOpen: isSettingsOpen,
        onOpen: onSettingsOpen,
        onClose: onSettingsClose
      },
      mobileMenu: {
        isOpen: isMobileMenuOpen,
        onOpen: onMobileMenuOpen,
        onClose: onMobileMenuClose
      }
    }
  };
};

// Navigation constants

export const MAIN_MENU_ITEMS = [
  // Example menu items
  { label: 'Home', path: '/' },
  { label: 'Profile', path: '/user' },
  { label: 'Settings', path: '/settings' }
];

export const NAV_COLORS = {
  borderColor: {
    dark: '#2D3748',
    light: '#E2E8F0'
  },
  transparentBg: {
    dark: 'rgba(26, 32, 44, 0.8)',
    light: 'rgba(255, 255, 255, 0.8)'
  },
  solidBg: {
    dark: '#1A202C',
    light: '#FFFFFF'
  },
  textColor: {
    dark: '#F7FAFC',
    light: '#1A202C'
  }
};

export const SCROLL_THROTTLE = 100;
