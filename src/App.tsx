import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ContentWithTransitions from './components/layout/ContentWithTransitions';
import AppInitializer from './components/AppInitializer';
import AuthErrorBoundary from './components/features/Auth/AuthErrorBoundary';
import { blogConfig } from './config';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme/cobaltTheme';
import ThemeProvider from './components/ThemeProvider';
import LoginNotificationProvider from './components/features/Auth/LoginNotificationProvider';
import Nav from './components/layout/Nav';
import Footer from './components/layout/Footer';
import { ChakraProvider, CSSReset, ColorModeScript } from '@chakra-ui/react';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <GoogleOAuthProvider clientId={blogConfig.clientId}>
        <ChakraProvider theme={theme}>
          <CSSReset />
          <ThemeProvider>
            <Router>
              <AuthErrorBoundary>
                <AuthProvider>
                  <LoginNotificationProvider>
                    <AppInitializer>
                      <Nav />
                      <ContentWithTransitions/>
                      <Footer />
                    </AppInitializer>
                  </LoginNotificationProvider>
                </AuthProvider>
              </AuthErrorBoundary>
            </Router>
          </ThemeProvider>
        </ChakraProvider>
      </GoogleOAuthProvider>
    </>
  );
}

export default App;