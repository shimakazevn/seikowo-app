import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Container,
  Grid,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  Badge,
  useColorMode,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useClipboard,
  Divider,
  Input,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import {
  FaPlay,
  FaHeart,
  FaShare,
  FaArrowLeft,
  FaCopy,
  FaExternalLinkAlt,
  FaDownload,
  FaBook,
  FaBookmark,
  FaBookmark as FaBookmarkSolid,
} from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Post } from '../../types';

import useUserStore from '../../store/useUserStore';
import useFavoriteBookmarkStore from '../../store/useFollowBookmarkStore';
import { optimizeThumbnail } from '../../utils/blogUtils';
import { blogConfig } from '../../config';
import LazyImage from '../ui/common/LazyImage';

// Enhanced Lazy Image Component with Background Placeholder
// interface OptimizedImageProps {
//   src: string;
//   alt: string;
//   style?: React.CSSProperties;
//   loading?: 'eager' | 'lazy';
//   onDoubleClick?: () => void;
// }

interface MangaPostPView {
  title: string;
  coverImage: string;
  images: string[];
  publishedDate: string;
  tags: string[];
  language?: string;
  author?: string;
  postId?: string;
  url?: string;
  onRead: (startPage?: number) => void;
  onBookmark?: () => void;
  onLike?: () => void;
  onShare?: () => void;
}

// const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
//   src,
//   alt,
//   style,
//   loading = 'lazy',
//   onDoubleClick
// }) => {
//   const [error, setError] = useState(false);
//   const bgColor = useColorModeValue('gray.100', 'gray.700');

//   return (
//     <Box
//       width="100%"
//       height="100%"
//       display="flex"
//       justifyContent="center"
//       alignItems="center"
//       bg={bgColor}
//       position="relative"
//     >
//       <LazyImage
//         src={src}
//         alt={alt}
//         width="100%"
//         height="100%"
//         objectFit="cover"
//         style={style}
//         onClick={onDoubleClick}
//         onError={() => setError(true)}
//       />
//     </Box>
//   );
// });

const MangaView: React.FC<MangaPostPView> = ({
  title,
  coverImage,
  images,
  publishedDate,
  tags,
  author = "Unknown",
  postId = "demo-manga",
  url = window.location.href,
  onRead,
  onBookmark,
  onLike,
  onShare,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hooks
  const toast = useToast();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { hasCopied, onCopy } = useClipboard(url);

  // Store hooks
  const { userId, accessToken, isAuthenticated, storeReady } = useUserStore();
  const {
    toggleFavorite: storeToggleFavorite,
    isFavorited: storeIsFavorited,
    initialize: initializeStore
  } = useFavoriteBookmarkStore();

  // State to track favorite status
  const [isCurrentlyFavorited, setIsCurrentlyFavorited] = useState(false);

  // Effect to update isCurrentlyFavorited when store or postId changes
  useEffect(() => {
    if (storeReady && postId) {
      setIsCurrentlyFavorited(storeIsFavorited(postId));
    }
  }, [storeIsFavorited, postId, storeReady]);

  // Local state
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);

  // Dynamic colors based on theme - Improved contrast for dark mode
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const bgColor = isDark ? '#000000' : '#ffffff';
  const cardBg = isDark ? '#131313' : '#ffffff'; // Using secondary color
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#cccccc' : '#666666'; // Improved contrast
  const borderColor = isDark ? '#444444' : '#e5e5e5'; // More visible border
  const accentColor = '#00d4ff';

  // Effect to increment view count
  useEffect(() => {
    // View count is now static, no need to increment
  }, []);

  // Initialize follow/bookmark store when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId && storeReady) {
      console.log('Initializing follow/bookmark store for user:', userId);
      initializeStore(userId);
    }
  }, [isAuthenticated, userId, storeReady, initializeStore]);

  // Handle read button click
  const handleRead = useCallback((startPage?: number) => {
    console.log('handleRead called with startPage:', startPage);
    const basePath = location.pathname;
    const newUrl = `${basePath}?p=${(startPage || 0) + 1}`;
    console.log('Navigating to:', newUrl);
    navigate(newUrl);
  }, [location.pathname, navigate]);

  const handleFavorite = async () => {
    if (!storeReady) {
      toast({
        title: 'Đang tải',
        description: 'Vui lòng đợi hệ thống tải xong',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Bạn cần đăng nhập để yêu thích manga',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsFavoriteLoading(true);

    try {
      const postData: Post = {
        id: postId,
        title: title,
        url: url,
        published: publishedDate,
        updated: publishedDate,
        labels: tags,
        thumbnail: coverImage,
        content: '',
        slug: '',
      };

      console.log('Calling storeToggleFollow with:', {
        postData,
        userId,
        hasAccessToken: !!accessToken,
        currentlyFavorited: isCurrentlyFavorited
      });

      // Store already handles toast notifications, so we don't need to show additional ones
      const result = await storeToggleFavorite(postData, userId || '', accessToken || '');

      console.log('storeToggleFavorite result:', result);
      // Update local state based on the result of the toggle operation
      setIsCurrentlyFavorited(result);
    } catch (error: any) {
      console.error('Favorite error:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Có lỗi xảy ra khi thực hiện thao tác',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleDownload = async () => {
    if (images.length === 0) {
      toast({
        title: 'Không có hình ảnh',
        description: 'Không có hình ảnh nào để tải về',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsDownloadLoading(true);

    try {
      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      toast({
        title: 'Đang chuẩn bị tải về',
        description: `Đang nén ${images.length} hình ảnh...`,
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      // Download all images and add to zip
      const downloadPromises = images.map(async (imageUrl, index) => {
        try {
          const response = await fetch('https://images.weserv.nl/?url='+imageUrl);
          const blob = await response.blob();
          const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `page_${String(index + 1).padStart(3, '0')}.${extension}`;
          zip.file(fileName, blob);
        } catch (error) {
          console.error(`Failed to download image ${index + 1}:`, error);
        }
      });

      await Promise.all(downloadPromises);

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Tải về thành công',
        description: `Đã tải về ${images.length} hình ảnh`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onBookmark?.(); // Keep the original callback for compatibility
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Lỗi tải về',
        description: 'Có lỗi xảy ra khi tải về hình ảnh',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDownloadLoading(false);
    }
  };

  const handleShare = () => {
    onShareOpen();
    onShare?.();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // Clean tags - no categorization needed for minimal design

  return (
    <Box bg={bgColor} color={textColor} overflowX="hidden">
      <Container maxW="1400px" py={{ base: 2, md: 4 }} px={{ base: 4, md: 6 }}>
        {/* Header with Back Button - Mobile Optimized */}
        <HStack justify="space-between" align="center" mb={{ base: 4, md: 6 }}>
          <Button
            leftIcon={<FaArrowLeft />}
            variant="ghost"
            size={{ base: "sm", md: "md" }}
            color={mutedColor}
            as={Link}
            to="/"
            _hover={{ color: textColor, bg: isDark ? 'gray.800' : 'gray.100' }}
            borderRadius="md"
            fontSize={{ base: "sm", md: "md" }}
            h={{ base: "36px", md: "40px" }}
            px={{ base: 2, md: 4 }}
          >
            <Text display={{ base: "none", sm: "block" }}>Back to Home</Text>
            <Text display={{ base: "block", sm: "none" }}>Back</Text>
          </Button>
        </HStack>

        {/* Mobile Layout - Single Column */}
        <Box display={{ base: "block", lg: "none" }} w="100%" overflowX="hidden">
          <VStack spacing={4} align="stretch" w="100%">
            {/* Title Section - Mobile First */}
            <Box w="100%">
              <Text
                fontSize={{ base: "lg", sm: "xl" }}
                fontWeight="bold"
                color={textColor}
                lineHeight="1.2"
                noOfLines={3}
              >
                {title}
              </Text>
            </Box>

            {/* Cover Image & Actions - Mobile */}
            <HStack spacing={4} align="start" w="100%">
              <Box flexShrink={0}>
                <LazyImage
                  src={coverImage}
                  alt={title}
                  width="120px"
                  height="100%"
                  objectFit="cover"
                  borderRadius="md"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor={borderColor}
                />
                
                <VStack
                  spacing={1}
                  align="center"
                  fontSize="xs"
                  color={mutedColor}
                  mt={2}
                >
                  <Text>{formatDate(publishedDate)}</Text>
                </VStack>
              </Box>

              <VStack spacing={3} flex={1} align="stretch">
                <Box mt={"auto"}>
                  {tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      bg={isDark ? 'gray.700' : 'gray.200'}
                      color={textColor}
                      px={1.5}
                      py={0.5}
                      m={0.5}
                      fontSize="2xs"
                      borderRadius="sm"
                      display="inline-block"
                      maxW="80px"
                      isTruncated
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge
                      bg={isDark ? 'gray.600' : 'gray.300'}
                      color={textColor}
                      px={1.5}
                      py={0.5}
                      m={0.5}
                      fontSize="2xs"
                      borderRadius="sm"
                      display="inline-block"
                    >
                      +{tags.length - 3}
                    </Badge>
                  )}
                </Box>
                <Button
                  leftIcon={<FaPlay />}
                  bg={accentColor}
                  color="black"
                  size="sm"
                  w="100%"
                  as={Link}
                  to={`${location.pathname}?p=1`}
                  _hover={{ bg: '#33ddff' }}
                  _active={{ bg: '#00b8e6' }}
                  fontWeight="semibold"
                  borderRadius="md"
                  h="40px"
                  fontSize="sm"
                >
                  Start Reading
                </Button>

                <HStack spacing={2} w="100%">
                  <Button
                    leftIcon={<FaHeart />}
                    variant={isCurrentlyFavorited ? "solid" : "outline"}
                    colorScheme={isCurrentlyFavorited ? "pink" : "gray"}
                    onClick={handleFavorite}
                    isLoading={isFavoriteLoading}
                    flex={1}
                    size="sm"
                    fontSize="xs"
                    h="32px"
                    minW="0"
                    px={2}
                  >
                    {isCurrentlyFavorited ? 'Favorited' : 'Favorite'}
                  </Button>

                  <Button
                    leftIcon={<FaDownload />}
                    variant="outline"
                    colorScheme="blue"
                    onClick={handleDownload}
                    isLoading={isDownloadLoading}
                    flex={1}
                    size="sm"
                    fontSize="xs"
                    h="32px"
                    minW="0"
                    px={2}
                  >
                    Download
                  </Button>

                  <IconButton
                    aria-label="share"
                    icon={<FaShare />}
                    variant="outline"
                    colorScheme="blue"
                    onClick={handleShare}
                    size="sm"
                    h="32px"
                    minW="32px"
                  />
                </HStack>
              </VStack>
            </HStack>

            {/* Preview Section - Mobile Optimized */}
            <Box w="100%">
              <Text
                fontSize="md"
                fontWeight="semibold"
                color={textColor}
                mb={3}
              >
                {images.length} pages
              </Text>

              {/* Mobile Horizontal Scroll - Fixed Overflow */}
              <Box
                w="100%"
                overflowX="auto"
                overflowY="hidden"
                pb={2}
                sx={{
                  '&::-webkit-scrollbar': {
                    height: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDark ? '#555' : '#ccc',
                    borderRadius: '3px',
                  },
                }}
              >
                <HStack spacing={2} w="max-content" minW="100%">
                  {images.map((image, index) => (
                    <Box
                      key={index}
                      flexShrink={0}
                      h="120px"
                      borderRadius="md"
                      overflow="hidden"
                      cursor="pointer"
                      onClick={() => handleRead(index)}
                      position="relative"
                      bg={cardBg}
                      border="1px solid"
                      borderColor={borderColor}
                      transition="all 0.2s"
                      _active={{
                        transform: 'scale(0.95)',
                      }}
                    >
                      <LazyImage
                        src={optimizeThumbnail(image, 120) || image}
                        alt={`Page ${index + 1}`}
                        width="100%"
                        height="100%"
                        objectFit="cover"
                        threshold={400}
                      />
                      <Box
                        position="absolute"
                        bottom={1}
                        right={1}
                        bg="blackAlpha.900"
                        color="white"
                        px={1.5}
                        py={0.5}
                        borderRadius="sm"
                        fontSize="2xs"
                        fontWeight="bold"
                      >
                        {index + 1}
                      </Box>
                    </Box>
                  ))}
                </HStack>
              </Box>
            </Box>
          </VStack>
        </Box>

        {/* Desktop Layout */}
        <Grid
          display={{ base: "none", lg: "grid" }}
          templateColumns="280px 1fr"
          gap={8}
          alignItems="start"
        >
          {/* Desktop Sidebar */}
          <VStack spacing={4} align="stretch">
            {/* Desktop Cover Image */}
            <Box textAlign="center">
              <LazyImage
                src={coverImage}
                alt={title}
                width="100%"
                height="300px"
                objectFit="cover"
                borderRadius="xl"
                boxShadow="xl"
              />
            </Box>

            {/* Desktop Action Buttons */}
            <VStack spacing={3} w="100%">
              <Button
                leftIcon={<FaPlay />}
                bg={accentColor}
                color="black"
                size="lg"
                w="100%"
                as={Link}
                onClick={() => handleRead()}
                _hover={{ bg: '#33ddff' }}
                _active={{ bg: '#00b8e6' }}
                fontWeight="semibold"
                borderRadius="lg"
                h="48px"
                fontSize="md"
              >
                Start Reading
              </Button>

              <HStack spacing={2} w="100%">
                <Button
                  leftIcon={<FaHeart />}
                  variant={isCurrentlyFavorited ? "solid" : "outline"}
                  colorScheme={isCurrentlyFavorited ? "pink" : "gray"}
                  onClick={handleFavorite}
                  isLoading={isFavoriteLoading}
                  flex={1}
                  size="md"
                  fontSize="sm"
                >
                  {isCurrentlyFavorited ? 'Favorited' : 'Favorite'}
                </Button>

                <Button
                  leftIcon={<FaDownload />}
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleDownload}
                  isLoading={isDownloadLoading}
                  flex={1}
                  size="md"
                  fontSize="sm"
                >
                  Download
                </Button>

                <IconButton
                  aria-label="share"
                  icon={<FaShare />}
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleShare}
                  size="md"
                />
              </HStack>
            </VStack>

            {/* Desktop Details */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  details
                </Text>
                <VStack spacing={2} align="stretch" fontSize="sm">
                  <HStack justify="space-between">
                    <Text color={mutedColor}>author:</Text>
                    <Text color={textColor}>{author}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={mutedColor}>published:</Text>
                    <Text color={textColor}>{formatDate(publishedDate)}</Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Desktop Tags */}
            <Box
              bg={cardBg}
              p={4}
              borderRadius="lg"
              border="1px solid"
              borderColor={borderColor}
            >
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  tags
                </Text>
                <Box>
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      bg={isDark ? 'gray.700' : 'gray.200'}
                      color={textColor}
                      px={2}
                      py={1}
                      m={1}
                      fontSize="xs"
                      cursor="pointer"
                      _hover={{ bg: isDark ? 'gray.600' : 'gray.300' }}
                      fontWeight="medium"
                      borderRadius="md"
                      display="inline-block"
                    >
                      {tag}
                    </Badge>
                  ))}
                </Box>
              </VStack>
            </Box>
          </VStack>

          {/* Desktop Content */}
          <VStack spacing={6} align="stretch">
            {/* Desktop Title */}
            <Box>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color={textColor}
                lineHeight="1.3"
                mb={2}
              >
                {title}
              </Text>
              <HStack spacing={2} fontSize="sm" color={mutedColor}>
                <Text>{formatDate(publishedDate)}</Text>
                <Text>•</Text>
                <Text>{author}</Text>
              </HStack>
            </Box>

            {/* Desktop Preview */}
            <Box>
              <Grid
                templateColumns="repeat(auto-fill, minmax(140px, 1fr))"
                gap={4}
                maxH="600px"
                overflowY="auto"
                p={4}
                bg={cardBg}
                borderRadius="lg"
                border="1px solid"
                borderColor={borderColor}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDark ? '#555' : '#ccc',
                    borderRadius: '4px',
                  },
                }}
              >
                {images.map((image, index) => (
                  <Box
                    key={index}
                    w="100%"
                    aspectRatio="3/4"
                    borderRadius="lg"
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => handleRead(index)}
                    position="relative"
                    bg={isDark ? "gray.800" : "gray.100"}
                    border="1px solid"
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{
                      transform: 'scale(1.03)',
                      shadow: 'xl',
                      borderColor: accentColor
                    }}
                  >
                    <LazyImage
                      src={optimizeThumbnail(image, 200) || image}
                      alt={`Page ${index + 1}`}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                      threshold={400}
                    />
                    <Box
                      position="absolute"
                      bottom={2}
                      right={2}
                      bg="blackAlpha.900"
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </Box>
                  </Box>
                ))}
              </Grid>
            </Box>
          </VStack>
        </Grid>

      
        {/* Enhanced Mobile Share Modal */}
        <Modal
          isOpen={isShareOpen}
          onClose={onShareClose}
          isCentered
          size={{ base: "xs", sm: "sm", md: "md" }}
          motionPreset="slideInBottom"
        >
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent
            bg={cardBg}
            color={textColor}
            border="1px solid"
            borderColor={borderColor}
            mx={{ base: 2, sm: 4, md: 0 }}
            borderRadius={{ base: "lg", md: "xl" }}
          >
            <ModalHeader
              color={textColor}
              fontSize={{ base: "md", md: "lg" }}
              pb={{ base: 2, md: 4 }}
            >
              share this manga
            </ModalHeader>
            <ModalCloseButton
              color={mutedColor}
              size={{ base: "sm", md: "md" }}
              top={{ base: 3, md: 4 }}
              right={{ base: 3, md: 4 }}
            />
            <ModalBody pb={{ base: 4, md: 6 }}>
              <VStack spacing={{ base: 3, md: 4 }} align="stretch">
                <Box>
                  <Text fontSize={{ base: "xs", md: "sm" }} color={mutedColor} mb={2}>
                    share url:
                  </Text>
                  <VStack spacing={2} display={{ base: "flex", md: "none" }}>
                    <Input
                      value={url}
                      isReadOnly
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{ borderColor: accentColor }}
                      fontSize="xs"
                      h="36px"
                      borderRadius="md"
                    />
                    <Button
                      leftIcon={<FaCopy />}
                      onClick={onCopy}
                      colorScheme={hasCopied ? "green" : "blue"}
                      variant={hasCopied ? "solid" : "outline"}
                      size="sm"
                      w="100%"
                      h="36px"
                      fontSize="xs"
                    >
                      {hasCopied ? "copied!" : "copy"}
                    </Button>
                  </VStack>
                  <HStack display={{ base: "none", md: "flex" }}>
                    <Input
                      value={url}
                      isReadOnly
                      bg={bgColor}
                      border="1px solid"
                      borderColor={borderColor}
                      _focus={{ borderColor: accentColor }}
                    />
                    <Button
                      leftIcon={<FaCopy />}
                      onClick={onCopy}
                      colorScheme={hasCopied ? "green" : "blue"}
                      variant={hasCopied ? "solid" : "outline"}
                    >
                      {hasCopied ? "copied!" : "copy"}
                    </Button>
                  </HStack>
                </Box>

                <Divider borderColor={borderColor} />

                <Box>
                  <Text fontSize={{ base: "xs", md: "sm" }} color={mutedColor} mb={3}>
                    share on social media:
                  </Text>
                  <VStack spacing={2} display={{ base: "flex", md: "none" }}>
                    <Button
                      leftIcon={<FaExternalLinkAlt />}
                      colorScheme="twitter"
                      variant="outline"
                      size="sm"
                      w="100%"
                      h="36px"
                      fontSize="xs"
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                    >
                      twitter
                    </Button>
                    <Button
                      leftIcon={<FaExternalLinkAlt />}
                      colorScheme="facebook"
                      variant="outline"
                      size="sm"
                      w="100%"
                      h="36px"
                      fontSize="xs"
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                    >
                      facebook
                    </Button>
                  </VStack>
                  <HStack spacing={2} display={{ base: "none", md: "flex" }}>
                    <Button
                      leftIcon={<FaExternalLinkAlt />}
                      colorScheme="twitter"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                    >
                      twitter
                    </Button>
                    <Button
                      leftIcon={<FaExternalLinkAlt />}
                      colorScheme="facebook"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                    >
                      facebook
                    </Button>
                  </HStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter pt={0}>
              <Button
                variant="ghost"
                onClick={onShareClose}
                size={{ base: "sm", md: "md" }}
                fontSize={{ base: "xs", md: "sm" }}
                w={{ base: "100%", md: "auto" }}
              >
                close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default MangaView;
