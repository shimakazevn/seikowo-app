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
} from '@chakra-ui/react';
import { FaEllipsisV, FaTrash, FaEdit, FaReply } from 'react-icons/fa';
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
}

const UserCommentsTab: React.FC = () => {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<UserComment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editContent, setEditContent] = useState('');
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { getValidAccessToken } = useUserStore();
  const commentService = new CommentService();

  const isDark = colorMode === 'dark';
  const textColor = isDark ? '#ffffff' : '#1a202c';
  const mutedColor = isDark ? '#a0aec0' : '#718096';
  const accentColor = isDark ? '#00d4ff' : '#3182ce';

  const fetchUserComments = async () => {
    try {
      setIsLoading(true);
      const token = await getValidAccessToken();
      if (!token) {
        throw new Error('No valid access token');
      }

      // Fetch all comments for the blog
      const response = await fetchWithAuth(
        `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/comments?maxResults=500`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      const userComments = data.items || [];

      // Fetch post titles for each comment
      const commentsWithPostInfo = await Promise.all(
        userComments.map(async (comment: any) => {
          try {
            const postResponse = await fetchWithAuth(
              `https://www.googleapis.com/blogger/v3/blogs/${blogConfig.blogId}/posts/${comment.post.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            const postData = await postResponse.json();
            return {
              ...comment,
              postTitle: postData.title,
              postUrl: postData.url
            };
          } catch (error) {
            console.error('Error fetching post info:', error);
            return comment;
          }
        })
      );

      setComments(commentsWithPostInfo);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
        throw new Error('No valid access token');
      }

      await commentService.deleteComment(comment.id, comment.postId, token);
      
      setComments(prev => prev.filter(c => c.id !== comment.id));
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
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
        throw new Error('No valid access token');
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
        throw new Error('Failed to update comment');
      }

      const updatedComment = await response.json();
      setComments(prev => prev.map(c => 
        c.id === selectedComment.id ? { ...c, content: updatedComment.content, updated: updatedComment.updated } : c
      ));

      toast({
        title: 'Success',
        description: 'Comment updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment',
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

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {isLoading ? (
          <HStack justify="center" py={8}>
            <Spinner size="md" color={accentColor} />
            <Text fontSize="sm" color={mutedColor}>Loading comments...</Text>
          </HStack>
        ) : comments.length === 0 ? (
          <VStack spacing={3} py={8}>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              You haven't made any comments yet.
            </Text>
          </VStack>
        ) : (
          comments.map((comment) => (
            <Box
              key={comment.id}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              borderColor={isDark ? 'gray.700' : 'gray.200'}
              bg={isDark ? 'gray.800' : 'white'}
            >
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={mutedColor}>
                    On post: {comment.postTitle || 'Unknown Post'}
                  </Text>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaEllipsisV />}
                      variant="ghost"
                      size="sm"
                      aria-label="Comment options"
                    />
                    <MenuList>
                      <MenuItem
                        icon={<FaEdit />}
                        onClick={() => openEditModal(comment)}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        icon={<FaTrash />}
                        onClick={() => handleDeleteComment(comment)}
                        color="red.500"
                      >
                        Delete
                      </MenuItem>
                      <MenuItem
                        icon={<FaReply />}
                        onClick={() => window.open(comment.postUrl, '_blank')}
                      >
                        View Post
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>

                <Text color={textColor} fontSize="sm">
                  {comment.content}
                </Text>

                <HStack justify="space-between" fontSize="xs" color={mutedColor}>
                  <Text>
                    {new Date(comment.published).toLocaleDateString()}
                    {comment.updated && comment.updated !== comment.published && ' (edited)'}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          ))
        )}
      </VStack>

      {/* Edit Comment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              size="sm"
              minH="150px"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleEditComment}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserCommentsTab; 