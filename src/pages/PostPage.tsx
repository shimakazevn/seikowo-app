import React, { useEffect, useCallback, useState } from 'react';
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
import PostHeader from '../components/PostPage/PostView/Header';
import PostView from '../components/PostPage/PostView';
import PostSidebar from '../components/PostPage/PostView/Sidebar';
import MangaView from '../components/PostPage/MangaView';
import BackgroundPattern from '../components/BackgroundPattern';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';
import { Post, PostContentProps } from '../types/post';
import PageLoader from '../components/layout/PageLoader';
import NativeBloggerComments from '../components/features/Comments/NativeBloggerComments';
import { blogConfig } from '../config';

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

  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const {
    mangaImages,
    isMangaPost,
    hasDetectedManga,
    getCoverImage,
    extractLanguage
  } = useMangaDetection(realPost || {});

  // const preloadImages = useCallback((startIndex: number, count: number = 3) => {
  //   if (!mangaImages?.length) return;
    
  //   const newLoadedImages = new Set(loadedImages);
  //   let hasNewImages = false;
    
  //   // Preload next few images
  //   for (let i = 0; i < count; i++) {
  //     const index = startIndex + i;
  //     if (index >= 0 && index < mangaImages.length && !loadedImages.has(index)) {
  //       const img = new Image();
  //       img.src = mangaImages[index];
  //       newLoadedImages.add(index);
  //       hasNewImages = true;
  //     }
  //   }
    
  //   // Only update state if we actually loaded new images
  //   if (hasNewImages) {
  //     setLoadedImages(newLoadedImages);
  //   }
  // }, [mangaImages, loadedImages]);

  // Initialize store
  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

  // Load current page and preload next pages
  // useEffect(() => {
  //   if (mangaImages?.length > 0) {
  //     // Load current page
  //     preloadImages(currentPage, 1);
      
  //     // Preload next 2 pages
  //     preloadImages(currentPage + 1, 2);
  //   }
  // }, [currentPage, mangaImages, preloadImages]);

  // Early return if no valid post data
  if (!realPost || !realPost.title) {
    return <NotFoundAlert />;
  }

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
      <MangaView
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
            <PostHeader
              title={realPost.title || 'Untitled'}
              publishedDate={realPost.published}
              author="Admin"
              showTagFilter={true}
              onTagSelect={handleTagSelect}
            />

            <PostView
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
          <PostSidebar
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
          <>
            <PostContent post={post} />
            {/* Comments Section - Mobile Optimized */}
            <Box >
              <Box p={{ base: 2, md: 4 }}>
                <NativeBloggerComments
                  postId={post?.id || ''}
                  blogId={blogConfig.blogId}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default PostPage;