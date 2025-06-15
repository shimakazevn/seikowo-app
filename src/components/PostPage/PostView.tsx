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
  Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaImage, FaVideo, FaFile } from 'react-icons/fa';
import parse, { DOMNode, Element } from 'html-react-parser';
import LazyImage from '../ui/common/LazyImage';

const MotionBox = motion(Box);

interface PostViewProps {
  content: string;
  onContentLoad?: () => void;
}

const PostView: React.FC<PostViewProps> = ({
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

  // Function to replace <img> tags with LazyImage component
  const replaceImage = (node: DOMNode) => {
    if (node.type === 'tag' && node.name === 'img') {
      const { src, alt, width, height } = node.attribs;
      return (
        <LazyImage
          src={src}
          alt={alt || 'Post Image'}
          width={width}
          height={height}
          objectFit="contain"
        />
      );
    }
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
            className="post-content-html"
            color={textColor}
            fontSize={{ base: "md", md: "lg" }}
            lineHeight={1.7}
            wordBreak="break-word"
            sx={{
              // Basic styling for common HTML elements to match Chakra UI theme
              'p': { mb: 4 },
              'h1, h2, h3, h4, h5, h6': { mt: 6, mb: 3, fontWeight: 'bold' },
              'h1': { fontSize: '3xl' },
              'h2': { fontSize: '2xl' },
              'h3': { fontSize: 'xl' },
              'h4': { fontSize: 'lg' },
              'ul, ol': { ml: 6, mb: 4 },
              'li': { mb: 1 },
              'a': { color: linkColor, textDecoration: 'underline' },
              'img': { maxWidth: '100%', height: 'auto', borderRadius: 'md', my: 4, display: 'block', mx: 'auto' },
              'blockquote': {
                borderLeft: '4px solid',
                borderColor: quoteBorder,
                pl: 4, py: 2, my: 4,
                bg: quoteBg,
                borderRadius: 'md',
                fontStyle: 'italic',
              },
              'code': {
                fontFamily: 'mono',
                bg: codeBg,
                px: 2, py: 1,
                borderRadius: 'md',
              },
              'pre': {
                fontFamily: 'mono',
                bg: codeBg,
                p: 4,
                borderRadius: 'md',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                my: 4,
              },
              'table': {
                width: '100%', borderCollapse: 'collapse', my: 4
              },
              'th, td': {
                border: '1px solid', borderColor: borderColor, p: 2, textAlign: 'left'
              },
            }}
            ref={contentRef}
          >
            {parse(content, { replace: replaceImage })}
          </Box>
        </Box>
      </MotionBox>
    </VStack>
  );
};

export default PostView;
