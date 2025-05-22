import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, useColorModeValue, useBreakpointValue } from '@chakra-ui/react';

const NavLogo = () => (
  <Box
    textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
    fontFamily={'heading'}
    color={useColorModeValue('gray.800', 'white')}
    fontWeight="bold"
    fontSize={{ base: 'md', md: 'xl' }}
    minW={0}
    flex="0 1 auto"
    whiteSpace="nowrap"
    overflow="hidden"
    textOverflow="ellipsis"
    position={{ base: 'absolute', md: 'relative' }}
    left={{ base: '55%', md: 0 }}
    transform={{ base: 'translateX(-50%)', md: 'none' }}
    ml={0}
  >
    <RouterLink to="/">Seikowo Team</RouterLink>
  </Box>
);

export default NavLogo; 