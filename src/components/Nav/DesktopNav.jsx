import React, { memo } from 'react';
import { Stack, Box, Popover, PopoverTrigger, PopoverContent, useColorModeValue } from '@chakra-ui/react';
import NavLink from './NavLink';
import { ChevronRightIcon } from '@chakra-ui/icons';

const DesktopSubNav = memo(({ name, path, isActive, activeColor, textColor, hoverColor }) => {
  return (
    <NavLink
      to={path}
      isActive={isActive}
      activeColor={activeColor}
      textColor={textColor}
      hoverColor={hoverColor}
      p={2}
      rounded="md"
      fontWeight={500}
      display="block"
    >
      <Stack direction={'row'} align={'center'} style={{ background: 'transparent' }}>
        <Box>
          <span style={{ transition: 'all .3s ease', fontWeight: 500 }}>{name}</span>
        </Box>
        <Box
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          justifyContent={'flex-end'}
          alignItems={'center'}
          flex={1}
        >
          <ChevronRightIcon color={'pink.400'} w={5} h={5} />
        </Box>
      </Stack>
    </NavLink>
  );
});

DesktopSubNav.displayName = 'DesktopSubNav';

const DesktopNav = memo(({ menuItems, isActive, activeColor, textColor, hoverColor }) => {
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4} style={{ background: 'transparent' }}>
      {menuItems.map((navItem) => (
        <Box key={navItem.path}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <NavLink
                to={navItem.path}
                isActive={isActive}
                activeColor={activeColor}
                textColor={textColor}
                hoverColor={hoverColor}
                p={2}
                fontSize={'sm'}
                fontWeight={500}
                rounded="md"
              >
                {navItem.name}
              </NavLink>
            </PopoverTrigger>
            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}
              >
                <Stack style={{ background: 'transparent' }}>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.name} {...child} isActive={isActive} activeColor={activeColor} textColor={textColor} hoverColor={hoverColor} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
});

DesktopNav.displayName = 'DesktopNav';

export default DesktopNav; 