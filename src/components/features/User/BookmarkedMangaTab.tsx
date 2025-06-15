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
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { FaClock, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import type { MangaBookmark } from '../../../types/global';
import useFavoriteBookmarkStore from '../../../store/useFollowBookmarkStore';
import useUserStore from '../../../store/useUserStore';

interface BookmarkedMangaTabProps {
  bookmarkedPosts?: MangaBookmark[];
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
  const toast = useToast();
  const { userId } = useUserStore();
  const { removeBookmark } = useFavoriteBookmarkStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedBookmark, setSelectedBookmark] = React.useState<MangaBookmark | null>(null);

  const handleRemoveClick = (bookmark: MangaBookmark) => {
    setSelectedBookmark(bookmark);
    onOpen();
  };

  const handleConfirmRemove = async () => {
    if (!selectedBookmark || !userId) return;
    
    const success = await removeBookmark(selectedBookmark.id, userId, toast);
    if (success) {
      onClose();
    }
  };

  return (
    <Box>
      {bookmarkedPosts?.length === 0 ? (
        <Text color={mutedColor} textAlign="center" py={10}>
          Bạn chưa bookmark truyện nào.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }}>
          {bookmarkedPosts?.map((bookmark) => (
            <Card key={bookmark.id} bg={cardBg} borderRadius="lg" shadow="md">
              <CardBody p={{ base: 3, md: 4 }}>
                <VStack align="stretch" spacing={{ base: 2, md: 3 }}>
                  <HStack justify="space-between">
                    <Link to={bookmark.url} target="_blank">
                      <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor} _hover={{ color: accentColor }}>
                        {bookmark.title}
                      </Text>
                    </Link>
                    <IconButton
                      aria-label="Xóa bookmark"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleRemoveClick(bookmark)}
                    />
                  </HStack>
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

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận xóa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Bạn có chắc chắn muốn xóa "{selectedBookmark?.title}" khỏi danh sách bookmark?</Text>
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

export default BookmarkedMangaTab; 