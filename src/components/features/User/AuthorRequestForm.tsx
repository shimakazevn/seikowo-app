import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { MdSend } from 'react-icons/md';

interface AuthorRequestFormProps {
  cardBg: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  isDark: boolean;
  userEmail?: string;
  userName?: string;
}

const AuthorRequestForm: React.FC<AuthorRequestFormProps> = ({
  cardBg,
  textColor,
  mutedColor,
  accentColor,
  isDark,
  userEmail,
  userName,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    reason: '',
    portfolio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Option 1: Send via mailto link (existing method)
      const emailContent = `
        Xin chào Admin,
        
        Tôi ${formData.name} (${formData.email}) muốn xin quyền Author trên blog.
        
        Lý do: ${formData.reason}
        
        Portfolio/Website: ${formData.portfolio}
        
        Trân trọng,
        ${formData.name}
      `;
      const mailtoLink = `mailto:Shimakazevn@gmail.com?subject=Yêu cầu quyền Author&body=${encodeURIComponent(emailContent)}`;
      window.location.href = mailtoLink;

      // Option 2: Send via a backend API (recommended for production)
      // You'll need to set up a backend endpoint (e.g., /api/send-author-request)
      // that handles sending the email using a service like Nodemailer, SendGrid, etc.
      // const response = await fetch('/api/send-author-request', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     to: 'Shimakazevn@gmail.com',
      //     subject: 'Yêu cầu quyền Author',
      //     fromName: formData.name,
      //     fromEmail: formData.email,
      //     reason: formData.reason,
      //     portfolio: formData.portfolio,
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to send email via API');
      // }

      toast({
        title: 'Gửi yêu cầu thành công',
        description: 'Vui lòng kiểm tra email của bạn để hoàn tất quá trình gửi yêu cầu.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({ // Clear form after successful submission
        name: userName || '',
        email: userEmail || '',
        reason: '',
        portfolio: '',
      });

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Alert status="info" variant="subtle" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Xin quyền Author</AlertTitle>
            <AlertDescription>
              Để trở thành Author, bạn cần điền form này và gửi yêu cầu cho Admin. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
            </AlertDescription>
          </Box>
        </Alert>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color={textColor}>Họ và tên</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập họ và tên của bạn"
                bg={isDark ? 'gray.700' : 'white'}
                color={textColor}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={textColor}>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Nhập email của bạn"
                bg={isDark ? 'gray.700' : 'white'}
                color={textColor}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={textColor}>Lý do muốn trở thành Author</FormLabel>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Hãy cho chúng tôi biết tại sao bạn muốn trở thành Author"
                rows={4}
                bg={isDark ? 'gray.700' : 'white'}
                color={textColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={textColor}>Portfolio/Website (nếu có)</FormLabel>
              <Input
                value={formData.portfolio}
                onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                placeholder="Nhập link portfolio hoặc website của bạn"
                bg={isDark ? 'gray.700' : 'white'}
                color={textColor}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              leftIcon={<MdSend />}
              isLoading={isSubmitting}
              loadingText="Đang gửi..."
              size="lg"
              mt={4}
            >
              Gửi yêu cầu
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default AuthorRequestForm; 