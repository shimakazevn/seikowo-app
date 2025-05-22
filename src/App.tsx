import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { Global } from '@emotion/react';
import Nav from './components/Nav';
import ContentWithTransitions from './components/ContentWithTransitions';
import theme from './theme';

const App = (): React.ReactElement => {
  return (
    <ChakraProvider theme={theme}>
      <Global
        styles={`
          body {
            transition: background-color 0.2s ease-out, color 0.2s ease-out !important;
          }
        `}
      />
      <Router>
        <Box minH="100vh">
          <Nav />
          <ContentWithTransitions />
        </Box>
      </Router>
    </ChakraProvider>
  );
};

export default App; 