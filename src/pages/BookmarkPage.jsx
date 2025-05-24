import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Heading, VStack, Text, SimpleGrid, GridItem, useColorModeValue, Skeleton } from '@chakra-ui/react';
import HistoryCard from '../components/History/HistoryCard';
import { MANGA_KEY } from '../utils/userUtils';
import { getHistoryData } from '../utils/indexedDBUtils';
import Pagination from '../components/HomePage/Pagination';
import useUserStore from '../store/useUserStore';

// Update the grid sections to use VStack instead
const LoadingSkeleton = () => (
  <VStack spacing={4} align="stretch" width="100%">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} height="180px" borderRadius="lg" />
    ))}
  </VStack>
);

function BookmarkPage() {
  const [mangaBookmarks, setMangaBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user state from store
  const { userId, accessToken } = useUserStore();

  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  // Pagination state
  const PAGE_SIZE = 9;
  const [bookmarkPage, setBookmarkPage] = useState(1);

  // Load history data
  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        const bookmarks = await getHistoryData(MANGA_KEY, userId);
        setMangaBookmarks(bookmarks);
      } catch (err) {
        console.error('Error loading history:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu lịch sử');
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, [userId, accessToken]);

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
        <Heading size="lg" mb={2}>
          Bookmark của bạn
        </Heading>

        <Box>
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
        </Box>
      </VStack>
    </Box>
  );
}

export default BookmarkPage; 