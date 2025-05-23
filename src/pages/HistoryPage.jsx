import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, VStack, Text, Divider, Tabs, TabList, TabPanels, Tab, TabPanel, Button, HStack, Skeleton, Alert, AlertIcon, AlertTitle, AlertDescription, useToast, Icon, SimpleGrid, GridItem, useColorModeValue, IconButton, Tooltip } from '@chakra-ui/react';
import { LockIcon, RepeatIcon, DownloadIcon, DeleteIcon } from '@chakra-ui/icons';
import { backupUserData, restoreUserData, deleteUserData } from '../components/GoogleDriveLogin';
import HistoryCard from '../components/History/HistoryCard';
import { READ_KEY, FOLLOW_KEY, MANGA_KEY, LAST_SYNC_KEY, getHistoryData, saveHistoryData, shouldSync } from '../utils/historyUtils';
import Pagination from '../components/HomePage/Pagination';

// Update the grid sections to use VStack instead
const LoadingSkeleton = () => (
  <VStack spacing={4} align="stretch" width="100%">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} height="180px" borderRadius="lg" />
    ))}
  </VStack>
);

function UserHistoryPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [readPosts, setReadPosts] = useState([]);
  const [followPosts, setFollowPosts] = useState([]);
  const [mangaBookmarks, setMangaBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const toast = useToast();

  // Get current userId from localStorage
  const currentUserId = localStorage.getItem('google_user_id') || 'guest';
  const accessToken = localStorage.getItem('furina_water');
  const isGuestMode = userId === 'guest';

  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  // Pagination state
  const PAGE_SIZE = 9;
  const [readPage, setReadPage] = useState(1);
  const [followPage, setFollowPage] = useState(1);
  const [bookmarkPage, setBookmarkPage] = useState(1);

  // Function to merge arrays of objects by id
  const mergeArrays = (localArray, driveArray, timestampKey) => {
    const merged = [...localArray];
    const existingIds = new Set(localArray.map(item => item.id));
    const changes = {
      added: [],
      updated: [],
      unchanged: []
    };

    driveArray.forEach(driveItem => {
      const localItem = localArray.find(item => item.id === driveItem.id);
      if (!localItem) {
        // Add new item from drive
        merged.push(driveItem);
        changes.added.push(driveItem);
      } else {
        // Keep the more recent version
        const localTime = localItem[timestampKey] || 0;
        const driveTime = driveItem[timestampKey] || 0;
        if (driveTime > localTime) {
          const index = merged.findIndex(item => item.id === driveItem.id);
          merged[index] = driveItem;
          changes.updated.push(driveItem);
        } else {
          changes.unchanged.push(localItem);
        }
      }
    });

    return { merged, changes };
  };

  // Function to sync with drive
  const syncWithDrive = useCallback(async (force = false) => {
    if (!accessToken || !userId) {
      toast({
        title: 'Lỗi đồng bộ',
        description: 'Vui lòng đăng nhập để đồng bộ dữ liệu',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      setRestoring(true);
      console.log('Starting backup process...');
      
      // Get current local data
      const localReadPosts = getHistoryData(READ_KEY, userId);
      const localFollowPosts = getHistoryData(FOLLOW_KEY, userId);
      const localMangaBookmarks = getHistoryData(MANGA_KEY, userId);

      console.log('Local data to backup:', {
        readPosts: localReadPosts.length,
        followPosts: localFollowPosts.length,
        mangaBookmarks: localMangaBookmarks.length
      });

      // Prepare data for backup
      const backupData = {
        userId,
        timestamp: Date.now(),
        readPosts: localReadPosts,
        followPosts: localFollowPosts,
        mangaBookmarks: localMangaBookmarks
      };
      
      try {
        await backupUserData(accessToken, userId, backupData);
        console.log('Backup successful');
        
        toast({
          title: 'Đã sao lưu dữ liệu lên Drive',
          description: `Đã sao lưu ${localReadPosts.length} bài đọc, ${localFollowPosts.length} bài theo dõi, ${localMangaBookmarks.length} bookmark`,
          status: 'success',
          duration: 3000,
        });

        // Update last sync time
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      } catch (backupError) {
        console.error('Error backing up data:', backupError);
        toast({
          title: 'Lỗi khi sao lưu dữ liệu',
          description: backupError.message,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast({
        title: 'Lỗi khi đồng bộ dữ liệu',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setRestoring(false);
    }
  }, [accessToken, userId, toast]);

  // Function to auto backup data to drive
  const autoBackupToDrive = useCallback(async () => {
    if (!accessToken || !userId || isGuestMode) return;

    try {
      const localReadPosts = getHistoryData(READ_KEY, userId);
      const localFollowPosts = getHistoryData(FOLLOW_KEY, userId);
      const localMangaBookmarks = getHistoryData(MANGA_KEY, userId);

      const backupData = {
        userId,
        timestamp: Date.now(),
        readPosts: localReadPosts,
        followPosts: localFollowPosts,
        mangaBookmarks: localMangaBookmarks
      };

      await backupUserData(accessToken, userId, backupData);
      console.log('Auto backup successful');
    } catch (error) {
      console.error('Auto backup error:', error);
    }
  }, [accessToken, userId, isGuestMode]);

  // Set up auto backup interval
  useEffect(() => {
    if (!isGuestMode && accessToken) {
      // Initial backup
      autoBackupToDrive();
      
      // Set up interval for auto backup
      const intervalId = setInterval(autoBackupToDrive, 60000); // 60000ms = 1 minute
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [autoBackupToDrive, isGuestMode, accessToken]);

  // Load history data
  useEffect(() => {
    // Debug logging
    console.log('Current URL userId:', userId);
    console.log('localStorage userId:', currentUserId);
    console.log('isGuestMode:', isGuestMode);
    console.log('accessToken exists:', !!accessToken);

    // Check access permission with more detailed error message
    if (userId !== currentUserId && !isGuestMode) {
      setError(`Không thể truy cập lịch sử. URL userId: ${userId}, Current userId: ${currentUserId}`);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load history data directly from storage
      const readHistory = getHistoryData(READ_KEY, userId);
      const followHistory = getHistoryData(FOLLOW_KEY, userId);
      const bookmarks = getHistoryData(MANGA_KEY, userId);

      console.log('Loaded data:', {
        reads: readHistory.length,
        follows: followHistory.length,
        bookmarks: bookmarks.length
      });

      setReadPosts(readHistory);
      setFollowPosts(followHistory);
      setMangaBookmarks(bookmarks);

      // Show guest mode notice
      if (isGuestMode) {
        toast({
          title: 'Chế độ khách',
          description: 'Dữ liệu chỉ được lưu trên trình duyệt này. Đăng nhập để sao lưu dữ liệu lên Google Drive.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu lịch sử');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId, isGuestMode, toast, accessToken]);

  // Handle URL changes
  useEffect(() => {
    if (userId !== currentUserId && !isGuestMode) {
      navigate(`/u/${currentUserId}`);
    }
  }, [userId, currentUserId, isGuestMode, navigate]);

  const handleRestore = () => {
    if (restoring) return; // Prevent multiple clicks
    syncWithDrive(true);
  };

  const handleClearAllData = useCallback(async () => {
    if (!userId) return;

    try {
      // Clear Drive data if logged in
      if (accessToken && !isGuestMode) {
        await deleteUserData(accessToken, userId);
      }

      // Clear local storage data
      localStorage.removeItem(`history_read_posts_${userId}`);
      localStorage.removeItem(`history_follow_posts_${userId}`);
      localStorage.removeItem(`history_manga_bookmarks_${userId}`);
      localStorage.removeItem(LAST_SYNC_KEY);

      // Clear state
      setReadPosts([]);
      setFollowPosts([]);
      setMangaBookmarks([]);

      toast({
        title: 'Đã xóa toàn bộ dữ liệu',
        description: isGuestMode ? 'Dữ liệu local đã được xóa' : 'Dữ liệu trên Drive và local đã được xóa',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      console.error('Clear data error:', err);
      toast({
        title: 'Lỗi khi xóa dữ liệu',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [accessToken, userId, isGuestMode, toast]);

  if (error) {
    return (
      <Box maxW="800px" mx="auto" py={8} px={2}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Lỗi truy cập
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error}
          </AlertDescription>
          <Button
            as={RouterLink}
            to="/"
            colorScheme="blue"
            mt={4}
          >
            Quay lại trang chủ
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" py={8} px={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
          <Heading size="lg" mb={2}>
            {isGuestMode ? 'Lịch sử (Chế độ khách)' : 'Lịch sử của bạn'}
          </Heading>
          <HStack spacing={4}>
            {!isGuestMode && (
              <Button
                colorScheme="green"
                onClick={handleRestore}
                isLoading={restoring}
                loadingText="Đang backup..."
                leftIcon={<DownloadIcon />}
              >
                Backup
              </Button>
            )}
            <Button
              colorScheme="red"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu không? Hành động này không thể hoàn tác.')) {
                  handleClearAllData();
                }
              }}
              leftIcon={<DeleteIcon />}
            >
              Xóa toàn bộ dữ liệu
            </Button>
          </HStack>
        </HStack>

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Đã đọc ({readPosts.length})</Tab>
            <Tab>Theo dõi ({followPosts.length})</Tab>
            <Tab>Bookmark ({mangaBookmarks.length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0} pt={4}>
              {loading ? (
                <LoadingSkeleton />
              ) : readPosts.length > 0 ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {readPosts.slice((readPage-1)*PAGE_SIZE, readPage*PAGE_SIZE).map((post) => (
                      <GridItem key={`read_${post.id}`}>
                        <HistoryCard
                          post={post}
                          timestamp={post.readAt}
                          timestampLabel="Đọc lúc"
                          bg={cardBg}
                          textColor={textColor}
                          mutedTextColor={mutedTextColor}
                        />
                      </GridItem>
                    ))}
                  </SimpleGrid>
                  <Pagination
                    currentPage={readPage}
                    totalPages={Math.ceil(readPosts.length / PAGE_SIZE)}
                    onPageChange={setReadPage}
                    mutedTextColor={mutedTextColor}
                  />
                </>
              ) : (
                <Text color={mutedTextColor} textAlign="center" py={8}>
                  Chưa có bài viết nào được đọc
                </Text>
              )}
            </TabPanel>

            <TabPanel p={0} pt={4}>
              {loading ? (
                <LoadingSkeleton />
              ) : followPosts.length > 0 ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {followPosts.slice((followPage-1)*PAGE_SIZE, followPage*PAGE_SIZE).map((post) => (
                      <GridItem key={`follow_${post.id}`}>
                        <HistoryCard
                          post={post}
                          timestamp={post.followAt}
                          timestampLabel="Theo dõi lúc"
                          bg={cardBg}
                          textColor={textColor}
                          mutedTextColor={mutedTextColor}
                        />
                      </GridItem>
                    ))}
                  </SimpleGrid>
                  <Pagination
                    currentPage={followPage}
                    totalPages={Math.ceil(followPosts.length / PAGE_SIZE)}
                    onPageChange={setFollowPage}
                    mutedTextColor={mutedTextColor}
                  />
                </>
              ) : (
                <Text color={mutedTextColor} textAlign="center" py={8}>
                  Chưa có bài viết nào được theo dõi
                </Text>
              )}
            </TabPanel>

            <TabPanel p={0} pt={4}>
              {loading ? (
                <LoadingSkeleton />
              ) : mangaBookmarks.length > 0 ? (
                <>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {mangaBookmarks.slice((bookmarkPage-1)*PAGE_SIZE, bookmarkPage*PAGE_SIZE).map((bookmark) => (
                      <GridItem key={`bookmark_${bookmark.id}_${bookmark.currentPage}`}>
                        <HistoryCard
                          post={bookmark}
                          timestamp={bookmark.timestamp}
                          timestampLabel="Đánh dấu lúc"
                          currentPage={bookmark.currentPage}
                          totalPages={bookmark.totalPages}
                          bg={cardBg}
                          textColor={textColor}
                          mutedTextColor={mutedTextColor}
                        />
                      </GridItem>
                    ))}
                  </SimpleGrid>
                  <Pagination
                    currentPage={bookmarkPage}
                    totalPages={Math.ceil(mangaBookmarks.length / PAGE_SIZE)}
                    onPageChange={setBookmarkPage}
                    mutedTextColor={mutedTextColor}
                  />
                </>
              ) : (
                <Text color={mutedTextColor} textAlign="center" py={8}>
                  Chưa có manga nào được đánh dấu
                </Text>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}

export default UserHistoryPage; 