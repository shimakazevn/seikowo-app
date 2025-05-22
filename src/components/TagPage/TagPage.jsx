import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';
import { blogConfig } from '../../config';
import PostCard from '../HomePage/PostCard';

const TagPage = () => {
  const { tagName } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchPostsByTag = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts`,
          {
            params: {
              labels: tagName,
              key: blogConfig.apiKey,
              maxResults: 50, // Adjust as needed
            },
          }
        );
        setPosts(response.data.items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts by tag:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostsByTag();
  }, [tagName]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="40px" width="200px" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="200px" />
          ))}
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        mb={8}
      >
        <Heading as="h1" size="xl" mb={2}>
          Posts tagged with "{tagName}"
        </Heading>
        <Text color="gray.500">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} found
        </Text>
      </Box>

      <VStack spacing={6} align="stretch">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <Text textAlign="center" color="gray.500">
            No posts found with this tag.
          </Text>
        )}
      </VStack>
    </Container>
  );
};

export default TagPage; 