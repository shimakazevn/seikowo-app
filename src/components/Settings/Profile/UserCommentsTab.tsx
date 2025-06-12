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
} from '@chakra-ui/react';
import { FaEllipsisV, FaTrash, FaEdit, FaReply, FaPencilAlt } from 'react-icons/fa';
import { CommentService } from '../../../services/commentService';
import useUserStore from '../../../store/useUserStore';
import { fetchWithAuth } from '../../../utils/apiUtils';
import { blogConfig } from '../../../config';

interface UserComment {
  id: string;
  postId: string;
  content: string;
  published: string;
  updated?: string;
  postTitle?: string;
  postUrl?: string;
  author: {
    displayName: string;
    image: {
      url: string;
    };
  };
  postStatus: 'active' | 'deleted' | 'inaccessible';
}

interface UserCommentsTabProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
}

const UserCommentsTab: React.FC<UserCommentsTabProps> = ({
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
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

  const fetchUserComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch comments for the current user by fetching all comments for the blog and filtering
      const commentsResponse = await fetchWithAuth(
        `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/comments?maxResults=100`
      );
      
      if (!commentsResponse.ok) {
        throw new Error('Không thể tải danh sách bình luận');
      }
      
      const data = await commentsResponse.json();
      console.log('[fetchUserComments] Raw data from API:', data);

      if (!data.items) {
        setComments([]);
        console.log('[fetchUserComments] No items found in raw data.');
        return;
      }

      const userStore = useUserStore.getState();
      const currentUserId = userStore.user?.sub;
      console.log('[fetchUserComments] Current User ID:', currentUserId);

      const filteredComments = data.items.filter((comment: any) => {
        const isMatch = comment.author?.id === currentUserId;
        console.log(
          `[fetchUserComments] Comment ID: ${comment.id}, Author ID: ${comment.author?.id}, Match: ${isMatch}`
        );
        return isMatch;
      });

      console.log('[fetchUserComments] Filtered comments:', filteredComments);

      // Fetch thông tin bài viết cho mỗi comment đã lọc
      const commentsWithPostInfo = await Promise.all(
        filteredComments.map(async (comment: any) => {
          const baseComment = {
            id: comment.id,
            content: comment.content,
            published: comment.published,
            updated: comment.updated,
            postId: comment.post.id,
            postTitle: null as string | null,
            postStatus: 'inaccessible' as const,
            postUrl: null as string | null
          };

          try {
            // Thử fetch thông tin bài viết
            const postResponse = await fetchWithAuth(
              `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts/${comment.post.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${await getValidAccessToken()}`
                }
              }
            );
            const postData = await postResponse.json();
            return {
              ...baseComment,
              postTitle: postData.title,
              postStatus: 'active' as const,
              postUrl: postData.url
            };
          } catch (error: any) {
            console.error(`Error fetching post ${comment.post.id}:`, error);
            
            // Xử lý các trường hợp lỗi khác nhau
            if (error.message.includes('Bài viết không tồn tại') || error.message.includes('404')) {
              return {
                ...baseComment,
                postTitle: 'Bài viết đã bị xóa',
                postStatus: 'deleted' as const
              };
            }
            
            if (error.message.includes('Unauthorized') || error.message.includes('403')) {
              return {
                ...baseComment,
                postTitle: 'Bài viết không có quyền truy cập',
                postStatus: 'inaccessible' as const
              };
            }
            
            // Trường hợp lỗi khác
            return {
              ...baseComment,
              postTitle: 'Không thể tải thông tin bài viết',
              postStatus: 'inaccessible' as const
            };
          }
        })
      );

      setComments(commentsWithPostInfo);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải danh sách bình luận');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserComments();
  }, []);

  const handleDeleteComment = async (comment: UserComment) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập để xóa bình luận');
      }

      await commentService.deleteComment(comment.id, comment.postId, token);
      
      setComments(prev => prev.filter(c => c.id !== comment.id));
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

      const response = await fetchWithAuth(
        `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts/${selectedComment.postId}/comments/${selectedComment.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: editContent
          })
        }
      );

      if (!response.ok) {
        throw new Error('Không thể cập nhật bình luận');
      }

      const updatedComment = await response.json();
      setComments(prev => prev.map(c => 
        c.id === selectedComment.id ? { ...c, content: updatedComment.content, updated: updatedComment.updated } : c
      ));

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật bình luận',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật bình luận',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openEditModal = (comment: UserComment) => {
    setSelectedComment(comment);
    setEditContent(comment.content);
    setEditingCommentId(comment.id);
    onOpen();
  };

  if (error) {
    return (
      <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Lỗi
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {isLoading ? (
          <HStack justify="center" py={8}>
            <Spinner size="md" color={accentColor} />
            <Text fontSize="sm" color={mutedColor}>Đang tải bình luận...</Text>
          </HStack>
        ) : comments.length === 0 ? (
          <VStack spacing={3} py={8}>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              Bạn chưa có bình luận nào.
            </Text>
          </VStack>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-4 rounded-lg ${cardBg} shadow-sm`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm ${mutedColor}`}>
                        {new Date(comment.published).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {comment.updated !== comment.published && (
                        <span className={`text-xs ${mutedColor}`}>
                          (đã chỉnh sửa)
                        </span>
                      )}
                    </div>
                    
                    <div className={`mb-2 ${textColor}`}>
                      <span className="font-medium">Bài viết: </span>
                      {comment.postStatus === 'active' && comment.postUrl ? (
                        <a
                          href={comment.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:underline ${accentColor}`}
                        >
                          {comment.postTitle}
                        </a>
                      ) : (
                        <span className={`italic ${mutedColor}`}>
                          {comment.postTitle}
                        </span>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={`w-full p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} ${textColor}`}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditContent('');
                            }}
                            className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor}`}
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleEditComment()}
                            className="px-3 py-1 rounded bg-primary text-white hover:bg-primary/90"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`prose max-w-none ${textColor}`}>
                        <div dangerouslySetInnerHTML={{ __html: comment.content }} />
                      </div>
                    )}
                  </div>
                  
                  {comment.postStatus === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditContent(comment.content.replace(/<[^>]*>/g, ''));
                        }}
                        className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${textColor}`}
                        title="Chỉnh sửa"
                      >
                        <FaPencilAlt className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment)}
                        className={`p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500`}
                        title="Xóa"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </VStack>

      {/* Edit Comment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa bình luận</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Chỉnh sửa bình luận của bạn..."
              size="sm"
              minH="150px"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" onClick={handleEditComment}>
              Lưu thay đổi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserCommentsTab; 