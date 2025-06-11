import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Container,
  Heading,
  Grid,
  GridItem,
  useColorModeValue,
  Image,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from '@chakra-ui/react';
import { FaPlay, FaEye, FaImages, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import EnhancedMangaReader from './EnhancedMangaReader';

const MotionBox = motion(Box);

const MangaReaderDemo: React.FC = () => {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Demo manga images (placeholder URLs)
  const demoImages = [
    'https://picsum.photos/800/1200?random=1',
    'https://picsum.photos/800/1200?random=2',
    'https://picsum.photos/800/1200?random=3',
    'https://picsum.photos/800/1200?random=4',
    'https://picsum.photos/800/1200?random=5',
    'https://picsum.photos/800/1200?random=6',
    'https://picsum.photos/800/1200?random=7',
    'https://picsum.photos/800/1200?random=8',
    'https://picsum.photos/800/1200?random=9',
    'https://picsum.photos/800/1200?random=10',
  ];

  const features = [
    {
      icon: FaPlay,
      title: 'Auto-scroll Reading',
      description: 'Automatic page progression with customizable speed',
      color: 'green',
    },
    {
      icon: FaEye,
      title: 'Smart UI Controls',
      description: 'Hide/show interface with click, glassmorphism effects',
      color: 'blue',
    },
    {
      icon: FaImages,
      title: 'Thumbnail Navigation',
      description: 'Visual page grid with instant jump navigation',
      color: 'purple',
    },
    {
      icon: FaClock,
      title: 'Reading Analytics',
      description: 'Track reading time, progress, and statistics',
      color: 'orange',
    },
  ];

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          textAlign="center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Heading
            size="2xl"
            bgGradient="linear(to-r, blue.400, purple.500, pink.500)"
            bgClip="text"
            mb={4}
          >
            Enhanced Manga Reader
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
            Experience manga reading like never before with our revolutionary interface
            featuring glassmorphism effects, smart controls, and immersive animations.
          </Text>
        </MotionBox>

        {/* Demo Preview */}
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card bg={bgColor} shadow="2xl" borderRadius="2xl" overflow="hidden">
            <CardHeader bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Heading size="lg">Demo Manga Chapter</Heading>
                  <HStack spacing={4}>
                    <Badge colorScheme="blue" variant="solid">
                      {demoImages.length} Pages
                    </Badge>
                    <Badge colorScheme="green" variant="solid">
                      HD Quality
                    </Badge>
                    <Badge colorScheme="purple" variant="solid">
                      Enhanced Reader
                    </Badge>
                  </HStack>
                </VStack>
                <Button
                  leftIcon={<FaPlay />}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  size="lg"
                  onClick={() => setIsReaderOpen(true)}
                  _hover={{
                    transform: 'scale(1.05)',
                    bg: 'whiteAlpha.300',
                  }}
                  transition="all 0.2s"
                >
                  Start Reading
                </Button>
              </HStack>
            </CardHeader>
            
            <CardBody p={6}>
              <Grid templateColumns="repeat(5, 1fr)" gap={4} mb={6}>
                {demoImages.slice(0, 5).map((image, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Box
                      position="relative"
                      borderRadius="lg"
                      overflow="hidden"
                      border="2px solid"
                      borderColor={borderColor}
                      _hover={{
                        borderColor: 'blue.400',
                        transform: 'scale(1.05)',
                      }}
                      transition="all 0.2s"
                      cursor="pointer"
                      onClick={() => setIsReaderOpen(true)}
                    >
                      <Image
                        src={image}
                        alt={`Page ${index + 1}`}
                        w="100%"
                        h="120px"
                        objectFit="cover"
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
                    </Box>
                  </MotionBox>
                ))}
              </Grid>
              
              <Text color="gray.600" textAlign="center">
                Click any thumbnail or the "Start Reading" button to experience the enhanced reader
              </Text>
            </CardBody>
          </Card>
        </MotionBox>

        {/* Features Grid */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Heading size="xl" textAlign="center" mb={8}>
            Revolutionary Features
          </Heading>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
            {features.map((feature, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <Card
                  bg={bgColor}
                  shadow="lg"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{
                    shadow: '2xl',
                    transform: 'translateY(-4px)',
                  }}
                  transition="all 0.3s"
                >
                  <CardBody p={6}>
                    <HStack spacing={4} mb={4}>
                      <Box
                        p={3}
                        borderRadius="full"
                        bg={`${feature.color}.100`}
                        color={`${feature.color}.600`}
                      >
                        <feature.icon size="24px" />
                      </Box>
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{feature.title}</Heading>
                        <Text color="gray.600" fontSize="sm">
                          {feature.description}
                        </Text>
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              </MotionBox>
            ))}
          </Grid>
        </MotionBox>

        {/* Call to Action */}
        <MotionBox
          textAlign="center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Divider mb={8} />
          <VStack spacing={4}>
            <Heading size="lg">Ready to Experience the Future of Manga Reading?</Heading>
            <Button
              leftIcon={<FaPlay />}
              colorScheme="blue"
              size="lg"
              onClick={() => setIsReaderOpen(true)}
              bgGradient="linear(to-r, blue.400, purple.500)"
              _hover={{
                bgGradient: "linear(to-r, blue.500, purple.600)",
                transform: 'scale(1.05)',
              }}
              transition="all 0.2s"
              px={8}
              py={6}
              fontSize="lg"
            >
              Launch Enhanced Reader
            </Button>
          </VStack>
        </MotionBox>
      </VStack>

      {/* Enhanced Manga Reader */}
      <EnhancedMangaReader
        postId="demo-manga"
        postTitle="Enhanced Reader Demo - Revolutionary Manga Experience"
        images={demoImages}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </Container>
  );
};

export default MangaReaderDemo;
