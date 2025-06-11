import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  useColorMode,
  Button,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useToast
} from '@chakra-ui/react';
import {
  FiSun,
  FiMoon,
  FiMonitor,
  FiChevronDown
} from 'react-icons/fi';

const AppearanceSettings = () => {
  const { colorMode, setColorMode } = useColorMode();
  const [isSystemMode, setIsSystemMode] = useState(false);
  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const menuLightBg = useColorModeValue('blue.50', 'blue.900');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.600');
  const menuActiveBg = useColorModeValue('gray.200', 'gray.500');

  // Color mode handling
  const handleColorModeChange = (mode: string) => {
    try {
      if (mode === 'system') {
        setIsSystemMode(true);
        localStorage.setItem('systemColorMode', 'true');
        localStorage.setItem('theme-preference', 'auto');
        
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const targetMode = systemPrefersDark ? 'dark' : 'light';
        setColorMode(targetMode);
        
        toast({
          title: 'Chế độ hệ thống được bật',
          description: 'Giao diện sẽ tự động thay đổi theo cài đặt hệ thống.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        setIsSystemMode(false);
        localStorage.setItem('systemColorMode', 'false');
        localStorage.setItem('theme-preference', mode);
        setColorMode(mode);
        
        toast({
          title: `Chuyển sang chế độ ${mode === 'light' ? 'sáng' : 'tối'}`,
          description: 'Giao diện đã được cập nhật.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error changing color mode:', error);
      toast({
        title: 'Lỗi thay đổi giao diện',
        description: 'Không thể thay đổi chế độ giao diện',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // System color mode detection
  useEffect(() => {
    const savedMode = localStorage.getItem('systemColorMode');
    const savedThemePreference = localStorage.getItem('theme-preference');

    if (savedMode === 'true' || savedThemePreference === 'auto') {
      setIsSystemMode(true);
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const targetMode = mediaQuery.matches ? 'dark' : 'light';
      if (colorMode !== targetMode) {
        setColorMode(targetMode);
      }
    } else {
      setIsSystemMode(false);
    }
  }, []);

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="semibold" color={textColor} mb={2}>
          cài đặt giao diện
        </Text>
        <Text fontSize="sm" color={mutedTextColor} mb={6}>
          tùy chỉnh giao diện ứng dụng theo sở thích của bạn.
        </Text>
      </Box>

      <FormControl id="theme-mode">
        <FormLabel fontWeight="semibold" fontSize="md" color={textColor}>
          chế độ giao diện
        </FormLabel>
        <Text fontSize="sm" color={mutedTextColor} mb={3}>
          thay đổi giữa chế độ sáng, tối hoặc chế độ hệ thống.
          {isSystemMode && (
            <Badge ml={2} colorScheme="blue" variant="subtle">
              Đang theo hệ thống
            </Badge>
          )}
        </Text>

        <Menu>
          <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="outline">
            {isSystemMode ? 'chế độ hệ thống' : colorMode === 'light' ? 'chế độ sáng' : 'chế độ tối'}
          </MenuButton>
          <MenuList>
            <MenuItem
              onClick={() => handleColorModeChange('light')}
              icon={<Icon as={FiSun} boxSize={5} />}
              bg={!isSystemMode && colorMode === 'light' ? menuLightBg : undefined}
              _hover={{ bg: menuHoverBg }}
              _active={{ bg: menuActiveBg }}
              fontWeight={!isSystemMode && colorMode === 'light' ? 'bold' : 'normal'}
            >
              chế độ sáng
            </MenuItem>
            <MenuItem
              onClick={() => handleColorModeChange('dark')}
              icon={<Icon as={FiMoon} boxSize={5} />}
              bg={!isSystemMode && colorMode === 'dark' ? menuLightBg : undefined}
              _hover={{ bg: menuHoverBg }}
              _active={{ bg: menuActiveBg }}
              fontWeight={!isSystemMode && colorMode === 'dark' ? 'bold' : 'normal'}
            >
              chế độ tối
            </MenuItem>
            <MenuItem
              onClick={() => handleColorModeChange('system')}
              icon={<Icon as={FiMonitor} boxSize={5} />}
              bg={isSystemMode ? menuLightBg : undefined}
              _hover={{ bg: menuHoverBg }}
              _active={{ bg: menuActiveBg }}
              fontWeight={isSystemMode ? 'bold' : 'normal'}
            >
              chế độ hệ thống
            </MenuItem>
          </MenuList>
        </Menu>
      </FormControl>
    </VStack>
  );
};

export default AppearanceSettings;
