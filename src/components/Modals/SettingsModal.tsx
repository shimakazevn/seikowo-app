import React, { memo, useCallback, useState, useEffect } from 'react';
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
  Text,
  Button,
  HStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Divider,
  UseToastOptions,
} from '@chakra-ui/react';
import { DownloadIcon, DeleteIcon } from '@chakra-ui/icons';
import { backupUserData, deleteUserData } from '../../api/auth';
import { handleError } from '../../api';
import { getHistoryData, saveHistoryData, getUserData } from '../../utils/indexedDBUtils';
import { FOLLOW_KEY, MANGA_KEY } from '../../utils/userUtils';
import useUserStore from '../../store/useUserStore';
import { useToast } from '@chakra-ui/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  [key: string]: any;
}

interface MangaBookmark {
  [key: string]: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [restoring, setRestoring] = useState(false);
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const { userId, hasAccessToken, accessToken } = useUserStore();
  const toast = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [mangaBookmarks, setMangaBookmarks] = useState<MangaBookmark[]>([]);

  // Debug logs
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = userId ? await getUserData(userId) : null;
        setUserData(userData);
        const mangaBookmarks = userId ? await getHistoryData('bookmarks', userId) : [];
        setMangaBookmarks(mangaBookmarks);
      } catch (error: any) {
        console.error('Error loading user data:', error);
      }
    };

    if (userId && userId !== 'guest') {
      loadUserData();
    }
  }, [userId]);

  const syncWithDrive = useCallback(async () => {
    if (!hasAccessToken || !userId || userId === 'guest') {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setRestoring(true);
      // Get current data from IndexedDB
      const readPosts = userId ? await getHistoryData('reads', userId) : [];
      const favoritePosts = await getHistoryData('favorites', userId);
      const data = { readPosts, favoritePosts, mangaBookmarks };
      await backupUserData(accessToken || "", userId || "", data);
      toast({
        title: "Thành công",
        description: "Đã sao lưu dữ liệu lên Google Drive",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      handleError(error);
    } finally {
      setRestoring(false);
    }
  }, [hasAccessToken, userId, mangaBookmarks, toast, accessToken]);

  const handleClearAllData = useCallback(async () => {
    if (!hasAccessToken || !userId || userId === 'guest') {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setRestoring(true);
      // Delete from Google Drive first
      await deleteUserData(accessToken || "", userId || "");

      // Clear from IndexedDB
      userId ? await saveHistoryData('favorites', userId, []) : Promise.resolve();
      userId ? await saveHistoryData('bookmarks', userId, []) : Promise.resolve();
      userId ? await saveHistoryData('reads', userId, []) : Promise.resolve();

      // Clear user data from IndexedDB
      userId ? await saveHistoryData('userData', userId, null) : Promise.resolve();

      toast({
        title: "Thành công",
        description: "Đã xóa toàn bộ dữ liệu",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onConfirmClose();
    } catch (error: any) {
      handleError(error);
    } finally {
      setRestoring(false);
    }
  }, [hasAccessToken, userId, toast, onConfirmClose, accessToken]);

  // Add effect to handle scrollbar
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const text2Color = useColorModeValue('gray.700', 'gray.500');

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
              {/* Data Management Section */}
              <Box>
                <Heading size="md" mb={4}>Quản lý dữ liệu</Heading>

                <VStack spacing={4} align="stretch">
                  {/* Backup Section */}
                  <Box
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor="gray.200"
                    bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
                    _hover={{ bg: useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)") }}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="medium" color={textColor}>Sao lưu dữ liệu</Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            Sao lưu dữ liệu bookmark lên Google Drive
                          </Text>
                        </Box>
                        <Button
                          colorScheme="green"
                          onClick={syncWithDrive}
                          isLoading={restoring}
                          loadingText="Đang backup..."
                          leftIcon={<DownloadIcon />}
                          variant="solid"
                          size="md"
                        >
                          Backup
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Clear Data Section */}
                  <Box
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor="gray.200"
                    bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
                    _hover={{ bg: useColorModeValue("rgba(255,255,255,0.68)", "rgba(26,32,44,0.68)") }}
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Box>
                          <Text fontWeight="medium" color={textColor}>Xóa dữ liệu</Text>
                          <Text fontSize="sm" color={mutedTextColor}>
                            Xóa toàn bộ dữ liệu bookmark trên Drive và local
                          </Text>
                        </Box>
                        <Button
                          colorScheme="red"
                          onClick={onConfirmOpen}
                          leftIcon={<DeleteIcon />}
                          variant="solid"
                          size="md"
                        >
                          Xóa dữ liệu
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        blockScrollOnMount={true}
        preserveScrollBarGap={true}
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          backdropFilter="blur(30px)"
          bg={useColorModeValue("rgba(255, 255, 255, 0.48)", "rgba(26, 32, 44, 0.48)")}
          borderRadius="xl"
          boxShadow="xl"
        >
          <ModalHeader>Xác nhận xóa dữ liệu</ModalHeader>
          <ModalCloseButton />
          <Divider />
          <ModalBody>
            <Alert status="warning" mb={4} borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Chú ý!</AlertTitle>
                <AlertDescription>
                  Hành động này sẽ xóa toàn bộ dữ liệu bookmark của bạn trên cả Google Drive và máy tính. Hành động này không thể hoàn tác.
                </AlertDescription>
              </Box>
            </Alert>
            <Text color={textColor}>Bạn có chắc chắn muốn tiếp tục?</Text>
          </ModalBody>
          <Divider />
          <Box p={4} display="flex" justifyContent="flex-end" gap={3}>
            <Button variant="ghost" onClick={onConfirmClose}>
              Hủy
            </Button>
            <Button
              colorScheme="red"
              onClick={handleClearAllData}
              isLoading={restoring}
              loadingText="Đang xóa..."
            >
              Xóa dữ liệu
            </Button>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default memo(SettingsModal);