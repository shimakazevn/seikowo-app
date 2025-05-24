import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, useColorModeValue, useBreakpointValue, IconButton } from '@chakra-ui/react';
import { FaHome } from 'react-icons/fa';
import { blogConfig } from '../../config';

const NavLogo = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const color = useColorModeValue('gray.800', 'white');

  return (
    <Box
      textAlign={'left'}
      fontFamily={'Be Vietnam Pro'}
      color={color}
      fontWeight="medium"
      fontSize={{ base: 'lg', md: 'xl' }}
      ms={2}
      zIndex={1000}
      display="block"
      alignItems="center"
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
        />
      ) : (
        <RouterLink to="/">{blogConfig.title}</RouterLink>
      )}
    </Box>
  );
};

export default NavLogo; 