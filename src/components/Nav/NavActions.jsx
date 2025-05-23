import React from 'react';
import { Stack, IconButton, useColorModeValue } from '@chakra-ui/react';
import { SearchIcon, MoonIcon, SunIcon, TimeIcon } from '@chakra-ui/icons';
import { LoginButton } from '../GoogleDriveLogin.jsx';
import { useLocation } from 'react-router-dom';

const NavActions = ({ colorMode, handleToggleColorMode, handleOpenSearch, accessToken, onLogin, onLogout, onHistory, userId }) => {
  const location = useLocation();
  const isHistoryActive = location.pathname === `/u/${userId}`;
  const historyActiveColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Stack
      flex={{ base: '0 0 auto' }}
      justify={'flex-end'}
      direction={'row'}
      spacing={2}
      align="center"
      h="100%"
    >
      <IconButton
        size="sm"
        aria-label="Search"
        icon={<SearchIcon />}
        variant="ghost"
        onClick={handleOpenSearch}
        display="flex"
        alignItems="center"
      />
      <IconButton
        size="sm"
        aria-label="Lịch sử"
        icon={<TimeIcon />}
        onClick={onHistory}
        variant="ghost"
        display="flex"
        alignItems="center"
        title="Lịch sử"
        color={isHistoryActive ? historyActiveColor : undefined}
        _hover={{
          color: historyActiveColor,
        }}
      />
      <IconButton
        size="sm"
        aria-label="Toggle color mode"
        icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
        onClick={handleToggleColorMode}
        variant="ghost"
        display="flex"
        alignItems="center"
        _hover={{
          color: colorMode === 'light' ? 'blue.400' : 'orange.400',
        }}
      />
      <LoginButton
        accessToken={accessToken}
        onLogin={onLogin}
        onLogout={onLogout}
      />
    </Stack>
  );
};

export default NavActions; 