import React from 'react';
import { Flex } from '@chakra-ui/react';
import DesktopNav from './DesktopNav';

const NavMenuDesktop = ({ menuItems, isActive, hoverBg, activeColor, textColor }) => (
  <Flex display={{ base: 'none', md: 'flex' }} align="center" minW={0}>
    <DesktopNav
      menuItems={menuItems}
      isActive={isActive}
      hoverBg={hoverBg}
      activeColor={activeColor}
      textColor={textColor}
    />
  </Flex>
);

export default NavMenuDesktop; 