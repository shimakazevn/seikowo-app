import { Global } from '@emotion/react';
import { useColorMode } from '@chakra-ui/react';

const ThemeTransition = () => {
  const { colorMode } = useColorMode();

  return (
    <Global
      styles={`
        body {
          transition: background-color 0.2s linear, color 0.2s linear;
        }
      `}
    />
  );
};

export default ThemeTransition; 