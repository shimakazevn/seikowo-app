import React, { useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  useColorModeValue,
  Text,
  Divider,
  HStack,
  Badge,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaImage, FaVideo, FaFile } from 'react-icons/fa';

const MotionBox = motion(Box);

interface EnhancedPostContentProps {
  content: string;
  onContentLoad?: () => void;
}

const EnhancedPostContent: React.FC<EnhancedPostContentProps> = ({
  content,
  onContentLoad,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const linkColor = useColorModeValue('blue.600', 'blue.400');
  const quoteBg = useColorModeValue('blue.50', 'blue.900');
  const quoteBorder = useColorModeValue('blue.300', 'blue.600');
  const codeBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    if (contentRef.current && onContentLoad) {
      onContentLoad();
    }
  }, [content, onContentLoad]);

  // Process content to add enhanced styling
  const processContent = (htmlContent: string): string => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    // Simple lazy loading for images
    const images = div.getElementsByTagName('img');
    Array.from(images).forEach((img, index) => {
      const originalSrc = img.src;
      const originalAlt = img.alt || `Image ${index + 1}`;

      // Set up simple lazy loading
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('alt', originalAlt);

      // Apply basic styling
      img.style.cssText = `
        height: auto;
        display: block;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
      `;

      // Add hover effects
      img.addEventListener('mouseenter', () => {
        img.style.transform = 'scale(1.02)';
        img.style.boxShadow = '0 12px 48px rgba(0,0,0,0.18)';
      });

      img.addEventListener('mouseleave', () => {
        img.style.transform = 'scale(1)';
        img.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      });
    });

    // Process iframes
    const iframes = div.getElementsByTagName('iframe');
    Array.from(iframes).forEach(iframe => {
      const wrapper = document.createElement('div');
      wrapper.className = 'enhanced-iframe-wrapper';
      wrapper.style.position = 'relative';
      wrapper.style.paddingBottom = '56.25%';
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.borderRadius = '12px';
      wrapper.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      wrapper.style.margin = '2rem 0';

      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';

      iframe.parentNode?.replaceChild(wrapper, iframe);
      wrapper.appendChild(iframe);
    });

    return div.innerHTML;
  };

  // Content statistics
  const getContentStats = () => {
    if (!contentRef.current) return { images: 0, videos: 0, words: 0 };

    const images = contentRef.current.querySelectorAll('img').length;
    const videos = contentRef.current.querySelectorAll('iframe, video').length;
    const text = contentRef.current.textContent || '';
    const words = text.trim().split(/\s+/).length;

    return { images, videos, words };
  };

  const stats = getContentStats();

  return (
    <VStack spacing={6} align="stretch">
      {/* Content Stats */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Flex
          justify="center"
          gap={6}
          p={4}
          bg={bgColor}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack spacing={2}>
            <FaFile color={mutedColor} />
            <Text fontSize="sm" color={mutedColor}>
              {stats.words} từ
            </Text>
          </HStack>
          {stats.images > 0 && (
            <HStack spacing={2}>
              <FaImage color={mutedColor} />
              <Text fontSize="sm" color={mutedColor}>
                {stats.images} hình ảnh
              </Text>
            </HStack>
          )}
          {stats.videos > 0 && (
            <HStack spacing={2}>
              <FaVideo color={mutedColor} />
              <Text fontSize="sm" color={mutedColor}>
                {stats.videos} video
              </Text>
            </HStack>
          )}
        </Flex>
      </MotionBox>

      {/* Main Content */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box
          bg={bgColor}
          borderRadius="2xl"
          p={8}
          border="1px solid"
          borderColor={borderColor}
          boxShadow="xl"
          position="relative"
          overflow="hidden"
        >
          {/* Background Pattern */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            opacity={0.02}
            bgImage="radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.5) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.5) 0%, transparent 50%)"
          />

          <Box
            ref={contentRef}
            className="enhanced-post-content"
            position="relative"
            zIndex={1}
            sx={{
              // Enhanced image wrapper styling
              '.enhanced-image-wrapper': {
                maxWidth: '100%',
                display: 'block',
                margin: '2rem auto',
              },

              // Fallback for direct images (if any)
              'img:not(.enhanced-image-wrapper img)': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '12px',
                margin: '2rem auto',
                display: 'block',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                _hover: {
                  transform: 'scale(1.02)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
                }
              },

              // Enhanced iframe styling
              '.enhanced-iframe-wrapper': {
                position: 'relative',
                paddingBottom: '56.25%',
                height: '0',
                overflow: 'hidden',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                margin: '2rem 0',
                bg: codeBg,
              },

              // Enhanced typography
              'p': {
                mb: 6,
                lineHeight: 1.8,
                fontSize: { base: 'md', md: 'lg' },
                color: textColor,
                textAlign: 'justify',
              },

              // Enhanced headings
              'h1, h2, h3, h4, h5, h6': {
                mt: 8,
                mb: 4,
                fontWeight: '700',
                lineHeight: '1.3',
                color: textColor,
                position: 'relative',
                _before: {
                  content: '""',
                  position: 'absolute',
                  left: '-20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '4px',
                  height: '60%',
                  bg: 'blue.500',
                  borderRadius: 'full',
                }
              },

              'h1': { fontSize: { base: '2xl', md: '3xl' } },
              'h2': { fontSize: { base: 'xl', md: '2xl' } },
              'h3': { fontSize: { base: 'lg', md: 'xl' } },
              'h4': { fontSize: { base: 'md', md: 'lg' } },

              // Enhanced lists
              'ul, ol': {
                paddingLeft: 6,
                mb: 6,
                fontSize: { base: 'md', md: 'lg' },
                color: textColor,
              },

              'li': {
                mb: 2,
                lineHeight: 1.7,
                position: 'relative',
                _before: {
                  content: '"→"',
                  position: 'absolute',
                  left: '-20px',
                  color: 'blue.500',
                  fontWeight: 'bold',
                }
              },

              // Enhanced blockquotes
              'blockquote': {
                borderLeft: '4px solid',
                borderColor: quoteBorder,
                bg: quoteBg,
                pl: 6,
                pr: 4,
                py: 4,
                my: 6,
                fontStyle: 'italic',
                fontSize: { base: 'md', md: 'lg' },
                borderRadius: 'md',
                position: 'relative',
                _before: {
                  content: '"❝"',
                  position: 'absolute',
                  top: '-10px',
                  left: '10px',
                  fontSize: '2xl',
                  color: quoteBorder,
                }
              },

              // Enhanced links
              'a': {
                color: linkColor,
                textDecoration: 'none',
                fontWeight: '600',
                borderBottom: '2px solid transparent',
                transition: 'all 0.2s ease',
                _hover: {
                  borderBottomColor: linkColor,
                  transform: 'translateY(-1px)',
                }
              },

              // Enhanced code blocks
              'pre, code': {
                bg: codeBg,
                borderRadius: 'md',
                fontSize: 'sm',
                fontFamily: 'mono',
              },

              'pre': {
                p: 4,
                overflow: 'auto',
                border: '1px solid',
                borderColor: borderColor,
                my: 4,
              },

              'code': {
                px: 2,
                py: 1,
              },

              // Enhanced tables
              'table': {
                width: '100%',
                borderCollapse: 'collapse',
                my: 6,
                bg: bgColor,
                borderRadius: 'lg',
                overflow: 'hidden',
                boxShadow: 'md',
              },

              'th, td': {
                p: 3,
                textAlign: 'left',
                borderBottom: '1px solid',
                borderColor: borderColor,
              },

              'th': {
                bg: useColorModeValue('gray.50', 'gray.700'),
                fontWeight: '600',
                color: textColor,
              },

              // Enhanced separators
              'hr': {
                border: 'none',
                height: '2px',
                bg: `linear-gradient(to right, transparent, ${borderColor}, transparent)`,
                my: 8,
              }
            }}
            dangerouslySetInnerHTML={{ __html: processContent(content) }}
          />
        </Box>
      </MotionBox>
    </VStack>
  );
};

export default EnhancedPostContent;
