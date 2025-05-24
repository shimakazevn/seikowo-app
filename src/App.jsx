import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import Nav from './components/Nav';
import ContentWithTransitions from './components/ContentWithTransitions';
import Footer from './components/Footer';
import theme from './theme';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="281791483135-8s3o5t366js9vnghn45hkc5t5hrc6a99.apps.googleusercontent.com">
      <ChakraProvider theme={theme}>
        <Global
          styles={`
            body {
              transition: background-color 0.2s ease-out, color 0.2s ease-out !important;
            }
            .theme-transition {
              transition: background-color 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out !important;
            }
            .chakra-modal__content, .chakra-drawer__content {
              transition: background-color 0.2s ease-out, border-color 0.2s ease-out !important;
            }
            .chakra-button, .chakra-input, .chakra-select, .chakra-textarea {
              transition: all 0.2s ease-out !important;
            }
          `}
        />
        <Router>
            <Nav />
            <ContentWithTransitions />
            <Footer />
        </Router>
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
