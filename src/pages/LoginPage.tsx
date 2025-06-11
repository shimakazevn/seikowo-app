import React from 'react';
import {
  Box,
  Container,
  VStack,
  Text,
  useColorMode,
  Center
} from '@chakra-ui/react';
import { LoginButton } from '../components/features/Auth/LoginButton';

const LoginPage: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#888' : '#666';

  return (
    <Box
      bg={isDark ? '#000000' : '#ffffff'}
      minH="100vh"
      color={textColor}
      position="relative"
    >
      <Container maxW="400px" py={8}>
        <Center minH="80vh">
          <VStack spacing={6} textAlign="center" w="100%">
            <VStack spacing={3}>
              <Text
                fontSize="2xl"
                fontWeight="600"
                color={textColor}
              >
                ようこそ！ welcome senpai~
              </Text>
              <Text
                color={mutedColor}
                fontSize="sm"
                textAlign="center"
              >
                sign in with google to unlock your profile
              </Text>
            </VStack>

            <LoginButton
              variant="google"
              size="md"
              useGoogleIcon={true}
              onSuccess={() => {
                console.log('Login successful');
              }}
              onError={(error) => {
                console.error('Login error:', error);
              }}
            />

            <Text
              fontSize="xs"
              color={isDark ? '#666' : '#999'}
              textAlign="center"
            >
              ready for an epic adventure? (◕‿◕)
            </Text>
          </VStack>
        </Center>
      </Container>
    </Box>
  );
};

export default LoginPage; 