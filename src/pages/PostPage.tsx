import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { blogConfig } from '../config';
import EnhancedPostHeader from '../components/PostPage/EnhancedPostHeader';
import EnhancedPostContent from '../components/PostPage/EnhancedPostContent';
import EnhancedPostSidebar from '../components/PostPage/EnhancedPostSidebar';
import EnhancedMangaPostPage from '../components/PostPage/EnhancedMangaPostPage';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  HStack,
  useColorModeValue,
  AspectRatio,
  Grid,
  GridItem,
  useDisclosure,
  Flex,
  Badge,
  Divider,
  useBreakpointValue,
  Center,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSlugFromUrl } from '../utils/blogUtils';
import { loadPost } from '../utils/postLoader';
import { clearCachedData, CACHE_KEYS } from '../utils/cache';
import useUserStore from '../store/useUserStore';
import useFavoriteBookmarkStore from '../store/useFollowBookmarkStore';
import FollowButton from '../components/FollowButton';
import { PostCover, TagList, PostInfo } from '../components/PostCard';
import BackgroundPattern from '../components/BackgroundPattern';

interface Post {
  id: string;
  title: string;
  content: string;
  published: string;
  url: string;
  labels?: string[];
  data?: Post;
}

interface PostContentProps {
  post: Post;
}

interface ErrorAlertProps {
  error: string;
}

const PageLoader: React.FC = () => (
  <Center h="50vh">
    <Spinner size="xl" color="blue.500" thickness="4px" />
  </Center>
);

// Helper function to analyze URL structure for manga patterns
const analyzeUrlStructure = (url: string, title: string) => {
  const analysis = {
    isMangaUrl: false,
    hasDateStructure: false,
    urlPattern: '',
    confidence: 0
  };

  if (!url) return analysis;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);

    // Check for date structure (year/month/slug)
    if (pathParts.length >= 3) {
      const [year, month, slug] = pathParts;

      // Validate year and month format
      const isValidYear = /^20\d{2}$/.test(year);
      const isValidMonth = /^(0[1-9]|1[0-2])$/.test(month);

      if (isValidYear && isValidMonth) {
        analysis.hasDateStructure = true;
        analysis.confidence += 20;

        // Check slug patterns for manga
        const slugLower = slug.toLowerCase();
        const mangaPatterns = [
          /chapter[-_]?\d+/,
          /ch[-_]?\d+/,
          /vol[-_]?\d+/,
          /volume[-_]?\d+/,
          /part[-_]?\d+/,
          /page[-_]?\d+/,
          /doujin/,
          /hentai/,
          /manga/,
          /comic/,
          /oneshot/,
          /\[.*\]/,  // Brackets often used in manga titles
          /\(.*\)/   // Parentheses for language/artist info
        ];

        const matchedPatterns = mangaPatterns.filter(pattern => pattern.test(slugLower));
        if (matchedPatterns.length > 0) {
          analysis.isMangaUrl = true;
          analysis.confidence += matchedPatterns.length * 10;
          analysis.urlPattern = `Date structure + ${matchedPatterns.length} manga patterns`;
        }
      }
    }

    // Additional URL analysis
    const fullUrl = url.toLowerCase();
    if (fullUrl.includes('manga') || fullUrl.includes('doujin') || fullUrl.includes('comic')) {
      analysis.isMangaUrl = true;
      analysis.confidence += 15;
    }

  } catch (error) {
    console.warn('URL analysis failed:', error);
  }

  return analysis;
};

// Helper function to analyze title patterns
const analyzeTitlePatterns = (title: string) => {
  const analysis = {
    isMangaTitle: false,
    patterns: [] as string[],
    confidence: 0
  };

  if (!title) return analysis;

  const titleLower = title.toLowerCase();

  // Common manga title patterns
  const patterns = [
    { regex: /\[.*?\]/, name: 'brackets', weight: 15 },
    { regex: /\(.*?\)/, name: 'parentheses', weight: 10 },
    { regex: /chapter\s*\d+/i, name: 'chapter', weight: 25 },
    { regex: /ch\.?\s*\d+/i, name: 'ch_short', weight: 25 }, // Fixed: ch 1, ch.1, ch1
    { regex: /vol\.?\s*\d+/i, name: 'volume', weight: 20 }, // Fixed: vol 1, vol.1, vol1
    { regex: /part\s*\d+/i, name: 'part', weight: 15 },
    { regex: /page\s*\d+/i, name: 'page', weight: 10 },
    { regex: /oneshot/i, name: 'oneshot', weight: 20 },
    { regex: /doujinshi/i, name: 'doujinshi', weight: 30 },
    { regex: /hentai/i, name: 'hentai', weight: 30 },
    { regex: /english|japanese|chinese|korean|vietnamese/i, name: 'language', weight: 10 },
    { regex: /ongoing|completed|finished/i, name: 'status', weight: 5 },
    { regex: /\d+p\b/i, name: 'pages', weight: 15 }, // "24p" format
    { regex: /full\s*color/i, name: 'full_color', weight: 10 },
    { regex: /manga/i, name: 'manga', weight: 20 }, // Added manga keyword
    { regex: /comic/i, name: 'comic', weight: 20 }, // Added comic keyword
    { regex: /\|\s*ch\s*\d+/i, name: 'pipe_chapter', weight: 25 } // Added: | ch 1 format
  ];

  patterns.forEach(pattern => {
    if (pattern.regex.test(title)) {
      analysis.patterns.push(pattern.name);
      analysis.confidence += pattern.weight;
    }
  });

  // If multiple patterns match, it's likely a manga
  analysis.isMangaTitle = analysis.confidence >= 20;

  return analysis;
};

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const realPost = post?.data ? post.data : post;
  const bgColor = useColorModeValue('white', 'gray.800');
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Early return if no valid post data
  if (!realPost || !realPost.title) {
    return <NotFoundAlert />;
  }

  // Extract slug from URL for analysis
  const currentSlug = React.useMemo(() => {
    if (realPost.url) {
      try {
        const url = new URL(realPost.url);
        const pathParts = url.pathname.split('/').filter(part => part);
        if (pathParts.length >= 3) {
          return `${pathParts[0]}/${pathParts[1]}/${pathParts[2].replace('.html', '')}`;
        }
      } catch (error) {
        console.warn('Failed to extract slug from URL:', error);
      }
    }
    return '';
  }, [realPost.url]);

  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [mangaImages, setMangaImages] = useState<string[]>([]);
  const [isMangaPost, setIsMangaPost] = useState<boolean>(false);
  const [hasDetectedManga, setHasDetectedManga] = useState<boolean>(false);
  const { userId, isAuthenticated } = useUserStore();
  const {
    initialize: initializeStore,
    toggleBookmark: storeToggleBookmark,
    isBookmarked: storeIsBookmarked,
    toggleFavorite: storeToggleFavorite,
    isFavorited: storeIsFavorited
  } = useFavoriteBookmarkStore();

  // Debug log để kiểm tra trạng thái đăng nhập
  useEffect(() => {
    console.log('Login state:', String(userId || 'no-user'), Boolean(isAuthenticated));
  }, [userId, isAuthenticated]);

  // Initialize store
  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

  // Handlers for bookmark and like
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Bạn cần đăng nhập để bookmark bài viết',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const mangaData = {
        id: realPost.id,
        title: realPost.title,
        url: realPost.url || window.location.href,
        currentPage: 1,
        totalPages: mangaImages.length || 1,
        verticalMode: false
      };

      await storeToggleBookmark(mangaData, userId || '', '', toast);
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  useEffect(() => {
    if (realPost.content) {
      console.log('Checking post for manga detection:', {
        title: realPost.title,
        labels: realPost.labels,
        hasContent: !!realPost.content
      });

      // Simple manga detection based on tags only
      const detectMangaPost = () => {
        // Check for explicit manga tags
        const mangaTags = realPost.labels?.some(label => {
          const lowerLabel = label.toLowerCase();
          return ['manga', 'doujinshi', 'comic', 'CG'].some(tag =>
            lowerLabel.includes(tag)
          );
        });

        // Collect image URLs without loading them using regex
        const imageUrls: string[] = [];
        const imgRegex = /<img[^>]+src="(.*?)"[^>]*>/g;
        let match;

        while ((match = imgRegex.exec(realPost.content)) !== null) {
          const src = match[1];
          if (src && !src.includes('data:image')) {
            imageUrls.push(src);
          }
        }

        // For now, rely on overall image count for manga detection

        // Default is regular post, manga if has manga tags OR has >= 5 images
        const isManga = mangaTags || imageUrls.length >= 5;

        console.log('Manga Detection Result:', {
          title: realPost.title,
          labels: realPost.labels,
          mangaTags,
          collectedImages: imageUrls.length,
          condition: `Manga if (mangaTags AND images >= 5)`,
          calculation: `${mangaTags} AND ${imageUrls.length >= 5} = ${isManga}`,
          isManga
        });

        return { isManga, imageUrls };
      };

      const result = detectMangaPost();

      if (result.isManga) {
        console.log('Setting as manga post with', result.imageUrls.length, 'images');
        setMangaImages(result.imageUrls);
        setIsMangaPost(true);
      } else {
        console.log('Setting as regular post');
        setMangaImages([]);
        setIsMangaPost(false);
      }
      setHasDetectedManga(true);
    }
  }, [realPost.content, realPost.labels, realPost.title, realPost.url, currentSlug]);

  // Helper functions
  const getCoverImage = (): string => {
    return mangaImages.length > 0 ? mangaImages[0] : '';
  };

  const extractLanguage = (): string => {
    const langTags = realPost.labels?.find(label =>
      ['english', 'japanese', 'chinese', 'korean', 'vietnamese'].some(lang =>
        label.toLowerCase().includes(lang)
      )
    );
    return langTags || 'Unknown';
  };

  const handleReadManga = (startPage?: number) => {
    const page = startPage !== undefined ? startPage + 1 : 1;
    const newUrl = `${location.pathname}?read=true&page=${page}`;
    navigate(newUrl);
  };

  // Render nothing or a loader until manga detection is complete
  if (!hasDetectedManga) {
    return <PageLoader />;
  }

  if (isMangaPost) {
    return (
      <>
        {/* Enhanced Manga PostPage */}
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
      </>
    );
  }

  // Enhanced regular post layout
  return (
    <>
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
              {/* Enhanced Header with Tag Filter */}
              <EnhancedPostHeader
                title={realPost.title || 'Untitled'}
                publishedDate={realPost.published}
                author="Admin"
                showTagFilter={true}
                onTagSelect={(tag) => {
                  if (tag) {
                    // Navigate to tag page or filter posts
                    window.location.href = `/tag/${encodeURIComponent(tag)}`;
                  }
                }}
              />

              {/* Enhanced Content */}
              <EnhancedPostContent
                content={realPost.content || ''}
              />

              {/* Back Button */}
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
    </>
  );
};

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => (
  <Alert
    status="error"
    variant="subtle"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    textAlign="center"
    height="200px"
    rounded="lg"
  >
    <AlertIcon boxSize="40px" mr={0} />
    <AlertTitle mt={4} mb={1} fontSize="lg">
      Đã xảy ra lỗi!
    </AlertTitle>
    <AlertDescription maxWidth="sm">
      {error}
    </AlertDescription>
    <Button
      leftIcon={<ArrowBackIcon />}
      mt={4}
      as={Link}
      to="/"
      colorScheme="gray"
      variant="solid"
    >
      Quay lại trang chủ
    </Button>
  </Alert>
);

const NotFoundAlert: React.FC = () => {
  const navigate = useNavigate();

  // Redirect to 404 page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/404', { replace: true });
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Center h="50vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="pink.500" thickness="4px" />
        <Text fontSize="lg" color="gray.500">
          Đang chuyển hướng đến trang 404...
        </Text>
        <Text fontSize="sm" color="gray.400">
          (｡◕‿◕｡) Chờ một chút nhé~
        </Text>
      </VStack>
    </Center>
  );
};

const PostPage: React.FC = () => {
  const { year, month, slug: rawSlug } = useParams<{ year: string; month: string; slug: string }>();

  // Handle both cases: with and without .html extension + URL decoding
  const slug = React.useMemo(() => {
    if (!year || !month || !rawSlug) return '';

    try {
      // Decode URL encoding first (handle %20, etc.)
      const decodedSlug = decodeURIComponent(rawSlug);
      // Remove .html extension if present
      const cleanSlug = decodedSlug.replace(/\.html$/, '');
      const finalSlug = `${year}/${month}/${cleanSlug}`;

      // Debug logging
      console.log('PostPage Debug:', {
        year,
        month,
        rawSlug,
        decodedSlug,
        cleanSlug,
        finalSlug
      });
      console.log('Full URL:', window.location.href);

      return finalSlug;
    } catch (e) {
      // If decoding fails, use original logic
      console.warn('URL decoding failed, using original:', e);
      const cleanSlug = rawSlug.replace(/\.html$/, '');
      const finalSlug = `${year}/${month}/${cleanSlug}`;

      console.log('PostPage Debug (fallback):', { year, month, rawSlug, cleanSlug, finalSlug });
      return finalSlug;
    }
  }, [year, month, rawSlug]);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserStore();
  const {
    initialize: initializeStore
  } = useFavoriteBookmarkStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await loadPost(slug);
        setPost(found);
        if (!found) setError('Không tìm thấy bài viết');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Lỗi khi tải bài viết');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Initialize store
  useEffect(() => {
    if (userId && isAuthenticated) {
      initializeStore(userId);
    }
  }, [userId, isAuthenticated, initializeStore]);

  // Update document title when post is loaded
  useEffect(() => {
    if (post?.title) {
      document.title = post.title;
    } else {
      document.title = 'Đang tải bài viết...';
    }

    return () => {
      document.title = blogConfig.title || 'Blog';
    };
  }, [post]);

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