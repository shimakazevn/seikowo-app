import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Flex,
  Badge,
  Divider,
  Progress,
  Tooltip,
  useColorModeValue,
  useToast,
  Grid,
  Image,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  FaHome,
  FaBookmark,
  FaHeart,
  FaShare,
  FaExpand,
  FaCompress,
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaSun,
  FaMoon,
  FaDownload,
  FaCog,
  FaTh,
  FaList,
  FaEye,
  FaClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { optimizeThumbnail } from '../../utils/blogUtils';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface EnhancedMangaReaderProps {
  postId: string;
  postTitle: string;
  images: string[];
  initialPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedMangaReader: React.FC<EnhancedMangaReaderProps> = memo(({
  postId,
  postTitle,
  images,
  initialPage = 0,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // States
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [isVerticalMode, setIsVerticalMode] = useState(false);
  const [isTwoPage, setIsTwoPage] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(5);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.900');
  const headerBg = useColorModeValue('rgba(255,255,255,0.95)', 'rgba(26,32,44,0.95)');
  const controlsBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(45,55,72,0.9)');
  const thumbnailBg = useColorModeValue('gray.50', 'gray.800');

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && !isVerticalMode) {
      const interval = setInterval(() => {
        if (currentPage < images.length - 1) {
          setCurrentPage(prev => prev + 1);
        } else {
          setAutoScroll(false);
        }
      }, autoScrollSpeed * 1000);
      return () => clearInterval(interval);
    }
  }, [autoScroll, autoScrollSpeed, currentPage, images.length, isVerticalMode]);

  // Sync with URL parameters
  useEffect(() => {
    if (isOpen && initialPage !== undefined && initialPage !== currentPage) {
      setCurrentPage(initialPage);
    }
  }, [isOpen, initialPage, currentPage]);

  // Handlers with URL sync
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      // Update URL
      const newUrl = `${window.location.pathname}?read=true&page=${newPage + 1}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < images.length - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      // Update URL
      const newUrl = `${window.location.pathname}?read=true&page=${newPage + 1}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentPage, images.length]);

  const handlePageJump = useCallback((page: number) => {
    if (page >= 0 && page < images.length) {
      setCurrentPage(page);
      setShowThumbnails(false);
      // Update URL
      const newUrl = `${window.location.pathname}?read=true&page=${page + 1}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [images.length]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: postTitle,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Page link copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [postTitle, toast]);

  // Enhanced Header Component - Made stable (no slide animation)
  const EnhancedHeader = () => (
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
          <VStack align="start" spacing={0}>
            <HStack spacing={2}>
              <Badge colorScheme="blue" variant="subtle">
                Page {currentPage + 1} of {images.length}
              </Badge>
            </HStack>
          </VStack>
        </HStack>

        {/* Center Section - Progress */}
        <Box flex={1} mx={8}>
          <Progress
            value={(currentPage + 1) / images.length * 100}
            colorScheme="blue"
            size="lg"
            borderRadius="full"
            bg="whiteAlpha.200"
          />
        </Box>

        {/* Right Section */}
        <HStack spacing={2}>
          <Tooltip label="Thumbnails">
            <IconButton
              aria-label="Show thumbnails"
              icon={<FaTh />}
              variant="ghost"
              bg={showThumbnails ? "whiteAlpha.200" : "transparent"}
              color="white"
              onClick={() => setShowThumbnails(!showThumbnails)}
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
          </Tooltip>
          <Tooltip label="Settings">
            <IconButton
              aria-label="Settings"
              icon={<FaCog />}
              variant="ghost"
              bg={showSettings ? "whiteAlpha.200" : "transparent"}
              color="white"
              onClick={() => setShowSettings(!showSettings)}
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
          </Tooltip>
          <Tooltip label="Share">
            <IconButton
              aria-label="Share"
              icon={<FaShare />}
              variant="ghost"
              color="white"
              onClick={handleShare}
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
          </Tooltip>
          <Tooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton
              aria-label="Toggle fullscreen"
              icon={isFullscreen ? <FaCompress /> : <FaExpand />}
              variant="ghost"
              color="white"
              onClick={handleFullscreen}
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
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      closeOnOverlayClick={false}
      closeOnEsc={true}
    >
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent bg={bgColor} m={0} borderRadius={0}>
        <EnhancedHeader />

        <ModalBody
          p={0}
          pt="100px"
          onClick={() => setShowUI(!showUI)}
          cursor="pointer"
        >
          {/* Main Image Display */}
          <Box
            position="relative"
            height="calc(100vh - 100px)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            filter={`brightness(${brightness}%)`}
          >
            {isOpen && (
              <Image
                src={images[currentPage]}
                alt={`Page ${currentPage + 1}`}
                maxH="100%"
                maxW="100%"
                objectFit="contain"
                loading="lazy"
                fallback={
                  <Box
                    w="100%"
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="gray.100"
                  >
                    <Text>Loading...</Text>
                  </Box>
                }
              />
            )}

            {/* Navigation Controls */}
            <AnimatePresence>
              {showUI && (
                <>
                  {/* Previous Page Button */}
                  {currentPage > 0 && (
                    <MotionBox
                      position="absolute"
                      left={4}
                      top="50%"
                      transform="translateY(-50%)"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <button
                        aria-label="Previous page"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevPage();
                        }}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: controlsBg,
                          backdropFilter: 'blur(10px)',
                          border: 'none',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          transition: 'transform 0.1s ease',
                          WebkitTapHighlightColor: 'transparent',
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          outline: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onTouchStart={(e) => {
                          e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onTouchEnd={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        className="no-tap-highlight"
                      >
                        <FaChevronLeft />
                      </button>
                    </MotionBox>
                  )}

                  {/* Next Page Button */}
                  {currentPage < images.length - 1 && (
                    <MotionBox
                      position="absolute"
                      right={4}
                      top="50%"
                      transform="translateY(-50%)"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <button
                        aria-label="Next page"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextPage();
                        }}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: controlsBg,
                          backdropFilter: 'blur(10px)',
                          border: 'none',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '20px',
                          transition: 'transform 0.1s ease',
                          WebkitTapHighlightColor: 'transparent',
                          WebkitTouchCallout: 'none',
                          WebkitUserSelect: 'none',
                          outline: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onTouchStart={(e) => {
                          e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onTouchEnd={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        className="no-tap-highlight"
                      >
                        <FaChevronRight />
                      </button>
                    </MotionBox>
                  )}

                  {/* Auto-scroll Control */}
                  <MotionBox
                    position="absolute"
                    bottom={4}
                    left="50%"
                    transform="translateX(-50%)"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <HStack
                      bg={controlsBg}
                      backdropFilter="blur(10px)"
                      p={3}
                      borderRadius="full"
                      spacing={3}
                    >
                      <IconButton
                        aria-label={autoScroll ? "Pause auto-scroll" : "Start auto-scroll"}
                        icon={autoScroll ? <FaPause /> : <FaPlay />}
                        size="sm"
                        variant="solid"
                        borderRadius="full"
                        bg={autoScroll ? "red.500" : "green.500"}
                        color="white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAutoScroll(!autoScroll);
                        }}
                        _hover={{
                          bg: autoScroll ? "red.500" : "green.500",
                        }}
                        _active={{
                          transform: 'scale(0.95)',
                          bg: autoScroll ? "red.500" : "green.500",
                        }}
                        _focus={{
                          boxShadow: 'none',
                        }}
                        transition="transform 0.1s ease"
                      />
                      <Text fontSize="sm" fontWeight="medium">
                        {autoScroll ? `Auto-scrolling (${autoScrollSpeed}s)` : 'Manual'}
                      </Text>
                    </HStack>
                  </MotionBox>
                </>
              )}
            </AnimatePresence>
          </Box>

          {/* Thumbnails Grid */}
          <AnimatePresence>
            {showThumbnails && (
              <MotionBox
                position="fixed"
                bottom={0}
                left={0}
                right={0}
                bg={thumbnailBg}
                backdropFilter="blur(10px)"
                borderTop="1px solid"
                borderColor="whiteAlpha.200"
                p={4}
                maxH="300px"
                overflowY="auto"
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                transition={{ duration: 0.3 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <Grid
                  templateColumns="repeat(auto-fill, minmax(120px, 1fr))"
                  gap={3}
                >
                  {images.map((image, index) => (
                    <MotionBox
                      key={index}
                      cursor="pointer"
                      borderRadius="lg"
                      overflow="hidden"
                      border="2px solid"
                      borderColor={index === currentPage ? "blue.500" : "transparent"}
                      _hover={{
                        borderColor: "blue.300",
                        transform: "scale(1.05)",
                      }}
                      onClick={() => handlePageJump(index)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Box position="relative">
                        <Image
                          src={optimizeThumbnail(image, 200) || image}
                          alt={`Page ${index + 1}`}
                          w="100%"
                          h="160px"
                          objectFit="cover"
                          loading="lazy"
                          fallback={
                            <Box
                              w="100%"
                              h="160px"
                              bg="gray.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs">Loading...</Text>
                            </Box>
                          }
                        />
                        <Box
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          bg="blackAlpha.700"
                          color="white"
                          p={2}
                          textAlign="center"
                        >
                          <Text fontSize="xs" fontWeight="bold">
                            {index + 1}
                          </Text>
                        </Box>
                        {index === currentPage && (
                          <Box
                            position="absolute"
                            top={2}
                            right={2}
                            bg="blue.500"
                            color="white"
                            borderRadius="full"
                            p={1}
                          >
                            <FaEye size="12px" />
                          </Box>
                        )}
                      </Box>
                    </MotionBox>
                  ))}
                </Grid>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <MotionBox
                position="fixed"
                top="100px"
                right={0}
                w="350px"
                h="calc(100vh - 100px)"
                bg={controlsBg}
                backdropFilter="blur(20px)"
                borderLeft="1px solid"
                borderColor="whiteAlpha.200"
                p={6}
                overflowY="auto"
                initial={{ x: 350 }}
                animate={{ x: 0 }}
                exit={{ x: 350 }}
                transition={{ duration: 0.3 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <VStack spacing={6} align="stretch">
                  <Text fontSize="xl" fontWeight="bold" mb={4}>
                    Reader Settings
                  </Text>

                  {/* Brightness Control */}
                  <Box>
                    <FormLabel display="flex" alignItems="center" mb={3}>
                      <FaSun style={{ marginRight: '8px' }} />
                      Brightness: {brightness}%
                    </FormLabel>
                    <Slider
                      value={brightness}
                      onChange={setBrightness}
                      min={20}
                      max={150}
                      step={5}
                      colorScheme="blue"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>

                  <Divider />

                  {/* Reading Mode */}
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="semibold">
                      Reading Mode
                    </Text>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="vertical-mode" mb="0" flex={1}>
                        <FaList style={{ display: 'inline', marginRight: '8px' }} />
                        Vertical Scrolling
                      </FormLabel>
                      <Switch
                        id="vertical-mode"
                        isChecked={isVerticalMode}
                        onChange={(e) => setIsVerticalMode(e.target.checked)}
                        colorScheme="blue"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="two-page" mb="0" flex={1}>
                        Two Page View
                      </FormLabel>
                      <Switch
                        id="two-page"
                        isChecked={isTwoPage}
                        onChange={(e) => setIsTwoPage(e.target.checked)}
                        colorScheme="blue"
                        isDisabled={isVerticalMode}
                      />
                    </FormControl>
                  </VStack>

                  <Divider />

                  {/* Auto-scroll Settings */}
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="semibold">
                      Auto-scroll
                    </Text>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="auto-scroll" mb="0" flex={1}>
                        <FaPlay style={{ display: 'inline', marginRight: '8px' }} />
                        Enable Auto-scroll
                      </FormLabel>
                      <Switch
                        id="auto-scroll"
                        isChecked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        colorScheme="green"
                      />
                    </FormControl>

                    {autoScroll && (
                      <Box>
                        <FormLabel mb={2}>
                          Speed: {autoScrollSpeed} seconds per page
                        </FormLabel>
                        <Slider
                          value={autoScrollSpeed}
                          onChange={setAutoScrollSpeed}
                          min={1}
                          max={10}
                          step={0.5}
                          colorScheme="green"
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </Box>
                    )}
                  </VStack>

                  <Divider />

                  {/* Page Navigation */}
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="semibold">
                      Navigation
                    </Text>

                    <HStack>
                      <Text flex={1}>Go to page:</Text>
                      <NumberInput
                        value={currentPage + 1}
                        onChange={(_, value) => {
                          if (!isNaN(value) && value >= 1 && value <= images.length) {
                            setCurrentPage(value - 1);
                          }
                        }}
                        min={1}
                        max={images.length}
                        w="80px"
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </HStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => setCurrentPage(0)}
                        isDisabled={currentPage === 0}
                        flex={1}
                      >
                        First
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => setCurrentPage(images.length - 1)}
                        isDisabled={currentPage === images.length - 1}
                        flex={1}
                      >
                        Last
                      </Button>
                    </HStack>
                  </VStack>

                  <Divider />

                  {/* Reading Statistics */}
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="lg" fontWeight="semibold">
                      Reading Stats
                    </Text>

                    <HStack justify="space-between">
                      <Text>Progress:</Text>
                      <Badge colorScheme="blue" variant="subtle">
                        {Math.round((currentPage + 1) / images.length * 100)}%
                      </Badge>
                    </HStack>

                    <HStack justify="space-between">
                      <Text>Pages Left:</Text>
                      <Badge colorScheme="orange" variant="subtle">
                        {images.length - currentPage - 1}
                      </Badge>
                    </HStack>
                  </VStack>

                  <Divider />

                  {/* Action Buttons */}
                  <VStack spacing={3}>
                    <Button
                      leftIcon={<FaDownload />}
                      colorScheme="green"
                      variant="outline"
                      w="100%"
                      onClick={() => {
                        toast({
                          title: 'Download',
                          description: 'Download functionality coming soon!',
                          status: 'info',
                          duration: 3000,
                          isClosable: true,
                        });
                      }}
                    >
                      Download Chapter
                    </Button>

                    <Button
                      leftIcon={<FaBookmark />}
                      colorScheme="blue"
                      variant="outline"
                      w="100%"
                      onClick={() => {
                        toast({
                          title: 'Bookmarked',
                          description: 'Page bookmarked successfully!',
                          status: 'success',
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    >
                      Bookmark Page
                    </Button>
                  </VStack>
                </VStack>
              </MotionBox>
            )}
          </AnimatePresence>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});

EnhancedMangaReader.displayName = 'EnhancedMangaReader';

export default EnhancedMangaReader;
