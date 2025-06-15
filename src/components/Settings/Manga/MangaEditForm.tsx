import React, { useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  HStack,
  Image,
  Text,
  SimpleGrid,
  Divider
} from '@chakra-ui/react';

const MangaEditForm: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // UI only, no logic
  return (
    <Box bg="whiteAlpha.100" p={6} borderRadius="lg" boxShadow="md" maxW="900px" mx="auto">
      {/* Select chế độ đăng */}
      <FormControl mb={6} maxW="300px">
        <FormLabel>Chế độ đăng</FormLabel>
        <Select defaultValue="manga">
          <option value="normal">Bài viết thường</option>
          <option value="manga">Manga dài tập</option>
        </Select>
      </FormControl>

      {/* Tabs */}
      <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Quản lý thông tin</Tab>
          <Tab>Quản lý chương</Tab>
        </TabList>
        <TabPanels>
          {/* Tab 1: Quản lý thông tin */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Tên truyện</FormLabel>
                <Input placeholder="Nhập tên manga..." />
              </FormControl>
              <FormControl>
                <FormLabel>Tác giả</FormLabel>
                <Input placeholder="Nhập tên tác giả..." />
              </FormControl>
              <FormControl>
                <FormLabel>Thể loại</FormLabel>
                <Input placeholder="Nhập thể loại, cách nhau bởi dấu phẩy..." />
              </FormControl>
              <FormControl>
                <FormLabel>Mô tả</FormLabel>
                <Textarea placeholder="Nhập mô tả về manga..." rows={4} />
              </FormControl>
              <FormControl>
                <FormLabel>Ảnh bìa</FormLabel>
                <HStack align="start">
                  <Input type="file" accept="image/*" />
                  {coverPreview && (
                    <Image src={coverPreview} alt="cover preview" boxSize="80px" objectFit="cover" borderRadius="md" />
                  )}
                </HStack>
              </FormControl>
              <FormControl>
                <FormLabel>Trạng thái</FormLabel>
                <Select defaultValue="ongoing">
                  <option value="ongoing">Đang tiến hành</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="hiatus">Tạm ngưng</option>
                </Select>
              </FormControl>
              <Button colorScheme="blue" alignSelf="flex-end">Lưu thông tin</Button>
            </VStack>
          </TabPanel>

          {/* Tab 2: Quản lý chương */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="lg" fontWeight="bold">Danh sách chương</Text>
                <Button colorScheme="blue">Thêm chương mới</Button>
              </HStack>
              <Divider />
              {/* Danh sách chương - chỉ UI mẫu */}
              <SimpleGrid columns={1} spacing={3}>
                {[1,2,3].map((chapter) => (
                  <Box key={chapter} p={4} borderWidth={1} borderRadius="md" bg="whiteAlpha.200">
                    <HStack justify="space-between">
                      <Text>Chương {chapter}: Tên chương mẫu</Text>
                      <HStack>
                        <Button size="sm" colorScheme="teal">Sửa</Button>
                        <Button size="sm" colorScheme="red" variant="outline">Xóa</Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MangaEditForm; 