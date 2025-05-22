import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Image, Skeleton, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { extractImage, optimizeThumbnail, getSlugFromUrl } from '../../utils/blogUtils';

const MotionBox = motion(Box);

const PostCard = ({ post, index, cardBg, textColor, mutedTextColor }) => {
  const thumbnail = extractImage(post.content);
  const date = new Date(post.updated);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.1,
        ease: 'easeOut'
      }}
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      bg={cardBg}
      _hover={{ 
        transform: 'translateY(-4px)', 
        boxShadow: 'md',
        '& img': {
          transform: 'scale(1.05)',
        }
      }}
      h="100%"
      w="100%"
      style={{
        transition: 'all 0.3s ease'
      }}
    >
      <Link to={`/${getSlugFromUrl(post.url)}`} style={{ display: 'block' }}>
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
              src={optimizeThumbnail(thumbnail, 600)}
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
            mb={8}
            letterSpacing="tight"
          >
            {post.title}
          </Text>
          <Text 
            fontSize="xs" 
            color={mutedTextColor}
            position="absolute"
            bottom={{ base: 2, sm: 3 }}
            left={{ base: 2, sm: 3 }}
          >
            {date.toLocaleDateString('vi-VN')}
          </Text>
        </Box>
      </Link>
    </MotionBox>
  );
};

export default PostCard; 