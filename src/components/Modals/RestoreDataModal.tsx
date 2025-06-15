import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Progress,
  useColorModeValue,
  Spinner,
  Box,
  Heading,
} from '@chakra-ui/react';
import { AppModal } from '../common/AppModal';

interface RestoreDataModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
}

const RestoreDataModal: React.FC<RestoreDataModalProps> = ({ isOpen, progress, status }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <AppModal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} isCentered>
      <ModalBody p={8}>
        <VStack spacing={6} align="center" py={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Heading size="md" textAlign="center">
            Đang khôi phục dữ liệu
          </Heading>
          <Text textAlign="center">
            {status}
          </Text>
          <Box w="full" px={4}>
            <Progress
              value={progress}
              size="md"
              colorScheme="blue"
              borderRadius="full"
              hasStripe
              isAnimated
            />
            <Text mt={2} textAlign="center" fontSize="sm">
              {progress}%
            </Text>
          </Box>
        </VStack>
      </ModalBody>
    </AppModal>
  );
};

export default RestoreDataModal; 