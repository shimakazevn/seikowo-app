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
import { blogConfig } from '../config';
import PostCard from '../components/HomePage/PostCard';
import { Post } from '../types/global';

const TagPage: React.FC = () => {
  const { tagName } = useParams<{ tagName: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchPostsByTag = async () => {
      try {
        setLoading(true);
        const response = await axios.get<{ items: any[] }>(
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
          {[1, 2, 3].map((i: any) => (
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
        borderColor="gray.200"
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
        {posts.map((post, index: number) => (
          <PostCard key={post.id} post={post} index={index} />
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