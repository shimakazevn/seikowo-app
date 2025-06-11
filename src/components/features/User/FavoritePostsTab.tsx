import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Image,
  SimpleGrid,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  Icon,
  Button,
} from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import type { FavoritePost } from '../../../types/global';

interface FavoritePostsTabProps {
  favoritesPosts: FavoritePost[];
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
}

const FavoritePostsTab: React.FC<FavoritePostsTabProps> = ({
  favoritesPosts,
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
}) => {
  return (
    <Box>
      {favoritesPosts.length === 0 ? (
        <Text color={mutedColor} textAlign="center" py={10}>
          Bạn chưa yêu thích bài viết nào.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
          {favoritesPosts.map((post) => (
            <Card key={post.id} bg={cardBg} borderRadius="lg" shadow="md">
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
                  {post.thumbnail && (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      borderRadius="md"
                      objectFit="cover"
                      height={{ base: "120px", md: "150px" }}
                      width="100%"
                    />
                  )}
                  <Link to={post.url} target="_blank">
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor} _hover={{ color: accentColor }}>
                      {post.title}
                    </Text>
                  </Link>
                  <Wrap spacing={1}>
                    {post.labels && post.labels.map((label: string, idx: number) => (
                      <WrapItem key={idx}>
                        <Tag size={{ base: "sm", md: "md" }} variant="subtle" colorScheme="cyan">
                          <TagLabel>{label}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <HStack fontSize={{ base: "xs", md: "sm" }} color={mutedColor}>
                    <Icon as={FaClock} />
                    <Text>{new Date(post.favoriteAt || post.timestamp).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Link to={post.url} target="_blank">
                      <Button size="sm" colorScheme="blue" leftIcon={<Icon as={FaClock} />}>
                        Đọc ngay
                      </Button>
                    </Link>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default FavoritePostsTab; 