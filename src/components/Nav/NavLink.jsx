import React, { memo } from 'react';
import { Link as ChakraLink, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const NavLink = memo(({ to, children, isActive, activeColor, textColor, hoverColor, fontWeight, ...props }) => {
  const location = useLocation();
  const active = isActive ? isActive(to) : location.pathname === to;
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      color={active ? activeColor : textColor}
      _hover={{
        color: active ? activeColor : hoverColor,
        textDecoration: 'none',
      }}
      fontWeight={fontWeight || 500}
      position="relative"
      {...props}
    >
      {children}
    </ChakraLink>
  );
});

export default NavLink; 