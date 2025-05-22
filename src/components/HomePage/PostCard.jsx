import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Image, Skeleton, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { extractImage, optimizeThumbnail, getSlugFromUrl, getThumbnailBySlug } from '../../utils/blogUtils';

const MotionBox = motion(Box);

const PostCard = ({ post, index, cardBg, textColor, mutedTextColor, extraInfo, actionButton }) => {
  const animationVariants = {
    initial: { 
      opacity: 0,
      scale: 0.97,
      filter: 'blur(2px)'
    },
    animate: { 
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        delay: index * 0.03,
        duration: 0.15,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.97,
      filter: 'blur(2px)'
    }
  };

  // Get cached posts from localStorage
  const cachedPosts = JSON.parse(localStorage.getItem('cachedPosts') || '[]');
  const slug = post.slug || getSlugFromUrl(post.url);
  
  // Use getThumbnailBySlug with fallback to existing logic
  const thumbnail = getThumbnailBySlug(cachedPosts, slug) || 
                   (post.thumbnail || (post.content ? extractImage(post.content) : null));
  const date = post.updated ? new Date(post.updated) : null;

  return (
    <MotionBox
      initial="initial"
      animate="animate"
      exit="exit"
      variants={animationVariants}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      bg={cardBg}
      h="100%"
      w="100%"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'md',
        '& img': {
          transform: 'scale(1.05)',
        }
      }}
      style={{
        transition: 'all 0.3s ease'
      }}
    >
      <Link to={`/${slug}`} style={{ display: 'block' }}>
        <Box 
          position="relative" 
          paddingBottom="150%" 
          overflow="hidden"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
          >
            <Image
              src={thumbnail ? optimizeThumbnail(thumbnail, 600) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjkwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzY2NiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}
              alt={post.title}
              width="100%"
              height="100%"
              objectFit="cover"
              objectPosition="center top"
              transition="transform 0.3s ease"
              fallback={<Skeleton height="100%" />}
              loading="lazy"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
            {post.labels && post.labels[0] && (
              <Badge
                position="absolute"
                top={2}
                left={2}
                colorScheme="white"
                rounded="full"
                px={2}
                py={0.5}
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                bg="rgba(225, 66, 172, 0.39)"
                backdropFilter="blur(4px)"
                zIndex={1}
              >
                {post.labels[0]}
              </Badge>
            )}
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              height="80px"
              background="linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)"
              pointerEvents="none"
              zIndex={1}
            />
          </Box>
        </Box>
        <Box 
          p={{ base: 2, sm: 3 }}
          h="auto"
          position="relative"
        >
          <Text
            className="content-heading"
            fontSize={{ base: "xs", sm: "sm" }}
            fontWeight="medium"
            noOfLines={2}
            color={textColor}
            mb={extraInfo ? 2 : 8}
            letterSpacing="tight"
          >
            {post.title}
          </Text>
          {extraInfo && (
            <Text 
              fontSize="xs" 
              color={mutedTextColor}
              mb={actionButton ? 2 : 8}
            >
              {extraInfo}
            </Text>
          )}
          {!extraInfo && date && (
            <Text 
              fontSize="xs" 
              color={mutedTextColor}
              position="absolute"
              bottom={{ base: 2, sm: 3 }}
              left={{ base: 2, sm: 3 }}
            >
              {date.toLocaleDateString('vi-VN')}
            </Text>
          )}
        </Box>
      </Link>
      {actionButton && (
        <Box px={{ base: 2, sm: 3 }} pb={{ base: 2, sm: 3 }}>
          {actionButton}
        </Box>
      )}
    </MotionBox>
  );
};

export default PostCard; 