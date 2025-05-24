import React, { useState } from 'react';
import {
  Container,
  Box,
  Input,
  Textarea,
  Button,
  VStack,
  Grid,
  GridItem,
  useColorModeValue,
  Heading,
  Text,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="2xl" mb={8}>
        Contact Us
      </Heading>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
        <GridItem>
          <Box
            p={8}
            bg={bgColor}
            borderRadius="lg"
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Heading as="h2" size="xl" mb={6}>
              Get in Touch
            </Heading>
            <Text mb={6}>
              Have questions or feedback? We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
            </Text>
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading as="h3" size="md" mb={4}>
                  Contact Information
                </Heading>
                <Text>Email: contact@example.com</Text>
                <Text>Phone: +1 (555) 123-4567</Text>
                <Text>Address: 123 Blog Street, City, Country</Text>
              </Box>
            </VStack>
          </Box>
        </GridItem>
        <GridItem>
          <Box
            p={8}
            bg={bgColor}
            borderRadius="lg"
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Subject</FormLabel>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Subject"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message"
                    rows={4}
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  mt={4}
                >
                  Send Message
                </Button>
              </VStack>
            </form>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default ContactPage; 