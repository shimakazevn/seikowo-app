import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
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
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaClock, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import useFavoriteBookmarkStore from '../../../store/useFollowBookmarkStore';
import useUserStore from '../../../store/useUserStore';
import type { FavoritePost } from '../../../types/global';
import { AppModal } from '../../common/AppModal';

// Helper function to normalize timestamp
const normalizeTimestamp = (post: FavoritePost): number => {
  // Try to get timestamp from favoriteAt first
  if (post.favoriteAt && !isNaN(Number(post.favoriteAt))) {
    return Number(post.favoriteAt);
  }
  // Then try timestamp
  if (post.timestamp && !isNaN(Number(post.timestamp))) {
    return Number(post.timestamp);
  }
  // If both are invalid, use current time
  return Date.now();
};

interface FavoritePostsTabProps {
  favoritesPosts?: FavoritePost[];
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
  const [error, setError] = React.useState<string | null>(null);

  const handleRemoveClick = (post: FavoritePost) => {
    setSelectedPost(post);
    onOpen();
  };

  const handleConfirmRemove = async () => {
    if (!selectedPost || !userId) {
      setError('Vui lòng đăng nhập để xóa bài viết khỏi danh sách yêu thích');
      return;
    }
    
    try {
      const success = await removeFavorite(selectedPost.id, userId, toast);
      if (success) {
        onClose();
        setError(null);
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Không thể xóa bài viết khỏi danh sách yêu thích');
    }
  };

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle mr={2}>Lỗi!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      {favoritesPosts?.length === 0 ? (
        <Text color={mutedColor} textAlign="center" py={10}>
          Bạn chưa yêu thích bài viết nào.
        </Text>
      ) : (
        <VStack spacing={0} align="stretch">
          {favoritesPosts?.map((post: FavoritePost) => (
            <Box 
              key={post.id} 
              p={2} 
              borderBottom="1px solid" 
              borderColor={isDark ? "gray.700" : "gray.200"} 
              _last={{ borderBottom: "none" }}
            >
                <VStack align="stretch" spacing={0.5}>
                  <Link to={post.url} target="_blank">
                    <Text 
                      fontSize="lg" 
                      fontWeight="bold" 
                      color={textColor} 
                      _hover={{ color: accentColor }}
                      noOfLines={2}
                    >
                      {post.title}
                    </Text>
                  </Link>
                  
                  <Wrap spacing={1}>
                    {post.labels && post.labels.map((label: string, index: number) => (
                      <WrapItem key={`${post.id}-${label}-${index}`}>
                        <Tag size="sm" variant="subtle" colorScheme="cyan">
                          <TagLabel>{label}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>

                  <HStack key={`${post.id}-metadata`} spacing={1}>
                    <Icon as={FaClock} />
                    <Text>
                      {(() => {
                        const timestamp = normalizeTimestamp(post);
                        const date = new Date(timestamp);
                        return date.toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })()}
                    </Text>
                    <Spacer />
                    <Link to={post.url} target="_blank" style={{ textDecoration: 'none' }}>
                      <HStack 
                        spacing={1} 
                        _hover={{ color: accentColor }} 
                        cursor="pointer" 
                        color={mutedColor}
                      >
                        <Icon as={FaExternalLinkAlt} />
                        <Text fontWeight="bold">Đọc bài viết</Text>
                      </HStack>
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
            </Box>
          ))}
        </VStack>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
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