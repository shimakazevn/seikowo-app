import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { blogConfig } from '../config';
import PageTransition from '../components/PageTransition';
import MangaReader from '../components/MangaReader';
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
  Skeleton,
  SkeletonText,
  VStack,
  HStack,
  useColorModeValue,
  AspectRatio,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, StarIcon } from '@chakra-ui/icons';
import { getSlugFromUrl } from '../utils/blogUtils';

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const CACHE_KEY = "cachedPosts";

// Helper function to normalize URLs for comparison
function normalizeUrl(url) {
  // Remove protocol and domain if present
  let normalized = url.replace(/^https?:\/\/[^/]+/, '');
  // Remove trailing slash if present
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

const PostSkeleton = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bgColor} p={6} rounded="lg" shadow="sm">
      <Skeleton height="40px" mb={4} />
      <SkeletonText mt={4} noOfLines={1} spacing={4} mb={6} />
      <VStack align="stretch" spacing={4}>
        <Skeleton height="200px" />
        <SkeletonText mt={4} noOfLines={6} spacing={4} />
        <SkeletonText mt={4} noOfLines={4} spacing={4} />
        <SkeletonText mt={4} noOfLines={3} spacing={4} />
      </VStack>
    </Box>
  );
};

const PostContent = ({ post }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const contentRef = useRef(null);
  const [mangaImages, setMangaImages] = useState([]);
  const [isMangaPost, setIsMangaPost] = useState(false);
  const toast = useToast();
  const [followed, setFollowed] = useState(isFollowed(post));

  useEffect(() => {
    if (contentRef.current) {
      // Check for tags condition
      const hasMangaTags = post.labels?.some(label => 
        label.toLowerCase() === 'manga' || 
        label.toLowerCase() === 'doujinshi'
      );
      
      const hasAnimeTag = post.labels?.some(label => 
        label.toLowerCase() === 'anime' ||
        label.toLowerCase() === 'game' ||
        label.toLowerCase() === 'eroge' ||
        label.toLowerCase() === 'new' 

      );

      const separators = contentRef.current.querySelectorAll('.separator');
      const separatorCount = separators.length;

      // Check conditions for MangaReader activation
      const shouldUseMangaReader = (
        // Has manga or doujinshi tag
        hasMangaTags ||
        // OR doesn't have anime tag AND has more than 10 separators
        (!hasAnimeTag && separatorCount >= 10)
      );

      if (shouldUseMangaReader && separatorCount > 0) {
        const images = [];
        separators.forEach(separator => {
          const img = separator.querySelector('img');
          if (img) {
            images.push(img.src);
          }
        });
        if (images.length > 0) {
          setMangaImages(images);
          setIsMangaPost(true);
        }
      }
    }
  }, [post.content, post.labels]);

  useEffect(() => { setFollowed(isFollowed(post)); }, [post]);

  // Function to process HTML content and replace img tags with LazyLoadImage
  const processContent = (content) => {
    if (isMangaPost) return content;

    const div = document.createElement('div');
    div.innerHTML = content;

    // Process images
    const images = div.getElementsByTagName('img');
    Array.from(images).forEach(img => {
      const lazyImg = document.createElement('img');
      lazyImg.setAttribute('data-src', img.src);
      lazyImg.setAttribute('src', img.src);
      lazyImg.setAttribute('class', 'lazy-load-image');
      lazyImg.setAttribute('data-effect', 'opacity');
      lazyImg.setAttribute('style', 'transition: opacity 0.15s ease-in-out');
      lazyImg.setAttribute('alt', img.alt || '');
      img.parentNode.replaceChild(lazyImg, img);
    });

    // Process iframes
    const iframes = div.getElementsByTagName('iframe');
    Array.from(iframes).forEach(iframe => {
      // Create wrapper div with aspect-ratio class
      const wrapper = document.createElement('div');
      wrapper.className = 'iframe-wrapper';
      
      // Copy iframe attributes
      const newIframe = document.createElement('iframe');
      Array.from(iframe.attributes).forEach(attr => {
        newIframe.setAttribute(attr.name, attr.value);
      });
      
      // Add additional iframe styles
      newIframe.style.position = 'absolute';
      newIframe.style.top = '0';
      newIframe.style.left = '0';
      newIframe.style.width = '100%';
      newIframe.style.height = '100%';
      newIframe.style.border = '0';
      
      wrapper.appendChild(newIframe);
      iframe.parentNode.replaceChild(wrapper, iframe);
    });

    return div.innerHTML;
  };
  
  return (
    <Box bg={bgColor} p={8} rounded="lg" shadow="lg" fontSize={{ base: "md", md: "lg" }} width="100%">
      <Heading 
        as="h1" 
        fontSize={{ base: "20px", sm: "22px", md: "24px", lg: "26px" }}
        mb={6}
        lineHeight="1.4"
      >
        {post.title}
      </Heading>
      <HStack spacing={4} mb={8} color={useColorModeValue('gray.600', 'gray.400')}>
        <Text fontSize={{ base: "sm", md: "md" }}>
          Đăng ngày: {new Date(post.published).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
        <Button
          size="sm"
          colorScheme={followed ? 'red' : 'blue'}
          variant={followed ? 'outline' : 'solid'}
          onClick={() => {
            if (followed) {
              removeFollow(post);
              setFollowed(false);
              toast({ title: 'Đã bỏ follow', status: 'info' });
            } else {
              saveFollow(post);
              setFollowed(true);
              toast({ title: 'Đã follow bài viết', status: 'success' });
            }
          }}
          leftIcon={<StarIcon />}
        >
          {followed ? 'Bỏ follow' : 'Follow'}
        </Button>
      </HStack>

      {isMangaPost ? (
        <MangaReader images={mangaImages} postId={post.id} postTitle={post.title} postSlug={getSlugFromUrl(post.url)} />
      ) : (
        <Box
          ref={contentRef}
          className="post-content"
          sx={{
            '.lazy-load-image': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 'lg',
              margin: '1.5rem auto',
              display: 'block',
              boxShadow: 'lg',
            },
            '.lazy-load-image-wrapper': {
              transition: 'opacity 0.15s ease-in-out !important'
            },
            '.iframe-wrapper': {
              position: 'relative',
              paddingBottom: '56.25%',
              height: '0',
              overflow: 'hidden',
              maxWidth: '100%',
              margin: '1.5rem auto',
              borderRadius: 'lg',
              boxShadow: 'lg',
              background: 'gray.100',
              _dark: {
                background: 'gray.700'
              }
            },
            'iframe': {
              border: 'none',
              borderRadius: 'lg',
            },
            'p': {
              mb: { base: 4, md: 6 },
              lineHeight: { base: 1.6, md: 1.8 },
              fontSize: { base: 'md', md: 'lg' },
            },
            'h2, h3, h4': {
              mt: { base: 6, md: 8 },
              mb: { base: 3, md: 4 },
              fontWeight: '600',
              lineHeight: '1.4',
              fontSize: { 
                h2: { base: '18px', sm: '19px', md: '20px', lg: '22px' },
                h3: { base: '17px', sm: '18px', md: '19px', lg: '20px' },
                h4: { base: '16px', sm: '17px', md: '18px', lg: '19px' }
              }
            },
            'ul, ol': {
              paddingLeft: { base: 4, md: 6 },
              mb: { base: 4, md: 6 },
              fontSize: { base: 'md', md: 'lg' },
            },
            'li': {
              mb: { base: 1.5, md: 2 },
            },
            'blockquote': {
              borderLeft: '4px solid',
              borderColor: 'gray.200',
              pl: { base: 3, md: 4 },
              py: { base: 1.5, md: 2 },
              my: { base: 3, md: 4 },
              fontStyle: 'italic',
              fontSize: { base: 'md', md: 'lg' },
            },
            'a': {
              color: 'blue.500',
              textDecoration: 'underline',
              _hover: {
                color: 'blue.600',
              }
            }
          }}
          dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
        />
      )}

      <Button
        leftIcon={<ArrowBackIcon />}
        mt={{ base: 6, md: 8 }}
        as={Link}
        to="/"
        colorScheme="blue"
        variant="outline"
        size={{ base: "md", md: "lg" }}
      >
        Quay lại trang chủ
      </Button>
    </Box>
  );
};

const ErrorAlert = ({ error }) => (
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

const NotFoundAlert = () => (
  <Alert
    status="warning"
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
      Không tìm thấy bài viết
    </AlertTitle>
    <AlertDescription maxWidth="sm">
      Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
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

function saveReadHistory(post) {
  if (!post) return;
  const userId = localStorage.getItem('google_user_id') || 'guest';
  const key = `history_read_posts_${userId}`;
  const slug = getSlugFromUrl(post.url);
  const entry = {
    id: post.id,
    title: post.title,
    slug,
    readAt: Date.now(),
  };

  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (err) {
    // Ignore error and start with empty array
  }

  arr = arr.filter(item => item.id !== post.id);
  arr.unshift(entry);
  if (arr.length > 100) arr = arr.slice(0, 100);

  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    // Ignore error if storage is full
  }
}

function saveFollow(post) {
  if (!post) return;
  const userId = localStorage.getItem('google_user_id') || 'guest';
  const key = `history_follow_posts_${userId}`;
  const slug = getSlugFromUrl(post.url);
  const entry = {
    id: post.id,
    title: post.title,
    slug,
    followAt: Date.now(),
  };
  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {}
  arr = arr.filter(item => item.id !== post.id);
  arr.unshift(entry);
  if (arr.length > 100) arr = arr.slice(0, 100);
  localStorage.setItem(key, JSON.stringify(arr));
}

function removeFollow(post) {
  if (!post) return;
  const userId = localStorage.getItem('google_user_id') || 'guest';
  const key = `history_follow_posts_${userId}`;
  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {}
  arr = arr.filter(item => item.id !== post.id);
  localStorage.setItem(key, JSON.stringify(arr));
}

function isFollowed(post) {
  if (!post) return false;
  const userId = localStorage.getItem('google_user_id') || 'guest';
  const key = `history_follow_posts_${userId}`;
  let arr = [];
  try {
    arr = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {}
  return arr.some(item => item.id === post.id);
}

function PostPage() {
  const { '*': fullPath } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!fullPath) {
        setError('Invalid URL');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try to get data from cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_KEY + '_time');
        const now = Date.now();

        // Check if cache is valid
        if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
          try {
            const posts = JSON.parse(cachedData);
            const found = posts?.find(p => {
              const postPath = normalizeUrl(p.url);
              const requestPath = normalizeUrl('/' + fullPath);
              return postPath === requestPath;
            });

            if (found) {
              setPost(found);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.warn('Cache parsing error:', cacheError);
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_KEY + '_time');
          }
        }

        // Fetch from API if cache is invalid or post not found in cache
        const res = await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts?key=${blogConfig.apiKey}&maxResults=500`
        );

        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }

        const data = await res.json();
        const posts = data.items || [];

        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
        localStorage.setItem(CACHE_KEY + '_time', now.toString());

        // Find the requested post using the full path
        const found = posts.find(p => {
          const postPath = normalizeUrl(p.url);
          const requestPath = normalizeUrl('/' + fullPath);
          return postPath === requestPath;
        });

        setPost(found || null);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [fullPath]);

  useEffect(() => {
    if (post) {
      saveReadHistory(post);
    }
  }, [post]);

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

  // Lấy userId từ localStorage (hoặc context), nếu chưa có thì 'guest'
  const userId = localStorage.getItem('google_user_id') || 'guest';

  return (
    <PageTransition>
      <Container 
        maxW="100%" 
        py={8}
        px={{ base: 4, md: 8, lg: 16, xl: 32 }}
        mx="auto"
        centerContent
      >
        <Box maxW="1400px" w="100%">
          {loading ? (
            <PostSkeleton />
          ) : error ? (
            <ErrorAlert error={error} />
          ) : !post ? (
            <NotFoundAlert />
          ) : (
            <PostContent post={post} />
          )}
        </Box>
      </Container>
    </PageTransition>
  );
}

export default PostPage;
