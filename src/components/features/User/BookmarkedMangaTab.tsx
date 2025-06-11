import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
  Button,
} from '@chakra-ui/react';
import { FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import type { MangaBookmark } from '../../../types/global';

interface BookmarkedMangaTabProps {
  bookmarkedPosts: MangaBookmark[];
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
}

const BookmarkedMangaTab: React.FC<BookmarkedMangaTabProps> = ({
  bookmarkedPosts,
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
}) => {
  return (
    <Box>
      {bookmarkedPosts.length === 0 ? (
        <Text color={mutedColor} textAlign="center" py={10}>
          Bạn chưa bookmark truyện nào.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
          {bookmarkedPosts.map((bookmark) => (
            <Card key={bookmark.id} bg={cardBg} borderRadius="lg" shadow="md">
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
                  <Link to={bookmark.url} target="_blank">
                    <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor} _hover={{ color: accentColor }}>
                      {bookmark.title}
                    </Text>
                  </Link>
                  <Text fontSize={{ base: "sm", md: "md" }} color={mutedColor}>
                    Trang hiện tại: {bookmark.currentPage} / {bookmark.totalPages || 'Không rõ'}
                  </Text>
                  <HStack fontSize={{ base: "xs", md: "sm" }} color={mutedColor}>
                    <Icon as={FaClock} />
                    <Text>{new Date(bookmark.timestamp).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Link to={bookmark.url} target="_blank">
                      <Button size="sm" colorScheme="blue" leftIcon={<Icon as={FaClock} />}>
                        Tiếp tục đọc
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

export default BookmarkedMangaTab; 