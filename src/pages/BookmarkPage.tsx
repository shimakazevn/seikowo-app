import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Heading, VStack, Text, SimpleGrid, GridItem, useColorModeValue, Skeleton, Alert, AlertIcon, AlertTitle, AlertDescription, Button, useToast } from '@chakra-ui/react';
import HistoryCard from '../components/ListItemCard';
import Pagination from '../components/HomePage/Pagination';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';

interface Bookmark {
  id: string;
  timestamp: number;
  currentPage: number;
  totalPages: number;
  [key: string]: any;
}

// Update the grid sections to use VStack instead
const LoadingSkeleton: React.FC = () => (
  <VStack spacing={4} align="stretch" width="100%">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} height="180px" borderRadius="lg" />
    ))} </VStack>
);

const BookmarkPage: React.FC = () => {
  const { userId, accessToken, initializeUser } = useUserStore();
  const { bookmarks, loading: storeLoading, error: storeError, initialize: initializeStore } = useFavoriteBookmarkStore();
  const [storeReady, setStoreReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'white');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const PAGE_SIZE = 9;
  const [bookmarkPage, setBookmarkPage] = useState<number>(1);

  // Initialize store
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing BookmarkPage...');
        if (typeof initializeUser === 'function') {
          const success = await initializeUser();
          console.log('Store initialization result:', success);
        }
        if (userId && userId !== 'guest') {
          await initializeStore(userId);
        }
        setStoreReady(true);
      } catch (error: any) {
        console.error('Error initializing store:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể khởi tạo dữ liệu người dùng',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    init();
  }, [initializeUser, userId, initializeStore, toast]);

  // Check authentication
  useEffect(() => {
    if (storeReady) {
      console.log('Store ready, checking auth state:', {
        hasUserId: !!userId,
        hasAccessToken: !!accessToken
      });

      if (!userId || !accessToken) {
        console.log('Missing auth data, redirecting to home');
        toast({
          title: 'Lỗi xác thực',
          description: 'Vui lòng đăng nhập để xem trang này',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/', { replace: true });
      }
    }
  }, [storeReady, userId, accessToken, navigate, toast]);

  if (!storeReady) return null;

  if (storeError) {
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
            {storeError}
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
          {storeLoading ? (
            <LoadingSkeleton />
          ) : bookmarks.length > 0 ? (
            <>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {bookmarks.slice((bookmarkPage-1)*PAGE_SIZE, bookmarkPage*PAGE_SIZE).map((bookmark: any) => (
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
                ))} </SimpleGrid>
              <Pagination
                currentPage={bookmarkPage}
                totalPages={Math.ceil(bookmarks.length / PAGE_SIZE)}
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
};

export default BookmarkPage;