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
  Flex
} from '@chakra-ui/react';
import { MdAdd, MdSave, MdPublish, MdDrafts, MdEdit, MdDelete, MdRefresh } from 'react-icons/md';
import { useAuthContext } from '../../../contexts/AuthContext';
import { bloggerAdminService, BloggerPost, CreatePostRequest } from '../../../services/bloggerAdminService';
import { authService } from '../../../services/authService';
import RichTextEditor from './RichTextEditor';
import AdminPostCard from './AdminPostCard';
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import EditPostForm from './EditPostForm';

interface PostFormData {
  title: string;
  content: string;
  labels: string[];
  status: 'DRAFT' | 'LIVE' | 'SCHEDULED';
}

interface AdminPageProps {
  skipAuthCheck?: boolean; // Allow skipping auth check when embedded
}

const AdminPage: React.FC<AdminPageProps> = ({ skipAuthCheck = false }) => {
  const { isAuthenticated, user } = useAuthContext();
  const { requireAdmin } = useAuthGuard();
  const navigate = useNavigate();
  const toast = useToast();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [posts, setPosts] = useState<BloggerPost[]>([]);
  const [allPosts, setAllPosts] = useState<BloggerPost[]>([]); // Store all posts
  const [editingPost, setEditingPost] = useState<BloggerPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'DRAFT' | 'SCHEDULED'>('ALL');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);


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
      console.log('[AdminPage] Debouncing loadPosts call...');
      return;
    }
    lastLoadTimeRef.current = now;

    // Prevent multiple simultaneous calls
    if (reset && isLoading) {
      console.log('[AdminPage] Already loading, skipping...');
      return;
    }
    if (!reset && isLoadingMore) {
      console.log('[AdminPage] Already loading more, skipping...');
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

      console.log('[AdminPage] Loading posts...', reset ? 'initial' : 'more');

      // Try the new method first for better draft support
      let loadedPosts: BloggerPost[] = [];
      let apiResponse: any = null;

      try {
        if (reset) {
          // For initial load, use the combined method to get all posts including drafts
          loadedPosts = await bloggerAdminService.getAllPostsIncludingDrafts(50);
          // For combined method, disable pagination since we get all posts
          apiResponse = { nextPageToken: null };
        } else {
          // For pagination, use the original method
          apiResponse = await bloggerAdminService.getAllPosts(20, nextPageToken || undefined);
          loadedPosts = apiResponse.items || [];
        }
      } catch (error: any) {
        console.warn('[AdminPage] Combined method failed, falling back to original:', error);
        // Fallback to original method
        apiResponse = await bloggerAdminService.getAllPosts(20, reset ? undefined : (nextPageToken || undefined));
        loadedPosts = apiResponse.items || [];
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (reset) {
        setAllPosts(loadedPosts);
        filterPosts(loadedPosts, statusFilter);
      } else {
        const updatedAllPosts = [...allPosts, ...loadedPosts];
        setAllPosts(updatedAllPosts);
        filterPosts(updatedAllPosts, statusFilter);
      }

      // Update pagination state
      setNextPageToken(apiResponse?.nextPageToken || null);
      setHasMore(!!apiResponse?.nextPageToken && loadedPosts.length > 0);

      console.log('[AdminPage] Posts loaded successfully:', {
        newPosts: loadedPosts.length,
        totalPosts: reset ? loadedPosts.length : allPosts.length + loadedPosts.length,
        hasMore: !!apiResponse?.nextPageToken,
        method: reset ? 'getAllPostsIncludingDrafts' : 'getAllPosts'
      });
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
  }, [allPosts, statusFilter, nextPageToken, toast, isLoading, isLoadingMore]);

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

  // Check auth and load posts on mount
  useEffect(() => {
    // Skip auth check if explicitly told to (e.g., when embedded in Settings)
    if (!skipAuthCheck && !requireAdmin()) {
      // Auth notification will be shown by requireAdmin()
      return;
    }

    if (isAuthenticated) {
      loadPosts(true);
    }
  }, [isAuthenticated, skipAuthCheck]); // Remove requireAdmin from dependencies

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      console.log('[AdminPage] Auth state changed:', event.detail);
      if (event.detail.isAuthenticated) {
        // Force reload posts when auth state changes
        setTimeout(() => {
          loadPosts(true);
        }, 200);
      }
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  // Filter posts by status
  const filterPosts = (postsToFilter: BloggerPost[], filter: string) => {
    console.log('[AdminPage] Filtering posts:', {
      totalPosts: postsToFilter.length,
      filter,
      postStatuses: postsToFilter.map(p => ({ title: p.title, status: p.status }))
    });

    let filtered = postsToFilter;

    switch (filter) {
      case 'LIVE':
        filtered = postsToFilter.filter(post => post.status === 'LIVE');
        break;
      case 'DRAFT':
        filtered = postsToFilter.filter(post => post.status === 'DRAFT');
        break;
      case 'SCHEDULED':
        filtered = postsToFilter.filter(post => post.status === 'SCHEDULED');
        break;
      case 'ALL':
      default:
        filtered = postsToFilter;
        break;
    }

    console.log('[AdminPage] Filtered result:', {
      filter,
      filteredCount: filtered.length,
      filteredPosts: filtered.map(p => ({ title: p.title, status: p.status }))
    });

    setPosts(filtered);
  };

  // Handle status filter change
  const handleStatusFilterChange = (newFilter: 'ALL' | 'LIVE' | 'DRAFT' | 'SCHEDULED') => {
    setStatusFilter(newFilter);
    filterPosts(allPosts, newFilter);
  };

  // Get post counts by status
  const getPostCounts = () => {
    const live = allPosts.filter(post => post.status === 'LIVE').length;
    const draft = allPosts.filter(post => post.status === 'DRAFT').length;
    const scheduled = allPosts.filter(post => post.status === 'SCHEDULED').length;
    const total = allPosts.length;

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
    if (!skipAuthCheck && !requireAdmin()) return;

    try {
      setIsLoading(true);

      console.log('[AdminPage] Creating new draft post...');

      // Approach 1: Try to create draft directly
      let draftPost;
      try {
        draftPost = await bloggerAdminService.createDraftPost({
          title: 'Bài viết mới',
          content: '<p>Nội dung bài viết...</p>',
          labels: []
        });

        console.log('[AdminPage] Draft post created with status:', draftPost.status);

        // If still published, try to revert
        if (draftPost.status === 'LIVE' && draftPost.id) {
          console.log('[AdminPage] Post was published, attempting to revert to draft...');
          try {
            // Update the post to draft status
            await bloggerAdminService.updatePost({
              id: draftPost.id,
              title: draftPost.title,
              content: draftPost.content,
              labels: draftPost.labels || [],
              status: 'DRAFT'
            });
            console.log('[AdminPage] Post status updated to DRAFT');
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

      console.log('[AdminPage] Final post created with ID:', draftPost.id, 'Status:', draftPost.status);

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

      if (editingPost) {
        // Update existing post
        await bloggerAdminService.updatePost({
          id: editingPost.id!,
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
    setEditingPost(null);
    setShowForm(false);
  };

  const handleEdit = (post: BloggerPost) => {
    setEditingPost(post);
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
    setEditingPost(null);
    setShowForm(false);
  };

  const handleFormSuccess = async () => {
    setEditingPost(null);
    setShowForm(false);
    await loadPosts(true);
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
            width={{ base: '100%', md: '250px' }}
            size="md"
            variant="outline"
          >
            <option value="ALL" defaultChecked>tất cả ({getPostCounts().total})</option>
            <option value="LIVE">đã công bố ({getPostCounts().live})</option>
            <option value="DRAFT">bài nháp ({getPostCounts().draft})</option>
            <option value="SCHEDULED">đã lên lịch ({getPostCounts().scheduled})</option>
          </Select>

          <Button
            variant="ghost"
            leftIcon={<MdAdd />}
            onClick={createNewPost}
            isLoading={isLoading}
            loadingText="đang tạo..."
            size="md"
            w={{ base: '100%', md: 'auto' }}
            colorScheme="blue"
          >
            tạo bài viết mới
          </Button>
        </Flex>

        {/* Status Filter */}


        {/* Create/Edit Form */}
        {showForm && (
          <Box py={4}>
            <EditPostForm
              editingPost={editingPost}
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
              {statusFilter === 'ALL' ? 'tất cả bài viết' :
                statusFilter === 'LIVE' ? 'bài đã công bố' :
                  statusFilter === 'DRAFT' ? 'bài nháp' : 'bài đã lên lịch'} ({posts.length})
            </Text>
            {statusFilter !== 'ALL' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusFilterChange('ALL')}
                colorScheme="blue"
              >
                xem tất cả
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
                  onClick={createNewPost}
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

export default AdminPage;
