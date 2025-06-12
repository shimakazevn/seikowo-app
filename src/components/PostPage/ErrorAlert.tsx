import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Center,
  VStack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { ErrorAlertProps } from '../../types/post';

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => (
  <Alert
    status="error"
    variant="subtle"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    height="200px"
    rounded="lg"
  >
    <AlertIcon boxSize="40px" mr={0} />
    <AlertTitle mt={4} mb={1} fontSize="lg">
      Đã xảy ra lỗi!
    </AlertTitle>
    <AlertDescription maxWidth="sm">
      {error}
    </AlertDescription>
    <Button
      leftIcon={<ArrowBackIcon />}
      mt={4}
      as={Link}
      to="/"
      colorScheme="gray"
      variant="solid"
    >
      Quay lại trang chủ
    </Button>
  </Alert>
);

export const NotFoundAlert: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/404', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Center h="50vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="pink.500" thickness="4px" />
        <Text fontSize="lg" color="gray.500">
          Đang chuyển hướng đến trang 404...
        </Text>
        <Text fontSize="sm" color="gray.400">
          (｡◕‿◕｡) Chờ một chút nhé~
        </Text>
      </VStack>
    </Center>
  );
}; 