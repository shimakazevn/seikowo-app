/**
 * 📚 Manga Uploader Component
 * Upload hàng loạt ảnh manga với base64 encoding và drag & drop sorting
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  Progress,
  Badge,
  useColorModeValue,
  Input,
  SimpleGrid,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Tooltip,
  Flex
} from '@chakra-ui/react';
import {
  MdUpload,
  MdDelete,
  MdDragIndicator,
  MdArrowUpward,
  MdArrowDownward,
  MdCode,
  MdPreview
} from 'react-icons/md';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
  DragOverEvent,
  MouseSensor,
  TouchSensor
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MangaImage {
  id: string;
  file: File;
  name: string;
  size: number;
  base64: string;
  thumbnail: string;
  order: number;
}

interface MangaUploaderProps {
  onContentGenerate: (htmlContent: string) => void;
  disabled?: boolean;
}

// Sortable Item Component
interface SortableItemProps {
  image: MangaImage;
  index: number;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  formatFileSize: (bytes: number) => string;
}

const SortableItem: React.FC<SortableItemProps> = ({
  image,
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  formatFileSize
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    touchAction: 'none',
  } as React.CSSProperties;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? 'dragging' : ''}`}
      bg={bgColor}
      border="1px"
      borderColor={isDragging ? 'blue.400' : borderColor}
      borderRadius="lg"
      overflow="hidden"
      p={3}
      shadow={isDragging ? 'lg' : 'sm'}
      _hover={{ borderColor: 'blue.300' }}
    >
      <VStack spacing={3}>
        {/* Drag Handle */}
        <Flex justify="space-between" align="center" w="100%">
          <Badge colorScheme="blue" fontSize="xs">
            #{index + 1}
          </Badge>
          <Box
            {...attributes}
            {...listeners}
            className="drag-handle"
            cursor="grab"
            _active={{ cursor: 'grabbing' }}
            p={2}
            borderRadius="md"
            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
            transition="all 0.2s"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="36px"
            minH="36px"
            sx={{
              '&:active': {
                transform: 'scale(0.95)',
                cursor: 'grabbing'
              }
            }}
          >
            <MdDragIndicator size={18} color="gray" />
          </Box>
        </Flex>

        {/* Thumbnail */}
        <Image
          src={image.thumbnail}
          alt={image.name}
          maxH="120px"
          objectFit="contain"
          borderRadius="md"
          pointerEvents="none"
        />

        {/* Image Info */}
        <VStack spacing={1} w="100%">
          <Text fontSize="xs" fontWeight="bold" noOfLines={2} textAlign="center">
            {image.name}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {formatFileSize(image.size)}
          </Text>
        </VStack>

        {/* Action Buttons */}
        <HStack spacing={1} w="100%">
          <Tooltip label="Move up">
            <IconButton
              aria-label="Move up"
              icon={<MdArrowUpward />}
              size="xs"
              onClick={() => onMoveUp(image.id)}
              isDisabled={isFirst}
              flex={1}
            />
          </Tooltip>
          <Tooltip label="Move down">
            <IconButton
              aria-label="Move down"
              icon={<MdArrowDownward />}
              size="xs"
              onClick={() => onMoveDown(image.id)}
              isDisabled={isLast}
              flex={1}
            />
          </Tooltip>
          <Tooltip label="Remove">
            <IconButton
              aria-label="Remove"
              icon={<MdDelete />}
              size="xs"
              colorScheme="red"
              onClick={() => onRemove(image.id)}
              flex={1}
            />
          </Tooltip>
        </HStack>
      </VStack>
    </Box>
  );
};

const MangaUploader: React.FC<MangaUploaderProps> = ({
  onContentGenerate,
  disabled = false
}) => {
  const [images, setImages] = useState<MangaImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Memoize sensors to prevent re-creation on every render
  const sensors = useMemo(() => useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  ), []);

  /**
   * 🔢 Sort images by natural number order
   */
  const sortImagesByNumber = (imageList: MangaImage[]): MangaImage[] => {
    return [...imageList].sort((a, b) => {
      // Extract numbers from filename
      const getNumber = (filename: string): number => {
        const match = filename.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const numA = getNumber(a.name);
      const numB = getNumber(b.name);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      // If numbers are same, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  /**
   * 📁 Convert file to base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * 🖼️ Create thumbnail
   */
  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.createElement('img') as HTMLImageElement;

        img.onload = () => {
          try {
            // Set thumbnail size
            const maxSize = 150;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Clean up object URL
            URL.revokeObjectURL(img.src);

            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch (error) {
            console.error('Error creating thumbnail:', error);
            URL.revokeObjectURL(img.src);
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error('Error loading image for thumbnail:', error);
          URL.revokeObjectURL(img.src);
          reject(error);
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        console.error('Error setting up thumbnail creation:', error);
        reject(error);
      }
    });
  };

  /**
   * 📤 Handle file selection
   */
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: 'No images found',
        description: 'Please select image files only',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const newImages: MangaImage[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      try {
        // Update progress
        setProcessingProgress(Math.round(((i + 1) / imageFiles.length) * 100));

        // Convert to base64
        const base64 = await fileToBase64(file);

        // Create thumbnail with fallback
        let thumbnail: string;
        try {
          thumbnail = await createThumbnail(file);
        } catch (error) {
          console.warn('Failed to create thumbnail for', file.name, 'using base64 as fallback');
          thumbnail = base64; // Use original base64 as fallback
        }

        const mangaImage: MangaImage = {
          id: `${Date.now()}-${i}`,
          file,
          name: file.name,
          size: file.size,
          base64,
          thumbnail,
          order: i
        };

        newImages.push(mangaImage);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        toast({
          title: 'Processing error',
          description: `Failed to process ${file.name}`,
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    }

    // Sort by number and add to existing images
    const allImages = [...images, ...newImages];
    const sortedImages = sortImagesByNumber(allImages);
    setImages(sortedImages);

    setIsProcessing(false);
    setProcessingProgress(0);

    toast({
      title: 'Images processed',
      description: `Successfully processed ${newImages.length} images`,
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
    }
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 🎯 Handle drag and drop - memoized for performance
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  /**
   * 🔄 Handle drag and drop reordering - memoized for performance
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    // Prevent body scroll during drag
    document.body.classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    // Re-enable body scroll
    document.body.classList.remove('dragging');

    if (!over || active.id === over.id) {
      return;
    }

    try {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          console.warn('Invalid drag operation: item not found');
          return items;
        }

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index
        }));

        return updatedItems;
      });

      toast({
        title: 'Images reordered',
        description: `Moved to position ${images.findIndex(item => item.id === over.id) + 1}`,
        status: 'success',
        duration: 1500,
        isClosable: true
      });
    } catch (error) {
      console.error('Error during drag operation:', error);
      toast({
        title: 'Reorder failed',
        description: 'Failed to reorder images. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [images]);

  /**
   * 🗑️ Remove image - memoized
   */
  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  /**
   * ⬆️⬇️ Move image up/down - memoized
   */
  const moveImage = useCallback((id: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
    
    // Update order
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }));

    setImages(updatedImages);
  }, [images]);

  /**
   * 🔢 Auto sort by number
   */
  const autoSort = () => {
    const sortedImages = sortImagesByNumber(images);
    setImages(sortedImages);
    
    toast({
      title: 'Images sorted',
      description: 'Images sorted by number order',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  /**
   * 📝 Generate manga HTML content
   */
  const generateMangaHTML = () => {
    if (images.length === 0) {
      toast({
        title: 'No images',
        description: 'Please add images first',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const mangaHTML = `
<div class="manga-container">
  <div class="manga-header">
    <h3 class="manga-title">📚 Manga Chapter</h3>
    <div class="manga-info">
      <span class="manga-pages">${images.length} pages</span>
      <span class="manga-date">${new Date().toLocaleDateString('vi-VN')}</span>
    </div>
  </div>
  
  <div class="manga-reader">
    ${images.map((img, index) => `
    <div class="manga-page" data-page="${index + 1}">
      <div class="page-number">Page ${index + 1}</div>
      <img 
        src="${img.base64}" 
        alt="Page ${index + 1} - ${img.name}"
        class="manga-image"
        loading="lazy"
        style="width: 100%; height: auto; display: block; margin: 10px auto;"
      />
      <div class="page-info">${img.name}</div>
    </div>
    `).join('')}
  </div>
  
  <div class="manga-footer">
    <div class="manga-navigation">
      <button class="nav-btn prev-btn">← Previous</button>
      <span class="page-counter">1 / ${images.length}</span>
      <button class="nav-btn next-btn">Next →</button>
    </div>
  </div>
</div>

<style>
.manga-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.manga-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.manga-title {
  color: #2d3748;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.manga-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.manga-reader {
  margin: 20px 0;
}

.manga-page {
  margin-bottom: 20px;
  text-align: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-number {
  font-weight: bold;
  color: #4a5568;
  margin-bottom: 10px;
  font-size: 16px;
}

.manga-image {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.page-info {
  margin-top: 10px;
  font-size: 12px;
  color: #718096;
}

.manga-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #e9ecef;
}

.manga-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.nav-btn {
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.nav-btn:hover {
  background: #3182ce;
}

.page-counter {
  font-weight: bold;
  color: #2d3748;
}

@media (max-width: 768px) {
  .manga-container {
    padding: 10px;
    margin: 10px;
  }
  
  .manga-navigation {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
`.trim();

    onContentGenerate(mangaHTML);
    
    toast({
      title: 'Manga HTML generated',
      description: `Generated HTML for ${images.length} pages`,
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  /**
   * 🎨 Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <VStack spacing={6} align="stretch" className="manga-uploader">
      {/* Upload Area */}
      <Box
        border="2px dashed"
        borderColor={dragOver ? 'blue.400' : borderColor}
        borderRadius="lg"
        p={8}
        textAlign="center"
        bg={dragOver ? 'blue.50' : hoverBg}
        cursor="pointer"
        _hover={{ borderColor: 'blue.400' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        transition="all 0.2s"
      >
        <VStack spacing={4}>
          <MdUpload size={48} color={dragOver ? 'blue' : 'gray'} />
          <Text fontSize="lg" fontWeight="bold">
            📚 {dragOver ? 'Drop manga images here' : 'Upload Manga Images'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {dragOver ? 'Release to upload' : 'Supports: JPG, PNG, WebP • Drag & Drop enabled • Auto-sort by number'}
          </Text>
          <Button
            leftIcon={<MdUpload />}
            colorScheme="blue"
            size="lg"
            isDisabled={disabled || isProcessing}
          >
            Select Images
          </Button>
        </VStack>
      </Box>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        display="none"
      />

      {/* Processing Progress */}
      {isProcessing && (
        <Box>
          <Text fontSize="sm" mb={2}>Processing images... {processingProgress}%</Text>
          <Progress value={processingProgress} colorScheme="blue" />
        </Box>
      )}

      {/* Action Buttons */}
      {images.length > 0 && (
        <HStack spacing={4} justify="center" wrap="wrap">
          <Button
            leftIcon={<MdCode />}
            colorScheme="green"
            onClick={generateMangaHTML}
            isDisabled={disabled}
          >
            Generate Manga HTML
          </Button>
          <Button
            leftIcon={<MdArrowUpward />}
            variant="outline"
            onClick={autoSort}
            isDisabled={disabled}
          >
            Auto Sort by Number
          </Button>
          <Badge colorScheme="blue" fontSize="md" p={2}>
            {images.length} images
          </Badge>
        </HStack>
      )}

      {/* Images Grid with Drag & Drop */}
      {images.length > 0 && (
        <Box>
          <VStack spacing={3} align="stretch" mb={4}>
            <Text fontSize="lg" fontWeight="bold">
              📖 Manga Pages ({images.length})
            </Text>
            <Text fontSize="sm" color="gray.500">
              💡 Drag the <MdDragIndicator style={{ display: 'inline' }} /> handle to reorder pages, or use the arrow buttons
            </Text>
          </VStack>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <SortableContext
              items={images.map(img => img.id)}
              strategy={rectSortingStrategy}
            >
              <SimpleGrid
                columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                spacing={3}
                w="100%"
              >
                {images.map((image, index) => (
                  <SortableItem
                    key={image.id}
                    image={image}
                    index={index}
                    onRemove={removeImage}
                    onMoveUp={(id) => moveImage(id, 'up')}
                    onMoveDown={(id) => moveImage(id, 'down')}
                    isFirst={index === 0}
                    isLast={index === images.length - 1}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </SimpleGrid>
            </SortableContext>

            <DragOverlay
              adjustScale={false}
              dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeId ? (
                <Box
                  className="dnd-overlay"
                  bg={bgColor}
                  border="2px"
                  borderColor="blue.400"
                  borderRadius="lg"
                  overflow="hidden"
                  p={3}
                  shadow="2xl"
                  transform="rotate(3deg) scale(1.02)"
                  opacity={0.98}
                  w="180px"
                  cursor="grabbing"
                  style={{
                    transformOrigin: 'center center',
                    willChange: 'transform',
                  }}
                >
                  {(() => {
                    const activeImage = images.find(img => img.id === activeId);
                    return activeImage ? (
                      <VStack spacing={2}>
                        <Badge colorScheme="blue" fontSize="xs" variant="solid">
                          Moving...
                        </Badge>
                        <Image
                          src={activeImage.thumbnail}
                          alt={activeImage.name}
                          maxH="80px"
                          objectFit="contain"
                          borderRadius="md"
                          pointerEvents="none"
                        />
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1} textAlign="center">
                          {activeImage.name}
                        </Text>
                      </VStack>
                    ) : null;
                  })()}
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      )}

      {/* Help Text */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box flex="1">
          <Text fontSize="sm">
            📚 <strong>Manga Upload Features:</strong>
            <br />
            • Upload multiple images at once (drag & drop or click to select)
            <br />
            • Auto-sort by number in filename
            <br />
            • <strong>Improved drag & drop</strong> to reorder pages (grab the <MdDragIndicator style={{ display: 'inline', verticalAlign: 'middle' }} /> handle)
            <br />
            • Arrow buttons for precise positioning
            <br />
            • Generate base64 embedded HTML for Blogger
            <br />
            • Responsive manga reader layout with thumbnails
          </Text>
        </Box>
      </Alert>
    </VStack>
  );
};

export default MangaUploader;
