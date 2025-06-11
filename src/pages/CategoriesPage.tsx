import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorMode,
} from '@chakra-ui/react';
import { fetchAllPosts, extractCategories, getEnvironmentInfo } from '../utils/apiUtils';

interface Category {
  name: string;
  count: number;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Theme colors
  const bgColor = isDark ? '#000000' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedTextColor = isDark ? '#888888' : '#666666';
  const cardBg = isDark ? '#111111' : '#f8f9fa';
  const borderColor = isDark ? '#333333' : '#e5e5e5';

  // Fetch all posts and extract tags using environment-aware API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        // Log environment info
        const envInfo = getEnvironmentInfo();
        console.log('🌍 Environment info:', envInfo);

        // Fetch all posts using utility function
        console.log('📡 Fetching all posts...');
        const data = await fetchAllPosts(500);

        if (!data.feed || !data.feed.entry) {
          throw new Error('No posts found');
        }

        console.log(`📚 Found ${data.feed.entry.length} posts, extracting categories...`);

        // Extract categories using utility function
        const categoriesArray = extractCategories(data);

        console.log(`🏷️ Extracted ${categoriesArray.length} unique categories`);
        setCategories(categoriesArray);

      } catch (err) {
        console.error('❌ Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');

        // Fallback to sample data on error
        const sampleCategories = [
          { name: 'Technology', count: 15 },
          { name: 'Programming', count: 12 },
          { name: 'Web Development', count: 10 },
          { name: 'JavaScript', count: 8 },
          { name: 'React', count: 6 },
          { name: 'Tutorial', count: 14 },
          { name: 'Tips', count: 9 },
          { name: 'News', count: 7 },
          { name: 'Review', count: 5 },
          { name: 'Guide', count: 11 }
        ];

        console.log('🔄 Using fallback sample categories');
        setCategories(sampleCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Loading state
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center minH="50vh">
          <Box textAlign="center">
            <Spinner size="xl" color="#00d4ff" thickness="4px" />
            <Text mt={4} color={mutedTextColor}>
              Loading categories...
            </Text>
          </Box>
        </Center>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading categories!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <Heading
          as="h1"
          size="2xl"
          mb={8}
          color={textColor}
          textAlign="center"
        >
          Categories
        </Heading>

        <Text
          textAlign="center"
          mb={8}
          color={mutedTextColor}
          fontSize="lg"
        >
          Explore {categories.length} categories with all posts
        </Text>

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/tag/${encodeURIComponent(category.name)}`}
              style={{ textDecoration: 'none' }}
            >
              <Card
                bg={cardBg}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="xl"
                overflow="hidden"
                transition="all 0.3s ease"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: isDark
                    ? '0 12px 32px 0 rgba(0, 0, 0, 0.4)'
                    : '0 12px 32px 0 rgba(0, 0, 0, 0.15)',
                  borderColor: '#00d4ff',
                }}
                cursor="pointer"
                height="120px"
                display="flex"
                alignItems="center"
              >
                <CardBody textAlign="center">
                  <Heading
                    as="h2"
                    size="md"
                    mb={3}
                    color={textColor}
                    noOfLines={2}
                  >
                    {category.name}
                  </Heading>
                  <Badge
                    colorScheme="blue"
                    fontSize="sm"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {category.count} posts
                  </Badge>
                </CardBody>
              </Card>
            </Link>
          ))}
        </SimpleGrid>

        {categories.length === 0 && (
          <Center minH="30vh">
            <Box textAlign="center">
              <Text color={mutedTextColor} fontSize="lg">
                No categories found
              </Text>
            </Box>
          </Center>
        )}
      </Container>
    </Box>
  );
};

export default CategoriesPage;