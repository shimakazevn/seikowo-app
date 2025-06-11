export const MAIN_MENU_ITEMS = [
  {
    label: 'Trang chủ',
    path: '/',
    icon: 'home'
  },
  {
    label: 'Blog',
    path: '/blog',
    icon: 'blog'
  },
  {
    label: 'Giới thiệu',
    path: '/about',
    icon: 'info'
  }
] as const;

export const NAV_COLORS = {
  light: {
    bg: 'white',
    border: 'gray.200',
    text: 'gray.800'
  },
  dark: {
    bg: 'gray.800',
    border: 'gray.700',
    text: 'white'
  }
} as const;

export const SCROLL_THROTTLE = 200; // ms