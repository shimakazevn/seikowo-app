import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const SkeletonCard = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const shimmerBg = useColorModeValue(
    'linear-gradient(90deg, #f0f0f0 0px, #f7f7f7 40px, #f0f0f0 80px)',
    'linear-gradient(90deg, #1A202C 0px, #2D3748 40px, #1A202C 80px)'
  );
  
  return (
    <MotionBox 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden"
      boxShadow="sm"
      bg={bgColor}
      h="100%"
      w="100%"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: shimmerBg,
        backgroundSize: '150% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
      sx={{
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '100% 0' },
        },
      }}
    >
      <Box 
        position="relative" 
        paddingBottom="150%" 
        overflow="hidden"
        bg={useColorModeValue('gray.100', 'gray.700')}
        borderRadius="md"
        m={1}
      />
      <Box p={{ base: 2, sm: 3 }} position="relative" h="auto">
        <Box
          h="16px"
          w="90%"
          mb={2}
          bg={useColorModeValue('gray.100', 'gray.700')}
          borderRadius="md"
        />
        <Box
          h="16px"
          w="70%"
          mb={8}
          bg={useColorModeValue('gray.100', 'gray.700')}
          borderRadius="md"
        />
        <Box
          h="12px"
          w="40%"
          position="absolute"
          bottom={{ base: 2, sm: 3 }}
          bg={useColorModeValue('gray.100', 'gray.700')}
          borderRadius="md"
        />
      </Box>
    </MotionBox>
  );
};

export default SkeletonCard; 