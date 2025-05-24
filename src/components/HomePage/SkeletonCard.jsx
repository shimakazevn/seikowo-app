import React from 'react';
import { Box, Skeleton, useColorModeValue } from '@chakra-ui/react';

const SkeletonCard = () => {
  const cardBgColor = useColorModeValue('#f7f7fa', 'gray.800');
  const cardBorder = useColorModeValue('1.5px solid #e2e8f0', '1.5px solid #23272A');
  const cardShadow = useColorModeValue('0 2px 12px 0 rgba(0,0,0,0.08)', '0 4px 24px 0 rgba(0,0,0,0.25)');

  return (
    <Box
      my={4}
      borderWidth="0"
      borderRadius="2xl"
      boxShadow={cardShadow}
      bg={cardBgColor}
      border={cardBorder}
      style={{
        transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
      }}
    >
      <Box
        position="relative"
        paddingBottom="150%"
        overflow="hidden"
        borderTopLeftRadius="2xl"
        borderTopRightRadius="2xl"
        borderBottomLeftRadius="0"
        borderBottomRightRadius="0"
        mb={0}
      >
        <Skeleton
          width="100%"
          height="100%"
          position="absolute"
          top={0}
          left={0}
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
        />
      </Box>
      <Box
        p={{ base: 2, sm: 3 }}
        h="auto"
        position="relative"
        borderBottomLeftRadius="2xl"
        borderBottomRightRadius="2xl"
        bg={cardBgColor}
      >
        <Skeleton height="24px" mb={2} borderRadius="md" />
        <Skeleton height="16px" width="60%" borderRadius="md" />
      </Box>
    </Box>
  );
};

export default SkeletonCard; 