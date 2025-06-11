import React from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  HStack,
  Icon,
  Card,
  CardBody,
  Badge,
  Divider
} from '@chakra-ui/react';
import { BellIcon, CheckIcon } from '@chakra-ui/icons';

const UpdatesPage: React.FC = () => {
  const updates = [
    {
      version: 'v2.1.0',
      date: '2024-01-15',
      title: 'New Sidebar Navigation',
      description: 'Added beautiful sidebar navigation with improved UX',
      type: 'feature'
    },
    {
      version: 'v2.0.5',
      date: '2024-01-10',
      title: 'Performance Improvements',
      description: 'Optimized loading times and reduced bundle size',
      type: 'improvement'
    },
    {
      version: 'v2.0.4',
      date: '2024-01-05',
      title: 'Bug Fixes',
      description: 'Fixed various issues with authentication and navigation',
      type: 'bugfix'
    },
    {
      version: 'v2.0.3',
      date: '2024-01-01',
      title: 'Cobalt Theme',
      description: 'Implemented beautiful Cobalt.tools inspired theme',
      type: 'feature'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'green';
      case 'improvement': return 'blue';
      case 'bugfix': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack spacing={3}>
          <Icon as={BellIcon} boxSize={8} color="#00d4ff" />
          <Heading size="lg" color="#ffffff">
            Updates
          </Heading>
        </HStack>

        <Text color="#cccccc" fontSize="lg">
          Stay up to date with the latest features and improvements
        </Text>

        <Divider borderColor="#333333" />

        <VStack spacing={4} align="stretch">
          {updates.map((update, index) => (
            <Card key={index}>
              <CardBody>
                <HStack justify="space-between" align="start" mb={3}>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Badge colorScheme={getTypeColor(update.type)} variant="solid">
                        {update.version}
                      </Badge>
                      <Badge variant="outline" colorScheme="gray">
                        {update.type}
                      </Badge>
                    </HStack>
                    <Text color="#888888" fontSize="sm">
                      {update.date}
                    </Text>
                  </VStack>
                  <Icon as={CheckIcon} color="#00d4ff" />
                </HStack>
                
                <VStack align="start" spacing={2}>
                  <Heading size="sm" color="#ffffff">
                    {update.title}
                  </Heading>
                  <Text color="#cccccc">
                    {update.description}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>

        <Card p={6}>
          <VStack spacing={4}>
            <Heading size="md" color="#ffffff">
              Coming Soon
            </Heading>
            <VStack spacing={2} align="stretch">
              <Text color="#cccccc">
                • Enhanced manga reader with better performance
              </Text>
              <Text color="#cccccc">
                • Advanced search filters and sorting options
              </Text>
              <Text color="#cccccc">
                • User profiles and social features
              </Text>
              <Text color="#cccccc">
                • Mobile app for iOS and Android
              </Text>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </Container>
  );
};

export default UpdatesPage;
