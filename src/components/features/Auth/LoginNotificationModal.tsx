import React, { useState } from 'react';
import { FaGoogle, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import { MdSecurity, MdVerifiedUser } from 'react-icons/md';
import { useAuth } from '../../../hooks';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  useColorModeValue,
  Icon,
  Box,
  Divider
} from '@chakra-ui/react';
import LoginButton from './LoginButton';

interface LoginNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  feature?: string;
}

const LoginNotificationModal: React.FC<LoginNotificationModalProps> = ({
  isOpen,
  onClose,
  title = 'Cần đăng nhập',
  message = 'Bạn cần đăng nhập để sử dụng tính năng này.',
  feature
}) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      onClose();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        boxShadow="xl"
      >
        <ModalHeader textAlign="center" pb={2}>
                {title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Feature Icon */}
            {feature && (
              <Box textAlign="center">
                <Icon 
                  as={feature === 'security' ? MdSecurity : MdVerifiedUser}
                  w={12}
                  h={12}
                  color="blue.500"
                />
              </Box>
            )}

            {/* Message */}
            <Text textAlign="center" color={textColor}>
                    {message}
                  </Text>

            <Divider />

            {/* Login Options */}
            <VStack spacing={4}>
              <LoginButton
                variant="google"
                size="md"
                width="200px"
                useGoogleIcon={true}
                onSuccess={onClose}
                onError={(error) => console.error('Login error in modal:', error)}
              />

              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
                w="full"
                leftIcon={<FaSignInAlt />}
              >
                Quay lại
              </Button>
                </VStack>

            {/* Benefits */}
            <VStack spacing={3} align="stretch" pt={2}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                Lợi ích khi đăng nhập:
              </Text>
              <VStack spacing={2} align="stretch">
                <Box display="flex" alignItems="center">
                  <Icon as={FaUserPlus} color="green.500" mr={2} />
                  <Text fontSize="sm">Tạo và quản lý bài viết của riêng bạn</Text>
                </Box>
                <Box display="flex" alignItems="center">
                  <Icon as={FaLock} color="blue.500" mr={2} />
                  <Text fontSize="sm">Đồng bộ dữ liệu an toàn với Google Drive</Text>
                </Box>
              </VStack>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LoginNotificationModal;
