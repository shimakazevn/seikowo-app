import React, { memo } from 'react';
import { Box, VStack, Collapse, Flex, Link, Text, Icon, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

const MobileNavItem = memo(({ name, children, path }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box 
      onClick={children && onToggle}
      style={{ background: 'transparent' }}
      width="100%"
    >
      <Flex
        py={2}
        as={Link}
        href={path ?? '#'}
        justify={'space-between'}
        align={'center'}
        style={{ background: 'transparent' }}
        width="100%"
      >
        <Box flex="1" minW={0}>
          <Text
            fontWeight={600}
            color={useColorModeValue('gray.600', 'gray.200')}
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
      </Flex>
      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important', background: 'transparent' }}>
        <VStack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align="stretch"
          spacing={2}
          style={{ background: 'transparent' }}
          width="100%"
        >
          {children &&
            children.map((child) => (
              <Link 
                key={child.name} 
                py={2} 
                href={child.path}
                style={{ background: 'transparent' }}
                display="block"
                width="100%"
              >
                <Text noOfLines={1}>
                  {child.name}
                </Text>
              </Link>
            ))}
        </VStack>
      </Collapse>
    </Box>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

const MobileNav = memo(({ menuItems, isOpen }) => {
  return (
    <Collapse in={isOpen} animateOpacity>
      <Box
        style={{ background: 'transparent' }}
        p={4}
        display={{ md: 'none' }}
        maxW="100vw"
        overflowX="hidden"
      >
        <VStack
          spacing={4}
          align="stretch"
          width="100%"
          style={{ background: 'transparent' }}
        >
          {menuItems.map((navItem) => (
            <MobileNavItem key={navItem.path} {...navItem} />
          ))}
        </VStack>
      </Box>
    </Collapse>
  );
});

MobileNav.displayName = 'MobileNav';

export default MobileNav; 