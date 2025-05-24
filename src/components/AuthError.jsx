import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

export const AuthError = ({ error, onRetry }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="auto"
      p={8}
      borderRadius="lg"
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Lỗi xác thực
      </AlertTitle>
      <AlertDescription maxWidth="sm" mb={4}>
        {error?.message || 'Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.'}
      </AlertDescription>
      <VStack spacing={3}>
        <Button
          colorScheme="blue"
          onClick={handleRetry}
          size="md"
          width="full"
        >
          Thử lại
        </Button>
        <Button
          colorScheme="red"
          variant="outline"
          onClick={handleLogout}
          size="md"
          width="full"
        >
          Đăng xuất
        </Button>
      </VStack>
    </Alert>
  );
};

export default AuthError; 