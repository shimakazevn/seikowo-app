import React from 'react';
import { MenuItem } from '../../../types/navigation';
import { FaBell, FaCog, FaHeart, FaHome, FaInfo, FaSearch, FaTags, FaUser } from 'react-icons/fa';
import { SettingsIcon } from '@chakra-ui/icons';

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
    icon: React.createElement(FaSearch),
  },
  {
    name: 'Tags',
    path: '/tags',
    icon: React.createElement(FaTags)
  },
  {
    name: 'user',
    path: '/user',
    icon: React.createElement(FaUser)
  },
];

// Sidebar menu items - Bottom section
export const SIDEBAR_BOTTOM_ITEMS: MenuItem[] = [
  {
    name: 'settings',
    path: '/settings',
    icon: React.createElement(FaCog)
  },
  {
    name: 'donate',
    path: '/donate',
    icon: React.createElement(FaHeart)
  },
  {
    name: 'updates',
    path: '/updates',
    icon: React.createElement(FaBell)
  },
  {
    name: 'about',
    path: '/about',
    icon: React.createElement(FaInfo)
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
    icon: React.createElement(FaSearch),
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
    icon: React.createElement(FaCog)
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
    light: '#444444',
    dark: '#bbbbbb'
  }
} as const;

