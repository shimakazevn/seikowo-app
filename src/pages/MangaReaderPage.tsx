import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { loadPost } from '../utils/postLoader';
import { extractImages } from '../utils/blogUtils';
import { EnhancedMangaReader, MangaView } from '../components/PostPage/MangaView';

interface MangaReaderPageProps {}

const MangaReaderPage: React.FC<MangaReaderPageProps> = () => {
  const params = useParams<{ year?: string; month?: string; slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the actual slug for loading post
  const slug = params.slug;

  // URL parameters
  const searchParams = new URLSearchParams(location.search);
  const currentPageFromUrl = parseInt(searchParams.get('p') || '1') - 1;

  // States
  const [post, setPost] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.900');

  // Load post data
  useEffect(() => {
    const loadPostData = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const postData = await loadPost(slug);

        if (!postData) {
          setError('Post not found');
          setLoading(false);
          return;
        }

        setPost(postData);

        // Extract images
        const extractedImages = extractImages(postData.content || '');
        setImages(extractedImages);

        if (extractedImages.length === 0) {
          setError('No images found in this post');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post');
        setLoading(false);
      }
    };

    loadPostData();
  }, [slug]);

  // Check URL parameters and open reader
  useEffect(() => {
    const pageParam = searchParams.get('p');
    console.log('Checking URL params:', { pageParam, isReaderOpen });
    if (pageParam) {
      console.log('Setting isReaderOpen to true');
      setIsReaderOpen(true);
    } else {
      console.log('Setting isReaderOpen to false');
      setIsReaderOpen(false);
    }
  }, [searchParams]);

  // Handle reader close
  const handleClose = useCallback(() => {
    console.log('Closing reader');
    setIsReaderOpen(false);
    navigate(location.pathname);
  }, [location.pathname, navigate]);

  // Handle read button click
  const handleRead = useCallback((startPage?: number) => {
    console.log('MangaReaderPage handleRead called with startPage:', startPage);
    const basePath = location.pathname;
    const newUrl = `${basePath}?p=${(startPage || 0) + 1}`;
    console.log('MangaReaderPage navigating to:', newUrl);
    navigate(newUrl);
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="md" />
      </Box>
    );
  }

  if (error && !images.length) {
    return (
      <Alert status="error" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="100vh">
        <AlertIcon />
        <AlertTitle mt={4} mb={1} fontSize="lg">Error loading manga</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  console.log('Rendering MangaReaderPage:', { isReaderOpen, imagesLength: images.length, currentPageFromUrl });

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="100%" p={0}>
        {!isReaderOpen && (
          <MangaView
            title={post?.title || ''}
            coverImage={post?.thumbnail || ''}
            images={images}
            publishedDate={post?.published || ''}
            tags={post?.labels || []}
            author={post?.author || 'Unknown'}
            postId={post?.id || ''}
            url={window.location.href}
            onRead={handleRead}
          />
        )}
        {isReaderOpen && (
          <EnhancedMangaReader
            images={images}
            isOpen={isReaderOpen}
            onClose={handleClose}
            startPage={currentPageFromUrl}
          />
        )}
      </Container>
    </Box>
  );
};

export default MangaReaderPage; 