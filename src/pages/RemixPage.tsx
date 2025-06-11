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
  Image
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const RemixPage: React.FC = () => {
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={3}>
          <Icon as={RepeatIcon} boxSize={8} color="#00d4ff" />
          <Heading size="lg" color="#ffffff">
            Remix
          </Heading>
        </HStack>

        <Text color="#cccccc" fontSize="lg">
          Create remixes and variations of your content
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Badge colorScheme="orange" variant="solid">
                  Style Transfer
                </Badge>
                <Text textAlign="center">
                  Apply different artistic styles
                </Text>
                <Button
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                >
                  Start Remix
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Badge colorScheme="pink" variant="solid">
                  Color Palette
                </Badge>
                <Text textAlign="center">
                  Change color schemes
                </Text>
                <Button
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                >
                  Remix Colors
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Badge colorScheme="cyan" variant="solid">
                  Layout
                </Badge>
                <Text textAlign="center">
                  Rearrange and restructure
                </Text>
                <Button
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                >
                  Remix Layout
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Badge colorScheme="teal" variant="solid">
                  Effects
                </Badge>
                <Text color="#ffffff" textAlign="center">
                  Add visual effects
                </Text>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<RepeatIcon />}
                  _hover={{ bg: '#00d4ff20' }}
                >
                  Add Effects
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default RemixPage;
