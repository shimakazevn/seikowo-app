import React from 'react';
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
} from '@chakra-ui/react';

const CategoriesPage = () => {
  // Example categories - you can replace these with your actual categories
  const categories = [
    { id: 1, name: 'Technology', count: 12 },
    { id: 2, name: 'Lifestyle', count: 8 },
    { id: 3, name: 'Travel', count: 15 },
    { id: 4, name: 'Food', count: 10 },
  ];

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="2xl" mb={8}>
        Categories
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {categories.map((category) => (
          <Card
            key={category.id}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            overflow="hidden"
            transition="all 0.3s"
            _hover={{
              transform: 'translateY(-4px)',
              shadow: 'lg',
            }}
          >
            <CardBody>
              <Heading as="h2" size="md" mb={2}>
                {category.name}
              </Heading>
              <Badge colorScheme="blue" fontSize="sm">
                {category.count} posts
              </Badge>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default CategoriesPage; 