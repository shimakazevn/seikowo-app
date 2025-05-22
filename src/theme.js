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
  heading: "'Noto Sans JP', 'Be Vietnam Pro', sans-serif",
  body: "'Noto Sans JP', 'Be Vietnam Pro', sans-serif",
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
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
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
  }
});

export default theme; 