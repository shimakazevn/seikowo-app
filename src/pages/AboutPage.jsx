import React from 'react';
import {
  Container,
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Link,
} from '@chakra-ui/react';

const AboutPage = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="2xl" mb={8}>
        Giới thiệu về Seikowo Team
      </Heading>

      <Box
        p={8}
        bg={bgColor}
        borderRadius="lg"
        boxShadow="md"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h2" size="xl" mb={4}>
              Chúng tôi là ai?
            </Heading>
            <Text fontSize="lg">
              <strong>Seikowo Team</strong> là một nhóm dịch thuật hoạt động độc lập, chuyên dịch các bộ truyện tranh và nội dung liên quan đến anime. Với phương châm <em>"Dịch vì đam mê, vui chơi là chính"</em>, chúng tôi mong muốn mang lại trải nghiệm đọc dễ tiếp cận, chất lượng cho cộng đồng yêu thích manga & anime.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="xl" mb={4}>
              Hành trình của chúng tôi
            </Heading>
            <Text fontSize="lg">
              Seikowo Team bắt đầu từ năm 2024 như một nhóm nhỏ những người có cùng sở thích và niềm đam mê với truyện tranh Nhật Bản. Trải qua thời gian, nhóm đã phát triển thành một cộng đồng gắn bó, chia sẻ những bản dịch chất lượng cao và cập nhật thường xuyên trên nền tảng blogspot và mạng xã hội.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="xl" mb={4}>
              Chúng tôi làm gì?
            </Heading>
            <Text fontSize="lg">
              Chúng tôi tập trung vào việc dịch và chia sẻ các bộ truyện mới, đa dạng thể loại – từ hành động, hài hước đến tình cảm học đường. Mục tiêu của Seikowo Team là đem lại cho độc giả Việt những bản dịch mượt mà, sát nghĩa và dễ hiểu nhất.
            </Text>
          </Box>

          <Box>
            <Heading as="h2" size="xl" mb={4}>
              Liên hệ với chúng tôi
            </Heading>
            <Text fontSize="lg">
              Bạn có thể theo dõi và ủng hộ chúng tôi tại:
              <br />
              🌐 Blogspot:{' '}
              <Link href="https://seikowoteam.blogspot.com/" color="teal.400" isExternal>
                seikowoteam.blogspot.com
              </Link>
              <br />
              📘 Facebook:{' '}
              <Link href="https://facebook.com/Seikowo.team" color="teal.400" isExternal>
                Seikowo.team
              </Link>
            </Text>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default AboutPage;
