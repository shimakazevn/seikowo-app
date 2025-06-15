import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  useColorMode,
  Spinner,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
} from '@chakra-ui/react';
import { FaEllipsisV, FaTrash, FaEdit, FaReply, FaPencilAlt } from 'react-icons/fa';
import { CommentService } from '../../../services/commentService';
import useUserStore from '../../../store/useUserStore';
import useCommentStore, { Comment as StoreComment } from '../../../store/useCommentStore';
import { fetchWithAuth, getBloggerApiUrl } from '../../../utils/apiUtils';
import { blogConfig } from '../../../config';
import type { FavoritePost, MangaBookmark } from '../../../types/global';

interface UserComment extends StoreComment {
  postTitle: string | null;
  postUrl: string | null;
  postStatus: 'active' | 'deleted' | 'inaccessible';
}

interface UserCommentsTabProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  favoritesPosts?: FavoritePost[];
  bookmarkedPosts?: MangaBookmark[];
}

const UserCommentsTab: React.FC<UserCommentsTabProps> = ({
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
  favoritesPosts,
  bookmarkedPosts,
}) => {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<UserComment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editContent, setEditContent] = useState('');
  const toast = useToast();
  const { getValidAccessToken } = useUserStore();
  const commentService = new CommentService();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const { userComments, fetchUserComments, updateComment, deleteComment } = useCommentStore();

  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fetchUserComments();

        const userStore = useUserStore.getState();
        const userEmail = userStore.user?.email;
        const googleUserId = userStore.user?.sub;

        if (!userEmail || !googleUserId) {
          setComments([]);
          setError('Vui lòng đăng nhập để xem bình luận của bạn');
          return;
        }

        let currentBloggerUserId: string | null = null;

        try {
          const userProfileUrl = getBloggerApiUrl('/users/self');
          const userProfileResponse = await fetchWithAuth(userProfileUrl);
          if (userProfileResponse.ok) {
            const userProfileData = await userProfileResponse.json();
            currentBloggerUserId = userProfileData.id;
          }
        } catch (profileError) {
          console.error('[UserCommentsTab] Error fetching Blogger User Profile:', profileError);
        }

        let filteredUserComments: StoreComment[] = [];

        if (currentBloggerUserId) {
          filteredUserComments = userComments.filter((comment) => 
            comment.author?.id === currentBloggerUserId
          );
        } else {
          filteredUserComments = userComments.filter((comment) => 
            comment.author?.email?.toLowerCase() === userEmail.toLowerCase()
          );
        }

        const commentsWithPostInfo = await Promise.all(
          filteredUserComments.map(async (comment) => {
            const baseComment: UserComment = {
              ...comment,
              postTitle: null,
              postStatus: 'inaccessible',
              postUrl: null
            };

            if (!comment.postId) {
              return {
                ...baseComment,
                postTitle: 'Bài viết không xác định hoặc đã bị xóa',
                postStatus: 'deleted'
              };
            }

            try {
              const postUrl = getBloggerApiUrl(
                `/blogs/${blogConfig.blogId}/posts/${comment.postId}`
              );
              const postResponse = await fetchWithAuth(postUrl);
              const postData = await postResponse.json();
              return {
                ...baseComment,
                postTitle: postData.title,
                postStatus: 'active',
                postUrl: postData.url
              };
            } catch (error: unknown) {
              if (error instanceof Error) {
                if (error.message.includes('Bài viết không tồn tại') || error.message.includes('404')) {
                  return {
                    ...baseComment,
                    postTitle: 'Bài viết đã bị xóa',
                    postStatus: 'deleted'
                  };
                }
                
                if (error.message.includes('Unauthorized') || error.message.includes('403')) {
                  return {
                    ...baseComment,
                    postTitle: 'Bài viết không có quyền truy cập',
                    postStatus: 'inaccessible'
                  };
                }
              }
              
              return {
                ...baseComment,
                postTitle: 'Không thể tải thông tin bài viết',
                postStatus: 'inaccessible'
              };
            }
          })
        );

        setComments(commentsWithPostInfo);
      } catch (error: unknown) {
        console.error('Error loading comments:', error);
        if (error instanceof Error) {
          setError(error.message || 'Có lỗi xảy ra khi tải danh sách bình luận');
        } else {
          setError('Có lỗi xảy ra khi tải danh sách bình luận');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [userComments]);

  const handleDeleteComment = async (comment: UserComment) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xóa bình luận');
      }

      await commentService.deleteComment(comment.id, comment.postId, token);
      deleteComment(comment.id);
      
      toast({
        title: 'Thành công',
        description: 'Đã xóa bình luận',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa bình luận',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditComment = async () => {
    if (!selectedComment || !editContent.trim()) return;

    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để chỉnh sửa bình luận');
      }

      const editUrl = getBloggerApiUrl(
        `/blogs/${blogConfig.blogId}/posts/${selectedComment.postId}/comments/${selectedComment.id}`
      );
      const response = await fetchWithAuth(editUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể chỉnh sửa bình luận');
      }

      const updatedComment = await response.json();
      updateComment(updatedComment);
      
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bình luận',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể chỉnh sửa bình luận',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openEditModal = (comment: UserComment) => {
    setSelectedComment(comment);
    setEditContent(comment.content);
    onOpen();
  };

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color={accentColor} />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle mr={2}>Lỗi!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (comments.length === 0) {
    return (
      <Text color={mutedColor} textAlign="center" py={10}>
        Bạn chưa có bình luận nào.
      </Text>
    );
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {comments.map((comment) => (
          <Box
            key={comment.id}
            p={4}
            bg={cardBg}
            borderRadius="md"
            borderWidth="1px"
            borderColor={isDark ? 'gray.600' : 'gray.200'}
          >
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold" color={textColor}>
                  {comment.postTitle}
                </Text>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisV />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem
                      icon={<FaEdit />}
                      onClick={() => openEditModal(comment)}
                    >
                      Chỉnh sửa
                    </MenuItem>
                    <MenuItem
                      icon={<FaTrash />}
                      color="red.500"
                      onClick={() => handleDeleteComment(comment)}
                    >
                      Xóa
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>

              <Text color={mutedColor} fontSize="sm">
                {new Date(comment.published).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>

              <Text color={textColor}>{comment.content}</Text>

              {comment.postUrl && (
                <Button
                  as="a"
                  href={comment.postUrl}
                  target="_blank"
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                >
                  Xem bài viết
                </Button>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa bình luận</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Nhập nội dung bình luận..."
              size="sm"
              resize="vertical"
              minH="100px"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleEditComment}>
              Lưu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserCommentsTab; 