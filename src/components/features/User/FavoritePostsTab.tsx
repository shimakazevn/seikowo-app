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
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import { FaClock, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useFavoriteBookmarkStore from '../../../store/useFollowBookmarkStore';
import useUserStore from '../../../store/useUserStore';
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
  const toast = useToast();
  const { userId } = useUserStore();
  const { removeFavorite } = useFavoriteBookmarkStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPost, setSelectedPost] = React.useState<FavoritePost | null>(null);

  const handleRemoveClick = (post: FavoritePost) => {
    setSelectedPost(post);
    onOpen();
  };

  const handleConfirmRemove = async () => {
    if (!selectedPost || !userId) return;
    
    const success = await removeFavorite(selectedPost.id, userId, toast);
    if (success) {
      onClose();
    }
  };

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
                  <HStack spacing={2} color={mutedColor}>
                    <Icon as={FaClock} />
                    <Text>{new Date(post.favoriteAt || post.timestamp).toLocaleDateString()}</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Link to={post.url} target="_blank">
                      <Button size="sm" colorScheme="blue" leftIcon={<Icon as={FaClock} />}>
                        Đọc ngay
                      </Button>
                    </Link>
                    <IconButton
                      aria-label="Xóa khỏi yêu thích"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleRemoveClick(post)}
                    />
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận xóa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Bạn có chắc chắn muốn xóa bài viết "{selectedPost?.title}" khỏi danh sách yêu thích?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="red" onClick={handleConfirmRemove}>
              Xóa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FavoritePostsTab; 