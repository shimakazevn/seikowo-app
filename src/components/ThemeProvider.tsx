import React from 'react';
import { useThemePersistence } from '../hooks/useThemePersistence';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // This hook ensures theme persistence across navigation
  useThemePersistence();
  
  return <>{children}</>;
};

export default ThemeProvider;
