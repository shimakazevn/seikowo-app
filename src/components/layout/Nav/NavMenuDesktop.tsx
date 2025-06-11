import React from 'react';
import { Flex } from '@chakra-ui/react';
import DesktopNav from './DesktopNav';

interface MenuItem {
  name: string;
  path: string;
}

interface NavMenuDesktopProps {
  menuItems: MenuItem[];
  isActive: (path: string) => boolean;
  hoverBg?: string;
  activeColor: string;
  textColor: string;
}

const NavMenuDesktop: React.FC<NavMenuDesktopProps> = ({ 
  menuItems, 
  isActive, 
  hoverBg, 
  activeColor, 
  textColor 
}) => (
  <Flex display={{ base: 'none', md: 'flex' }} align="center" minW={0}>
    <DesktopNav
      menuItems={menuItems}
      isActive={isActive}
      
      activeColor={activeColor}
      textColor={textColor}
    />
  </Flex>
);

export default NavMenuDesktop; 