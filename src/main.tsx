import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import * as ReactDOM from 'react-dom/client'
import App from './App'
import cobaltTheme from './theme/cobaltTheme' // Cobalt.tools inspired theme
import './styles/fonts.css'

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <>
    <ColorModeScript initialColorMode={cobaltTheme.config?.initialColorMode || 'system'} />
    <ChakraProvider theme={cobaltTheme} resetCSS>
      <App />
    </ChakraProvider>
  </>
);