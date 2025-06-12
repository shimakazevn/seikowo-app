import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Grid,
  GridItem,
  VStack,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { usePostData } from '../hooks/usePostData';
import { useMangaDetection } from '../hooks/useMangaDetection';
import { usePostNavigation } from '../hooks/usePostNavigation';
import { ErrorAlert, NotFoundAlert } from '../components/PostPage/ErrorAlert';
import { PageLoader } from '../components/PostPage/PageLoader';
import EnhancedPostHeader from '../components/PostPage/EnhancedPostHeader';
import EnhancedPostContent from '../components/PostPage/EnhancedPostContent';
import EnhancedPostSidebar from '../components/PostPage/EnhancedPostSidebar';
import EnhancedMangaPostPage from '../components/PostPage/EnhancedMangaPostPage';
import BackgroundPattern from '../components/BackgroundPattern';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';
import { Post, PostContentProps } from '../types/post';

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const realPost = post?.data ? post.data : post;
  const { userId, isAuthenticated } = useUserStore();
  const {
    initialize: initializeStore,
    toggleBookmark: storeToggleBookmark,
  } = useFavoriteBookmarkStore();
  const {
    handleReadManga,
    handleTagSelect,
    handleBackToHome,
    showToast
  } = usePostNavigation();

  // Initialize store
  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

  // Early return if no valid post data
  if (!realPost || !realPost.title) {
    return <NotFoundAlert />;
  }

  const {
    mangaImages,
    isMangaPost,
    hasDetectedManga,
    getCoverImage,
    extractLanguage
  } = useMangaDetection(realPost);

  // Render nothing or a loader until manga detection is complete
  if (!hasDetectedManga) {
    return <PageLoader />;
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Cần đăng nhập',
        description: 'Bạn cần đăng nhập để bookmark bài viết',
        status: 'warning'
      });
      return;
    }

    try {
      const mangaData = {
        id: realPost.id,
        title: realPost.title,
        url: realPost.url,
        currentPage: 1,
        totalPages: 1,
        verticalMode: false,
        timestamp: Date.now(),
      };

      await storeToggleBookmark(mangaData, userId || '', '', showToast);
    } catch (error) {
      console.error('Bookmark error:', error);
      showToast({
        title: 'Lỗi',
        description: 'Không thể bookmark bài viết',
        status: 'error'
      });
    }
  };

  if (isMangaPost) {
    return (
      <EnhancedMangaPostPage
        title={realPost.title}
        coverImage={getCoverImage()}
        images={mangaImages}
        publishedDate={realPost.published}
        tags={realPost.labels || []}
        language={extractLanguage()}
        author="Admin"
        postId={realPost.id}
        url={realPost.url || window.location.href}
        onRead={handleReadManga}
        onBookmark={handleBookmark}
      />
    );
  }

  return (
    <Box position="relative" width="100%">
      <BackgroundPattern variant="dots" opacity={0.03} />
      <Grid
        templateColumns={{ base: '1fr', xl: '1fr 350px' }}
        gap={8}
        width="100%"
        position="relative"
        zIndex={1}
      >
        {/* Main Content Column */}
        <GridItem>
          <VStack spacing={8} align="stretch">
            <EnhancedPostHeader
              title={realPost.title || 'Untitled'}
              publishedDate={realPost.published}
              author="Admin"
              showTagFilter={true}
              onTagSelect={handleTagSelect}
            />

            <EnhancedPostContent
              content={realPost.content || ''}
            />

            <Button
              leftIcon={<ArrowBackIcon />}
              as={Link}
              to="/"
              colorScheme="blue"
              variant="outline"
              size="lg"
              alignSelf="flex-start"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
              onClick={handleBackToHome}
            >
              Quay lại trang chủ
            </Button>
          </VStack>
        </GridItem>

        {/* Sidebar Column */}
        <GridItem display={{ base: 'none', xl: 'block' }}>
          <EnhancedPostSidebar
            stats={{
              likes: Math.floor(Math.random() * 500) + 50,
              comments: Math.floor(Math.random() * 100) + 10,
              bookmarks: Math.floor(Math.random() * 200) + 20,
              readingTime: Math.ceil((realPost.content?.length || 0) / 1000),
              publishedDate: realPost.published,
            }}
            tags={realPost.labels || []}
            author="Admin"
            onBookmark={handleBookmark}
          />
        </GridItem>
      </Grid>
    </Box>
  );
};

const PostPage: React.FC = () => {
  const { post, loading, error } = usePostData();

  return (
    <Container
      maxW="100%"
      py={8}
      px={{ base: 4, md: 8, lg: 16, xl: 32 }}
      mx="auto"
      centerContent
    >
      <Box maxW="1400px" w="100%">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : !post ? (
          <NotFoundAlert />
        ) : (
          <PostContent post={post} />
        )}
      </Box>
    </Container>
  );
};

export default PostPage;