import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, useColorModeValue, useBreakpointValue, IconButton, useColorMode } from '@chakra-ui/react';
import { FaHome } from 'react-icons/fa';
import { blogConfig } from '../../config';

const NavLogo: React.FC = () => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, sm: false });
  // Dynamic colors based on theme
  const color = colorMode === 'dark' ? '#ffffff' : '#000000';
  const accentColor = '#00d4ff'; // Cobalt blue

  return (
    <Box
      textAlign={'left'}
      fontFamily={'Inter'}
      color={color}
      fontWeight="600"
      fontSize={{ base: 'lg', md: 'xl' }}
      ms={2}
      zIndex={1000}
      display="block"
      alignItems="center"
      _hover={{
        color: accentColor,
      }}
      transition="color 0.2s ease"
    >
      {isMobile ? (
        <IconButton
          as={RouterLink}
          to="/"
          icon={<FaHome />}
          variant="ghost"
          size="sm"
          aria-label="Home"
          color={color}
          _hover={{
            color: accentColor,
            bg: 'rgba(0, 212, 255, 0.1)',
          }}
          transition="all 0.2s ease"
        />
      ) : (
        <RouterLink
          to="/"
          style={{
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          {blogConfig.title}
        </RouterLink>
      )}
    </Box>
  );
};

export default NavLogo;