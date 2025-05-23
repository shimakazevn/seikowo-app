import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';
import { blogConfig } from '../../config';

const NavLogo = () => (
  <Box
    textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
    fontFamily={'Be Vietnam Pro'}
    color={useColorModeValue('gray.800', 'white')}
    fontWeight="medium"
    fontSize={{ base: 'lg', md: 'xl' }}
    ms={2}
    zIndex={1000}
    display="block"
    alignItems="center"
  >
    <RouterLink to="/">{blogConfig.title}</RouterLink>
  </Box>
);

export default NavLogo; 