import React from 'react';
import { MenuItem } from '../../types/navigation';
import {
  SettingsIcon,
  InfoIcon,
  BellIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { FaHeart, FaHome, FaTags, FaUser } from 'react-icons/fa';

// Navigation constants
export const NAV_HEIGHT = '60px';
export const SIDEBAR_WIDTH = '80px';
export const BOTTOM_NAV_HEIGHT = '70px';
export const NAV_Z_INDEX = 1000;
export const SCROLL_THROTTLE = 50;

// Main menu items for top navigation
export const MAIN_MENU_ITEMS: MenuItem[] = [

];

// Sidebar menu items - Top section
export const SIDEBAR_TOP_ITEMS: MenuItem[] = [
  {
    name: 'home',
    path: '/',
    icon: React.createElement(FaHome)
  },
  {
    name: 'search',
    path: '/search',
    icon: React.createElement(SearchIcon),
    isAction: true // Special flag for search action
  },
  {
    name: 'user',
    path: '/user',
    icon: React.createElement(FaUser)
  },
  {
    name: 'Tags',
    path: '/tags',
    icon: React.createElement(FaTags)
  },
  // Admin tab hidden from navigation
  // {
  //   name: 'admin',
  //   path: '/admin',
  //   icon: React.createElement(MdAdminPanelSettings)
  // },
];

// Sidebar menu items - Bottom section
export const SIDEBAR_BOTTOM_ITEMS: MenuItem[] = [
  {
    name: 'settings',
    path: '/settings',
    icon: React.createElement(SettingsIcon)
  },
  {
    name: 'donate',
    path: '/donate',
    icon: React.createElement(FaHeart)
  },
  {
    name: 'updates',
    path: '/updates',
    icon: React.createElement(BellIcon)
  },
  {
    name: 'about',
    path: '/about',
    icon: React.createElement(InfoIcon)
  }
];

// Combined sidebar items for backward compatibility
export const SIDEBAR_MENU_ITEMS: MenuItem[] = [
  ...SIDEBAR_TOP_ITEMS,
  ...SIDEBAR_BOTTOM_ITEMS
];

// Essential items for mobile bottom navigation (only most important)
export const BOTTOM_NAV_ITEMS: MenuItem[] = [
  {
    name: 'home',
    path: '/',
    icon: React.createElement(FaHome)
  },
  {
    name: 'search',
    path: '/search',
    icon: React.createElement(SearchIcon),
    isAction: true
  },
  {
    name: 'user',
    path: '/user',
    icon: React.createElement(FaUser)
  },
  {
    name: 'settings',
    path: '/settings',
    icon: React.createElement(SettingsIcon)
  }
];

// Cobalt.tools inspired color scheme constants
export const NAV_COLORS = {
  activeColor: '#00d4ff', // Cobalt blue
  borderColor: {
    light: '#e5e5e5',
    dark: '#333333'
  },
  transparentBg: {
    light: 'rgba(255, 255, 255, 0.95)',
    dark: 'rgba(0, 0, 0, 0.95)'
  },
  solidBg: {
    light: '#f4f4f4', // Secondary color for light mode
    dark: '#131313'   // Secondary color for dark mode
  },
  textColor: {
    light: '#000000',
    dark: '#ffffff'
  },
  mutedTextColor: {
    light: '#666666',
    dark: '#888888'
  }
} as const;

