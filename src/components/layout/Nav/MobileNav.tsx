import React, { memo } from 'react';
import { Box, VStack, Collapse, Flex, Text, Icon, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import NavLink from './NavLink';

interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

interface MobileNavItemProps extends NavItem {
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
  hoverColor?: string;
  onNavigate?: () => void;
}

const MobileNavItem: React.FC<MobileNavItemProps> = memo(({
  name,
  children,
  path,
  isActive,
  activeColor,
  textColor,
  hoverColor,
  onNavigate
}) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box
      onClick={children && onToggle}
      width="100%"
    >
      <NavLink
        to={path ?? '#'}
        isActive={isActive}
        activeColor={activeColor}
        textColor={textColor}
        hoverColor={hoverColor}
        py={2}
        px={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        fontWeight={600}
        onClick={!children && onNavigate ? onNavigate : undefined}
      >
        <Box flex="1" minW={0}>
          <Text
            fontWeight={600}
            noOfLines={1}
          >
            {name}
          </Text>
        </Box>
        {children && (
          <Box ml={2}>
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          </Box>
        )}
      </NavLink>
      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <VStack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align="stretch"
          spacing={2}
          width="100%"
          borderRadius="md"
          p={2}
        >
          {children &&
            children.map((child: any) => (
              <NavLink
                key={child.name}
                to={child.path}
                isActive={isActive}
                activeColor={activeColor}
                textColor={textColor}
                hoverColor={hoverColor}
                py={2}
                px={2}
                borderRadius="md"
                fontWeight={600}
                onClick={onNavigate}
                display="block"
              >
                <Text noOfLines={1}>{child.name}</Text>
              </NavLink>
            ))}
        </VStack>
      </Collapse>
    </Box>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

interface MobileNavProps {
  menuItems: NavItem[];
  isOpen: boolean;
  isActive: (path: string) => boolean;
  activeColor: string;
  textColor: string;
  hoverColor?: string;
  onNavigate?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = memo(({
  menuItems,
  isOpen,
  isActive,
  activeColor,
  textColor,
  hoverColor,
  onNavigate
}) => {
  return (
    <Box
      display={{ md: 'none' }}
      position="relative"
      shadow="lg"
    >
      <Collapse in={isOpen} animateOpacity>
        <VStack
          spacing={2}
          align="stretch"
          width="100%"
          px={4}
          mb={4}
        >
          {menuItems.map((navItem: any) => (
            <MobileNavItem
              key={navItem.path}
              {...navItem}
              isActive={isActive}
              activeColor={activeColor}
              textColor={textColor}
              hoverColor={hoverColor}
              onNavigate={onNavigate}
            />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
});

MobileNav.displayName = 'MobileNav';

export default MobileNav;