import React, { useState } from 'react';
import {
  Box,
  VStack,
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
  HStack,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { MdSave } from 'react-icons/md';
import { bloggerAdminService, BloggerPost, CreatePostRequest } from '../../../services/bloggerAdminService';
import RichTextEditor from './Editor';

interface PostFormData {
  title: string;
  content: string;
  labels: string[];
  status: 'DRAFT' | 'LIVE' | 'SCHEDULED';
}

interface EditPostFormProps {
  editingPost: BloggerPost | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditPostForm: React.FC<EditPostFormProps> = ({ editingPost, onCancel, onSuccess }) => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [isLoading, setIsLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [formData, setFormData] = useState<PostFormData>({
    title: editingPost?.title || '',
    content: editingPost?.content || '',
    labels: editingPost?.labels || [],
    status: editingPost?.status || 'DRAFT'
  });
  
  const [formErrors, setFormErrors] = useState<Partial<PostFormData>>({});

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
          title: 'Cập nhật thành công',
          description: 'Bài viết đã được cập nhật',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new post
        await bloggerAdminService.createPost(postData);
        toast({
          title: 'Tạo bài viết thành công',
          description: 'Bài viết mới đã được tạo',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }

      onSuccess();
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

  return (
    <Box bg={bgColor} p={6} borderRadius="lg" border="1px" borderColor={borderColor}>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        {editingPost ? 'Chỉnh Sửa Bài Viết' : 'Tạo Bài Viết Mới'}
      </Text>
      
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
            minHeight="400px"
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
            <Button onClick={addLabel} size="sm">Thêm</Button>
          </HStack>
          <Wrap mt={2}>
            {formData.labels.map((label, index) => (
              <WrapItem key={index}>
                <Tag size="md" colorScheme="blue">
                  <TagLabel>{label}</TagLabel>
                  <TagCloseButton onClick={() => removeLabel(label)} />
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </FormControl>

        {/* Status */}
        <FormControl>
          <FormLabel>Trạng thái</FormLabel>
          <Select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'DRAFT' | 'LIVE' | 'SCHEDULED' }))}
          >
            <option value="DRAFT">Bản nháp</option>
            <option value="LIVE">Xuất bản</option>
            <option value="SCHEDULED">Đã lên lịch</option>
          </Select>
        </FormControl>

        {/* Form Actions */}
        <HStack spacing={4}>
          <Button
            leftIcon={<MdSave />}
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {editingPost ? 'Cập Nhật' : 'Lưu Bài Viết'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default EditPostForm; 