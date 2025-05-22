import React from 'react';
import { Stack, IconButton } from '@chakra-ui/react';
import { SearchIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { LoginButton } from '../GoogleDriveLogin.jsx';

const NavActions = ({ colorMode, handleToggleColorMode, handleOpenSearch, accessToken, onLogin, onLogout }) => (
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
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={handleToggleColorMode}
      variant="ghost"
      display="flex"
      alignItems="center"
    />
    <LoginButton
      accessToken={accessToken}
      onLogin={onLogin}
      onLogout={onLogout}
    />
  </Stack>
);

export default NavActions; 