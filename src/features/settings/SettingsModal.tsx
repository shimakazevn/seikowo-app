import React, { memo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  Box,
  Heading,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { BackupSection } from './BackupSection';
import { ClearDataSection } from './ClearDataSection';
import { ConfirmClearDataModal } from './ConfirmClearDataModal';
import { useUserDataManagement } from '../../hooks/useUserDataManagement';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useDisclosure } from '@chakra-ui/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { 
    isLoading, 
    backupToGoogleDrive, 
    clearAllUserData 
  } = useUserDataManagement();
  
  const {
    isOpen: isConfirmOpen,
    onOpen: onConfirmOpen,
    onClose: onConfirmClose
  } = useDisclosure();

  // Lock body scroll when modal is open
  useBodyScrollLock(isOpen);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        isCentered
        scrollBehavior="inside"
        blockScrollOnMount={true}
        preserveScrollBarGap={false}
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          backdropFilter="blur(30px)"
          bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
          borderRadius="xl"
          boxShadow="xl"
          maxW="800px"
          mx={4}
          maxH="80vh"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>Cài đặt</ModalHeader>
          <ModalCloseButton />
          <Divider />
          <ModalBody>
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="md" mb={4}>Quản lý dữ liệu</Heading>
                <VStack spacing={4} align="stretch">
                  <BackupSection 
                    onBackup={backupToGoogleDrive}
                    isLoading={isLoading}
                  />
                  <ClearDataSection onClearData={onConfirmOpen} />
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmClearDataModal
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        onConfirm={clearAllUserData}
        isLoading={isLoading}
      />
    </>
  );
};

export default memo(SettingsModal);
