import { extendTheme, ThemeConfig } from '@chakra-ui/react';

// Function to get initial color mode from localStorage
const getInitialColorMode = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';

  const savedTheme = localStorage.getItem('theme-preference') || 'auto';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark') return 'dark';
  if (savedTheme === 'light') return 'light';
  // auto mode
  return prefersDark ? 'dark' : 'light';
};

// Cobalt.tools inspired theme configuration
const config: ThemeConfig = {
  initialColorMode: getInitialColorMode(),
  useSystemColorMode: false, // We handle this manually to avoid FOUC
};

// Cobalt.tools inspired fonts - monospace for that terminal feel
const fonts = {
  heading: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  body: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
};

// Cobalt.tools color palette
const colors = {
  cobalt: {
    primary: '#00d4ff',    // Main cobalt blue
    bg: '#000000',         // Pure black background
    surface: '#111111',    // Slightly lighter for cards
    border: '#333333',     // Border color
    text: '#ffffff',       // White text
    textMuted: '#888888',  // Muted text
  },
  // Secondary colors for cards/surfaces
  secondary: {
    light: '#f4f4f4',      // Light mode secondary background
    dark: '#131313',       // Dark mode secondary background
  }
};

const theme = extendTheme({
  config,
  fonts,
  colors,
  styles: {
    global: (props: any) => {
      // Determine if we should use dark mode
      const isDark = props.colorMode === 'dark' ||
        (props.colorMode === 'system' &&
         typeof window !== 'undefined' &&
         window.matchMedia &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);

      return {
        'html, body': {
          bg: isDark ? '#000000' : '#',
          color: isDark ? '#ffffff' : '#000000',
          minHeight: '100vh',
          fontFamily: fonts.body,
          fontSize: '14px',
          lineHeight: 1.5,
          letterSpacing: '0',
          // Prevent flash of white background
          transition: 'none !important',
          // Prevent horizontal overflow
          overflowX: 'hidden',
          maxWidth: '100vw',
        },
        '#root': {
          bg: isDark ? '#000000' : '#ffffff',
          minHeight: '100vh',
          // Prevent flash of white background
          transition: 'none !important',
          // Prevent horizontal overflow
          overflowX: 'hidden',
          maxWidth: '100vw',
        },
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: fonts.heading,
          fontWeight: '500',
          letterSpacing: '0',
          lineHeight: 1.3,
          color: isDark ? '#ffffff' : '#000000',
        },
        '.chakra-heading': {
          fontFamily: fonts.heading,
          letterSpacing: '0',
        },
        'code, kbd, samp, pre': {
          fontFamily: fonts.mono,
          bg: isDark ? '#111111' : '#f8f9fa',
          color: '#00d4ff',
          px: 2,
          py: 1,
          borderRadius: '4px',
        },
        // Scrollbar styling
        '*::-webkit-scrollbar': {
          width: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: isDark ? '#000000' : '#ffffff',
        },
        '*::-webkit-scrollbar-thumb': {
          background: '#00d4ff',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#33ddff',
        },
      };
    },
  },
  components: {
    // Button component
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
      },
      variants: {
        solid: {
          bg: '#00d4ff',
          color: '#000000',
          _hover: {
            bg: '#33ddff',
            transform: 'translateY(-1px)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        outline: {
          borderColor: '#00d4ff',
          color: '#00d4ff',
          _hover: {
            bg: 'rgba(0, 212, 255, 0.1)',
            borderColor: '#33ddff',
          },
        },
        ghost: (props: any) => ({
          color: props.colorMode === 'dark' ? '#888888' : '#666666',
          _hover: {
            bg: props.colorMode === 'dark' ? '#111111' : '#f8f9fa',
            color: props.colorMode === 'dark' ? '#ffffff' : '#000000',
          },
        }),
      },
    },
    // Card component
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? '#131313' : '#f4f4f4', // Using secondary colors
          borderRadius: '8px',
          border: props.colorMode === 'dark' ? '1px solid #333333' : '1px solid #e5e5e5',
          transition: 'all 0.2s ease',
          _hover: {
            borderColor: '#00d4ff',
          },
        },
      }),
    },
    // Input component
    Input: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? '#131313' : '#f4f4f4', // Using secondary colors
            borderRadius: '6px',
            border: props.colorMode === 'dark' ? '1px solid #333333' : '1px solid #e5e5e5',
            color: props.colorMode === 'dark' ? '#ffffff' : '#000000',
            _placeholder: {
              color: props.colorMode === 'dark' ? '#888888' : '#666666',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? '#131313' : '#f4f4f4', // Using secondary colors
              borderColor: '#00d4ff',
              boxShadow: '0 0 0 1px #00d4ff',
            },
            _hover: {
              borderColor: props.colorMode === 'dark' ? '#555555' : '#cccccc',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    // Badge component
    Badge: {
      baseStyle: {
        borderRadius: '4px',
        fontWeight: '500',
        fontSize: 'xs',
      },
      variants: {
        solid: {
          bg: '#00d4ff',
          color: '#000000',
        },
        subtle: {
          bg: 'rgba(0, 212, 255, 0.2)',
          color: '#00d4ff',
        },
      },
    },
    // Modal component
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? '#000000' : '#ffffff',
          border: props.colorMode === 'dark' ? '1px solid #333333' : '1px solid #e5e5e5',
        },
        overlay: {
          bg: props.colorMode === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
        },
      }),
    },
    // Menu component
    Menu: {
      baseStyle: (props: any) => ({
        list: {
          bg: props.colorMode === 'dark' ? '#111111' : '#ffffff',
          border: props.colorMode === 'dark' ? '1px solid #333333' : '1px solid #e5e5e5',
          borderRadius: '6px',
        },
        item: {
          bg: 'transparent',
          color: props.colorMode === 'dark' ? '#ffffff' : '#000000',
          _hover: {
            bg: 'rgba(0, 212, 255, 0.1)',
            color: '#00d4ff',
          },
          _focus: {
            bg: 'rgba(0, 212, 255, 0.1)',
            color: '#00d4ff',
          },
        },
      }),
    },
    // Tooltip component
    Tooltip: {
      baseStyle: (props: any) => ({
        bg: props.colorMode === 'dark' ? '#111111' : '#ffffff',
        color: props.colorMode === 'dark' ? '#ffffff' : '#000000',
        border: props.colorMode === 'dark' ? '1px solid #333333' : '1px solid #e5e5e5',
        borderRadius: '4px',
        fontSize: 'sm',
        fontWeight: '500',
      }),
    },
    // Text component - removed global styling to avoid conflicts
    // Text: {
    //   baseStyle: (props: any) => ({
    //     color: props.colorMode === 'dark' ? '#ffffff' : '#000000',
    //   }),
    // },
    // Heading component - keep minimal styling
    Heading: {
      baseStyle: {
        fontWeight: '500',
      },
    },
    // Divider component
    Divider: {
      baseStyle: (props: any) => ({
        borderColor: props.colorMode === 'dark' ? '#333333' : '#e5e5e5',
      }),
    },
    // Link component
    Link: {
      baseStyle: {
        color: '#00d4ff',
        _hover: {
          color: '#33ddff',
          textDecoration: 'none',
        },
      },
    },
  },
});

export default theme;
export { config };
