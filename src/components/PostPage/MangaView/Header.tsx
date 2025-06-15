import React from 'react';
import { Box, Flex, HStack, Text, Badge, Progress, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FaHome, FaTh, FaCog, FaShare, FaExpand, FaCompress } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  currentPage: number;
  totalPages: number;
  showUI: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleThumbnails: () => void;
  onToggleSettings: () => void;
  onShare: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  totalPages,
  showUI,
  isFullscreen,
  onToggleFullscreen,
  onToggleThumbnails,
  onToggleSettings,
  onShare,
}) => {
  const navigate = useNavigate();
  const headerBg = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(26,32,44,0.95)');

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={2}
      bg={headerBg}
      backdropFilter="blur(10px)"
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
      p={4}
      opacity={showUI ? 1 : 0.3}
      transition="opacity 0.2s ease"
    >
      <Flex justify="space-between" align="center">
        {/* Left Section */}
        <HStack spacing={4}>
          <IconButton
            aria-label="Back to home"
            icon={<FaHome />}
            variant="ghost"
            color="white"
            onClick={() => navigate('/')}
            _hover={{
              bg: "whiteAlpha.300",
            }}
            _active={{
              bg: "whiteAlpha.200",
              transform: 'scale(0.95)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            transition="all 0.1s ease"
          />
          <HStack spacing={2}>
            <Badge colorScheme="blue" variant="subtle">
              Page {currentPage + 1} of {totalPages}
            </Badge>
          </HStack>
        </HStack>

        {/* Center Section - Progress */}
        <Box flex={1} mx={8}>
          <Progress
            value={(currentPage + 1) / totalPages * 100}
            colorScheme="blue"
            size="lg"
            borderRadius="full"
            bg="whiteAlpha.200"
          />
        </Box>

        {/* Right Section */}
        <HStack spacing={2}>
          <IconButton
            aria-label="Show thumbnails"
            icon={<FaTh />}
            variant="ghost"
            color="white"
            onClick={onToggleThumbnails}
            _hover={{
              bg: "whiteAlpha.300",
            }}
            _active={{
              bg: "whiteAlpha.200",
              transform: 'scale(0.95)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            transition="all 0.1s ease"
          />
          <IconButton
            aria-label="Settings"
            icon={<FaCog />}
            variant="ghost"
            color="white"
            onClick={onToggleSettings}
            _hover={{
              bg: "whiteAlpha.300",
            }}
            _active={{
              bg: "whiteAlpha.200",
              transform: 'scale(0.95)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            transition="all 0.1s ease"
          />
          <IconButton
            aria-label="Share"
            icon={<FaShare />}
            variant="ghost"
            color="white"
            onClick={onShare}
            _hover={{
              bg: "whiteAlpha.300",
            }}
            _active={{
              bg: "whiteAlpha.200",
              transform: 'scale(0.95)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            transition="all 0.1s ease"
          />
          <IconButton
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            icon={isFullscreen ? <FaCompress /> : <FaExpand />}
            variant="ghost"
            color="white"
            onClick={onToggleFullscreen}
            _hover={{
              bg: "whiteAlpha.300",
            }}
            _active={{
              bg: "whiteAlpha.200",
              transform: 'scale(0.95)',
            }}
            _focus={{
              boxShadow: 'none',
            }}
            transition="all 0.1s ease"
          />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header; 