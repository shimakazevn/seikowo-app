import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Spinner,
  Center,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react';
import { MdSave, MdPublish, MdArrowBack, MdDrafts } from 'react-icons/md';
import { useAuthContext } from '../contexts/AuthContext';
import { bloggerAdminService, BloggerPost, UpdatePostRequest } from '../services/bloggerAdminService';
import RichTextEditor from '../components/Settings/Admin/RichTextEditor';

interface PostFormData {
  title: string;
  content: string;
  labels: string[];
  status: 'DRAFT' | 'LIVE';
}

const PostEditPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const toast = useToast();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [post, setPost] = useState<BloggerPost | null>(null);
  const [newLabel, setNewLabel] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    labels: [],
    status: 'DRAFT'
  });
  
  const [formErrors, setFormErrors] = useState<Partial<PostFormData>>({});

  // Load post data
  useEffect(() => {
    if (isAuthenticated && postId) {
      loadPost();
    }
  }, [isAuthenticated, postId]);

  const loadPost = async () => {
    if (!postId) return;

    try {
      setIsLoading(true);
      console.log('[PostEdit] Loading post:', postId);

      const postData = await bloggerAdminService.getPost(postId);
      setPost(postData);

      // Populate form
      setFormData({
        title: postData.title || '',
        content: postData.content || '',
        labels: postData.labels || [],
        status: postData.status || 'DRAFT'
      });

      console.log('[PostEdit] Post loaded successfully:', {
        title: postData.title,
        status: postData.status,
        id: postData.id
      });

      toast({
        title: 'Tải bài viết thành công',
        description: `Trạng thái: ${postData.status === 'DRAFT' ? 'Bản nháp' : 'Đã xuất bản'}`,
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error: any) {
      console.error('[PostEdit] Error loading post:', error);

      // More specific error handling
      let errorMessage = 'Không thể tải bài viết';
      if (error.message?.includes('Not Found')) {
        errorMessage = `Bài viết với ID ${postId} không tồn tại hoặc bạn không có quyền truy cập`;
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = 'Bạn không có quyền truy cập bài viết này';
      }

      toast({
        title: 'Lỗi tải bài viết',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true
      });

      // Redirect back to admin after a delay if post not found
      if (error.message?.includes('Not Found')) {
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
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

  const handleSave = async (newStatus?: 'DRAFT' | 'LIVE') => {
    if (!validateForm() || !postId) return;

    try {
      setIsSaving(true);
      
      const updateData: UpdatePostRequest = {
        id: postId,
        title: formData.title,
        content: formData.content,
        labels: formData.labels,
        status: newStatus || formData.status
      };

      await bloggerAdminService.updatePost(updateData);
      
      // Update local state
      setFormData(prev => ({ ...prev, status: newStatus || prev.status }));
      
      toast({
        title: newStatus === 'LIVE' ? 'Xuất bản thành công' : 'Lưu thành công',
        description: newStatus === 'LIVE' ? 'Bài viết đã được xuất bản' : 'Bài viết đã được lưu',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
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
      setIsSaving(false);
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

  if (!isAuthenticated) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Yêu cầu đăng nhập!</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để chỉnh sửa bài viết.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Center h="50vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Đang tải bài viết...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Không tìm thấy bài viết!</AlertTitle>
          <AlertDescription>
            Bài viết với ID {postId} không tồn tại hoặc bạn không có quyền truy cập.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Breadcrumb mb={4}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/admin')}>
                Quản trị
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Chỉnh sửa bài viết</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <HStack justify="space-between" align="start">
            <Box>
              <Text fontSize="2xl" fontWeight="bold" mb={2}>
                Chỉnh Sửa Bài Viết
              </Text>
              <Text color="gray.500" fontSize="sm">
                ID: {postId} • Trạng thái: {formData.status === 'LIVE' ? 'Đã xuất bản' : 'Bản nháp'}
              </Text>
            </Box>
            
            <Button
              leftIcon={<MdArrowBack />}
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Quay lại
            </Button>
          </HStack>
        </Box>

        {/* Action Buttons */}
        <HStack spacing={4} wrap="wrap">
          <Button
            leftIcon={<MdSave />}
            colorScheme="blue"
            onClick={() => handleSave()}
            isLoading={isSaving}
            loadingText="Đang lưu..."
          >
            Lưu Nháp
          </Button>
          
          {formData.status === 'DRAFT' && (
            <Button
              leftIcon={<MdPublish />}
              colorScheme="green"
              onClick={() => handleSave('LIVE')}
              isLoading={isSaving}
              loadingText="Đang xuất bản..."
            >
              Xuất Bản
            </Button>
          )}
          
          {formData.status === 'LIVE' && (
            <Button
              leftIcon={<MdDrafts />}
              colorScheme="orange"
              onClick={() => handleSave('DRAFT')}
              isLoading={isSaving}
              loadingText="Đang chuyển..."
            >
              Chuyển về Nháp
            </Button>
          )}
        </HStack>

        {/* Edit Form */}
        <Box bg={bgColor} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            {/* Title */}
            <FormControl isInvalid={!!formErrors.title}>
              <FormLabel>Tiêu đề</FormLabel>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề bài viết..."
              />
              <FormErrorMessage>{formErrors.title}</FormErrorMessage>
            </FormControl>

            {/* Content */}
            <FormControl isInvalid={!!formErrors.content}>
              <FormLabel>Nội dung</FormLabel>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Nhập nội dung bài viết (hỗ trợ HTML)..."
                minHeight="500px"
              />
              <FormErrorMessage>{formErrors.content}</FormErrorMessage>
            </FormControl>

            {/* Labels */}
            <FormControl>
              <FormLabel>Thẻ (Tags)</FormLabel>
              <HStack>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Thêm thẻ..."
                  onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                />
                <Button onClick={addLabel} colorScheme="blue" variant="outline">
                  Thêm
                </Button>
              </HStack>
              
              {formData.labels.length > 0 && (
                <Wrap mt={2}>
                  {formData.labels.map((label) => (
                    <WrapItem key={label}>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        <TagLabel>{label}</TagLabel>
                        <TagCloseButton onClick={() => removeLabel(label)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </FormControl>

            {/* Status */}
            <FormControl>
              <FormLabel>Trạng thái</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'LIVE' }))}
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="LIVE">Xuất bản</option>
              </Select>
            </FormControl>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default PostEditPage;
