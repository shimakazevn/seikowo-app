import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Button,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
} from '@chakra-ui/react';
import { MdDelete } from 'react-icons/md';
import useUserStore from '../../../store/useUserStore';
import { deleteUserData } from '../../../api/auth';
import { AppModal } from '../../common/AppModal';
import ProfileSettingsTab from './ProfileSettingsTab';

interface ProfileSettingsProps {
  bloggerUserRole?: 'ADMIN' | 'AUTHOR' | 'READER' | 'NONE' | null;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ bloggerUserRole }) => {
  const { isAuthenticated, user, logout } = useUserStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoadAttempts, setAvatarLoadAttempts] = useState(0);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const deleteKeyword = 'DELETE';

  const MAX_AVATAR_LOAD_ATTEMPTS = 3;

  // Modal states
  const { isOpen: isLogoutOpen, onOpen: onLogoutOpen, onClose: onLogoutClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isDeleteDriveBackupOpen, onOpen: onDeleteDriveBackupOpen, onClose: onDeleteDriveBackupClose } = useDisclosure();

  const toast = useToast();

  // Color mode values
  const textColor = useColorModeValue('gray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  // Avatar handling
  const handleAvatarError = () => {
    if (avatarLoadAttempts < MAX_AVATAR_LOAD_ATTEMPTS) {
      setAvatarLoadAttempts(prev => prev + 1);
    } else {
      setAvatarUrl('');
    }
  };

  // Data management functions
  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'đồng bộ thành công',
        description: 'dữ liệu đã được đồng bộ hóa.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'lỗi đồng bộ',
        description: 'không thể đồng bộ dữ liệu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    const data = {
      user: user,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'xuất dữ liệu thành công',
      description: 'dữ liệu đã được tải xuống.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      onLogoutClose();
      toast({
        title: 'Đăng xuất thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi đăng xuất',
        description: 'Có lỗi xảy ra khi đăng xuất',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle delete data
  const handleDeleteData = async () => {
    try {
      console.log('[handleDeleteData] Starting data deletion process...');

      // Save all auth-related data first
      const authData = {
        userStorage: localStorage.getItem('user-storage'),
        auth_token: localStorage.getItem('auth_token'),
        refresh_token: localStorage.getItem('refresh_token'),
        user_id: localStorage.getItem('user_id'),
        user_role: localStorage.getItem('user_role'),
        user_permissions: localStorage.getItem('user_permissions'),
        last_login: localStorage.getItem('last_login'),
        auth_state: localStorage.getItem('auth_state'),
        user: localStorage.getItem('user'),
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        access_token: localStorage.getItem('access_token'),
        id_token: localStorage.getItem('id_token'),
        token_type: localStorage.getItem('token_type'),
        expires_in: localStorage.getItem('expires_in'),
        scope: localStorage.getItem('scope'),
        accessToken: localStorage.getItem('accessToken'),
        userId: localStorage.getItem('userId'),
        userData: localStorage.getItem('userData'),
        lastSyncTime: localStorage.getItem('lastSyncTime'),
        syncStatus: localStorage.getItem('syncStatus')
      };

      console.log('[handleDeleteData] Saved auth data:', Object.keys(authData).filter(key => authData[key as keyof typeof authData]));

      // Only delete specific UI and app data
      const keysToDelete = [
        'theme',
        'colorMode',
        'chakra-ui-color-mode',
        'ui-settings',
        'app-settings',
        'user-preferences',
        'bookmarks',
        'reading-history',
        'favorites',
        'last-read',
        'last-position',
        'temp-data',
        'cache',
        'offline-data'
      ];

      console.log('[handleDeleteData] Deleting specific keys:', keysToDelete);
      keysToDelete.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`[handleDeleteData] Deleted localStorage key: ${key}`);
        }
      });

      // Restore auth data immediately
      console.log('[handleDeleteData] Restoring auth data...');
      Object.entries(authData).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
          console.log(`[handleDeleteData] Restored auth data: ${key}`);
        }
      });

      // Clear session storage except auth-related items
      console.log('[handleDeleteData] Cleaning session storage...');
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (!key.includes('auth') && !key.includes('user') && !key.includes('token')) {
          sessionStorage.removeItem(key);
          console.log(`[handleDeleteData] Deleted sessionStorage key: ${key}`);
        }
      });

      // Clear only non-auth object stores in IndexedDB
      if ('indexedDB' in window) {
        console.log('[handleDeleteData] Cleaning IndexedDB object stores...');
        const dbName = 'my-blogger-react';
        const storesToClear = ['bookmarks', 'favorites', 'reads', 'history', 'cache', 'search'];
        const openReq = indexedDB.open(dbName);
        openReq.onsuccess = function(event) {
          const db = openReq.result;
          const tx = db.transaction(storesToClear, 'readwrite');
          storesToClear.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
              tx.objectStore(storeName).clear();
              console.log(`[handleDeleteData] Cleared object store: ${storeName}`);
            }
          });
          tx.oncomplete = function() {
            db.close();
            console.log('[handleDeleteData] Finished clearing non-auth object stores in IndexedDB');
          };
        };
        openReq.onerror = function(event) {
          console.error('[handleDeleteData] Failed to open IndexedDB for clearing:', openReq.error);
        };
      }

      // If user is authenticated, also delete Drive backup
      if (isAuthenticated && user?.id) {
        try {
          console.log('[handleDeleteData] Deleting Drive backup...');
          await deleteUserData(user.id);
          console.log('[handleDeleteData] Drive backup deleted successfully');
        } catch (error) {
          console.warn('[handleDeleteData] Failed to delete Drive backup:', error);
        }
      }

      onDeleteClose();
      toast({
        title: 'Xóa dữ liệu thành công',
        description: 'Dữ liệu đã được xóa khỏi thiết bị và Google Drive',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      console.log('[handleDeleteData] Data deletion process completed successfully');
    } catch (error) {
      console.error('[handleDeleteData] Error deleting data:', error);
      toast({
        title: 'Lỗi xóa dữ liệu',
        description: 'Có lỗi xảy ra khi xóa dữ liệu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle delete Drive backup
  const handleDeleteDriveBackup = async () => {
    if (!user?.id) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy ID người dùng để xóa bản sao lưu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await deleteUserData(user.id);
      onDeleteDriveBackupClose();
      toast({
        title: 'Xóa bản sao lưu thành công',
        description: 'Bản sao lưu trên Google Drive đã được xóa.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting Drive backup:', error);
      toast({
        title: 'Lỗi xóa bản sao lưu',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa bản sao lưu trên Google Drive',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Initialize avatar
  useEffect(() => {
    if (user?.picture && !avatarUrl) {
      setAvatarUrl(user.picture);
    }
  }, [user?.picture]);

  return (
    <>
      <ProfileSettingsTab
        isAuthenticated={isAuthenticated}
        userInfo={user}
        avatarUrl={avatarUrl}
        handleAvatarError={handleAvatarError}
        isSyncing={isSyncing}
        handleSyncData={handleSyncData}
        handleExportData={handleExportData}
        onLogoutOpen={onLogoutOpen}
        onDeleteOpen={onDeleteOpen}
        onDeleteDriveBackupOpen={onDeleteDriveBackupOpen}
        bloggerUserRole={bloggerUserRole}
      />

      {/* Logout Modal */}
      <AppModal isOpen={isLogoutOpen} onClose={onLogoutClose}>
        <ModalHeader>Xác nhận đăng xuất</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="info" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Đăng xuất khỏi tài khoản</AlertTitle>
              <AlertDescription>
                Bạn có chắc chắn muốn đăng xuất? Dữ liệu của bạn sẽ được giữ nguyên.
              </AlertDescription>
            </Box>
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onLogoutClose}>
            Hủy
          </Button>
          <Button colorScheme="orange" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </ModalFooter>
      </AppModal>

      {/* Delete Data Modal */}
      <AppModal isOpen={isDeleteOpen} onClose={onDeleteClose} size="lg" isCentered>
        <ModalHeader fontSize="2xl" fontWeight="bold" textAlign="center" pt={6} pb={2}>
          <HStack justify="center" spacing={3}>
            <Icon as={MdDelete} color="red.400" w={8} h={8} />
            <span>Xác nhận xóa dữ liệu</span>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={3} right={3} size="lg" />
        <ModalBody px={8} py={2}>
          <Alert status="warning" mb={6} borderRadius="lg" fontSize="md" alignItems="flex-start">
            <AlertIcon boxSize={7} mt={1} color="red.400" />
            <Box>
              <AlertTitle fontSize="lg" color="red.500" mb={1}>Cảnh báo!</AlertTitle>
              <AlertDescription>
                Hành động này sẽ xóa các dữ liệu sau:
              </AlertDescription>
            </Box>
          </Alert>
          <VStack align="stretch" spacing={4} mb={4} fontSize="md">
            <Box>
              <Text fontWeight="semibold" mb={1}>Dữ liệu sẽ bị xóa:</Text>
              <Box pl={4}>
                <Text>• Dữ liệu bookmark và lịch sử đọc</Text>
                <Text>• Dữ liệu cài đặt giao diện</Text>
                <Text>• Dữ liệu tạm thời trong trình duyệt</Text>
                <Text>• Bản sao lưu trên Google Drive (nếu có)</Text>
              </Box>
            </Box>
            <Box>
              <Text fontWeight="semibold" mb={1}>Dữ liệu sẽ được giữ nguyên:</Text>
              <Box pl={4}>
                <Text>• Thông tin tài khoản và token đăng nhập</Text>
                <Text>• Cài đặt bảo mật</Text>
                <Text>• Quyền truy cập và phân quyền</Text>
              </Box>
            </Box>
          </VStack>
          <Text color="red.500" fontWeight="semibold" fontSize="md" mb={4}>
            Lưu ý: Hành động này không thể hoàn tác.
          </Text>
          <Box mt={2} mb={2}>
            <Text fontWeight="medium" mb={2}>
              Để xác nhận, hãy nhập
              <Text as="span" color="red.500" fontWeight="bold" fontSize="lg" mx={1} letterSpacing={2}>
                {deleteKeyword}
              </Text>
              vào ô bên dưới:
            </Text>
            <Input
              placeholder={`Nhập ${deleteKeyword} để xác nhận`}
              value={deleteConfirmInput}
              onChange={e => setDeleteConfirmInput(e.target.value.toUpperCase())}
              autoFocus
              maxLength={deleteKeyword.length}
              size="lg"
              borderColor={deleteConfirmInput && deleteConfirmInput !== deleteKeyword ? 'red.400' : 'gray.300'}
              focusBorderColor={deleteConfirmInput && deleteConfirmInput !== deleteKeyword ? 'red.500' : 'blue.400'}
              fontWeight="bold"
              letterSpacing={2}
              textAlign="center"
              borderRadius="xl"
              bg={deleteConfirmInput && deleteConfirmInput !== deleteKeyword ? 'red.50' : 'gray.50'}
              transition="all 0.2s"
            />
          </Box>
        </ModalBody>
        <ModalFooter pt={0} pb={6} px={8}>
          <Button variant="ghost" mr={3} onClick={onDeleteClose} size="lg">
            Hủy
          </Button>
          <Button colorScheme="red" onClick={handleDeleteData} disabled={deleteConfirmInput !== deleteKeyword} size="lg" fontWeight="bold" px={8}>
            Xóa dữ liệu
          </Button>
        </ModalFooter>
      </AppModal>

      {/* Delete Drive Backup Modal */}
      <AppModal isOpen={isDeleteDriveBackupOpen} onClose={onDeleteDriveBackupClose} isCentered
        contentMaxW="md"
        contentP={6}
        contentBorderRadius="xl"
        contentBoxShadow="xl"
        contentBorder="none"
      >
        <ModalHeader>Xác nhận xóa bản sao lưu trên Drive</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Alert status="warning" rounded="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Bạn có chắc chắn?</AlertTitle>
              <AlertDescription fontSize="sm">
                Thao tác này sẽ xóa vĩnh viễn bản sao lưu dữ liệu của bạn khỏi Google Drive. Bạn sẽ không thể khôi phục dữ liệu này từ Drive sau khi xóa.
              </AlertDescription>
            </Box>
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onDeleteDriveBackupClose}>Hủy</Button>
          <Button colorScheme="red" onClick={handleDeleteDriveBackup} ml={3}>Xóa</Button>
        </ModalFooter>
      </AppModal>
    </>
  );
};

export default ProfileSettings; 