import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import {
  Box,
  Grid,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const MangaReader = ({ images }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPage, setCurrentPage] = useState(0);
  const [displayCount, setDisplayCount] = useState(8);
  const bgColor = useColorModeValue('white', 'gray.800');

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(images.length - 1, prev + 1));
  };

  const handleKeyPress = (e) => {
    if (isOpen) {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'Escape') onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  // Convert image URL to thumbnail URL
  const getThumbUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s200/');
  };

  // Convert thumbnail URL back to full size URL
  const getFullUrl = (url) => {
    return url.replace(/\/s[0-9]+\//, '/s1600/');
  };

  return (
    <Box>
      <VStack spacing={6} width="100%" align="stretch">
        <Grid 
          templateColumns={{
            base: 'repeat(3, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(5, 1fr)',
            lg: 'repeat(6, 1fr)',
            xl: 'repeat(8, 1fr)'
          }}
          gap={2}
        >
          {images.slice(0, displayCount).map((img, idx) => (
            <Box
              key={idx}
              position="relative"
              cursor="pointer"
              onClick={() => {
                setCurrentPage(idx);
                onOpen();
              }}
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.05)' }}
            >
              <LazyLoadImage
                src={getThumbUrl(img)}
                alt={`Page ${idx + 1}`}
                width="100%"
                height="auto"
                effect="opacity"
                style={{
                  aspectRatio: '3/4',
                  objectFit: 'cover',
                  borderRadius: '0.375rem',
                  transition: 'opacity 0.15s ease-in-out'
                }}
                wrapperProps={{
                  style: {
                    transitionDuration: '0.15s'
                  }
                }}
              />
              <Text
                position="absolute"
                bottom={1}
                right={1}
                bg="blackAlpha.700"
                color="white"
                px={1.5}
                py={0.5}
                borderRadius="md"
                fontSize="xs"
              >
                {idx + 1}/{images.length}
              </Text>
            </Box>
          ))}
        </Grid>

        {displayCount < images.length && (
          <Button 
            onClick={() => setDisplayCount(prev => Math.min(prev + 8, images.length))}
            colorScheme="blue"
            width="100%"
          >
            Xem thêm ({images.length - displayCount} ảnh)
          </Button>
        )}

        <Button
          onClick={() => {
            setCurrentPage(0);
            onOpen();
          }}
          colorScheme="teal"
          width="100%"
          size="lg"
        >
          Đọc Chapter
        </Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader>
            <HStack justify="space-between">
              <Text>Trang {currentPage + 1}/{images.length}</Text>
              <ModalCloseButton position="static" />
            </HStack>
          </ModalHeader>
          <ModalBody>
            <HStack spacing={4} height="calc(100vh - 100px)" position="relative">
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                position="fixed"
                left={4}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                size="lg"
                variant="solid"
                colorScheme="blue"
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
              <Box 
                width="100%" 
                height="100%" 
                display="flex" 
                justifyContent="center" 
                alignItems="center"
                overflow="auto"
              >
                <LazyLoadImage
                  src={getFullUrl(images[currentPage])}
                  alt={`Page ${currentPage + 1}`}
                  effect="opacity"
                  style={{
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transition: 'opacity 0.15s ease-in-out'
                  }}
                  wrapperProps={{
                    style: {
                      transitionDuration: '0.15s'
                    }
                  }}
                  loading="lazy"
                />
              </Box>
              <IconButton
                icon={<ChevronRightIcon />}
                onClick={handleNextPage}
                disabled={currentPage === images.length - 1}
                position="fixed"
                right={4}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                size="lg"
                variant="solid"
                colorScheme="blue"
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MangaReader; 