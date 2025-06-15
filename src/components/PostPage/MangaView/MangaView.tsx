import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Image,
  Button,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaPlay } from 'react-icons/fa';

interface MangaViewProps {
  title: string;
  coverImage: string;
  images: string[];
  publishedDate: string;
  tags: string[];
  author: string;
  postId: string;
  url: string;
  onRead: (startPage?: number) => void;
}

const MangaView: React.FC<MangaViewProps> = ({
  title,
  coverImage,
  images,
  publishedDate,
  tags,
  author,
  postId,
  url,
  onRead,
}) => {
  const bgColor = useColorModeValue('white', 'gray.900');
  const cardBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={2}>{title}</Heading>
            <HStack spacing={4}>
              <Text color="gray.500">By {author}</Text>
              <Text color="gray.500">Published {new Date(publishedDate).toLocaleDateString()}</Text>
            </HStack>
          </Box>

          {/* Cover and Info */}
          <Box
            display="flex"
            flexDirection={{ base: 'column', md: 'row' }}
            gap={8}
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            {/* Cover Image */}
            <Box
              flex={{ base: '1', md: '0 0 300px' }}
              position="relative"
              borderRadius="lg"
              overflow="hidden"
            >
              <Image
                src={coverImage}
                alt={title}
                w="100%"
                h="auto"
                objectFit="cover"
                fallback={
                  <Box
                    w="100%"
                    h="400px"
                    bg="gray.200"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text>Loading...</Text>
                  </Box>
                }
              />
            </Box>

            {/* Info */}
            <VStack flex="1" align="stretch" spacing={6}>
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={2}>Description</Text>
                <Text color="gray.600">
                  This manga contains {images.length} pages. Click the button below to start reading.
                </Text>
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={2}>Tags</Text>
                <HStack wrap="wrap" spacing={2}>
                  {tags.map((tag, index) => (
                    <Badge key={index} colorScheme="blue" variant="subtle">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              </Box>

              <Button
                leftIcon={<FaPlay />}
                colorScheme="blue"
                size="lg"
                onClick={() => onRead(0)}
                w={{ base: '100%', md: 'auto' }}
              >
                Start Reading
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default MangaView; 