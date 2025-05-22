import { extendTheme } from '@chakra-ui/react';

const breakpoints = {
  base: '0px',
  sm: '480px',
  md: '768px',
  lg: '992px',
  xl: '1280px',
  xxl: '1920px'
};

// Font configuration
const fonts = {
  heading: "'Inter', 'Be Vietnam Pro', sans-serif",
  body: "'Inter', 'Be Vietnam Pro', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Typography styles
const typography = {
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: '2',
  },
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};

const theme = extendTheme({
  config: {
    initialColorMode: 'system',
    useSystemColorMode: true,
  },
  fonts,
  ...typography,
  styles: {
    global: (props) => ({
      'html, body': {
        bg: props.colorMode === 'dark' ? '#1A202C' : '#FFFFFF',
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#2D3748',
      },
      'body': {
        minHeight: '100vh',
        fontFamily: fonts.body,
        lineHeight: 1.7,
        letterSpacing: '-0.01em',
      },
      'h1, h2, h3, h4, h5, h6': {
        fontFamily: fonts.heading,
        fontWeight: 'bold',
        letterSpacing: '-0.02em',
        lineHeight: 1.5,
        color: props.colorMode === 'dark' ? '#FFFFFF' : '#1A202C',
      },
      '.chakra-heading': {
        fontFamily: fonts.heading,
        letterSpacing: '-0.02em',
      },
      'code, kbd, samp, pre': {
        fontFamily: fonts.mono,
      },
      // Tối ưu cho text tiếng Nhật và tiếng Việt
      '.content-text': {
        fontFamily: fonts.body,
        letterSpacing: '-0.01em',
        lineHeight: 1.7,
        fontSize: { base: 'sm', md: 'md' },
      },
      // Tối ưu cho tiêu đề
      '.content-heading': {
        fontFamily: fonts.heading,
        letterSpacing: '-0.02em',
        lineHeight: 1.5,
        fontWeight: 'bold',
      },
      // Tối ưu cho dark mode
      '.dark-mode': {
        bg: props.colorMode === 'dark' ? '#1A202C' : '#FFFFFF',
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#2D3748',
      },
      // Tối ưu cho các components
      '.chakra-button, .chakra-input, .chakra-select, .chakra-textarea': {
        transition: 'all 0.2s ease-out',
      },
      '.chakra-card, .chakra-modal, .chakra-drawer': {
        transition: 'background-color 0.2s ease-out, border-color 0.2s ease-out',
      }
    }),
  },
  breakpoints,
  sizes: {
    container: {
      sm: '450px',
      md: '720px',
      lg: '960px',
      xl: '1200px',
      xxl: '1600px'
    }
  },
  // Tối ưu màu sắc cho dark mode
  colors: {
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    blue: {
      50: '#EBF8FF',
      100: '#BEE3F8',
      200: '#90CDF4',
      300: '#63B3ED',
      400: '#4299E1',
      500: '#3182CE',
      600: '#2B6CB0',
      700: '#2C5282',
      800: '#2A4365',
      900: '#1A365D',
    },
    // Thêm các màu accent từ Chakra UI docs
    accent: {
      light: '#3182CE', // blue.500
      dark: '#63B3ED',  // blue.300
    },
    // Màu cho code blocks
    code: {
      light: '#F7FAFC', // gray.50
      dark: '#2D3748',  // gray.700
    },
    // Màu cho borders
    border: {
      light: '#E2E8F0', // gray.200
      dark: '#4A5568',  // gray.600
    },
  },
  // Tối ưu shadows cho dark mode
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  // Tối ưu transitions
  transition: {
    property: {
      common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    },
    easing: {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    duration: {
      'ultra-fast': '50ms',
      faster: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      'ultra-slow': '1000ms',
    },
  },
});

export default theme; 