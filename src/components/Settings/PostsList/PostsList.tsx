import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  Select,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Spinner,
  Flex,
  Heading,
  HStack,
  InputGroup,
  InputLeftElement,
  Input,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { MdAdd, MdSave, MdPublish, MdDrafts, MdEdit, MdDelete, MdRefresh } from 'react-icons/md';
import { FaBook, FaBookOpen, FaFilm, FaGamepad, FaFeatherAlt } from 'react-icons/fa';
import { useAuthContext } from '../../../contexts/AuthContext';
import { bloggerAdminService, BloggerPost, CreatePostRequest } from '../../../services/bloggerAdminService';
import { authService } from '../../../services/authService';
import RichTextEditor from './Editor';
import AdminPostCard from './PostCard';
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import EditPostForm from './EditForm';
import { SearchIcon } from '@chakra-ui/icons';

interface PostFormData {
  title: string;
  content: string;
  labels: string[];
  status: 'DRAFT' | 'LIVE' | 'SCHEDULED';
}

interface PostsListProps {
  skipAuthCheck?: boolean;
  bloggerUserRole?: 'ADMIN' | 'AUTHOR' | 'READER' | 'NONE' | null;
}

const PostsList: React.FC<PostsListProps> = ({ skipAuthCheck = false, bloggerUserRole }) => {
  const { isAuthenticated, user } = useAuthContext();
  const navigate = useNavigate();
  const toast = useToast();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [posts, setPosts] = useState<BloggerPost[]>([]);
  const [allPosts, setAllPosts] = useState<BloggerPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'DRAFT' | 'SCHEDULED'>('ALL');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BloggerPost | null>(null);
  const [sortCriterion, setSortCriterion] = useState<'updated-newest' | 'updated-oldest' | 'published-newest' | 'published-oldest'>('published-newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Refs for infinite scroll and mount tracking
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const lastLoadTimeRef = useRef(0);

  // Form state
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    labels: [],
    status: 'DRAFT'
  });

  const [formErrors, setFormErrors] = useState<Partial<PostFormData>>({});

  const loadPosts = useCallback(async (reset: boolean = true) => {
    // Debounce: prevent rapid successive calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 1000) { // 1 second debounce
      return;
    }
    lastLoadTimeRef.current = now;

    // Prevent multiple simultaneous calls
    if (reset && isLoading) {
      return;
    }
    if (!reset && isLoadingMore) {
      return;
    }

    try {
      if (reset) {
        setIsLoading(true);
        setAllPosts([]);
        setPosts([]);
        setNextPageToken(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      // Try the new method first for better draft support
      let loadedPosts: BloggerPost[] = [];
      let apiResponse: any = null;

      try {
        loadedPosts = await bloggerAdminService.getAllPostsIncludingDrafts(50);
        apiResponse = { nextPageToken: null };
      } catch (error: any) {
        console.error('[AdminPage] Error fetching posts with getAllPostsIncludingDrafts:', error);
        throw error;
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (reset) {
        setAllPosts(loadedPosts);
        filterAndSetPosts(loadedPosts, statusFilter, user?.id, sortCriterion);
      } else {
        const updatedAllPosts = [...allPosts, ...loadedPosts];
        setAllPosts(updatedAllPosts);
        filterAndSetPosts(updatedAllPosts, statusFilter, user?.id, sortCriterion);
      }

      // Update pagination state
      setNextPageToken(apiResponse?.nextPageToken || null);
      setHasMore(!!apiResponse?.nextPageToken && loadedPosts.length > 0);

    } catch (error: any) {
      console.error('[AdminPage] Error loading posts:', error);

      let errorMessage = 'Không thể tải danh sách bài viết';
      if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.message?.includes('403') || error.message?.includes('forbidden')) {
        errorMessage = 'Bạn không có quyền truy cập blog này.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'lỗi tải bài viết',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [allPosts, statusFilter, nextPageToken, toast, isLoading, isLoadingMore, user?.id, bloggerUserRole, sortCriterion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && nextPageToken) {
          // Inline the loadMore logic to avoid dependency issues
          loadPosts(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoadingMore, nextPageToken, loadPosts]);

  // Remove admin check effect
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts(true);
    }
  }, [isAuthenticated]);

  // Filter posts by status and author
  const filterAndSetPosts = (postsToFilter: BloggerPost[], filter: string, currentUserId: string | undefined | null, sortCriterion: 'updated-newest' | 'updated-oldest' | 'published-newest' | 'published-oldest') => {
    let filteredByStatus = postsToFilter;

    switch (filter) {
      case 'LIVE':
        filteredByStatus = postsToFilter.filter(post => post.status === 'LIVE');
        break;
      case 'DRAFT':
        filteredByStatus = postsToFilter.filter(post => post.status === 'DRAFT');
        break;
      case 'SCHEDULED':
        filteredByStatus = postsToFilter.filter(post => post.status === 'SCHEDULED');
        break;
      case 'ALL':
      default:
        filteredByStatus = postsToFilter;
        break;
    }

    // Apply author filter ONLY if the user is NOT an ADMIN
    // We rely on the API to filter by author when view=AUTHOR is used.
    const finalFilteredPosts = (bloggerUserRole === 'ADMIN')
      ? filteredByStatus
      : filteredByStatus; // Remove client-side author filtering as API already filters by author

    // Apply sorting logic here now
    const sortedAndFilteredPosts = [...finalFilteredPosts].sort((a, b) => {
      const dateA_updated = new Date(a.updated || 0).getTime();
      const dateB_updated = new Date(b.updated || 0).getTime();
      const dateA_published = new Date(a.published || 0).getTime();
      const dateB_published = new Date(b.published || 0).getTime();

      let comparison = 0;

      if (sortCriterion === 'updated-newest') {
        comparison = dateB_updated - dateA_updated; // Newest first
      } else if (sortCriterion === 'updated-oldest') {
        comparison = dateA_updated - dateB_updated; // Oldest first
      } else if (sortCriterion === 'published-newest') {
        comparison = dateB_published - dateA_published; // Newest first
      } else if (sortCriterion === 'published-oldest') {
        comparison = dateA_published - dateB_published; // Oldest first
      }
      return comparison;
    });

    setPosts(sortedAndFilteredPosts);
  };

  // Handle status filter change
  const handleStatusFilterChange = (newFilter: 'ALL' | 'LIVE' | 'DRAFT' | 'SCHEDULED') => {
    setStatusFilter(newFilter);
    filterAndSetPosts(allPosts, newFilter, user?.id, sortCriterion);
  };

  // Handle sort order change
  const handleSortCriterionChange = (newCriterion: 'updated-newest' | 'updated-oldest' | 'published-newest' | 'published-oldest') => {
    setSortCriterion(newCriterion);
    filterAndSetPosts(allPosts, statusFilter, user?.id, newCriterion);
  };

  // Get post counts by status
  const getPostCounts = () => {
    const live = posts.filter(post => post.status === 'LIVE').length;
    const draft = posts.filter(post => post.status === 'DRAFT').length;
    const scheduled = posts.filter(post => post.status === 'SCHEDULED').length;
    const total = posts.length;

    return { total, live, draft, scheduled };
  };

  const validateForm = (): boolean => {
    const errors: Partial<PostFormData> = {};

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }

    if (!formData.content.trim()) {
      errors.content = 'Nội dung không được để trống';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createNewPost = async () => {
    try {
      setIsLoading(true);

      // Check if user has permission to create posts
      if (bloggerUserRole !== 'ADMIN' && bloggerUserRole !== 'AUTHOR') {
        toast({
          title: 'Không có quyền',
          description: 'Bạn không có quyền tạo bài viết mới',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
        return;
      }

      // Approach 1: Try to create draft directly
      let draftPost;
      try {
        draftPost = await bloggerAdminService.createDraftPost({
          title: 'Bài viết mới',
          content: '<p>Nội dung bài viết...</p>',
          labels: []
        });

        // If still published, try to revert
        if (draftPost.status === 'LIVE' && draftPost.id) {
          try {
            await bloggerAdminService.updatePost({
              id: draftPost.id,
              title: draftPost.title,
              content: draftPost.content,
              labels: draftPost.labels || [],
              status: 'DRAFT'
            });
          } catch (updateError) {
            console.warn('[AdminPage] Could not update to draft status:', updateError);
          }
        }

      } catch (createError) {
        console.error('[AdminPage] Error with createDraftPost, falling back to regular creation:', createError);

        // Fallback: Create regular post then immediately update to draft
        draftPost = await bloggerAdminService.createPost({
          title: 'Bài viết mới',
          content: '<p>Nội dung bài viết...</p>',
          labels: [],
          status: 'DRAFT'
        });
      }

      // Store post info for debugging
      localStorage.setItem('lastCreatedPost', JSON.stringify({
        id: draftPost.id,
        status: draftPost.status,
        title: draftPost.title,
        createdAt: new Date().toISOString()
      }));

      toast({
        title: 'tạo bài viết thành công',
        description: `id: ${draftPost.id} | trạng thái: ${draftPost.status === 'DRAFT' ? 'bản nháp' : 'đã xuất bản'}`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });

      // Small delay to ensure post is available
      setTimeout(() => {
        navigate(`/post/edit/${draftPost.id}`);
      }, 500);

    } catch (error: any) {
      console.error('[AdminPage] Error creating new post:', error);
      toast({
        title: 'lỗi tạo bài viết',
        description: error.message || 'không thể tạo bài viết mới',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const postData: CreatePostRequest = {
        title: formData.title,
        content: formData.content,
        labels: formData.labels,
        status: formData.status
      };

      if (selectedPost) {
        // Update existing post
        await bloggerAdminService.updatePost({
          id: selectedPost.id!,
          ...postData
        });
        toast({
          title: 'cập nhật thành công',
          description: 'bài viết đã được cập nhật',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new post
        await bloggerAdminService.createPost(postData);
        toast({
          title: 'tạo bài viết thành công',
          description: 'bài viết mới đã được tạo',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }

      // Reset form and reload posts
      resetForm();
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Lỗi lưu bài viết',
        description: error.message || 'Không thể lưu bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      labels: [],
      status: 'DRAFT'
    });
    setFormErrors({});
    setSelectedPost(null);
    setShowForm(false);
  };

  const handleEdit = (post: BloggerPost) => {
    setSelectedPost(post);
    setShowForm(true);
  };

  const handleEditInPage = (postId: string) => {
    navigate(`/post/edit/${postId}`);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      setIsLoading(true);
      await bloggerAdminService.deletePost(postId);
      toast({
        title: 'Xóa thành công',
        description: 'Bài viết đã được xóa',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Lỗi xóa bài viết',
        description: error.message || 'Không thể xóa bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      setIsLoading(true);
      await bloggerAdminService.publishPost(postId);
      toast({
        title: 'Xuất bản thành công',
        description: 'Bài viết đã được xuất bản',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast({
        title: 'Lỗi xuất bản',
        description: error.message || 'Không thể xuất bản bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const handleFormCancel = () => {
    setSelectedPost(null);
    setShowForm(false);
  };

  const handleFormSuccess = async () => {
    setSelectedPost(null);
    setShowForm(false);
    await loadPosts(true);
  };

  const handleSavePost = async (post: BloggerPost) => {
    try {
      setIsLoading(true);
      await bloggerAdminService.updatePost({
        id: post.id!,
        title: post.title,
        content: post.content,
        labels: post.labels || [],
        status: post.status
      });
      toast({
        title: 'Cập nhật thành công',
        description: 'Bài viết đã được cập nhật',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Lỗi lưu bài viết',
        description: error.message || 'Không thể lưu bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (post: BloggerPost) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

    try {
      setIsLoading(true);
      await bloggerAdminService.deletePost(post.id!);
      toast({
        title: 'Xóa thành công',
        description: 'Bài viết đã được xóa',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Lỗi xóa bài viết',
        description: error.message || 'Không thể xóa bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishPost = async (post: BloggerPost) => {
    try {
      setIsLoading(true);
      await bloggerAdminService.publishPost(post.id!);
      toast({
        title: 'Xuất bản thành công',
        description: 'Bài viết đã được xuất bản',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error publishing post:', error);
      toast({
        title: 'Lỗi xuất bản',
        description: error.message || 'Không thể xuất bản bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnpublishPost = async (post: BloggerPost) => {
    try {
      setIsLoading(true);
      await bloggerAdminService.revertToDraft(post.id!);
      toast({
        title: 'Hủy xuất bản thành công',
        description: 'Bài viết đã được hủy xuất bản và chuyển về trạng thái nháp',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await loadPosts(true);
    } catch (error: any) {
      console.error('Error reverting post to draft:', error);
      toast({
        title: 'Lỗi hủy xuất bản',
        description: error.message || 'Không thể hủy xuất bản bài viết',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!skipAuthCheck && !isAuthenticated) {
    return (
      <Box w="100%" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>yêu cầu đăng nhập!</AlertTitle>
          <AlertDescription>
            bạn cần đăng nhập để truy cập trang quản trị.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box w="100%" p={0}>
      <VStack align="stretch" spacing={8}>
        {/* Header & Actions */}
        <Flex
          justify="space-between"
          align="center"
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          w="100%"
        >
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value as any)}
            width={{ base: '100%', md: '200px' }}
            size="md"
            variant="outline"
          >
            <option value="ALL" defaultChecked>All Posts ({getPostCounts().total})</option>
            <option value="LIVE">Published ({getPostCounts().live})</option>
            <option value="DRAFT">Drafts ({getPostCounts().draft})</option>
            <option value="SCHEDULED">Scheduled ({getPostCounts().scheduled})</option>
          </Select>

          <Select
            value={sortCriterion}
            onChange={(e) => handleSortCriterionChange(e.target.value as 'updated-newest' | 'updated-oldest' | 'published-newest' | 'published-oldest')}
            width={{ base: '100%', md: '200px' }}
            size="md"
            variant="outline"
          >
            <option value="published-newest">Ngày tạo (Mới nhất)</option>
            <option value="published-oldest">Ngày tạo (Cũ nhất)</option>
            <option value="updated-newest">Ngày cập nhật (Mới nhất)</option>
            <option value="updated-oldest">Ngày cập nhật (Cũ nhất)</option>
          </Select>

          <Button
            variant="ghost"
            leftIcon={<MdAdd />}
            onClick={() => setIsCreateModalOpen(true)}
            isLoading={isLoading}
            loadingText="Creating..."
            size="md"
            w={{ base: '100%', md: 'auto' }}
            colorScheme="blue"
          >
            Create New Post
          </Button>
        </Flex>

        {/* Modal chọn loại form tạo mới */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Chọn loại bài viết</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Button leftIcon={<MdEdit />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Bài viết thường
                </Button>
                <Button leftIcon={<FaBookOpen />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Manga dài tập
                </Button>
                <Button leftIcon={<FaBook />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Manga one-shot
                </Button>
                <Button leftIcon={<FaFilm />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Anime
                </Button>
                <Button leftIcon={<FaFeatherAlt />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Lightnovel
                </Button>
                <Button leftIcon={<FaGamepad />} variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Game
                </Button>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsCreateModalOpen(false)}>
                Đóng
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Create/Edit Form */}
        {showForm && (
          <Box py={4}>
            <EditPostForm
              editingPost={selectedPost}
              onCancel={handleFormCancel}
              onSuccess={handleFormSuccess}
            />
          </Box>
        )}

        {/* Posts List */}
        <Box>
          <Flex
            justify="space-between"
            align="center"
            mb={8}
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
          >
            <Text fontSize="xl" fontWeight="semibold" color={useColorModeValue('gray.800', 'white')}>
              {statusFilter === 'ALL' ? 'All Posts' :
                statusFilter === 'LIVE' ? 'Published Posts' :
                  statusFilter === 'DRAFT' ? 'Draft Posts' : 'Scheduled Posts'} ({posts.length})
            </Text>
            {statusFilter !== 'ALL' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusFilterChange('ALL')}
                colorScheme="blue"
              >
                View All
              </Button>
            )}
          </Flex>

          {isLoading && posts.length === 0 ? (
            <VStack spacing={6} py={16}>
              <Spinner size="lg" color="blue.500" />
              <Text color="gray.500" fontSize="md">đang tải bài viết...</Text>
            </VStack>
          ) : posts.length === 0 ? (
            <VStack spacing={6} py={20} textAlign="center">
              <Text fontSize="xl" color="gray.500" fontWeight="medium">chưa có bài viết nào</Text>
              <Text fontSize="md" color="gray.400" maxW="md">
                {statusFilter === 'ALL'
                  ? 'hãy tạo bài viết đầu tiên của bạn'
                  : `không có bài viết nào với trạng thái "${statusFilter.toLowerCase()}"`
                }
              </Text>
              {statusFilter === 'ALL' && (
                <Button
                  leftIcon={<MdAdd />}
                  onClick={() => setIsCreateModalOpen(true)}
                  colorScheme="blue"
                  variant="ghost"
                  size="lg"
                  mt={4}
                >
                  tạo bài viết mới
                </Button>
              )}
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {posts.map((post) => (
                <AdminPostCard
                  key={post.id}
                  post={post}
                  onEdit={handleEdit}
                  onEditInPage={handleEditInPage}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                  isLoading={isLoading || isLoadingMore}
                />
              ))}

              {/* Load More Section */}
              {hasMore && (
                <VStack spacing={6} py={12}>
                  {/* Manual Load More Button */}
                  <Button
                    onClick={() => loadPosts(false)}
                    isLoading={isLoadingMore}
                    loadingText="đang tải..."
                    variant="ghost"
                    colorScheme="blue"
                    size="lg"
                    disabled={!nextPageToken}
                    w={{ base: '100%', md: 'auto' }}
                  >
                    tải thêm bài viết
                  </Button>

                  {/* Infinite scroll trigger (hidden) */}
                  <Box ref={loadMoreRef} h="1px" opacity={0}>
                    {/* Hidden trigger for intersection observer */}
                  </Box>

                  {isLoadingMore && (
                    <VStack spacing={3}>
                      <Spinner size="md" color="blue.500" />
                      <Text fontSize="sm" color="gray.500">
                        đang tải thêm...
                      </Text>
                    </VStack>
                  )}
                </VStack>
              )}

              {/* End of list indicator */}
              {!hasMore && posts.length > 0 && (
                <Box py={8}>
                  <Text fontSize="md" color="gray.400" textAlign="center" fontWeight="medium">
                    🎉 đã hiển thị tất cả bài viết ({posts.length})
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default PostsList;
