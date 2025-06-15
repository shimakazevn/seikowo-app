import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  useColorModeValue,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { MdEdit, MdDelete, MdPublish, MdVisibility, MdSchedule, MdOpenInNew, MdMoreVert } from 'react-icons/md';
import { BloggerPost } from '../../../services/bloggerAdminService';
import {
  extractTextFromHtml
} from '../../../utils/postUtils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AdminPostCardProps {
  post: BloggerPost;
  onEdit: (post: BloggerPost) => void;
  onEditInPage?: (postId: string) => void;
  onDelete: (postId: string) => void;
  onPublish: (postId: string) => void;
  isLoading?: boolean;
}

const AdminPostCard: React.FC<AdminPostCardProps> = ({
  post,
  onEdit,
  onEditInPage,
  onDelete,
  onPublish,
  isLoading
}) => {
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  const textPreview = post.content ? extractTextFromHtml(post.content) : '';

  const getStatusColor = (status: string = 'DRAFT') => {
    switch (status) {
      case 'LIVE':
        return 'green';
      case 'DRAFT':
        return 'yellow';
      case 'SCHEDULED':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string = 'DRAFT') => {
    switch (status) {
      case 'LIVE':
        return 'đã xuất bản';
      case 'DRAFT':
        return 'bản nháp';
      case 'SCHEDULED':
        return 'đã lên lịch';
      default:
        return status.toLowerCase();
    }
  };

  const getStatusIcon = (status: string = 'DRAFT') => {
    switch (status) {
      case 'LIVE':
        return MdVisibility;
      case 'DRAFT':
        return MdEdit;
      case 'SCHEDULED':
        return MdSchedule;
      default:
        return MdEdit;
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: vi });
    } catch (error) {
      return date;
    }
  };

  return (
    <>
      <Box
        py={6}
        px={2}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.100', 'gray.700')}
        _last={{
          borderBottom: 'none'
        }}
      >
        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* Left side - Content */}
          <VStack align="stretch" spacing={4} flex={1}>
            {/* Header */}
            <Flex
              justify="space-between"
              w="100%"
              align={{ base: 'start', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={3}
            >
              <Text
                fontWeight="bold"
                fontSize={{ base: 'md', md: 'lg' }}
                noOfLines={2}
                flex={1}
                lineHeight="1.3"
              >
                {post.title}
              </Text>
              <Badge
                colorScheme={getStatusColor(post.status)}
                variant="subtle"
                display="flex"
                alignItems="center"
                gap={1}
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                flexShrink={0}
              >
                <Box as={getStatusIcon(post.status)} size="12px" />
                {getStatusText(post.status)}
              </Badge>
            </Flex>

            {/* Text Preview */}
            {textPreview && (
              <Text
                fontSize="sm"
                color={textColor}
                noOfLines={{ base: 2, md: 3 }}
                lineHeight="1.4"
              >
                {textPreview}
              </Text>
            )}

            {/* Tags */}
            {post.labels && post.labels.length > 0 && (
              <Wrap spacing={2}>
                {post.labels.slice(0, 4).map((label, index) => (
                  <WrapItem key={index}>
                    <Tag size="sm" variant="outline" borderRadius="md" fontSize="xs">
                      <TagLabel>{label}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
                {post.labels.length > 4 && (
                  <WrapItem>
                    <Tag size="sm" variant="outline" borderRadius="md" fontSize="xs" color="gray.500">
                      <TagLabel>+{post.labels.length - 4}</TagLabel>
                    </Tag>
                  </WrapItem>
                )}
              </Wrap>
            )}

            {/* Dates */}
            <HStack spacing={4} fontSize="xs" color={textColor} flexWrap="wrap">
              <Text>ngày tạo: {formatDate(post.published || '')}</Text>
              {post.updated && (
                <Text>• cập nhật: {formatDate(post.updated)}</Text>
              )}
            </HStack>
          </VStack>

          {/* Right side - Actions */}
          <Flex
            align={{ base: 'center', md: 'start' }}
            justify={{ base: 'center', md: 'flex-end' }}
            w={{ base: '100%', md: 'auto' }}
          >
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<MdMoreVert />}
                variant="ghost"
                size="sm"
                aria-label="more options"
              />
              <MenuList>
                <MenuItem
                  icon={<MdEdit />}
                  onClick={() => onEdit(post)}
                  isDisabled={isLoading}
                >
                  chỉnh sửa
                </MenuItem>
                {onEditInPage && (
                  <MenuItem
                    icon={<MdOpenInNew />}
                    onClick={() => onEditInPage(post.id!)}
                    isDisabled={isLoading}
                  >
                    chỉnh sửa trong trang
                  </MenuItem>
                )}
                {post.status === 'DRAFT' && (
                  <MenuItem
                    icon={<MdPublish />}
                    onClick={() => onPublish(post.id!)}
                    isDisabled={isLoading}
                  >
                    xuất bản
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem
                  icon={<MdDelete />}
                  color="red.500"
                  onClick={onDeleteOpen}
                  isDisabled={isLoading}
                >
                  xóa
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>xác nhận xóa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Text>bạn có chắc chắn muốn xóa bài viết này? hành động này không thể hoàn tác.</Text>
            </Alert>
            <Text fontWeight="bold">{post.title}</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              hủy
            </Button>
            <Button
              colorScheme="red"
              onClick={() => {
                onDelete(post.id!);
                onDeleteClose();
              }}
              isLoading={isLoading}
            >
              xóa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminPostCard;
