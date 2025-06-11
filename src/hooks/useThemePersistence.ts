import { useEffect, useLayoutEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { useSystemColorMode } from './useSystemColorMode';

export const useThemePersistence = () => {
  const { colorMode, setColorMode } = useColorMode();
  const systemPreference = useSystemColorMode();

  // Use useLayoutEffect to apply theme before paint to prevent flash
  useLayoutEffect(() => {
    // Ensure theme is applied correctly on every navigation/mount
    const savedTheme = localStorage.getItem('theme-preference') || 'auto';

    let targetColorMode: 'light' | 'dark';

    if (savedTheme === 'auto') {
      targetColorMode = systemPreference;
    } else {
      targetColorMode = savedTheme as 'light' | 'dark';
    }

    // Apply theme immediately to prevent flash
    if (colorMode !== targetColorMode) {
      setColorMode(targetColorMode);
      // Sync with Chakra UI localStorage
      localStorage.setItem('chakra-ui-color-mode', targetColorMode);

      // Also apply to document immediately
      document.documentElement.setAttribute('data-theme', targetColorMode);
      document.body.style.backgroundColor = targetColorMode === 'dark' ? '#000000' : '#ffffff';
      document.body.style.color = targetColorMode === 'dark' ? '#ffffff' : '#000000';
    }
  }, [colorMode, setColorMode, systemPreference]);

  // Watch for system preference changes when in auto mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-preference') || 'auto';

    if (savedTheme === 'auto') {
      setColorMode(systemPreference);
      localStorage.setItem('chakra-ui-color-mode', systemPreference);
    }
  }, [systemPreference, setColorMode]);

  return { colorMode, setColorMode };
};
