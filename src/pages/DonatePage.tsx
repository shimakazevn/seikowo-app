import React from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Button,
  HStack,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Divider
} from '@chakra-ui/react';
import { FaHeart, FaPaypal, FaCreditCard } from 'react-icons/fa';

const DonatePage: React.FC = () => {
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={3}>
          <Icon as={FaHeart} boxSize={8} color="#ff6b6b" />
          <Heading size="lg" color="#ffffff">
            Donate
          </Heading>
        </HStack>

        <Text color="#cccccc" fontSize="lg" textAlign="center">
          Support our project and help us continue developing amazing features
        </Text>

        <Divider borderColor="#333333" />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Icon as={FaPaypal} boxSize={12} color="#0070ba" />
                <Badge colorScheme="blue" variant="solid">
                  PayPal
                </Badge>
                <Text textAlign="center">
                  Secure payment via PayPal
                </Text>
                <Button
                  variant="solid"
                  leftIcon={<FaPaypal />}
                >
                  Donate via PayPal
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Icon as={FaCreditCard} boxSize={12} color="#00d4ff" />
                <Badge colorScheme="cyan" variant="solid">
                  Credit Card
                </Badge>
                <Text textAlign="center">
                  Direct payment with credit card
                </Text>
                <Button
                  variant="outline"
                  leftIcon={<FaCreditCard />}
                >
                  Donate via Card
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card p={6}>
          <VStack spacing={4}>
            <Heading size="md" color="#ffffff">
              Why Donate?
            </Heading>
            <VStack spacing={2} align="stretch">
              <Text color="#cccccc">
                • Help us maintain and improve the platform
              </Text>
              <Text color="#cccccc">
                • Support new feature development
              </Text>
              <Text color="#cccccc">
                • Keep the service free for everyone
              </Text>
              <Text color="#cccccc">
                • Show appreciation for our work
              </Text>
            </VStack>
          </VStack>
        </Card>

        <Text color="#888888" fontSize="sm" textAlign="center">
          All donations are voluntary and greatly appreciated. Thank you for your support! ❤️
        </Text>
      </VStack>
    </Container>
  );
};

export default DonatePage;
