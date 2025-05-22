import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import * as ReactDOM from 'react-dom/client'
import App from './App'
import theme from './theme'
import './styles/fonts.css'

const rootElement = document.getElementById('root')
ReactDOM.createRoot(rootElement).render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme} resetCSS>
      <App />
    </ChakraProvider>
  </>,
)
