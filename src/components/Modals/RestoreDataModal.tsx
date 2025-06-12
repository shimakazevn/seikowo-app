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

interface RestoreDataModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
}

const RestoreDataModal: React.FC<RestoreDataModalProps> = ({ isOpen, progress, status }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnOverlayClick={false} isCentered>
      <ModalOverlay backdropFilter="blur(12px) saturate(180%)" bg="blackAlpha.400" />
      <ModalContent
        bg={bgColor}
        maxW={{ base: "90%", md: "500px" }}
        minH="280px"
        mx={4}
        borderRadius="2xl"
        boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        position="relative"
        overflow="hidden"
      >
        <ModalBody p={8}>
          <VStack spacing={6} align="center" py={8}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Heading size="md" textAlign="center" color={textColor}>
              Đang khôi phục dữ liệu
            </Heading>
            <Text color={textColor} textAlign="center">
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
              <Text mt={2} textAlign="center" fontSize="sm" color={textColor}>
                {progress}%
              </Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RestoreDataModal; 